import { MongoClient } from 'mongodb'

const options = {}
let clientPromise = null

function getUri() {
  return process.env.MONGODB_URI
}

function getClientPromise() {
  const uri = getUri()
  if (!uri) {
    return null
  }

  if (clientPromise) {
    return clientPromise
  }

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

  return clientPromise
}

export function isMongoConfigured() {
  return Boolean(getUri())
}

export async function getAssignmentsCollection() {
  const promise = getClientPromise()
  if (!promise) {
    throw new Error('MONGODB_NOT_CONFIGURED')
  }

  const client = await promise
  return client.db('assigntrack').collection('assignments')
}

export function sanitizeAssignment(doc) {
  if (!doc) return null
  const { _id, ...rest } = doc
  return rest
}
