import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// SerpApi Trends Cache
// ---------------------------------------------------------------------------
// Budget: 100 free searches / month ≈ 3 searches/day max
// Strategy: Cache results to a JSON file for 48 hours per locale combination.
// This way, the same locale set served all day only costs 1 API call every 2 days.
// ---------------------------------------------------------------------------

const CACHE_FILE = path.join(process.cwd(), ".trends_cache.json");
const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

interface CacheEntry {
  timestamp: number;
  data: any;
}

type CacheStore = Record<string, CacheEntry>;

function readCache(): CacheStore {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }
  } catch {
    // corrupt cache — start fresh
  }
  return {};
}

function writeCache(store: CacheStore): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // write failure is non-fatal
  }
}

function getCached(key: string): any | null {
  const store = readCache();
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
  return entry.data;
}

function setCache(key: string, data: any): void {
  const store = readCache();
  store[key] = { timestamp: Date.now(), data };
  writeCache(store);
}

// ---------------------------------------------------------------------------
// SerpApi Google Trends fetch
// ---------------------------------------------------------------------------

interface TrendIdea {
  id: string;
  title: string;
  category: string;
  targetAudience: string;
  sellingPoint: string;
  hotSellReason: string;
  colorPalette: string[];
  tags: string[];
  marketingAngle: string;
  coreValues: string[];
  colorMixSuggestion: string;
}

const POD_CATEGORIES = [
  "Apparel",
  "Home & Living",
  "Accessories",
  "Seasonal",
  "Novelty",
];

// Map Google category to color palettes relevant for POD design
function deriveColorPalette(title: string): string[] {
  const palettes: string[][] = [
    ["#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"],
    ["#264653", "#2A9D8F", "#E9C46A", "#F4A261"],
    ["#E63946", "#457B9D", "#1D3557", "#F1FAEE"],
    ["#606C38", "#DDA15E", "#BC6C25", "#FEFAE0"],
    ["#9B2335", "#3C3B6E", "#F4A261", "#2A9D8F"],
  ];
  const idx = Math.abs(title.charCodeAt(0) + title.charCodeAt(1)) % palettes.length;
  return palettes[idx];
}

async function fetchFromSerpApi(localesParam: string): Promise<TrendIdea[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error("SERPAPI_API_KEY not configured");

  // Use the first locale for the geo param (SerpApi expects ISO 2-letter code)
  const firstLocale = localesParam.split(",")[0].trim();
  const geoMap: Record<string, string> = {
    US: "US", UK: "GB", CA: "CA", AU: "AU", DE: "DE", FR: "FR",
  };
  const geo = geoMap[firstLocale] || "US";

  // Fetch "rising" searches for shopping/gifts category — most relevant for POD
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_trends");
  url.searchParams.set("q", "custom t-shirt,print on demand,personalized gifts,custom hoodie,custom mug");
  url.searchParams.set("data_type", "RELATED_TOPICS");
  url.searchParams.set("geo", geo);
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`SerpApi error: ${res.status}`);

  const data = await res.json();

  // Extract rising related topics
  const risingTopics: any[] = data?.related_topics?.rising || [];
  const topTopics: any[] = data?.related_topics?.top || [];
  const allTopics = [...risingTopics, ...topTopics].slice(0, 6);

  // Map raw topics to TrendIdea shape
  const trends: TrendIdea[] = allTopics.map((topic: any, idx: number) => {
    const rawTitle: string = topic?.topic?.title || topic?.query || `Trend ${idx + 1}`;
    const type: string = topic?.topic?.type || "Product";
    const value: number = topic?.value || 50;

    return {
      id: `serpapi-trend-${idx + 1}`,
      title: rawTitle,
      category: POD_CATEGORIES[idx % POD_CATEGORIES.length],
      targetAudience: deriveAudience(type),
      sellingPoint: `High search interest (${value}${typeof value === "number" && value <= 100 ? "%" : " trend pts"}) in ${firstLocale}`,
      hotSellReason: `Rising trend in ${localesParam} — great seasonal POD opportunity`,
      colorPalette: deriveColorPalette(rawTitle),
      tags: rawTitle.toLowerCase().split(" ").filter((w: string) => w.length > 2).slice(0, 4),
      marketingAngle: `Capitalize on "${rawTitle}" demand before the peak`,
      coreValues: ["Trending", "Relevant", "High-demand"],
      colorMixSuggestion: "Blend 60% trend tone with 40% brand base for recognizability.",
    };
  });

  // If SerpApi returned fewer than 3, pad with smart POD defaults
  if (trends.length < 3) {
    const defaults = getDefaultTrends(localesParam);
    return [...trends, ...defaults].slice(0, 3);
  }

  return trends.slice(0, 6);
}

