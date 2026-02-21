---
description: Project rules, guidelines, and context for AI agents working on the Transparency Flights Tracker.
---

# Transparency Flights Tracker - Agent Context

## Project Overview

This project is a Next.js (App Router) dashboard tailored for tracking flights in Venezuela. It focuses on visual clarity, atomic design principles, and automated data synchronization.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS v4 (Vanilla CSS variables)
- **Database**: Supabase (PostgreSQL)
- **Internationalization**: `next-intl`
- **Theming**: `next-themes` (Dark/Light mode)

## Design Principles

1. **Atomic Design**: All UI components must be broken down into atoms (`Button`, `Icon`, `Badge`), molecules, and organisms. Place these in `components/atoms/`, etc.
2. **Dark Mode First**: Ensure all styling uses `dark:` variants correctly. Avoid mixing obsolete Tailwind v3 configs; we are on **Tailwind v4**.
3. **No Placeholders**: Do not leave "TODO" blocks in UI components. Implement fully functional and aesthetically pleasing interfaces.

## Database & Data Flow

1. **Never Fetch Raw Tables for KPIs**: Always use the predefined Postgres Views (`daily_metrics_view`, `airline_daily_performance_view`) instead of raw `flights_history` queries to avoid taxing the Next.js server.
2. **Always Use Absolute Time**: When dealing with dates, always resolve them according to the `America/Caracas` timezone. Do not trust UTC server time for day-boundary calculations.

## Automation & Cloud

- **Vercel**: We deploy the Next.js app to Vercel.
- **Background Jobs**: We are using GitHub Actions (`.github/workflows/cron.yml`) to orchestrate our background polling and DB cleanup jobs.
- **CRITICAL RULE**: Do not create or use a `vercel.json` file for cron tasks. We deliberately bypass Vercel's limits by using GitHub Actions, so `vercel.json` is strictly not needed.
