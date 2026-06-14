import { z } from "zod";

// ── Content blocks ────────────────────────────────────────────────────────────

const textBlockSchema = z.object({
  type: z.literal("text"),
  value: z
    .string()
    .trim()
    .min(1, "Text block must not be empty.")
    .max(5000, "Text block must be at most 5000 characters."),
});

const urlBlockSchema = (type: "image" | "video" | "audio" | "gif" | "sticker") =>
  z.object({
    type: z.literal(type),
    url: z.string().trim().min(1, `${type} block must have a URL.`),
  });

const linkBlockSchema = z.object({
  type: z.literal("link"),
  url: z.string().trim().min(1, "Link block must have a URL."),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export const contentBlockSchema = z.discriminatedUnion("type", [
  textBlockSchema,
  urlBlockSchema("image"),
  urlBlockSchema("video"),
  urlBlockSchema("audio"),
  urlBlockSchema("gif"),
  urlBlockSchema("sticker"),
  linkBlockSchema,
]);

export type ContentBlock = z.infer<typeof contentBlockSchema>;

// ── Post ──────────────────────────────────────────────────────────────────────

export const postFormSchema = z.object({
  content_blocks: z
    .array(contentBlockSchema)
    .min(1, "Post must have at least one content block.")
    .max(50, "Post may not have more than 50 content blocks."),
});

export type PostFormInput = z.infer<typeof postFormSchema>;

// ── Comment ───────────────────────────────────────────────────────────────────

export const commentFormSchema = z.object({
  content_blocks: z
    .array(contentBlockSchema)
    .min(1, "Comment must have at least one content block.")
    .max(50, "Comment may not have more than 50 content blocks."),
});

export type CommentFormInput = z.infer<typeof commentFormSchema>;

// ── Repost ────────────────────────────────────────────────────────────────────
// Simple repost: content_blocks is empty.
// Quote repost: content_blocks carries the added commentary.

export const repostFormSchema = z.object({
  content_blocks: z
    .array(contentBlockSchema)
    .max(50, "Quote repost may not have more than 50 content blocks.")
    .default([]),
});

export type RepostFormInput = z.infer<typeof repostFormSchema>;