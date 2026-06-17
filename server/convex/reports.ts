import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

const marker = v.object({
  id: v.string(),
  name: v.string(),
  value: v.number(),
  unit: v.string(),
  range: v.string(),
  status: v.union(v.literal('good'), v.literal('caution'), v.literal('flag')),
});

export const add = mutation({
  args: {
    userId: v.id('users'),
    fileName: v.string(),
    date: v.string(),
    label: v.string(),
    markers: v.array(marker),
  },
  handler: async (ctx, args) => ctx.db.insert('reports', { ...args, createdAt: Date.now() }),
});

export const listByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) =>
    ctx.db
      .query('reports')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect(),
});

export const remove = mutation({
  args: { reportId: v.id('reports') },
  handler: async (ctx, { reportId }) => {
    await ctx.db.delete(reportId);
  },
});
