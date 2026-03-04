from django.urls import path
from . import views
from .auth_views import (
    DoctorLoginView,
    PharmacyLoginView,
    DoctorChangePasswordView,
    PharmacyChangePasswordView,
)

urlpatterns = [
    # ── Auth ─────────────────────────────────────────────
    path("auth/doctor/login/", DoctorLoginView.as_view()),
    path("auth/pharmacy/login/", PharmacyLoginView.as_view()),
    path("auth/doctor/change-password/", DoctorChangePasswordView.as_view()),
    path("auth/pharmacy/change-password/", PharmacyChangePasswordView.as_view()),

    # ── Doctor/Pharmacy common lists ──────────────────────
    path("pharmacies/", views.PharmacyListView.as_view()),
    path("patients/", views.PatientListView.as_view()),
    path("drugs/", views.DrugListView.as_view()),

    # ── Inventory (Pharmacy only) ─────────────────────────
    path("inventory/", views.PharmacyInventoryListView.as_view()),                       # GET list
    path("inventory/<uuid:inventory_id>/", views.PharmacyInventoryUpdateView.as_view()), # PATCH update one
    path("inventory/availability/", views.check_availability),                           # GET check stock

    # (Next steps: Excel)
    path("inventory/export/", views.InventoryExportView.as_view()),
    path("inventory/import/", views.InventoryImportView.as_view()),

    # ── Prescriptions ─────────────────────────────────────
    path("prescriptions/", views.PrescriptionCreateView.as_view()),
    path("prescriptions/my/", views.DoctorPrescriptionHistoryView.as_view()),
    path("prescriptions/queue/", views.PrescriptionQueueView.as_view()),

    path("prescriptions/<uuid:pk>/status/", views.PrescriptionStatusUpdateView.as_view()),
    path("prescriptions/<uuid:pk>/dispense/", views.DispensePrescriptionView.as_view()),
    path("prescriptions/<uuid:pk>/", views.PrescriptionDetailView.as_view()),

    path("inventory/report/export/", views.InventoryMonthlyReportExportView.as_view()),
]