function deriveAudience(type: string): string {
  const audienceMap: Record<string, string> = {
    Sport: "Sports enthusiasts & gym-goers",
    Game: "Gamers & streaming fans",
    Food: "Foodies & home cooks",
    Music: "Music lovers & concert-goers",
    Travel: "Travel & adventure seekers",
    Pet: "Pet owners & animal lovers",
    Fashion: "Fashion-forward millennials & Gen-Z",
  };
  for (const key of Object.keys(audienceMap)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return audienceMap[key];
  }
  return "Trend-conscious shoppers";
}

function getDefaultTrends(locales: string): TrendIdea[] {
  return [
    {
      id: "default-trend-outdoor",
      title: "Outdoor Camping & Adventure",
      category: "Apparel",
      targetAudience: "Outdoorsy families & campers",
      sellingPoint: "Evergreen niche with peak summer/fall demand",
      hotSellReason: "Consistently high POD sales in " + locales,
      colorPalette: ["#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"],
      tags: ["camping", "outdoor", "adventure", "nature"],
      marketingAngle: "Rugged yet humorous retro designs",
      coreValues: ["Freedom", "Family", "Nature"],
      colorMixSuggestion: "60% earthy greens + 40% warm amber accents.",
    },
    {
      id: "default-trend-pets",
      title: "Pet Parent Pride",
      category: "Novelty",
      targetAudience: "Dog & cat owners",
      sellingPoint: "High impulse-buy category, year-round sales",
      hotSellReason: "Pet-themed gifts = steady top-seller on Etsy & Amazon",
      colorPalette: ["#606C38", "#DDA15E", "#BC6C25", "#FEFAE0"],
      tags: ["pets", "dogs", "cats", "paw"],
      marketingAngle: "Funny, heart-warming pet parent humor",
      coreValues: ["Love", "Humor", "Loyalty"],
      colorMixSuggestion: "60% warm neutrals + 40% playful accent tones.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locales = searchParams.get("locales") || "US, UK, CA";
  const forceRefresh = searchParams.get("refresh") === "true";

  // Normalize key so "US,UK" and "US, UK" hit the same cache slot
  const cacheKey = locales.replace(/\s/g, "").toUpperCase().split(",").sort().join(",");

  // Serve from cache unless user explicitly forced refresh
  if (!forceRefresh) {
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json({
        trends: cached.trends,
        explanation: cached.explanation,
        isUsingFallback: cached.isUsingFallback ?? false,
        cachedAt: new Date(cached.cachedAt).toLocaleString(),
        source: "cache",
      });
    }
  }

  try {
    const trends = await fetchFromSerpApi(locales);
    const explanation = `Scanning live Google Trends for "${locales}" — ${trends.length} high-velocity POD niches identified. Results cached for 48 hours to conserve API quota.`;

    const payload = {
      trends,
      explanation,
      isUsingFallback: false,
      cachedAt: Date.now(),
    };
    setCache(cacheKey, payload);

    return NextResponse.json({ ...payload, source: "live" });
  } catch (error: any) {
    console.error("SerpApi error:", error.message);

    // Return fallback data so the UI is never broken
    const fallback = getDefaultTrends(locales);
    return NextResponse.json({
      trends: fallback,
      explanation:
        "Live trends temporarily unavailable (API quota or connection issue). Showing curated evergreen POD niches.",
      isUsingFallback: true,
      source: "fallback",
    });
  }
}
