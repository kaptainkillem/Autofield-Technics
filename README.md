# 🛠️ Autofield-Technics: Development Blueprint

## 🎯 Mission
A high-performance, mobile-first web application for a Johannesburg-based mechanic service. The goal is to convert roadside emergencies into customers via a seamless **"Request Quote"** to **"WhatsApp"** workflow.

---

## 🏗️ The Tech Stack
* **Framework:** Next.js 15 (App Router)
* **Styling:** Tailwind CSS v4 (CSS-variable-first)
* **Database:** Supabase (PostgreSQL)
* **Containerization:** Docker (Standardized environment)
* **AI Collaboration:** OpenCode CLI (Guided by custom context)

---

## 📂 Project Architecture & Context Files
This project uses a **"Single Source of Truth"** system to stay organized. **Do not hardcode styles or logic.**

| File | Purpose | What to do with it |
| :--- | :--- | :--- |
| `designTokens.ts` | Brand colors & spacing. | Update here **first** if changing the look. |
| `app/globals.css` | Tailwind v4 Theme & Utilities. | Defines `@utility` classes like `btn-primary`. |
| `.opencode-context.md` | AI Instructions & App Story. | Read this to see what has already been built. |
| `.opencode-rules.json` | Coding standards. | Enforces "No Hardcoding" rules for the AI. |
| `schema.sql` | Database blueprint. | Update this whenever you change a Supabase table. |
| `start-project.ps1` | The "Start" button. | Runs Docker and checks your environment. |

---

## 🚀 Getting Started

### 1. Environment Setup
You **must** create your own local environment file.
1.  Copy `.env.example` to `.env.local`.
2.  Add your Supabase project keys and Resend API key.
3.  **Note:** `.env.local` is git-ignored and should never be committed.

### 2. Launch the Engine
We use Docker to ensure we are both working in the same environment.

```powershell
.\start-project.ps1
Choose **Option 1** to start the dev server at [http://localhost:3000](http://localhost:3000).

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

### 🛣️ Roadmap
- [x] Project scaffolding & Docker setup
- [x] Design Tokens & Brand Identity
- [x] Floating Header & Reusable Button
- [x] Hero Section Widget (with/without image)
- [ ] Services Data Layer (`lib/data/services.ts`)
- [ ] Quote Request Form (with WhatsApp redirect)
- [ ] Admin Dashboard (Quote tracking & Receipts)

## 🧠 Architecture & Methodology

### 🧩 Why a "Widgetized" Approach?
We follow a **Widget-based architecture**. This means the UI is broken down into small, self-contained units (Widgets) rather than large, monolithic pages.

1. **Reusability:** The `Hero` or `ServiceCard` widget can be used on the Home page, the Services page, or a landing page without rewriting code.
2. **AI-Friendly:** OpenCode works best with small, focused files. It is less likely to make mistakes when editing a single widget than when editing a 500-line page.
3. **Decoupled Logic:** You can change the "Look" of the Hero in one file, and it updates across the entire site instantly.

---

### 📂 File-Specific Logic (The "Why")

| File / Folder | Responsibility | Why it exists |
| :--- | :--- | :--- |
| `components/ui/` | **Atomic Components** | Base elements like `Button.tsx` and `Input.tsx`. These are the "bricks" of the house. |
| `components/features/` | **Widgets** | Complex sections like `Hero.tsx` or `QuoteForm.tsx`. These are the "rooms" of the house. |
| `lib/data/` | **Mock/Static Data** | Centralized files like `services.ts`. It ensures the AI and Humans use the same names/prices. |
| `designTokens.ts` | **The Brain** | Holds our brand colors and spacing. It prevents "Color Creep" (using 5 different shades of blue). |
| `app/globals.css` | **The Style Bridge** | Connects our Design Tokens to Tailwind v4 utilities. This is where `@utility` lives. |

---

### 🛠️ Our Coding Protocol
1. **Tokens First:** If a color isn't in `designTokens.ts`, don't use it.
2. **Mobile First:** Every widget must look perfect on a phone before we check the desktop view.
3. **Prop-Driven:** Widgets should accept props (e.g., `title`, `showImage`) so they can adapt to different pages.
4. **No Side-Effects:** A widget should focus on UI. Keep database calls in "Server Components" at the page level when possible.