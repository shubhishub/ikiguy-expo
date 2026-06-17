import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Convex data model for iKiguy: users, recording sessions, transcript chunks,
// and the structured medical notes generated from each session.
export default defineSchema({
  users: defineTable({
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    age: v.optional(v.number()),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_email', ['email']),

  sessions: defineTable({
    userId: v.id('users'),
    status: v.union(v.literal('recording'), v.literal('processing'), v.literal('complete')),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    durationSec: v.optional(v.number()),
    // Full transcript produced from the recording.
    transcript: v.string(),
    // Visit context chosen before recording.
    doctor: v.optional(v.string()),
    specialty: v.optional(v.string()),
    facility: v.optional(v.string()),
    placeId: v.optional(v.string()),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    // Stored mp3 of the conversation, for playback.
    audioId: v.optional(v.id('_storage')),
  }).index('by_user', ['userId']),

  chunks: defineTable({
    sessionId: v.id('sessions'),
    index: v.number(),
    text: v.string(),
    createdAt: v.number(),
  }).index('by_session', ['sessionId']),

  reports: defineTable({
    userId: v.id('users'),
    fileName: v.string(),
    date: v.string(),
    label: v.string(),
    markers: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        value: v.number(),
        unit: v.string(),
        range: v.string(),
        status: v.union(v.literal('good'), v.literal('caution'), v.literal('flag')),
      }),
    ),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

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
