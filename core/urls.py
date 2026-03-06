from django.urls import path
from . import views
from .auth_views import (
    DoctorLoginView,
    PharmacyLoginView,
    DoctorChangePasswordView,
    PharmacyChangePasswordView,
)
from .views import PharmacyPredictionView  

urlpatterns = [
    # ── Auth ──
    path("auth/doctor/login/", DoctorLoginView.as_view()),
    path("auth/pharmacy/login/", PharmacyLoginView.as_view()),
    path("auth/doctor/change-password/", DoctorChangePasswordView.as_view()),
    path("auth/pharmacy/change-password/", PharmacyChangePasswordView.as_view()),

    # ── Doctor/Pharmacy common lists ──
    path("pharmacies/", views.PharmacyListView.as_view()),
    path("patients/", views.PatientListView.as_view()),
    path("drugs/", views.DrugListView.as_view()),

    # ── Inventory ───
    path("inventory/", views.PharmacyInventoryListView.as_view()),                       
    path("inventory/<uuid:inventory_id>/", views.PharmacyInventoryUpdateView.as_view()), 
    path("inventory/availability/", views.check_availability),                           

   
    path("inventory/export/", views.InventoryExportView.as_view()),
    path("inventory/import/", views.InventoryImportView.as_view()),

    # ── Prescriptions ──
    path("prescriptions/", views.PrescriptionCreateView.as_view()),
    path("prescriptions/my/", views.DoctorPrescriptionHistoryView.as_view()),
    path("prescriptions/queue/", views.PrescriptionQueueView.as_view()),
    path("prescriptions/<uuid:pk>/status/", views.PrescriptionStatusUpdateView.as_view()),
    path("prescriptions/<uuid:pk>/dispense/", views.DispensePrescriptionView.as_view()),
    path("prescriptions/<uuid:pk>/", views.PrescriptionDetailView.as_view()),

    path("inventory/report/export/", views.InventoryMonthlyReportExportView.as_view()),
    path("reports/dispensed/export/", views.DispensedReportExportView.as_view()),

    # ── Pharmacy Prediction ──
    # Pharmacy Prediction
    path("inventory/predict/", PharmacyPredictionView.as_view(), name="inventory-predict"),
]