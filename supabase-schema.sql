-- SADA Social Voice Chat - Comprehensive Production Schema (Final Expanded Version)
-- This file contains all tables, relationships, and RLS policies required for the SADA platform.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CORE USER SYSTEM
-- ==========================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL, -- Display Name (Nickname)
  login_name TEXT UNIQUE,        -- Internal login identifier (e.g. user123)
  email TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  
  -- Progression & Currency
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  next_level_xp INTEGER DEFAULT 100,
  coins INTEGER DEFAULT 1000,
  diamonds INTEGER DEFAULT 0,
  
  -- Equipment (Current IDs for fast lookups/display)
  active_frame_id TEXT,
  active_entry_effect_id TEXT,
  active_chat_bubble_id TEXT,
  active_badge_id TEXT,
  
  -- Global Roles
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_super_admin BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  
  -- Custom Numeric UID (like a phone-friendly ID, 6-9 digits, unique, changeable every 30 days)
  user_uid TEXT UNIQUE,
  user_uid_changed_at TIMESTAMPTZ,

  -- Stats
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  total_gifts_received INTEGER DEFAULT 0,
  total_gifts_sent INTEGER DEFAULT 0,
  
  -- Status
  status_text TEXT,
  is_online BOOLEAN DEFAULT false,
  
  -- Activity
  last_task_reset_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Numeric unique index (case doesn't matter for digits, but keep consistent)
CREATE UNIQUE INDEX idx_users_user_uid ON users (user_uid);

-- Constraint: uid must be 6-9 digits only
ALTER TABLE users
  ADD CONSTRAINT user_uid_format
  CHECK (user_uid IS NULL OR user_uid ~ '^[0-9]{6,9}$');

-- ==========================================
-- 2. STORE & INVENTORY SYSTEM (Expanded)
-- ==========================================

CREATE TABLE store_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('coins', 'diamonds')),
  category TEXT NOT NULL CHECK (category IN ('frame', 'entry_effect', 'badge', 'gift', 'chat_bubble')),
  image_url TEXT,
  preview_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEW: Dedicated Inventory Table for better auditing and expiration
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES store_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For temporary items
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, item_id)
);

-- NEW: VIP Subscription System
CREATE TABLE user_vip_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('silver', 'gold', 'diamond')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  perks JSONB DEFAULT '[]'::jsonb,
  UNIQUE(user_id)
);

CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  animation_url TEXT,
  cost INTEGER NOT NULL,
  category TEXT DEFAULT 'gifts',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. ROOM SYSTEM
-- ==========================================

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  
  -- Space Settings
  type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private', 'vip')),
  password TEXT,
  max_seats INTEGER DEFAULT 6,
  is_live BOOLEAN DEFAULT true,
  background_theme TEXT DEFAULT 'default',
  background_url TEXT,
  background_music_url TEXT,
  
  -- Stats
  member_count INTEGER DEFAULT 0,
  total_gifts INTEGER DEFAULT 0,
  
  -- Moderation
  announcement TEXT,
  welcome_message TEXT,
  banned_users UUID[] DEFAULT '{}',
  auto_mod_settings JSONB DEFAULT '{"wordFilter": [], "antiSpam": false, "kickIdlers": false}'::jsonb,
  is_lockdown BOOLEAN DEFAULT false,
  slow_mode_delay INTEGER DEFAULT 0,
  
  -- Active Features
  active_pk_id UUID,
  active_lucky_box_id UUID,
  seat_names JSONB DEFAULT '{}'::jsonb,
  
  -- Numeric Public ID (6-9 digits)
  room_uid TEXT UNIQUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: room_uid must be 6-9 digits only
ALTER TABLE rooms
  ADD CONSTRAINT room_uid_format
  CHECK (room_uid IS NULL OR room_uid ~ '^[0-9]{6,9}$');

CREATE UNIQUE INDEX idx_rooms_room_uid ON rooms (room_uid);

CREATE TABLE room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'listener' NOT NULL, -- owner, admin, moderator, observer, vip, listener
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  is_stealth BOOLEAN DEFAULT false,
  is_shadow_banned BOOLEAN DEFAULT false,
  UNIQUE(room_id, user_id)
);

CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_locked BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, number)
);

-- ==========================================
-- 4. INTERACTION & SOCIAL
-- ==========================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participants UUID[] NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE private_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  user_frame_id TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ==========================================
-- 5. TASKS & EVENTS
-- ==========================================

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target INTEGER NOT NULL,
  reward_coins INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 0,
  type TEXT NOT NULL, -- 'time', 'gift', 'mic', 'chat', 'game'
  frequency TEXT DEFAULT 'daily',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  is_claimed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  tasks JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_user_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  current INTEGER DEFAULT 0,
  is_claimed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id, task_id)
);

