# POD Automation Phase 1 — Setup Guide

## What's Included

| File | Purpose |
|---|---|
| `supabase_schema.sql` | Run this once in Supabase SQL Editor |
| `n8n_trend_discovery.json` | Workflow 1: Scrapes Google Trends → Ollama scoring → Sheets + Supabase |
| `n8n_slogan_generator.json` | Workflow 2: Brand fit + 15-20 slogans + infinite "More Ideas" loop |

---

## Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Paste and run the contents of `supabase_schema.sql`
3. This creates 4 tables: `trends`, `preference_signals`, `brand_niche_history`, `slogans`

---

## Step 2: Ollama Model Installation (Hostinger KVM2)

Your current model (`qwen3:1.7b`) works but for better slogan quality, install:

```bash
# Best options for 8GB RAM / 2 vCPU KVM2:
ollama pull llama3.2:3b       # RECOMMENDED — best creativity for slogans
ollama pull gemma2:2b          # Fast, high quality alternative
ollama pull qwen2.5:3b         # Best for JSON/structured scoring output

# Verify it's available
ollama list
```

> **KVM2 Limits**: Stick to 3B parameter models or below. 7B models will be very slow (60-120s per call) and may OOM. `llama3.2:3b` is the sweet spot.

---

## Step 3: Google Sheets Setup

Your spreadsheet: `1T8fHZqsRevB8kKDcYGtqmTNRlFnTK76yCRzOA6n6X2k`

Make sure these **exact tab names** exist:

| Tab Name | Columns to add (Row 1 headers) |
|---|---|
| `Trends` | `keyword` `event_name` `type` `interest_score_7d` `interest_score_3m` `interest_score_1yr` `rising_queries` `applicable_brands` `llm_score` `llm_reasoning` `llm_approved` `human_approved` `run_date` `status` |
| `Slogan Ideas` | `brand` `keyword` `event_name` `Slogan Idea` `brand_fit_score` `brand_fit_reasoning` `run_date` `status` `iteration` |
| `Brand Guidelines` | Keep your existing format |
| `Design Prompts` | (used by your existing workflow) |
| `Graphic Prompts` | `brand` `keyword` `event_name` `slogan` `one_liner` `graphic_prompt` `status` |

> **`human_approved` column in Trends tab**: Type `TRUE` or `FALSE` to approve/reject niches. Workflow 2 polls this.

---

## Step 4: Import Workflows into n8n

1. Open your n8n instance
2. Click **+ New Workflow** → **Import from file**
3. Import `n8n_trend_discovery.json` first
4. Import `n8n_slogan_generator.json` second
5. For each workflow, go to **Settings** and confirm timezone is `Asia/Kolkata`

---

## Step 5: Credentials Check

Both workflows use:
- **Google Sheets**: credential ID `kowj61ntGk297jWr` (your existing credential — this is already wired)
- **Supabase**: anon key is hardcoded in HTTP header nodes (no separate credential needed)
- **SerpAPI**: key is hardcoded in URL params (no separate credential needed)
- **Ollama**: `http://localhost:11434` — confirm your Ollama is running on this port

---

## Usage Flow

```
Step 1: Run "Trend Discovery" workflow
        ↓ Fills Trends tab in Google Sheets

Step 2: Review Trends tab
        → Set human_approved = TRUE for niches you like
        → Set human_approved = FALSE to reject

Step 3: Run "Slogan Generator" workflow
        ↓ Reads only human_approved=TRUE rows
        ↓ Generates 15-20 slogans per brand×niche
        ↓ Writes to Slogan Ideas tab

Step 4: Review Slogan Ideas tab
        → Change status to "LGTM" for slogans you want to use
        → Change status to "Rejected" for bad ones
        → Change status to "More Ideas" to regenerate for that brand+keyword

Step 5: Workflow polls Slogan Ideas (daily 10am IST)
        → Finds rows with "More Ideas" → generates a fresh batch
        → Marks old "More Ideas" rows as "More Ideas Sent"
        → New rows appear with Iteration = 2, 3, etc.
```

---

## Preference Learning — How It Works

After each decision you make in the sheets, you need to **sync it to Supabase** so the LLM learns. You can do this manually in n8n as a simple one-time webhook workflow (Phase 1.5), or run this SQL directly:

```sql
-- Example: Log a slogan approval
SELECT record_preference(
  'SparkVibe',           -- brand
  '4th of july shirt',   -- niche keyword
  'slogan_approved',     -- signal type
  'Born Free, Dressed Bold',  -- content
  NULL,                  -- reason (optional)
  'Independence Day'     -- event name
);
```

> **Phase 1.5 addition**: A Google Sheets → Supabase sync webhook is the next small workflow to build if you want this fully automated.

---

## SerpAPI Free Tier Management

- **Free tier**: 100 searches/month
- **Trend Discovery**: Max 10 keywords per run × 3 horizons = 30 calls per run
- **Weekly run**: 30 × 4 = 120 calls/month → **slightly over free limit**
- **Recommended**: Run bi-weekly (every 2 weeks) = 60 calls/month ✅

To switch to bi-weekly, change the cron in the Schedule node:
```
0 9 1,15 * *   ← runs on 1st and 15th of each month at 9am IST
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Ollama timeout | Increase timeout on HTTP node to 180000ms, or switch to `gemma2:2b` (faster) |
| SerpAPI returns empty `averages` | Script falls back to last timeline data point — this is expected behavior |
| No slogans generated | Check `brand_fit_score` in sheet — if < 6, that brand+niche was skipped intentionally |
| "More Ideas" not triggering | Ensure the status cell is exactly `More Ideas` (case-sensitive) |
| Supabase 401 error | Anon key may have been rotated — update in all HTTP Header nodes |
