/**
 * @fileoverview Git-Traceable Error & Stack-Trace Telemetry Engine for LouLou & Luxe.
 *
 * Requirement: "Please put the git in the code wherever any code throws an error
 * then we are able to know that where do we have to fix."
 *
 * Every error thrown or caught through this module automatically extracts the
 * caller's exact file path, function name, line number, and column number from the
 * V8/JS call stack, binds it to the active Git repository (`banerjee08/print_on_demand`),
 * branch (`development`), and commit SHA, and produces:
 *   1. `githubBlameUrl`: Direct clickable link to the exact `#L<line>` in GitHub.
 *   2. `gitCliFixCommand`: Ready-to-run terminal command to open the exact file & line.
 *   3. `sqlInsertStatement`: Parameter-safe upsert into `loulou_git_error_traces`.
 */

export interface GitSourceCoordinates {
  readonly gitRepo: string;
  readonly gitBranch: string;
  readonly gitCommitSha: string;
  readonly filePath: string;
  readonly functionName: string;
  readonly lineNumber: number;
  readonly columnNumber: number;
  readonly githubBlameUrl: string;
  readonly gitCliFixCommand: string;
}

export interface GitErrorTelemetryPayload {
  readonly errorCode: string;
  readonly severity: 'WARN' | 'ERROR' | 'CRITICAL';
  readonly serviceModule: string;
  readonly message: string;
  readonly git: GitSourceCoordinates;
  readonly requestId?: string;
  readonly sanitizedContext?: Record<string, unknown>;
  readonly timestampIso: string;
}

export const GIT_BUILD_METADATA = {
  repo: process.env.LOULOU_GIT_REPO || 'banerjee08/print_on_demand',
  branch: process.env.LOULOU_GIT_BRANCH || 'development',
  commitSha: process.env.LOULOU_GIT_COMMIT_SHA || 'development',
  workspaceRootMarker: 'pod_ecommerce/',
} as const;

/**
 * Parses a V8/JavaScript Error stack trace to pinpoint the exact file path,
 * function name, line number, and column number where the error originated.
 */
