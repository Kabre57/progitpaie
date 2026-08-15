export interface VerifiedGoogleIdentity {
  email: string;
  name: string;
  subject: string;
}

export interface GoogleIdTokenVerifier {
  verify(idToken: string): Promise<VerifiedGoogleIdentity>;
}
