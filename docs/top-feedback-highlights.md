# Feedback Highlights

This document explains how AI-curated feedback highlights are generated and stored for Retenly restaurants, and how to run the scripts that prime or refresh those summaries.

## Overview

- New customer feedback is stored in `feedback` rows through the public form submit route (`src/app/api/forms/[slug]/submit/route.ts`).
- The highlight generator in `src/lib/ai/topFeedback.ts` groups recent feedback into positive and negative themes. It optionally calls Groq if `GROQ_API_KEY` is configured; otherwise it falls back to a heuristic summariser.
- Results are persisted in the `topFeedback` table so dashboards can render highlights without invoking the AI pipeline on each request.
- The automatic queue trigger was removed, so highlights are refreshed manually via scripts.

## Prerequisites

- Database access via the Prisma connection string in `.env` (for local usage this is typically `DATABASE_URL` pointing to your dev Postgres instance).
- Optional: `GROQ_API_KEY` to enable the Groq call. Without it, the heuristic fallback runs and still writes deterministic highlight rows.
- Installed dependencies (`npm install`) and an up-to-date Prisma client (`npm run db:generate` if schema changed).

## Generate Highlights For All Restaurants

Use the helper script `scripts/prime-top-feedback.ts` whenever feedback has been imported or seeded and you want highlight records created for restaurants that do not have any yet.

```bash
node --loader ts-node/esm scripts/prime-top-feedback.ts
```
OR 
```bash
npx tsx scripts/prime-top-feedback.ts
```


The script will:

1. Fetch every restaurant ID.
2. Count existing `topFeedback` rows for each.
3. Call `regenerateTopFeedbackForRestaurant` only when a restaurant has zero stored highlights.
4. Persist the summaries (or log failures) before moving on.

> Tip: if the experimental loader warning is noisy, use Node's suggested form instead:
> `NODE_OPTIONS='--import data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm", pathToFileURL("./"));' node scripts/prime-top-feedback.ts`

## Regenerate A Single Restaurant

When you need to refresh highlights for a specific restaurant (for example after bulk editing feedback), run the generator directly:

```bash
node --loader ts-node/esm -e "import { regenerateTopFeedbackForRestaurant } from './src/lib/ai/topFeedback.ts'; await regenerateTopFeedbackForRestaurant('RESTAURANT_ID');"
```

Replace `RESTAURANT_ID` with the UUID from the `restaurant` table. The command deletes existing rows for that restaurant and writes the newly generated summaries.

## Verifying Results

- Check `prisma/topFeedback` via Prisma Studio or a SQL client; fresh rows will have recent `createdAt`/`updatedAt` timestamps.
- Review the Node output for `[curateTopFeedback]` logs or errors. Failures fall back to the heuristic summariser and still produce rows unless there was a database error.
- If the script reports 0 feedback records, ensure feedback exists for the target restaurant (the generator will delete existing highlights when no feedback is found).

## Troubleshooting

- **Unknown file extension ".ts":** run with `node --loader ts-node/esm` (or configure `NODE_OPTIONS` as shown above) so Node registers the TypeScript loader before executing the script.
- **Groq API errors:** confirm `GROQ_API_KEY` is present. The system logs a warning and falls back to heuristics if Groq is unavailable.
- **No highlights appear:** verify the restaurant has at least one `feedback` row and that the script output didn't show database permission issues.
