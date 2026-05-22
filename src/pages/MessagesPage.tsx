import React, { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon, Smile, AlertCircle, Circle, ArrowLeft, Loader2, Sparkles, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Message, User } from "../types";

interface MessagesPageProps {
  initialTargetUsername?: string;
  onUserSelected?: (username: string) => void;
}

export default function MessagesPage({ initialTargetUsername, onUserSelected }: MessagesPageProps) {
  const { 
    user, 
    token, 
    conversations, 
    activeChatMessages, 
    typingSenderId,
    fetchConversations, 
    fetchMessages, 
    sendDirectMessage, 
    emitTyping,
    triggerLocalToast 
  } = useAuth();

  const [selectedPartner, setSelectedPartner] = useState<User | null>(null);
  const [inputText, setInputText] = useState("");
  const [messageImage, setMessageImage] = useState<string | null>(null);
  
  // Emoji panel trigger
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const emojiArray = ["⚡️", "🌌", "📐", "🎹", "🎧", "🕹️", "👽", "💙", "🔥", "✨", "😂", "👍", "😍", "🙌", "💀", "👀"];

  // Handle selected inbox channels
  useEffect(() => {
    // If we transition to messages with an initial contact
    if (initialTargetUsername && conversations.length > 0) {
      const targetChan = conversations.find(
        (c) => c.user.username.toLowerCase() === initialTargetUsername.toLowerCase()
      );
      if (targetChan) {
        handleSelectPartner(targetChan.user);
      } else {
        // Try to fetch target profile directly from server
        fetchDirectProfile(initialTargetUsername);
      }
    }
  }, [initialTargetUsername, conversations]);

  // Infinite scroll transcript anchor
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatMessages, typingSenderId]);

  const fetchDirectProfile = async (targetUser: string) => {
    try {
      const res = await fetch(`/api/profile/${targetUser}`);
      if (res.ok) {
        const data = await res.json();
        handleSelectPartner(data.profile);
      }
    } catch (e) {
      console.error("Direct profile load failure:", e);
    }
  };

  const handleSelectPartner = (partner: User) => {
    setSelectedPartner(partner);
    fetchMessages(partner.id);
    setInputText("");
    setMessageImage(null);
    setShowEmojiPicker(false);
  };

  // Typings alerts debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (!selectedPartner) return;

    if (!isTypingLocal) {
      setIsTypingLocal(true);
      emitTyping(selectedPartner.id, true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      emitTyping(selectedPartner.id, false);
    }, 2000);
  };

  // Image Attachment base64 parsing
  const handleImageAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        triggerLocalToast("Only standard image formats supported.", "Uploads");
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setMessageImage(loadEvent.target.result as string);
          triggerLocalToast("Image parsed successfully to chat tray.", "Uploads");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || (!inputText.trim() && !messageImage)) return;

    // Send via socket.io client context helper
    sendDirectMessage(selectedPartner.id, inputText.trim(), messageImage || undefined);
    
    // Stop local typing indications
    if (isTypingLocal) {
      setIsTypingLocal(false);
      emitTyping(selectedPartner.id, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    setInputText("");
    setMessageImage(null);
    setShowEmojiPicker(false);
  };

  const insertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  return (
    <div className="max-w-4xl mx-auto py-2 p-1 md:p-4 select-none">
      
      <div className="glass-panel rounded-2xl h-[78vh] md:h-[84vh] overflow-hidden flex border border-white/5 shadow-2xl relative">
        
        {/* LEFT PANEL: conversations list channel */}
        <aside className={`w-full md:w-80 flex flex-col border-r border-white/5 bg-white/[0.01] transition-all duration-300 ${
          selectedPartner ? "hidden md:flex" : "flex"
        }`}>
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-pink-500" />
            <h2 className="text-sm font-display font-semibold tracking-wide text-zinc-100">Transmitter Inbox</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scroll-smooth">
            {conversations.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <AlertCircle className="h-8 w-8 text-zinc-600 mx-auto" />
                <p className="text-[10px] font-mono text-zinc-500">INBOX DESOLATE</p>
              </div>
            ) : (
              conversations.map((chan) => {
                const isSelected = selectedPartner?.id === chan.user.id;
                const hasUnread = chan.unreadCount > 0;

                return (
                  <button
                    key={chan.user.id}
                    id={`chat-channel-${chan.user.username}`}
                    onClick={() => handleSelectPartner(chan.user)}
                    className={`w-full p-3 rounded-xl flex items-center justify-between transition-all group ${
                      isSelected 
                        ? "bg-white/10 border border-white/10" 
                        : "hover:bg-white/5 hover:border-transparent border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden text-left">
                      <div className="relative">
                        <img
                          src={chan.user.avatar}
                          alt="Channel recipient avatar"
                          className="h-10 w-10 rounded-xl object-cover border border-white/5 group-hover:scale-102 transition-transform"
                        />
                        {chan.user.isOnline && (
                          <span id={`channel-presence-${chan.user.username}`} className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-green-500 filter drop-shadow-[0_0_4px_#22c55e]" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-zinc-200 group-hover:text-pink-400 transition-colors">@{chan.user.username}</p>
                        <p className="text-[10px] text-zinc-500 truncate font-mono mt-0.5">
                          {chan.lastMessage ? chan.lastMessage.text || "[Visual Asset]" : chan.user.name}
                        </p>
                      </div>
                    </div>

                    {hasUnread && (
                      <span id={`channel-unread-${chan.user.username}`} className="h-5 min-w-5 px-1.5 rounded-full bg-pink-500 text-[10px] font-mono text-white flex items-center justify-center font-bold">
                        {chan.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANEL: transcript window thread */}
        <section className={`flex-1 flex flex-col justify-between bg-black/40 transition-all ${
          selectedPartner ? "flex" : "hidden md:flex items-center justify-center text-center p-8 text-zinc-500"
        }`}>
          {selectedPartner ? (
            <>
              {/* Thread Header */}
              <header className="p-4 border-b border-white/5 bg-white/[0.015] flex items-center justify-between">
                
                {/* Back Link on Mobile View screen */}
                <button
                  id="chat-header-back"
                  onClick={() => setSelectedPartner(null)}
                  className="md:hidden p-1.5 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={selectedPartner.avatar}
                      alt="Active partner userAvatar"
                      onClick={() => onUserSelected && onUserSelected(selectedPartner.username)}
                      className="h-9 w-9 rounded-xl object-cover cursor-pointer hover:scale-102 border border-white/5"
                    />
                    {selectedPartner.isOnline && (
                      <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-zinc-950 bg-green-500" />
                    )}
                  </div>
                  <div>
                    <h3 
                      onClick={() => onUserSelected && onUserSelected(selectedPartner.username)}
                      className="text-xs font-semibold hover:text-pink-400 hover:underline cursor-pointer tracking-wide"
                    >
                      @{selectedPartner.username}
                    </h3>
                    <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                      {selectedPartner.isOnline ? "OPERATIVE SECURE LINE" : "STANDBY OFFLINE"}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => onUserSelected && onUserSelected(selectedPartner.username)}
                  className="px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white text-[9px] font-mono font-bold uppercase transition"
                >
                  Inspect Profile
                </button>
              </header>

              {/* Chat Thread messages transcript box */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeChatMessages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-2 text-xs max-w-[85%] ${
                        isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {!isOwn && (
                        <img
                          src={selectedPartner.avatar}
                          alt="Bubble userAvatar"
                          className="h-8 w-8 rounded-xl object-cover self-end mb-1 border border-white/5"
                        />
                      )}
                      
                      <div className="space-y-1">
                        <div className={`p-3 rounded-2xl border ${
                          isOwn 
                            ? "bg-gradient-to-br from-pink-500/20 to-purple-600/20 text-white rounded-br-none border-pink-500/20 shadow-md shadow-pink-500/5" 
                            : "bg-white/[0.03] text-zinc-200 rounded-bl-none border-white/5"
                        }`}>
                          
                          {/* Image attachments support */}
                          {msg.image && (
                            <div className="rounded-xl overflow-hidden mb-2 max-w-[200px] border border-white/10 bg-black">
                              <img
                                src={msg.image}
                                alt="Chat attachment"
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          )}

                          <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.text}</p>
                        </div>
                        
                        <span className={`text-[8px] font-mono text-zinc-500 block ${isOwn ? "text-right" : ""}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                    </div>
                  );
                })}

                {/* Animated Typing Alerts feedback emitter */}
                {typingSenderId === selectedPartner.id && (
                  <div className="flex gap-2 text-xs mr-auto items-center animate-pulse">
                    <img
                      src={selectedPartner.avatar}
                      alt="Typing preview userAvatar"
                      className="h-8 w-8 rounded-xl object-cover border border-white/5"
                    />
                    <div className="bg-white/[0.03] px-3 py-2.5 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                <div ref={threadEndRef} />
              </div>

              {/* Thread Input Footer and form submissions channels */}
              <div className="p-4 border-t border-white/5 bg-white/[0.01] space-y-3 relative">
                
                {/* Image upload preview tray */}
                {messageImage && (
                  <div className="absolute bottom-16 left-4 p-2 bg-zinc-900 border border-white/10 rounded-2xl flex items-center gap-2 shadow-2xl animate-slide-up z-30">
                    <img
                      src={messageImage}
                      alt="Attachment queued raw visual"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setMessageImage(null)}
                      className="h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] hover:bg-black"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Aesthetic Floating Emoji Selector */}
                {showEmojiPicker && (
                  <div className="absolute bottom-16 right-4 p-3 bg-neutral-900 border border-white/10 rounded-2xl grid grid-cols-8 gap-1.5 max-w-[240px] shadow-2xl z-30 animate-scale-up">
                    {emojiArray.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="h-7 w-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-sm active:scale-90 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessageSubmit} className="flex items-center gap-2">
                  
                  {/* File / photo picker overlay anchor */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageAttachment}
                    className="hidden"
                    id="chat-file-picker"
                  />
                  <label
                    htmlFor="chat-file-picker"
                    className="h-10 w-10 flex-shrink-0 cursor-pointer rounded-xl bg-white/5 border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </label>

                  {/* Text Input */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={handleInputChange}
                      placeholder="Transmit secure message..."
                      className="w-full px-4 pr-10 py-2.5 text-xs rounded-xl glass-input text-white"
                    />
                    <button
                      type="button"
                      id="chat-emoji-trigger"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white transition"
                    >
                      <Smile className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    id="chat-send-submit"
                    disabled={!inputText.trim() && !messageImage}
                    className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center hover:brightness-110 disabled:opacity-45 transition active:scale-95 shadow-md shadow-pink-500/10"
                  >
                    <Send className="h-4 w-4" />
                  </button>

                </form>

              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 text-zinc-600 flex items-center justify-center">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display font-medium text-zinc-200">Select active channel link</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1 font-sans">
                  Choose a verified creator card in user directories to initiate a direct encryption line instantly.
                </p>
              </div>
            </div>
          )}
        </section>

      </div>

    </div>
  );
}
