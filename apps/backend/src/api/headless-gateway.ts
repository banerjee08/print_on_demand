/**
 * @fileoverview Decoupled Headless Backend API Gateway (v1) for LouLou & Luxe.
 *
 * Requirement: "Can we keep the Frontend and backend different? because i wish to change
 * the Frontend later on as per the client requirements and taste. The backend logic
 * should stay intact"
 *
 * This module defines the strict, UI-agnostic JSON API Contract between ANY Frontend
 * (Vanilla HTML/JS, Next.js, React, Vue, Shopify Headless, iOS/Android App) and the
 * LouLou & Luxe Production Backend.
 *
 * Swapping or redesigning the Frontend requires ZERO changes to this Backend Engine.
 */

import { captureErrorWithGitTrace, GitTraceableError, throwWithGitTrace } from '../lib/git-error-tracer';
import {
  enforceAntiBotAndWafGuard,
  type IncomingRequestContext,
  sanitizeAndGuardAiInput,
} from '../lib/security-waf-and-antibot';
import {
  type CatalogProductItem,
  FEEDBACK_REWARD_WEIGHTS,
  type FeedbackSignalType,
  type LearnedAffinityRow,
  type LearnedSynonymRow,
  normalizeSearchQuery,
  rankCatalogWithLearnedFeedback,
} from '../modules/search/adaptive-llm-search';
import {
  type CategoryCouponUnlockResponse,
  type CheckoutDiscountResolution,
  type CheckoutLineItemInput,
  evaluateCheckoutWithHighestCouponRule,
  unlockCategoryCouponInBackend,
} from '../modules/discounts/coupon-precedence-engine';

const THIS_FILE = 'apps/backend/src/api/headless-gateway.ts';

export interface HeadlessApiResponse<T> {
  readonly ok: boolean;
  readonly apiVersion: 'v1.0-decoupled';
  readonly requestId: string;
  readonly data?: T;
  readonly error?: ReturnType<GitTraceableError['toApiResponse']>['error'];
}

/**
 * Unified Decoupled Backend Dispatcher:
 *   1. Runs Anti-Bot ("Anti-Bog") + OWASP WAF + Prototype Pollution + SQLi/XSS checks
 *   2. Executes pure Backend Domain Logic (Search + Online Learning, Feedback Recording,
 *      Monogram Trademark Validation, or Error Telemetry)
 *   3. Catches any exception and attaches exact Git repo, branch, file, and `#L<line>` link
 */
export async function handleDecoupledBackendRequest<T>(
  ctx: IncomingRequestContext,
  handler: (waf: { visitorFingerprint: string }) => Promise<T>
): Promise<HeadlessApiResponse<T>> {
  const requestId = `ll-req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  try {
    const wafResult = enforceAntiBotAndWafGuard(ctx);
    const data = await handler({ visitorFingerprint: wafResult.visitorFingerprint });
    return {
      ok: true,
      apiVersion: 'v1.0-decoupled',
      requestId,
      data,
    };
  } catch (err: unknown) {
    const gitErr = captureErrorWithGitTrace(err, {
      errorCode: 'BACKEND_UNHANDLED_EXCEPTION',
      serviceModule: 'HeadlessApiGateway',
      filePath: THIS_FILE,
      lineNumber: 62,
      requestId,
    });
    return {
      ok: false,
      apiVersion: 'v1.0-decoupled',
      requestId,
      error: gitErr.toApiResponse().error,
    };
  }
}

/**
 * Endpoint 1: `POST /api/v1/search/query`
 * Executes self-learning hybrid search (Lexical + Synonym Memory + Reinforcement Affinity).
 */
export function executeHeadlessSearchQuery(params: {
  rawQuery: string;
  catalog: readonly CatalogProductItem[];
  learnedAffinities: readonly LearnedAffinityRow[];
  learnedSynonyms: readonly LearnedSynonymRow[];
}) {
  return rankCatalogWithLearnedFeedback(params);
}

/**
 * Endpoint 2: `POST /api/v1/search/feedback`
 * Records implicit (click, wishlist, add-to-bag, purchase) or explicit (thumbs-up/down)
 * user feedback so the Search Ranker and LLM continuously learn over time.
 */
export function prepareSearchFeedbackUpsert(params: {
  rawQuery: string;
  productSku: string;
  signalType: FeedbackSignalType;
  userComment?: string;
}) {
  const normalizedQuery = normalizeSearchQuery(params.rawQuery || 'featured');
  const productSku = sanitizeAndGuardAiInput(params.productSku, 'MONOGRAM_TEXT');
  const rewardDelta = FEEDBACK_REWARD_WEIGHTS[params.signalType];

  if (typeof rewardDelta !== 'number') {
    throwWithGitTrace({
      errorCode: 'INVALID_FEEDBACK_SIGNAL_TYPE',
      message: `Unsupported feedback signal type: ${String(params.signalType)}`,
      serviceModule: 'HeadlessApiGateway',
      filePath: THIS_FILE,
      lineNumber: 109,
      httpStatus: 400,
      severity: 'WARN',
      sanitizedContext: { signalType: params.signalType },
    });
  }

  return {
    normalizedQuery,
    productSku,
    signalType: params.signalType,
    rewardDelta,
    sanitizedComment: params.userComment
      ? sanitizeAndGuardAiInput(params.userComment, 'SEARCH_QUERY')
      : '',
  };
}

/**
 * Endpoint 3: `POST /api/v1/discounts/unlock`
 * Backend-owned Category Discount Unlock & Brand Confetti trigger.
 */
export function executeHeadlessCouponUnlock(params: {
  clickedCouponCode: string;
  categoryKey?: string;
  existingUnlockedCoupons?: readonly string[];
}): CategoryCouponUnlockResponse {
  return unlockCategoryCouponInBackend(params);
}

/**
 * Endpoint 4: `POST /api/v1/checkout/coupon-quote`
 * Authoritative Backend Checkout Discount Levy calculation enforcing the
 * Single-Winner Non-Stacking Precedence Rule (e.g., 25% `LULLUXE25` wins over 10% `BRIDAL10`).
 */
export function executeHeadlessCheckoutCouponQuote(params: {
  items: CheckoutLineItemInput[];
  sessionUnlockedCoupons?: string[];
}): CheckoutDiscountResolution {
  return evaluateCheckoutWithHighestCouponRule(
    params.items,
    params.sessionUnlockedCoupons || []
  );
}
