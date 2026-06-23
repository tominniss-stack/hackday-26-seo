# Brew Digital Client Portal & SEO Dashboard

An automated, white-labelled React reporting platform that converts raw data pipelines into interactive strategic dashboards. It empowers Brew Digital's enterprise clients with real-time performance insights, technical SEO metrics, and AI-driven commentaries validated by human analysts.

<img width="3068" height="2733" alt="SCR-20260623-naeg" src="https://github.com/user-attachments/assets/7546c534-3a4c-4348-8aea-1c5fc3d4ecb0" />


---

## Features

- **Interactive Client Hub:** Dynamic single-page dashboard displaying digital maturity trends, live analytics summaries, active tickets, and recent performance reports.
- **Section-Level AI Intros:** Automatically generated SEO visibility and crawl health narratives embedded directly as native introduction headers above analytical charts.
- **Dynamic Integrations:** Fully customisable SE Ranking API clients supporting project-level parameterization and specific client endpoint overrides.
- **Robust CSV Parsers:** Automated browser-side cleanup filters built for GA4, Google Search Console, and Screaming Frog exports that programmatically strip file header noise.
- **Non-Destructive Syncs:** Deep PostgreSQL database-level JSONB merges that prevent automatic API synchronisations from overwriting manually uploaded search data.


<img width="3070" height="5341" alt="SCR-20260623-nhki" src="https://github.com/user-attachments/assets/6b47a130-45ea-4d29-9792-67c9b945f1b8" />

---

## Quick Start

### 1. Prerequisites
Ensure you have the following installed locally:
- [Node.js (v18.x or higher)](https://nodejs.org/)
- [Supabase CLI (optional, for local DB development)](https://supabase.com/docs/guides/cli)

### 2. Installation
Clone the repository and install dependencies inside the `my-app` directory:
```bash
git clone https://github.com/tinniss-brew/hackday-26-seo.git
cd seo-dashboard/my-app
npm install


3. Environment Setup
Create a .env.local file in the root of the my-app directory and populate it with your Supabase keys and database details:

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

4. Running the Project
Start the Next.js development server:

npm run dev

Open http://localhost:3000 in your browser to view the application.

To run a production-optimised build:

npm run build
npm run start

Design & Architecture Overview
For a detailed breakdown of our Next.js architecture, folder structure, database schemas, and our blueprint for enterprise scale (including asynchronous Python backend parsing microservices), please refer to our comprehensive Handoff Documentation.

