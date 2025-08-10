-- leave_requests table
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
    request_date DATE NOT NULL, -- The date of the requested day off
    hours_requested NUMERIC(10, 2) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_id UUID REFERENCES administrators(id) ON DELETE SET NULL, -- Admin who approved/rejected
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups on leave requests
CREATE INDEX idx_leave_requests_collaborator_id ON leave_requests(collaborator_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
