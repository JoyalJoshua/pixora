import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { User, Message, Notification } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  socket: Socket | null;
  notifications: Notification[];
  unreadNotificationCount: number;
  activeChatMessages: Message[];
  conversations: Array<{ user: User; lastMessage?: Message; unreadCount: number }>;
  typingSenderId: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  signup: (token: string, user: User) => void;
  updateLocalProfile: (updatedUser: User) => void;
  fetchNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchMessages: (otherUserId: string) => Promise<void>;
  sendDirectMessage: (receiverId: string, text: string, image?: string) => void;
  emitTyping: (receiverId: string, isTyping: boolean) => void;
  triggerLocalToast: (text: string, title?: string) => void;
  localToast: { text: string; title: string } | null;
  setLocalToast: (toast: { text: string; title: string } | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("pixora_jwt_token"));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [activeChatMessages, setActiveChatMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Array<{ user: User; lastMessage?: Message; unreadCount: number }>>([]);
  const [typingSenderId, setTypingSenderId] = useState<string | null>(null);
  
  // High-fidelity client toast notifications
  const [localToast, setLocalToast] = useState<{ text: string; title: string } | null>(null);

  const triggerLocalToast = (text: string, title: string = "Notice") => {
    setLocalToast({ text, title });
    setTimeout(() => {
      setLocalToast(prev => prev && prev.text === text ? null : prev);
    }, 4500);
  };

  // Fetch log user session on start
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Bad token
          localStorage.removeItem("pixora_jwt_token");
          setToken(null);
        }
      } catch (e) {
        console.error("Auth verify error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  // Handle Socket.io connections & bindings
  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to WebSocket server on the same host (port 3000)
    const newSocket = io(window.location.origin, {
      transports: ["websocket", "polling"],
      autoConnect: true
    });

    newSocket.on("connect", () => {
      console.log("[Socket client] Connected successfully to host");
      newSocket.emit("join_identity", user.id);
    });

    // Real-time message receiver callback
    newSocket.on("receive_private_message", (msg: Message) => {
      // If the current user is active in typing/watching this conversation, commit message
      setActiveChatMessages(prev => {
        const isDuplicate = prev.some(m => m.id === msg.id);
        if (isDuplicate) return prev;
        return [...prev, msg];
      });

      // Notify user visually if the message comes from someone else while not viewing chat
      if (msg.senderId !== user.id) {
        // Find other user in cached list or fetch
        fetchConversations();
        triggerLocalToast(msg.text ? msg.text : "Sent an image", "Message Alert");
      } else {
        fetchConversations();
      }
    });

    // Real-time typing status broadcast
    newSocket.on("typing_broadcast", (data: { senderId: string; isTyping: boolean }) => {
      setTypingSenderId(data.isTyping ? data.senderId : null);
    });

    // Real-time notification receiver callback
    newSocket.on("incoming_notification", (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadNotificationCount(c => c + 1);
      triggerLocalToast(notif.text, notif.senderUsername);
    });

    // Dynamic presence updates
    newSocket.on("presence_change", (data: { userId: string; isOnline: boolean }) => {
      setConversations(prev =>
        prev.map(c => (c.user.id === data.userId ? { ...c, user: { ...c.user, isOnline: data.isOnline } } : c))
      );
    });

    setSocket(newSocket);

    // Bootstrap data logs
    fetchNotifications();
    fetchConversations();

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  const login = (authToken: string, userData: User) => {
    localStorage.setItem("pixora_jwt_token", authToken);
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
    triggerLocalToast(`Welcome back, @${userData.username}!`, "Success");
  };

  const signup = (authToken: string, userData: User) => {
    localStorage.setItem("pixora_jwt_token", authToken);
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
    triggerLocalToast(`Welcome to Pixora, @${userData.username}!`, "Signup Success");
  };

  const logout = () => {
    localStorage.removeItem("pixora_jwt_token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  const updateLocalProfile = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        setNotifications(list);
        setUnreadNotificationCount(list.filter((n: Notification) => !n.isRead).length);
      }
    } catch (e) {
      console.error("Notifications fetch failure:", e);
    }
  };

  const markNotificationsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadNotificationCount(0);
      }
    } catch (e) {
      console.error("Notifications mark read failure:", e);
    }
  };

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        setConversations(list);
      }
    } catch (e) {
      console.error("Conversations fetch failure:", e);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/messages/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        setActiveChatMessages(list);
        // Refresh conversations to reset unreads
        fetchConversations();
      }
    } catch (e) {
      console.error("Messages fetch failure:", e);
    }
  };

  const sendDirectMessage = (receiverId: string, text: string, image?: string) => {
    if (!socket || !user) return;
    socket.emit("send_private_message", {
      senderId: user.id,
      receiverId,
      text,
      image
    });
  };

  const emitTyping = (receiverId: string, isTyping: boolean) => {
    if (!socket || !user) return;
    socket.emit("typing_alert", {
      senderId: user.id,
      receiverId,
      isTyping
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        socket,
        notifications,
        unreadNotificationCount,
        activeChatMessages,
        conversations,
        typingSenderId,
        login,
        logout,
        signup,
        updateLocalProfile,
        fetchNotifications,
        markNotificationsRead,
        fetchConversations,
        fetchMessages,
        sendDirectMessage,
        emitTyping,
        triggerLocalToast,
        localToast,
        setLocalToast
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
