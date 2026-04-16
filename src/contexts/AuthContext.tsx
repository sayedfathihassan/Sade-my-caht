import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string, isSignUp: boolean, nickname?: string) => Promise<{ success: boolean, isSignUp: boolean }>;
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
    console.log('🔄 Starting fetchProfile for user:', sUser.id);
    try {
      console.log('📡 Querying users table...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', sUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        console.log('✨ Profile not found, creating new one...');
        const baseName =
          sUser.user_metadata?.nickname ||
          sUser.user_metadata?.full_name ||
          sUser.user_metadata?.name ||
          sUser.email?.split('@')[0] ||
          'user';

        const loginName = sUser.user_metadata?.login_name || sUser.email?.split('@')[0] || baseName;

        const newUser: any = {
          id: sUser.id,
          username: baseName,
          login_name: loginName,
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
          role: 'user',
          user_uid: generateUid(),
          follower_count: 0,
          following_count: 0,
          last_task_reset_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        };

        console.log('📝 Inserting new user record...');
        const { data: createdData, error: createError } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating profile:', createError);
          throw createError;
        }
        console.log('✅ Profile created and loaded');
        setUser(mapSupabaseUser(createdData));
      } else if (data) {
        console.log('✅ Profile found:', data.username);
        if (data.is_banned) {
          console.warn('🚫 User is banned');
          await supabase.auth.signOut();
          alert('حسابك محظور. يرجى التواصل مع الإدارة.');
          setUser(null);
          return;
        }

        setUser(mapSupabaseUser(data));

        // Background update: don't await to avoid blocking UI entrance
        console.log('⏱ Updating last_active_at in background...');
        supabase
          .from('users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', sUser.id)
          .then(({ error: updateError }) => {
            if (updateError) console.error('⚠️ Failed to update last active timestamp:', updateError);
            else console.log('✅ Last active timestamp updated');
          });
          
      } else if (error) {
        console.error('❌ Error during users table select:', error);
      }
    } catch (err) {
      console.error('💣 Global error in fetchProfile:', err);
    } finally {
      console.log('🏁 fetchProfile finished, setting loading to false');
      setLoading(false);
    }
  };

  // Re-fetch user from DB (call this after purchases, equips, etc.)
  const refreshUser = async () => {
    if (!supabaseUser) return;
    await fetchProfile(supabaseUser);
  };

  const fetchProfile = async (sUser: SupabaseUser) => {
    console.log('🔄 Starting fetchProfile for user:', sUser.id);
    try {
      // ✅ Safety: Add a promise timeout for the database query itself
      const dbQuery = supabase
        .from('users')
        .select('*')
        .eq('id', sUser.id)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DATABASE_TIMEOUT')), 10000)
      );

      console.log('📡 Querying users table (with 10s timeout)...');
      const { data, error } = await (Promise.race([dbQuery, timeoutPromise]) as Promise<any>);

      if (error && error.code === 'PGRST116') {
        console.log('✨ Profile not found, creating new one...');
        const baseName =
          sUser.user_metadata?.nickname ||
          sUser.user_metadata?.full_name ||
          sUser.user_metadata?.name ||
          sUser.email?.split('@')[0] ||
          'user';

        const loginName = sUser.user_metadata?.login_name || sUser.email?.split('@')[0] || baseName;

        const newUser: any = {
          id: sUser.id,
          username: baseName,
          login_name: loginName,
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
          role: 'user',
          user_uid: generateUid(),
          follower_count: 0,
          following_count: 0,
          last_task_reset_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        };

        console.log('📝 Inserting new user record...');
        const { data: createdData, error: createError } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating profile:', createError);
          throw createError;
        }
        console.log('✅ Profile created and loaded');
        setUser(mapSupabaseUser(createdData));
      } else if (data) {
        console.log('✅ Profile found:', data.username);
        if (data.is_banned) {
          console.warn('🚫 User is banned');
          await supabase.auth.signOut();
          alert('حسابك محظور. يرجى التواصل مع الإدارة.');
          setUser(null);
          return;
        }

        setUser(mapSupabaseUser(data));

        // Background update: don't await to avoid blocking UI entrance
        console.log('⏱ Updating last_active_at in background...');
        supabase
          .from('users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', sUser.id)
          .then(({ error: updateError }) => {
            if (updateError) console.error('⚠️ Failed to update last active timestamp:', updateError);
            else console.log('✅ Last active timestamp updated');
          });
          
      } else if (error) {
        console.error('❌ Error during users table select:', error);
      }
    } catch (err: any) {
      if (err.message === 'DATABASE_TIMEOUT') {
        console.error('💣 Database query timed out. Check your Supabase RLS or Connection.');
      } else {
        console.error('💣 Global error in fetchProfile:', err);
      }
    } finally {
      console.log('🏁 fetchProfile finished, setting loading to false');
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!supabaseUser) return;
    await fetchProfile(supabaseUser);
  };

  // ✅ 1. Auth State Listener (Runs ONCE on mount)
  useEffect(() => {
    console.log('🔑 Initializing Auth Listener...');
    
    // Standard safety timeout just in case
    const authTimer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 15000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event, session?.user?.id);
        
        setSupabaseUser(session?.user ?? null);
        
        if (session?.user) {
          setLoading(true);
          await fetchProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
        clearTimeout(authTimer);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('📡 Existing session found:', session.user.id);
        setSupabaseUser(session.user);
        fetchProfile(session.user);
      } else {
        console.log('📡 No existing session');
        setLoading(false);
      }
    });

    return () => {
      console.log('🔌 Cleaning up Auth Listener');
      subscription.unsubscribe();
      clearTimeout(authTimer);
    };
  }, []);

  // ✅ 2. Realtime User Profile Subscription (Depends on user.id)
  useEffect(() => {
    if (!user?.id) return;
    
    console.log('🎙 Subscribing to Realtime profile updates for:', user.id);
    const userSub = supabase
      .channel(`user_profile_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🚀 Realtime profile update received');
          setUser(mapSupabaseUser(payload.new));
        }
      )
      .subscribe();

    return () => {
      console.log('🔇 Unsubscribing from Realtime profile updates');
      supabase.removeChannel(userSub);
    };
  }, [user?.id]);



  const signInWithUsername = async (username: string, password: string, isSignUp: boolean, nickname?: string) => {
    // Generate internal fake email
    const fakeEmail = `${username.toLowerCase().trim()}@sada.local`;

    if (isSignUp) {
      if (!nickname) throw new Error("الاسم المستعار مطلوب للتسجيل");
      
      const { data, error } = await supabase.auth.signUp({ 
        email: fakeEmail, 
        password,
        options: {
          data: {
            nickname: nickname,
            login_name: username.trim()
          }
        }
      });
      
      if (error) throw error;
      
      // If registration succeeded but session is null (e.g. needs confirmation), 
      // we still treat it as success for the UI.
      return { success: true, isSignUp: true };
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: fakeEmail, 
        password 
      });
      if (error) throw error;
      return { success: true, isSignUp: false };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, signInWithUsername, signOut, refreshUser }}>
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
