import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

// Start a new recording session, capturing the visit context chosen up front.
export const create = mutation({
  args: {
    userId: v.id('users'),
    doctor: v.optional(v.string()),
    specialty: v.optional(v.string()),
    facility: v.optional(v.string()),
    placeId: v.optional(v.string()),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  },
  handler: async (ctx, args) =>
    ctx.db.insert('sessions', {
      userId: args.userId,
      status: 'recording',
      startedAt: Date.now(),
      transcript: '',
      doctor: args.doctor,
      specialty: args.specialty,
      facility: args.facility,
      placeId: args.placeId,
      address: args.address,
      lat: args.lat,
      lng: args.lng,
    }),
});

export const setTranscript = mutation({
  args: { sessionId: v.id('sessions'), transcript: v.string() },
  handler: async (ctx, { sessionId, transcript }) => {
    await ctx.db.patch(sessionId, { transcript });
  },
});

export const setAudio = mutation({
  args: { sessionId: v.id('sessions'), audioId: v.id('_storage') },
  handler: async (ctx, { sessionId, audioId }) => {
    await ctx.db.patch(sessionId, { audioId });
  },
});

// Update the visit context after recording (add doctor/location/type later).
export const updateContext = mutation({
  args: {
    sessionId: v.id('sessions'),
    doctor: v.optional(v.string()),
    specialty: v.optional(v.string()),
    facility: v.optional(v.string()),
    placeId: v.optional(v.string()),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  },
  handler: async (ctx, { sessionId, ...fields }) => {
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) if (val !== undefined) patch[k] = val;
    if (Object.keys(patch).length) await ctx.db.patch(sessionId, patch);
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

// Resolve a playable URL for a session's stored audio.
export const getAudioUrl = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.audioId) return null;
    return ctx.storage.getUrl(session.audioId);
  },
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
