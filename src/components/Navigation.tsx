import { useAuth } from "../context/AuthContext";
import { 
  Home, 
  Compass, 
  Clapperboard, 
  MessageCircle, 
  Bell, 
  User, 
  LogOut, 
  PlusSquare, 
  Menu,
  Heart
} from "lucide-react";

interface NavigationProps {
  currentView: string;
  setView: (view: string) => void;
  openCreateModal: () => void;
}

export default function Navigation({ currentView, setView, openCreateModal }: NavigationProps) {
  const { user, logout, unreadNotificationCount, conversations } = useAuth();

  const totalUnreadChats = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

  const navItems = [
    { id: "feed", label: "Home Feed", icon: Home },
    { id: "explore", label: "Explore Grid", icon: Compass },
    { id: "reels", label: "Reels Stream", icon: Clapperboard },
    { id: "messages", label: "Messaging", icon: MessageCircle, badge: totalUnreadChats },
    { id: "notifications", label: "Alerts Center", icon: Bell, badge: unreadNotificationCount },
    { id: "profile", label: "My Profile", icon: User },
  ];

  if (!user) return null;

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 glass-panel border-r border-white/5 p-6 z-40 transition-all duration-300">
        {/* Visual Brand Signature */}
        <div className="mb-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-pink-500/10">
            <span className="font-display font-bold text-xl text-white tracking-widest">P</span>
          </div>
          <div>
            <h1 className="font-display font-medium text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-neutral-400">
              PIXORA
            </h1>
            <span className="font-mono text-[9px] text-zinc-500 tracking-wider">FUTURE SOCIAL MEDIA</span>
          </div>
        </div>

        {/* Primary Views Navigator List */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-desktop-${item.id}`}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-white/10 text-white font-semibold border-l-4 border-pink-500/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 hover:border-l-4 hover:border-zinc-500/40"
                }`}
              >
                <div className="relative">
                  <IconComponent 
                    className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? "text-pink-500 animate-pulse" : ""
                    }`} 
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span id={`badge-desktop-${item.id}`} className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-pink-500 text-[9px] text-white flex items-center justify-center font-sans font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="font-display">{item.label}</span>
              </button>
            );
          })}

          {/* Action Trigger for Creating New Post */}
          <button
            id="nav-desktop-create"
            onClick={openCreateModal}
            className="w-full mt-6 flex items-center gap-4 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-semibold text-white text-sm tracking-wide shadow-lg shadow-pink-500/10 hover:brightness-110 active:scale-98 transition-all duration-200"
          >
            <PlusSquare className="h-5 w-5" />
            <span className="font-display text-white">Create Post</span>
          </button>
        </nav>

        {/* Quick User Panel Footer */}
        <div className="border-t border-white/5 pt-4 mt-auto flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <img
              src={user.avatar}
              alt="Avatar avatar"
              className="h-10 w-10 rounded-xl object-cover bg-zinc-800 border border-white/10"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-zinc-100">{user.name}</p>
              <p className="text-xs truncate font-mono text-zinc-500">@{user.username}</p>
            </div>
          </div>
          
          <button
            id="nav-desktop-logout"
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-xs font-semibold text-zinc-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/10 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-display">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-1 left-3 right-3 h-16 rounded-2xl glass-panel border-t border-white/10 flex items-center justify-around px-2 z-40 shadow-2xl">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-mobile-${item.id}`}
              onClick={() => setView(item.id)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                isActive ? "text-pink-500 scale-110" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <IconComponent className="h-5 w-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <span id={`badge-mobile-${item.id}`} className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-pink-500 text-[8px] text-white flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
              <span className="text-[9px] font-display scale-90 mt-0.5">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
        {/* Floating Quick Add Trigger on Mobile */}
        <button
          id="nav-mobile-create"
          onClick={openCreateModal}
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/15 active:scale-95 transition-transform"
        >
          <PlusSquare className="h-5 w-5" />
        </button>
      </nav>
    </>
  );
}
