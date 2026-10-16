import { describe, expect, it } from "vitest";
import { normalizeFacebookExport } from "../src/facebook-export.js";

describe("normalizeFacebookExport", () => {
  it("keeps the share commentary separate from the original post", () => {
    const result = normalizeFacebookExport({
      timestamp: 1_700_000_000,
      title: "Lan shared Acme AI's post.",
      data: [{ post: "Worth reading" }],
      attachments: [{
        data: [{
          external_context: {
            name: "Original announcement",
            url: "https://www.facebook.com/acme/posts/123/?tracking=ignored",
          },
        }],
      }],
    }, { accountId: "lan", accountName: "Lan", collectedAt: "2026-10-16T00:00:00.000Z" });

    expect(result).toMatchObject({
      schemaVersion: "facebook_shared_post.v1",
      relationshipType: "share",
      sharedPost: {
        sharer: { id: "lan", name: "Lan" },
        text: "Worth reading",
        sharedAt: "2023-11-14T22:13:20.000Z",
      },
      originalPost: {
        canonicalUrl: "https://www.facebook.com/acme/posts/123",
        text: "Original announcement",
      },
    });
    expect(result.sharedPost.text).not.toContain("Original announcement");
  });

  it("normalizes an authored post without manufacturing an original post", () => {
    const result = normalizeFacebookExport({
      timestamp: 1_700_000_000,
      data: [{ post: "My own update" }],
      attachments: [{ data: [{ media: { uri: "posts/media/photo.jpg" } }] }],
    }, { accountId: "lan", accountName: "Lan", collectedAt: "2026-10-16T00:00:00.000Z" });

    expect(result.relationshipType).toBe("original");
    expect(result.originalPost).toBeNull();
    expect(result.sharedPost.attachments).toEqual([
      { type: "media", url: "posts/media/photo.jpg", title: null, mimeType: null },
    ]);
  });

  it("rejects malformed export entries instead of inventing content", () => {
    expect(() => normalizeFacebookExport(
      { title: "missing timestamp" },
      { accountId: "lan", accountName: "Lan", collectedAt: "2026-10-16T00:00:00.000Z" },
    )).toThrow("timestamp");
  });
});
