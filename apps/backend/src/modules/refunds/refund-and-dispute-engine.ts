import { createHash } from 'crypto';
import { throwWithGitTrace } from '../../lib/git-error-tracer';

const THIS_FILE = 'apps/backend/src/modules/refunds/refund-and-dispute-engine.ts';

export type ResolutionReasonCode =
  | 'CHANGED_MIND_IN_2H_HOLD'
  | 'PRINT_DEFECT'
  | 'DAMAGED_IN_TRANSIT'
  | 'LOST_IN_TRANSIT'
  | 'WRONG_SIZE_ORDERED'
  | 'BUYERS_REMORSE_POST_PRODUCTION';

export type RequestedResolutionType =
  | 'FULL_REFUND'
  | 'PARTIAL_REFUND'
  | 'FREE_REPRINT'
  | 'SIZE_SWAP_VOUCHER';

export interface CustomerResolutionInput {
  readonly orderId: string;
  readonly customerId: string;
  readonly lineItemId?: string; // Undefined for full-order cancellation inside 2h hold
  readonly requestedQty: number;
  readonly reasonCode: ResolutionReasonCode;
  readonly preferredResolution: RequestedResolutionType;
  readonly defectPhotoSha256?: string;
  readonly defectPhotoPerceptualHash?: string;
}

export interface ResolutionDecisionResult {
  readonly status:
    | 'APPROVED_REFUND'
    | 'APPROVED_FREE_REPRINT'
    | 'OFFERED_SIZE_SWAP_VOUCHER'
    | 'IDEMPOTENT_ALREADY_PROCESSED'
    | 'BLOCKED_OPEN_PAYPAL_DISPUTE'
    | 'BLOCKED_ALREADY_REPRINTED'
    | 'BLOCKED_EXCEEDS_CAPTURE_CEILING'
    | 'ESCALATED_SUSPECTED_PHOTO_REUSE';
  readonly idempotencyKey: string;
  readonly netRefundCents: number;
  readonly freeShippingClawbackCents: number;
  readonly paypalRefundId?: string;
  readonly reprintChildOrderId?: string;
  readonly voucherCode?: string;
  readonly customerMessage: string;
}

export interface OrderLedgerSnapshot {
  readonly id: string;
  readonly customerId: string;
  readonly currencyCode: string;
  readonly subtotalCents: number;
  readonly totalCapturedCents: number;
  readonly totalRefundedCents: number;
  readonly freeShippingThresholdCents: number;
  readonly originalShippingWaivedCents: number;
  readonly fulfillmentStatus: 'HOLD_2HR_QA' | 'SENT_TO_PRINTIFY' | 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED';
  readonly hasOpenPaypalDispute: boolean;
  readonly activePaypalDisputeId?: string;
  readonly paypalCaptureId: string;
  readonly customerLifetimeRefundCount: number;
}

export interface OrderLineItemSnapshot {
  readonly id: string;
  readonly orderId: string;
  readonly isPersonalizedCustomItem: boolean;
  readonly quantity: number;
  readonly refundedOrReprintedQty: number;
  readonly netRefundableCeilingCents: number;
  readonly refundedAmountCents: number;
  readonly resolutionStatus:
    | 'NONE'
    | 'IN_REVIEW'
    | 'REFUNDED'
    | 'PARTIALLY_REFUNDED'
    | 'RESOLVED_VIA_REPRINT'
    | 'DISPUTE_FROZEN';
}

/**
 * Generates a deterministic SHA-256 idempotency key so rapid double-clicks,
 * multi-tab submissions, or network retries never create duplicate refunds.
 */
export function buildDeterministicRefundIdempotencyKey(input: CustomerResolutionInput): string {
  if (!input || !input.orderId || input.requestedQty <= 0) {
    throwWithGitTrace({
      errorCode: 'REFUND_INVALID_RESOLUTION_INPUT',
      message: 'Refund resolution input must include a valid orderId and requestedQty > 0.',
      serviceModule: 'RefundAndDisputeEngine',
      filePath: THIS_FILE,
      lineNumber: 88,
      httpStatus: 400,
      severity: 'WARN',
      sanitizedContext: { orderId: input?.orderId, requestedQty: input?.requestedQty },
    });
  }
  const canonical = [
    input.orderId.trim().toLowerCase(),
    (input.lineItemId ?? 'FULL_ORDER').trim().toLowerCase(),
    String(input.requestedQty),
    input.reasonCode,
  ].join('|');

  return `rfnd_${createHash('sha256').update(canonical).digest('hex').slice(0, 40)}`;
}

