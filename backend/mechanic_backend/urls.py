from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def root_health_check(request):
    return JsonResponse({
        "status": "online",
        "service": "Apex Car Mechanic AI Diagnostic API",
        "version": "1.0.0",
        "endpoints": {
          "chat": "/api/chat/",
          "upload": "/api/upload/",
          "diagnosis": "/api/diagnosis/",
          "booking": "/api/booking/"
        }
    })


urlpatterns = [
    path('', root_health_check, name='root-health'),
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
