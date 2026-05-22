import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navigation from "./components/Navigation";
import AuthPage from "./pages/AuthPage";
import HomeFeed from "./pages/HomeFeed";
import ExplorePage from "./pages/ExplorePage";
import ReelsPage from "./pages/ReelsPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import { Sparkles, Bell, RefreshCcw } from "lucide-react";

function RootAppShell() {
  const { isAuthenticated, isLoading, localToast, setLocalToast } = useAuth();
  
  // Layout views state: 'feed' | 'explore' | 'reels' | 'messages' | 'notifications' | 'profile'
  const [currentView, setView] = useState("feed");
  
  // Drill-down target variables
  const [selectedProfileUsername, setSelectedProfileUsername] = useState<string | undefined>(undefined);
  const [directChatPartner, setDirectChatPartner] = useState<string | undefined>(undefined);
  
  // Create Post Modal global trigger
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleProfileNavigation = (username: string) => {
    setSelectedProfileUsername(username);
    setView("profile");
  };

  const handleCustomViewSwitch = (viewId: string) => {
    // Reset view specific drills
    if (viewId !== "profile") {
      setSelectedProfileUsername(undefined);
    }
    if (viewId !== "messages") {
      setDirectChatPartner(undefined);
    }
    setView(viewId);
  };

  // 1. Loading Overlay Portal
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center relative select-none">
        
        {/* Background ambient glow bubbles */}
        <div className="absolute h-96 w-96 rounded-full bg-pink-500/5 blur-[100px] pointer-events-none" />
        <div className="absolute h-96 w-96 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

        <div className="space-y-4 text-center animate-pulse flex flex-col items-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/10">
            <span className="font-display font-bold text-2xl text-white tracking-widest">P</span>
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg tracking-widest text-white uppercase">PIXORA NETWORK</h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-wider mt-1 uppercase">ESTABLISHING ENCRYPTED DATAFEED LINK...</p>
          </div>
        </div>

      </div>
    );
  }

  // 2. Unauthenticated onboarding flow
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // 3. Authenticated dashboard view layout template
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex pb-18 md:pb-0 font-sans relative">
      
      {/* Global Toast micro alert banner */}
      {localToast && (
        <div 
          id="global-toast-banner"
          className="fixed bottom-20 md:bottom-6 right-6 md:right-8 left-6 md:left-auto p-4 rounded-2xl glass-panel-heavy border-l-4 border-l-pink-500 max-w-sm flex items-center gap-3.5 z-50 shadow-2xl animate-scale-up"
        >
          <div className="h-8 w-8 rounded-xl bg-pink-500/15 flex items-center justify-center flex-shrink-0">
            <Bell className="h-4.5 w-4.5 text-pink-400" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">{localToast.title}</p>
            <p className="text-xs font-medium text-zinc-200 mt-0.5 truncate leading-relaxed">{localToast.text}</p>
          </div>
          <button 
            id="global-toast-dismiss"
            onClick={() => setLocalToast(null)} 
            className="text-xs text-zinc-500 hover:text-white transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* DASHBOARD RESPONSIVE SIDEBAR */}
      <Navigation 
        currentView={currentView} 
        setView={handleCustomViewSwitch} 
        openCreateModal={() => setCreateModalOpen(true)}
      />

      {/* CORE VIEWPORT CANVAS CONTAINER */}
      <main className="flex-1 md:pl-64 min-h-screen transition-all duration-300">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          
          {/* Dynamic views switch handler */}
          {currentView === "feed" && (
            <HomeFeed 
              onUserSelected={handleProfileNavigation} 
              createModalOpen={createModalOpen}
              setCreateModalOpen={setCreateModalOpen}
            />
          )}

          {currentView === "explore" && (
            <ExplorePage onUserSelected={handleProfileNavigation} />
          )}

          {currentView === "reels" && (
            <ReelsPage />
          )}

          {currentView === "messages" && (
            <MessagesPage 
              initialTargetUsername={directChatPartner} 
              onUserSelected={handleProfileNavigation}
            />
          )}

          {currentView === "notifications" && (
            <NotificationsPage />
          )}

          {currentView === "profile" && (
            <ProfilePage 
              targetUsername={selectedProfileUsername} 
              setView={handleCustomViewSwitch} 
              setDirectChatPartner={setDirectChatPartner}
            />
          )}

        </div>
      </main>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootAppShell />
    </AuthProvider>
  );
}
