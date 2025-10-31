# ER Diagram Analysis & Required Changes

## Executive Summary

The refactored ER diagram is comprehensive but has several optimization opportunities and architectural improvements that should be considered before implementing in Prisma schema.

---

## 1. DATA CONSOLIDATION OPPORTUNITIES

### 1.1 Social Login IDs - Move to auth_user

**Current State**: StudentProfile has `google_id`, `facebook_id`
**Issue**: Social login IDs should be at auth_user level, not student-specific
**Rationale**:

- A user can login with Google/Facebook regardless of profile type (admin, student, teacher, etc.)
- Currently only captures social IDs for students, ignores admin/teacher social logins
- Duplicates with `provider_id` field

**Recommended Change**:

```prisma
// In auth_user - REPLACE provider_id with comprehensive social ID fields
provider_id : VARCHAR (nullable) // Keep for current provider session
google_id : VARCHAR (nullable, unique)
facebook_id : VARCHAR (nullable, unique)
// Remove from student_profile
```

**Affected**: StudentProfile (remove `google_id`, `facebook_id`), AdminProfile (add ability to track if needed)

---

### 1.2 Login Device Tracking - Consolidate

**Current State**:

- `auth_user.max_login_device` - max allowed
- `student_profile.max_login_device` - DUPLICATE field
- No tracking of actual active devices

**Issue**: Duplicate field in both tables
**Rationale**: Max login devices is a system-wide setting per user, not profile-specific

**Recommended Change**:

```prisma
// In auth_user
max_login_device : INTEGER (max devices allowed)

// Create new table for active device tracking
entity "user_device" as user_device {
  * id : UUID
  auth_user_id : UUID <<FK>>
  device_name : VARCHAR
  device_type : VARCHAR (MOBILE, TABLET, DESKTOP, etc)
  last_active : TIMESTAMP
  created_at : TIMESTAMP
}

// REMOVE from student_profile
```

**Affected**: StudentProfile (remove duplicate), create new UserDevice table

---

### 1.3 Verification Status Fields - Consolidate

**Current State**:

- `auth_user.is_email_verified`, `is_mobile_verified`
- `student_profile.is_email_verified`, `is_mobile_verified` - DUPLICATE

**Issue**: Same verification flags exist in both auth_user and student_profile
**Rationale**: Verification is tied to auth credentials, not profile type

**Recommended Change**:

```prisma
// Keep in auth_user (source of truth)
is_email_verified : BOOLEAN
is_mobile_verified : BOOLEAN

// REMOVE from student_profile completely
// Create verification_log table instead to track history
entity "verification_log" as verification_log {
  * id : UUID
  auth_user_id : UUID <<FK>>
  type : ENUM (EMAIL, PHONE, ACCOUNT)
  verified_at : TIMESTAMP
  verification_method : VARCHAR
}
```

**Affected**: StudentProfile (remove duplicate verification fields)

---

### 1.4 Last Login Tracking - Centralize

**Current State**:

- `auth_user.last_login` - general
- `student_profile.last_login_date` - profile-specific

**Issue**: Inconsistent naming and dual tracking
**Rationale**: Last login is authentication event, not profile-specific

**Recommended Change**:

```prisma
// In auth_user - standardize naming
last_login_at : TIMESTAMP (nullable)

// REMOVE from student_profile
// Optional: Create login_history table for audit trail
entity "login_history" as login_history {
  * id : UUID
  auth_user_id : UUID <<FK>>
  login_at : TIMESTAMP
  logout_at : TIMESTAMP (nullable)
  ip_address : VARCHAR
  user_agent : VARCHAR
  device_id : UUID <<FK>> (optional, from user_device)
}
```

**Affected**: StudentProfile (remove `last_login_date`), create LoginHistory table

---

## 2. MISSING AUDIT & SECURITY FIELDS

### 2.1 Password Management

**Current State**: Only `password_hash` in auth_user
**Missing**:

- `password_changed_at` exists in StudentProfile but should be in auth_user
- No password attempt tracking
- No password expiry mechanism

**Recommended Additions**:

