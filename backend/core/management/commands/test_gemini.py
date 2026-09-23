import os
from django.core.management.base import BaseCommand
from core.services.gemini_service import generate_chat_response, GeminiException

class Command(BaseCommand):
    help = 'Tests the Gemini API connection directly from the backend'

    def handle(self, *args, **options):
        self.stdout.write("Testing Gemini API connection...")
        
        try:
            response = generate_chat_response(
                conversation_history=[],
                current_message="Hello, test ping! Reply with 'PONG' and a random 4 digit number.",
                vehicle_info=""
            )
            self.stdout.write(self.style.SUCCESS(f"SUCCESS — Gemini API is working."))
            self.stdout.write(f"Response: {response}")
        except GeminiException as e:
            self.stdout.write(self.style.ERROR(f"FAILED — {str(e)}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"FAILED — Unexpected error: {str(e)}"))
