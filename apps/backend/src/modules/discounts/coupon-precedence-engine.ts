/**
 * @fileoverview LouLou & Luxe — Production Single-Winner Coupon Precedence & Checkout Levy Engine
 *
 * Enforces the strict business rules:
 *  1. Category-Aware Coupon Unlocking: Every discount coupon (e.g., 25% OFF `LULLUXE25` or
 *     10% OFF `BRIDAL10`) is associated with a specific category or product context when unlocked.
 *  2. Automatic Checkout Levy: Whenever a shopper adds a product with an attached discount coupon,
 *     the discount is automatically levied on the checkout calculation.
 *  3. Strict Non-Stacking & Highest-Discount Precedence:
 *     No two discount coupons can ever be applied together. If a product or cart has multiple
 *     candidate coupons (for example, both 25% `LULLUXE25` and 10% `BRIDAL10`), ONLY the single
 *     coupon with the highest discount percentage (`25%`) is levied, and lower coupons (`10%`)
 *     are marked as superseded.
 */

import { throwWithGitTrace } from '../../lib/git-error-tracer';

export type CouponCode = 'LULLUXE25' | 'BRIDAL10';

export interface CouponDefinition {
  code: CouponCode;
  discountPercent: number;
  title: string;
  defaultCategoryLabel: string;
  eligibleCategories: string[];
}

export const COUPON_CATALOG: Record<CouponCode, CouponDefinition> = {
  LULLUXE25: {
    code: 'LULLUXE25',
    discountPercent: 25,
    title: '25% OFF Autumn & Holiday Launch Edit',
    defaultCategoryLabel: 'Autumn & Social Club Sitewide Edit',
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
    title: '10% OFF Bridal & Engagement Concierge',
    defaultCategoryLabel: 'Bridal & Engagement Suite',
    eligibleCategories: ['BRIDAL', 'MONOGRAM_GIFTS', 'DRESSES', 'ALL'],
  },
};

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  ALL: 'All Q4 Launch & Boutique Styles',
  CLUB_FLEECE: 'Heavyweight Crewnecks & Social Club Fleece',
  OUTERWEAR: 'Quarter-Zips, Sherpa & Cozy Outerwear',
  DRESSES: 'Autumn, Holiday & Wedding Guest Dresses',
  BRIDAL: 'Bridal & Engagement Suite',
  MONOGRAM_GIFTS: 'Custom Monogram Holiday Gifts',
  GRAPHICS: 'Game Day & Graphic Tees',
};

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
 * Resolves the single highest discount coupon for each item and across the checkout,
 * ensuring no two discount coupons are ever stacked together.
 */
export function evaluateCheckoutWithHighestCouponRule(
  items: CheckoutLineItemInput[],
  sessionUnlockedCoupons: string[] = []
): CheckoutDiscountResolution {
  if (!Array.isArray(items)) {
    throwWithGitTrace(
      'INVALID_CHECKOUT_ITEMS',
      'Checkout items must be a valid array.',
      'discounts.evaluateCheckoutWithHighestCouponRule',
      400
    );
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
      throwWithGitTrace(
        'INVALID_LINE_ITEM_AMOUNT',
        `Invalid price or quantity for SKU ${item.sku}`,
        'discounts.evaluateCheckoutWithHighestCouponRule',
        400
      );
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

    // Combine item-attached coupons and session-unlocked coupons
    const itemCandidatesSet = new Set<CouponCode>(sortedGlobalCandidates);
    for (const c of item.attachedCoupons || []) {
      const upper = String(c || '').trim().toUpperCase() as CouponCode;
      if (COUPON_CATALOG[upper]) itemCandidatesSet.add(upper);
    }

    const itemCandidates = Array.from(itemCandidatesSet).sort(
      (a, b) => COUPON_CATALOG[b].discountPercent - COUPON_CATALOG[a].discountPercent
    );

    // Enforce global single-winner coupon rule (no two coupons can be applied together)
    const winningCoupon = winningCartCoupon && itemCandidates.includes(winningCartCoupon)
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