```prisma
// In auth_user
password_hash : VARCHAR
password_changed_at : TIMESTAMP (nullable)
password_expires_at : TIMESTAMP (nullable)
// Optional: Allow forced password change on next login
require_password_change : BOOLEAN (default false)
```

**Affected**: auth_user (add fields), StudentProfile (remove `password_changed_at`)

---

### 2.2 Account Deletion & Archival

**Current State**: Only `is_active` flag
**Missing**:

- Soft delete capability
- Deletion reason tracking
- Data retention policies
- Account archival

**Recommended Additions**:

```prisma
// In auth_user
is_active : BOOLEAN
deleted_at : TIMESTAMP (nullable) // For soft deletes
deletion_reason : VARCHAR (nullable)
archived_at : TIMESTAMP (nullable)

// Optional: Create account_audit table
entity "account_audit" as account_audit {
  * id : UUID
  auth_user_id : UUID <<FK>>
  event_type : ENUM (LOGIN, LOGOUT, PASSWORD_CHANGE, ACCOUNT_LOCKED, DELETED)
  timestamp : TIMESTAMP
  details : JSON
}
```

**Affected**: auth_user (add fields), create AccountAudit table

---

### 2.3 Account Lockout & Security

**Current State**: Account has `status` but mechanism unclear
**Missing**:

- Failed login attempt tracking
- Account lockout logic
- Security flags

**Recommended Additions**:

```prisma
// In auth_user
failed_login_attempts : INTEGER (default 0)
locked_until : TIMESTAMP (nullable)
locked_reason : VARCHAR (nullable)
is_suspicious : BOOLEAN (default false)
suspicious_reason : VARCHAR (nullable)
```

**Affected**: auth_user (add security fields)

---

## 3. RELATIONSHIP OPTIMIZATION

### 3.1 StudentProfile Approval Chain

**Current State**:

```
student_profile.approved_by : UUID (FK to auth_user)
student_profile.approved_at : TIMESTAMP
```

**Issue**: No history of rejections, no intermediate approvals, no rejection reason
**Rationale**: Approval workflow may have multiple stages (admin → owner), rejection history important

**Recommended Change**:

```prisma
// Create approval_workflow table
entity "approval_workflow" as approval_workflow {
  * id : UUID
  student_profile_id : UUID <<FK>>
  approved_by_id : UUID <<FK>>
  status : ENUM (PENDING, APPROVED, REJECTED, RESUBMITTED)
  reason : TEXT (nullable) // For rejections
  approved_at : TIMESTAMP (nullable)
  created_at : TIMESTAMP
}

// In student_profile - just status summary
approval_status : ENUM (PENDING, APPROVED, REJECTED)
```

**Affected**: Create ApprovalWorkflow table, refactor StudentProfile

---

### 3.2 Permission Assignment Tracking

**Current State**:

```
admin_permission.is_active, created_at, updated_at
```

**Missing**:

- Who assigned the permission
- Revocation reason
- Permission scope/limitations

**Recommended Additions**:

```prisma
entity "admin_permission" as admin_permission {
  id : UUID
  admin_profile_id : UUID <<FK>>
  permission_id : UUID <<FK>>
  is_active : BOOLEAN
  assigned_by_id : UUID <<FK>> (who assigned)
  assigned_at : TIMESTAMP
  revoked_at : TIMESTAMP (nullable)
  revocation_reason : VARCHAR (nullable)
  scope : JSON (optional - permission limitations)
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}
```

**Affected**: AdminPermission table (add audit fields)

---

### 3.3 User Role Hierarchy

**Current State**:

```
auth_user.role : ENUM (OWNER, ADMIN, TEACHER, STUDENT, CLIENT)
```

**Issue**: No hierarchy definition, no role-specific settings
**Rationale**: Need to define which roles can do what

**Recommended Addition**:

```prisma
// Create role_hierarchy table
entity "role_hierarchy" as role_hierarchy {
  * id : UUID
  role : ENUM (OWNER, ADMIN, TEACHER, STUDENT, CLIENT)
  parent_role : ENUM (nullable) // For hierarchy
  max_users : INTEGER (nullable)
  permissions : JSON (role-default permissions)
  is_system_role : BOOLEAN
  created_at : TIMESTAMP
}
```

