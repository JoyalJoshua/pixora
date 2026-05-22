export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  bio: string;
  avatar: string;
  followers: string[]; // User IDs
  following: string[]; // User IDs
  savedPosts: string[]; // Post IDs
  isOnline?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  likes: string[]; // User IDs who liked
  comments: Comment[];
  createdAt: string;
  location?: string;
}

export interface Reel {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  videoUrl: string; // fallback mock visuals
  caption: string;
  likes: string[];
  commentsCount: number;
  audioTrack: string;
  views: number;
  shares: number;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  createdAt: string;
  expiresAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  image?: string;
  createdAt: string;
  isRead: boolean;
}

export interface Notification {
  id: string;
  userId: string; // Receipient
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  type: "like" | "comment" | "follow" | "message";
  postId?: string;
  text: string;
  createdAt: string;
  isRead: boolean;
}
