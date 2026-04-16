import { useState, useEffect } from "react";
import { Post, User } from "@/src/types";
import { postService } from "@/src/services/postService";
import { followService } from "@/src/services/followService";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Plus } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { storeService } from "../services/storeService";
import { StoreItem } from "../types";

interface FollowFeedProps {
  user: User;
  onOpenUser: (userId: string) => void;
  onOpenCreatePost: () => void;
}

export function FollowFeed({ user, onOpenUser, onOpenCreatePost }: FollowFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'following' | 'global'>('following');
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);

  useEffect(() => {
    const unsub = storeService.subscribeToItems(setStoreItems);
    return () => unsub();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      if (activeTab === 'following') {
        const followingIds = await followService.getFollowingIds(user.id);
        // Include self
        const feedPosts = await postService.getFeed([...followingIds, user.id]);
        setPosts(feedPosts);
      } else {
        const globalPosts = await postService.getGlobalPosts();
        setPosts(globalPosts);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user.id, activeTab]);

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div className="flex bg-neutral-900 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('following')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'following' ? 'bg-amber-500 text-black' : 'text-neutral-500 hover:text-white'
            }`}
          >
            أتابعهم
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'global' ? 'bg-amber-500 text-black' : 'text-neutral-500 hover:text-white'
            }`}
          >
            اكتشف
          </button>
        </div>
        
        <button
          onClick={onOpenCreatePost}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-2xl border border-white/5 transition-all group"
        >
          <Plus className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold">لحظة جديدة</span>
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-neutral-900/50 rounded-[32px] p-6 animate-pulse h-48" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={post.id}
              className="bg-neutral-900/50 rounded-[32px] border border-white/5 overflow-hidden hover:border-white/10 transition-colors"
            >
              <div className="p-6">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => onOpenUser(post.userId)}
                    className="flex items-center gap-3 text-right"
                  >
                    <UserAvatar 
                      username={post.username} 
                      src={post.avatarUrl} 
                      size="md" 
                      frameUrl={post.userFrameId}
                    />
                    <div>
                      <h4 className="text-sm font-bold hover:text-amber-500 transition-colors">{post.username}</h4>
                      <p className="text-[10px] text-neutral-500">
                        {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </button>
                  <button className="p-2 text-neutral-600 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <p className="text-sm text-neutral-200 leading-relaxed mb-4 whitespace-pre-wrap">
                  {post.content}
                </p>

                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden mb-4 border border-white/5">
                    <img src={post.imageUrl} alt="post" className="w-full h-auto" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                  <button className="flex items-center gap-2 text-neutral-500 hover:text-rose-500 transition-colors group">
                    <Heart className="w-5 h-5 group-hover:fill-rose-500" />
                    <span className="text-xs font-bold">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-neutral-500 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-xs font-bold">0</span>
                  </button>
                  <button className="flex items-center gap-2 text-neutral-500 hover:text-green-500 transition-colors mr-auto">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center bg-neutral-900/20 rounded-[32px] border-2 border-dashed border-neutral-900">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-neutral-700" />
            </div>
            <h3 className="font-bold text-neutral-400">لا توجد منشورات حالياً</h3>
            <p className="text-xs text-neutral-500 mt-1">
              {activeTab === 'following' ? 'ابدأ بمتابعة الأصدقاء لرؤية لحظاتهم!' : 'كن أول من ينشر لحظة جديدة!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
