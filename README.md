# 🛠️ Autofield-Technics: Development Blueprint

## 🎯 Mission
A high-performance, mobile-first web application for a Johannesburg-based mechanic service. The goal is to convert roadside emergencies into customers via a seamless **"Request Quote"** to **"WhatsApp"** workflow.

---

## 🏗️ The Tech Stack
* **Framework:** Next.js 16 (App Router)
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
| `CHANGELOG.md` | Project history. | All major changes and fixes are recorded here. |
| `.audit/RESULTS.md` | Audit results. | Consolidated results from all 5 audit checklists. |
| `.github/workflows/deploy.yml` | Vercel CI/CD | Deploys the site on every push to `main`. |

---

## 🚀 Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG=your-workshop-slug   # For multi-deployment
NEXT_PUBLIC_SITE_URL=https://yourdomain.com             # For emails + sitemap
NEXT_PUBLIC_TIMEZONE=Africa/Johannesburg                # For availability
NEXT_PUBLIC_WHATSAPP_NUMBER=27XXXXXXXXX                 # No + or spaces
NEXT_PUBLIC_MECHANIC_USER_ID=your_admin_uid             # Supabase auth uid of admin account
RESEND_API_KEY=re_your_secret_token                     # For email sending
ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com            # Fallback admin email
AUTH_HOOK_SECRET=add_secret_token_here                  # Edge Function auth
```

### 2. Multi-Deployment (Vercel)

Each workshop gets its own Vercel deployment from the same codebase + Supabase project:

```
Vercel Project 1              Vercel Project 2
  toplifemechanics.co.za        autobahnauto.co.za
  DEFAULT_WORKSHOP_SLUG=        DEFAULT_WORKSHOP_SLUG=
    top-life-mechanics            auto-bahn-auto
```

All deployments share the same Supabase keys. Only `NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG`, `NEXT_PUBLIC_SITE_URL`, and `ADMIN_NOTIFICATION_EMAIL` are per-deployment. Branding automatically loads from that workshop's `business_settings` row.

### 3. Launch the Engine
```powershell
.\start-project.ps1
```
Choose **Option 1** to start the dev server at [http://localhost:3000](http://localhost:3000).

### 4. Prepare Supabase
1. Create a Supabase project.
2. Run `schema.sql` in the Supabase SQL Editor to create tables, policies, and triggers.
3. Apply migrations in `migrations/` in chronological order for existing projects.
4. Enable email/password Auth and the Resend provider if using email notifications.
5. Deploy the `custom-access-token` Edge Function from `supabase/functions/`.

### 🔐 Quote Token Auth Flow

The platform supports a "zero-friction" guest quote submission with a secure claim-on-sign-in flow:

1. **Guest submits quote** (unauthenticated) → DB auto-generates `quote_token` (UUID)
2. **Admin reviews** → sends quote PDF via email with `/quote/[id]?token={quoteToken}` link
3. **Guest clicks link** → sees `QuoteClaimPrompt` upsell (feature list + "Create Account" / "Sign In" buttons)
4. **User signs in** → redirected back to quote page → token validates in `customer-action/route.ts` → quote is **claimed** (`user_id` set)
5. **Authenticated user** → can now accept/decline quotes and book appointments

- Accepting/declining quotes **requires authentication** (401 for unauthenticated users)
- Booking an appointment **implies acceptance** (auto-sets status to `accepted`)
- All sensitive API routes use `supabase.auth.getUser()` for cryptographic token validation
- `quote_token` is for **claiming** only — never bypasses auth checks

### 📧 Email Template System

Workshop admins can customize all email templates:

1. Go to **Settings → Templates** in the admin dashboard
2. Select a template from the sidebar (quote_ready, appointment_confirmation, etc.)
3. Edit the subject, HTML body, and plain text version
4. Use `{{variableName}}` placeholders — click helper buttons to insert
5. Enter sample data and click **Preview** to see the rendered email
6. **Save** to override the default for your workshop, or **Reset** to revert

Templates are stored in `email_templates` per workshop. All emails track delivery status in `email_logs`.

### 🛡️ Security Features

- **Session timeout** — 30 minutes of inactivity triggers a warning modal with 1-minute countdown; "Keep me logged in" or "Log out now" buttons
- **Rate limiting** — Sign-up (3/min), sign-in (5/min), forgot-password (3/5min), reset-password (3/5min)
- **Server-side auth** — All admin API routes verify sessions with `getUser()` (crypto-validated, not just JWT)
- **Cookie hardening** — `Secure`, `HttpOnly`, `SameSite: Lax` on all auth cookies in production

### 5. Deploy to Vercel
We use GitHub Actions for CI/CD. Do not deploy manually through the Vercel dashboard.

1. Install the Vercel CLI and link the project once:
   ```bash
   npm i -g vercel
   vercel link
   ```
2. Pull environment variables into GitHub secrets:
   ```bash
   vercel env pull .env.local
   ```
   Then add the following as repository secrets at **Settings → Secrets and variables → Actions**:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` will:
   - Install dependencies
   - Run `next build`
   - Deploy to Vercel production

