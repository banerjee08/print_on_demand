/**
 * @fileoverview LouLou & Luxe — Production Backend Coupon Precedence & Checkout Levy Engine
 *
 * Strictly Backend-Owned Business Logic (Decoupled from Frontend UI):
 *  1. Category-Aware Coupon Unlocking: Every discount coupon (e.g., 25% OFF `LULLUXE25` or
 *     10% OFF `BRIDAL10`) is bound to its associated category and returns the congratulatory
 *     unlock payload + official LouLou & Luxe brand confetti palette (`#9E4758`, `#883647`,
 *     `#C8A97E`, `#B4833E`, `#2D5A43`, `#F9EFF1`, `#FAF8F5`).
 *  2. Automatic Checkout Levy: Whenever a shopper adds a product with an attached discount coupon,
 *     the backend levies the discount on the checkout calculation in integer cents.
 *  3. Strict Non-Stacking & Highest-Discount Precedence:
 *     No two discount coupons can ever be applied together (`stackable: false`, `maxCouponsApplied: 1`).
 *     If a product or cart has multiple candidate coupons (e.g., both 25% `LULLUXE25` and 10% `BRIDAL10`),
 *     ONLY the single coupon with the highest discount percentage (`25%`) is levied, and lower coupons
 *     (`10%`) are explicitly marked as superseded.
 */

import { throwWithGitTrace } from '../../lib/git-error-tracer';

const THIS_FILE = 'apps/backend/src/modules/discounts/coupon-precedence-engine.ts';

export type CouponCode = 'LULLUXE25' | 'BRIDAL10';

export const BRAND_CONFETTI_PALETTE_HEX = [
  '#9E4758', // Botanical Rose
  '#883647', // Deep Botanical Rose
  '#C8A97E', // Champagne Gold
  '#B4833E', // Warm Heritage Gold
  '#2D5A43', // Forest Sage
  '#F9EFF1', // Soft Blush Rose
  '#FAF8F5', // Warm Alabaster
] as const;

export interface CouponDefinition {
  readonly code: CouponCode;
  readonly discountPercent: number;
  readonly stackable: false;
  readonly title: string;
  readonly defaultCategoryKey: string;
  readonly defaultCategoryLabel: string;
  readonly eligibleCategories: readonly string[];
}

export const COUPON_CATALOG: Record<CouponCode, CouponDefinition> = {
  LULLUXE25: {
    code: 'LULLUXE25',
    discountPercent: 25,
    stackable: false,
    title: '25% OFF Autumn & Holiday Launch Edit',
    defaultCategoryKey: 'ALL',
    defaultCategoryLabel: 'Autumn & Holiday Sitewide Collection',
    eligibleCategories: [
      'ALL',
      'CLUB_FLEECE',
      'OUTERWEAR',
      'DRESSES',
      'BRIDAL',
      'MONOGRAM_GIFTS',
      'GRAPHICS',
    ],
  },
  BRIDAL10: {
    code: 'BRIDAL10',
    discountPercent: 10,
    stackable: false,
    title: '10% OFF Bridal & Engagement Concierge',
    defaultCategoryKey: 'BRIDAL',
    defaultCategoryLabel: 'Bridal & Engagement Suite',
    eligibleCategories: ['BRIDAL', 'MONOGRAM_GIFTS', 'DRESSES', 'ALL'],
  },
};

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  ALL: 'Autumn & Holiday Sitewide Collection',
  CLUB_FLEECE: 'Heavyweight Crewnecks & Social Club Fleece',
  OUTERWEAR: 'Quarter-Zips, Sherpa & Cozy Outerwear',
  DRESSES: 'Autumn, Holiday & Wedding Guest Dresses',
  BRIDAL: 'Bridal & Engagement Suite',
  MONOGRAM_GIFTS: 'Custom Monogram Holiday Gifts',
  GRAPHICS: 'Game Day & Everyday Graphic Tees',
};

export interface CategoryCouponUnlockResponse {
  readonly unlockedCoupon: CouponCode;
  readonly unlockedDiscountPercent: number;
  readonly associatedCategoryKey: string;
  readonly associatedCategoryLabel: string;
  readonly modalHeadline: string;
  readonly modalSubheadline: string;
  readonly nonStackingRuleNotice: string;
  readonly triggerBrandConfetti: true;
  readonly brandConfettiPaletteHex: readonly string[];
  readonly activeWinningCoupon: CouponCode;
  readonly activeWinningDiscountPercent: number;
  readonly supersededCoupons: CouponCode[];
}

/**
 * Backend handler for unlocking a discount coupon on a specific category or product.
 * Enforces single-winner precedence if another coupon was already unlocked.
 */
