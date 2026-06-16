import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Convex data model for iKiguy: users, recording sessions, transcript chunks,
// and the structured medical notes generated from each session.
export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_email', ['email']),

  sessions: defineTable({
    userId: v.id('users'),
    status: v.union(v.literal('recording'), v.literal('processing'), v.literal('complete')),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    durationSec: v.optional(v.number()),
    // Accumulated transcript across all chunks, appended live.
    transcript: v.string(),
  }).index('by_user', ['userId']),

  chunks: defineTable({
    sessionId: v.id('sessions'),
    index: v.number(),
    text: v.string(),
    createdAt: v.number(),
  }).index('by_session', ['sessionId']),

  notes: defineTable({
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
    createdAt: v.number(),
  })
    .index('by_session', ['sessionId'])
    .index('by_user', ['userId']),
});
