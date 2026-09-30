import os
import json
import logging
import warnings
from django.conf import settings
from PIL import Image

warnings.filterwarnings('ignore', category=FutureWarning)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Groq client (primary AI -- generous free tier)
# ---------------------------------------------------------------------------
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

# Verified working models on this Groq account
GROQ_MODELS = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
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


def groq_generate(client, system_prompt, user_prompt):
    """Try each Groq model in order; return text or None."""
    last_err = None
    for model_name in GROQ_MODELS:
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
                return text.strip()
        except Exception as e:
            last_err = e
            logger.warning(f"Groq model {model_name} failed: {e}")
    if last_err:
        logger.error(f"All Groq models failed. Last error: {last_err}")
    return None


# ---------------------------------------------------------------------------
# Gemini client (optional fallback)
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
# Unified AI call -- Gemini first (better quality), Groq as fallback
# ---------------------------------------------------------------------------
def ai_generate(system_prompt, user_prompt):
    """Tries Gemini first, then Groq. Returns None if both unavailable."""
    gemini_client = get_gemini_client()
    if gemini_client:
        result = gemini_generate(gemini_client, f"{system_prompt}\n\n{user_prompt}")
        if result:
            return result

    groq_client = get_groq_client()
    if groq_client:
        result = groq_generate(groq_client, system_prompt, user_prompt)
        if result:
            return result

    return None


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

    result = ai_generate(system_prompt, user_prompt)
    if result:
        return result

    return (
        f"Got your message about your {vehicle_info or 'vehicle'}. "
        "AI is temporarily busy -- please try again in a moment."
    )


def analyze_multimodal_media(file_path: str, file_type: str, user_prompt: str = "", vehicle_info: str = "") -> str:
    """
    Inspects image/audio/video files for mechanical faults.
    Images: Groq vision (base64) first, Gemini as fallback.
    Audio/video: Gemini only.
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

                for model_name in GROQ_MODELS:
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
            return data
        except json.JSONDecodeError as e:
            logger.warning(f"AI returned invalid JSON: {e}. Raw: {text[:400]}")

    raise RuntimeError(
        "AI diagnostic engine is temporarily unavailable. Please try again in a moment."
    )
