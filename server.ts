import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/api";
import { db } from "./server/db";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  
  // Attach Socket.io server (port 3000 is shared securely)
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Midlleware for parsing bodies
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Print request logs for full observability
  app.use((req, res, next) => {
    console.log(`[API Log] ${req.method} ${req.url}`);
    next();
  });

  // Mount API Endpoints FIRST
  app.use("/api", apiRouter);

  // Fallback endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "alive", systemTime: new Date().toISOString() });
  });

  // ==========================================
  // REAL-TIME WEBSOCKET (SOCKET.IO) HANDLERS
  // ==========================================
  const activeSockets = new Map<string, string>(); // Socket.id -> User.id

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Connected: ${socket.id}`);

    // User joins their personal dynamic room based on login state
    socket.on("join_identity", (userId: string) => {
      socket.join(userId);
      activeSockets.set(socket.id, userId);
      db.updateUser(userId, { isOnline: true });
      io.emit("presence_change", { userId, isOnline: true });
      console.log(`[Socket.io] User ${userId} joined room/identity ${userId}`);
    });

    // Handling message transmissions in real time
    socket.on("send_private_message", (data: {
      senderId: string;
      receiverId: string;
      text: string;
      image?: string;
    }) => {
      const { senderId, receiverId, text, image } = data;
      
      const newMsg = db.createMessage({
        id: `msg-${Date.now()}`,
        senderId,
        receiverId,
        text: text || "",
        image,
        createdAt: new Date().toISOString(),
        isRead: false
      });

      // Target real-time routing to recipient and echo back to sender
      io.to(receiverId).to(senderId).emit("receive_private_message", newMsg);

      // Create an alert notification for incoming chats
      const sender = db.getUserById(senderId);
      if (sender) {
        const notif = db.createNotification({
          id: `notif-${Date.now()}`,
          userId: receiverId,
          senderId: sender.id,
          senderUsername: sender.username,
          senderAvatar: sender.avatar,
          type: "message",
          text: "sent you a direct message.",
          createdAt: new Date().toISOString(),
          isRead: false
        });
        io.to(receiverId).emit("incoming_notification", notif);
      }
    });

    // Typing statuses
    socket.on("typing_alert", (data: { senderId: string; receiverId: string; isTyping: boolean }) => {
      io.to(data.receiverId).emit("typing_broadcast", {
        senderId: data.senderId,
        isTyping: data.isTyping
      });
    });

    // Handle user disconnects
    socket.on("disconnect", () => {
      const userId = activeSockets.get(socket.id);
      if (userId) {
        db.updateUser(userId, { isOnline: false });
        io.emit("presence_change", { userId, isOnline: false });
        activeSockets.delete(socket.id);
        console.log(`[Socket.io] User ${userId} disconnected`);
      }
    });
  });

  // ==========================================
  // VITE DEVELOPMENT BUILD SETUPS
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("[Vite] Dev middleware connected.");
  } else {
    // Serve production built assets from 'dist'
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Server] Production static server activated.");
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched successfully. Listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server bootstrap failure:", err);
});
