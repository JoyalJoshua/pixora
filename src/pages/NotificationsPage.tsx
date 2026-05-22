import { useEffect } from "react";
import { Bell, Heart, MessageSquare, UserPlus, Image as ImageIcon, Send, Clock, Trash } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function NotificationsPage() {
  const { notifications, markNotificationsRead, fetchNotifications } = useAuth();

  useEffect(() => {
    // Sync reading indices on load
    markNotificationsRead();
  }, []);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-purple-400" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-indigo-400" />;
      case "message":
        return <Send className="h-4 w-4 text-pink-400" />;
      default:
        return <Bell className="h-4 w-4 text-zinc-400" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const elapsed = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(elapsed / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-2 md:px-0 space-y-6 select-none animate-fade-in">
      
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Bell className="h-6 w-6 text-pink-500 animate-pulse" />
          <h1 className="font-display font-medium text-2xl tracking-tight text-white font-sans">Alert Log Coordinate</h1>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-xl">
          SECURE CHANNEL LOG
        </span>
      </header>

      {/* NOTIFICATION LOG ENTRIES LIST */}
      <section className="space-y-3.5">
        {notifications.length === 0 ? (
          <div className="glass-panel text-center p-16 rounded-3xl border border-white/5 space-y-3 shadow-md">
            <Bell className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="font-display font-medium text-zinc-200">Cosmos in Stillness</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto font-sans leading-relaxed">
              No transmission alerts recorded. When creators interact with your timeline profile nodes, notifications will sync in real time.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              id={`notif-log-${notif.id}`}
              className={`glass-panel p-4 rounded-2xl flex items-center justify-between border border-white/5 shadow-sm transition-all duration-300 hover:border-pink-500/10 hover:bg-white/[0.015] ${
                !notif.isRead ? "border-l-4 border-l-pink-500 shadow-[2px_1px_15px_rgba(236,72,153,0.03)]" : ""
              }`}
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                
                {/* Event micro icon badge */}
                <div className="relative">
                  <img
                    src={notif.senderAvatar}
                    alt="Event sender userAvatar"
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-zinc-900 rounded-lg flex items-center justify-center border border-white/10 shadow shadow-black">
                    {getNotifIcon(notif.type)}
                  </div>
                </div>

                {/* Event Message */}
                <div className="overflow-hidden pr-3">
                  <p className="text-xs text-zinc-200 leading-normal font-sans">
                    <span className="font-semibold mr-1">@{notif.senderUsername}</span>
                    <span className="font-light text-zinc-400">{notif.text}</span>
                  </p>
                  
                  <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{timeAgo(notif.createdAt)}</span>
                  </div>
                </div>

              </div>
              
              {/* Optional Right Action icon placeholder */}
              <div className="flex-shrink-0 text-[10px] text-zinc-500 font-mono tracking-wider font-semibold uppercase bg-white/5 border border-white/10 p-2 rounded-lg scale-90">
                ACTIVE
              </div>

            </div>
          ))
        )}
      </section>

    </div>
  );
}
