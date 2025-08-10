-- Add is_active column to collaborators table
ALTER TABLE collaborators
ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Optional: Add an index for faster lookups on active collaborators
CREATE INDEX idx_collaborators_is_active ON collaborators(is_active);
