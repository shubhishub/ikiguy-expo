import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

// Google Sign-In: upsert by verified Google identity. Matched first by the
// stable Google subject id, then by email (so an account created under the old
// email-only flow gets linked to its Google identity on first Google sign-in).
export const upsertGoogle = mutation({
  args: {
    googleId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();

    // Google is the source of truth for these fields, so always (re)apply them.
    const fields: Record<string, unknown> = { googleId: args.googleId, email };
    if (args.name !== undefined) fields.name = args.name;
    if (args.firstName !== undefined) fields.firstName = args.firstName;
    if (args.lastName !== undefined) fields.lastName = args.lastName;
    if (args.avatarUrl !== undefined) fields.avatarUrl = args.avatarUrl;

    const existing =
      (await ctx.db
        .query('users')
        .withIndex('by_google_id', (q) => q.eq('googleId', args.googleId))
        .unique()) ??
      (await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', email))
        .unique());

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      const doc = await ctx.db.get(existing._id);
      return { userId: existing._id, ...view(doc), created: false };
    }

    const userId = await ctx.db.insert('users', { ...fields, createdAt: Date.now() } as any);
    const doc = await ctx.db.get(userId);
    return { userId, ...view(doc), created: true };
  },
});

// Save the extra profile details Google doesn't provide (phone, age) and any
// edits to the name. Keyed by userId; only patches fields that were provided.
export const updateProfile = mutation({
  args: {
    userId: v.id('users'),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    age: v.optional(v.number()),
  },
  handler: async (ctx, { userId, ...rest }) => {
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) fields[key] = value;
    }
    if (Object.keys(fields).length) await ctx.db.patch(userId, fields);
    const doc = await ctx.db.get(userId);
    return doc ? { userId, ...view(doc) } : null;
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
    avatarUrl: doc?.avatarUrl ?? null,
  };
}
