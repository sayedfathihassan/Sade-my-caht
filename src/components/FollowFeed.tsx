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
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});


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

  const checkInitialLikes = async (postList: Post[]) => {
    if (!user) return;
    const likesMap: Record<string, boolean> = {};
    for (const post of postList) {
      const isLiked = await postService.getLikeStatus(post.id, user.id);
      likesMap[post.id] = isLiked;
    }
    setLikedPosts(likesMap);
  };

  useEffect(() => {
    if (posts.length > 0) {
      checkInitialLikes(posts);
    }
  }, [posts, user?.id]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    const currentlyLiked = likedPosts[postId];
    try {
      if (currentlyLiked) {
        await postService.unlikePost(postId, user.id);
        setLikedPosts(prev => ({ ...prev, [postId]: false }));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
      } else {
        await postService.likePost(postId, user.id);
        setLikedPosts(prev => ({ ...prev, [postId]: true }));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      }
    } catch (error) {
      console.error("Like toggle failed", error);
    }
  };

  const toggleComments = async (postId: string) => {
    const isExpanded = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanded }));
    
    if (isExpanded && !postComments[postId]) {
      try {
        const comments = await postService.getComments(postId);
        setPostComments(prev => ({ ...prev, [postId]: comments }));
      } catch (error) {
        console.error("Failed to fetch comments", error);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim() || !user) return;

    try {
      await postService.addComment(postId, user, content);
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      // Refresh comments
      const comments = await postService.getComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: comments }));
    } catch (error) {
      console.error("Comment failed", error);
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
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={cn(
                      "flex items-center gap-2 transition-colors group",
                      likedPosts[post.id] ? "text-rose-500" : "text-neutral-500 hover:text-rose-500"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", likedPosts[post.id] && "fill-rose-500")} />
                    <span className="text-xs font-bold">{post.likes}</span>
                  </button>
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      expandedComments[post.id] ? "text-blue-500" : "text-neutral-500 hover:text-blue-500"
                    )}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-xs font-bold">{post.commentsCount || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-neutral-500 hover:text-green-500 transition-colors mr-auto">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {expandedComments[post.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 space-y-4">
                        {/* Comment Input */}
                        <div className="flex gap-3">
                          <UserAvatar username={user.username} src={user.avatarUrl} size="sm" />
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={commentInputs[post.id] || ""}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                              placeholder="اكتب تعليقاً..."
                              className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500/50 transition-colors"
                            />
                            <button 
                              onClick={() => handleAddComment(post.id)}
                              className="p-2 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {postComments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <UserAvatar username={comment.username} src={comment.avatar_url} size="sm" />
                              <div className="flex-1 bg-white/5 rounded-2xl p-3">
                                <p className="text-[11px] font-bold mb-1 text-amber-500">{comment.username}</p>
                                <p className="text-xs text-neutral-300 leading-normal">{comment.content}</p>
                                <p className="text-[8px] text-neutral-600 mt-2">
                                  {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(!postComments[post.id] || postComments[post.id].length === 0) && (
                            <p className="text-[10px] text-neutral-600 text-center py-4">لا توجد تعليقات بعد. كن أول من يعلق!</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
