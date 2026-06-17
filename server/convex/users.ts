import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

// Email-only identity: find a user by email or create one, storing any profile
// details collected during onboarding.
export const upsert = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    age: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();

    // Only patch fields that were actually provided.
    const fields: Record<string, unknown> = {};
    if (args.firstName !== undefined) fields.firstName = args.firstName;
    if (args.lastName !== undefined) fields.lastName = args.lastName;
    if (args.phone !== undefined) fields.phone = args.phone;
    if (args.age !== undefined) fields.age = args.age;

    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();

    if (existing) {
      if (Object.keys(fields).length) await ctx.db.patch(existing._id, fields);
      const doc = await ctx.db.get(existing._id);
      return { userId: existing._id, ...view(doc), created: false };
    }

    const userId = await ctx.db.insert('users', { email, ...fields, createdAt: Date.now() });
    const doc = await ctx.db.get(userId);
    return { userId, ...view(doc), created: true };
  },
});

export const get = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const doc = await ctx.db.get(userId);
    return doc ? { userId, ...view(doc) } : null;
  },
});

// Permanently delete a user and ALL of their data: sessions (+ chunks + stored
// audio), notes, reports, and the user record itself.
export const deleteAccount = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const s of sessions) {
      if (s.audioId) {
        try {
          await ctx.storage.delete(s.audioId);
        } catch {
          /* already gone */
        }
      }
      const chunks = await ctx.db
        .query('chunks')
        .withIndex('by_session', (q) => q.eq('sessionId', s._id))
        .collect();
      for (const c of chunks) await ctx.db.delete(c._id);
      await ctx.db.delete(s._id);
    }

    const notes = await ctx.db
      .query('notes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const n of notes) await ctx.db.delete(n._id);

    const reports = await ctx.db
      .query('reports')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const r of reports) await ctx.db.delete(r._id);

    await ctx.db.delete(userId);
    return { deleted: true };
  },
});

// Public-safe projection of a user document.
function view(doc: Record<string, unknown> | null) {
  return {
    email: doc?.email ?? null,
    firstName: doc?.firstName ?? null,
    lastName: doc?.lastName ?? null,
    phone: doc?.phone ?? null,
    age: doc?.age ?? null,
  };
}
