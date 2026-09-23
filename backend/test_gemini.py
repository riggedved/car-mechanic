import os
from google import genai

api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    # Try to load it from the env of the active terminal or just print error
    print("NO API KEY")

try:
    client = genai.Client()
    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents='hello',
    )
    print("Success 3.6")
except Exception as e:
    print("Error 3.6:", str(e))

try:
    client = genai.Client()
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents='hello',
    )
    print("Success 1.5")
except Exception as e:
    print("Error 1.5:", str(e))
