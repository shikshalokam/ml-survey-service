# UserRoles Code Normalization Migration Script

## Purpose

This migration script normalizes the `code` field of all documents in the
`userRoles` MongoDB collection to **lowercase**.

It also resolves case-insensitive duplicates (e.g. `TEACHER`, `Teacher`, `teacher`)
by:

- Keeping the **most recently created document** (based on `createdAt`)
- Deleting **older duplicate documents**
- Writing audit logs for all updates and deletions

The goal is to ensure **data consistency**, **logical uniqueness**, and
**future safety** of the `userRoles.code` field.

---

## Problem Statement

Over time, the `userRoles` collection may contain multiple documents that differ
only by the casing of the `code` field:

```json
{ "code": "TEACHER" }
{ "code": "Teacher" }
{ "code": "teacher" }
````

MongoDB uniqueness is case-sensitive by default, so such duplicates can exist
and cause application-level conflicts.

---

## What the Migration Script Does

1. Connects to MongoDB using `process.env.MONGODB_URL`
2. Reads all documents from the `userRoles` collection
3. Groups documents by `code.toLowerCase()`
4. For each group:

   * Sorts documents by `createdAt` (newest first)
   * Retains the newest document
   * Updates its `code` value to lowercase (only if required)
   * Deletes all older duplicate documents
5. Writes audit output to two files:

   * `updatedIds.txt`
   * `deletedIds.txt`

---

## Audit Files Generated

After execution, two files are created in the same directory as the script.

### updatedIds.txt

Contains IDs of documents whose `code` field was updated.

### deletedIds.txt

Contains IDs of documents that were deleted because they were older duplicates.

---

## Requirements

* Node.js v14 or higher
* MongoDB accessible via a connection string
* Environment variable set:

```bash
MONGODB_URL=<your-mongodb-connection-string>
```

* Required dependency:

```bash
npm install mongodb
```

---

## How to Run the Migration

### 1. Set MongoDB URL in .env file


```bash
MONGODB_URL="mongodb://localhost:27017/your-db-name"
```
---

### 2. Navigate to ./migrations/updateUserRolesDocuments and run the below command to execute the script

```bash
node normalizeUserRolesCode.js
```
---

## Safety Notes

* Always run in **staging** before production
* Take a **database backup** before execution
* Review `deletedIds.txt` after running the script
* Assumes `createdAt` exists and is reliable

---
## Summary

This migration:

* Normalizes all `userRoles.code` values to lowercase
* Removes legacy case-based duplicates
* Preserves the most recent data
* Produces a clear audit trail
* Improves long-term data integrity

Migration outcome: **clean, consistent, and safe userRoles data**