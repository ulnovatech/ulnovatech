# Database migrations

Run SQL files against the same database as `ulndash/backend/.env` (`DB_NAME`, default `ulnovatech`).

**Competitors (required for Competition page):**

```bash
mysql -u root -p ulnovatech < migrations/001_competitors.sql
```

Or paste `001_competitors.sql` into phpMyAdmin and execute.

## Bulk import (CSV / XLSX)

- **Companies:** `POST /api/import/companies` — headers: `name` (required), `industry`, `website_url` or `website`, `has_website`, `location`, `contact_person`, `contact_method`, `contact_phone`, `contact_email`, `contact_whatsapp`, `status`, `priority`, `last_contact_date`, `notes`.
- **Competitors:** `POST /api/import/competitors` — headers: `name` (required), plus optional fields matching the `competitors` table (`threat_level`, `tags`, `strengths`, `weaknesses`, profile columns, `is_active`, `notes`). List-like fields can use commas or newlines in one cell.

Legacy Excel `.xls` (binary) is not supported; re-save as `.xlsx` or `.csv`.

**Prospects (cold-call list):**

```sql
-- paste contents of migrations/002_prospects.sql in phpMyAdmin
```

API: `GET/POST /api/prospects`, `GET /api/prospects/stats`, `PUT/DELETE /api/prospects/:id`, `POST /api/prospects/:id/convert`, `POST /api/import/prospects`.

**Admin mobile app (push + contacted tracking):**

```bash
php ulndash/backend/scripts/apply_admin_mobile_migrations.php
```

Or from repo root:

```powershell
npm run setup:admin-mobile
```

Creates `admin_devices` (FCM tokens) and `lead_contacts` (contacted workflow). See `admin-mobile/BUILD.md`.
