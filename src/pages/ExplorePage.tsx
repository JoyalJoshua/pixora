import { useState, useEffect } from "react";
import { Search, Compass, Eye, Heart, MessageCircle, AlertCircle, Sparkles } from "lucide-react";
import { Post } from "../types";

interface ExplorePageProps {
  onUserSelected?: (username: string) => void;
}

export default function ExplorePage({ onUserSelected }: ExplorePageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog detailed card view state
  const [zoomedPost, setZoomedPost] = useState<Post | null>(null);

  const categories = [
    { label: "ALL", query: "" },
    { label: "SHINJUKU & NEON", query: "neon" },
    { label: "STUDIO & VIBES", query: "studio" },
    { label: "MINIMAL DESIGN", query: "minimal" },
    { label: "CODING & TECH", query: "coding" },
  ];

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  useEffect(() => {
    handleFiltering();
  }, [searchQuery, selectedCategory, posts]);

  const fetchExplorePosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
        setFilteredPosts(data);
      }
    } catch (e) {
      console.error("Explore fetch err:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltering = () => {
    let result = [...posts];

    // Typo/keywords filter
    if (searchQuery.trim()) {
      const cleanQ = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.caption.toLowerCase().includes(cleanQ) ||
          p.username.toLowerCase().includes(cleanQ) ||
          (p.location && p.location.toLowerCase().includes(cleanQ))
      );
    }

    // Category filter
    if (selectedCategory !== "ALL") {
      const targetQuery = categories.find((c) => c.label === selectedCategory)?.query || "";
      result = result.filter(
        (p) =>
          p.caption.toLowerCase().includes(targetQuery) ||
          (p.location && p.location.toLowerCase().includes(targetQuery))
      );
    }

    setFilteredPosts(result);
  };

  const handleCategorySelect = (catLabel: string) => {
    setSelectedCategory(catLabel);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 px-2 md:px-0 select-none">
      
      {/* SEARCH HEADER AREA */}
      <header className="space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-pink-500 animate-spin-slow" />
            <h1 className="font-display font-medium text-2xl tracking-tight text-white">Explore Cosmos</h1>
          </div>

          {/* Quick interactive search input */}
          <div className="relative max-w-md w-full">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user profiles, locations, tag coordinates..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl glass-input placeholder-zinc-500 text-white"
            />
          </div>
        </div>

        {/* CATEGORY SELECTOR CHIPS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-white/5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                id={`explore-chip-${cat.label}`}
                onClick={() => handleCategorySelect(cat.label)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-mono tracking-wider uppercase font-semibold transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? "bg-white text-black font-bold shadow-lg"
                    : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

      </header>

      {/* FILTER RESULTS GALLERY */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="bg-zinc-800 rounded-2xl aspect-[3/4]"
              style={{
                height: i % 2 === 0 ? "240px" : "320px" // Simulate masonry varying heights
              }}
            />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl space-y-3">
          <AlertCircle className="h-10 w-10 text-zinc-600 mx-auto" />
          <h2 className="font-display font-medium text-lg">No assets match criteria</h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Try adjusting your words or check alternative tags to synchronize with existing posts.
          </p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setZoomedPost(post)}
              className="break-inside-avoid relative glass-panel rounded-2xl overflow-hidden cursor-zoom-in group border border-white/5 transition-transform duration-300 hover:scale-[1.01] hover:border-pink-500/20"
            >
              <img
                src={post.imageUrl}
                alt="Pixora explore photo item"
                className="w-full h-auto object-cover bg-zinc-900 pointer-events-none"
              />

              {/* HOVER INTERACTIVE ACTIONS MASK OVERLAY */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-4 transition-all duration-300 pointer-events-none select-none">
                
                <span className="self-end inline-flex items-center gap-1 bg-white/10 border border-white/10 px-2.5 py-1 rounded-full text-[8px] font-mono tracking-widest text-indigo-300 uppercase">
                  <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                  PREVIEW
                </span>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white">@{post.username}</p>
                  <p className="text-[10px] text-zinc-400 font-sans line-clamp-2">{post.caption}</p>

                  <div className="flex gap-4 pt-1.5 border-t border-white/5 mt-2.5">
                    <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-300">
                      <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
                      {post.likes.length}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-300">
                      <MessageCircle className="h-3 w-3 text-purple-400" />
                      {post.comments.length}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* DETAILED CARD ZOOM_OVERLAY MODAL */}
      {zoomedPost && (
        <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          
          <div className="w-full max-w-4xl glass-panel-heavy rounded-3xl overflow-hidden border border-white/10 flex flex-col md:flex-row shadow-2xl max-h-[85vh]">
            
            {/* Left Column visual image container */}
            <div className="flex-1 bg-black flex items-center justify-center max-h-[45vh] md:max-h-[85vh]">
              <img
                src={zoomedPost.imageUrl}
                alt="Zoomed image detail"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Right details column log */}
            <div className="w-full md:w-96 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/5 max-h-[40vh] md:max-h-[85vh] overflow-y-auto">
              
              <div className="space-y-4">
                
                {/* User Card */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={zoomedPost.userAvatar}
                      alt="Creator userAvatar"
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                    <div>
                      <h4 
                        onClick={() => {
                          setZoomedPost(null);
                          if (onUserSelected) onUserSelected(zoomedPost.username);
                        }}
                        className="text-xs font-semibold text-zinc-200 hover:text-pink-400 cursor-pointer"
                      >
                        @{zoomedPost.username}
                      </h4>
                      {zoomedPost.location && (
                        <p className="text-[9px] text-zinc-500 font-mono">{zoomedPost.location}</p>
                      )}
                    </div>
                  </div>

                  <button
                    id="explore-zoom-close"
                    onClick={() => setZoomedPost(null)}
                    className="h-8 w-8 rounded-full bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Caption Detail text */}
                <div className="text-xs leading-relaxed space-y-1.5 max-h-32 overflow-y-auto">
                  <p className="font-semibold text-zinc-100">@{zoomedPost.username}</p>
                  <p className="text-zinc-300 font-light font-sans">{zoomedPost.caption}</p>
                </div>

                {/* Likes counters tick */}
                <div className="flex gap-4 pt-1 text-xs text-zinc-500 font-mono">
                  <span>LIKES: {zoomedPost.likes.length}</span>
                  <span>RESPONSES: {zoomedPost.comments.length}</span>
                </div>

              </div>

              {/* Dynamic click shortcut triggers timeline */}
              <div className="pt-4 border-t border-white/5 mt-4">
                <button
                  id="explore-view-profile-shortcut"
                  onClick={() => {
                    setZoomedPost(null);
                    if (onUserSelected) onUserSelected(zoomedPost.username);
                  }}
                  className="w-full py-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white border border-pink-500/15 hover:border-transparent text-[10px] font-mono font-bold uppercase tracking-wider transition active:scale-98"
                >
                  Inspect User Profile
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
