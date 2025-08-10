-- collaborators table
CREATE TABLE collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    badge_number TEXT UNIQUE NOT NULL,
    position TEXT NOT NULL,
    shift TEXT NOT NULL,
    supervisor TEXT NOT NULL,
    balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    balance_type TEXT DEFAULT 'none' NOT NULL CHECK (balance_type IN ('positive', 'negative', 'none')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- administrators table
CREATE TABLE administrators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    badge_number TEXT UNIQUE, -- Optional for admins
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    can_create_collaborator BOOLEAN DEFAULT FALSE NOT NULL,
    can_create_admin BOOLEAN DEFAULT FALSE NOT NULL,
    can_enter_hours BOOLEAN DEFAULT FALSE NOT NULL,
    can_change_access_code BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- time_entries table for history
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES administrators(id) ON DELETE SET NULL, -- Who made the entry
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hours_change NUMERIC(10, 2) NOT NULL,
    new_balance NUMERIC(10, 2) NOT NULL,
    entry_type TEXT NOT NULL, -- e.g., 'manual_adjustment', 'initial_entry'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_collaborators_access_code ON collaborators(access_code);
CREATE INDEX idx_administrators_username ON administrators(username);
CREATE INDEX idx_time_entries_collaborator_id ON time_entries(collaborator_id);
