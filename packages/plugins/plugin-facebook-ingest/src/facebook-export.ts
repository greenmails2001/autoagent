import { createHash } from "node:crypto";
import {
  FACEBOOK_SHARED_POST_SCHEMA_VERSION,
  type FacebookAttachment,
  type FacebookPostObject,
  type FacebookSharedPostRecord,
} from "./contract.js";

type JsonObject = Record<string, unknown>;

export type FacebookExportAccount = {
  accountId: string;
  accountName: string;
  collectedAt: string;
};

function objectValue(value: unknown): JsonObject | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonObject : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function canonicalizeFacebookUrl(value: unknown): string | null {
  const raw = stringValue(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function postText(entry: JsonObject): string {
  const data = Array.isArray(entry.data) ? entry.data : [];
  return data.map(objectValue).map((item) => stringValue(item?.post)).find(Boolean) ?? "";
}

function attachmentData(entry: JsonObject): JsonObject[] {
  if (!Array.isArray(entry.attachments)) return [];
  return entry.attachments.flatMap((attachment) => {
    const value = objectValue(attachment);
    return Array.isArray(value?.data) ? value.data.map(objectValue).filter((item): item is JsonObject => item !== null) : [];
  });
}

function mediaAttachments(data: JsonObject[]): FacebookAttachment[] {
  return data.flatMap((item) => {
    const media = objectValue(item.media);
    const url = stringValue(media?.uri);
    if (!url) return [];
    return [{ type: "media" as const, url, title: stringValue(media?.description), mimeType: null }];
  });
}

function originalFrom(data: JsonObject[]): FacebookPostObject | null {
  for (const item of data) {
    const external = objectValue(item.external_context);
    if (!external) continue;
    const canonicalUrl = canonicalizeFacebookUrl(external.url);
    const text = stringValue(external.name) ?? "";
    if (!canonicalUrl && !text) continue;
    return {
      sourcePostId: null,
      canonicalUrl,
      author: { id: null, name: null },
      text,
      publishedAt: null,
      attachments: canonicalUrl ? [{ type: "link", url: canonicalUrl, title: text || null, mimeType: null }] : [],
    };
  }
  return null;
}

function contentFingerprint(input: {
  accountId: string;
  text: string;
  sharedAt: string;
  attachments: FacebookAttachment[];
}): string {
  const stable = JSON.stringify({
    accountId: input.accountId,
    text: input.text.normalize("NFC").trim(),
    sharedAt: input.sharedAt,
    attachmentUrls: input.attachments.map((item) => item.url).sort(),
  });
  return sha256(`facebook_shared_post.v1\n${stable}`);
}

export function normalizeFacebookExport(entryValue: unknown, account: FacebookExportAccount): FacebookSharedPostRecord {
  const entry = objectValue(entryValue);
  if (!entry) throw new Error("Facebook export entry must be an object");
  if (typeof entry.timestamp !== "number" || !Number.isFinite(entry.timestamp)) {
    throw new Error("Facebook export entry timestamp is required");
  }
  const sharedAt = new Date(entry.timestamp * 1000).toISOString();
  const text = postText(entry);
  const data = attachmentData(entry);
  const attachments = mediaAttachments(data);
  const originalPost = originalFrom(data);
  const contentHash = contentFingerprint({ accountId: account.accountId, text, sharedAt, attachments });

  return {
    schemaVersion: FACEBOOK_SHARED_POST_SCHEMA_VERSION,
    source: "facebook",
    relationshipType: originalPost ? "share" : "original",
    dedupKey: `content:${contentHash}`,
    contentHash,
    collectedAt: account.collectedAt,
    crawlStatus: originalPost?.canonicalUrl || !originalPost ? "complete" : "partial",
    sharedPost: {
      sourcePostId: null,
      canonicalUrl: null,
      author: { id: account.accountId, name: account.accountName },
      sharer: { id: account.accountId, name: account.accountName },
      text,
      publishedAt: sharedAt,
      sharedAt,
      attachments,
    },
    originalPost,
  };
}
