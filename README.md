# 🛠️ Autofield-Technics: Development Blueprint

## 🎯 Mission
A high-performance, mobile-first web application for a Johannesburg-based mechanic service. The goal is to convert roadside emergencies into customers via a seamless **"Request Quote"** to **"WhatsApp"** workflow.

---

## 🏗️ The Tech Stack
* **Framework:** Next.js 15 (App Router)
* **Styling:** Tailwind CSS v4 (CSS-variable-first)
* **Database:** Supabase (PostgreSQL + RLS)
* **Auth:** Supabase Auth (cookie-based via `@supabase/ssr`)
* **Containerization:** Docker (Standardized environment)
* **AI Collaboration:** OpenCode CLI (Guided by custom context)

---

## 📂 Project Architecture & Context Files

| File | Purpose | What to do with it |
| :--- | :--- | :--- |
| `designTokens.ts` | Brand colors & spacing. | Update here **first** if changing the look. |
| `app/globals.css` | Tailwind v4 Theme & Utilities. | Defines `@utility` classes like `btn-primary`. |
| `.opencode-context.md` | AI Instructions & App Story. | Read this to see what has already been built. |
| `.opencode-rules.json` | Coding standards. | Enforces "No Hardcoding" rules for the AI. |
| `schema.sql` | Database blueprint. | Update this whenever you change a Supabase table. |
| `types/database.ts` | Supabase type definitions. | Update when adding new tables or columns. |
| `start-project.ps1` | The "Start" button. | Runs Docker and checks your environment. |

---

