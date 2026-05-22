import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Story } from "../types";

interface StoryViewerProps {
  stories: Story[];
  initialActiveIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, initialActiveIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialActiveIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeStory = stories[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialActiveIndex);
    setProgress(0);
  }, [initialActiveIndex]);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const duration = 5000; // 5 seconds per story slide
    const intervalTime = 100;
    const progressStep = (intervalTime / duration) * 100;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + progressStep;
      });
    }, intervalTime);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, isPaused]);

  const handlePrev = () => {
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      onClose();
    }
  };

  const handleNext = () => {
    setProgress(0);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  if (!activeStory) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-xl flex items-center justify-center z-50 p-1 md:p-4 animate-fade-in select-none">
      
      {/* Background Silhouette */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 filter blur-3xl scale-120"
        style={{ backgroundImage: `url(${activeStory.imageUrl})` }}
      />

      <div className="relative w-full max-w-lg aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/10">
        
        {/* TOP METADATA & PROGRESS BAR BUBBLES */}
        <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-10">
          
          {/* PROGRESS BARS INDICATOR */}
          <div className="flex gap-1.5 mb-4">
            {stories.map((story, idx) => (
              <div 
                key={story.id} 
                className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
              >
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100 ease-linear"
                  style={{
                    width: idx === currentIndex 
                      ? `${progress}%` 
                      : idx < currentIndex 
                        ? "100%" 
                        : "0%"
                  }}
                />
              </div>
            ))}
          </div>

          {/* USER INFO */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeStory.userAvatar}
                alt="Story creator profile userAvatar"
                className="h-9 w-9 rounded-xl object-cover border border-pink-500/80 animate-spin-once"
              />
              <div>
                <p className="text-sm font-semibold text-white drop-shadow-md">
                  @{activeStory.username}
                </p>
                <p className="text-[10px] text-zinc-300 font-mono drop-shadow-md">
                  ACTIVE STORY
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="story-close-btn"
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md active:scale-95 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* IMAGE PREVIEW SCREEN */}
        <div 
          className="flex-1 w-full bg-zinc-950 flex items-center justify-center relative cursor-longpress"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <img
            src={activeStory.imageUrl}
            alt="Pixora active story slide stream"
            className="w-full h-full object-cover rounded-md select-none pointer-events-none"
          />

          {/* LEFT & RIGHT TAPS OVERLAY */}
          <div className="absolute inset-y-0 left-0 w-1/4" onClick={handlePrev} />
          <div className="absolute inset-y-0 right-0 w-1/4" onClick={handleNext} />
        </div>

        {/* BOTTOM STORY NAVIGATORS DESKTOP BAR */}
        <div className="hidden sm:flex absolute inset-y-1/2 -left-16 transform -translate-y-1/2">
          <button
            id="story-left-paddle"
            onClick={handlePrev}
            className="h-10 w-10 rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/20 flex items-center justify-center backdrop-blur shadow-lg active:scale-90 transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
        <div className="hidden sm:flex absolute inset-y-1/2 -right-16 transform -translate-y-1/2">
          <button
            id="story-right-paddle"
            onClick={handleNext}
            className="h-10 w-10 rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/20 flex items-center justify-center backdrop-blur shadow-lg active:scale-90 transition"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

      </div>
    </div>
  );
}
