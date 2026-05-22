import express, { Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "./db";
import { requireAuth, AuthenticatedRequest, hashPassword, generateToken } from "./auth";

const router = express.Router();

// Initialize server-side Gemini client securely
// Note: User-Agent set to 'aistudio-build' in httpOptions for mandatory telemetry
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// POST /api/auth/signup
router.post("/auth/signup", (req, res) => {
  const { username, name, email, password } = req.body;

  if (!username || !name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Check unique constraints
  if (db.getUserByUsername(username)) {
    return res.status(400).json({ error: "Username is already taken" });
  }
  if (db.getUserByEmail(email)) {
    return res.status(400).json({ error: "Email is already registered" });
  }

  // Create user
  const hashedPassword = hashPassword(password);
  const newUser = db.createUser({
    id: `user-${Date.now()}`,
    username: username.trim().toLowerCase(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    bio: "Hi! I am new to Pixora. Tech enthusiast.",
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`, // Beautiful default SVG bots
    followers: [],
    following: [],
    savedPosts: []
  });

  const token = generateToken(newUser.id);
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ token, user: userWithoutPassword });
});

// POST /api/auth/login
router.post("/auth/login", (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: "Username/email and password are required" });
  }

  // Find user
  let user = db.getUserByUsername(usernameOrEmail);
  if (!user) {
    user = db.getUserByEmail(usernameOrEmail);
  }

  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user.id);
  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

// POST /api/auth/forgot-password
router.post("/auth/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: "No account found with this email" });
  }

  // Simulated instructions in response
  res.json({
    message: "Recovery password instruction dispatched successfully. Check your simulated security codes.",
    code: "PX-RECOVERY-A4B92"
  });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
  const user = db.getUserById(req.userId || "");
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// ==========================================
// 2. POST FEED & COMMENT CONTROL
// ==========================================

// GET /api/posts
router.get("/posts", (req, res) => {
  res.json(db.getPosts());
});

// POST /api/posts
router.post("/posts", requireAuth, (req: AuthenticatedRequest, res) => {
  const { imageUrl, caption, location } = req.body;
  const user = db.getUserById(req.userId || "");
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!imageUrl) {
    return res.status(400).json({ error: "An image is required to post" });
  }

  const newPost = db.createPost({
    id: `post-${Date.now()}`,
    userId: user.id,
    username: user.username,
    userAvatar: user.avatar,
    imageUrl,
    caption: caption || "",
    likes: [],
    comments: [],
    location: location || "",
    createdAt: new Date().toISOString()
  });

  res.status(201).json(newPost);
});

// POST /api/posts/:postId/like
router.post("/posts/:postId/like", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { liked, post } = db.toggleLikePost(req.params.postId, req.userId || "");
    
    // Create real-time notification if liked
    if (liked && post.userId !== req.userId) {
      const sender = db.getUserById(req.userId || "");
      if (sender) {
        db.createNotification({
          id: `notif-${Date.now()}`,
          userId: post.userId,
          senderId: sender.id,
          senderUsername: sender.username,
          senderAvatar: sender.avatar,
          type: "like",
          postId: post.id,
          text: "liked your post.",
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }
    }

    res.json({ liked, post });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/posts/:postId/save
router.post("/posts/:postId/save", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { saved, user } = db.toggleSavePost(req.params.postId, req.userId || "");
    res.json({ saved, userSavedPosts: user.savedPosts });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/posts/:postId/comment
router.post("/posts/:postId/comment", requireAuth, (req: AuthenticatedRequest, res) => {
  const { text } = req.body;
  const user = db.getUserById(req.userId || "");
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!text) return res.status(400).json({ error: "Comment text is required" });

  const updatedPost = db.addComment(req.params.postId, {
    id: `comm-${Date.now()}`,
    postId: req.params.postId,
    userId: user.id,
    username: user.username,
    userAvatar: user.avatar,
    text: text.trim(),
    createdAt: new Date().toISOString()
  });

  if (!updatedPost) {
    return res.status(404).json({ error: "Post not found" });
  }

  // Create real-time notification
  if (updatedPost.userId !== user.id) {
    db.createNotification({
      id: `notif-${Date.now()}`,
      userId: updatedPost.userId,
      senderId: user.id,
      senderUsername: user.username,
      senderAvatar: user.avatar,
      type: "comment",
      postId: updatedPost.id,
      text: "commented on your post.",
      createdAt: new Date().toISOString(),
      isRead: false
    });
  }

  res.status(201).json(updatedPost);
});

// ==========================================
// 3. FULL-SCREEN REELS CONTROL
// ==========================================

// GET /api/reels
router.get("/reels", (req, res) => {
  res.json(db.getReels());
});

// POST /api/reels
router.post("/reels", requireAuth, (req: AuthenticatedRequest, res) => {
  const { imageUrl, caption, audioTrack } = req.body;
  const user = db.getUserById(req.userId || "");
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!imageUrl) {
    return res.status(400).json({ error: "Video background thumbnail image is required" });
  }

  const newReel = db.createReel({
    id: `reel-${Date.now()}`,
    userId: user.id,
    username: user.username,
    userAvatar: user.avatar,
    videoUrl: imageUrl, // simulate video visual with high-fidelity animations
    caption: caption || "",
    likes: [],
    commentsCount: 0,
    audioTrack: audioTrack || "Original Audio • " + user.username,
    views: 120,
    shares: 0
  });

  res.status(201).json(newReel);
});

// POST /api/reels/:reelId/like
router.post("/reels/:reelId/like", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { liked, reel } = db.toggleLikeReel(req.params.reelId, req.userId || "");
    res.json({ liked, reel });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 4. ACTIVE STORIES SERVICES
// ==========================================

// GET /api/stories
router.get("/stories", (req, res) => {
  res.json(db.getStories());
});

// POST /api/stories
router.post("/stories", requireAuth, (req: AuthenticatedRequest, res) => {
  const { imageUrl } = req.body;
  const user = db.getUserById(req.userId || "");
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!imageUrl) {
    return res.status(400).json({ error: "An image URL is required" });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24-hour window

  const newStory = db.createStory({
    id: `story-${Date.now()}`,
    userId: user.id,
    username: user.username,
    userAvatar: user.avatar,
    imageUrl,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  });

  res.status(201).json(newStory);
});

// ==========================================
// 5. DIRECT CHAT LOGS
// ==========================================

// GET /api/messages/conversations
router.get("/messages/conversations", requireAuth, (req: AuthenticatedRequest, res) => {
  const list = db.getRecentConversations(req.userId || "");
  res.json(list);
});

// GET /api/messages/:otherUserId
router.get("/messages/:otherUserId", requireAuth, (req: AuthenticatedRequest, res) => {
  const currentUserId = req.userId || "";
  const otherUserId = req.params.otherUserId;

  const messages = db.getMessagesWithUser(currentUserId, otherUserId);
  db.markMessagesAsRead(currentUserId, otherUserId);

  res.json(messages);
});

// POST /api/messages
router.post("/messages", requireAuth, (req: AuthenticatedRequest, res) => {
  const { receiverId, text, image } = req.body;
  const senderId = req.userId || "";

  if (!receiverId || (!text && !image)) {
    return res.status(400).json({ error: "Receiver ID and text/image content are required" });
  }

  const message = db.createMessage({
    id: `msg-${Date.now()}`,
    senderId,
    receiverId,
    text: text || "",
    image,
    createdAt: new Date().toISOString(),
    isRead: false
  });

  res.status(201).json(message);
});

// ==========================================
// 6. GENERAL NOTIFICATIONS LOGS
// ==========================================

// GET /api/notifications
router.get("/notifications", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json(db.getNotifications(req.userId || ""));
});

// POST /api/notifications/read
router.post("/notifications/read", requireAuth, (req: AuthenticatedRequest, res) => {
  db.markNotificationsAsRead(req.userId || "");
  res.json({ success: true });
});

// ==========================================
// 7. USER PROFILE INFO REST
// ==========================================

// GET /api/profile/:username
router.get("/profile/:username", (req, res) => {
  const user = db.getUserByUsername(req.params.username);
  if (!user) {
    return res.status(404).json({ error: "Profile not found" });
  }

  // Get user's posts
  const posts = db.getPosts().filter(p => p.userId === user.id);

  const { password: _, ...profile } = user;
  res.json({ profile, posts });
});

// PUT /api/profile
router.put("/profile", requireAuth, (req: AuthenticatedRequest, res) => {
  const { name, bio, avatar } = req.body;
  const updatedUser = db.updateUser(req.userId || "", {
    ...(name && { name }),
    ...(bio !== undefined && { bio }),
    ...(avatar && { avatar })
  });

  if (!updatedUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Reflect avatar/username changes on their existing posts/comments
  db.getPosts().forEach(p => {
    if (p.userId === updatedUser.id) {
      if (avatar) p.userAvatar = updatedUser.avatar;
    }
    p.comments.forEach(c => {
      if (c.userId === updatedUser.id) {
        if (avatar) c.userAvatar = updatedUser.avatar;
      }
    });
  });

  const { password: _, ...profile } = updatedUser;
  res.json(profile);
});

// POST /api/profile/:userId/follow
router.post("/profile/:userId/follow", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { following, user, target } = db.toggleFollow(req.userId || "", req.params.userId);

    // Create real-time link notification
    if (following) {
      db.createNotification({
        id: `notif-${Date.now()}`,
        userId: target.id,
        senderId: user.id,
        senderUsername: user.username,
        senderAvatar: user.avatar,
        type: "follow",
        text: "started following you.",
        createdAt: new Date().toISOString(),
        isRead: false
      });
    }

    res.json({ following });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 8. SERVER-SIDE GEMINI AI INTEGRATION
// ==========================================

// POST /api/ai/caption
router.post("/ai/caption", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { keywords } = req.body;
  if (!keywords) {
    return res.status(400).json({ error: "Keywords are required to generate AI captions." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant fallback if GEMINI_API_KEY is not defined yet in secrets
    const fallbackCaptions = [
      `Chasing limits and finding horizons beneath the light. ✨ #${keywords.replace(/\s+/g, "").toLowerCase()}`,
      `Caught in a beautiful moment of focus. 🌌 #${keywords.replace(/\s+/g, "").toLowerCase()} #vibes`,
      `${keywords} in full display. Clean grids and high contrast.`
    ];
    return res.json({ caption: fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)] });
  }

  try {
    const prompt = `Write a premium, short, engaging social media photo caption inspired by Instagram and Pinterest based on these keywords: "${keywords}". Include 2-3 highly relevant, trending hashtags and aesthetic emojis. Keep the caption elegant, cool, and visual, avoiding corporate buzzwords.`;
    
    // Call Google's Gemini SDK utilizing the 3.5 Flash Model as recommended
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Pixora AI, the aesthetic caption generator for a elite modern media platform. Your copy is concise, poetic, ultra-cool, and formatted with emojis."
      }
    });

    const captionText = response.text?.trim() || `Atmosphere coordinates. ✨ #${keywords.replace(/\s+/g, "").toLowerCase()}`;
    res.json({ caption: captionText });
  } catch (error: any) {
    console.error("Gemini AI integration failure:", error);
    res.status(500).json({ error: "Failed to query aesthetic AI engine: " + error.message });
  }
});

export default router;
export { router as apiRouter };
