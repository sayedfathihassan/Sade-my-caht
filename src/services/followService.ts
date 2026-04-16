import { supabase } from "../lib/supabase";
import { Follow } from "../types";

export const followService = {
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) return;

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
    
    if (existing) return;

    // Supabase doesn't have batches like Firestore, but we can use RPC or just separate calls
    // For simplicity, we'll use separate calls (ideally use a database function/trigger)
    const { error: followError } = await supabase
      .from('follows')
      .insert([{
        follower_id: followerId,
        following_id: followingId
      }]);

    if (followError) throw followError;

    // Update counts (In a real app, use a database trigger for this)
    await supabase.rpc('increment_follow_counts', { 
      follower_uid: followerId, 
      following_uid: followingId 
    });
  },

  async unfollow(followerId: string, followingId: string) {
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (unfollowError) throw unfollowError;

    // Update counts
    await supabase.rpc('decrement_follow_counts', { 
      follower_uid: followerId, 
      following_uid: followingId 
    });
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
    
    return !!data;
  },

  async getFollowingIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    
    if (error) throw error;
    return (data || []).map(d => d.following_id);
  }
};