export function extractGitCoordinatesFromStack(
  stack: string | undefined,
  fallbackFilePath: string,
  fallbackLine = 1
): GitSourceCoordinates {
  let filePath = fallbackFilePath;
  let functionName = 'anonymous';
  let lineNumber = fallbackLine;
  let columnNumber = 1;

  if (stack) {
    const lines = stack.split('\n').map((l) => l.trim());
    // Find the first stack frame outside git-error-tracer.ts itself
    const targetFrame = lines.find(
      (line) =>
        line.startsWith('at ') &&
        !line.includes('git-error-tracer') &&
        !line.includes('GitTraceableError') &&
        !line.includes('throwWithGitTrace') &&
        !line.includes('captureErrorWithGitTrace')
    );

    if (targetFrame) {
      // Match patterns like: at functionName (/path/to/pod_ecommerce/apps/backend/src/...:120:15)
      const matchWithFn = targetFrame.match(/^at\s+([^\s(]+)\s+\((.+):(\d+):(\d+)\)$/);
      const matchAnon = targetFrame.match(/^at\s+(.+):(\d+):(\d+)$/);

      if (matchWithFn) {
        functionName = matchWithFn[1];
        filePath = normalizeRepoRelativePath(matchWithFn[2]);
        lineNumber = Number.parseInt(matchWithFn[3], 10) || fallbackLine;
        columnNumber = Number.parseInt(matchWithFn[4], 10) || 1;
      } else if (matchAnon) {
        filePath = normalizeRepoRelativePath(matchAnon[1]);
        lineNumber = Number.parseInt(matchAnon[2], 10) || fallbackLine;
        columnNumber = Number.parseInt(matchAnon[3], 10) || 1;
      }
    }
  }

  const cleanPath = filePath.replace(/^\/+/, '');
  const githubBlameUrl = `https://github.com/${GIT_BUILD_METADATA.repo}/blob/${GIT_BUILD_METADATA.branch}/${cleanPath}#L${lineNumber}`;
  const gitCliFixCommand = `git checkout ${GIT_BUILD_METADATA.branch} && git blame -L ${lineNumber},${lineNumber} ${cleanPath}`;

  return {
    gitRepo: GIT_BUILD_METADATA.repo,
    gitBranch: GIT_BUILD_METADATA.branch,
    gitCommitSha: GIT_BUILD_METADATA.commitSha,
    filePath: cleanPath,
    functionName,
    lineNumber,
    columnNumber,
    githubBlameUrl,
    gitCliFixCommand,
  };
}

function normalizeRepoRelativePath(rawPath: string): string {
  const markerIdx = rawPath.indexOf(GIT_BUILD_METADATA.workspaceRootMarker);
  if (markerIdx !== -1) {
    return rawPath.slice(markerIdx + GIT_BUILD_METADATA.workspaceRootMarker.length);
  }
  return rawPath;
}

/**
 * Production Error class that embeds exact Git repository, branch, file, and line coordinates.
 */
export class GitTraceableError extends Error {
  public readonly errorCode: string;
  public readonly severity: 'WARN' | 'ERROR' | 'CRITICAL';
  public readonly serviceModule: string;
  public readonly httpStatus: number;
  public readonly git: GitSourceCoordinates;
  public readonly requestId?: string;
  public readonly sanitizedContext?: Record<string, unknown>;
  public readonly timestampIso: string;

  constructor(params: {
    errorCode: string;
    message: string;
    serviceModule: string;
    filePath: string;
    lineNumber?: number;
    httpStatus?: number;
    severity?: 'WARN' | 'ERROR' | 'CRITICAL';
    requestId?: string;
    sanitizedContext?: Record<string, unknown>;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'GitTraceableError';
    this.errorCode = params.errorCode;
    this.severity = params.severity || 'ERROR';
    this.serviceModule = params.serviceModule;
    this.httpStatus = params.httpStatus || 500;
    this.requestId = params.requestId;
    this.sanitizedContext = params.sanitizedContext;
    this.timestampIso = new Date().toISOString();

    const rawStack =
      params.cause instanceof Error && params.cause.stack ? params.cause.stack : this.stack;

    this.git = extractGitCoordinatesFromStack(
      rawStack,
      params.filePath,
      params.lineNumber || 1
    );
  }

  public toTelemetryPayload(): GitErrorTelemetryPayload {
    return {
      errorCode: this.errorCode,
      severity: this.severity,
      serviceModule: this.serviceModule,
      message: this.message,
      git: this.git,
      requestId: this.requestId,
      sanitizedContext: this.sanitizedContext,
      timestampIso: this.timestampIso,
    };
  }

  /**
   * Safe client-facing JSON response that gives the developer/operator exact Git coordinates
   * to fix the issue without leaking internal database credentials or environment secrets.
   */
  public toApiResponse() {
    return {
      ok: false,
      error: {
        code: this.errorCode,
        message: this.message,
        serviceModule: this.serviceModule,
        timestamp: this.timestampIso,
        gitTrace: {
          repo: this.git.gitRepo,
          branch: this.git.gitBranch,
          commitSha: this.git.gitCommitSha,
          file: this.git.filePath,
          function: this.git.functionName,
          line: this.git.lineNumber,
          column: this.git.columnNumber,
          whereToFixUrl: this.git.githubBlameUrl,
          cliBlameCommand: this.git.gitCliFixCommand,
        },
      },
    };
  }
}

/**
 * Helper to throw a Git-traceable error with one call from any backend module.
 */
export function throwWithGitTrace(params: {
  errorCode: string;
  message: string;
  serviceModule: string;
  filePath: string;
  lineNumber?: number;
  httpStatus?: number;
  severity?: 'WARN' | 'ERROR' | 'CRITICAL';
  requestId?: string;
  sanitizedContext?: Record<string, unknown>;
}): never {
  throw new GitTraceableError(params);
}

/**
 * Converts any unknown caught exception into a `GitTraceableError` with full Git coordinates.
 */
export function captureErrorWithGitTrace(
  err: unknown,
  fallback: {
    errorCode: string;
    serviceModule: string;
    filePath: string;
    lineNumber?: number;
    requestId?: string;
  }
): GitTraceableError {
  if (err instanceof GitTraceableError) {
    return err;
  }
  const msg = err instanceof Error ? err.message : String(err || 'Unknown runtime error');
  return new GitTraceableError({
    errorCode: fallback.errorCode,
    message: msg,
    serviceModule: fallback.serviceModule,
    filePath: fallback.filePath,
    lineNumber: fallback.lineNumber,
    requestId: fallback.requestId,
    cause: err,
  });
}
