import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

// Start a new recording session for a user.
export const create = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) =>
    ctx.db.insert('sessions', {
      userId,
      status: 'recording',
      startedAt: Date.now(),
      transcript: '',
    }),
});

// Append a transcribed chunk and grow the running transcript.
export const appendChunk = mutation({
  args: { sessionId: v.id('sessions'), index: v.number(), text: v.string() },
  handler: async (ctx, { sessionId, index, text }) => {
    await ctx.db.insert('chunks', { sessionId, index, text, createdAt: Date.now() });
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error('Session not found');
    const transcript = [session.transcript, text].filter(Boolean).join(' ').trim();
    await ctx.db.patch(sessionId, { transcript });
    return { transcript };
  },
});

export const setStatus = mutation({
  args: {
    sessionId: v.id('sessions'),
    status: v.union(v.literal('recording'), v.literal('processing'), v.literal('complete')),
    durationSec: v.optional(v.number()),
  },
  handler: async (ctx, { sessionId, status, durationSec }) => {
    const patch: Record<string, unknown> = { status };
    if (status !== 'recording') patch.endedAt = Date.now();
    if (durationSec !== undefined) patch.durationSec = durationSec;
    await ctx.db.patch(sessionId, patch);
  },
});

export const get = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => ctx.db.get(sessionId),
});

export const listByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) =>
    ctx.db
      .query('sessions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect(),
});
