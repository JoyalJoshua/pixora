import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Music, Flame, Eye } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Reel } from "../types";

export default function ReelsPage() {
  const { token, user, triggerLocalToast } = useAuth();
  
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reels");
      if (res.ok) {
        setReels(await res.json());
      }
    } catch (e) {
      console.error("Reels fetch failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeReel = async (id: string, index: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/reels/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state list
        setReels(prev => prev.map((r, idx) => idx === index ? data.reel : r));
        triggerLocalToast(
          data.liked ? "Liked reel from @" + data.reel.username : "Unliked reel.",
          "Network Updates"
        );
      }
    } catch (e) {
      console.error("Like reel err:", e);
    }
  };

  const handleShareReel = (username: string) => {
    triggerLocalToast("Aesthetic asset coordinate copied for @" + username, "Share");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="h-10 w-10 border-4 border-t-pink-500 border-zinc-800 rounded-full animate-spin" />
        <span className="font-mono text-zinc-500 text-xs">CALIBRATING VERTICAL ENGINES...</span>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="text-center p-12 glass-panel rounded-3xl max-w-md mx-auto mt-10">
        <Flame className="h-10 w-10 text-pink-500 mx-auto animate-bounce" />
        <h3 className="font-display font-semibold text-lg mt-3">Reels Void</h3>
        <p className="text-xs text-zinc-500 mt-1 font-mono">NO VERTICAL TRANSMISSIONS DETECTED.</p>
      </div>
    );
  }

  return (
    <div className="h-[84vh] md:h-[92vh] max-w-sm mx-auto flex items-center justify-center p-1 md:p-4 select-none">
      
      {/* SNAP-CONTAINER */}
      <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 flex flex-col">
        
        {/* Dynamic visual slider */}
        {reels.map((reel, index) => {
          const isActive = index === activeReelIndex;
          const isUserLiked = user ? reel.likes.includes(user.id) : false;

          if (!isActive) return null;

          return (
            <div key={reel.id} className="relative flex-1 w-full h-full bg-zinc-950 flex flex-col justify-end">
              
              {/* LOOP VISUAL BACKGROUND */}
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img
                  src={reel.videoUrl}
                  alt="Aesthetic moving visual background"
                  className="w-[120%] h-[120%] -translate-x-[10%] -translate-y-[10%] object-cover scale-110 filter brightness-[0.70] blur-sm animate-ambient-background pointer-events-none"
                />
                
                {/* Foreground sharp lens visual */}
                <img
                  src={reel.videoUrl}
                  alt="Aesthetic sharp foreground lens visual"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  onDoubleClick={() => handleLikeReel(reel.id, index)}
                />
                
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50 pointer-events-none" />
              </div>

              {/* MUTED OVERLAY PADDLE */}
              <button
                id="reels-audio-mute-toggle"
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 flex items-center justify-center z-20 border border-white/5 transition"
              >
                {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              {/* TOP BRAND EMBLEM */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 border border-white/5 backdrop-blur-md rounded-full z-20">
                <Flame className="h-3.5 w-3.5 text-pink-500 animate-pulse" />
                <span className="text-[10px] font-mono text-zinc-100 uppercase tracking-widest font-semibold">Pixora Reel</span>
              </div>

              {/* FLOATING ACTION ICON COLUMN */}
              <div className="absolute right-3 bottom-24 flex flex-col gap-5 items-center z-20 text-white animate-slide-up">
                
                {/* Like Button */}
                <div className="flex flex-col items-center">
                  <button
                    id={`reel-like-${reel.id}`}
                    onClick={() => handleLikeReel(reel.id, index)}
                    className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                      isUserLiked 
                        ? "bg-pink-500/20 text-pink-400 border border-pink-500/40" 
                        : "bg-black/40 border border-white/10 hover:bg-black/60 text-zinc-200 hover:text-white"
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isUserLiked ? "fill-pink-500 text-pink-400" : ""}`} />
                  </button>
                  <span className="text-[10px] font-mono font-semibold mt-1 drop-shadow-md">
                    {reel.likes.length}
                  </span>
                </div>

                {/* Comment Indicator */}
                <div className="flex flex-col items-center">
                  <div className="h-11 w-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-zinc-200">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold mt-1 drop-shadow-md">
                    {reel.commentsCount}
                  </span>
                </div>

                {/* Share Trigger */}
                <div className="flex flex-col items-center">
                  <button
                    id={`reel-share-${reel.id}`}
                    onClick={() => handleShareReel(reel.username)}
                    className="h-11 w-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-zinc-200 hover:bg-black/60 transition"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <span className="text-[10px] font-mono font-semibold mt-1 drop-shadow-md">
                    {reel.shares}
                  </span>
                </div>

                {/* Dynamic Views stats */}
                <div className="flex flex-col items-center opacity-85">
                  <div className="h-11 w-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-indigo-400">
                    <Eye className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold mt-1 drop-shadow-md">
                    {reel.views.toLocaleString()}
                  </span>
                </div>

              </div>

              {/* REEL METADATA BOTTOM PANEL */}
              <div className="p-4 bg-gradient-to-t from-black/90 to-transparent z-10 text-white space-y-3 relative-x">
                
                <div className="flex items-center gap-2.5">
                  <img
                    src={reel.userAvatar}
                    alt="Reel creator userAvatar"
                    className="h-9 w-9 rounded-xl object-cover border border-white/10"
                  />
                  <div>
                    <h4 className="text-xs font-semibold drop-shadow-md">@{reel.username}</h4>
                    <span className="text-[9px] text-zinc-400 font-mono">VERIFIED CREATOR</span>
                  </div>
                  
                  <button className="ml-auto text-[9px] font-mono uppercase border border-pink-500/20 bg-pink-500/5 px-2 py-1 rounded-md text-pink-400 drop-shadow-md">
                    Follow
                  </button>
                </div>

                <p className="text-xs text-zinc-200 line-clamp-2 pr-14 leading-relaxed font-sans font-light drop-shadow-md">
                  {reel.caption}
                </p>

                {/* Simulated Audio Tape loop ticker */}
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5 w-fit font-mono select-none overflow-hidden max-w-[200px]">
                  <Music className="h-3 w-3 text-pink-400 animate-spin-slow flex-shrink-0" />
                  <span className="truncate">{reel.audioTrack}</span>
                </div>

              </div>

              {/* QUICK NAVIGATIONS SWITCHES */}
              <div className="absolute inset-y-1/2 left-2 transform -translate-y-1/2 z-30">
                <button
                  id="reels-prev-padd"
                  disabled={activeReelIndex === 0}
                  onClick={() => setActiveReelIndex(prev => Math.max(0, prev - 1))}
                  className="h-8 w-8 rounded-full bg-white/10 text-white disabled:opacity-20 hover:bg-white/20 flex items-center justify-center text-xs border border-white/5 active:scale-90 transition"
                >
                  ▲
                </button>
              </div>
              <div className="absolute inset-y-1/2 right-2 transform -translate-y-1/2 z-30">
                <button
                  id="reels-next-padd"
                  disabled={activeReelIndex === reels.length - 1}
                  onClick={() => setActiveReelIndex(prev => Math.min(reels.length - 1, prev + 1))}
                  className="h-8 w-8 rounded-full bg-white/10 text-white disabled:opacity-20 hover:bg-white/20 flex items-center justify-center text-xs border border-white/5 active:scale-90 transition"
                >
                  ▼
                </button>
              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}
