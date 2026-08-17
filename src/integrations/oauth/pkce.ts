import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

/**
 * Generic OAuth 2.0 Authorization Code + PKCE flow for desktop apps (RFC
 * 8252 loopback pattern) — no client secret required, so it's safe to embed
 * a user-supplied client ID directly in the frontend. Both Google Calendar
 * and Spotify integrations use this; each just supplies its own endpoints,
 * client ID, and a fixed loopback port that must match the redirect URI
 * registered on the provider's OAuth app.
 */
export interface OAuthPkceConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  scope: string;
  /** Fixed loopback port — must match the redirect URI registered with the provider. */
  redirectPort: number;
  extraAuthParams?: Record<string, string>;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  /** epoch ms */
  expiresAt: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function codeChallengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

/** Runs the full flow: opens the system browser, waits for the redirect, exchanges the code. */
export async function runOAuthPkceFlow(config: OAuthPkceConfig): Promise<OAuthTokens> {
  const redirectUri = `http://127.0.0.1:${config.redirectPort}/callback`;
  const verifier = randomString(32);
  const challenge = await codeChallengeFor(verifier);
  const state = randomString(16);

  const authorizeUrl = new URL(config.authorizeUrl);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", config.scope);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);
  for (const [k, v] of Object.entries(config.extraAuthParams ?? {})) {
    authorizeUrl.searchParams.set(k, v);
  }

  // Start listening before opening the browser so the redirect can't race it.
  const redirectPromise = invoke<string>("oauth_await_redirect", { port: config.redirectPort });
  await openUrl(authorizeUrl.toString());
  const query = await redirectPromise;

  const params = new URLSearchParams(query);
  if (params.get("error")) {
    throw new Error(`sign-in was denied or failed: ${params.get("error")}`);
  }
  if (params.get("state") !== state) {
    throw new Error("sign-in response failed state verification — possible CSRF, aborting");
  }
  const code = params.get("code");
  if (!code) {
    throw new Error("sign-in redirect had no authorization code");
  }

  return exchangeCodeForTokens(config, code, verifier, redirectUri);
}

async function exchangeCodeForTokens(
  config: OAuthPkceConfig,
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId,
    code_verifier: verifier,
  });
  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
}

export async function refreshOAuthTokens(
  config: Pick<OAuthPkceConfig, "tokenUrl" | "clientId">,
  refreshToken: string,
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
  });
  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`token refresh failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return {
    accessToken: json.access_token,
    // Some providers (Google) omit refresh_token on refresh responses — keep the old one.
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
}