export function unlockCategoryCouponInBackend(params: {
  clickedCouponCode: string;
  categoryKey?: string;
  existingUnlockedCoupons?: readonly string[];
}): CategoryCouponUnlockResponse {
  const normalizedCode = String(params.clickedCouponCode || '')
    .trim()
    .toUpperCase() as CouponCode;
  const def = COUPON_CATALOG[normalizedCode];

  if (!def) {
    throwWithGitTrace({
      errorCode: 'UNKNOWN_DISCOUNT_COUPON',
      message: `Unrecognized discount coupon code: "${params.clickedCouponCode}"`,
      serviceModule: 'CouponPrecedenceEngine',
      filePath: THIS_FILE,
      lineNumber: 112,
      httpStatus: 400,
      severity: 'WARN',
      sanitizedContext: { clickedCouponCode: params.clickedCouponCode },
    });
  }

  const catKey =
    params.categoryKey && CATEGORY_DISPLAY_NAMES[params.categoryKey]
      ? params.categoryKey
      : def.defaultCategoryKey;
  const catLabel = CATEGORY_DISPLAY_NAMES[catKey] || def.defaultCategoryLabel;

  const combinedSet = new Set<CouponCode>([normalizedCode]);
  for (const existing of params.existingUnlockedCoupons || []) {
    const up = String(existing || '').trim().toUpperCase() as CouponCode;
    if (COUPON_CATALOG[up]) combinedSet.add(up);
  }

  const sorted = Array.from(combinedSet).sort(
    (a, b) => COUPON_CATALOG[b].discountPercent - COUPON_CATALOG[a].discountPercent
  );
  const winningCoupon = sorted[0];
  const winningPercent = COUPON_CATALOG[winningCoupon].discountPercent;
  const supersededCoupons = sorted.slice(1);

  const nonStackingRuleNotice =
    supersededCoupons.length > 0
      ? `Both ${sorted.map((c) => `${COUPON_CATALOG[c].discountPercent}% (${c})`).join(' and ')} are unlocked. Because no two discount coupons can be applied together, the higher ${winningPercent}% OFF (${winningCoupon}) coupon will automatically be levied at checkout!`
      : `Whenever you add a product from ${catLabel} with ${def.code} (-${def.discountPercent}% OFF) attached, the discount is automatically levied on checkout. No two discount coupons can be combined — the higher discount always wins.`;

  return {
    unlockedCoupon: def.code,
    unlockedDiscountPercent: def.discountPercent,
    associatedCategoryKey: catKey,
    associatedCategoryLabel: catLabel,
    modalHeadline: `Congratulations! You Unlocked ${def.discountPercent}% OFF`,
    modalSubheadline: `Category Associated: ${catLabel}`,
    nonStackingRuleNotice,
    triggerBrandConfetti: true,
    brandConfettiPaletteHex: BRAND_CONFETTI_PALETTE_HEX,
    activeWinningCoupon: winningCoupon,
    activeWinningDiscountPercent: winningPercent,
    supersededCoupons,
  };
}

export interface CheckoutLineItemInput {
  productId: string;
  sku: string;
  title: string;
  category: string;
  unitPriceCents: number;
  qty: number;
  attachedCoupons: string[];
}

export interface EvaluatedCheckoutLineItem {
  productId: string;
  sku: string;
  title: string;
  category: string;
  categoryDisplayName: string;
  qty: number;
  unitPriceCents: number;
  grossLineCents: number;
  candidateCoupons: CouponCode[];
  winningCoupon: CouponCode | null;
  winningDiscountPercent: number;
  supersededCoupons: CouponCode[];
  discountLevyCents: number;
  netLineCents: number;
}

export interface CheckoutDiscountResolution {
  nonStackingPolicy: 'HIGHEST_SINGLE_COUPON_WINS';
  maxCouponsApplied: 1;
  items: EvaluatedCheckoutLineItem[];
  grossSubtotalCents: number;
  totalDiscountLevyCents: number;
  netMerchandiseTotalCents: number;
  winningCartCoupon: CouponCode | null;
  winningCartDiscountPercent: number;
  supersededCartCoupons: CouponCode[];
  explanation: string;
}

/**
 * Authoritative Backend Checkout Calculation:
 * Resolves the single highest discount coupon for each item and across the checkout,
 * ensuring no two discount coupons are ever stacked together (e.g., 25% `LULLUXE25`
 * always supersedes 10% `BRIDAL10`).
 */
