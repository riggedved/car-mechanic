import uuid
from django.db import models


class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle_make = models.CharField(max_length=100, blank=True, default='')
    vehicle_model = models.CharField(max_length=100, blank=True, default='')
    vehicle_year = models.CharField(max_length=10, blank=True, default='')
    vehicle_mileage = models.CharField(max_length=50, blank=True, default='')
    current_issue = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        car = f"{self.vehicle_year} {self.vehicle_make} {self.vehicle_model}".strip()
        return f"Session {str(self.id)[:8]} - {car or 'Unknown Vehicle'}"


class UploadedMedia(models.Model):
    MEDIA_TYPES = (
        ('image', 'Image'),
        ('audio', 'Audio'),
        ('video', 'Video'),
        ('other', 'Other'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        ChatSession,
        related_name='media_uploads',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    file_type = models.CharField(max_length=20, choices=MEDIA_TYPES, default='other')
    original_name = models.CharField(max_length=255, blank=True, default='')
    file_size = models.PositiveIntegerField(default=0)
    ai_analysis = models.TextField(blank=True, default='')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_type}: {self.original_name} ({str(self.id)[:8]})"


class ChatMessage(models.Model):
    SENDER_CHOICES = (
        ('user', 'User'),
        ('mechanic', 'Mechanic'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, related_name='messages', on_delete=models.CASCADE)
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)
    message = models.TextField()
    media = models.ForeignKey(
        UploadedMedia,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='chat_messages'
    )
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.sender}] {self.message[:40]}"


class Diagnosis(models.Model):
    SEVERITY_CHOICES = (
        ('LOW', 'Low - Safe to drive for now'),
        ('MEDIUM', 'Medium - Service soon'),
        ('HIGH', 'High - Immediate inspection advised'),
        ('CRITICAL', 'Critical - Do not drive / Tow required'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, related_name='diagnoses', on_delete=models.CASCADE)
    issue_title = models.CharField(max_length=255)
    summary = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='MEDIUM')
    probable_causes = models.JSONField(default=list)
    recommended_services = models.JSONField(default=list)
    safety_warning = models.TextField(blank=True, default='')
    estimated_cost_range = models.CharField(max_length=100, blank=True, default='')
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Diagnosis: {self.issue_title} ({self.severity})"


class Booking(models.Model):
    STATUS_CHOICES = (
        ('CONFIRMED', 'Confirmed'),
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking_code = models.CharField(max_length=30, unique=True)
    diagnosis = models.ForeignKey(
        Diagnosis,
        related_name='bookings',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    session = models.ForeignKey(
        ChatSession,
        related_name='bookings',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    customer_name = models.CharField(max_length=150)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=30)
    vehicle_info = models.CharField(max_length=255)
    service_requested = models.CharField(max_length=255)
    preferred_date = models.DateField()
    preferred_time_slot = models.CharField(max_length=50)
    customer_notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONFIRMED')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.booking_code} - {self.customer_name} ({self.service_requested})"
