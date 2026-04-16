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
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', sUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet → create it
        const baseName =
          sUser.user_metadata?.nickname ||
          sUser.user_metadata?.full_name ||
          sUser.user_metadata?.name ||
          sUser.email?.split('@')[0] ||
          'user';

        // Extract login_name from fake email if not provided in metadata
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
    // ✅ Safety Timeout: Force stop loading after 5 seconds to prevent infinite hang
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('Auth state check timed out. Forcing stop loading...');
        setLoading(false);
      }
    }, 5000);

    // ✅ Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSupabaseUser(session?.user ?? null);
        
        if (session?.user) {
          setLoading(true);
          // Re-start safety timeout for profile fetch
          const profileTimer = setTimeout(() => {
            console.warn('Profile fetch timed out. Forcing stop loading...');
            setLoading(false);
          }, 8000); // Give 8 seconds for DB fetch

          try {
            await fetchProfile(session.user);
          } finally {
            clearTimeout(profileTimer);
            clearTimeout(timer); // Final stop
          }
        } else {
          clearTimeout(timer);
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
      clearTimeout(timer);
      subscription.unsubscribe();
      if (userSub) supabase.removeChannel(userSub);
    };
  }, [supabaseUser?.id]);



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