CREATE TABLE reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('spending_cashback', 'gift_milestone')),
  trigger_value INTEGER NOT NULL,
  reward_value INTEGER NOT NULL,
  reward_item_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. SPECIAL ROOM FEATURES (PK, LUCKY BOX)
-- ==========================================

CREATE TABLE pk_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user1_id UUID REFERENCES users(id),
  user2_id UUID REFERENCES users(id),
  user1_points INTEGER DEFAULT 0,
  user2_points INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  winner_id UUID,
  duration INTEGER DEFAULT 300,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE lucky_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id),
  total_amount INTEGER NOT NULL,
  remaining_amount INTEGER NOT NULL,
  total_winners INTEGER NOT NULL,
  winners JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'distributed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. LOUNGE MODERATION & ADMIN
-- ==========================================

CREATE TABLE room_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID REFERENCES room_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

CREATE TABLE room_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_id UUID,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_gift_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  current_amount INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE room_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_staff_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. SYSTEM CONFIGURATION & LOGS
-- ==========================================

CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. FUNCTIONS & TRIGGERS
-- ==========================================

-- XP and Level trigger
CREATE OR REPLACE FUNCTION handle_xp_update() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.xp >= NEW.next_level_xp THEN
    NEW.level := NEW.level + 1;
    NEW.next_level_xp := floor(NEW.next_level_xp * 1.5);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_level_up_trigger
BEFORE UPDATE ON users
FOR EACH ROW
WHEN (OLD.xp IS DISTINCT FROM NEW.xp)
EXECUTE FUNCTION handle_xp_update();

-- Security Trigger: Prevent users from updating restricted columns financially
CREATE OR REPLACE FUNCTION prevent_finance_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If invoked via user JWT (authenticated), prevent modification of coins, diamonds, xp, level, role, is_super_admin
  IF auth.role() = 'authenticated' THEN
    IF NEW.coins IS DISTINCT FROM OLD.coins OR 
       NEW.diamonds IS DISTINCT FROM OLD.diamonds OR 
       NEW.xp IS DISTINCT FROM OLD.xp OR
       NEW.level IS DISTINCT FROM OLD.level OR
       NEW.role IS DISTINCT FROM OLD.role OR
       NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
      RAISE EXCEPTION 'غير مصرح للعميل بتعديل البيانات المالية أو الإدارية بشكل مباشر. (Security Lockdown)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_finance_security
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_finance_update();

-- ==========================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Users Table Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON users;
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Profiles are viewable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- ROOMS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rooms viewable by all" ON rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners update rooms" ON rooms FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners delete rooms" ON rooms FOR DELETE USING (auth.uid() = owner_id);

-- ROOM MEMBERS
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable by all" ON room_members FOR SELECT USING (true);
CREATE POLICY "Users can join rooms" ON room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON room_members FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM rooms WHERE id = room_members.room_id AND owner_id = auth.uid())
);

-- SEATS
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seats viewable by all" ON seats FOR SELECT USING (true);
CREATE POLICY "Users can occupy or manage seats" ON seats FOR UPDATE USING (
  -- Users can leave their own seat
  auth.uid() = user_id OR
  -- Or seat is empty
  user_id IS NULL OR
  -- Or caller is room owner
  EXISTS(SELECT 1 FROM rooms WHERE id = seats.room_id AND owner_id = auth.uid()) OR
  -- Or caller is an admin/moderator
  EXISTS(SELECT 1 FROM room_members WHERE room_id = seats.room_id AND user_id = auth.uid() AND role IN ('admin', 'owner', 'moderator'))
);

-- INVENTORY & VIP
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own inventory" ON user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_vip_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON user_vip_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- STORE & GIFTS
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store viewable by all" ON store_items FOR SELECT USING (true);
CREATE POLICY "Admins manage store" ON store_items FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
);

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gifts viewable by all" ON gifts FOR SELECT USING (true);
CREATE POLICY "Admins manage gifts" ON gifts FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
);

-- TASKS & EVENTS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks viewable by all" ON tasks FOR SELECT USING (true);
CREATE POLICY "Admins manage tasks" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
);

ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own tasks" ON user_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own tasks" ON user_tasks FOR ALL USING (auth.uid() = user_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by all" ON events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
);