**Affected**: Create RoleHierarchy table, keep role in auth_user

---

## 4. REFINE PAYMENT TABLE

### 4.1 Payment Table Issues

**Current State**:

```
payment {
  student_id : UUID <<FK>>
  class_id : UUID <<FK>>
  email : VARCHAR
  month : VARCHAR
  type : VARCHAR
  inp : VARCHAR
  status : VARCHAR
}
```

**Issues**:

- `email` is redundant (get from student via auth_user)
- `month` should be DATE type
- `type` and `inp` fields unclear (what is INP?)
- Missing payment amount
- Missing payment method
- Missing transaction details

**Recommended Refactor**:

```prisma
entity "payment" as payment {
  * id : UUID
  student_id : UUID <<FK>>
  class_id : UUID <<FK>>
  amount : DECIMAL(10,2)
  currency : VARCHAR (default "USD")
  payment_date : DATE
  payment_type : ENUM (TUITION, REGISTRATION, EXAMINATION, OTHER)
  payment_method : VARCHAR (CARD, BANK_TRANSFER, CASH, UPI, etc)
  invoice_number : VARCHAR (unique)
  status : ENUM (PENDING, COMPLETED, FAILED, REFUNDED)
  transaction_id : VARCHAR (nullable)
  details : JSON (additional payment details)
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}
```

**Affected**: Payment table (significant refactor)

---

## 5. SITE_SETTING & CONTROL_SETTING REFINEMENT

### 5.1 Site Settings Structure

**Current State**:

```
site_setting {
  site_regular_field : JSON
  extra_register_field : JSON
}
```

**Issues**:

- Too vague, no field definitions
- No versioning
- No activation/deactivation

**Recommended Refactor**:

```prisma
entity "site_setting" as site_setting {
  * id : UUID
  key : VARCHAR (unique) // e.g., "registration_fields", "email_template"
  value : JSON
  description : VARCHAR (nullable)
  is_active : BOOLEAN
  required_for : ENUM (STUDENT, ADMIN, TEACHER) // nullable for global
  version : INTEGER (default 1)
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}
```

**Affected**: SiteSetting table (add key-value structure)

---

### 5.2 Control Settings Clarity

**Current State**:

```
control_setting {
  maximum_student : INTEGER
  values : JSON
  is_handled : BOOLEAN
  status : VARCHAR
}
```

**Issues**:

- `values` too generic
- `is_handled` unclear meaning
- `status` unclear purpose

**Recommended Refactor**:

```prisma
entity "control_setting" as control_setting {
  * id : UUID
  key : VARCHAR (unique) // e.g., "max_students", "fee_structure"
  value : JSON
  description : VARCHAR (nullable)
  scope : ENUM (SYSTEM, DEPARTMENT, CLASS) // Where setting applies
  is_active : BOOLEAN
  updated_by_id : UUID <<FK>>
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}
```

**Affected**: ControlSetting table (clarify structure)

---

## 6. MISSING TABLES & ENTITIES

### 6.1 Recommended New Tables

**Classes/Courses**:

```prisma
entity "class" as class {
  * id : UUID
  name : VARCHAR
  description : TEXT
  teacher_id : UUID <<FK>>
  capacity : INTEGER
  schedule : JSON
  status : VARCHAR
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}
```

**Class Enrollment**:

```prisma
entity "class_enrollment" as class_enrollment {
  * id : UUID
  student_id : UUID <<FK>>
  class_id : UUID <<FK>>
  enrolled_at : TIMESTAMP
  status : ENUM (ACTIVE, COMPLETED, DROPPED)
}
```

**Documents/Certificates**:

```prisma
entity "certificate" as certificate {
  * id : UUID
  student_id : UUID <<FK>>
  class_id : UUID <<FK>>
  certificate_url : VARCHAR
  issue_date : DATE
  expiry_date : DATE (nullable)
}
```

---

## 7. SUMMARY OF CHANGES NEEDED

### CONSOLIDATIONS (Remove Duplicates):

