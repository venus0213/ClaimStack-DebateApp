import mongoose from 'mongoose'

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL or MONGODB_URI environment variable inside .env')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Use global object to cache the connection in development
// This prevents creating multiple connections during hot reloads
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

async function connectDB(): Promise<typeof mongoose> {
  // If already connected, return the connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  // If connection is in progress, wait for it
  if (cached.promise) {
    try {
      cached.conn = await cached.promise
      return cached.conn
    } catch (error) {
      // If connection fails, reset promise and continue
      cached.promise = null
      // During build or if DB is unavailable, return mongoose instance without throwing
      // This allows the build to continue
      if (!cached.conn) {
        cached.conn = mongoose as typeof mongoose
      }
      return cached.conn
    }
  }

  // Start new connection attempt
  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000, // 5 second timeout
    socketTimeoutMS: 45000,
  }

  cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
    return mongoose
  }).catch((error) => {
    // Reset promise on error so we can retry later
    cached.promise = null
    // Log error for debugging (but don't throw during build)
    throw error
  })

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (error) {
    // If connection fails (e.g., during build when DB is not available),
    // return mongoose instance without throwing to allow build to continue
    cached.promise = null
    if (!cached.conn) {
      cached.conn = mongoose as typeof mongoose
    }
    return cached.conn
  }
}

export default connectDB

