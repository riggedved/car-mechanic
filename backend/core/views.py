import random
import string
import mimetypes
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import ChatSession, ChatMessage, UploadedMedia, Diagnosis, Booking
from .serializers import (
    ChatSessionSerializer, ChatMessageSerializer,
    UploadedMediaSerializer, DiagnosisSerializer, BookingSerializer
)
from .services.classifier import (
    is_greeting, is_clearly_irrelevant, is_automotive,
    extract_vehicle_details, get_polite_rejection,
    get_mechanic_greeting, generate_rule_based_followup
)
from .services.gemini_service import (
    chat_with_gemini, analyze_multimodal_media, synthesize_diagnosis, get_gemini_client
)


def generate_booking_code():
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choices(chars, k=6))
    return f"BK-{suffix}"


class ChatView(APIView):
    """
    POST /api/chat/
    Orchestrates conversation with traditional logic first to minimize AI usage.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_id = request.data.get('session_id')
        user_text = request.data.get('message', '').strip()
        media_id = request.data.get('media_id')

        if not user_text and not media_id:
            return Response(
                {"error": "Either 'message' or 'media_id' must be provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Resolve or create ChatSession
        session = None
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id)
            except (ChatSession.DoesNotExist, ValueError):
                session = None

        if not session:
            session = ChatSession.objects.create()

        # 2. Extract vehicle information using traditional regex parser
        vehicle_updates = extract_vehicle_details(user_text)
        if vehicle_updates.get('year') and not session.vehicle_year:
            session.vehicle_year = vehicle_updates['year']
        if vehicle_updates.get('make') and not session.vehicle_make:
            session.vehicle_make = vehicle_updates['make']
        if vehicle_updates.get('mileage') and not session.vehicle_mileage:
            session.vehicle_mileage = vehicle_updates['mileage']

        # Manual overrides if sent from frontend vehicle selector
        if request.data.get('vehicle_make'):
            session.vehicle_make = request.data.get('vehicle_make')
        if request.data.get('vehicle_model'):
            session.vehicle_model = request.data.get('vehicle_model')
        if request.data.get('vehicle_year'):
            session.vehicle_year = request.data.get('vehicle_year')
        if request.data.get('vehicle_mileage'):
            session.vehicle_mileage = request.data.get('vehicle_mileage')

        session.save()

        # 3. Associate media if provided
        media_obj = None
        if media_id:
            try:
                media_obj = UploadedMedia.objects.get(id=media_id)
                media_obj.session = session
                media_obj.save()
            except (UploadedMedia.DoesNotExist, ValueError):
                pass

        # 4. Save User Message
        user_message_obj = ChatMessage.objects.create(
            session=session,
            sender='user',
            message=user_text or f"[Uploaded {media_obj.file_type if media_obj else 'media'}]",
            media=media_obj
        )

        vehicle_str = f"{session.vehicle_year} {session.vehicle_make} {session.vehicle_model}".strip()

        # 5. Traditional Logic & AI Minimization Strategy
        reply_text = ""
        is_ai = False

        # Strategy A: Check for simple greetings (0 AI Tokens)
        if is_greeting(user_text):
            reply_text = get_mechanic_greeting()
            is_ai = False

        # Strategy B: Reject off-topic / non-automotive queries (0 AI Tokens)
        elif is_clearly_irrelevant(user_text):
            reply_text = get_polite_rejection()
            is_ai = False

        # Strategy C: Check if media was uploaded with message (Multimodal AI)
        elif media_obj and media_obj.file:
            reply_text = analyze_multimodal_media(
                media_obj.file.path,
                media_obj.file_type,
                user_text
            )
            media_obj.ai_analysis = reply_text
            media_obj.save()
            is_ai = True

        # Strategy D: Automotive Mechanical Query (Dynamic AI with Rule Fallback)
        elif is_automotive(user_text):
            client = get_gemini_client()
            prior_messages = list(
                session.messages.exclude(id=user_message_obj.id).values('sender', 'message')[:8]
            )

            # If Gemini is configured, provide dynamic, nuanced mechanic troubleshooting
            if client:
                reply_text = chat_with_gemini(prior_messages, user_text, vehicle_str)
                is_ai = True
            else:
                # If Gemini is offline/unconfigured, use deterministic decision tree
                rule_followup = generate_rule_based_followup(user_text, {
                    'vehicle': vehicle_str,
                    'has_media': bool(media_obj)
                })
                if rule_followup and not prior_messages:
                    reply_text = rule_followup
                else:
                    reply_text = (
                        f"Understood. For {vehicle_str or 'your vehicle'}, this symptom usually points to mechanical "
                        "wear or component fatigue in that specific system. "
                        "Does this happen constantly or only under specific conditions (e.g. at highway speeds, over bumps, or when cold)? "
                        "Click 'Generate Full Diagnostic Report (₹)' anytime to see estimated repair costs."
                    )
                is_ai = False
        else:
            # Ambiguous query - prompt user for car context (0 AI tokens)
            reply_text = (
                "Could you specify how this relates to your car's symptoms or maintenance? "
                "I want to make sure I give you accurate mechanical advice."
            )
            is_ai = False

        # 6. Save Mechanic Message
        mechanic_message_obj = ChatMessage.objects.create(
            session=session,
            sender='mechanic',
            message=reply_text,
            is_ai_generated=is_ai
        )

        return Response({
            "session_id": str(session.id),
            "user_message": ChatMessageSerializer(user_message_obj, context={'request': request}).data,
            "mechanic_message": ChatMessageSerializer(mechanic_message_obj, context={'request': request}).data,
            "vehicle_info": {
                "year": session.vehicle_year,
                "make": session.vehicle_make,
                "model": session.vehicle_model,
                "mileage": session.vehicle_mileage,
            },
            "is_ai_generated": is_ai
        }, status=status.HTTP_200_OK)


class UploadView(APIView):
    """
    POST /api/upload/
    Uploads image, audio, or video files.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided in request."}, status=status.HTTP_400_BAD_REQUEST)

        # File size check: limit to 25MB
        max_size = 25 * 1024 * 1024
        if file_obj.size > max_size:
            return Response(
                {"error": "File size exceeds 25MB limit. Please upload a smaller media file."},
                status=status.HTTP_400_BAD_REQUEST
            )

        session_id = request.data.get('session_id')
        session = None
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id)
            except (ChatSession.DoesNotExist, ValueError):
                session = None

        # Determine file type
        mime_type, _ = mimetypes.guess_type(file_obj.name)
        file_type = 'other'
        if mime_type:
            if mime_type.startswith('image/'):
                file_type = 'image'
            elif mime_type.startswith('audio/'):
                file_type = 'audio'
            elif mime_type.startswith('video/'):
                file_type = 'video'
        else:
            ext = file_obj.name.lower().split('.')[-1]
            if ext in ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']:
                file_type = 'image'
            elif ext in ['mp3', 'wav', 'ogg', 'm4a', 'aac']:
                file_type = 'audio'
            elif ext in ['mp4', 'mov', 'avi', 'mkv', 'webm']:
                file_type = 'video'

        media = UploadedMedia.objects.create(
            session=session,
            file=file_obj,
            file_type=file_type,
            original_name=file_obj.name,
            file_size=file_obj.size
        )

        serializer = UploadedMediaSerializer(media, context={'request': request})
        return Response({
            "message": "File uploaded successfully.",
            "media": serializer.data
        }, status=status.HTTP_201_CREATED)


