/**
 * Migration: Normalize userRoles.code to lowercase
 * - Uses createdAt to determine newest document
 * - Retains newest doc
 * - Deletes older duplicates
 * - Writes updated & deleted IDs to files
 */

const { MongoClient } = require("mongodb")
const fs = require("fs")
const path = require("path")

const MONGODB_URL = process.env.MONGODB_URL
const COLLECTION_NAME = "userRoles"

const UPDATED_FILE = path.join(__dirname, "updatedIds.txt")
const DELETED_FILE = path.join(__dirname, "deletedIds.txt")

async function migrate() {
  const client = new MongoClient(MONGODB_URL)

  // In-memory audit logs
  const updatedIds = []
  const deletedIds = []

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db()
    const collection = db.collection(COLLECTION_NAME)

    // Fetch all documents
    const roles = await collection.find({}).toArray()

    // Group documents by normalized (lowercase) code
    const grouped = roles.reduce((acc, doc) => {
      if (!doc.code) return acc

      const normalizedCode = doc.code.toLowerCase()
      acc[normalizedCode] = acc[normalizedCode] || []
      acc[normalizedCode].push(doc)

      return acc
    }, {})

    for (const [normalizedCode, docs] of Object.entries(grouped)) {
      // Sort by createdAt DESC (newest first)
      docs.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )

      const [latestDoc, ...olderDocs] = docs

      // Update latest document only if needed
      if (latestDoc.code !== normalizedCode) {
        await collection.updateOne(
          { _id: latestDoc._id },
          { $set: { code: normalizedCode } }
        )

        updatedIds.push(String(latestDoc._id))
      }

      // Delete older duplicates
      if (olderDocs.length > 0) {
        const deleteIds = olderDocs.map(doc => doc._id)

        await collection.deleteMany({
          _id: { $in: deleteIds }
        })

        deleteIds.forEach(id => deletedIds.push(String(id)))
      }
    }

    // Write audit files
    fs.writeFileSync(UPDATED_FILE, updatedIds.join("\n"), "utf8")
    fs.writeFileSync(DELETED_FILE, deletedIds.join("\n"), "utf8")

    console.log("Migration completed successfully")
    console.log(`Updated IDs written to: ${UPDATED_FILE}`)
    console.log(`Deleted IDs written to: ${DELETED_FILE}`)

  } catch (error) {
    console.error("Migration failed:", error)
  } finally {
    await client.close()
  }
}

migrate()