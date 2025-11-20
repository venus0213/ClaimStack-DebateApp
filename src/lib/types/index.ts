// User Types
export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  bio?: string
  role: 'user' | 'moderator' | 'admin'
  createdAt: Date
}

// Claim Types
export interface Claim {
  id: string
  userId: string
  title: string
  description?: string
  categoryId?: string
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  forSummary?: string
  againstSummary?: string
  summaryUpdatedAt?: Date
  viewCount: number
  followCount?: number
  totalScore?: number
  upvotes?: number
  downvotes?: number
  url?: string
  userVote?: 'upvote' | 'downvote' | null
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  createdAt: Date
  updatedAt: Date
  user?: User
  category?: Category
  evidenceCount?: {
    for: number
    against: number
  }
}

// Evidence Types
export interface Evidence {
  id: string
  claimId: string
  userId: string
  type: 'url' | 'file' | 'tweet' | 'youtube' | 'tiktok' | 'instagram' | 'text'
  position: 'for' | 'against'
  title?: string
  description?: string
  url?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  metadata?: Record<string, any>
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  upvotes: number
  downvotes: number
  score: number
  followCount?: number
  aiSummary?: string
  createdAt: Date
  updatedAt: Date
  user?: User
  claim?: Claim
  userVote?: 'upvote' | 'downvote' | null
  isFollowing?: boolean
}

// Vote Types
export interface Vote {
  id: string
  evidenceId: string
  userId: string
  voteType: 'upvote' | 'downvote'
  createdAt: Date
}

// Category Types
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: 'new_evidence' | 'new_perspective' | 'new_comment' | 'evidence_approved' | 'evidence_rejected' | 'perspective_approved' | 'perspective_rejected' | 'claim_updated' | 'new_follower' | 'vote_received'
  title: string
  message?: string
  link?: string
  read: boolean
  createdAt: Date
}

// Perspective Types
export interface Perspective {
  id: string
  claimId: string
  userId: string
  title?: string
  body: string
  position: 'for' | 'against'
  sourceUrl?: string
  sourcePlatform?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  metadata?: Record<string, any>
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  upvotes: number
  downvotes: number
  score: number
  followCount?: number
  createdAt: Date
  updatedAt: Date
  user?: User
  claim?: Claim
  userVote?: 'upvote' | 'downvote' | null
  isFollowing?: boolean
}

// Flag Types
export interface Flag {
  id: string
  claimId?: string
  evidenceId?: string
  perspectiveId?: string
  userId: string
  reason: 'misinformation' | 'spam' | 'harassment' | 'inappropriate' | 'copyright' | 'other'
  description?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  createdAt: Date
}

