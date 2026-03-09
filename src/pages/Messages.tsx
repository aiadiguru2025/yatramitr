import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface Connection {
  id: string;
  requester: string;
  addressee: string;
  status: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export default function Messages() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [selectedConn, setSelectedConn] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchConnections();
  }, [user]);

  useEffect(() => {
    if (selectedConn) {
      fetchMessages(selectedConn.id);
      const channel = supabase
        .channel(`messages:${selectedConn.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `connection_id=eq.${selectedConn.id}` }, 
          payload => setMessages(prev => [...prev, payload.new as Message])
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedConn]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConnections = async () => {
    if (!user) return;
    const { data: conns } = await supabase
      .from("connections")
      .select("*")
      .eq("status", "accepted")
      .or(`requester.eq.${user.id},addressee.eq.${user.id}`);
    
    setConnections(conns || []);
    
    const userIds = (conns || []).flatMap(c => [c.requester, c.addressee]).filter(id => id !== user.id);
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds);
      const profileMap: Record<string, Profile> = {};
      (profs || []).forEach(p => profileMap[p.user_id] = p);
      setProfiles(profileMap);
    }

    // Fetch unread counts
    const counts: Record<string, number> = {};
    for (const conn of conns || []) {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("connection_id", conn.id)
        .neq("sender_id", user.id)
        .is("read_at", null);
      counts[conn.id] = count || 0;
    }
    setUnreadCounts(counts);
    setLoading(false);
  };

  const fetchMessages = async (connectionId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("connection_id", connectionId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!user || !selectedConn || !newMessage.trim()) return;
    setSending(true);
    await supabase.from("messages").insert({
      connection_id: selectedConn.id,
      sender_id: user.id,
      content: newMessage.trim()
    });
    setNewMessage("");
    setSending(false);
  };

  const getOtherUserId = (conn: Connection) => conn.requester === user?.id ? conn.addressee : conn.requester;

  if (selectedConn) {
    const otherUser = profiles[getOtherUserId(selectedConn)];
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
          <Button variant="ghost" size="icon" onClick={() => setSelectedConn(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={otherUser?.avatar_url || ""} />
            <AvatarFallback>{otherUser?.display_name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{otherUser?.display_name || "User"}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-card flex gap-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : connections.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No connections yet</p>
        ) : (
          <div className="space-y-2">
            {connections.map(conn => {
              const otherUser = profiles[getOtherUserId(conn)];
              const unread = unreadCounts[conn.id] || 0;
              return (
                <Card key={conn.id} className="cursor-pointer hover:bg-accent/50 transition" onClick={() => setSelectedConn(conn)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={otherUser?.avatar_url || ""} />
                      <AvatarFallback>{otherUser?.display_name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 font-medium text-foreground">{otherUser?.display_name || "User"}</span>
                    {unread > 0 && <Badge variant="destructive">{unread}</Badge>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
