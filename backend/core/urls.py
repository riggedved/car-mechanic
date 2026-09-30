from django.urls import path
from .views import (
    ChatView,
    UploadView,
    DiagnosisView,
    BookingView,
    BookingDetailView,
    SessionHistoryView
)

urlpatterns = [
    path('chat/', ChatView.as_view(), name='api-chat'),
    path('upload/', UploadView.as_view(), name='api-upload'),
    path('diagnosis/', DiagnosisView.as_view(), name='api-diagnosis'),
    path('booking/', BookingView.as_view(), name='api-booking-list-create'),
    path('booking/<str:pk>/', BookingDetailView.as_view(), name='api-booking-detail'),
    path('history/<uuid:session_id>/', SessionHistoryView.as_view(), name='api-session-history'),
]
