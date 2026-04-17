import { supabase } from "../lib/supabase";
import { Follow } from "../types";

export const followService = {
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) return;

    const { error: followError } = await supabase
      .from('follows')
      .upsert([{
        follower_id: followerId,
        following_id: followingId
      }]);

    if (followError) throw followError;
  },

  async unfollow(followerId: string, followingId: string) {
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (unfollowError) throw unfollowError;
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