ALTER TABLE event_user_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own event tasks" ON event_user_tasks FOR ALL USING (auth.uid() = user_id);

-- REWARD RULES
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reward rules viewable by all" ON reward_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage reward rules" ON reward_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
);

-- SOCIAL
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view conversations" ON conversations FOR SELECT USING (auth.uid() = ANY(participants));
CREATE POLICY "Users create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view messages" ON private_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = private_messages.conversation_id AND auth.uid() = ANY(c.participants))
);
CREATE POLICY "Participants send messages" ON private_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows viewable by all" ON follows FOR SELECT USING (true);
CREATE POLICY "Users manage own follows" ON follows FOR ALL USING (auth.uid() = follower_id);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts viewable by all" ON posts FOR SELECT USING (true);
CREATE POLICY "Users manage own posts" ON posts FOR ALL USING (auth.uid() = user_id);

-- ROOM FEATURES
ALTER TABLE room_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls viewable by all" ON room_polls FOR SELECT USING (true);

ALTER TABLE room_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by all" ON room_poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote once" ON room_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE room_gift_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gift goals viewable by all" ON room_gift_goals FOR SELECT USING (true);

ALTER TABLE room_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Waitlist viewable by all" ON room_waitlist FOR SELECT USING (true);
CREATE POLICY "Users join waitlist" ON room_waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE room_warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view warnings" ON room_warnings FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM rooms WHERE id = room_warnings.room_id AND owner_id = auth.uid())
);

ALTER TABLE room_staff_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view staff messages" ON room_staff_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM room_members WHERE room_id = room_staff_messages.room_id
    AND user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator', 'observer')
  )
);

ALTER TABLE room_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room admins view audit logs" ON room_audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM rooms WHERE id = room_audit_logs.room_id AND owner_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM room_members WHERE room_id = room_audit_logs.room_id
    AND user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- PK & LUCKY BOX
ALTER TABLE pk_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PK challenges viewable by all" ON pk_challenges FOR SELECT USING (true);

ALTER TABLE lucky_boxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lucky boxes viewable by all" ON lucky_boxes FOR SELECT USING (true);

-- SYSTEM
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by all" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON system_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view admin logs" ON admin_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings public read" ON settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON settings FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true))
);

-- ==========================================
-- 11. SOCIAL INTERACTIONS (LIKES & COMMENTS)
-- ==========================================

CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 12. AUTOMATED SOCIAL LOGIC (TRIGGERS)
-- ==========================================

-- A. Update User Follower/Following Counts
CREATE OR REPLACE FUNCTION handle_follow_counts() 
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment follower count for target user
    UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    -- Increment following count for follower user
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    
    -- CREATE NOTIFICATION for target user
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      NEW.following_id,
      'follow',
      'متابع جديد',
      u.username || ' بدأ بمتابعتك الآن!',
      jsonb_build_object('follower_id', NEW.follower_id, 'username', u.username)
    FROM users u WHERE u.id = NEW.follower_id;
    
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
    UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_update
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION handle_follow_counts();

-- B. Update Post Likes Count
CREATE OR REPLACE FUNCTION handle_post_likes_count() 
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE posts SET likes = likes + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_like_update
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION handle_post_likes_count();

-- RLS for new tables
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON post_likes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON post_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users manage own comments" ON post_comments FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 14. AUTO-GENERATE NUMERIC UIDs
-- ==========================================

-- Function to generate a random numeric string
CREATE OR REPLACE FUNCTION generate_unique_uid(table_name TEXT, column_name TEXT) 
RETURNS TEXT AS $$
DECLARE
  new_uid TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- Generate random number between 100000 and 999999999
    new_uid := floor(random() * (999999999 - 100000 + 1) + 100000)::TEXT;
    
    -- Check uniqueness
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE %I = %L)', table_name, column_name, new_uid) 
    INTO exists_already;
    
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_uid;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Users
CREATE OR REPLACE FUNCTION handle_user_uid() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_uid IS NULL THEN
    NEW.user_uid := generate_unique_uid('users', 'user_uid');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_create_uid
  BEFORE INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_user_uid();

-- Trigger for Rooms
CREATE OR REPLACE FUNCTION handle_room_uid() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.room_uid IS NULL THEN
    NEW.room_uid := generate_unique_uid('rooms', 'room_uid');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_room_create_uid
  BEFORE INSERT ON rooms
  FOR EACH ROW EXECUTE FUNCTION handle_room_uid();