export function evaluateCheckoutWithHighestCouponRule(
  items: CheckoutLineItemInput[],
  sessionUnlockedCoupons: string[] = []
): CheckoutDiscountResolution {
  if (!Array.isArray(items)) {
    throwWithGitTrace({
      errorCode: 'INVALID_CHECKOUT_ITEMS',
      message: 'Checkout items must be a valid array.',
      serviceModule: 'CouponPrecedenceEngine',
      filePath: THIS_FILE,
      lineNumber: 209,
      httpStatus: 400,
      severity: 'ERROR',
    });
  }

  let grossSubtotalCents = 0;
  let totalDiscountLevyCents = 0;
  const allCandidateCodes = new Set<CouponCode>();

  for (const rawCode of sessionUnlockedCoupons) {
    const upper = String(rawCode || '').trim().toUpperCase() as CouponCode;
    if (COUPON_CATALOG[upper]) {
      allCandidateCodes.add(upper);
    }
  }

  for (const item of items) {
    if (item.unitPriceCents < 0 || item.qty <= 0) {
      throwWithGitTrace({
        errorCode: 'INVALID_LINE_ITEM_AMOUNT',
        message: `Invalid price (${item.unitPriceCents}) or quantity (${item.qty}) for SKU ${item.sku}`,
        serviceModule: 'CouponPrecedenceEngine',
        filePath: THIS_FILE,
        lineNumber: 233,
        httpStatus: 400,
        severity: 'ERROR',
        sanitizedContext: { sku: item.sku, unitPriceCents: item.unitPriceCents, qty: item.qty },
      });
    }
    for (const c of item.attachedCoupons || []) {
      const upper = String(c || '').trim().toUpperCase() as CouponCode;
      if (COUPON_CATALOG[upper]) {
        allCandidateCodes.add(upper);
      }
    }
  }

  // Sort all candidate coupons strictly by discountPercent DESC so highest discount wins
  const sortedGlobalCandidates = Array.from(allCandidateCodes).sort(
    (a, b) => COUPON_CATALOG[b].discountPercent - COUPON_CATALOG[a].discountPercent
  );

  const winningCartCoupon: CouponCode | null =
    sortedGlobalCandidates.length > 0 ? sortedGlobalCandidates[0] : null;
  const winningCartDiscountPercent = winningCartCoupon
    ? COUPON_CATALOG[winningCartCoupon].discountPercent
    : 0;
  const supersededCartCoupons = sortedGlobalCandidates.slice(1);

  const evaluatedItems: EvaluatedCheckoutLineItem[] = items.map((item) => {
    const grossLineCents = Math.round(item.unitPriceCents * item.qty);
    grossSubtotalCents += grossLineCents;

    const itemCandidatesSet = new Set<CouponCode>(sortedGlobalCandidates);
    for (const c of item.attachedCoupons || []) {
      const upper = String(c || '').trim().toUpperCase() as CouponCode;
      if (COUPON_CATALOG[upper]) itemCandidatesSet.add(upper);
    }

    const itemCandidates = Array.from(itemCandidatesSet).sort(
      (a, b) => COUPON_CATALOG[b].discountPercent - COUPON_CATALOG[a].discountPercent
    );

    // Enforce global single-winner coupon rule (no two coupons can be applied together)
    const winningCoupon =
      winningCartCoupon && itemCandidates.includes(winningCartCoupon)
        ? winningCartCoupon
        : itemCandidates[0] || null;

    const winningDiscountPercent = winningCoupon
      ? COUPON_CATALOG[winningCoupon].discountPercent
      : 0;

    const supersededCoupons = itemCandidates.filter((c) => c !== winningCoupon);

    const discountLevyCents =
      winningDiscountPercent > 0
        ? Math.round((grossLineCents * winningDiscountPercent) / 100)
        : 0;
    const netLineCents = grossLineCents - discountLevyCents;
    totalDiscountLevyCents += discountLevyCents;

    return {
      productId: item.productId,
      sku: item.sku,
      title: item.title,
      category: item.category,
      categoryDisplayName:
        CATEGORY_DISPLAY_NAMES[item.category] || 'Boutique Collection',
      qty: item.qty,
      unitPriceCents: item.unitPriceCents,
      grossLineCents,
      candidateCoupons: itemCandidates,
      winningCoupon,
      winningDiscountPercent,
      supersededCoupons,
      discountLevyCents,
      netLineCents,
    };
  });

  const netMerchandiseTotalCents = grossSubtotalCents - totalDiscountLevyCents;

  let explanation = 'No discount coupon attached.';
  if (winningCartCoupon && supersededCartCoupons.length > 0) {
    explanation = `Applied highest discount coupon ${winningCartCoupon} (-${winningCartDiscountPercent}% OFF) at checkout. Lower coupon(s) [${supersededCartCoupons.join(', ')}] were automatically superseded because two coupons cannot be combined.`;
  } else if (winningCartCoupon) {
    explanation = `Coupon ${winningCartCoupon} (-${winningCartDiscountPercent}% OFF) levied at checkout.`;
  }

  return {
    nonStackingPolicy: 'HIGHEST_SINGLE_COUPON_WINS',
    maxCouponsApplied: 1,
    items: evaluatedItems,
    grossSubtotalCents,
    totalDiscountLevyCents,
    netMerchandiseTotalCents,
    winningCartCoupon,
    winningCartDiscountPercent,
    supersededCartCoupons,
    explanation,
  };
}
