import type { GoogleIdTokenVerifier, VerifiedGoogleIdentity } from "@/lib/application/auth/ports/GoogleIdTokenVerifier";

interface GoogleTokenInfoResponse {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  sub?: string;
  iss?: string;
}

export class GoogleTokenInfoVerifier implements GoogleIdTokenVerifier {
  public constructor(
    private readonly clientId: string | undefined = process.env.GOOGLE_CLIENT_ID,
    private readonly fetcher: typeof fetch = fetch
  ) {}

  public async verify(idToken: string): Promise<VerifiedGoogleIdentity> {
    if (!this.clientId) throw new Error("GOOGLE_CLIENT_ID_NOT_CONFIGURED");
    const response = await this.fetcher(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!response.ok) throw new Error("GOOGLE_ID_TOKEN_INVALID");
    const payload = await response.json() as GoogleTokenInfoResponse;
    if (payload.aud !== this.clientId) throw new Error("GOOGLE_ID_TOKEN_INVALID");
    if (payload.iss !== "accounts.google.com" && payload.iss !== "https://accounts.google.com") {
      throw new Error("GOOGLE_ID_TOKEN_INVALID");
    }
    const isVerified = payload.email_verified === true || payload.email_verified === "true";
    if (!isVerified || !payload.email || !payload.sub) throw new Error("GOOGLE_ID_TOKEN_INVALID");
    return {
      email: payload.email.toLowerCase(),
      name: payload.name?.trim() || payload.email.split("@")[0],
      subject: payload.sub,
    };
  }
}
