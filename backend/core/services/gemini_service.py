import os
import json
import logging
import warnings
from django.conf import settings
from PIL import Image

warnings.filterwarnings('ignore', category=FutureWarning)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Groq client (PRIMARY for text -- ultra-fast inference)
# ---------------------------------------------------------------------------
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

# Models verified against this Groq account via GET /openai/v1/models
# Text models (ordered: best quality -> fastest fallback)
GROQ_TEXT_MODELS = [
    'openai/gpt-oss-120b',   # High-quality, fast on Groq hardware
    'openai/gpt-oss-20b',    # Faster, lighter -- fallback if 120b hits limits
    'qwen/qwen3.8-27b',      # Multimodal, also handles text -- last resort
]

# Vision-capable Groq models (for image fallback)
GROQ_VISION_MODELS = [
    'qwen/qwen3.8-27b',      # Verified vision-capable on this account
    'openai/gpt-oss-120b',   # Vision fallback
]


def get_groq_client():
    api_key = getattr(settings, 'GROQ_API_KEY', '') or os.getenv('GROQ_API_KEY', '')
    if not api_key or not GROQ_AVAILABLE:
        return None
    try:
        return Groq(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")
        return None


def groq_generate(client, system_prompt, user_prompt, model_list=None):
    """Try each Groq model in order; return text or None."""
    models = model_list or GROQ_TEXT_MODELS
    last_err = None
    for model_name in models:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=600,
            )
            text = response.choices[0].message.content
            if text:
                logger.info(f"Groq responded using model: {model_name}")
                return text.strip()
        except Exception as e:
            last_err = e
            logger.warning(f"Groq model {model_name} failed: {e}")
    if last_err:
        logger.error(f"All Groq models failed. Last error: {last_err}")
    return None


# ---------------------------------------------------------------------------
# Gemini client (PRIMARY for images, FALLBACK for text)
# ---------------------------------------------------------------------------
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

GEMINI_MODELS = [
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3.5-flash',
]


def get_gemini_client():
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    if not api_key or not GENAI_AVAILABLE:
        return None
    try:
        genai.configure(api_key=api_key)
        return genai
    except Exception as e:
        logger.error(f"Failed to configure Gemini: {e}")
        return None


def gemini_generate(client, prompt):
    for model_name in GEMINI_MODELS:
        try:
            model = client.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini model {model_name} failed: {e}")
    return None


# ---------------------------------------------------------------------------
# Routing strategy:
#   Text / Diagnosis  → Groq first (sub-second), Gemini as fallback
#   Images            → Gemini only  (best multimodal quality)
#   Audio / Video     → Gemini only  (Groq has no audio/video support)
# ---------------------------------------------------------------------------
def ai_generate_text(system_prompt, user_prompt):
    """For text-only tasks: Groq first (fast), Gemini as fallback."""
    # 1. Try Groq (primary -- ultra-fast inference)
    groq_client = get_groq_client()
    if groq_client:
        result = groq_generate(groq_client, system_prompt, user_prompt, GROQ_TEXT_MODELS)
        if result:
            return result

    # 2. Fallback to Gemini
    gemini_client = get_gemini_client()
    if gemini_client:
        result = gemini_generate(gemini_client, f"{system_prompt}\n\n{user_prompt}")
        if result:
            return result

    return None


# Keep backward-compat alias (used by synthesize_diagnosis)
def ai_generate(system_prompt, user_prompt):
    return ai_generate_text(system_prompt, user_prompt)


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def chat_with_gemini(conversation_history: list, current_message: str, vehicle_info: str = "") -> str:
    """
    Short, direct mechanic chat responses.
    Identifies the issue and gives rough cost -- no long paragraphs.
    """
    system_prompt = (
        "You are Mac, a senior car mechanic. Be SHORT and DIRECT -- max 3-4 lines per reply. "
        "When a customer reports an issue: identify the likely fault in 1 sentence, "
        "ask at most ONE clarifying question if needed, and give the rough repair cost in INR (Rs.). "
        "Diagnose ONLY the exact part they mentioned: "
        "headlights = headlight fault only, smoke = engine only, AC = AC only. "
        "No bullet points. No long explanations. Just: what is wrong and rough cost."
    )

    user_prompt = ""
    if vehicle_info:
        user_prompt += f"Vehicle: {vehicle_info}\n\n"

    if conversation_history:
        user_prompt += "Chat so far:\n"
        for msg in conversation_history[-6:]:
            role = "Mechanic" if msg.get('sender') == 'mechanic' else "Customer"
            user_prompt += f"{role}: {msg.get('message', '')}\n"
        user_prompt += "\n"

    user_prompt += f"Customer: {current_message}\nMechanic (short, direct reply):"

    # Use Groq-first routing (fast) for text chat
    result = ai_generate_text(system_prompt, user_prompt)
    if result:
        return result

    return (
        f"Got your message about your {vehicle_info or 'vehicle'}. "
        "AI is temporarily busy -- please try again in a moment."
    )


