import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, UserCheck, UserX, Mail, Phone, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

interface Connection {
  id: string;
  requester: string;
  addressee: string;
  status: string;
  message: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  home_city: string | null;
  bio: string | null;
  languages: string[] | null;
  email: string | null;
  phone: string | null;
}

interface PrivacySettings {
  user_id: string;
  show_email: boolean;
  show_phone: boolean;
  contact_pref: string;
}

interface Trip {
  user_id: string;
  role: string;
  dest_city: string;
  origin_city: string;
  travel_date: string;
}

interface HelpProfile {
  user_id: string;
  can_help_with: string[] | null;
  needs_help_with: string[] | null;
}

interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

const HELP_TAG_LABELS: Record<string, string> = {
  airport_pickup: "Airport Pickup",
  local_guide: "Local Guide",
  translation: "Translation",
  accommodation: "Accommodation",
  food_recommendations: "Food Recommendations",
  emergency_contact: "Emergency Contact",
  document_help: "Document Help",
  transport: "Transport",
};

type Tab = "messages" | "requests";

export default function Messages() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("messages");

  // Accepted connections (for messaging)
  const [connections, setConnections] = useState<Connection[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [privacySettings, setPrivacySettings] = useState<Record<string, PrivacySettings>>({});
  const [selectedConn, setSelectedConn] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pending incoming requests
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<Record<string, Profile>>({});
  const [pendingTrips, setPendingTrips] = useState<Record<string, Trip>>({});
  const [pendingHelp, setPendingHelp] = useState<Record<string, HelpProfile>>({});
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchPendingRequests();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConn) {
      fetchMessages(selectedConn.id);
      markMessagesAsRead(selectedConn.id);
      const channel = supabase
        .channel(`messages:${selectedConn.id}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "messages",
          filter: `connection_id=eq.${selectedConn.id}`
        }, payload => {
          const msg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Auto-mark as read if we're viewing the conversation
          if (msg.sender_id !== user?.id) {
            markMessagesAsRead(selectedConn.id);
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedConn]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Fetch accepted connections ──
  const fetchConnections = async () => {
    if (!user) return;
    const { data: conns } = await supabase
      .from("connections")
      .select("*")
      .eq("status", "accepted")
      .or(`requester.eq.${user.id},addressee.eq.${user.id}`);

    setConnections(conns || []);

    const userIds = (conns || []).flatMap(c => [c.requester, c.addressee]).filter(id => id !== user.id);
    const uniqueIds = [...new Set(userIds)];

    if (uniqueIds.length) {
      const [profsRes, privRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url, home_city, bio, languages, email, phone").in("user_id", uniqueIds),
        supabase.from("privacy_settings").select("user_id, show_email, show_phone, contact_pref").in("user_id", uniqueIds),
      ]);

      const profileMap: Record<string, Profile> = {};
      (profsRes.data || []).forEach(p => profileMap[p.user_id] = p);
      setProfiles(profileMap);

      const privMap: Record<string, PrivacySettings> = {};
      (privRes.data || []).forEach(p => privMap[p.user_id] = p);
      setPrivacySettings(privMap);
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

  // ── Fetch pending incoming requests ──
  const fetchPendingRequests = async () => {
    if (!user) return;
    const { data: pending } = await supabase
      .from("connections")
      .select("*")
      .eq("status", "pending")
      .eq("addressee", user.id)
      .order("created_at", { ascending: false });

    setPendingRequests(pending || []);

    const requesterIds = (pending || []).map(c => c.requester);
    if (requesterIds.length) {
      const [profsRes, tripsRes, helpRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url, home_city, bio, languages, email, phone").in("user_id", requesterIds),
        supabase.from("trips").select("user_id, role, dest_city, origin_city, travel_date").eq("is_active", true).in("user_id", requesterIds),
        supabase.from("help_profile").select("user_id, can_help_with, needs_help_with").eq("is_active", true).in("user_id", requesterIds),
      ]);

      const pMap: Record<string, Profile> = {};
      (profsRes.data || []).forEach(p => pMap[p.user_id] = p);
      setPendingProfiles(pMap);

      const tMap: Record<string, Trip> = {};
      (tripsRes.data || []).forEach(t => tMap[t.user_id] = t);
      setPendingTrips(tMap);

      const hMap: Record<string, HelpProfile> = {};
      (helpRes.data || []).forEach(h => hMap[h.user_id] = h);
      setPendingHelp(hMap);
    }
  };

  // ── Mark messages as read ──
  const markMessagesAsRead = async (connectionId: string) => {
    if (!user) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("connection_id", connectionId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    setUnreadCounts(prev => ({ ...prev, [connectionId]: 0 }));
  };

  // ── Accept / Decline connection ──
  const handleAccept = async (connectionId: string) => {
    if (!user) return;
    setRespondingTo(connectionId);
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connectionId);

    if (error) {
      toast({ title: "Error", description: "Could not accept request", variant: "destructive" });
    } else {
      toast({ title: "Connected!", description: "You can now message each other." });
      setPendingRequests(prev => prev.filter(r => r.id !== connectionId));
      fetchConnections(); // Refresh accepted connections
    }
    setRespondingTo(null);
  };

  const handleDecline = async (connectionId: string) => {
    if (!user) return;
    setRespondingTo(connectionId);
    const { error } = await supabase
      .from("connections")
      .update({ status: "blocked" })
      .eq("id", connectionId);

    if (error) {
      toast({ title: "Error", description: "Could not decline request", variant: "destructive" });
    } else {
      toast({ title: "Request declined" });
      setPendingRequests(prev => prev.filter(r => r.id !== connectionId));
    }
    setRespondingTo(null);
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
    const content = newMessage.trim();
    const { data, error } = await supabase.from("messages").insert({
      connection_id: selectedConn.id,
      sender_id: user.id,
      content
    }).select().single();

    if (!error && data) {
      // Add message to local state immediately so sender can see it
      setMessages(prev => {
        // Avoid duplicate if realtime already delivered it
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data as Message];
      });
    }
    setNewMessage("");
    setSending(false);
  };

  const getOtherUserId = (conn: Connection) => conn.requester === user?.id ? conn.addressee : conn.requester;

  // ── Chat view ──
  if (selectedConn) {
    const otherUserId = getOtherUserId(selectedConn);
    const otherUser = profiles[otherUserId];
    const otherPrivacy = privacySettings[otherUserId];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedConn(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUser?.avatar_url || ""} />
              <AvatarFallback>{otherUser?.display_name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <span className="font-medium text-foreground">{otherUser?.display_name || "User"}</span>
              {otherUser?.home_city && (
                <p className="text-xs text-muted-foreground">{otherUser.home_city}</p>
              )}
            </div>
          </div>
          {/* Contact info — only shown for accepted connections */}
          {otherPrivacy && (
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 ml-11 sm:ml-12">
              {otherPrivacy.show_email && otherUser?.email && (
                <a href={`mailto:${otherUser.email}`} className="text-xs text-primary flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {otherUser.email}
                </a>
              )}
              {otherPrivacy.show_phone && otherUser?.phone && (
                <a href={`tel:${otherUser.phone}`} className="text-xs text-primary flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {otherUser.phone}
                </a>
              )}
              {otherPrivacy.contact_pref === "whatsapp" && otherUser?.phone && (
                <a href={`https://wa.me/${otherUser.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Say hello! You are now connected.
            </p>
          )}
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

  // ── List view with tabs ──
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>

        {/* Tab bar */}
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={tab === "messages" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("messages")}
          >
            Conversations
            {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 px-1.5">
                {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </Button>
          <Button
            variant={tab === "requests" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("requests")}
          >
            Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 px-1.5">
                {pendingRequests.length}
              </Badge>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : tab === "messages" ? (
          /* ── Conversations tab ── */
          connections.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No connections yet. Check Requests or Discover new people!</p>
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
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{otherUser?.display_name || "User"}</span>
                        {otherUser?.home_city && (
                          <p className="text-xs text-muted-foreground">{otherUser.home_city}</p>
                        )}
                      </div>
                      {unread > 0 && <Badge variant="destructive">{unread}</Badge>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          /* ── Requests tab ── */
          pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(req => {
                const reqProfile = pendingProfiles[req.requester];
                const reqTrip = pendingTrips[req.requester];
                const reqHelp = pendingHelp[req.requester];
                const isResponding = respondingTo === req.id;

                return (
                  <Card key={req.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={reqProfile?.avatar_url || ""} />
                          <AvatarFallback>{reqProfile?.display_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{reqProfile?.display_name || "User"}</h3>
                          {reqProfile?.home_city && (
                            <p className="text-sm text-muted-foreground">{reqProfile.home_city}</p>
                          )}
                          {reqProfile?.languages && reqProfile.languages.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Speaks: {reqProfile.languages.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Trip info */}
                      {reqTrip && (
                        <Badge variant="secondary">
                          {reqTrip.role === "traveller" ? "Travelling" : "Helping"}: {reqTrip.origin_city} → {reqTrip.dest_city} on {new Date(reqTrip.travel_date).toLocaleDateString()}
                        </Badge>
                      )}

                      {/* Help tags */}
                      {reqHelp && (
                        <div className="flex flex-wrap gap-1">
                          {(reqHelp.needs_help_with || []).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              Needs: {HELP_TAG_LABELS[tag] || tag}
                            </Badge>
                          ))}
                          {(reqHelp.can_help_with || []).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Can help: {HELP_TAG_LABELS[tag] || tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Optional note from requester */}
                      {req.message && (
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-sm text-foreground italic">"{req.message}"</p>
                        </div>
                      )}

                      {/* Accept / Decline buttons */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          className="flex-1"
                          size="sm"
                          disabled={isResponding}
                          onClick={() => handleAccept(req.id)}
                        >
                          {isResponding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserCheck className="h-4 w-4 mr-1" /> Accept</>}
                        </Button>
                        <Button
                          className="flex-1"
                          size="sm"
                          variant="outline"
                          disabled={isResponding}
                          onClick={() => handleDecline(req.id)}
                        >
                          <UserX className="h-4 w-4 mr-1" /> Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        )}
      </div>
      <BottomNav />
    </div>
  );
}
