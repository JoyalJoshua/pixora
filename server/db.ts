import fs from "fs";
import path from "path";
import { User, Post, Reel, Story, Message, Notification, Comment } from "./types";

interface DBData {
  users: User[];
  posts: Post[];
  reels: Reel[];
  stories: Story[];
  messages: Message[];
  notifications: Notification[];
}

const DB_PATH = path.join(process.cwd(), "db.json");

// High-fidelity curated visual seed data
const SEED_USERS: User[] = [
  {
    id: "user-sarah",
    username: "sarah_velvet",
    name: "Sarah Jenkins",
    email: "sarah@pixora.io",
    // SHA256 / simple hash of "password123" is simulated. We will store clean passwords in our simulator
    bio: "Visual Artist & Creative Director • Tokyo | SF 🌌 Creating worlds through lens and light.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80",
    followers: ["user-elena", "user-alex"],
    following: ["user-alex", "user-maya"],
    savedPosts: []
  },
  {
    id: "user-alex",
    username: "alex_neon",
    name: "Alex Rivera",
    email: "alex@pixora.io",
    bio: "Cyberpunk Cinematographer 📸 Capturing the electricity of nocturnal metropolitan lives.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80",
    followers: ["user-sarah", "user-maya"],
    following: ["user-sarah", "user-elena"],
    savedPosts: []
  },
  {
    id: "user-elena",
    username: "elena_mindset",
    name: "Elena Rostova",
    email: "elena@pixora.io",
    bio: "Minimalist architect • UI Designer 📐 Living inside grid structures and glass gradients.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80",
    followers: ["user-alex"],
    following: ["user-sarah"],
    savedPosts: []
  },
  {
    id: "user-maya",
    username: "maya_sound",
    name: "Maya Chen",
    email: "maya@pixora.io",
    bio: "Modular Synthesizer Enthusiast 🎹 Making raw frequencies sound like celestial stories.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&q=80",
    followers: ["user-sarah"],
    following: ["user-alex", "user-elena"],
    savedPosts: []
  }
];

const SEED_STORIES = (): Story[] => {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return [
    {
      id: "story-1",
      userId: "user-sarah",
      username: "sarah_velvet",
      userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80",
      imageUrl: "https://images.unsplash.com/photo-1545235621-3fa438908226?w=600&q=80",
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString()
    },
    {
      id: "story-2",
      userId: "user-alex",
      username: "alex_neon",
      userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString()
    },
    {
      id: "story-3",
      userId: "user-elena",
      username: "elena_mindset",
      userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80",
      imageUrl: "https://images.unsplash.com/photo-1539628399213-d6aa89c93074?w=600&q=80",
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString()
    },
    {
      id: "story-4",
      userId: "user-maya",
      username: "maya_sound",
      userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&q=80",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString()
    }
  ];
};

