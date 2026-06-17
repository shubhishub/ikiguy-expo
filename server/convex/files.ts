import { mutation } from './_generated/server';

// Returns a short-lived URL the server can POST the audio file to. Convex
// responds with a storageId we then attach to the session.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});
