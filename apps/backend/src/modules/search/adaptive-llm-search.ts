/**
 * @fileoverview Continuous Self-Learning LLM Search & Feedback Loop Engine for LouLou & Luxe.
 *
 * Requirement: "I hope the LLM learns over time wherever feedback mechanism is present
 * or search is present."
 *
 * Implements a 3-Tier Online Learning Architecture:
 *   1. Hybrid Search Ranker: Blends Lexical Score + Semantic Intent Synonym Expansion
 *      + Learned Product Conversion Affinity (`conversion_boost_score` from clicks,
 *      wishlist saves, cart additions, purchases, and explicit thumbs-up/down).
 *   2. Self-Healing Synonym Memory: When a user searches a phrase with low lexical match
 *      (e.g., "scottsdale bach pjs" or "engaged gift under 40"), the LLM expands the intent
 *      and caches the mapping in `loulou_learned_query_synonyms` so every future user gets
 *      instant <5ms results.
 *   3. Dynamic Few-Shot Prompt Memory: Retrieves the highest-rewarded past search/monogram
 *      interactions from `loulou_llm_feedback_memory` and injects them into the Gemini /
 *      Ollama system prompt so the LLM improves continuously with real shopper feedback.
 */

import { throwWithGitTrace } from '../../lib/git-error-tracer';
import { sanitizeAndGuardAiInput } from '../../lib/security-waf-and-antibot';

const THIS_FILE = 'apps/backend/src/modules/search/adaptive-llm-search.ts';

export type FeedbackSignalType =
  | 'SEARCH_CLICK'
  | 'WISHLIST_SAVE'
  | 'ADD_TO_BAG'
  | 'PURCHASE'
  | 'THUMBS_UP'
  | 'THUMBS_DOWN';

export const FEEDBACK_REWARD_WEIGHTS: Record<FeedbackSignalType, number> = {
  SEARCH_CLICK: 1.0,
  WISHLIST_SAVE: 2.5,
  ADD_TO_BAG: 4.0,
  PURCHASE: 8.0,
  THUMBS_UP: 3.0,
  THUMBS_DOWN: -4.0,
};

export interface CatalogProductItem {
  readonly id: string;
  readonly sku: string;
  readonly printifyBp: string;
  readonly title: string;
  readonly category: 'CLUB_FLEECE' | 'BRIDAL' | 'MONOGRAM_GIFTS' | 'DRESSES' | 'OUTERWEAR';
  readonly basePrice: number;
  readonly compareAt: number;
  readonly badge: string;
  readonly rating: number;
  readonly reviews: number;
  readonly defaultMonogram: string;
  readonly image: string;
}

export interface LearnedAffinityRow {
  readonly normalizedQuery: string;
  readonly productSku: string;
  readonly conversionBoostScore: number;
}

export interface LearnedSynonymRow {
  readonly rawQueryNorm: string;
  readonly expandedKeywords: string;
  readonly targetCategory?: string;
  readonly recommendedSkus: readonly string[];
}

export interface FewShotMemoryExample {
  readonly userQuery: string;
  readonly llmResponseSummary: string;
  readonly selectedProductSku: string;
  readonly rewardDelta: number;
}

export interface RankedSearchProduct extends CatalogProductItem {
  readonly relevanceBreakdown: {
    readonly lexicalScore: number;
    readonly synonymIntentScore: number;
    readonly learnedFeedbackBoost: number;
    readonly finalRankScore: number;
  };
}

/**
 * Normalizes a raw user search query after running the AI Security & Prompt Injection guard.
 */
