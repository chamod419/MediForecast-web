from django.db import transaction
from rest_framework import serializers

from .models import (
    Pharmacy, Patient, Drug,
    Prescription, PrescriptionItem,
    Inventory
)


# ──────────────────────────────────────────────────────────────────────────────
# Pharmacy
# ──────────────────────────────────────────────────────────────────────────────
class PharmacySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = "__all__"


# ──────────────────────────────────────────────────────────────────────────────
# Patient
# ──────────────────────────────────────────────────────────────────────────────
class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            "patient_id",
            "full_name",
            "nic_number",
            "phone",
            "date_of_birth",
            "gender",
            "created_at",
        ]
        read_only_fields = ["patient_id", "created_at"]


# ──────────────────────────────────────────────────────────────────────────────
# Drug
# ──────────────────────────────────────────────────────────────────────────────
class DrugSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drug
        fields = "__all__"


# ──────────────────────────────────────────────────────────────────────────────
# Inventory (✅ NEW for Pharmacist Inventory module)
# ──────────────────────────────────────────────────────────────────────────────
class InventorySerializer(serializers.ModelSerializer):
    drug_generic_name = serializers.CharField(source="drug.generic_name", read_only=True)
    drug_brand_name = serializers.CharField(source="drug.brand_name", read_only=True)
    drug_category = serializers.CharField(source="drug.category", read_only=True)
    drug_unit = serializers.CharField(source="drug.unit", read_only=True)

    class Meta:
        model = Inventory
        fields = [
            "inventory_id",
            "pharmacy",
            "drug",
            "drug_generic_name",
            "drug_brand_name",
            "drug_category",
            "drug_unit",
            "quantity_in_stock",
            "reorder_level",
            "expiry_date",
            "last_updated",
        ]
        read_only_fields = ["inventory_id", "last_updated", "pharmacy"]


# ──────────────────────────────────────────────────────────────────────────────
# Prescription Create
# ──────────────────────────────────────────────────────────────────────────────
class PrescriptionItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionItem
        fields = ["drug", "dosage", "quantity", "instructions"]


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    items = PrescriptionItemCreateSerializer(many=True)

    class Meta:
        model = Prescription
        fields = ["patient", "pharmacy", "diagnosis_notes", "items"]

    def validate_items(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one prescription item is required.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        request = self.context["request"]

        prescription = Prescription.objects.create(
            doctor=request.user,
            **validated_data
        )

        for item in items_data:
            PrescriptionItem.objects.create(prescription=prescription, **item)

        return prescription


# ──────────────────────────────────────────────────────────────────────────────
# Prescription Read
# ──────────────────────────────────────────────────────────────────────────────
class PrescriptionItemReadSerializer(serializers.ModelSerializer):
    drug_name = serializers.CharField(source="drug.generic_name", read_only=True)
    brand_name = serializers.CharField(source="drug.brand_name", read_only=True)

    class Meta:
        model = PrescriptionItem
        fields = [
            "item_id",
            "drug",
            "drug_name",
            "brand_name",
            "dosage",
            "quantity",
            "instructions",
        ]


class PrescriptionReadSerializer(serializers.ModelSerializer):
    doctor_username = serializers.CharField(source="doctor.username", read_only=True)
    doctor_full_name = serializers.SerializerMethodField()
    doctor_reg_no = serializers.SerializerMethodField()

    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    pharmacy_name = serializers.CharField(source="pharmacy.name", read_only=True)

    items = PrescriptionItemReadSerializer(many=True, read_only=True)

    class Meta:
        model = Prescription
        fields = [
            "prescription_id",
            "doctor",
            "doctor_username",
            "doctor_full_name",
            "doctor_reg_no",
            "patient",
            "patient_name",
            "pharmacy",
            "pharmacy_name",
            "status",
            "diagnosis_notes",
            "created_at",
            "dispensed_at",
            "dispensed_by",
            "items",
        ]

    def get_doctor_full_name(self, obj):
        # Prefer first+last, else username
        fn = (obj.doctor.first_name or "").strip()
        ln = (obj.doctor.last_name or "").strip()
        full = f"{fn} {ln}".strip()
        return full if full else obj.doctor.username

    def get_doctor_reg_no(self, obj):
        prof = getattr(obj.doctor, "profile", None)
        return getattr(prof, "doctor_reg_no", None)