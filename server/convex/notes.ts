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
  summary: v.optional(v.string()),
  patientSummary: v.optional(v.string()),
  diagnoses: v.optional(v.array(v.string())),
  testsOrdered: v.optional(v.array(v.string())),
  followUp: v.optional(v.object({ date: v.string(), instructions: v.string() })),
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

// Patch the displayed header fields on a note (used by the edit screen).
export const updateDetails = mutation({
  args: {
    sessionId: v.id('sessions'),
    doctor: v.optional(v.string()),
    specialty: v.optional(v.string()),
    facility: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, ...fields }) => {
    const note = await ctx.db
      .query('notes')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .unique();
    if (!note) return;
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) if (val !== undefined) patch[k] = val;
    if (Object.keys(patch).length) await ctx.db.patch(note._id, patch);
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
