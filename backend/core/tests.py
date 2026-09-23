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

    def test_session_history_with_bookings(self):
        """GET /api/history/{id}/ returns messages, diagnoses, and bookings."""
        session = ChatSession.objects.create(
            vehicle_make="Tata",
            vehicle_model="Nexon",
            vehicle_year="2021",
            vehicle_mileage="35,000 km"
        )
        diag = Diagnosis.objects.create(
            session=session,
            issue_title="Front Brake Rotor Grooving",
            summary="Rotor surface scoring detected.",
            severity="HIGH",
            estimated_cost_range="₹2,500 - ₹4,500"
        )
        Booking.objects.create(
            session=session,
            diagnosis=diag,
            booking_code="BK-TEST01",
            customer_name="Rohan Gupta",
            customer_email="rohan@example.com",
            customer_phone="+91 9876543210",
            vehicle_info="2021 Tata Nexon",
            service_requested="Front Brake Rotor Replacement",
            preferred_date="2026-10-20",
            preferred_time_slot="11:30 AM - 01:30 PM"
        )

        res = self.client.get(f'/api/history/{session.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['vehicle_make'], "Tata")
        self.assertEqual(res.data['vehicle_mileage'], "35,000 km")
        self.assertEqual(len(res.data['diagnoses']), 1)
        self.assertEqual(len(res.data['bookings']), 1)
        self.assertEqual(res.data['bookings'][0]['booking_code'], "BK-TEST01")

    def test_session_patch_vehicle_details(self):
        """PATCH /api/history/{id}/ allows directly updating active vehicle profile."""
        session = ChatSession.objects.create()
        patch_payload = {
            "vehicle_make": "Hyundai",
            "vehicle_model": "Creta",
            "vehicle_year": "2022",
            "vehicle_mileage": "28,500 km"
        }
        res = self.client.patch(f'/api/history/{session.id}/', patch_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertEqual(session.vehicle_make, "Hyundai")
        self.assertEqual(session.vehicle_model, "Creta")
        self.assertEqual(session.vehicle_year, "2022")
        self.assertEqual(session.vehicle_mileage, "28,500 km")

    def test_chat_view_vehicle_mileage_override(self):
        """POST /api/chat/ properly records vehicle_mileage when provided."""
        res = self.client.post('/api/chat/', {
            'message': 'Brakes are squealing',
            'vehicle_make': 'Maruti Suzuki',
            'vehicle_model': 'Swift',
            'vehicle_year': '2019',
            'vehicle_mileage': '54,000 km'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['vehicle_info']['mileage'], "54,000 km")
        self.assertEqual(res.data['vehicle_info']['make'], "Maruti Suzuki")

    def test_booking_filter_by_session(self):
        """GET /api/booking/?session_id=... filters bookings by session."""
        session1 = ChatSession.objects.create()
        session2 = ChatSession.objects.create()

        Booking.objects.create(
            session=session1,
            booking_code="BK-SESS01",
            customer_name="Alice",
            customer_email="alice@example.com",
            customer_phone="1234567890",
            vehicle_info="Car A",
            service_requested="Oil change",
            preferred_date="2026-10-10",
            preferred_time_slot="Morning"
        )
        Booking.objects.create(
            session=session2,
            booking_code="BK-SESS02",
            customer_name="Bob",
            customer_email="bob@example.com",
            customer_phone="0987654321",
            vehicle_info="Car B",
            service_requested="Tire rotation",
            preferred_date="2026-10-11",
            preferred_time_slot="Afternoon"
        )

        res = self.client.get(f'/api/booking/?session_id={session1.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['booking_code'], "BK-SESS01")
