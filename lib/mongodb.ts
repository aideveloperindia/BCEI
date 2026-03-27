import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MongoClient, Db } from 'mongodb'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

function parseMongoUriFromCredsFile(): string | null {
  try {
    const credsPath = resolve(process.cwd(), 'mongodbcreds.txt')
    const content = readFileSync(credsPath, 'utf-8')
    const line = content
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('connection_string:'))
    if (!line) return null
    return line.replace('connection_string:', '').trim()
  } catch {
    return null
  }
}

export function getMongoUri(): string {
  const envUri = process.env.MONGODB_URI
  if (envUri && envUri.trim().length > 0) {
    return envUri.trim()
  }

  const fileUri = parseMongoUriFromCredsFile()
  if (fileUri && fileUri.length > 0) {
    return fileUri
  }

  throw new Error('MongoDB URI not configured. Set MONGODB_URI or create mongodbcreds.txt.')
}

export async function getMongoDb(): Promise<Db> {
  if (cachedDb) return cachedDb

  const uri = getMongoUri()
  const client = new MongoClient(uri)
  await client.connect()

  const db = client.db('anyschoolfee')
  cachedClient = client
  cachedDb = db
  return db
}

export async function pingMongo(): Promise<boolean> {
  const db = await getMongoDb()
  const result = await db.command({ ping: 1 })
  return result.ok === 1
}
