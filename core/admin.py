from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Pharmacy, Patient, Drug, Prescription, PrescriptionItem, Inventory, UserProfile

admin.site.register(Pharmacy)
admin.site.register(Patient)
admin.site.register(Drug)
admin.site.register(Prescription)
admin.site.register(PrescriptionItem)
admin.site.register(Inventory)
admin.site.register(UserProfile)  # optional list view

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 1          # ✅ Add User page එකේ profile form එක පේන්න
    max_num = 1

def set_user_group(user: User):
    if not hasattr(user, "profile"):
        return

    role = user.profile.role
    group, _ = Group.objects.get_or_create(name=role)
    user.groups.clear()
    user.groups.add(group)

    # OPTIONAL: Admin role නම් staff give කරන්න
    if role == UserProfile.ROLE_ADMIN:
        user.is_staff = True
        user.save(update_fields=["is_staff"])

class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)

    def save_related(self, request, form, formsets, change):
        # ✅ first save inline profile properly
        super().save_related(request, form, formsets, change)

        # ✅ now profile exists -> group assign safe
        user = form.instance
        user.refresh_from_db()
        set_user_group(user)

admin.site.unregister(User)
admin.site.register(User, UserAdmin)