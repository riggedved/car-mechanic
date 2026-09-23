import random
import string
import mimetypes
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import ChatSession, ChatMessage, UploadedMedia, Diagnosis, Booking
from .serializers import (
    ChatSessionSerializer, ChatMessageSerializer,
    UploadedMediaSerializer, DiagnosisSerializer, BookingSerializer
)
from .services.gemini_service import (
    generate_chat_response, analyze_vehicle_media, generate_diagnosis, GeminiException
)


def generate_booking_code():
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choices(chars, k=6))
    return f"BK-{suffix}"


class ChatView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_id = request.data.get('session_id')
        user_text = request.data.get('message', '').strip()
        media_id = request.data.get('media_id')

        if not user_text and not media_id:
            return Response(
                {"success": False, "error": "Either 'message' or 'media_id' must be provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Resolve or create ChatSession
        session = None
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id)
            except (ChatSession.DoesNotExist, ValueError):
                pass

        if not session:
            session = ChatSession.objects.create()

        # Update vehicle overrides
        if request.data.get('vehicle_make'):
            session.vehicle_make = request.data.get('vehicle_make')
        if request.data.get('vehicle_model'):
            session.vehicle_model = request.data.get('vehicle_model')
        if request.data.get('vehicle_year'):
            session.vehicle_year = request.data.get('vehicle_year')
        if request.data.get('vehicle_mileage'):
            session.vehicle_mileage = request.data.get('vehicle_mileage')
        session.save()

        # 2. Associate media if provided
        media_obj = None
        if media_id:
            try:
                media_obj = UploadedMedia.objects.get(id=media_id)
                media_obj.session = session
                media_obj.save()
            except (UploadedMedia.DoesNotExist, ValueError):
                pass

        # 3. Save User Message
        user_message_obj = ChatMessage.objects.create(
            session=session,
            sender='user',
            message=user_text or f"[Uploaded {media_obj.file_type if media_obj else 'media'}]",
            media=media_obj
        )

        vehicle_str = f"{session.vehicle_year} {session.vehicle_make} {session.vehicle_model}".strip()

        # 4. Invoke AI
        reply_text = ""
        is_ai = True
        
        try:
            if media_obj and media_obj.file:
                reply_text = analyze_vehicle_media(
                    media_obj.file.path,
                    mimetypes.guess_type(media_obj.file.name)[0] or 'image/jpeg',
                    user_text
                )
                media_obj.ai_analysis = reply_text
                media_obj.save()
            else:
                prior_messages = list(
                    session.messages.exclude(id=user_message_obj.id).values('sender', 'message')[:8]
                )
                reply_text = generate_chat_response(prior_messages, user_text, vehicle_str)
        except GeminiException as e:
            # Revert the user message so they can try again if there's an AI error
            user_message_obj.delete()
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            user_message_obj.delete()
            return Response(
                {"success": False, "error": "An unexpected error occurred while contacting AI."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 5. Save Mechanic Message
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
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"success": False, "error": "No file provided in request."}, status=status.HTTP_400_BAD_REQUEST)

        max_size = 25 * 1024 * 1024
        if file_obj.size > max_size:
            return Response(
                {"success": False, "error": "File size exceeds 25MB limit. Please upload a smaller media file."},
                status=status.HTTP_400_BAD_REQUEST
            )

        session_id = request.data.get('session_id')
        session = None
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id)
            except (ChatSession.DoesNotExist, ValueError):
                pass

        mime_type, _ = mimetypes.guess_type(file_obj.name)
        file_type = 'other'
        if mime_type:
            if mime_type.startswith('image/'):
                file_type = 'image'
            elif mime_type.startswith('audio/'):
                file_type = 'audio'
            elif mime_type.startswith('video/'):
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
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_id = request.data.get('session_id')
        symptoms = request.data.get('symptoms', [])
        
        if not session_id:
            return Response(
                {"success": False, "error": "session_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            session = ChatSession.objects.get(id=session_id)
        except (ChatSession.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Invalid session_id."}, status=status.HTTP_404_NOT_FOUND)

        vehicle_info = f"{session.vehicle_year} {session.vehicle_make} {session.vehicle_model}".strip()
        messages = session.messages.order_by('created_at')
        chat_history = "\n".join([f"{m.sender}: {m.message}" for m in messages[-10:]])
        
        if symptoms:
            chat_history += f"\nAdditional Symptoms Provided: {', '.join(symptoms)}"

        try:
            diagnosis_data = generate_diagnosis(vehicle_info, chat_history)
        except GeminiException as e:
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            return Response(
                {"success": False, "error": "An unexpected error occurred while generating diagnosis."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        diag_obj = Diagnosis.objects.create(
            session=session,
            issue_title=diagnosis_data.get('issue_title', 'Unknown Issue'),
            summary=diagnosis_data.get('summary', ''),
            severity=diagnosis_data.get('severity', 'MEDIUM'),
            probable_causes=diagnosis_data.get('probable_causes', []),
            recommended_services=diagnosis_data.get('recommended_services', []),
            safety_warning=diagnosis_data.get('safety_warning', ''),
            estimated_cost_range=diagnosis_data.get('estimated_cost_range', ''),
            ai_generated=True
        )

        serializer = DiagnosisSerializer(diag_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookingView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        session_id = request.query_params.get('session_id')
        bookings = Booking.objects.all()
        if session_id:
            bookings = bookings.filter(session__id=session_id)
        
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BookingSerializer(data=request.data)
        if serializer.is_valid():
            booking = serializer.save(booking_code=generate_booking_code())
            return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)
        
        # Format DRF validation errors for frontend expecting {"error": "..."}
        errors = serializer.errors
        error_msg = "; ".join([f"{k}: {v[0] if isinstance(v, list) else v}" for k, v in errors.items()])
        return Response(
            {"success": False, "error": error_msg},
            status=status.HTTP_400_BAD_REQUEST
        )


class BookingDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            booking = Booking.objects.get(id=pk)
        except (Booking.DoesNotExist, ValueError):
            try:
                booking = Booking.objects.get(booking_code=pk)
            except Booking.DoesNotExist:
                return Response({"success": False, "error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(BookingSerializer(booking).data)


class SessionHistoryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, session_id):
        session = get_object_or_404(ChatSession, id=session_id)
        serializer = ChatSessionSerializer(session, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, session_id):
        session = get_object_or_404(ChatSession, id=session_id)
        if 'vehicle_make' in request.data:
            session.vehicle_make = request.data['vehicle_make']
        if 'vehicle_model' in request.data:
            session.vehicle_model = request.data['vehicle_model']
        if 'vehicle_year' in request.data:
            session.vehicle_year = request.data['vehicle_year']
        if 'vehicle_mileage' in request.data:
            session.vehicle_mileage = request.data['vehicle_mileage']
        
        session.save()
        serializer = ChatSessionSerializer(session, context={'request': request})
        return Response(serializer.data)
