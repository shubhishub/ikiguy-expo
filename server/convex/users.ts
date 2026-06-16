import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

// Email-only identity: find a user by email or create one.
export const upsert = mutation({
  args: { email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, { email, name }) => {
    const normalized = email.trim().toLowerCase();
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', normalized))
      .unique();
    if (existing) {
      return { userId: existing._id, email: existing.email, name: existing.name, created: false };
    }
    const userId = await ctx.db.insert('users', { email: normalized, name, createdAt: Date.now() });
    return { userId, email: normalized, name, created: true };
  },
});

export const get = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => ctx.db.get(userId),
});