class DiagnosisView(APIView):
    """
    POST /api/diagnosis/
    Synthesizes diagnosis report with severity, causes, and recommended repairs.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_id = request.data.get('session_id')
        session = None
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id)
            except (ChatSession.DoesNotExist, ValueError):
                session = None

        if not session:
            session = ChatSession.objects.create()

        # Gather context
        vehicle_str = f"{session.vehicle_year} {session.vehicle_make} {session.vehicle_model}".strip()
        messages = list(session.messages.values('sender', 'message'))

        # Check if symptoms were passed directly in payload
        symptoms = request.data.get('symptoms', [])
        if isinstance(symptoms, str):
            symptoms = [symptoms]

        if not messages and not symptoms:
            return Response(
                {"error": "Please provide symptoms or have a conversation with the mechanic first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Synthesize diagnosis
        report = synthesize_diagnosis(vehicle_str, symptoms, messages)

        # Save to database
        diagnosis_obj = Diagnosis.objects.create(
            session=session,
            issue_title=report.get('issue_title', 'Vehicle Mechanical Diagnostic'),
            summary=report.get('summary', ''),
            severity=report.get('severity', 'MEDIUM'),
            probable_causes=report.get('probable_causes', []),
            recommended_services=report.get('recommended_services', []),
            safety_warning=report.get('safety_warning', ''),
            estimated_cost_range=report.get('estimated_cost_range', ''),
            ai_generated=bool(getattr(settings, 'GEMINI_API_KEY', ''))
        )

        serializer = DiagnosisSerializer(diagnosis_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookingView(APIView):
    """
    POST /api/booking/  - Create a new mechanic booking
    GET /api/booking/   - List recent bookings
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        session_id = request.query_params.get('session_id')
        if session_id:
            bookings = Booking.objects.filter(session_id=session_id)
        else:
            bookings = Booking.objects.all()[:20]
        serializer = BookingSerializer(bookings, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()

        # Require fundamental customer info
        required_fields = ['customer_name', 'customer_phone', 'preferred_date']
        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return Response(
                {"error": f"Missing required fields: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fallbacks for optional fields
        if not data.get('vehicle_info'):
            session_id = data.get('session')
            if session_id:
                try:
                    s = ChatSession.objects.get(id=session_id)
                    data['vehicle_info'] = f"{s.vehicle_year} {s.vehicle_make} {s.vehicle_model}".strip() or "Vehicle inspection"
                except Exception:
                    data['vehicle_info'] = "General vehicle inspection"
            else:
                data['vehicle_info'] = "General vehicle inspection"

        if not data.get('service_requested'):
            data['service_requested'] = "Comprehensive Diagnostic & Repair Service"

        if not data.get('preferred_time_slot'):
            data['preferred_time_slot'] = "10:00 AM - 12:00 PM"

        if not data.get('customer_email'):
            data['customer_email'] = "customer@example.com"

        booking_code = generate_booking_code()
        while Booking.objects.filter(booking_code=booking_code).exists():
            booking_code = generate_booking_code()

        serializer = BookingSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            booking = serializer.save(booking_code=booking_code)
            return Response(
                BookingSerializer(booking, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookingDetailView(APIView):
    """
    GET /api/booking/{id}/
    Retrieve booking by UUID or booking_code.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        booking = None
        # Check if pk is a booking_code or UUID
        if pk.startswith('BK-'):
            booking = get_object_or_404(Booking, booking_code=pk)
        else:
            try:
                booking = get_object_or_404(Booking, id=pk)
            except Exception:
                booking = get_object_or_404(Booking, booking_code=pk)

        serializer = BookingSerializer(booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SessionHistoryView(APIView):
    """
    GET /api/history/{session_id}/
    Retrieves entire session context: messages, uploads, diagnoses.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, session_id):
        session = get_object_or_404(ChatSession, id=session_id)
        serializer = ChatSessionSerializer(session, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, session_id):
        session = get_object_or_404(ChatSession, id=session_id)
        if 'vehicle_make' in request.data:
            session.vehicle_make = request.data.get('vehicle_make', '')
        if 'vehicle_model' in request.data:
            session.vehicle_model = request.data.get('vehicle_model', '')
        if 'vehicle_year' in request.data:
            session.vehicle_year = request.data.get('vehicle_year', '')
        if 'vehicle_mileage' in request.data:
            session.vehicle_mileage = request.data.get('vehicle_mileage', '')
        session.save()
        serializer = ChatSessionSerializer(session, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
