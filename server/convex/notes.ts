import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

const noteFields = {
  sessionId: v.id('sessions'),
  userId: v.id('users'),
  doctor: v.string(),
  specialty: v.string(),
  facility: v.string(),
  date: v.string(),
  status: v.union(v.literal('good'), v.literal('caution'), v.literal('flag')),
  chiefComplaint: v.string(),
  history: v.string(),
  risks: v.array(v.string()),
  advice: v.array(v.string()),
  prescription: v.array(v.object({ name: v.string(), dose: v.string() })),
};

// Persist the structured note generated from a session's transcript. One note
// per session — replaces any earlier draft.
export const save = mutation({
  args: noteFields,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('notes')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args });
      return existing._id;
    }
    return ctx.db.insert('notes', { ...args, createdAt: Date.now() });
  },
});

export const getBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) =>
    ctx.db
      .query('notes')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .unique(),
});

export const listByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) =>
    ctx.db
      .query('notes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect(),
});
