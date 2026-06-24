import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

// Record an audio chunk that was uploaded to Convex storage. One row per
// segment; logically grouped per session via the `by_session` index.
export const add = mutation({
  args: {
    sessionId: v.id('sessions'),
    index: v.number(),
    storageId: v.id('_storage'),
    mimeType: v.string(),
    durationSec: v.optional(v.number()),
  },
  handler: async (ctx, args) =>
    ctx.db.insert('chunks', { ...args, createdAt: Date.now() }),
});

export const listBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const rows = await ctx.db
      .query('chunks')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect();
    return rows.sort((a, b) => a.index - b.index);
  },
});

// Resolve a playable URL per chunk, in order, so the server can download and
// combine them before transcription.
export const urlsBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const rows = await ctx.db
      .query('chunks')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect();
    rows.sort((a, b) => a.index - b.index);
    return Promise.all(
      rows.map(async (r) => ({
        index: r.index,
        mimeType: r.mimeType,
        url: await ctx.storage.getUrl(r.storageId),
      })),
    );
  },
});

// Remove a session's chunk rows and their storage blobs (called after a
// successful finalize; the combined mp3 is kept separately for playback).
export const deleteBySession = mutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const rows = await ctx.db
      .query('chunks')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect();
    await Promise.all(
      rows.map(async (r) => {
        await ctx.storage.delete(r.storageId).catch(() => {});
        await ctx.db.delete(r._id);
      }),
    );
    return rows.length;
  },
});
