import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

const options = {}
let clientPromise

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  const client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function getAssignmentsCollection() {
  const client = await clientPromise
  return client.db('assigntrack').collection('assignments')
}

export function sanitizeAssignment(doc) {
  if (!doc) return null
  const { _id, ...rest } = doc
  return rest
}