/**
 * Core Refund, Return, Reprint & Edge-Case Decision Engine.
 * Executed inside a PostgreSQL transaction after acquiring `SELECT ... FOR UPDATE NOWAIT` on `orders_ledger`.
 */
export function evaluateRefundAndReturnEdgeCases(
  input: CustomerResolutionInput,
  order: OrderLedgerSnapshot,
  lineItem?: OrderLineItemSnapshot,
  existingRequestResult?: { status: string; paypalRefundId?: string; netRefundCents: number },
  isDefectPhotoDuplicateInDb = false
): ResolutionDecisionResult {
  const idempotencyKey = buildDeterministicRefundIdempotencyKey(input);

  // EDGE CASE R1: Rapid Double-Click / Multi-Tab Duplicate Request
  if (existingRequestResult && existingRequestResult.status === 'APPROVED_COMPLETED') {
    return {
      status: 'IDEMPOTENT_ALREADY_PROCESSED',
      idempotencyKey,
      netRefundCents: existingRequestResult.netRefundCents,
      freeShippingClawbackCents: 0,
      paypalRefundId: existingRequestResult.paypalRefundId,
      customerMessage:
        'Your refund request has already been approved and processed. No duplicate action is needed.',
    };
  }

  // EDGE CASE R3: "Double Dipping" — Customer opened a PayPal Dispute AND requested a store refund
  if (order.hasOpenPaypalDispute) {
    return {
      status: 'BLOCKED_OPEN_PAYPAL_DISPUTE',
      idempotencyKey,
      netRefundCents: 0,
      freeShippingClawbackCents: 0,
      customerMessage: `Order has an active PayPal Resolution Center case (${order.activePaypalDisputeId ?? 'Open Dispute'}). Direct store refunds are locked while PayPal holds the funds; resolution will be completed directly inside your PayPal case.`,
    };
  }

  // EDGE CASE R4: Customer received a $0 Free Reprint and now demands a cash refund on the original item
  if (lineItem && lineItem.resolutionStatus === 'RESOLVED_VIA_REPRINT') {
    return {
      status: 'BLOCKED_ALREADY_REPRINTED',
      idempotencyKey,
      netRefundCents: 0,
      freeShippingClawbackCents: 0,
      customerMessage:
        'A free replacement reprint has already been dispatched for this item. Cash refunds cannot be stacked on top of a fulfilled free reprint.',
    };
  }

  // EDGE CASE R6: Recycled / Stock Defect Photo Fraud OR High-Velocity Serial Returner
  if (
    (input.reasonCode === 'PRINT_DEFECT' || input.reasonCode === 'DAMAGED_IN_TRANSIT') &&
    (isDefectPhotoDuplicateInDb || order.customerLifetimeRefundCount >= 2)
  ) {
    return {
      status: 'ESCALATED_SUSPECTED_PHOTO_REUSE',
      idempotencyKey,
      netRefundCents: 0,
      freeShippingClawbackCents: 0,
      customerMessage:
        'Your photo proof has been received and assigned to a Senior Quality Specialist for priority 12-hour verification.',
    };
  }

  // CASE A: Instant Cancellation Inside the 2-Hour Pre-Printify Hold Window ($0 Printify COGS loss!)
  if (order.fulfillmentStatus === 'HOLD_2HR_QA') {
    const remainingOrderBalance = order.totalCapturedCents - order.totalRefundedCents;
    const requestedGrossRefund = lineItem
      ? Math.floor((lineItem.netRefundableCeilingCents / lineItem.quantity) * input.requestedQty)
      : remainingOrderBalance;

    // EDGE CASE R5: Partial Cancel Drops Order Below Free-Shipping Threshold ($75)
    let shippingClawbackCents = 0;
    const remainingMerchandiseSubtotal = order.subtotalCents - (order.totalRefundedCents + requestedGrossRefund);
    if (
      lineItem &&
      remainingMerchandiseSubtotal > 0 &&
      remainingMerchandiseSubtotal < order.freeShippingThresholdCents &&
      order.originalShippingWaivedCents > 0
    ) {
      shippingClawbackCents = order.originalShippingWaivedCents;
    }

    const netRefundCents = Math.max(0, Math.min(remainingOrderBalance, requestedGrossRefund - shippingClawbackCents));

    return {
      status: 'APPROVED_REFUND',
      idempotencyKey,
      netRefundCents,
      freeShippingClawbackCents: shippingClawbackCents,
      customerMessage:
        shippingClawbackCents > 0
          ? `Partial cancellation approved inside the 2-hour hold window. Because remaining items are under the free-shipping threshold, standard shipping ($${(shippingClawbackCents / 100).toFixed(2)}) was adjusted from the refund.`
          : 'Order cancelled inside the 2-hour pre-production window. A 100% refund has been issued to your original PayPal payment method.',
    };
  }

  // CASE B: Post-Production Buyer's Remorse or Wrong Size on Personalized/Custom POD Goods
  // Protected by EU Directive 2011/83/EU Art. 16(c) & US Custom Goods Policy
  if (
    (input.reasonCode === 'WRONG_SIZE_ORDERED' || input.reasonCode === 'BUYERS_REMORSE_POST_PRODUCTION') &&
    lineItem?.isPersonalizedCustomItem
  ) {
    return {
      status: 'OFFERED_SIZE_SWAP_VOUCHER',
      idempotencyKey,
      netRefundCents: 0,
      freeShippingClawbackCents: 0,
      voucherCode: `LOULOU-SIZESWAP-50-${order.id.slice(0, 6).toUpperCase()}`,
      customerMessage:
        'Because this item was custom-printed specifically for you, it cannot be restocked. However, we have generated an instant 50% OFF Size-Swap Voucher so you can reorder a new size at production cost!',
    };
  }

  // CASE C: Verified Print Defect / Damaged / Lost in Transit (Covered by Printify Provider Credit)
  if (
    input.reasonCode === 'PRINT_DEFECT' ||
    input.reasonCode === 'DAMAGED_IN_TRANSIT' ||
    input.reasonCode === 'LOST_IN_TRANSIT'
  ) {
    // Always prioritize 1-Click Free Reprint first to retain revenue, or honor cash refund if requested
    if (input.preferredResolution === 'FREE_REPRINT') {
      return {
        status: 'APPROVED_FREE_REPRINT',
        idempotencyKey,
        netRefundCents: 0,
        freeShippingClawbackCents: 0,
        reprintChildOrderId: `REPRINT-${order.id.slice(0, 8).toUpperCase()}`,
        customerMessage:
          'We verified the issue and dispatched a Priority Free Reprint at $0 cost to you! No need to return the damaged item—please keep, recycle, or donate it.',
      };
    }

    // EDGE CASE R2: Salami-Slicing / Multi-Item Ceiling Enforcement
    const maxOrderRemaining = order.totalCapturedCents - order.totalRefundedCents;
    const maxItemRemaining = lineItem
      ? lineItem.netRefundableCeilingCents - lineItem.refundedAmountCents
      : maxOrderRemaining;

    const approvedCents = Math.min(maxOrderRemaining, maxItemRemaining);
    if (approvedCents <= 0) {
      return {
        status: 'BLOCKED_EXCEEDS_CAPTURE_CEILING',
        idempotencyKey,
        netRefundCents: 0,
        freeShippingClawbackCents: 0,
        customerMessage: 'The maximum refundable balance for this item/order has already been reached.',
      };
    }

    return {
      status: 'APPROVED_REFUND',
      idempotencyKey,
      netRefundCents: approvedCents,
      freeShippingClawbackCents: 0,
      customerMessage:
        'Your refund has been approved and sent to PayPal in your original checkout currency. No physical return is required for defective print items.',
    };
  }

  return {
    status: 'BLOCKED_EXCEEDS_CAPTURE_CEILING',
    idempotencyKey,
    netRefundCents: 0,
    freeShippingClawbackCents: 0,
    customerMessage: 'This request requires manual support review.',
  };
}
