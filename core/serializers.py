from django.db import transaction
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers

from .models import (
    Pharmacy, Patient, Drug,
    Prescription, PrescriptionItem,
    Inventory, UserProfile
)


# Pharmacy
# ──────────────────────────────────────────────────────────────────────────────
class PharmacySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = "__all__"


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


# Drug
# ──────────────────────────────────────────────────────────────────────────────
class DrugSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drug
        fields = "__all__"


# Inventory
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
        fn = (obj.doctor.first_name or "").strip()
        ln = (obj.doctor.last_name or "").strip()
        full = f"{fn} {ln}".strip()
        return full if full else obj.doctor.username

    def get_doctor_reg_no(self, obj):
        prof = getattr(obj.doctor, "profile", None)
        return getattr(prof, "doctor_reg_no", None)


# Admin Serializers
# ──────────────────────────────────────────────────────────────────────────────
class AdminPharmacySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = [
            "pharmacy_id",
            "name",
            "location",
            "contact_number",
            "hospital_branch",
            "created_at",
        ]
        read_only_fields = ["pharmacy_id", "created_at"]


class AdminDrugSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drug
        fields = [
            "drug_id",
            "generic_name",
            "brand_name",
            "category",
            "unit",
            "requires_prescription",
            "description",
        ]
        read_only_fields = ["drug_id"]


class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(source="profile.role", choices=UserProfile.ROLE_CHOICES)
    doctor_reg_no = serializers.CharField(
        source="profile.doctor_reg_no",
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    pharmacy = serializers.PrimaryKeyRelatedField(
        source="profile.pharmacy",
        queryset=Pharmacy.objects.all(),
        required=False,
        allow_null=True,
    )
    pharmacy_name = serializers.CharField(source="profile.pharmacy.name", read_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "password",
            "first_name",
            "last_name",
            "email",
            "is_active",
            "date_joined",
            "role",
            "doctor_reg_no",
            "pharmacy",
            "pharmacy_name",
        ]
        read_only_fields = ["id", "date_joined", "pharmacy_name"]

    def validate(self, attrs):
        profile_data = attrs.setdefault("profile", {})

        current_profile = getattr(self.instance, "profile", None) if self.instance else None
        role = profile_data.get(
            "role",
            getattr(current_profile, "role", UserProfile.ROLE_DOCTOR),
        )
        pharmacy = profile_data.get(
            "pharmacy",
            getattr(current_profile, "pharmacy", None),
        )

        if role == UserProfile.ROLE_PHARMACY and not pharmacy:
            raise serializers.ValidationError({
                "pharmacy": "Pharmacy user must be assigned to a pharmacy."
            })

        if role != UserProfile.ROLE_PHARMACY:
            profile_data["pharmacy"] = None

        if role != UserProfile.ROLE_DOCTOR:
            profile_data["doctor_reg_no"] = None

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password", None)
        profile_data = validated_data.pop("profile", {})

        if not password:
            raise serializers.ValidationError({"password": "Password is required."})

        user = User(**validated_data)

        try:
            validate_password(password, user=user)
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})

        user.set_password(password)
        user.is_staff = profile_data.get("role") == UserProfile.ROLE_ADMIN
        user.save()

        UserProfile.objects.create(user=user, **profile_data)
        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        profile_data = validated_data.pop("profile", {})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            try:
                validate_password(password, user=instance)
            except ValidationError as e:
                raise serializers.ValidationError({"password": list(e.messages)})
            instance.set_password(password)

        profile, _ = UserProfile.objects.get_or_create(
            user=instance,
            defaults={"role": UserProfile.ROLE_DOCTOR},
        )

        for attr, value in profile_data.items():
            setattr(profile, attr, value)

        if profile.role != UserProfile.ROLE_PHARMACY:
            profile.pharmacy = None

        if profile.role != UserProfile.ROLE_DOCTOR:
            profile.doctor_reg_no = None

        instance.is_staff = profile.role == UserProfile.ROLE_ADMIN
        instance.save()
        profile.save()

        return instance