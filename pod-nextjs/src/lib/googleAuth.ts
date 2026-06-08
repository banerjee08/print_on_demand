// Client-side Google OAuth 2.0 Implicit Flow Helper
// Houses the login state, redirect handlers, and URL hash parser.

interface AuthState {
  accessToken: string | null;
  expiryTime: number | null; // epoch time in ms
}

let cachedAuth: AuthState = {
  accessToken: null,
  expiryTime: null,
};

// Available scopes for the integration
export const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/documents"
];

// Resolves Google Client ID from Next.js Env or local storage storage fallback
export function getGoogleClientId(): string {
  // 1. Check if configured in environment variables
  const envVal = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (envVal && envVal.trim() !== "" && envVal !== "MY_GOOGLE_CLIENT_ID") {
    return envVal.trim();
  }
  // 2. Fall back to local storage
  return typeof window !== "undefined" ? localStorage.getItem("google_workspace_client_id") || "" : "";
}

export function saveGoogleClientId(clientId: string) {
  if (clientId.trim()) {
    localStorage.setItem("google_workspace_client_id", clientId.trim());
  } else {
    localStorage.removeItem("google_workspace_client_id");
  }
}

// Begins the standard OAuth2 authentication redirect
export function loginWithGoogle() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("No Google Client ID configured.");
  }

  const redirectUri = window.location.origin;
  const scopesStr = REQUIRED_SCOPES.join(" ");
  
  // Create unique state to prevent CSRF
  const authState = Math.random().toString(36).substring(2, 15);
  localStorage.setItem("google_auth_state", authState);

  const oauthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  oauthUrl.searchParams.set("client_id", clientId);
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("response_type", "token");
  oauthUrl.searchParams.set("scope", scopesStr);
  oauthUrl.searchParams.set("state", authState);
  oauthUrl.searchParams.set("prompt", "consent");

  window.location.href = oauthUrl.toString();
}

// Parses URL Hash on startup or render to capture incoming token
export function parseAndHandleGoogleHash(): boolean {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token=")) return false;

    // Split and parse key-value pairs from fragment
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get("access_token");
    const expiresIn = params.get("expires_in"); // duration in seconds
    const state = params.get("state");

    const savedState = localStorage.getItem("google_auth_state");
    
    // Safely parse values
    if (token) {
      const durationMs = expiresIn ? parseInt(expiresIn, 10) * 1000 : 3600 * 1000;
      cachedAuth = {
        accessToken: token,
        expiryTime: Date.now() + durationMs,
      };

      // Clean path and hash to shield raw token from URLs and browser history
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return true;
    }
  } catch (err) {
    console.error("Failed to parse Google OAuth hash details:", err);
  }
  return false;
}

export function getGoogleAccessToken(): string | null {
  // Check if token exists and has not expired yet
  if (cachedAuth.accessToken && cachedAuth.expiryTime && Date.now() < cachedAuth.expiryTime) {
    return cachedAuth.accessToken;
  }
  
  // Clear expired token
  if (cachedAuth.accessToken) {
    logoutGoogle();
  }
  return null;
}

export function isGoogleAuthenticated(): boolean {
  return getGoogleAccessToken() !== null;
}

export function logoutGoogle() {
  cachedAuth = {
    accessToken: null,
    expiryTime: null,
  };
  localStorage.removeItem("google_auth_state");
}
