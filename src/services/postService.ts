import { supabase } from "../lib/supabase";
import { Post, User } from "../types";

export const postService = {
  async createPost(user: User, content: string, imageUrl?: string) {
    const postData = {
      user_id: user.id,
      username: user.username,
      avatar_url: user.avatarUrl || "",
      user_frame_id: user.activeFrameId || "",
      content,
      image_url: imageUrl || "",
      likes: 0
    };
    const { error } = await supabase
      .from('posts')
      .insert([postData]);
    
    if (error) throw error;
  },

  async getFeed(followingIds: string[]): Promise<Post[]> {
    if (followingIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map(this.mapPost);
  },

  async getGlobalPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map(this.mapPost);
  },

  mapPost(data: any): Post {
    return {
      id: data.id,
      userId: data.user_id,
      username: data.username,
      avatarUrl: data.avatar_url,
      userFrameId: data.user_frame_id,
      content: data.content,
      imageUrl: data.image_url,
      likes: data.likes,
      createdAt: data.created_at
    };
  }
};
