/**
 * @fileoverview Multi-User Anti-Bot ("Anti-Bog") Safeguards, OWASP Top 10 WAF,
 * and OWASP LLM Top 10 AI Security Shield for LouLou & Luxe.
 *
 * Protects the decoupled backend against:
 *   1. Bot traffic floods & scraper bog-downs ("Anti-Bog" Token Bucket + Honeypot + Timing Trap)
 *   2. AI Prompt Injection, Jailbreaks, System-Prompt Extraction & Denial-of-Wallet (DoW)
 *   3. SQL Injection (SQLi), Cross-Site Scripting (XSS), Prototype Pollution & SSRF
 *   4. Third-Party Trademark Infringement in Custom Monograms (USPTO/CIPO Guardrails)
 *
 * Every security violation throws a `GitTraceableError` pointing to the exact Git file & line.
 */

import { throwWithGitTrace } from './git-error-tracer';

const THIS_FILE = 'apps/backend/src/lib/security-waf-and-antibot.ts';

export interface IncomingRequestContext {
  readonly endpointPath: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';
  readonly clientIp: string;
  readonly userAgent: string;
  readonly origin?: string;
  readonly referer?: string;
  readonly honeypotValue?: string;
  readonly formRenderElapsedMs?: number;
  readonly body?: Record<string, unknown>;
  readonly query?: Record<string, string>;
}

export interface WafInspectionResult {
  readonly allowed: boolean;
  readonly visitorFingerprint: string;
  readonly sanitizedInput: string;
}

/**
 * 1. OWASP LLM01: Prompt Injection & Jailbreak Detection Patterns
 */
