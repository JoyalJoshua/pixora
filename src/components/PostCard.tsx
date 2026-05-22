import React, { useState, useRef } from "react";
import { Heart, MessageCircle, Bookmark, Send, MapPin, MoreHorizontal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Post } from "../types";

interface PostCardProps {
  key?: any;
  post: Post;
  onPostUpdated: (updatedPost: Post) => void;
  onUserSelected?: (username: string) => void;
}

export default function PostCard({ post, onPostUpdated, onUserSelected }: PostCardProps) {
  const { user, token, triggerLocalToast } = useAuth();
  
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  
  // Double-click big heart pop states
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [heartPopPosition, setHeartPopPosition] = useState({ x: 0, y: 0 });
  const doubleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isLiked = user ? post.likes.includes(user.id) : false;
  const isSaved = user && user.savedPosts ? user.savedPosts.includes(post.id) : false;

  const handleLike = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        onPostUpdated(data.post);
        if (data.liked) {
          triggerLocalToast("Liked post from @" + post.username, "Feedback");
        }
      }
    } catch (e) {
      console.error("Like post err:", e);
    }
  };

  const handleSave = async () => {
    if (!token || !user) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/save`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Update local session
        const updatedUser = { ...user, savedPosts: data.userSavedPosts };
        // Trigger save feedback
        triggerLocalToast(
          data.userSavedPosts.includes(post.id) ? "Post saved to layout." : "Post removed from saves.",
          "Bookmarks"
        );
        onPostUpdated({ ...post }); // triggers re-render
      }
    } catch (e) {
      console.error("Save post err:", e);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment || !token) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        onPostUpdated(updatedPost);
        setCommentText("");
        triggerLocalToast("Comment published", "Feedback");
      }
    } catch (e) {
      console.error("Comment submit err:", e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Image double-click detection
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const parentRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - parentRect.left;
    const y = e.clientY - parentRect.top;

    if (doubleClickTimeoutRef.current) {
      // It's a double click!
      clearTimeout(doubleClickTimeoutRef.current);
      doubleClickTimeoutRef.current = null;
      
      setHeartPopPosition({ x, y });
      setShowHeartPop(true);
      
      // Submit like if not liked already
      if (!isLiked) {
        handleLike();
      }
      
      setTimeout(() => {
        setShowHeartPop(false);
      }, 800);
    } else {
      doubleClickTimeoutRef.current = setTimeout(() => {
        doubleClickTimeoutRef.current = null;
      }, 300);
    }
  };

  const navigateToProfile = () => {
    if (onUserSelected) {
      onUserSelected(post.username);
    }
  };

  return (
    <article className="glass-panel rounded-2xl overflow-hidden mb-6 hover:shadow-xl hover:shadow-pink-500/2 border border-white/5 transition-all duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between p-4 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <img
            src={post.userAvatar}
            alt="Post user avatar"
            onClick={navigateToProfile}
            className="h-10 w-10 rounded-xl object-cover border border-white/5 cursor-pointer active:scale-95 transition-transform"
          />
          <div>
            <h3 
              onClick={navigateToProfile}
              className="text-sm font-semibold hover:text-pink-500 hover:underline cursor-pointer tracking-wide"
            >
              @{post.username}
            </h3>
            {post.location && (
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                <MapPin className="h-3 w-3 text-pink-500/80" />
                <span className="font-mono">{post.location}</span>
              </div>
            )}
          </div>
        </div>

        <button className="h-8 w-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* PICTURE & POP HEART AREA */}
      <div 
        className="relative w-full aspect-square bg-neutral-900 overflow-hidden cursor-pointer select-none"
        onClick={handleImageClick}
      >
        <img
          src={post.imageUrl}
          alt="Pixora visual update art"
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02] pointer-events-none"
        />

        {/* Double-click popup heart */}
        {showHeartPop && (
          <div 
            className="absolute h-24 w-24 flex items-center justify-center pointer-events-none animate-ping-heart text-white/95"
            style={{
              left: `${heartPopPosition.x - 48}px`,
              top: `${heartPopPosition.y - 48}px`,
            }}
          >
            <Heart className="h-20 w-20 fill-pink-500 text-pink-500 filter drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] animate-scale-heart" />
          </div>
        )}
      </div>

      {/* QUICK ACTIONS OVERLAY TRAY */}
      <div className="p-4 flex items-center justify-between text-zinc-200">
        <div className="flex items-center gap-4">
          <button
            id={`post-like-btn-${post.id}`}
            onClick={handleLike}
            className={`p-1 flex items-center gap-1.5 hover:scale-110 active:scale-90 transition-transform ${
              isLiked ? "text-pink-500" : "text-zinc-300 hover:text-pink-500"
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-pink-500" : ""}`} />
            <span className="text-xs font-mono font-bold">{post.likes.length}</span>
          </button>

          <button
            id={`post-comment-toggle-${post.id}`}
            onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
            className="p-1 flex items-center gap-1.5 text-zinc-300 hover:text-purple-400 hover:scale-110 active:scale-90 transition"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs font-mono font-bold">{post.comments.length}</span>
          </button>
        </div>

        <button
          id={`post-save-btn-${post.id}`}
          onClick={handleSave}
          className={`p-1 hover:scale-110 active:scale-90 transition ${
            isSaved ? "text-indigo-400" : "text-zinc-300 hover:text-indigo-400"
          }`}
        >
          <Bookmark className={`h-5 w-5 ${isSaved ? "fill-indigo-400" : ""}`} />
        </button>
      </div>

      {/* CAPTION & COLLAPSERS */}
      <div className="px-4 pb-2 space-y-1">
        <p className="text-sm leading-relaxed">
          <span 
            onClick={navigateToProfile}
            className="font-semibold mr-2 hover:text-pink-500 hover:underline cursor-pointer"
          >
            @{post.username}
          </span>
          <span className="text-zinc-300 font-sans">{post.caption}</span>
        </p>
        <span className="text-[10px] text-zinc-500 font-mono block pt-1">
          {new Date(post.createdAt).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </span>
      </div>

      {/* EXPANDABLE COMMENTS AREA */}
      {isCommentsExpanded && (
        <div className="border-t border-white/5 bg-black/30 p-4 space-y-4 animate-slide-down">
          
          {post.comments.length === 0 ? (
            <p className="text-xs font-mono text-zinc-500 text-center py-2">
              No responses recorded. Be the first to comment.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {post.comments.map((comm) => (
                <div key={comm.id} className="flex gap-3 text-xs leading-relaxed group">
                  <img
                    src={comm.userAvatar}
                    alt="Commenter profile userAvatar"
                    className="h-8 w-8 rounded-xl object-cover border border-white/5"
                  />
                  <div className="flex-1 bg-white/[0.02] p-2.5 rounded-2xl border border-white/5">
                    <div className="flex justify-between mb-0.5">
                      <span className="font-semibold text-zinc-200">@{comm.username}</span>
                      <span className="text-[8px] text-zinc-500 font-mono">
                        {new Date(comm.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-zinc-300">{comm.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUBMIT COMMENTS FORM */}
          {token && (
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-2 border-t border-white/5">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                disabled={isSubmittingComment}
                className="flex-1 px-4 py-2 text-xs rounded-xl glass-input placeholder-zinc-500 text-white"
              />
              <button
                type="submit"
                id={`comment-submit-${post.id}`}
                disabled={isSubmittingComment || !commentText.trim()}
                className="h-8 w-8 rounded-xl bg-pink-500/20 text-pink-400 hover:bg-pink-500 hover:text-white flex items-center justify-center disabled:opacity-40 disabled:hover:bg-pink-500/20 active:scale-95 transition"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}

        </div>
      )}

    </article>
  );
}
