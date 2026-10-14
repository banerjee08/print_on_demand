/**
 * 5-Layer API Cost Shield, Rate Limiter & Printify Financial Spend Circuit Breaker
 * Prevents runaway cloud bills, card-testing attacks, and duplicate Printify orders.
 */

import { throwWithGitTrace } from './git-error-tracer';

const THIS_FILE = 'apps/backend/src/lib/cost-guard.ts';

export interface RedisLikeClient {
  incrby(key: string, value: number): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', duration: number, flag: 'NX'): Promise<'OK' | null>;
}

export type ProtectedService =
  | 'GEMINI_FLASH_RPD'
  | 'AI_CUSTOMIZER_GUEST_24H'
  | 'AI_CUSTOMIZER_AUTH_24H'
  | 'CHATBOT_SESSION_10M'
  | 'CHECKOUT_DECLINE_VELOCITY_15M'
  | 'PRINTIFY_HOURLY_COGS_CENTS'
  | 'R2_STORAGE_BYTES_USED'
  | 'MARKETING_EMAIL_DAILY';

export interface BudgetDecision {
  readonly allowed: boolean;
  readonly currentUsage: number;
  readonly hardLimit: number;
  readonly fallbackAction: 'PROCEED' | 'FALLBACK_LOCAL_OLLAMA' | 'TRIP_ADMIN_HOLD_QUEUE' | 'REJECT_429';
  readonly reason?: string;
}

export const SERVICE_HARD_LIMITS: Record<
  ProtectedService,
  { limit: number; windowSeconds: number; fallback: BudgetDecision['fallbackAction'] }
> = {
  // 90% of Gemini Flash 1,500 RPD free tier -> auto-falls back to local KVM2 Ollama ($0 cost)
  GEMINI_FLASH_RPD: { limit: 1350, windowSeconds: 86400, fallback: 'FALLBACK_LOCAL_OLLAMA' },
  // 3 free AI customizer previews per 24h for unauthenticated guests
  AI_CUSTOMIZER_GUEST_24H: { limit: 3, windowSeconds: 86400, fallback: 'REJECT_429' },
  // 10 free AI customizer previews per 24h for Google OAuth logged-in users
  AI_CUSTOMIZER_AUTH_24H: { limit: 10, windowSeconds: 86400, fallback: 'REJECT_429' },
  // Max 15 chatbot messages per 10 minutes per session
  CHATBOT_SESSION_10M: { limit: 15, windowSeconds: 600, fallback: 'REJECT_429' },
  // Anti-card-testing: Max 5 payment attempts per 15 minutes per cart/IP
  CHECKOUT_DECLINE_VELOCITY_15M: { limit: 5, windowSeconds: 900, fallback: 'REJECT_429' },
  // Printify Financial Circuit Breaker: $1,000/hr COGS cap before holding for 1-click Admin review
  PRINTIFY_HOURLY_COGS_CENTS: { limit: 100_000, windowSeconds: 3600, fallback: 'TRIP_ADMIN_HOLD_QUEUE' },
  // Cloudflare R2 Free Tier Guard: 8.5 GB hard ceiling (below 10 GB free limit)
  R2_STORAGE_BYTES_USED: { limit: 8_500_000_000, windowSeconds: 2592000, fallback: 'REJECT_429' },
  // Resend/Brevo Daily Marketing Cap (reserves 15% of free quota strictly for order receipts)
  MARKETING_EMAIL_DAILY: { limit: 250, windowSeconds: 86400, fallback: 'REJECT_429' },
};

export async function evaluateServiceBudget(
  redis: RedisLikeClient,
  service: ProtectedService,
  scopeId: string,
  incrementBy = 1
): Promise<BudgetDecision> {
  const cfg = SERVICE_HARD_LIMITS[service];
  if (!cfg) {
    throwWithGitTrace({
      errorCode: 'COST_GUARD_UNKNOWN_SERVICE',
      message: `Unknown ProtectedService passed to evaluateServiceBudget: ${String(service)}`,
      serviceModule: 'CostGuard',
      filePath: THIS_FILE,
      lineNumber: 63,
      httpStatus: 500,
      severity: 'ERROR',
      sanitizedContext: { service, scopeId },
    });
  }
  const key = `cost_shield:${service}:${scopeId}`;

  const currentUsage = await redis.incrby(key, incrementBy);
  if (currentUsage === incrementBy) {
    await redis.expire(key, cfg.windowSeconds);
  }

  if (currentUsage > cfg.limit) {
    return {
      allowed: false,
      currentUsage,
      hardLimit: cfg.limit,
      fallbackAction: cfg.fallback,
      reason: `Hard quota reached for ${service} (${currentUsage}/${cfg.limit}). Executing ${cfg.fallback}.`,
    };
  }

  return {
    allowed: true,
    currentUsage,
    hardLimit: cfg.limit,
    fallbackAction: 'PROCEED',
  };
}

/**
 * Acquires an atomic idempotency mutex so double-clicks or parallel webhooks
 * can never charge a customer twice or submit duplicate Printify production orders.
 */
export async function acquireIdempotencyLock(
  redis: RedisLikeClient,
  lockScope: 'CHECKOUT_CAPTURE' | 'PRINTIFY_ORDER_SUBMIT' | 'PAYPAL_REFUND',
  entityId: string,
  ttlSeconds = 60
): Promise<boolean> {
  const lockKey = `idempotency_lock:${lockScope}:${entityId}`;
  const acquired = await redis.set(lockKey, new Date().toISOString(), 'EX', ttlSeconds, 'NX');
  return acquired === 'OK';
}
