# Samruddhi — Supabase (Postgres) Hospital Core Setup

**Purpose:** Practical, step-by-step guide to configure Supabase for the Hospital Core: tables, RLS, indexes, realtime, admin users, seeds, and integration tips for Prisma or direct Postgres clients.

---

## 1. Why Supabase for Hospital Core
- PostgreSQL provides ACID transactions, strong relational modeling, and SQL features (FKs, constraints, triggers) ideal for hospital workflows.  
- Supabase adds easy hosting, auth integration, realtime subscriptions, and a convenient dashboard for table design and migrations — great for hackathons.

---

## 2. High-level setup steps
1. Create a new Supabase project (console).  
2. Note the `POSTGRES_URL` and `anon` & `service_role` keys (store securely).  
3. Create the core tables (Hospital, Department, Doctor, Bed, Inventory, Staff, Admissions).  
4. Add indexes & constraints.  
5. Configure Row-Level Security (RLS) for multi-tenant isolation (optional for hackathon).  
6. Seed data (sample hospitals, doctors, beds).  
7. Connect backend service (Prisma or pg) using `service_role` key for admin operations and use JWT-authenticated role for runtime.

---

## 3. Recommended table schemas (no raw SQL — just column spec)

### Hospital
- `id` (uuid, PK)  
- `name` (text)  
- `city` (text)  
- `lat`, `lng` (numeric)  
- `contact_email` (text)  
- `created_at`, `updated_at` (timestamps)

### Department
- `id` (uuid, PK)  
- `hospital_id` (fk -> hospitals.id)  
- `name` (text)  
- `created_at`, `updated_at`

### Doctor
- `id` (uuid)  
- `hospital_id` (fk)  
- `department_id` (nullable fk)  
- `name` (text)  
- `specialization` (text)  
- `is_on_duty` (boolean)  
- `contact` (text)

### Bed
- `id` (uuid)  
- `hospital_id` (fk)  
- `type` (enum: general, icu, nicu, picnic?)  
- `status` (enum: free, occupied, maintenance)  
- `current_admission_id` (nullable fk to admissions)  
- `created_at`, `updated_at`

### Inventory
- `id`, `hospital_id`, `item_name`, `category`, `stock_count`, `threshold_count`, `unit`  

### Staff
- `id`, `hospital_id`, `name`, `role`, `shift_start`, `shift_end`, `is_active`

### Admissions
- `id`  
- `hospital_id`  
- `patient_id` (string or uuid mapped to EHR)  
- `bed_id`  
- `doctor_id`  
- `reason`  
- `admitted_at`  
- `discharged_at` (nullable)

---

## 4. Indexes & performance tips
- Index `hospital_id` on tables used for lookups (doctors, beds, inventory).  
- Partial index on beds for `status = 'free'` to speed up allocation queries.  
- Use connection pooling (PgBouncer or Supabase managed) if high concurrency expected.  

---

## 5. Row-Level Security (RLS) & multi-tenancy
- For MVP, you can skip RLS to move faster.  
- For a secure setup, enable RLS and create policies that allow:  
  - Admins (supabase role) to manage all data.  
  - Hospital-scoped JWTs (claim `hospital_id`) to access only rows where `hospital_id = claim.hospital_id`.

---

## 6. Realtime & subscriptions
- Supabase supports realtime replication via websockets for Postgres changes.  
- Use `realtime` to push capacity updates (beds/inventory) to dashboards.  
- Typical pattern: backend writes to DB → Supabase realtime notifies frontend subscription clients.

---

## 7. Integration with backend (Prisma or pg)
- Use the `service_role` key on the server for admin tasks (migrations, seeds).  
- For runtime requests from the gateway, authenticate users with Supabase Auth and use the client JWT to apply RLS rules when enabled.  
- Recommend Prisma for typed queries and migrations; otherwise `pg` or `knex` works fine.

---

## 8. Admin panel & auth
- Use Supabase Auth for the admin panel (email/password & SSO).  
- Create roles in a `users` table with `is_admin` and `hospital_id` fields.  
- Admin-only UI routes must check role & require `is_admin = true` and `hospital_id` match (if admin is hospital admin).

---

## 9. Seeding strategy (quick)
- Create a `seeds/` directory with JSON fixtures for hospitals, doctors, beds, and inventory.  
- Load seeds via the Supabase SQL editor or via a small seed script using `psql`/Prisma.

---

## 10. Example operations & transactional patterns
- **Admit patient**: start a DB transaction that (1) create admission, (2) mark bed as `occupied`, (3) notify realtime channel.  
- **Discharge**: mark `discharged_at`, free bed, push notification, and call EHR service to write discharge summary.

---

## 11. Backups & migrations
- Supabase provides backups; ensure you enable point-in-time recovery if available.  
- Use migrations (Prisma Migrate or SQL migration files) for schema changes; commit migration files to repo.

---

## 12. Useful Supabase console tips
- Use Table Editor for quick changes during hackathon (but prefer migrations for reproducibility).  
- Use Policies to simulate production access control once core features are stable.  
- Use Realtime dashboard to validate events are being pushed.

---

## 13. Integration checklist for frontend
- Create endpoints for the frontend to call:  
  - `GET /hospitals/:id/resources`  
  - `POST /admissions/create`  
  - `PATCH /admissions/:id/discharge`  
  - `GET /doctors?hospitalId=:id`  
- Use Supabase Realtime client in the frontend to subscribe to `beds` and `inventory` updates.

---

## 14. Next steps you can ask me to generate
- A ready-to-run `supabase` provisioning checklist with exact UI clicks and env values to copy.  
- Prisma schema file for the hospital core (ready for `prisma migrate`).  
- Detailed RLS policy examples and recommended claims mapping.

---

