from django.urls import path
from . import views
from .auth_views import (
    DoctorLoginView,
    PharmacyLoginView,
    DoctorChangePasswordView,
    PharmacyChangePasswordView,
    AdminLoginView,
    AdminChangePasswordView,
)
from .views import PharmacyPredictionView

urlpatterns = [
    # ── Auth ──
    path("auth/doctor/login/", DoctorLoginView.as_view()),
    path("auth/pharmacy/login/", PharmacyLoginView.as_view()),
    path("auth/admin/login/", AdminLoginView.as_view()),

    path("auth/doctor/change-password/", DoctorChangePasswordView.as_view()),
    path("auth/pharmacy/change-password/", PharmacyChangePasswordView.as_view()),
    path("auth/admin/change-password/", AdminChangePasswordView.as_view()),

    # ── Doctor/Pharmacy common lists ──
    path("pharmacies/", views.PharmacyListView.as_view()),
    path("patients/", views.PatientListView.as_view()),
    path("drugs/", views.DrugListView.as_view()),

    # ── Inventory ──
    path("inventory/", views.PharmacyInventoryListView.as_view()),
    path("inventory/<uuid:inventory_id>/", views.PharmacyInventoryUpdateView.as_view()),
    path("inventory/availability/", views.check_availability),
    path("inventory/export/", views.InventoryExportView.as_view()),
    path("inventory/import/", views.InventoryImportView.as_view()),
    path("inventory/report/export/", views.InventoryMonthlyReportExportView.as_view()),
    path("inventory/predict/", PharmacyPredictionView.as_view(), name="inventory-predict"),

    # ── Prescriptions ──
    path("prescriptions/", views.PrescriptionCreateView.as_view()),
    path("prescriptions/my/", views.DoctorPrescriptionHistoryView.as_view()),
    path("prescriptions/queue/", views.PrescriptionQueueView.as_view()),
    path("prescriptions/<uuid:pk>/status/", views.PrescriptionStatusUpdateView.as_view()),
    path("prescriptions/<uuid:pk>/dispense/", views.DispensePrescriptionView.as_view()),
    path("prescriptions/<uuid:pk>/", views.PrescriptionDetailView.as_view()),

    # ── Reports ──
    path("reports/dispensed/export/", views.DispensedReportExportView.as_view()),

    # ── Admin APIs ──
    path("admin/dashboard/", views.AdminDashboardView.as_view()),

    path("admin/users/", views.AdminUserListCreateView.as_view()),
    path("admin/users/<int:id>/", views.AdminUserDetailView.as_view()),

    path("admin/pharmacies/", views.AdminPharmacyListCreateView.as_view()),
    path("admin/pharmacies/<uuid:pharmacy_id>/", views.AdminPharmacyDetailView.as_view()),

    path("admin/drugs/", views.AdminDrugListCreateView.as_view()),
    path("admin/drugs/<uuid:drug_id>/", views.AdminDrugDetailView.as_view()),

    path("admin/patients/", views.AdminPatientListView.as_view()),
    path("admin/patients/<uuid:patient_id>/", views.AdminPatientDetailView.as_view()),

    path("admin/prescriptions/", views.AdminPrescriptionListView.as_view()),
    path("admin/prescriptions/<uuid:prescription_id>/", views.AdminPrescriptionDetailView.as_view()),

    path("admin/inventory/", views.AdminInventoryListView.as_view()),
    path("admin/inventory/<uuid:inventory_id>/", views.AdminInventoryDetailView.as_view()),
]