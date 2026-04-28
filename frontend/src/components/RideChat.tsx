import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../apiConfig";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, User as UserIcon } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    role: string;
  };
  text: string;
  timestamp: string;
}

interface RideChatProps {
  rideId: string;
}

const RideChat = ({ rideId }: RideChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial messages
    fetch(getApiUrl(`/api/chat/${rideId}`))
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          setMessages(data.messages);
        }
      })
      .catch(err => console.error("Error fetching messages", err));

    // Initialize socket connection
    socketRef.current = io(getApiUrl(""));
    
    if (user?.id) {
      socketRef.current.emit("register", user.id);
    }
    socketRef.current.emit("join-ride", rideId);

    // Listen for incoming messages
    socketRef.current.on("chat:receive", (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [rideId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage;
    setNewMessage(""); // Optimistic clear

    try {
      const res = await fetch(getApiUrl(`/api/chat/${rideId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: user.id,
          text: messageText
        })
      });
      const data = await res.json();
      
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        socketRef.current?.emit("chat:send", { rideId, message: data.message });
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="flex flex-col h-[400px] bg-secondary/20 rounded-xl border border-border overflow-hidden">
      <div className="bg-secondary/50 p-3 border-b border-border flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-semibold">Live Ride Chat</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-70">
            <Send className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender._id === user?.id;
            return (
              <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1 opacity-70 px-1">
                  <UserIcon className="h-3 w-3" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">{isMe ? 'You' : msg.sender.name}</span>
                </div>
                <div 
                  className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-background border border-border rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-background border-t border-border flex items-center gap-2">
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-secondary/50 border-transparent focus-visible:ring-1"
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim()} className="rounded-full shadow-sm shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default RideChat;
