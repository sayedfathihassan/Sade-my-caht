import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string, isSignUp: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: Generate a unique numeric UID for new users (6-9 digits)
const generateUid = (): string => {
  // Generate a random number between 100000 and 999999999
  const min = 100000;
  const max = 999999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  // ✅ FIX: Start with null - no fake guest data
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Map raw Supabase DB row → app User type
  const mapSupabaseUser = (data: any): User => ({
    id: data.id,
    username: data.username,
    email: data.email,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    birthDate: data.birth_date,
    gender: data.gender,
    level: data.level ?? 1,
    xp: data.xp ?? 0,
    nextLevelXp: data.next_level_xp ?? 100,
    coins: data.coins ?? 0,
    diamonds: data.diamonds ?? 0,
    activeFrameId: data.active_frame_id,
    activeEntryEffectId: data.active_entry_effect_id,
    activeChatBubbleId: data.active_chat_bubble_id,
    activeBadgeId: data.active_badge_id,
    inventory: data.inventory || [],
    isVerified: data.is_verified ?? false,
    isBanned: data.is_banned ?? false,
    // ✅ FIX: Role and super admin come from DB, not hardcoded email checks
    role: data.role ?? 'user',
    isSuperAdmin: data.is_super_admin ?? false,
    userUid: data.user_uid,
    followerCount: data.follower_count ?? 0,
    followingCount: data.following_count ?? 0,
    lastTaskResetAt: data.last_task_reset_at ?? new Date().toISOString(),
    createdAt: data.created_at ?? new Date().toISOString(),
    lastActiveAt: data.last_active_at ?? new Date().toISOString(),
  });

  // Fetch / create user profile from DB
  const fetchProfile = async (sUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', sUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet → create it
        const baseName =
          sUser.user_metadata?.full_name ||
          sUser.user_metadata?.name ||
          sUser.email?.split('@')[0] ||
          'user';

        const newUser: any = {
          id: sUser.id,
          username: baseName,
          email: sUser.email || '',
          avatar_url: sUser.user_metadata?.avatar_url || null,
          level: 1,
          xp: 0,
          next_level_xp: 100,
          coins: 1000,
          diamonds: 0,
          is_verified: false,
          is_banned: false,
          is_super_admin: false,
          // ✅ Default to 'user'. Super admin is set manually via SQL
          role: 'user',
          user_uid: generateUid(),
          follower_count: 0,
          following_count: 0,
          last_task_reset_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        };

        const { data: createdData, error: createError } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (createError) throw createError;
        setUser(mapSupabaseUser(createdData));
      } else if (data) {
        // ✅ Check ban before letting user in
        if (data.is_banned) {
          await supabase.auth.signOut();
          alert('حسابك محظور. يرجى التواصل مع الإدارة.');
          setUser(null);
          return;
        }

        setUser(mapSupabaseUser(data));

        // Update last active timestamp
        await supabase
          .from('users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', sUser.id);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch user from DB (call this after purchases, equips, etc.)
  const refreshUser = async () => {
    if (!supabaseUser) return;
    await fetchProfile(supabaseUser);
  };

  useEffect(() => {
    // ✅ Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true);
          await fetchProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // ✅ Re-subscribe to real user changes in Supabase
    let userSub: any = null;
    if (supabaseUser) {
      userSub = supabase
        .channel(`user_profile_${supabaseUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${supabaseUser.id}`,
          },
          (payload) => {
            setUser(mapSupabaseUser(payload.new));
          }
        )
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      if (userSub) supabase.removeChannel(userSub);
    };
  }, [supabaseUser?.id]);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string, isSignUp: boolean) => {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signIn, signInWithEmail, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
