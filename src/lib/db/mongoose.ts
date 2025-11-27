import mongoose from 'mongoose'

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL or MONGODB_URI environment variable inside .env')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  if (cached.promise) {
    try {
      cached.conn = await cached.promise
      return cached.conn
    } catch (error) {
      cached.promise = null
      if (!cached.conn) {
        cached.conn = mongoose as typeof mongoose
      }
      return cached.conn
    }
  }

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }

  cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
    return mongoose
  }).catch((error) => {
    cached.promise = null
    throw error
  })

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (error) {
    cached.promise = null
    if (!cached.conn) {
      cached.conn = mongoose as typeof mongoose
    }
    return cached.conn
  }
}

export default connectDB

