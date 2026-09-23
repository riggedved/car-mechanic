from django.contrib import admin
from .models import ChatSession, ChatMessage, UploadedMedia, Diagnosis, Booking


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'vehicle_make', 'vehicle_model', 'vehicle_year', 'created_at')
    search_fields = ('vehicle_make', 'vehicle_model', 'vehicle_year', 'current_issue')


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'sender', 'message', 'is_ai_generated', 'created_at')
    list_filter = ('sender', 'is_ai_generated')


@admin.register(UploadedMedia)
class UploadedMediaAdmin(admin.ModelAdmin):
    list_display = ('original_name', 'file_type', 'file_size', 'uploaded_at')
    list_filter = ('file_type',)


@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ('issue_title', 'severity', 'estimated_cost_range', 'ai_generated', 'created_at')
    list_filter = ('severity', 'ai_generated')


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('booking_code', 'customer_name', 'customer_phone', 'preferred_date', 'status')
    list_filter = ('status', 'preferred_date')
    search_fields = ('booking_code', 'customer_name', 'customer_email', 'customer_phone')
