import React, { useState, useEffect } from "react";
import { Plus, Compass, Sparkles, AlertCircle, RefreshCw, Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import StoryViewer from "../components/StoryViewer";
import { Post, Story, User } from "../types";

interface HomeFeedProps {
  onUserSelected?: (username: string) => void;
  createModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;
}

export default function HomeFeed({ onUserSelected, createModalOpen, setCreateModalOpen }: HomeFeedProps) {
  const { token, user, triggerLocalToast, fetchConversations } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // CREATE POST FORM STATES
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchFeedData();
    fetchSuggestions();
  }, [token]);

  const fetchFeedData = async () => {
    setIsLoading(true);
    try {
      // Parallel fetches for feed posts and active stories
      const [postsRes, storiesRes] = await Promise.all([
        fetch("/api/posts"),
        fetch("/api/stories")
      ]);

      if (postsRes.ok) {
        setPosts(await postsRes.json());
      }
      if (storiesRes.ok) {
        setStories(await storiesRes.json());
      }
    } catch (e) {
      console.error("Feed bootstrap failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        // Extract users that I do not follow yet
        if (user) {
          const uids = list.map((c: any) => c.user);
          // Just get general list from api if conversations are low, else use conversant profiles
          const filtered = uids.filter((u: User) => u.id !== user.id && !user.following.includes(u.id));
          setSuggestions(filtered.slice(0, 5));
        }
      }
    } catch (e) {
      console.error("Suggestions err:", e);
    }
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/profile/${targetUserId}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        triggerLocalToast(
          data.following ? "Successfully followed user." : "Unfollowed user.",
          "Network Updates"
        );
        // Refresh suggestions and follow states locally
        if (user) {
          user.following = data.following 
            ? [...user.following, targetUserId] 
            : user.following.filter(id => id !== targetUserId);
          fetchSuggestions();
        }
      }
    } catch (e) {
      console.error("Follow toggling failed:", e);
    }
  };

  // BASE64 FILE UPLOAD DRAG/DROP
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerLocalToast("Only image attachments are permitted.", "Format Error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageUrl(e.target.result as string);
        triggerLocalToast("Visual parsed successfully.", "Uploads");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // GEMINI AI INTEGRATION TRIGGER
  const handleGenerateAiCaption = async () => {
    if (!aiKeywords.trim()) {
      triggerLocalToast("Please state a few keywords (e.g. coffee neon city night).", "AI Caption");
      return;
    }
    setIsAiGenerating(true);
    try {
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ keywords: aiKeywords })
      });
      if (res.ok) {
        const data = await res.json();
        setCaption(data.caption);
        triggerLocalToast("Aesthetic description synthesized!", "AI Engine Success");
      }
    } catch (e) {
      console.error("AI caption synthesis failure:", e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // FORM SUBMISSION TO ENDPOINT
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      triggerLocalToast("A visual is required to compile post.", "Form Safety");
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl, caption, location })
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [newPost, ...prev]);
        triggerLocalToast("Aesthetic visual published on timeline!", "Timeline Update");
        
        // Reset States and Close
        setImageUrl("");
        setCaption("");
        setLocation("");
        setAiKeywords("");
        setCreateModalOpen(false);
      }
    } catch (e) {
      console.error("Publishing post failed:", e);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto py-4 px-2 md:px-0 select-none">
      
      {/* MAIN CONTENT COLUMN */}
      <div className="flex-1 md:max-w-2xl space-y-6">
        
        {/* STORIES SECTION CAROUSEL */}
        <section className="glass-panel p-4 rounded-2xl flex items-center gap-4 overflow-x-auto no-scrollbar border border-white/5 shadow-md">
          {user && (
            <div 
              onClick={() => setCreateModalOpen(true)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer space-y-1.5 group select-none"
            >
              <div className="relative h-14 w-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-pink-500/50 transition-all duration-300">
                <Plus className="h-5 w-5 text-zinc-300 group-hover:text-pink-400 group-hover:scale-110 transition-all" />
              </div>
              <span className="text-[10px] text-zinc-400 font-mono group-hover:text-white transition">Add Story</span>
            </div>
          )}

          {stories.length === 0 ? (
            <div className="flex items-center gap-1.5 px-4 text-xs font-mono text-zinc-500">
              <AlertCircle className="h-4.5 w-4.5 text-zinc-600" />
              <span>No current visual stories.</span>
            </div>
          ) : (
            stories.map((story, index) => (
              <div
                key={story.id}
                onClick={() => setActiveStoryIndex(index)}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer space-y-1.5 group"
              >
                <div className="h-[62px] w-[62px] rounded-full p-[2.5px] bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 hover:rotate-6 transition-all duration-300">
                  <img
                    src={story.userAvatar}
                    alt="Story user header"
                    className="h-full w-full rounded-full object-cover border-2 border-zinc-950 bg-zinc-800"
                  />
                </div>
                <span className="text-[10px] text-zinc-400 max-w-[56px] truncate font-mono">
                  @{story.username}
                </span>
              </div>
            ))
          )}
        </section>

        {/* FEED LOADER / FLOW */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((n) => (
              <div key={n} className="glass-panel rounded-2xl p-4 space-y-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-10 w-10 bg-zinc-800 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded-md w-1/3" />
                    <div className="h-3 bg-zinc-800 rounded-md w-1/4" />
                  </div>
                </div>
                <div className="aspect-square bg-zinc-800 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-panel text-center p-12 rounded-3xl border border-white/5 space-y-4 shadow-xl">
            <Compass className="h-12 w-12 text-zinc-600 mx-auto animate-bounce" />
            <h3 className="font-display font-medium text-lg">Timeline Uncharted</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Welcome to the edge of space! There are no visual coordinates posted yet. Tap "Create Post" to launch the first visual asset.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={handlePostUpdated}
                onUserSelected={onUserSelected}
              />
            ))}
          </div>
        )}

      </div>

      {/* SUGGESTIONS SIDEBAR (HIDDEN ON TABLET/MOBILE SCREEN) */}
      <aside className="hidden lg:block w-76 space-y-6 h-fit sticky top-4">
        
        {/* CURATED SUGGESTIONS LIST */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 shadow-md">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Suggested Creators</h4>
            <button 
              id="feed-refresh-suggestions"
              onClick={fetchSuggestions}
              className="p-1 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {suggestions.length === 0 ? (
              <p className="text-[10px] text-zinc-500 font-mono py-2">
                All creators connected. Welcome to the core network!
              </p>
            ) : (
              suggestions.map((sug) => (
                <div key={sug.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={sug.avatar}
                      alt="Suggested user avatar"
                      onClick={() => onUserSelected && onUserSelected(sug.username)}
                      className="h-8 w-8 rounded-lg object-cover cursor-pointer hover:border-pink-500/40 border border-transparent transition"
                    />
                    <div className="overflow-hidden max-w-[110px]">
                      <p 
                        onClick={() => onUserSelected && onUserSelected(sug.username)}
                        className="text-xs font-semibold truncate text-zinc-200 hover:text-pink-400 hover:underline cursor-pointer"
                      >
                        @{sug.username}
                      </p>
                      <p className="text-[9px] text-zinc-500 truncate font-mono">{sug.name}</p>
                    </div>
                  </div>

                  <button
                    id={`suggest-follow-${sug.id}`}
                    onClick={() => handleFollowToggle(sug.id)}
                    className="text-[9px] font-mono font-bold uppercase py-1 px-2.5 rounded-lg bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white border border-pink-500/10 hover:border-transparent active:scale-95 transition"
                  >
                    Follow
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PIXORA INFO FOOTER */}
        <div className="px-4 text-[9px] font-mono text-zinc-600 space-y-1.5 leading-relaxed">
          <p>© 2026 PIXORA INC • POWERED BY GEMINI 3.5 FLASH</p>
          <p>BUILT WITH FULL-STACK EXPRESS ENGINE</p>
        </div>

      </aside>

      {/* STORY VIEWER MODAL OVERLAY */}
      {activeStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialActiveIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}

      {/* CREATE POST MODAL DIALOG */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          
          <div className="w-full max-w-lg glass-panel-heavy rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-1.5 text-zinc-200">
                <Plus className="h-5 w-5 text-pink-500" />
                <h3 className="font-display font-semibold text-base">Synthesize New Visual</h3>
              </div>
              <button
                id="create-modal-close"
                onClick={() => setCreateModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Scroll area */}
            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              
              <form onSubmit={handlePublishPost} className="space-y-4">
                
                {/* Visual file Drag / Drop upload widget */}
                {!imageUrl ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center cursor-pointer min-h-[180px] transition-all ${
                      dragActive 
                        ? "border-pink-500 bg-pink-500/5 shadow-[inset_0_0_15px_rgba(236,72,153,0.1)]" 
                        : "border-white/10 bg-white/[0.01] hover:border-white/20"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="create-post-file"
                    />
                    <label htmlFor="create-post-file" className="cursor-pointer flex flex-col items-center">
                      <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                        <Upload className="h-6 w-6 text-zinc-400" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-200">Drag & Drop visual file here</p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">or click to browse filesystem</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative aspect-video rounded-2xl overflow-hidden group bg-zinc-900 border border-white/10">
                    <img
                      src={imageUrl}
                      alt="Parsed visual preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      id="reset-preview-visual"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center backdrop-blur text-xs transition"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Optional Location input */}
                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">Spatial Coordinates / Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Shinjuku, Tokyo"
                    className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-white"
                  />
                </div>

                {/* AI CAPTION SYNTHESIZER PANEL */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-purple-950/20 to-pink-950/20 border border-pink-500/20 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-300">
                    <Sparkles className="h-4 w-4 text-pink-400 animate-pulse" />
                    <span>Pixora Gemini AI Copilot</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiKeywords}
                      onChange={(e) => setAiKeywords(e.target.value)}
                      placeholder="e.g. moody workstation synths retro coding night"
                      className="flex-1 px-4 py-2 text-[11px] rounded-xl glass-input border-pink-500/10 placeholder-zinc-500 text-white"
                    />
                    <button
                      type="button"
                      id="ai-caption-trigger"
                      onClick={handleGenerateAiCaption}
                      disabled={isAiGenerating || !aiKeywords.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-xs tracking-wide hover:brightness-110 active:scale-95 disabled:opacity-40 transition"
                    >
                      {isAiGenerating ? "Synthesized..." : "Magic"}
                    </button>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-500">
                    Integrates with **Gemini 3.5 Flash** on server endpoints to generate photo descriptions automatically.
                  </p>
                </div>

                {/* Dynamic Captions Descriptor Box */}
                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">Caption Details</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    placeholder="Describe your visual..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-white resize-none"
                  />
                </div>

                {/* Post Submit Button */}
                <button
                  type="submit"
                  disabled={isPublishing || !imageUrl}
                  id="create-publish-submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-semibold text-white text-xs tracking-widest uppercase hover:brightness-110 active:scale-98 disabled:opacity-40 transition shadow-lg shadow-pink-500/10"
                >
                  {isPublishing ? "PUBLISHING TO COSMOS..." : "PUBLISH POST"}
                </button>

              </form>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
