# Auth ER Diagram (Hybrid Model)

This repository includes a simple PlantUML ER diagram for the hybrid authentication model: a centralized `auth_user` table with separate `student_profile` and `admin_profile` tables for role-specific data.

Files added:

- `docs/auth-er.puml` — PlantUML source describing the ER.

How the model works (summary):

- `auth_user` holds all authentication-related fields (email, phone, password_hash, provider, role, verification flags, active status, last_login, timestamps).
- `student_profile` and `admin_profile` are one-to-one profiles containing fields specific to students or admins respectively. Each profile references `auth_user` via `auth_user_id`.
- `token` stores issued JWTs (or device sessions) linked to `auth_user` (supports logout / revocation).
- `verification_token` stores short-lived tokens for email/phone verification and password-reset flows.
- `permission` and `admin_permission` allow mapping permissions to admins (or admin roles).

Why this structure:

- Centralizing authentication simplifies login, password reset, token management, and social logins while keeping large, role-specific fields in their own tables.
- Approval flow: `student_profile.approval_status`, `approved_by` (admin `auth_user.id`) and `approved_at` support the flow where students register and admins approve.

How to view the diagram:

1. If you have PlantUML installed locally (or use an online PlantUML viewer), render the diagram:

```powershell
# using plantuml jar
java -jar plantuml.jar docs\auth-er.puml
# or if plantuml is on PATH
plantuml docs\auth-er.puml
```

2. Or paste the contents of `docs/auth-er.puml` into an online PlantUML editor (https://www.plantuml.com/plantuml/)

Notes / next steps (not implemented):

- If you want, I can draft the corresponding `prisma` models (schema.prisma) for this ER as a migration plan.
- I can also produce an SVG/PNG export of the diagram if you want the image file in the repo.

If you want changes to the diagram (additional fields, approvals history table, role-permission mapping), tell me which parts to expand and I'll update the `.puml` source.
