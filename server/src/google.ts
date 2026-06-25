import { OAuth2Client } from 'google-auth-library';

// Google Sign-In: verify the ID token the app obtains from Google, server-side,
// so the identity is cryptographically proven rather than self-asserted.
//
// A token issued for any platform (web / iOS / Android) carries that platform's
// OAuth client id in its `aud` claim, so we accept the full set. Configure them
// as a comma-separated list in GOOGLE_CLIENT_IDS (GOOGLE_CLIENT_ID also works).
const audiences = (process.env.GOOGLE_CLIENT_IDS ?? process.env.GOOGLE_CLIENT_ID ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const client = new OAuth2Client();

export function googleConfigured(): boolean {
  return audiences.length > 0;
}

// Verified profile, with optional fields omitted (never null) so the object can
// be handed straight to a Convex mutation whose validators reject null.
export type GoogleProfile = {
  googleId: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

// Verify a Google ID token and return the verified profile, or throw a 4xx.
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!audiences.length) {
    throw Object.assign(new Error('Google sign-in is not configured on the server'), { statusCode: 503 });
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: audiences });
    payload = ticket.getPayload();
  } catch {
    throw Object.assign(new Error('Invalid Google token'), { statusCode: 401 });
  }

  if (!payload?.sub || !payload.email) {
    throw Object.assign(new Error('Google token missing identity'), { statusCode: 401 });
  }
  if (payload.email_verified === false) {
    throw Object.assign(new Error('Google email is not verified'), { statusCode: 401 });
  }

  const profile: GoogleProfile = { googleId: payload.sub, email: payload.email };
  if (payload.name) profile.name = payload.name;
  if (payload.given_name) profile.firstName = payload.given_name;
  if (payload.family_name) profile.lastName = payload.family_name;
  if (payload.picture) profile.avatarUrl = payload.picture;
  return profile;
}
