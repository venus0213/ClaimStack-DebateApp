-- ClaimStack Database Schema
-- PostgreSQL Database Structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth Accounts (for Google, etc.)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at BIGINT,
    token_type VARCHAR(50),
    scope TEXT,
    id_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);

-- Sessions (for NextAuth)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification Tokens (for email verification, password reset)
CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claims Table
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    for_summary TEXT, -- AI-generated summary for "For" side
    against_summary TEXT, -- AI-generated "steel man" summary for "Against" side
    summary_updated_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    url TEXT, -- Forexternal links might include TikTok and Instagram video URL or article URL or and so on.
    file_url TEXT, -- For uploaded files (S3/Supabase URL)
    file_name VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evidence Table
CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('url', 'file', 'tweet', 'youtube', 'tiktok', 'instagram', 'text')),
    position VARCHAR(10) NOT NULL CHECK (position IN ('for', 'against')),
    title VARCHAR(500),
    description TEXT,
    url TEXT, -- For external links
    file_url TEXT, -- For uploaded files (S3/Supabase URL)
    file_name VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(100),
    metadata JSONB, -- Store oEmbed data, file metadata, etc.
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0, -- Calculated: upvotes - downvotes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes Table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(evidence_id, user_id) -- One vote per user per evidence
);

-- Follows Table (users following claims)
CREATE TABLE claim_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(claim_id, user_id)
);

-- User Follows (users following other users)
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'new_evidence',
        'new_comment',
        'evidence_approved',
        'evidence_rejected',
        'claim_updated',
        'new_follower',
        'vote_received'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link TEXT, -- URL to related content
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flags/Reports Table (for moderation)
CREATE TABLE flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES evidence(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL CHECK (reason IN (
        'misinformation',
        'spam',
        'harassment',
        'inappropriate',
        'copyright',
        'other'
    )),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation Log Table
CREATE TABLE moderation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moderator_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'approve_claim',
        'reject_claim',
        'approve_evidence',
        'reject_evidence',
        'flag_claim',
        'flag_evidence',
        'escalate',
        'remove_content'
    )),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('claim', 'evidence')),
    target_id UUID NOT NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Claims (bookmarks)
CREATE TABLE saved_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, claim_id)
);

-- Indexes for Performance
CREATE INDEX idx_claims_user_id ON claims(user_id);
CREATE INDEX idx_claims_category_id ON claims(category_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_created_at ON claims(created_at DESC);
CREATE INDEX idx_claims_view_count ON claims(view_count DESC);

CREATE INDEX idx_evidence_claim_id ON evidence(claim_id);
CREATE INDEX idx_evidence_user_id ON evidence(user_id);
CREATE INDEX idx_evidence_position ON evidence(position);
CREATE INDEX idx_evidence_status ON evidence(status);
CREATE INDEX idx_evidence_score ON evidence(score DESC);
CREATE INDEX idx_evidence_created_at ON evidence(created_at DESC);

CREATE INDEX idx_votes_evidence_id ON votes(evidence_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_flags_claim_id ON flags(claim_id);
CREATE INDEX idx_flags_evidence_id ON flags(evidence_id);
CREATE INDEX idx_flags_status ON flags(status);

CREATE INDEX idx_claim_follows_user_id ON claim_follows(user_id);
CREATE INDEX idx_claim_follows_claim_id ON claim_follows(claim_id);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_updated_at BEFORE UPDATE ON evidence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update evidence score when votes change
CREATE OR REPLACE FUNCTION update_evidence_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE evidence
    SET 
        upvotes = (SELECT COUNT(*) FROM votes WHERE evidence_id = NEW.evidence_id AND vote_type = 'upvote'),
        downvotes = (SELECT COUNT(*) FROM votes WHERE evidence_id = NEW.evidence_id AND vote_type = 'downvote'),
        score = (SELECT COUNT(*) FROM votes WHERE evidence_id = NEW.evidence_id AND vote_type = 'upvote') - 
                (SELECT COUNT(*) FROM votes WHERE evidence_id = NEW.evidence_id AND vote_type = 'downvote')
    WHERE id = NEW.evidence_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_score_on_vote AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_evidence_score();

