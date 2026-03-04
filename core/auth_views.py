from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile
from .permissions import IsDoctor, IsPharmacy


def issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "role": user.profile.role,
        "username": user.username,
        "full_name": (f"{user.first_name} {user.last_name}").strip(),
        "pharmacy_id": str(user.profile.pharmacy_id) if user.profile.pharmacy_id else None,
    }


class DoctorLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        user = authenticate(
            username=request.data.get("username"),
            password=request.data.get("password"),
        )
        if not user:
            return Response({"detail": "Invalid credentials"}, status=401)

        if not hasattr(user, "profile") or user.profile.role != UserProfile.ROLE_DOCTOR:
            return Response({"detail": "Not a doctor account"}, status=403)

        return Response(issue_tokens(user), status=200)


class PharmacyLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        user = authenticate(
            username=request.data.get("username"),
            password=request.data.get("password"),
        )
        if not user:
            return Response({"detail": "Invalid credentials"}, status=401)

        if not hasattr(user, "profile") or user.profile.role != UserProfile.ROLE_PHARMACY:
            return Response({"detail": "Not a pharmacy account"}, status=403)

        return Response(issue_tokens(user), status=200)


class DoctorChangePasswordView(APIView):
    """
    POST /api/auth/doctor/change-password/
    Body: { "old_password": "...", "new_password": "...", "confirm_password": "..." }
    Doctor only.
    """
    permission_classes = [IsAuthenticated, IsDoctor]

    def post(self, request):
        old_password = request.data.get("old_password", "")
        new_password = request.data.get("new_password", "")
        confirm_password = request.data.get("confirm_password", "")

        if not old_password or not new_password or not confirm_password:
            return Response({"detail": "All fields are required."}, status=400)

        if new_password != confirm_password:
            return Response({"detail": "New password and confirm password do not match."}, status=400)

        user = request.user

        if not user.check_password(old_password):
            return Response({"detail": "Old password is incorrect."}, status=400)

        try:
            validate_password(new_password, user=user)
        except ValidationError as e:
            return Response({"detail": e.messages}, status=400)

        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password changed successfully. Please login again."}, status=200)


class PharmacyChangePasswordView(APIView):
    """
    POST /api/auth/pharmacy/change-password/
    Body: { "old_password": "...", "new_password": "...", "confirm_password": "..." }
    Pharmacy only.
    """
    permission_classes = [IsAuthenticated, IsPharmacy]

    def post(self, request):
        old_password = request.data.get("old_password", "")
        new_password = request.data.get("new_password", "")
        confirm_password = request.data.get("confirm_password", "")

        if not old_password or not new_password or not confirm_password:
            return Response({"detail": "All fields are required."}, status=400)

        if new_password != confirm_password:
            return Response({"detail": "New password and confirm password do not match."}, status=400)

        user = request.user

        if not user.check_password(old_password):
            return Response({"detail": "Old password is incorrect."}, status=400)

        try:
            validate_password(new_password, user=user)
        except ValidationError as e:
            return Response({"detail": e.messages}, status=400)

        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password changed successfully. Please login again."}, status=200)