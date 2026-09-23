import os
import json
import logging
import traceback
from django.conf import settings
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

class GeminiException(Exception):
    pass

def get_client():
    api_key = os.getenv('GEMINI_API_KEY', '').strip()
    if not getattr(settings, 'GEMINI_API_KEY', '') and not api_key:
        api_key = getattr(settings, 'GEMINI_API_KEY', '').strip()
    
    if not api_key:
        raise GeminiException("GEMINI_API_KEY is not set.")
    
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")
        raise GeminiException(f"Failed to initialize AI client: {e}")

def generate_chat_response(conversation_history: list, current_message: str, vehicle_info: str = "") -> str:
    """
    Returns text response from Gemini.
    """
    client = get_client()
    
    system_instruction = (
        "You are Mac, an ASE Master Certified senior automotive technician with 25 years of workshop experience. "
        "Your role is strictly automotive diagnostics and vehicle repair advice. "
        "Actively listen to what the customer says and respond dynamically. "
        "Directly answer their specific question or symptom with deep mechanical insight. "
        "Explain what components could be failing and why. "
        "Keep the response engaging, informative, and formatted with clean bullet points where helpful. "
        "Do not answer off-topic non-car questions. When discussing costs, use Indian Rupee (INR / ₹) currency."
    )

    prompt = f"System Instruction: {system_instruction}\n\n"
    if vehicle_info:
        prompt += f"Active Vehicle Profile: {vehicle_info}\n\n"

    if conversation_history:
        prompt += "Previous Discussion Context:\n"
        for msg in conversation_history[-6:]:
            role = "Technician" if msg.get('sender') == 'mechanic' else "Customer"
            prompt += f"{role}: {msg.get('message', '')}\n"
        prompt += "\n"

    prompt += f"Customer's Current Message: {current_message}\n"
    prompt += "Technician:"

    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API Error in chat: {traceback.format_exc()}")
        if "429" in str(e) or "quota" in str(e).lower():
            raise GeminiException("AI service quota exceeded. Please try again later.")
        elif "503" in str(e) or "unavailable" in str(e).lower():
            raise GeminiException("The AI service is currently experiencing high demand. Please try again later.")
        raise GeminiException("Failed to generate AI response.")

def analyze_vehicle_media(file_path: str, mime_type: str, user_prompt: str) -> str:
    client = get_client()
    
    technician_prompt = (
        "You are an expert ASE Master Certified automotive technician. "
        "Analyze the uploaded vehicle media carefully. "
        "Identify the components visible, note any signs of wear, damage, leaks, or incorrect installation. "
        "Provide a professional, clear assessment of what you see and what mechanical steps are required."
    )
    
    prompt = user_prompt or "Inspect this vehicle component and identify any mechanical wear or fault."

    try:
        from PIL import Image
        import io
        
        contents = [technician_prompt, prompt]
        
        if mime_type.startswith('image/'):
            img = Image.open(file_path)
            if img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')
            img.thumbnail((1024, 1024))
            contents.append(img)
        else:
            # For audio/video, use File API. 
            # Note: For free tier, File API might be flaky, but we'll try.
            uploaded_file = client.files.upload(file=file_path)
            contents.append(uploaded_file)

        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=contents
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API Error in media analysis: {traceback.format_exc()}")
        if "429" in str(e) or "quota" in str(e).lower():
            raise GeminiException("AI service quota exceeded. Please try again later.")
        elif "503" in str(e) or "unavailable" in str(e).lower():
            raise GeminiException("The AI service is currently experiencing high demand. Please try again later.")
        raise GeminiException("Failed to analyze media.")

def generate_diagnosis(vehicle_info: str, chat_history: str) -> dict:
    client = get_client()
    
    prompt = f"""
You are an expert master car technician generating an official repair diagnosis report.
Vehicle: {vehicle_info or 'Unknown Car'}
Reported Symptoms / Conversation:
{chat_history}

IMPORTANT: All estimated costs must be formatted in Indian Rupees (INR / ₹) with realistic Indian automotive repair market rates (e.g. ₹1,500 - ₹3,500).

Respond ONLY with a valid JSON object matching this schema exactly:
{{
  "issue_title": "Concise mechanical issue name (e.g. Worn Front Brake Pads & Warped Rotors)",
  "summary": "2-3 sentence technical explanation of what is failing and why.",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "probable_causes": ["Cause 1", "Cause 2", "Cause 3"],
  "recommended_services": [
    {{"name": "Service name", "estimated_cost": "₹X,XXX - ₹Y,YYY", "urgency": "Immediate / Soon / Routine"}}
  ],
  "safety_warning": "Actionable driving safety advice.",
  "estimated_cost_range": "₹X,XXX - ₹Y,YYY"
}}
"""
    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        text = response.text.strip()
        if text.startswith('```json'):
            text = text[7:]
        if text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
        return json.loads(text.strip())
    except json.JSONDecodeError:
        logger.error(f"Failed to decode diagnosis JSON: {text}")
        raise GeminiException("AI returned malformed diagnosis data.")
    except Exception as e:
        logger.error(f"Gemini API Error in diagnosis: {traceback.format_exc()}")
        if "429" in str(e) or "quota" in str(e).lower():
            raise GeminiException("AI service quota exceeded. Please try again later.")
        elif "503" in str(e) or "unavailable" in str(e).lower():
            raise GeminiException("The AI service is currently experiencing high demand. Please try again later.")
        raise GeminiException("Failed to generate AI diagnosis.")