def analyze_multimodal_media(file_path: str, file_type: str, user_prompt: str = "", vehicle_info: str = "") -> str:
    """
    Inspects image/audio/video files for mechanical faults.
    Images: Gemini multimodal (primary -- best quality), Groq vision via base64 (fallback).
    Audio/video: Gemini only (Groq has no audio/video support).
    """
    if not os.path.exists(file_path):
        return f"Got your {file_type}. Tell me exactly where on the vehicle this is from and I will diagnose it."

    if file_type == 'image':
        vehicle_context = f"Vehicle: {vehicle_info}. " if vehicle_info else ""
        mechanic_instruction = (
            f"You are Mac, a senior car mechanic inspecting a vehicle photo. {vehicle_context}"
            "Look at the image and identify: what component is shown, any visible damage, "
            "leaks, corrosion, wear, or faults. Give a SHORT 2-3 sentence diagnosis and "
            "the approximate repair cost in INR (Rs.)."
        )
        question = user_prompt or "What is the problem visible in this photo and how much will it cost to fix?"

        # --- Gemini multimodal (primary) ---
        gemini_client = get_gemini_client()
        if gemini_client:
            try:
                img = Image.open(file_path)
                for model_name in GEMINI_MODELS:
                    try:
                        model = gemini_client.GenerativeModel(model_name)
                        response = model.generate_content([mechanic_instruction, img, question])
                        if response and response.text:
                            return response.text.strip()
                    except Exception as e:
                        logger.warning(f"Gemini multimodal {model_name} failed: {e}")
            except Exception as e:
                logger.error(f"Gemini image error: {e}", exc_info=True)

        # --- Groq vision via base64 (fallback) ---
        groq_client = get_groq_client()
        if groq_client:
            try:
                import base64, io as _io
                img_pil = Image.open(file_path).convert('RGB')
                buf = _io.BytesIO()
                img_pil.save(buf, format='JPEG', quality=75)
                b64 = base64.b64encode(buf.getvalue()).decode()
                data_uri = f"data:image/jpeg;base64,{b64}"

                for model_name in GROQ_VISION_MODELS:
                    try:
                        response = groq_client.chat.completions.create(
                            model=model_name,
                            messages=[{
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": f"{mechanic_instruction}\n\n{question}"},
                                    {"type": "image_url", "image_url": {"url": data_uri}},
                                ]
                            }],
                            temperature=0.3,
                            max_tokens=300,
                        )
                        text = response.choices[0].message.content
                        if text:
                            return text.strip()
                    except Exception as e:
                        logger.warning(f"Groq vision {model_name} failed: {e}")
            except Exception as e:
                logger.error(f"Groq vision error: {e}", exc_info=True)

        return "I received your photo. Could you also describe what you see — for example, where the issue is or what part of the car this is?"

    elif file_type in ['audio', 'video']:
        # Groq does not support audio/video -- use Gemini only
        gemini_client = get_gemini_client()
        if gemini_client:
            try:
                vehicle_context = f"Vehicle: {vehicle_info}. " if vehicle_info else ""
                prompt = (
                    f"You are Mac, a senior car mechanic. {vehicle_context}"
                    f"Analyze this {file_type} and give a brief diagnosis with cost in INR (Rs.)."
                )
                uploaded_file = gemini_client.upload_file(path=file_path)
                for model_name in GEMINI_MODELS:
                    try:
                        model = gemini_client.GenerativeModel(model_name)
                        response = model.generate_content(
                            [prompt, uploaded_file,
                             user_prompt or f"Diagnose the issue in this {file_type}."]
                        )
                        if response and response.text:
                            return response.text.strip()
                    except Exception as e:
                        logger.warning(f"Gemini {file_type} {model_name} failed: {e}")
            except Exception as e:
                logger.error(f"Audio/video analysis error: {e}", exc_info=True)

    return f"Got your {file_type}. Describe what you see or hear and I will diagnose it."




