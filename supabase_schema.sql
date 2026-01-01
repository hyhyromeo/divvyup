-- 1. Create the Groups table (The "Trip" room)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the Participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT, -- Base64 encoded avatar image
  is_creator BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, nickname) -- Prevent duplicate nicknames in the same group
);

-- 3. Create the Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  paid_by_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create the Expense Splits table
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  share_amount DECIMAL(12, 2) NOT NULL
);

-- 5. Enable Row Level Security (RLS)
-- For this session-based app, we allow public access for simplicity.
-- In a production app, you might use session tokens or more granular policies.
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access" ON groups FOR ALL USING (true);
CREATE POLICY "Allow public access" ON participants FOR ALL USING (true);
CREATE POLICY "Allow public access" ON expenses FOR ALL USING (true);
CREATE POLICY "Allow public access" ON expense_splits FOR ALL USING (true);
