import uuid
from django.db import models
from django.contrib.auth.models import User


class Pharmacy(models.Model):
    pharmacy_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    location = models.CharField(max_length=200, blank=True)
    contact_number = models.CharField(max_length=30, blank=True)
    hospital_branch = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.hospital_branch})" if self.hospital_branch else self.name


class Patient(models.Model):
    patient_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=150)
    nic_number = models.CharField(max_length=20, unique=True)
    phone = models.CharField(max_length=30, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=[("M", "Male"), ("F", "Female"), ("Other", "Other")],
        default="Other",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.nic_number})"


class Drug(models.Model):
    drug_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    generic_name = models.CharField(max_length=150)
    brand_name = models.CharField(max_length=150, blank=True)
    category = models.CharField(max_length=120, blank=True)
    unit = models.CharField(max_length=50, blank=True)  # tablet/ml/mg
    requires_prescription = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.brand_name or self.generic_name


class Prescription(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        READY = "READY", "Ready"
        DISPENSED = "DISPENSED", "Dispensed"
        CANCELLED = "CANCELLED", "Cancelled"

    prescription_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    doctor = models.ForeignKey(User, on_delete=models.PROTECT, related_name="doctor_prescriptions")
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name="prescriptions")
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.PROTECT, related_name="prescriptions")

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    diagnosis_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    dispensed_at = models.DateTimeField(null=True, blank=True)
    dispensed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="dispensed_prescriptions"
    )

    def __str__(self):
        return f"{self.prescription_id} - {self.status}"


class PrescriptionItem(models.Model):
    item_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name="items")
    drug = models.ForeignKey(Drug, on_delete=models.PROTECT, related_name="prescription_items")
    dosage = models.CharField(max_length=120, blank=True)
    quantity = models.PositiveIntegerField()
    instructions = models.TextField(blank=True)

    def __str__(self):
        return f"{self.drug} x {self.quantity}"


class Inventory(models.Model):
    inventory_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name="inventory_items")
    drug = models.ForeignKey(Drug, on_delete=models.CASCADE, related_name="inventory_items")
    quantity_in_stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=0)
    expiry_date = models.DateField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("pharmacy", "drug")

    def __str__(self):
        return f"{self.pharmacy} - {self.drug} ({self.quantity_in_stock})"


class UserProfile(models.Model):
    ROLE_DOCTOR = "DOCTOR"
    ROLE_PHARMACY = "PHARMACY"
    ROLE_ADMIN = "ADMIN"

    ROLE_CHOICES = (
        (ROLE_DOCTOR, "Doctor"),
        (ROLE_PHARMACY, "Pharmacy"),
        (ROLE_ADMIN, "Admin"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_DOCTOR)

    # Doctor specific
    doctor_reg_no = models.CharField(max_length=50, blank=True, null=True)

    # Pharmacy specific
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


# =============================================================================
# ✅ NEW: Inventory Import History (for monthly opening stock + reconciliation)
# =============================================================================

class InventoryImportBatch(models.Model):
    """
    Each Excel import creates one batch.
    This allows tracking "Opening Stock" per month and generating reports like:
    Opening, Dispensed, Expected Closing, Current, Variance.
    """
    batch_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name="import_batches")
    imported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    file_name = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.pharmacy} import {self.created_at:%Y-%m-%d %H:%M}"


class InventoryImportItem(models.Model):
    """
    Stores each row of the imported Excel as an item.
    """
    item_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    batch = models.ForeignKey(InventoryImportBatch, on_delete=models.CASCADE, related_name="items")
    drug = models.ForeignKey(Drug, on_delete=models.PROTECT)

    quantity_in_stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=0)

    class Meta:
        unique_together = ("batch", "drug")

    def __str__(self):
        return f"{self.batch.batch_id} - {self.drug}"