-- announcements table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    admin_id UUID REFERENCES administrators(id) ON DELETE SET NULL, -- Admin who created/updated the announcement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups on active announcements
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