def synthesize_diagnosis(vehicle_info: str, symptoms: list, messages: list) -> dict:
    """
    Generates a structured repair cost report via AI.
    Uses full conversation so image analysis results are included in the report.
    Raises RuntimeError if AI is unavailable.
    """
    # Build full conversation context — include both user messages AND mechanic image
    # analysis results so the report reflects what was found in any uploaded photos.
    # We exclude generic mechanic follow-up questions to avoid noise.
    user_messages = [m.get('message', '') for m in messages if m.get('sender') == 'user']
    mechanic_observations = [
        m.get('message', '') for m in messages
        if m.get('sender') == 'mechanic' and len(m.get('message', '')) > 80
        # Only include longer mechanic messages — these are image analysis results,
        # not short follow-up questions which are typically < 80 chars
    ]
    if symptoms:
        user_messages.extend(symptoms)

    context_parts = []
    if user_messages:
        context_parts.append("Customer reported:\n" + "\n".join(f"- {m}" for m in user_messages if m.strip()))
    if mechanic_observations:
        context_parts.append("Image/media analysis findings:\n" + "\n".join(f"- {m}" for m in mechanic_observations if m.strip()))
    user_context = "\n\n".join(context_parts)

    system_prompt = (
        "You are a senior car mechanic generating a repair cost report. "
        "The customer may have reported MULTIPLE issues (e.g. headlights AND engine smoke). "
        "You MUST include ALL reported issues in the report — do not pick just one. "
        "List every relevant service for every problem mentioned. "
        "Use realistic Indian market repair rates. Write costs as Rs.X,XXX - Rs.Y,YYY. "
        "Reply with ONLY a JSON object. No markdown. No extra text before or after the JSON."
    )

    user_prompt = (
        f"Vehicle: {vehicle_info or 'Unknown Vehicle'}\n"
        f"All reported issues and findings:\n{user_context}\n\n"
        "Return ONLY valid JSON covering ALL the issues above (no markdown, no extra text):\n"
        '{"issue_title": "Combined title covering all reported issues (e.g. Headlight Failure + Engine Smoke)",'
        ' "summary": "1-2 sentences covering every problem reported.",'
        ' "severity": "highest severity among all reported issues: LOW or MEDIUM or HIGH or CRITICAL",'
        ' "probable_causes": ["cause for issue 1", "cause for issue 2", "cause for issue 3"],'
        ' "recommended_services": [{"name": "service for EVERY reported issue", "estimated_cost": "Rs.X,XXX - Rs.Y,YYY", "urgency": "Immediate or Soon or Routine"}],'
        ' "safety_warning": "Safety note covering all reported issues.",'
        ' "estimated_cost_range": "Rs.X,XXX - Rs.Y,YYY (total of all services)"}'
    )

    text = ai_generate(system_prompt, user_prompt)

    if text:
        try:
            clean = text.strip()
            # Strip markdown fences if model added them
            if clean.startswith('```json'):
                clean = clean[7:]
            if clean.startswith('```'):
                clean = clean[3:]
            if clean.endswith('```'):
                clean = clean[:-3]
            # Extract JSON object even if model added surrounding text
            start = clean.find('{')
            end = clean.rfind('}') + 1
            if start != -1 and end > start:
                clean = clean[start:end]
            data = json.loads(clean.strip())
            data['ai_generated'] = True
            return data
        except json.JSONDecodeError as e:
            logger.warning(f"AI returned invalid JSON: {e}. Raw: {text[:400]}")

    logger.info("AI unavailable or rate-limited; utilizing deterministic rule-based diagnostic fallback.")
    return generate_fallback_diagnosis(vehicle_info, symptoms, messages)


