import React, { useState, useEffect } from "react";
import { Grid, Bookmark, Edit, LogOut, MapPin, Sparkles, MessageSquare, Plus, AlertCircle, FileText, Heart, Check, Users, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Post, User } from "../types";

interface ProfilePageProps {
  targetUsername?: string;
  setView: (view: string) => void;
  setDirectChatPartner: (username: string) => void;
}

export default function ProfilePage({ targetUsername, setView, setDirectChatPartner }: ProfilePageProps) {
  const { user: currentUser, token, logout, triggerLocalToast } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tab indicators: 'POSTS' | 'SAVED'
  const [activeTab, setActiveTab] = useState<"POSTS" | "SAVED">("POSTS");
  
  // MODAL EDIT PROFILE STATES
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempBio, setTempBio] = useState("");
  const [tempAvatar, setTempAvatar] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwnProfile = !targetUsername || (currentUser && targetUsername.toLowerCase() === currentUser.username.toLowerCase());
  const amIFollowing = (currentUser && profile) ? profile.followers.includes(currentUser.id) : false;

  useEffect(() => {
    fetchProfileDetails();
  }, [targetUsername, currentUser?.savedPosts]);

  const fetchProfileDetails = async () => {
    setIsLoading(true);
    const queryName = targetUsername || currentUser?.username;
    if (!queryName) return;

    try {
      const res = await fetch(`/api/profile/${queryName}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setProfilePosts(data.posts);

        // Prepopulate edit modal state variables
        setTempName(data.profile.name);
        setTempBio(data.profile.bio);
        setTempAvatar(data.profile.avatar);

        // Fetch saved posts if own profile
        if (isOwnProfile && token) {
          const savedRes = await fetch("/api/posts");
          if (savedRes.ok) {
            const allPosts = await savedRes.json();
            // Filter posts present in savedPosts IDs
            const filtered = allPosts.filter((p: Post) => data.profile.savedPosts?.includes(p.id));
            setSavedPosts(filtered);
          }
        }
      } else {
        triggerLocalToast("Profile coordinate doesn't exist", "Network Void");
      }
    } catch (e) {
      console.error("Profile detail fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile || !token || !currentUser) return;
    try {
      const res = await fetch(`/api/profile/${profile.id}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        triggerLocalToast(
          data.following ? "Successfully connected with @" + profile.username : "Removed connection.",
          "Network Updates"
        );
        // Toggle Locally
        setProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            followers: data.following
              ? [...prev.followers, currentUser.id]
              : prev.followers.filter((id) => id !== currentUser.id)
          };
        });
      }
    } catch (e) {
      console.error("Follow toggling failed:", e);
    }
  };

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim() || isUpdating || !token) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: tempName.trim(),
          bio: tempBio.trim(),
          avatar: tempAvatar.trim()
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setProfile(updatedUser);
        triggerLocalToast("Profile synchronization complete.", "Auth Success");
        setShowEditModal(false);
      }
    } catch (e) {
      console.error("Profile syncing failed:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInitiateMessage = () => {
    if (!profile) return;
    setDirectChatPartner(profile.username);
    setView("messages");
  };

  const randomizeBotAvatar = () => {
    const randomSeed = Math.floor(Math.random() * 100000);
    setTempAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="h-8 w-8 border-3 border-t-pink-500 border-zinc-800 rounded-full animate-spin" />
        <span className="font-mono text-zinc-500 text-[10px]">PARSING DIGITAL GRID CORES...</span>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 md:px-0 space-y-8 select-none">
      
      {/* 1. HERO BIO HEADER PANEL */}
      <header className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center md:items-start gap-6 relative shadow-md">
        
        {/* Glowing floating banner */}
        <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-pink-950/40 border border-pink-500/10 rounded-full">
          <Sparkles className="h-3 w-3 text-pink-400" />
          <span className="text-[8px] font-mono tracking-wider text-pink-300 uppercase">Pixora Node Link</span>
        </div>

        {/* Profile Avatar Frame with glows */}
        <div className="relative">
          <div className="h-28 w-28 rounded-3xl p-[3px] bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 shadow-xl shadow-pink-500/5 hover:rotate-2 transition-transform duration-300">
            <img
              src={profile.avatar}
              alt="Profile card userAvatar"
              className="h-full w-full rounded-2xl object-cover bg-zinc-800 border border-zinc-950"
            />
          </div>
          {profile.isOnline && (
            <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-4 border-zinc-950 animate-pulse" />
          )}
        </div>

        {/* Info Column */}
        <div className="flex-1 space-y-4 text-center md:text-left self-center">
          
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div>
              <h2 className="font-display font-semibold text-xl tracking-tight text-white">{profile.name}</h2>
              <p className="text-xs font-mono text-zinc-500">@{profile.username}</p>
            </div>

            <div className="flex items-center justify-center gap-2 mt-2 md:mt-0">
              {isOwnProfile ? (
                <>
                  <button
                    id="profile-edit-btn"
                    onClick={() => setShowEditModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 flex items-center gap-1.5 text-xs font-semibold tracking-wide transition active:scale-95"
                  >
                    <Edit className="h-3.5 w-3.5 text-pink-500" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    id="profile-logout-btn"
                    onClick={logout}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/10 flex items-center justify-center transition active:scale-95"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    id="profile-connect-btn"
                    onClick={handleFollowToggle}
                    className={`px-4 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 ${
                      amIFollowing
                        ? "bg-zinc-800 text-zinc-300 border-zinc-700/40"
                        : "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent"
                    }`}
                  >
                    {amIFollowing ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5 text-green-400" />
                        <span>Connected</span>
                      </>
                    ) : (
                      <>
                        <Users className="h-3.5 w-3.5" />
                        <span>Connect</span>
                      </>
                    )}
                  </button>

                  <button
                    id="profile-message-btn"
                    onClick={handleInitiateMessage}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 flex items-center gap-1.5 text-xs font-semibold transition active:scale-95"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Secure Message</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans max-w-lg">{profile.bio}</p>

          {/* Counts Line Grid stats */}
          <div className="flex justify-center md:justify-start items-center gap-6 pt-2 border-t border-white/5 text-zinc-400 text-xs font-mono">
            <div>
              <span className="font-bold text-white mr-1.5">{profilePosts.length}</span>
              <span>POSTS</span>
            </div>
            <div>
              <span className="font-bold text-white mr-1.5">{profile.followers.length}</span>
              <span>FOLLOWERS</span>
            </div>
            <div>
              <span className="font-bold text-white mr-1.5">{profile.following.length}</span>
              <span>FOLLOWING</span>
            </div>
          </div>

        </div>

      </header>

      {/* 2. TABBED SELECTION CONTROLLER LAYOUTS */}
      <section className="space-y-4">
        
        <div className="flex justify-center border-b border-white/5 gap-6">
          <button
            id="profile-tab-posts"
            onClick={() => setActiveTab("POSTS")}
            className={`pb-3 text-xs font-mono tracking-widest font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "POSTS" 
                ? "border-pink-500 text-pink-500" 
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Grid className="h-4 w-4" />
            <span>POSTS FEED ({profilePosts.length})</span>
          </button>

          {isOwnProfile && (
            <button
              id="profile-tab-saved"
              onClick={() => setActiveTab("SAVED")}
              className={`pb-3 text-xs font-mono tracking-widest font-semibold flex items-center gap-2 border-b-2 transition ${
                activeTab === "SAVED" 
                  ? "border-pink-500 text-pink-500" 
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              <span>SAVED ARCHIVE ({profile.savedPosts?.length || 0})</span>
            </button>
          )}
        </div>

        {/* GRID DISPLAY CONTENT */}
        {activeTab === "POSTS" ? (
          profilePosts.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-2xl border border-white/5 space-y-2">
              <AlertCircle className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-mono text-zinc-500 uppercase">No visual assets published.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {profilePosts.map((post) => (
                <div 
                  key={post.id} 
                  className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer bg-zinc-900 border border-white/5"
                >
                  <img
                    src={post.imageUrl}
                    alt="Grid visual element"
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  
                  {/* Stats tooltip on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white text-xs font-mono font-semibold transition duration-300">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 fill-current text-pink-500" />
                      {post.likes.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                      {post.comments.length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          savedPosts.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-2xl border border-white/5 space-y-2">
              <Bookmark className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-mono text-zinc-500 uppercase">Bookmarks drawer is empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {savedPosts.map((post) => (
                <div 
                  key={post.id} 
                  className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer bg-zinc-900 border border-white/5"
                >
                  <img
                    src={post.imageUrl}
                    alt="Grid visual element"
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white text-xs font-mono transition duration-300">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
                      {post.likes.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                      {post.comments.length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </section>

      {/* 3. MODAL EDIT DIALOG OVERLAY */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          
          <div className="w-full max-w-md glass-panel-heavy rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col">
            
            <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/[0.01]">
              <h3 className="font-display font-semibold text-zinc-200">Synchronize Coordinates</h3>
              <button
                id="edit-modal-close"
                onClick={() => setShowEditModal(false)}
                className="h-8 w-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfileSubmit} className="p-6 space-y-4">
              
              {/* Profile Avatar customizer panel */}
              <div className="flex flex-col items-center gap-3">
                <img
                  src={tempAvatar}
                  alt="Avatar editor preview"
                  className="h-20 w-20 rounded-2xl object-cover bg-zinc-800 border-2 border-pink-500/50"
                />
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={randomizeBotAvatar}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-[10px] font-mono tracking-wider font-semibold active:scale-95 transition"
                  >
                    Randomize Avatar
                  </button>
                </div>
              </div>

              {/* Display name input */}
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-white"
                />
              </div>

              {/* Bio details description */}
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">Bio Description</label>
                <textarea
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-white resize-none"
                />
              </div>

              {/* Submit Sync buttons */}
              <button
                type="submit"
                disabled={isUpdating || !tempName.trim()}
                id="edit-profile-save-submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-semibold text-white text-xs tracking-widest uppercase hover:brightness-110 disabled:opacity-40 transition active:scale-98 shadow-md"
              >
                {isUpdating ? "SYNCHRONIZING..." : "SAVE CHANGES"}
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