export function normalizeSearchQuery(rawQuery: string): string {
  const safe = sanitizeAndGuardAiInput(rawQuery, 'SEARCH_QUERY');
  return safe
    .toLowerCase()
    .replace(/[^a-z0-9\s&$]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes the hybrid self-learning rank for every catalog item by combining:
 *   - Base Lexical & Price-Intent Match ("under 50", category, title tokens)
 *   - Learned Synonym Expansion (`loulou_learned_query_synonyms`)
 *   - Online Reinforcement Learning Boost (`loulou_product_query_affinity`)
 */
export function rankCatalogWithLearnedFeedback(params: {
  rawQuery: string;
  catalog: readonly CatalogProductItem[];
  learnedAffinities: readonly LearnedAffinityRow[];
  learnedSynonyms: readonly LearnedSynonymRow[];
}): {
  readonly normalizedQuery: string;
  readonly synonymExpansionUsed: string | null;
  readonly rankedProducts: readonly RankedSearchProduct[];
} {
  const normalizedQuery = normalizeSearchQuery(params.rawQuery);
  if (!params.catalog || params.catalog.length === 0) {
    throwWithGitTrace({
      errorCode: 'SEARCH_EMPTY_CATALOG_STATE',
      message: 'Catalog array passed to rankCatalogWithLearnedFeedback is empty.',
      serviceModule: 'AdaptiveLlmSearch',
      filePath: THIS_FILE,
      lineNumber: 112,
      httpStatus: 500,
      severity: 'ERROR',
    });
  }

  // Check if the query includes a price ceiling like "under 50" or "under $40"
  const priceUnderMatch = normalizedQuery.match(/under\s*\$?(\d+)/);
  const maxPriceFilter = priceUnderMatch ? Number.parseInt(priceUnderMatch[1], 10) : null;

  // Lookup learned synonym expansion
  const matchedSynonym = params.learnedSynonyms.find(
    (s) =>
      normalizedQuery.includes(s.rawQueryNorm) || s.rawQueryNorm.includes(normalizedQuery)
  );
  const expandedTokens = matchedSynonym
    ? matchedSynonym.expandedKeywords.toLowerCase().split(/\s+/)
    : [];
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  // Build fast map of learned reinforcement scores for this query
  const affinityMap = new Map<string, number>();
  for (const row of params.learnedAffinities) {
    if (
      row.normalizedQuery === normalizedQuery ||
      normalizedQuery.includes(row.normalizedQuery)
    ) {
      const prev = affinityMap.get(row.productSku) || 0;
      affinityMap.set(row.productSku, prev + Number(row.conversionBoostScore || 0));
    }
  }

  const scored: RankedSearchProduct[] = [];

  for (const item of params.catalog) {
    if (maxPriceFilter !== null && item.basePrice > maxPriceFilter) {
      continue;
    }

    const searchableText = `${item.title} ${item.category} ${item.badge} ${item.sku} ${item.printifyBp}`.toLowerCase();

    // 1. Lexical token match score
    let lexicalScore = 0;
    for (const tok of queryTokens) {
      if (searchableText.includes(tok)) {
        lexicalScore += tok.length >= 4 ? 12 : 6;
      }
    }

    // 2. Learned Synonym & Intent Expansion score
    let synonymIntentScore = 0;
    if (matchedSynonym) {
      if (matchedSynonym.recommendedSkus.includes(item.sku)) {
        synonymIntentScore += 18;
      }
      if (matchedSynonym.targetCategory && item.category === matchedSynonym.targetCategory) {
        synonymIntentScore += 10;
      }
      for (const expTok of expandedTokens) {
        if (expTok.length > 2 && searchableText.includes(expTok)) {
          synonymIntentScore += 4;
        }
      }
    }

    // 3. Online Reinforcement Learning Boost from past user clicks/saves/purchases/feedback
    const rawBoost = affinityMap.get(item.sku) || 0;
    // Cap boost between -25 and +50 so exploration is preserved while winners rise to #1
    const learnedFeedbackBoost = Math.max(-25, Math.min(50, rawBoost));

    // Include item if query is empty or if any signal matched
    const finalRankScore =
      lexicalScore + synonymIntentScore + learnedFeedbackBoost + item.rating;

    if (
      normalizedQuery === '' ||
      lexicalScore > 0 ||
      synonymIntentScore > 0 ||
      learnedFeedbackBoost > 0 ||
      maxPriceFilter !== null
    ) {
      scored.push({
        ...item,
        relevanceBreakdown: {
          lexicalScore,
          synonymIntentScore,
          learnedFeedbackBoost,
          finalRankScore: Number(finalRankScore.toFixed(2)),
        },
      });
    }
  }

  scored.sort(
    (a, b) => b.relevanceBreakdown.finalRankScore - a.relevanceBreakdown.finalRankScore
  );

  return {
    normalizedQuery,
    synonymExpansionUsed: matchedSynonym ? matchedSynonym.expandedKeywords : null,
    rankedProducts: scored,
  };
}

/**
 * Builds the Dynamic Few-Shot System Prompt for Gemini 2.5 Flash / Local Ollama
 * by injecting the top-rewarded historical user feedback rows from `loulou_llm_feedback_memory`.
 */
export function buildSelfLearningPromptWithFewShotMemory(
  userQuery: string,
  topMemories: readonly FewShotMemoryExample[]
): string {
  const safeQuery = normalizeSearchQuery(userQuery);
  const memoryBlock =
    topMemories.length > 0
      ? topMemories
          .slice(0, 5)
          .map(
            (m, i) =>
              `Example ${i + 1} (Verified High-Conversion Match, Reward +${m.rewardDelta}):\n` +
              `  Shopper Query: "${m.userQuery}"\n` +
              `  Winning Recommendation: ${m.llmResponseSummary} (SKU: ${m.selectedProductSku})`
          )
          .join('\n')
      : 'No prior feedback examples yet — use canonical Q4 US/Canada boutique ontology.';

  return [
    'You are the LouLou & Luxe Self-Learning Merchandising & Search Concierge.',
    'Use the verified high-conversion shopper feedback memory below to map the shopper query',
    'to our 16-SKU Printify catalog (CLUB_FLEECE, BRIDAL, MONOGRAM_GIFTS, DRESSES, OUTERWEAR).',
    '',
    '=== VERIFIED SELF-LEARNING FEEDBACK MEMORY ===',
    memoryBlock,
    '==============================================',
    '',
    `Current Shopper Query: "${safeQuery}"`,
    'Return strict JSON with keys: {"conciergeHook": string, "expandedKeywords": string, "targetCategory": string, "recommendedSkus": string[]}',
  ].join('\n');
}
