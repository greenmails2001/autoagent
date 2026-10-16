export const FACEBOOK_SHARED_POST_SCHEMA_VERSION = "facebook_shared_post.v1" as const;

export type FacebookAttachment = {
  type: "link" | "media";
  url: string;
  title: string | null;
  mimeType: string | null;
};

export type FacebookPostObject = {
  sourcePostId: string | null;
  canonicalUrl: string | null;
  author: { id: string | null; name: string | null };
  text: string;
  publishedAt: string | null;
  attachments: FacebookAttachment[];
};

export type FacebookSharedPostRecord = {
  schemaVersion: typeof FACEBOOK_SHARED_POST_SCHEMA_VERSION;
  source: "facebook";
  relationshipType: "share" | "original";
  dedupKey: string;
  contentHash: string;
  collectedAt: string;
  crawlStatus: "complete" | "partial";
  sharedPost: FacebookPostObject & {
    sharer: { id: string; name: string };
    sharedAt: string;
  };
  originalPost: FacebookPostObject | null;
};
