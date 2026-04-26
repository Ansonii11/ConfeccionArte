# ConfeccionArte - Project Overview

ConfeccionArte (formerly MAISON BRUT) is an e-commerce platform built with Astro, focusing on a brutalist aesthetic. It features a landing page, a product catalog, and a protected admin panel for inventory management.

## 🛠 Technology Stack

- **Frontend Framework**: [Astro 6.x](https://astro.build/) (Server-Side Rendering mode)
- **UI Components**: Astro Components & [React](https://react.dev/) (primarily for complex admin forms)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Adapter**: `@astrojs/node` (standalone mode)

## 📁 Project Structure

- `src/pages/`: Contains all routes.
    - `index.astro`: Main landing page.
    - `catalogo.astro`: Product listing with filtering.
    - `producto/[slug].astro`: Dynamic product detail pages.
    - `admin/`: Protected administration dashboard.
    - `api/`: Server-side API endpoints (e.g., click tracking).
- `src/components/`: Reusable Astro and React components.
    - `admin/`: Admin-specific React components like `ProductForm.tsx`.
- `src/lib/`: Core utilities and types.
    - `supabase.ts`: Client-side Supabase instance.
    - `supabaseServer.ts`: Server-side Supabase client with SSR cookie handling.
    - `types.ts`: TypeScript definitions generated from the Supabase schema.
- `src/middleware.ts`: Handles authentication and route protection for the `/admin` scope.
- `database-setup.sql`: SQL migrations and schema definitions for Supabase.

## 🚀 Key Commands

| Command | Action |
| :--- | :--- |
| `bun dev` | Starts the local development server at `localhost:4321` |
| `bun build` | Builds the production site (SSR Node output) |
| `bun preview` | Previews the production build locally |
| `bun astro check` | Runs Astro's diagnostic check |

## 💡 Development Conventions

- **Branding**: The project is currently transitioning to the **ConfeccionArte** brand. Use CamelCase/PascalCase for the name, though it often appears in `uppercase` via CSS.
- **SSR & Auth**: Most pages are rendered on the server. Authentication is handled via Supabase SSR in the middleware.
- **Analytics**: Product clicks are tracked via a custom API endpoint (`/api/track-click`) and stored in the `product_clicks` table.
- **Database**: When modifying the schema, ensure the `database-setup.sql` and `src/lib/types.ts` are kept in sync.

## 🔑 Environment Variables

The following variables are required in a `.env` file (not committed):
- `PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous API key.
