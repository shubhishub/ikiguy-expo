import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';

// String-addressed API references so the server compiles without running
// `convex codegen`. Once `bunx convex dev` has generated _generated, these
// resolve to the same functions at runtime.
export const api = anyApi;

const url = process.env.CONVEX_URL;
const client = url ? new ConvexHttpClient(url) : null;

export function requireConvex(): ConvexHttpClient {
  if (!client) {
    throw Object.assign(new Error('CONVEX_URL is not configured'), { statusCode: 503 });
  }
  return client;
}
