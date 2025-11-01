-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'STUDENT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED', 'PENDING');

-- CreateEnum
CREATE TYPE "VerificationTokenType" AS ENUM ('VERIFY_EMAIL', 'VERIFY_PHONE', 'PASSWORD_RESET', 'INVITE_ADMIN');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');

-- CreateTable
CREATE TABLE "auth_users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone_number" TEXT NOT NULL,
    "whatsapp_number" TEXT,
    "password_hash" TEXT NOT NULL,
    "password_changed_at" TIMESTAMP(3),
    "provider" "Provider" NOT NULL DEFAULT 'LOCAL',
    "provider_id" TEXT,
    "google_id" TEXT,
    "facebook_id" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "type" TEXT DEFAULT 'fee',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_mobile_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_account_verified" BOOLEAN NOT NULL DEFAULT false,
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login" TIMESTAMP(3),
    "max_login_device" INTEGER,
    "theme_mode" TEXT DEFAULT 'LIGHT',
    "student_profile_id" TEXT,
    "admin_profile_id" TEXT,
    "tokens" JSONB NOT NULL DEFAULT '[]',
    "verification_tokens" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "profile_picture" TEXT,
    "sign_up_via" TEXT,
    "push_id" TEXT,
    "year" INTEGER,
    "nic" TEXT,
    "nic_pic" TEXT,
    "register_code" TEXT,
    "is_profile_completed" BOOLEAN NOT NULL DEFAULT false,
    "approval_status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "status" TEXT,
    "extra_details" JSONB,
    "delivery_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "type" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_permissions" (
    "id" TEXT NOT NULL,
    "admin_profile_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "invited_by_id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "preassigned_perms" JSONB,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "accepted_by_id" TEXT,
    "accepted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_email_key" ON "auth_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_phone_number_key" ON "auth_users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_google_id_key" ON "auth_users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_facebook_id_key" ON "auth_users"("facebook_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_student_profile_id_key" ON "auth_users"("student_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_admin_profile_id_key" ON "auth_users"("admin_profile_id");

-- CreateIndex
CREATE INDEX "auth_users_phone_number_idx" ON "auth_users"("phone_number");

-- CreateIndex
CREATE INDEX "auth_users_email_idx" ON "auth_users"("email");

-- CreateIndex
CREATE INDEX "auth_users_is_active_idx" ON "auth_users"("is_active");

-- CreateIndex
CREATE INDEX "auth_users_role_idx" ON "auth_users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_auth_user_id_key" ON "student_profiles"("auth_user_id");

-- CreateIndex
CREATE INDEX "student_profiles_auth_user_id_idx" ON "student_profiles"("auth_user_id");

-- CreateIndex
CREATE INDEX "student_profiles_approval_status_idx" ON "student_profiles"("approval_status");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_auth_user_id_key" ON "admin_profiles"("auth_user_id");

-- CreateIndex
CREATE INDEX "admin_profiles_auth_user_id_idx" ON "admin_profiles"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "admin_permissions_admin_profile_id_idx" ON "admin_permissions"("admin_profile_id");

-- CreateIndex
CREATE INDEX "admin_permissions_permission_id_idx" ON "admin_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permissions_admin_profile_id_permission_id_key" ON "admin_permissions"("admin_profile_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "invitations_status_idx" ON "invitations"("status");

-- CreateIndex
CREATE INDEX "invitations_invited_by_id_idx" ON "invitations"("invited_by_id");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_admin_profile_id_fkey" FOREIGN KEY ("admin_profile_id") REFERENCES "admin_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "auth_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
