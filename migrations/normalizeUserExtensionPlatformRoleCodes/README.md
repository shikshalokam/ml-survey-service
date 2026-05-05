# README — normalizePlatformRoleCodes Migration

## Script Location

```
migrations/normalizeUserExtensionPlatformRoleCodes/normalizePlatformRoleCodes.js
```

## Prerequisites

* Node.js installed (v14 or higher recommended)
* Access to the target MongoDB database
* `.env` file present in the project root with the MongoDB connection string

Example `.env`:

```
MONGODB_URL=mongodb://localhost:27017/<database-name>
```

## How to Execute the Script

From the project root directory, run:

```
node migrations/normalizeUserExtensionPlatformRoleCodes/normalizePlatformRoleCodes.js
```

The script will:

* Connect to the MongoDB database using `MONGODB_URL`
* Scan documents in the `userExtension` collection
* Update records where normalization is required
* Generate output files listing processed document IDs

Progress logs will be displayed in the terminal during execution.

## Output Files

After execution, two files will be created **in the same folder as the script**:

```
migrations/normalizeUserExtensionPlatformRoleCodes/
│
├── normalizePlatformRoleCodes.js
├── updatedIds.txt
└── skippedIds.txt
```

### `updatedIds.txt`

Contains:

* `_id` values of all documents that were **modified** by the script

Use cases:

* Verify which records were updated
* Perform post-migration validation
* Rollback or audit reference

---

### `skippedIds.txt`

Contains:

* `_id` values of documents that were **already compliant** and required no changes

Use cases:

* Confirm unaffected records
* Compare total processed vs updated counts

## Notes

* The script processes documents sequentially.
* Output files are overwritten on each run.
* Ensure the correct database is configured before execution.
* It is recommended to run the script in a non-production environment first.