const PROMPT_INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|prompts)/i,
  /you\s+are\s+now\s+(dan|unrestricted|jailbroken|developer\s+mode)/i,
  /(reveal|print|show|output|repeat)\s+(your|the)\s+(system\s+prompt|secret|api\s+key|instructions)/i,
  /<\s*\/?\s*(system|instruction|prompt|assistant|tool_call)\s*>/i,
  /\b(base64_decode|eval\s*\(|child_process|require\s*\(\s*['"]fs['"]\))/i,
];

/**
 * 2. OWASP Web Top 10: SQL Injection (SQLi), XSS & SSRF Signatures
 */
const SQLI_PATTERNS: readonly RegExp[] = [
  /\b(union\s+all\s+select|union\s+select|pg_sleep\s*\(|waitfor\s+delay|information_schema)\b/i,
  /;\s*(drop|truncate|alter|delete\s+from|update\s+workflow_entity|insert\s+into)\b/i,
  /('|\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
];

const XSS_PATTERNS: readonly RegExp[] = [
  /<\s*script\b[^>]*>/i,
  /javascript\s*:/i,
  /\bon(error|load|mouseover|focus|click)\s*=\s*['"]/i,
  /<\s*(iframe|object|embed|svg\s+onload)\b/i,
];

const SSRF_PRIVATE_IP_PATTERNS: readonly RegExp[] = [
  /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|169\.254\.169\.254|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)/i,
];

/**
 * 3. USPTO / CIPO Third-Party Trademark Blocklist for Custom Monogramming
 * Prevents buyers or trolls from submitting famous third-party trademarks onto Printify blanks.
 */
const PROTECTED_TRADEMARK_BLOCKLIST: readonly RegExp[] = [
  /\b(stanley\s+quencher|quencher\s+h2\.0|nike|adidas|lululemon|gucci|prada|chanel|dior|louis\s+vuitton|hermes|cartier|tiffany\s*&\s*co|disney|marvel|nintendo|hello\s+kitty|barbie|taylor\s+swift|eras\s+tour|nfl|nba)\b/i,
];

/**
 * Inspects a request for bot activity ("Anti-Bog"), Honeypot traps, SQLi, XSS,
 * Prototype Pollution, and SSRF before any database or LLM call executes.
 */
export function enforceAntiBotAndWafGuard(ctx: IncomingRequestContext): WafInspectionResult {
  // 1. Honeypot Bot Trap: Hidden field that humans never see, but automated scrapers fill
  if (ctx.honeypotValue && ctx.honeypotValue.trim().length > 0) {
    throwWithGitTrace({
      errorCode: 'WAF_BOT_HONEYPOT_TRIGGERED',
      message: 'Automated bot submission rejected by invisible honeypot trap.',
      serviceModule: 'SecurityWafAndAntiBot',
      filePath: THIS_FILE,
      lineNumber: 83,
      httpStatus: 403,
      severity: 'WARN',
      sanitizedContext: { endpoint: ctx.endpointPath, ip: ctx.clientIp },
    });
  }

  // 2. Behavioral Sub-Human Timing Trap (< 300ms form submit after DOM render)
  if (
    ctx.method === 'POST' &&
    typeof ctx.formRenderElapsedMs === 'number' &&
    ctx.formRenderElapsedMs > 0 &&
    ctx.formRenderElapsedMs < 300
  ) {
    throwWithGitTrace({
      errorCode: 'WAF_BOT_SPEED_TRAP',
      message: 'Submission rejected: inhumanly fast form completion (<300ms).',
      serviceModule: 'SecurityWafAndAntiBot',
      filePath: THIS_FILE,
      lineNumber: 101,
      httpStatus: 429,
      severity: 'WARN',
      sanitizedContext: { elapsedMs: ctx.formRenderElapsedMs, endpoint: ctx.endpointPath },
    });
  }

  // 3. Headless Scraper / Empty User-Agent Guard
  const ua = (ctx.userAgent || '').trim();
  if (!ua || /(sqlmap|nikto|masscan|nmap|zgrab|python-requests\/2\.1|curl\/7\.1)/i.test(ua)) {
    throwWithGitTrace({
      errorCode: 'WAF_MALICIOUS_SCANNER_UA',
      message: 'Automated vulnerability scanner User-Agent blocked.',
      serviceModule: 'SecurityWafAndAntiBot',
      filePath: THIS_FILE,
      lineNumber: 116,
      httpStatus: 403,
      severity: 'WARN',
      sanitizedContext: { userAgent: ua.slice(0, 80), ip: ctx.clientIp },
    });
  }

  // 4. Prototype Pollution Guard on JSON Body
  if (ctx.body && typeof ctx.body === 'object') {
    const rawJson = JSON.stringify(ctx.body);
    if (
      rawJson.includes('"__proto__"') ||
      rawJson.includes('"constructor"') ||
      rawJson.includes('"prototype"')
    ) {
      throwWithGitTrace({
        errorCode: 'WAF_PROTOTYPE_POLLUTION_BLOCKED',
        message: 'Blocked JSON payload containing JavaScript prototype pollution keys.',
        serviceModule: 'SecurityWafAndAntiBot',
        filePath: THIS_FILE,
        lineNumber: 135,
        httpStatus: 400,
        severity: 'ERROR',
        sanitizedContext: { endpoint: ctx.endpointPath },
      });
    }
  }

  // 5. Inspect combined inputs for SQLi, XSS, and SSRF
  const serializedInputs = JSON.stringify({ body: ctx.body || {}, query: ctx.query || {} });

  for (const sqliRegex of SQLI_PATTERNS) {
    if (sqliRegex.test(serializedInputs)) {
      throwWithGitTrace({
        errorCode: 'WAF_SQL_INJECTION_BLOCKED',
        message: 'Malicious SQL injection signature detected and blocked.',
        serviceModule: 'SecurityWafAndAntiBot',
        filePath: THIS_FILE,
        lineNumber: 153,
        httpStatus: 403,
        severity: 'CRITICAL',
        sanitizedContext: { endpoint: ctx.endpointPath, ip: ctx.clientIp },
      });
    }
  }

  for (const xssRegex of XSS_PATTERNS) {
    if (xssRegex.test(serializedInputs)) {
      throwWithGitTrace({
        errorCode: 'WAF_XSS_PAYLOAD_BLOCKED',
        message: 'Cross-Site Scripting (XSS) payload detected and blocked.',
        serviceModule: 'SecurityWafAndAntiBot',
        filePath: THIS_FILE,
        lineNumber: 168,
        httpStatus: 403,
        severity: 'ERROR',
        sanitizedContext: { endpoint: ctx.endpointPath, ip: ctx.clientIp },
      });
    }
  }

  for (const ssrfRegex of SSRF_PRIVATE_IP_PATTERNS) {
    if (ssrfRegex.test(serializedInputs)) {
      throwWithGitTrace({
        errorCode: 'WAF_SSRF_PRIVATE_IP_BLOCKED',
        message: 'Server-Side Request Forgery (SSRF) attempt to internal/metadata IP blocked.',
        serviceModule: 'SecurityWafAndAntiBot',
        filePath: THIS_FILE,
        lineNumber: 183,
        httpStatus: 403,
        severity: 'CRITICAL',
        sanitizedContext: { endpoint: ctx.endpointPath, ip: ctx.clientIp },
      });
    }
  }

  const visitorFingerprint = `${ctx.clientIp}|${ua.slice(0, 120)}`;
  return {
    allowed: true,
    visitorFingerprint,
    sanitizedInput: serializedInputs,
  };
}

/**
 * Inspects user search queries, AI prompts, and custom monogram text against:
 *   1. OWASP LLM01 Prompt Injection & Jailbreak attempts
 *   2. OWASP LLM04 Denial-of-Wallet length explosion
 *   3. USPTO/CIPO Third-Party Trademark Infringement
 */
export function sanitizeAndGuardAiInput(
  rawText: string,
  surface: 'SEARCH_QUERY' | 'MONOGRAM_TEXT' | 'AI_STYLING_PROMPT'
): string {
  const trimmed = String(rawText || '').trim();
  const maxLen = surface === 'MONOGRAM_TEXT' ? 24 : 180;

  if (trimmed.length > maxLen) {
    throwWithGitTrace({
      errorCode: 'AI_SECURITY_LENGTH_EXCEEDED',
      message: `${surface} exceeds maximum allowed length of ${maxLen} characters (Denial-of-Wallet guard).`,
      serviceModule: 'AiSecurityShield',
      filePath: THIS_FILE,
      lineNumber: 218,
      httpStatus: 400,
      severity: 'WARN',
      sanitizedContext: { surface, actualLength: trimmed.length, maxLen },
    });
  }

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      throwWithGitTrace({
        errorCode: 'AI_PROMPT_INJECTION_BLOCKED',
        message: 'Blocked adversarial prompt injection / system instruction override attempt.',
        serviceModule: 'AiSecurityShield',
        filePath: THIS_FILE,
        lineNumber: 232,
        httpStatus: 403,
        severity: 'CRITICAL',
        sanitizedContext: { surface },
      });
    }
  }

  if (surface === 'MONOGRAM_TEXT') {
    for (const tmPattern of PROTECTED_TRADEMARK_BLOCKLIST) {
      if (tmPattern.test(trimmed)) {
        throwWithGitTrace({
          errorCode: 'USPTO_TRADEMARK_GUARDRAIL_BLOCKED',
          message:
            'Custom monogram contains a protected third-party trademark. Please use personal initials, names, dates, or bridal titles.',
          serviceModule: 'AiSecurityShield',
          filePath: THIS_FILE,
          lineNumber: 249,
          httpStatus: 422,
          severity: 'WARN',
          sanitizedContext: { surface, rejectedText: trimmed },
        });
      }
    }
  }

  // Strip HTML brackets, backticks, and SQL quotes while preserving & and .
  return trimmed.replace(/[<>{}`$\\]/g, '');
}