const SEED_POSTS: Post[] = [
  {
    id: "post-1",
    userId: "user-alex",
    username: "alex_neon",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80",
    caption: "Midnight rain over Shinjuku. There is a peaceful rhythm underneath the absolute chaos of neon lights. 🌧️⚡️ #shinjuku #tokyonight #cyberpunk",
    likes: ["user-sarah", "user-elena"],
    location: "Shinjuku, Tokyo",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: "comm-1",
        postId: "post-1",
        userId: "user-sarah",
        username: "sarah_velvet",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80",
        text: "The reflection on that asphalt is magnificent, Alex! The color balance is amazing.",
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "comm-2",
        postId: "post-1",
        userId: "user-elena",
        username: "elena_mindset",
        userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80",
        text: "Incredible depth of field. This looks like a frame from a cyberpunk film preset.",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "post-2",
    userId: "user-sarah",
    username: "sarah_velvet",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    caption: "Reconstructed my visual studio. Infusing modular synths, analog retro gears, and vintage processors. Cozy tech vibes are official! 🎚️💿🔊",
    likes: ["user-alex", "user-maya", "user-elena"],
    location: "Studio Velvet, SF",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    comments: [
      {
        id: "comm-3",
        postId: "post-2",
        userId: "user-maya",
        username: "maya_sound",
        userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&q=80",
        text: "Oh wow, that analog patchbay is beautiful! We need to jam together asap.",
        createdAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "post-3",
    userId: "user-elena",
    username: "elena_mindset",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80",
    caption: "Finding symmetry in the most mundane structures. Today's coffee setup is incredibly geometrical. 📐☕️🤖 #details #minimalism #architecture",
    likes: ["user-sarah"],
    location: "The Glass House Cafe",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    comments: []
  },
  {
    id: "post-4",
    userId: "user-maya",
    username: "maya_sound",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&q=80",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
    caption: "Late night coding session. Compiling audio synthesize routines directly into browser WebAssembly. Soundscape is coming... 🎧🚀📟",
    likes: ["user-alex", "user-sarah"],
    location: "Synthesizer Basement",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    comments: []
  }
];

const SEED_REELS: Reel[] = [
  {
    id: "reel-1",
    userId: "user-alex",
    username: "alex_neon",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80",
    videoUrl: "https://images.unsplash.com/photo-1545235621-3fa438908226?w=600&q=80",
    caption: "Cruising down Tokyo highways at 3:00 AM. Ambient lofi beats looping. 🌃🚙💨 #nightdrive #tokyolofi #aesthetic",
    likes: ["user-sarah", "user-maya"],
    commentsCount: 24,
    audioTrack: "Lofi Chills • Alex Rivera Original Audio",
    views: 12400,
    shares: 489
  },
  {
    id: "reel-2",
    userId: "user-maya",
    username: "maya_sound",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&q=80",
    videoUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    caption: "Raw Eurorack patches starting to generate beautiful melodic cascades! Sound up! 🎹🎚️🔊✨ #modular #synth #eurorack #ambient",
    likes: ["user-sarah", "user-alex", "user-elena"],
    commentsCount: 89,
    audioTrack: "Celestial Echoes • maya_sound Studio Solo",
    views: 31200,
    shares: 1102
  },
  {
    id: "reel-3",
    userId: "user-sarah",
    username: "sarah_velvet",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80",
    videoUrl: "https://images.unsplash.com/photo-1539628399213-d6aa89c93074?w=600&q=80",
    caption: "A quick workflow of my latest generative glass prism design. Playing with light diffraction is therapeutic! 💎🎨📐 #digitalart #blender3d #process",
    likes: ["user-elena"],
    commentsCount: 15,
    audioTrack: "Wavelengths • Luminous Tracks",
    views: 8900,
    shares: 145
  }
];

class StorageEngine {
  private data: DBData;

  constructor() {
    this.data = {
      users: [...SEED_USERS],
      posts: [...SEED_POSTS],
      reels: [...SEED_REELS],
      stories: SEED_STORIES(),
      messages: [],
      notifications: []
    };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, "utf-8");
        const parsed = JSON.parse(fileContent);
        this.data = {
          users: parsed.users || [...SEED_USERS],
          posts: parsed.posts || [...SEED_POSTS],
          reels: parsed.reels || [...SEED_REELS],
          stories: parsed.stories && parsed.stories.length ? parsed.stories : SEED_STORIES(),
          messages: parsed.messages || [],
          notifications: parsed.notifications || []
        };
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load local DB, using default structure:", e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save local DB:", e);
    }
  }

  // --- Users Operations ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): User {
    // Generate secure simple ID
    const newUser = { ...user, id: user.id || `user-${Date.now()}` };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const userIndex = this.data.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    
    this.data.users[userIndex] = { ...this.data.users[userIndex], ...updates };
    this.save();
    return this.data.users[userIndex];
  }

  toggleFollow(userId: string, targetId: string): { following: boolean; user: User; target: User } {
    const user = this.getUserById(userId);
    const target = this.getUserById(targetId);
    if (!user || !target) throw new Error("User not found");

    const isFollowing = user.following.includes(targetId);
    if (isFollowing) {
      user.following = user.following.filter(id => id !== targetId);
      target.followers = target.followers.filter(id => id !== userId);
    } else {
      user.following.push(targetId);
      target.followers.push(userId);
    }

    this.save();
    return { following: !isFollowing, user, target };
  }

  // --- Posts Operations ---
  getPosts(): Post[] {
    return this.data.posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPostById(id: string): Post | undefined {
    return this.data.posts.find(p => p.id === id);
  }

  createPost(post: Post): Post {
    const newPost = { ...post, id: `post-${Date.now()}` };
    this.data.posts.unshift(newPost);
    this.save();
    return newPost;
  }

  toggleLikePost(postId: string, userId: string): { liked: boolean; post: Post } {
    const post = this.getPostById(postId);
    if (!post) throw new Error("Post not found");

    const idx = post.likes.indexOf(userId);
    let liked = false;
    if (idx !== -1) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(userId);
      liked = true;
    }
    this.save();
    return { liked, post };
  }

  toggleSavePost(postId: string, userId: string): { saved: boolean; user: User } {
    const user = this.getUserById(userId);
    if (!user) throw new Error("User not found");

    if (!user.savedPosts) {
      user.savedPosts = [];
    }

    const idx = user.savedPosts.indexOf(postId);
    let saved = false;
    if (idx !== -1) {
      user.savedPosts.splice(idx, 1);
    } else {
      user.savedPosts.push(postId);
      saved = true;
    }
    this.save();
    return { saved, user };
  }

  addComment(postId: string, comment: Comment): Post | undefined {
    const post = this.getPostById(postId);
    if (!post) return undefined;

    post.comments.push({
      ...comment,
      id: `comm-${Date.now()}`
    });
    this.save();
    return post;
  }

  // --- Reels Operations ---
  getReels(): Reel[] {
    return this.data.reels;
  }

  createReel(reel: Reel): Reel {
    const newReel = { ...reel, id: `reel-${Date.now()}` };
    this.data.reels.unshift(newReel);
    this.save();
    return newReel;
  }

  toggleLikeReel(reelId: string, userId: string): { liked: boolean; reel: Reel } {
    const reel = this.data.reels.find(r => r.id === reelId);
    if (!reel) throw new Error("Reel not found");

    const idx = reel.likes.indexOf(userId);
    let liked = false;
    if (idx !== -1) {
      reel.likes.splice(idx, 1);
    } else {
      reel.likes.push(userId);
      liked = true;
    }
    this.save();
    return { liked, reel };
  }

  // --- Stories Operations ---
  getStories(): Story[] {
    const now = new Date().getTime();
    // Filter active stories
    return this.data.stories.filter(s => new Date(s.expiresAt).getTime() > now);
  }

  createStory(story: Story): Story {
    const newStory = { ...story, id: `story-${Date.now()}` };
    this.data.stories.push(newStory);
    this.save();
    return newStory;
  }

  // --- Messages Operations ---
  getMessagesWithUser(userId1: string, userId2: string): Message[] {
    return this.data.messages
      .filter(
        m =>
          (m.senderId === userId1 && m.receiverId === userId2) ||
          (m.senderId === userId2 && m.receiverId === userId1)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  createMessage(msg: Message): Message {
    const newMessage = { ...msg, id: `msg-${Date.now()}` };
    this.data.messages.push(newMessage);
    this.save();
    return newMessage;
  }

  markMessagesAsRead(receiverId: string, senderId: string) {
    let updated = false;
    this.data.messages.forEach(m => {
      if (m.senderId === senderId && m.receiverId === receiverId && !m.isRead) {
        m.isRead = true;
        updated = true;
      }
    });
    if (updated) this.save();
  }

  getRecentConversations(userId: string): Array<{
    user: User;
    lastMessage?: Message;
    unreadCount: number;
  }> {
    const conversationsMap = new Map<string, { lastMessage?: Message; unreadCount: number }>();

    // Scan all messages
    this.data.messages.forEach(m => {
      const otherId = m.senderId === userId ? m.receiverId : m.senderId;
      if (!otherId || otherId === userId) return;

      const current = conversationsMap.get(otherId) || { lastMessage: undefined, unreadCount: 0 };
      
      const isNewer = !current.lastMessage || new Date(m.createdAt).getTime() > new Date(current.lastMessage.createdAt).getTime();
      const isUnread = m.senderId !== userId && !m.isRead;

      conversationsMap.set(otherId, {
        lastMessage: isNewer ? m : current.lastMessage,
        unreadCount: current.unreadCount + (isUnread ? 1 : 0)
      });
    });

    // Translate keys to Users details
    const conversations: Array<{
      user: User;
      lastMessage?: Message;
      unreadCount: number;
    }> = [];

    conversationsMap.forEach((val, otherId) => {
      const otherUser = this.getUserById(otherId);
      if (otherUser) {
        conversations.push({
          user: otherUser,
          lastMessage: val.lastMessage,
          unreadCount: val.unreadCount
        });
      }
    });

    // For any user who hasn't messaged yet, but is listed in users, we can prepend a few as start suggestions if conversions are low
    if (conversations.length < 4) {
      this.data.users.forEach(u => {
        if (u.id !== userId && !conversationsMap.has(u.id)) {
          conversations.push({
            user: u,
            unreadCount: 0
          });
        }
      });
    }

    return conversations;
  }

  // --- Notifications Operations ---
  getNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createNotification(notif: Notification): Notification {
    const newNotif = { ...notif, id: `notif-${Date.now()}` };
    this.data.notifications.push(newNotif);
    this.save();
    return newNotif;
  }

  markNotificationsAsRead(userId: string) {
    let changed = false;
    this.data.notifications.forEach(n => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        changed = true;
      }
    });
    if (changed) this.save();
  }
}

export const db = new StorageEngine();
export default db;