## 🚀 Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_WHATSAPP_NUMBER=27XXXXXXXXX        # No + or spaces
NEXT_PUBLIC_MECHANIC_USER_ID=your_admin_uid    # Supabase auth uid of admin account
```

### 2. Launch the Engine
```powershell
.\start-project.ps1
```
Choose **Option 1** to start the dev server at [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Database Tables (Supabase)

| Table | Purpose | RLS |
| :--- | :--- | :--- |
| `profiles` | One-to-one with auth.users. Stores `full_name`, `phone`, `role` (`client`/`admin`), `onboarding_completed`. | ✅ Users see own row only |
| `vehicles` | Customer vehicles linked to profiles via `user_id`. Columns: `make`, `model`, `year`. | ✅ Users see own rows only |
| `quotes` | Quote requests submitted via the quote form. Columns: `service_type`, `description`, `status`, `customer_name`, `customer_phone`. | ✅ Users see own, anon can insert |
| `reviews` | Customer reviews. Require admin approval before showing publicly. Columns: `customer_name`, `vehicle_serviced`, `rating`, `review_text`, `status`. | ✅ Public reads approved only |
| `receipts` | Payment receipts linked to quotes. Columns: `amount_paid`, `job_date`, `payment_method`, `invoice_number`. | ✅ Users see own rows only |
| `appointments` | Bookings linked to quotes and profiles via `user_id`. Columns: `service_type`, `scheduled_date`, `scheduled_time`, `status`, `notes`. | ✅ Users see own rows only |
| `services` | Service catalogue (name, price, category). | Public read |
| `analytics` | Monthly stats per user. | ✅ Users see own rows only |

> **Rule:** Whenever you add or alter a table in Supabase Dashboard, update `schema.sql` AND `types/database.ts` to keep everything in sync.

### Column naming gotchas
| Table | Use this | Not this |
| :--- | :--- | :--- |
| `vehicles` | `user_id` | `profile_id` |
| `receipts` | `amount_paid` | `amount` |
| `receipts` | `job_date` | `created_at` |
| `appointments` | `scheduled_date` + `scheduled_time` | `scheduled_at` |
| `reviews` | `review_text` | `comment` |

---

## 🔐 Auth & Route Protection

Auth is handled by `middleware.ts` using `@supabase/ssr`.

| Route | Access |
| :--- | :--- |
| `/` `/services` `/quote` `/reviews` | Public |
| `/client-dashboard/*` | Logged-in users with `onboarding_completed = true` |
| `/admin/*` | Users with `role = 'admin'` only |
| `/onboarding/*` | Logged-in users who haven't completed onboarding |
| `/signin` `/signup` | Redirects away if already logged in |

---

## 🎨 Styling Protocol (Tailwind v4)

**Token-to-Utility workflow — no hardcoded hex values in `.tsx` files.**

| Token | Class | Value |
| :--- | :--- | :--- |
| Primary Blue | `bg-primary` / `text-primary` | `#5B9BD5` |
| Deep Grey | `text-grey` | `#595959` |
| Light Grey bg | `bg-grey-lightest` | |
| Border | `border-grey-medium` | |

**Pre-built utility classes:**
- Buttons: `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-white`
- Layout: `card`, `heading-1`, `text-body`, `text-small`
- Radius: `rounded-base`
- Shadow: `shadow-base`

---

## 📁 Component Structure

```
components/
  common/         # Header, Footer — site-wide
  features/       # Page-level widgets
    admin/        # Admin dashboard widgets
      QuotesInbox.tsx
      AdminCustomers.tsx
      AdminInvoices.tsx
    user/         # User dashboard widgets
      UserQuotes.tsx        # Real data — queries quotes table by user_id
      UserAppointments.tsx  # Real data — queries appointments table by user_id
      UserInvoices.tsx      # Real data — queries receipts table by user_id
    Hero.tsx
    ServicesHero.tsx
    ReviewForm.tsx          # Inserts to reviews table; vehicle_serviced + review_text columns
  ui/             # Atomic base components
    button.tsx
    Breadcrumb.tsx
  AdminNav.tsx
  AdminStats.tsx
  ReviewCard.tsx
  QuoteForm.tsx
```

---

## 🛣️ Roadmap

- [x] Project scaffolding & Docker setup
- [x] Design Tokens & Brand Identity
- [x] Floating Header & Reusable Button
- [x] Hero Section Widget (with/without image)
- [x] Reviews page — form + live approved reviews from Supabase
- [x] Quote page — multi-field form → saves to Supabase → WhatsApp redirect
- [x] Admin Dashboard — quotes inbox, stats, customers, invoices
- [x] User Dashboard — real data wired (quotes, appointments, invoices)
- [x] Supabase server client (`lib/supabaseServer.ts`)
- [x] Route protection via middleware (admin vs client vs public)
- [x] `appointments` table — schema, RLS policies, types, and widget
- [x] `types/database.ts` — all tables typed and in sync with schema
- [ ] Services Data Layer (`lib/data/services.ts`)
- [ ] Admin review approval UI
- [ ] Appointment booking form from user dashboard
- [ ] Auth pages (sign in, sign up, onboarding)

---

## 🤝 Collaboration Workflow (Partner Protocol)

* **Check Context:** Before building a new feature, check `.opencode-context.md`.
* **Use Widgets:** Build UI pieces in `components/features/` or `components/ui/`.
* **Update SQL:** If you change a table in Supabase Dashboard, update `schema.sql`.
* **Update Types:** After any schema change, update `types/database.ts` to match.
* **Branch naming:** `feature/what-it-does` — always branch off `main`, never commit directly.
* **No Hardcoding:** Never use hex codes in `.tsx` files. Use the brand variable classes.

---

## 🧠 Architecture Notes

### Widgetized Approach
UI is broken into small, self-contained widgets rather than large monolithic pages. Each widget accepts props so it can be reused across pages.

### Server vs Client Components
- **Server Components** (no `'use client'`): pages that fetch from Supabase. Data fetching stays at the page level and passes `userId` down to widgets as a prop.
- **Client Components** (`'use client'`): anything with form state, interactivity, or event handlers (e.g. `ReviewForm`, `QuoteForm`, `QuotesInbox`).

### Two Supabase Clients
| Client | File | Used for |
| :--- | :--- | :--- |
| `supabase` | `lib/supabase.ts` | Client components — uses anon key, respects RLS |
| `createSupabaseServerClient()` | `lib/supabaseServer.ts` | Server components — uses session cookies, respects RLS |
| `createSupabaseAdminClient()` | `lib/supabaseServer.ts` | Admin pages only — uses service role key, bypasses RLS |

### TypeScript & Supabase Types
Supabase query results are typed via `types/database.ts`. When the inferred type resolves to `never` (table not yet in the types file), cast the result explicitly:

```ts
const { data } = await supabase
  .from('appointments')
  .select('id, service_type, scheduled_date')
  .eq('user_id', userId) as { data: Appointment[] | null }
```

The long-term fix is to keep `types/database.ts` in sync after every schema change, or regenerate it with:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```