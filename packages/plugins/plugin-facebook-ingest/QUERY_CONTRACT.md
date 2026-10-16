## Facebook ingest query contract v1

This contract defines filters before an exploitation API is added. The API must expose normalized fields only; it must not return raw export payloads, access-session data, or storage credentials.

### Identity

- `author_id` identifies the author of the content being searched. For a share, it refers to `originalPost.author.id`; for an original post, it refers to `sharedPost.author.id`.
- `shared_by_account_id` identifies the account that created the share object and always maps to `sharedPost.sharer.id`.
- These filters are independent. A shared post must not be attributed to its sharer when an original author is known.
- A null source author ID remains null. Names are display metadata and are not identity or dedup keys.

### Language

- `language` is a nullable, normalized BCP 47 tag for the searched content, for example `vi`, `en`, or `en-US`.
- Null means unknown or not yet classified; it must not be coerced to a default language.
- Language classification is not part of export normalization v1, so this filter remains unavailable until a normalized column is migrated and populated.

### Dates and pagination

- `shared_from` and `shared_to` filter `sharedPost.sharedAt` and apply to the share object's timestamp.
- `published_from` and `published_to` filter the searched content's `publishedAt`: `originalPost.publishedAt` for a share, otherwise `sharedPost.publishedAt`.
- Bounds use RFC 3339 timestamps. `*_from` is inclusive and `*_to` is exclusive.
- Default ordering is descending by the selected timestamp, then descending by row `id`.
- Cursors encode the immutable pair `(sort_timestamp, id)`; clients must not use offset pagination.

### Storage boundary

- Query results may expose `raw_payload_ref` only as opaque internal metadata to authorized administrative code, never through the exploitation API.
- `raw_payload_ref` may be persisted only after the raw export has been uploaded successfully to the host object-storage capability. A failed or unavailable upload leaves it null.
