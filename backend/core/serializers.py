from rest_framework import serializers
from .models import ChatSession, ChatMessage, UploadedMedia, Diagnosis, Booking


class UploadedMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = UploadedMedia
        fields = ['id', 'file', 'file_url', 'file_type', 'original_name', 'file_size', 'ai_analysis', 'uploaded_at']
        read_only_fields = ['id', 'file_url', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ChatMessageSerializer(serializers.ModelSerializer):
    media_detail = UploadedMediaSerializer(source='media', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'session', 'sender', 'message', 'media', 'media_detail', 'is_ai_generated', 'created_at']
        read_only_fields = ['id', 'created_at']


class DiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnosis
        fields = [
            'id', 'session', 'issue_title', 'summary', 'severity',
            'probable_causes', 'recommended_services', 'safety_warning',
            'estimated_cost_range', 'ai_generated', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class BookingSerializer(serializers.ModelSerializer):
    diagnosis_detail = DiagnosisSerializer(source='diagnosis', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_code', 'diagnosis', 'diagnosis_detail', 'session',
            'customer_name', 'customer_email', 'customer_phone',
            'vehicle_info', 'service_requested', 'preferred_date',
            'preferred_time_slot', 'customer_notes', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'booking_code', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    diagnoses = DiagnosisSerializer(many=True, read_only=True)
    media_uploads = UploadedMediaSerializer(many=True, read_only=True)
    bookings = BookingSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            'id', 'vehicle_make', 'vehicle_model', 'vehicle_year',
            'vehicle_mileage', 'current_issue', 'created_at', 'updated_at',
            'messages', 'diagnoses', 'media_uploads', 'bookings'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
