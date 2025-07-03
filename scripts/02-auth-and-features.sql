-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group members table (to track which users belong to which groups)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create messages table for group chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'pending_due', 'expense_added', 'settlement_added', 'group_invite'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES user_profiles(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Row Level Security Policies

-- Groups: Users can only see groups they're members of
CREATE POLICY "Users can view groups they're members of" ON groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group admins can update groups" ON groups
  FOR UPDATE USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Participants: Users can view participants in their groups
CREATE POLICY "Users can view participants in their groups" ON participants
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add participants" ON participants
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Expenses: Users can view expenses in their groups
CREATE POLICY "Users can view expenses in their groups" ON expenses
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add expenses" ON expenses
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can update expenses" ON expenses
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can delete expenses" ON expenses
  FOR DELETE USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Expense splits: Users can view splits in their groups
CREATE POLICY "Users can view expense splits in their groups" ON expense_splits
  FOR SELECT USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN group_members gm ON e.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can manage expense splits" ON expense_splits
  FOR ALL USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN group_members gm ON e.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

-- Settlements: Users can view settlements in their groups
CREATE POLICY "Users can view settlements in their groups" ON settlements
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add settlements" ON settlements
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Messages: Users can view and send messages in their groups
CREATE POLICY "Users can view messages in their groups" ON messages
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages" ON messages
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create notifications for pending dues
CREATE OR REPLACE FUNCTION create_pending_due_notifications()
RETURNS void AS $$
DECLARE
  group_record RECORD;
  participant_record RECORD;
  balance_amount DECIMAL;
BEGIN
  -- Loop through all groups
  FOR group_record IN SELECT * FROM groups LOOP
    -- Loop through participants in each group
    FOR participant_record IN 
      SELECT p.*, up.id as user_id 
      FROM participants p
      LEFT JOIN user_profiles up ON p.email = up.email
      WHERE p.group_id = group_record.id
    LOOP
      -- Calculate balance for this participant
      SELECT 
        COALESCE(SUM(CASE WHEN e.paid_by = participant_record.id THEN e.amount ELSE 0 END), 0) -
        COALESCE(SUM(es.amount), 0) +
        COALESCE(SUM(CASE WHEN s.to_participant = participant_record.id THEN s.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN s.from_participant = participant_record.id THEN s.amount ELSE 0 END), 0)
      INTO balance_amount
      FROM participants p
      LEFT JOIN expenses e ON e.group_id = p.group_id
      LEFT JOIN expense_splits es ON es.expense_id = e.id AND es.participant_id = p.id
      LEFT JOIN settlements s ON s.group_id = p.group_id
      WHERE p.id = participant_record.id;
      
      -- Create notification if user owes money and has a user account
      IF balance_amount < -10 AND participant_record.user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, group_id, type, title, message)
        VALUES (
          participant_record.user_id,
          group_record.id,
          'pending_due',
          'Pending Payment Due',
          'You owe ৳' || ABS(balance_amount)::text || ' in group "' || group_record.name || '"'
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