- [ ] Move `google_id`, `facebook_id` from StudentProfile → auth_user
- [ ] Remove duplicate `max_login_device` from StudentProfile
- [ ] Remove duplicate verification flags from StudentProfile
- [ ] Remove `last_login_date` from StudentProfile (use auth_user.last_login_at)
- [ ] Move `password_changed_at` from StudentProfile → auth_user

### ADDITIONS (New Fields/Tables):

- [ ] Add password management fields to auth_user
- [ ] Add security fields to auth_user (lockout, failed attempts, etc.)
- [ ] Create `UserDevice` table for device tracking
- [ ] Create `VerificationLog` table for verification history
- [ ] Create `LoginHistory` table for audit trail
- [ ] Create `AccountAudit` table for account events
- [ ] Create `ApprovalWorkflow` table for approval history
- [ ] Create `RoleHierarchy` table for role definitions
- [ ] Create `Class` table for course management
- [ ] Create `ClassEnrollment` table for student enrollment
- [ ] Create `Certificate` table for credentials

### REFACTORING (Clarify/Improve):

- [ ] Refactor `Payment` table (clarify fields, add missing data)
- [ ] Refactor `SiteSetting` to key-value structure
- [ ] Refactor `ControlSetting` to key-value structure
- [ ] Update `AdminPermission` with audit trail
- [ ] Improve `StudentProfile.extra_details` and `delivery_details` JSON structure

### DELETIONS (Remove from StudentProfile):

- [ ] `google_id`
- [ ] `facebook_id`
- [ ] `max_login_device`
- [ ] `is_email_verified`
- [ ] `is_mobile_verified`
- [ ] `last_login_date`
- [ ] `password_changed_at`

---

## 8. PRIORITY LEVELS

### CRITICAL (Must do before schema update):

1. Remove duplicate fields from StudentProfile
2. Add password management fields to auth_user
3. Move social login IDs to auth_user
4. Clarify Payment, SiteSetting, ControlSetting structures

### HIGH (Should do with schema update):

1. Create device tracking (UserDevice)
2. Create approval workflow tracking
3. Create login history
4. Update AdminPermission with audit trail
5. Create RoleHierarchy

### MEDIUM (Can do in future):

1. Create class management tables
2. Create enrollment tracking
3. Create certificate system
4. Create account audit trail

### LOW (Nice to have):

1. Verification log table
2. Additional security enhancements

---

## 9. RECOMMENDED FINAL STRUCTURE

```
auth_user (30-35 fields)
├─ core: id, email, phone_number
├─ credentials: password_hash, provider, provider_id, google_id, facebook_id
├─ status: is_active, account_status, deleted_at
├─ verification: is_email_verified, is_mobile_verified
├─ security: failed_login_attempts, locked_until, is_suspicious
├─ password: password_changed_at, password_expires_at, require_password_change
├─ device: max_login_device, last_login_at
├─ profile: role, type, theme_mode, student_profile_id, admin_profile_id
├─ tokens: tokens (JSON), verification_tokens (JSON)
└─ audit: created_at, updated_at

student_profile (20-22 fields)
├─ auth_user_id <<FK>>
├─ personal: first_name, last_name, dob, gender, profile_picture
├─ contact: mobile_no, whatsapp_no
├─ academic: year, nic, nic_pic, register_code, is_extra_class
├─ enrollment: sign_up_via, pinch_id
├─ account: is_account_verified, is_profile_completed, status
├─ approval: approval_status, approved_by, approved_at
├─ flexible: extra_details (JSON), delivery_details (JSON)
└─ audit: created_at, updated_at

admin_profile (10 fields)
├─ auth_user_id <<FK>>
├─ personal: first_name, last_name, email, contact_no, whatsapp_no, image
├─ admin: type, status, created_by <<FK>>
└─ audit: created_at, updated_at

Supporting Tables:
├─ user_device (device tracking)
├─ login_history (audit trail)
├─ account_audit (account events)
├─ approval_workflow (approval history)
├─ role_hierarchy (role definitions)
├─ permission (4 fields)
├─ admin_permission (8 fields with audit)
├─ invitation (10 fields)
├─ site_setting (key-value pairs)
├─ control_setting (key-value pairs)
├─ payment (updated structure)
├─ class (optional)
├─ class_enrollment (optional)
└─ certificate (optional)
```
