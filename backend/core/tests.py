import io
from PIL import Image
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from .models import ChatSession, Booking, Diagnosis


class MechanicAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_greeting_handled_locally_no_ai(self):
        """Greetings should be handled locally without AI tokens."""
        response = self.client.post('/api/chat/', {'message': 'Hello there!'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_ai_generated'])
        self.assertIn("Mac", response.data['mechanic_message']['message'])

    def test_irrelevant_query_rejected_politely_no_ai(self):
        """Non-automotive queries should be rejected with zero AI tokens."""
        response = self.client.post('/api/chat/', {'message': 'Can you give me a recipe for chocolate cake?'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_ai_generated'])
        self.assertIn("specialize strictly in vehicle diagnostics", response.data['mechanic_message']['message'])

    def test_brake_symptom_diagnostic_followup(self):
        """Common car symptoms should trigger diagnostic follow-up questions."""
        response = self.client.post('/api/chat/', {'message': 'My 2018 Honda Civic brakes are squealing when I stop'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("brak", response.data['mechanic_message']['message'].lower())

    def test_file_upload(self):
        """POST /api/upload/ handles image upload properly."""
        file_obj = io.BytesIO()
        image = Image.new('RGB', (100, 100), color='red')
        image.save(file_obj, 'png')
        file_obj.seek(0)
        uploaded_file = SimpleUploadedFile("test_rotor.png", file_obj.read(), content_type="image/png")

        response = self.client.post('/api/upload/', {'file': uploaded_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['media']['file_type'], 'image')

    def test_diagnosis_generation(self):
        """POST /api/diagnosis/ returns structured severity and repair recommendations."""
        session = ChatSession.objects.create(vehicle_make="Toyota", vehicle_model="Camry", vehicle_year="2016")
        self.client.post('/api/chat/', {
            'session_id': str(session.id),
            'message': 'My front brakes are grinding heavily and vibrating the steering wheel'
        }, format='json')

        response = self.client.post('/api/diagnosis/', {'session_id': str(session.id)}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('issue_title', response.data)
        self.assertIn('severity', response.data)
        self.assertIn('recommended_services', response.data)
        self.assertTrue(len(response.data['recommended_services']) > 0)

    def test_booking_creation_and_retrieval(self):
        """POST /api/booking/ creates appointment, GET /api/booking/{id}/ retrieves it."""
        booking_payload = {
            "customer_name": "Alex Miller",
            "customer_email": "alex@example.com",
            "customer_phone": "+1-555-0199",
            "vehicle_info": "2018 Honda Civic",
            "service_requested": "Front Brake Pad & Rotor Replacement",
            "preferred_date": "2026-10-15",
            "preferred_time_slot": "10:00 AM - 12:00 PM",
            "customer_notes": "Squealing noise on front right wheel"
        }
        res_create = self.client.post('/api/booking/', booking_payload, format='json')
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        booking_code = res_create.data['booking_code']
        booking_id = res_create.data['id']
        self.assertTrue(booking_code.startswith('BK-'))

        # Retrieve by booking_code
        res_get_code = self.client.get(f'/api/booking/{booking_code}/')
        self.assertEqual(res_get_code.status_code, status.HTTP_200_OK)
        self.assertEqual(res_get_code.data['customer_name'], "Alex Miller")

        # Retrieve by UUID id
        res_get_id = self.client.get(f'/api/booking/{booking_id}/')
        self.assertEqual(res_get_id.status_code, status.HTTP_200_OK)
        self.assertEqual(res_get_id.data['customer_name'], "Alex Miller")
