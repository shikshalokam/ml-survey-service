/**
 * Migration: Normalize userExtension.platformRoles[].code to lowercase
 *
 * Per-document logic for each platformRoles array:
 *   1. Group entries by normalized (lowercase) code.
 *   2. If both an uppercase entry (e.g. PROGRAM_MANAGER) and a lowercase entry
 *      (program_manager) exist for the same code:
 *        - Merge all program IDs from the lowercase entry into the uppercase entry.
 *        - Deduplicate the merged program list.
 *        - Drop the lowercase entry.
 *        - Convert the surviving entry's code to lowercase.
 *   3. If only an uppercase entry exists (no lowercase counterpart):
 *        - Convert its code to lowercase.
 *   4. If already lowercase: no change.
 *
 * Audit:
 *   - updatedIds.txt  : _id of every document that was modified.
 *   - skippedIds.txt  : _id of documents whose platformRoles were already clean.
 */

const { MongoClient, ObjectId } = require("mongodb")
const fs = require("fs")
const path = require("path")

const MONGODB_URL = process.env.MONGODB_URL
const COLLECTION_NAME = "userExtension"

const UPDATED_FILE = path.join(__dirname, "updatedIds.txt")
const SKIPPED_FILE = path.join(__dirname, "skippedIds.txt")

async function migrate() {
  const client = new MongoClient(MONGODB_URL)

  const updatedIds = []
  const skippedIds = []

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db()
    const collection = db.collection(COLLECTION_NAME)

    const cursor = collection.find(
      { "platformRoles.0": { $exists: true } },
      { projection: { platformRoles: 1 } }
    )

    let total = 0
    let updatedCount = 0

    while (await cursor.hasNext()) {
      const doc = await cursor.next()
      total++

      const platformRoles = doc.platformRoles
      if (!Array.isArray(platformRoles) || platformRoles.length === 0) {
        skippedIds.push(String(doc._id))
        continue
      }

      // Group by normalized code
      const grouped = {}
      for (const entry of platformRoles) {
        if (!entry.code) continue
        const key = entry.code.toLowerCase()
        grouped[key] = grouped[key] || []
        grouped[key].push(entry)
      }

      let needsUpdate = false
      const normalizedRoles = []

      for (const [normalizedCode, entries] of Object.entries(grouped)) {
        if (entries.length === 1) {
          const entry = entries[0]
          if (entry.code !== normalizedCode) {
            entry.code = normalizedCode
            needsUpdate = true
          }
          normalizedRoles.push(entry)
        } else {
          // Multiple entries share the same normalized code — merge programs, keep one
          // Separate uppercase from already-lowercase entries
          const upperEntries = entries.filter(e => e.code !== normalizedCode)
          const lowerEntries = entries.filter(e => e.code === normalizedCode)

          // Use the uppercase entry as base (it has the older program list)
          const base = upperEntries.length > 0 ? upperEntries[0] : lowerEntries[0]

          // Collect all program IDs from every duplicate entry
          let mergedPrograms = [...(base.programs || []).map(p => p.toString())]
          const others = entries.filter(e => e !== base)

          for (const other of others) {
            for (const programId of (other.programs || [])) {
              mergedPrograms.push(programId.toString())
            }
          }

          // Deduplicate
          mergedPrograms = [...new Set(mergedPrograms)]

          base.programs = mergedPrograms.map(p => new ObjectId(p))
          base.code = normalizedCode
          normalizedRoles.push(base)
          needsUpdate = true
        }
      }

      if (!needsUpdate) {
        skippedIds.push(String(doc._id))
        continue
      }

      await collection.updateOne(
        { _id: doc._id },
        { $set: { platformRoles: normalizedRoles } }
      )

      updatedIds.push(String(doc._id))
      updatedCount++

      if (updatedCount % 100 === 0) {
        console.log(`Processed ${updatedCount} updates so far...`)
      }
    }

    fs.writeFileSync(UPDATED_FILE, updatedIds.join("\n"), "utf8")
    fs.writeFileSync(SKIPPED_FILE, skippedIds.join("\n"), "utf8")

    console.log(`\nMigration completed.`)
    console.log(`Total documents scanned : ${total}`)
    console.log(`Updated                 : ${updatedCount}`)
    console.log(`Skipped (already clean) : ${skippedIds.length}`)
    console.log(`Updated IDs  → ${UPDATED_FILE}`)
    console.log(`Skipped IDs  → ${SKIPPED_FILE}`)

  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

migrate()