Production environment variables should match `.env.example` and be set in the Vercel dashboard.

### 🎨 Styling Protocol (Tailwind v4)
We use a **Token-to-Utility** workflow.

* **Primary Blue:** `#5B9BD5` (Use class `bg-primary`)
* **Deep Grey:** `#595959` (Use class `text-grey`)
* **Custom Components:** Use our pre-built `@utility` classes:
    * `btn-primary`, `btn-secondary`, `btn-ghost`
    * `card`, `heading-1`, `text-body`

### 🤝 Collaboration Workflow (Partner Protocol)
To ensure the AI code (Vibe Coding) and Manual code (Human Coding) don't conflict:

* **Check Context:** Before building a new feature, check `.opencode-context.md` to see if a component or data structure already exists.
* **Use Widgets:** Build UI pieces as reusable widgets in `components/features/` or `components/ui/`.
* **Update SQL:** If you change the database in the Supabase Dashboard, manually update `schema.sql` so the AI knows the new structure.
* **No Hardcoding:** Never use hex codes in `.tsx` files. Use the brand variable classes.

---

## 🛣️ Homepage Sections

The homepage (`app/page.tsx`) is built from reusable widget components in this order:

| Component | Purpose |
|---|---|
| `Hero` | Full-width hero with centered text on mobile, CTAs stacked |
| `ScrollingReviews` | Horizontal scrollable reviews (mobile + desktop), fetches approved reviews from Supabase |
| `FeatureShowcase` | 3 alternating image/text feature sections |
| `HowItWorks` | 3-step process grid, horizontal scroll on mobile |
| `ServicesGrid` | Category cards fetched from Supabase, horizontal scroll on mobile |
| `BottomCTA` | Dark CTA section with quote button |

**Mobile behavior:**
- `ScrollingReviews`, `HowItWorks`, `ServicesGrid` all use horizontal scroll with snap points on mobile
- Hero centers text and stacks CTAs vertically on mobile
- BottomCTA sits flush against the footer (no margin gap)

---

## 🧠 Architecture & Methodology

### 🧩 Why a "Widgetized" Approach?
We follow a **Widget-based architecture**. This means the UI is broken down into small, self-contained units (Widgets) rather than large, monolithic pages.

1. **Reusability:** The `Hero` or `ServiceCard` widget can be used on the Home page, the Services page, or a landing page without rewriting code.
2. **AI-Friendly:** OpenCode works best with small, focused files. It is less likely to make mistakes when editing a single widget than when editing a 500-line page.
3. **Decoupled Logic:** You can change the "Look" of the Hero in one file, and it updates across the entire site instantly.

### 📂 File-Folder Responsibility Map

| File / Folder | Responsibility | Why it exists |
| :--- | :--- | :--- |
| `components/ui/` | **Atomic Components** | Base elements like `Button.tsx` and `Input.tsx`. These are the "bricks" of the house. |
| `components/features/` | **Widgets** | Complex sections like `Hero.tsx`, `ReviewForm.tsx`, `ServicesGrid.tsx`. These are the "rooms" of the house. |
| `lib/site-config.ts` | **Business Config** | Centralized site-wide settings (name, phone, city, navigation, SEO). |
| `designTokens.ts` | **The Brain** | Holds our brand colors and spacing. It prevents "Color Creep" (using 5 different shades of blue). |
| `app/globals.css` | **The Style Bridge** | Connects our Design Tokens to Tailwind v4 utilities. This is where `@utility` lives. |

---

### 🛠️ Our Coding Protocol
1. **Tokens First:** If a color isn't in `designTokens.ts`, don't use it.
2. **Mobile First:** Every widget must look perfect on a phone before we check the desktop view.
3. **Prop-Driven:** Widgets should accept props (e.g., `title`, `showImage`) so they can adapt to different pages.
4. **No Side-Effects:** A widget should focus on UI. Keep database calls in "Server Components" at the page level when possible.
5. **Schema Sync:** If the live Supabase DB schema changes, update both `schema.sql` AND `types/database.ts`.