def generate_fallback_diagnosis(vehicle_info: str, symptoms: list, messages: list) -> dict:
    # ── CRITICAL FIX: Only read USER messages, NOT mechanic replies ──
    # Mechanic replies contain generic automotive words (brake, squeal, etc.)
    # which would cause false-positive keyword matches.
    user_messages = [m.get('message', '') for m in messages if m.get('sender') == 'user']
    all_text = " ".join(user_messages + (symptoms or [])).lower()

    # ── Horn / Electrical accessories ──
    if any(k in all_text for k in ['horn', 'honk', 'beep', 'klaxon']):
        return {
            "issue_title": "Horn & Electrical Accessory Failure",
            "summary": "The horn circuit is not completing, which can be caused by a blown fuse, a faulty horn relay, a defective steering clock spring, or a failed horn unit itself.",
            "severity": "LOW",
            "probable_causes": [
                "Horn fuse blown in the engine-bay fuse box",
                "Horn relay failure — relay not energising the horn circuit",
                "Steering clock spring (spiral cable) broken, causing an open circuit to the horn pad",
                "Horn unit itself internally failed or corroded contacts"
            ],
            "recommended_services": [
                {"name": "Horn Fuse & Relay Inspection + Replacement", "estimated_cost": "Rs.200 - Rs.500", "urgency": "Soon"},
                {"name": "Steering Clock Spring Replacement", "estimated_cost": "Rs.1,800 - Rs.3,500", "urgency": "Soon"},
                {"name": "Horn Unit Replacement", "estimated_cost": "Rs.400 - Rs.1,200", "urgency": "Routine"},
            ],
            "safety_warning": "A non-functioning horn is a road safety hazard and may fail a vehicle inspection. Get it fixed promptly.",
            "estimated_cost_range": "Rs.200 - Rs.5,200",
            "ai_generated": False
        }

    # ── Brakes ──
    if any(k in all_text for k in ['brake', 'pad', 'rotor', 'caliper', 'squeal', 'grind']):
        is_grind = 'grind' in all_text or 'scrape' in all_text
        return {
            "issue_title": "Brake Friction Material Depletion & Rotor Wear",
            "summary": (
                "Metal-to-metal contact detected — steel backing plate is scoring the rotor face creating irreversible heat spots."
                if is_grind else
                "Acoustic wear indicators have contacted the rotor surface, indicating pad thickness below 3 mm safety threshold."
            ),
            "severity": "CRITICAL" if is_grind else "HIGH",
            "probable_causes": [
                "Brake friction material worn beyond minimum safety threshold (<3 mm)",
                "Brake rotor surface lateral runout (warpage) or circular grooving",
                "Caliper slide pin lubrication breakdown causing uneven pad taper wear"
            ],
            "recommended_services": [
                {"name": "Front Brake Pads & Rotors Replacement", "estimated_cost": "Rs.2,800 - Rs.4,800", "urgency": "Immediate" if is_grind else "Soon"},
                {"name": "Brake Fluid Moisture Test & Flush (DOT 4)", "estimated_cost": "Rs.750 - Rs.1,200", "urgency": "Routine"}
            ],
            "safety_warning": (
                "CRITICAL: Do not drive at highway speeds. Stopping distances are severely degraded."
                if is_grind else
                "Replace pads promptly to prevent irreversible scoring to the brake discs."
            ),
            "estimated_cost_range": "Rs.2,800 - Rs.6,000",
            "ai_generated": False
        }

    # ── Engine / Starting / Battery ──
    if any(k in all_text for k in ['battery', 'alternator', 'click', 'crank', "won't start", "not start", 'dead']):
        return {
            "issue_title": "Electrical Starting Circuit & Battery Failure",
            "summary": "The vehicle electrical system has inadequate cranking voltage or a failed charging circuit, preventing the starter motor from turning the crankshaft.",
            "severity": "MEDIUM",
            "probable_causes": [
                "12V Lead-acid battery internal cell sulfation or end-of-life (>3 years old)",
                "Alternator diode failure or worn brushes providing <13.5V under load",
                "Corroded lead battery terminals causing high electrical resistance"
            ],
            "recommended_services": [
                {"name": "12V Automotive Battery Replacement (Exide / Amaron)", "estimated_cost": "Rs.4,200 - Rs.6,500", "urgency": "Immediate"},
                {"name": "Battery Terminal Cleaning & Anti-Corrosion Treatment", "estimated_cost": "Rs.250 - Rs.450", "urgency": "Immediate"},
                {"name": "Alternator Output & Starter Draw Diagnostic", "estimated_cost": "Rs.600 - Rs.950", "urgency": "Soon"}
            ],
            "safety_warning": "If jump-started, keep the vehicle running and drive straight to a workshop.",
            "estimated_cost_range": "Rs.4,200 - Rs.7,900",
            "ai_generated": False
        }

    # ── Overheating / Cooling ──
    if any(k in all_text for k in ['overheat', 'temperature', 'coolant', 'radiator', 'steam', 'hot']):
        return {
            "issue_title": "Engine Cooling System Malfunction",
            "summary": "The cooling circuit cannot dissipate combustion heat, causing coolant to boil and building excessive cylinder-head pressure.",
            "severity": "CRITICAL",
            "probable_causes": [
                "Coolant leakage from radiator core, water pump weeping hole, or split hose",
                "Mechanical thermostat stuck in the closed position",
                "Electric cooling fan motor or temperature sensor switch failure"
            ],
            "recommended_services": [
                {"name": "Cooling System Pressure Leak Test", "estimated_cost": "Rs.650 - Rs.1,100", "urgency": "Immediate"},
                {"name": "Thermostat Replacement & Coolant Flush", "estimated_cost": "Rs.1,800 - Rs.2,900", "urgency": "Immediate"},
                {"name": "Water Pump Replacement (if leaking)", "estimated_cost": "Rs.3,200 - Rs.5,800", "urgency": "Immediate"}
            ],
            "safety_warning": "DANGER: Never remove the radiator cap while the engine is hot. Continued driving will warp cylinder heads.",
            "estimated_cost_range": "Rs.2,450 - Rs.9,800",
            "ai_generated": False
        }

    # ── AC / Climate ──
    if any(k in all_text for k in ['ac', 'air condition', 'cooling', 'blows warm', 'compressor', 'cold air', 'not cool']):
        return {
            "issue_title": "Automotive Air Conditioning Circuit Failure",
            "summary": "The climate control loop has lost refrigerant pressure or the compressor magnetic clutch is not engaging.",
            "severity": "LOW",
            "probable_causes": [
                "Refrigerant leak from O-rings, condenser fins, or evaporator core",
                "Compressor magnetic clutch coil failure or relay fault",
                "Clogged cabin pollen filter restricting blower airflow"
            ],
            "recommended_services": [
                {"name": "AC Gas Vacuum Testing & R134a Refrigerant Top-up", "estimated_cost": "Rs.1,400 - Rs.2,200", "urgency": "Soon"},
                {"name": "Cabin Air Filter Replacement", "estimated_cost": "Rs.450 - Rs.750", "urgency": "Routine"},
                {"name": "AC Compressor & Condenser Inspection", "estimated_cost": "Rs.800 - Rs.1,400", "urgency": "Soon"}
            ],
            "safety_warning": "Driving without AC is safe but ensure windows are opened in extreme heat.",
            "estimated_cost_range": "Rs.1,850 - Rs.4,350",
            "ai_generated": False
        }

    # ── Lights / Headlights ──
    if any(k in all_text for k in ['light', 'headlight', 'taillight', 'indicator', 'bulb', 'lamp']):
        return {
            "issue_title": "Lighting Circuit Failure",
            "summary": "One or more lighting circuits have failed, which may be caused by a blown bulb, blown fuse, bad relay, or a wiring fault.",
            "severity": "MEDIUM",
            "probable_causes": [
                "Bulb filament burnt out (tungsten halogen or LED failure)",
                "Fuse blown in the lighting circuit",
                "Relay or BCM (Body Control Module) controlling the lighting failed"
            ],
            "recommended_services": [
                {"name": "Bulb Replacement (per unit)", "estimated_cost": "Rs.150 - Rs.800", "urgency": "Soon"},
                {"name": "Lighting Fuse & Relay Inspection", "estimated_cost": "Rs.200 - Rs.500", "urgency": "Soon"},
                {"name": "Wiring Harness Inspection", "estimated_cost": "Rs.800 - Rs.1,500", "urgency": "Routine"}
            ],
            "safety_warning": "Non-functional headlights or indicators are illegal and dangerous at night or in low visibility.",
            "estimated_cost_range": "Rs.150 - Rs.2,800",
            "ai_generated": False
        }

    # ── Oil / Engine smoke ──
    if any(k in all_text for k in ['oil', 'smoke', 'burning smell', 'leak', 'drip', 'engine light', 'check engine']):
        return {
            "issue_title": "Engine Oil System & Emission Fault",
            "summary": "The engine is showing signs of oil consumption, leakage, or combustion of oil — indicating worn seals, gaskets, or piston rings.",
            "severity": "HIGH",
            "probable_causes": [
                "Valve stem seals or piston rings worn — oil entering combustion chamber",
                "Rocker cover / sump gasket leak onto hot exhaust manifold",
                "PCV (Positive Crankcase Ventilation) valve clogged causing pressure buildup"
            ],
            "recommended_services": [
                {"name": "Engine Oil & Filter Change + Leak Inspection", "estimated_cost": "Rs.800 - Rs.1,800", "urgency": "Immediate"},
                {"name": "Rocker Cover Gasket Replacement", "estimated_cost": "Rs.1,200 - Rs.2,400", "urgency": "Soon"},
                {"name": "PCV Valve Replacement", "estimated_cost": "Rs.400 - Rs.900", "urgency": "Soon"}
            ],
            "safety_warning": "Low engine oil can cause catastrophic engine seizure. Check oil level immediately and top up if needed.",
            "estimated_cost_range": "Rs.800 - Rs.5,100",
            "ai_generated": False
        }

    # ── Suspension / Steering / Vibration ──
    if any(k in all_text for k in ['vibrat', 'shak', 'wobble', 'pull', 'steer', 'suspension', 'bump', 'shock', 'noise from wheel']):
        return {
            "issue_title": "Suspension & Steering System Wear",
            "summary": "Vibration, pulling, or unusual road noise typically indicates worn suspension bushings, wheel balance issues, or degraded shock absorbers.",
            "severity": "MEDIUM",
            "probable_causes": [
                "Wheel imbalance or tyre damage causing vibration at speed",
                "Worn front strut or shock absorber top mount",
                "Lower control arm bushings or ball joint excessive play"
            ],
            "recommended_services": [
                {"name": "Wheel Balancing & Alignment", "estimated_cost": "Rs.400 - Rs.800", "urgency": "Soon"},
                {"name": "Shock Absorber / Strut Inspection & Replacement", "estimated_cost": "Rs.2,500 - Rs.5,500", "urgency": "Soon"},
                {"name": "Suspension Bushing Inspection", "estimated_cost": "Rs.600 - Rs.1,200", "urgency": "Routine"}
            ],
            "safety_warning": "Worn suspension reduces vehicle control, especially during emergency manoeuvres.",
            "estimated_cost_range": "Rs.400 - Rs.7,500",
            "ai_generated": False
        }

    # ── Generic fallback ──
    return {
        "issue_title": f"General Mechanical Diagnostic — {vehicle_info or 'Vehicle'}",
        "summary": "Based on the reported symptoms, a comprehensive in-person inspection is recommended. The technician will inspect all relevant systems and run an OBD-II diagnostic scan.",
        "severity": "MEDIUM",
        "probable_causes": [
            "Symptoms suggest a minor electrical or mechanical fault requiring physical inspection",
            "Sensor calibration drift or vacuum hose micro-leak",
            "Normal wear requiring scheduled service attention"
        ],
        "recommended_services": [
            {"name": "Comprehensive Multi-Point Inspection & OBD-II Diagnostic Scan", "estimated_cost": "Rs.600 - Rs.1,200", "urgency": "Soon"},
            {"name": "Preventative Fluid & Filter Service", "estimated_cost": "Rs.1,500 - Rs.2,800", "urgency": "Routine"}
        ],
        "safety_warning": "Monitor dashboard warning indicators closely and avoid aggressive acceleration until inspected.",
        "estimated_cost_range": "Rs.600 - Rs.4,000",
        "ai_generated": False
    }

