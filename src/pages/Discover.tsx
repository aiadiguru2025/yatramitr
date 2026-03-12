import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, MapPin, UserPlus, Loader2, Check, Clock, Globe, Plane } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  home_city: string | null;
  bio: string | null;
  languages: string[] | null;
}

interface Trip {
  user_id: string;
  role: "traveller" | "helper";
  dest_city: string;
  origin_city: string;
  travel_date: string;
}

interface HelpProfile {
  user_id: string;
  can_help_with: string[] | null;
  needs_help_with: string[] | null;
}

interface ConnectionRecord {
  requester: string;
  addressee: string;
  status: string;
}

const HELP_TAGS = [
  "airport_pickup", "local_guide", "translation", "accommodation",
  "food_recommendations", "emergency_contact", "document_help", "transport",
] as const;

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

export default function Discover() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "traveller" | "helper">("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [helpProfiles, setHelpProfiles] = useState<HelpProfile[]>([]);
  const [connections, setConnections] = useState<Record<string, { status: string; direction: "sent" | "received" }>>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  // Dialog state for optional note
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectTarget, setConnectTarget] = useState<Profile | null>(null);
  const [connectNote, setConnectNote] = useState("");

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [profilesRes, tripsRes, helpRes, connectionsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, home_city, bio, languages").neq("user_id", user.id),
      supabase.from("trips").select("user_id, role, dest_city, origin_city, travel_date").eq("is_active", true),
      supabase.from("help_profile").select("user_id, can_help_with, needs_help_with").eq("is_active", true),
      supabase.from("connections").select("addressee, requester, status").or(`requester.eq.${user.id},addressee.eq.${user.id}`)
    ]);

    setProfiles(profilesRes.data || []);
    setTrips(tripsRes.data || []);
    setHelpProfiles(helpRes.data || []);

    // Build a map: other_user_id → { status, direction }
    const connMap: Record<string, { status: string; direction: "sent" | "received" }> = {};
    for (const c of (connectionsRes.data as ConnectionRecord[] || [])) {
      const otherId = c.requester === user.id ? c.addressee : c.requester;
      const direction = c.requester === user.id ? "sent" : "received";
      connMap[otherId] = { status: c.status, direction };
    }
    setConnections(connMap);
    setLoading(false);
  };

  const openConnectDialog = (profile: Profile) => {
    setConnectTarget(profile);
    setConnectNote("");
    setConnectDialogOpen(true);
  };

  const handleConnect = async () => {
    if (!user || !connectTarget) return;
    setConnecting(connectTarget.user_id);
    setConnectDialogOpen(false);

    const { error } = await supabase.from("connections").insert({
      requester: user.id,
      addressee: connectTarget.user_id,
      message: connectNote.trim() || null,
    });

    if (error) {
      toast({ title: "Error", description: "Could not send request", variant: "destructive" });
    } else {
      toast({ title: "Request sent!", description: "They'll see your profile and note." });
      setConnections(prev => ({ ...prev, [connectTarget.user_id]: { status: "pending", direction: "sent" } }));
    }
    setConnecting(null);
    setConnectTarget(null);
  };

  const getConnectionStatus = (userId: string) => {
    const conn = connections[userId];
    if (!conn) return "none";
    return conn.status; // pending, accepted, blocked
  };

  const filtered = profiles.filter(p => {
    // Don't show blocked connections
    const conn = connections[p.user_id];
    if (conn?.status === "blocked") return false;

    const matchesSearch = !search ||
      p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.home_city?.toLowerCase().includes(search.toLowerCase());

    const userTrips = trips.filter(t => t.user_id === p.user_id);
    const matchesRole = roleFilter === "all" || userTrips.some(t => t.role === roleFilter);

    const userHelp = helpProfiles.find(h => h.user_id === p.user_id);
    const userTags = [...(userHelp?.can_help_with || []), ...(userHelp?.needs_help_with || [])];
    const matchesTags = tagFilter.length === 0 || tagFilter.some(t => userTags.includes(t));

    return matchesSearch && matchesRole && matchesTags;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Discover</h1>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "traveller", "helper"] as const).map(role => (
            <Button
              key={role}
              variant={roleFilter === role ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(role)}
            >
              {role === "all" ? "All" : role === "traveller" ? "Travellers" : "Helpers"}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {HELP_TAGS.map(tag => (
            <Badge
              key={tag}
              variant={tagFilter.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTagFilter(prev =>
                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
              )}
            >
              {HELP_TAG_LABELS[tag] || tag}
            </Badge>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(profile => {
              const status = getConnectionStatus(profile.user_id);
              const userTrip = trips.find(t => t.user_id === profile.user_id);
              const userHelp = helpProfiles.find(h => h.user_id === profile.user_id);

              return (
                <Card key={profile.user_id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback>{profile.display_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{profile.display_name || "User"}</h3>
                        {profile.home_city && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {profile.home_city}
                          </p>
                        )}
                        {userTrip && (
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Plane className="h-3 w-3 mr-1" />
                              {userTrip.role === "traveller" ? "Travelling" : "Helping"} to {userTrip.dest_city}
                            </Badge>
                          </div>
                        )}
                        {profile.languages && profile.languages.length > 0 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Globe className="h-3 w-3" /> {profile.languages.join(", ")}
                          </p>
                        )}
                        {userHelp && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(userHelp.can_help_with || []).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Can help: {HELP_TAG_LABELS[tag] || tag}
                              </Badge>
                            ))}
                            {(userHelp.needs_help_with || []).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                Needs: {HELP_TAG_LABELS[tag] || tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {status === "none" ? (
                        <Button
                          size="sm"
                          disabled={connecting === profile.user_id}
                          onClick={() => openConnectDialog(profile)}
                        >
                          {connecting === profile.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><UserPlus className="h-4 w-4 mr-1" /> Connect</>
                          )}
                        </Button>
                      ) : status === "pending" ? (
                        <Button size="sm" variant="secondary" disabled>
                          <Clock className="h-4 w-4 mr-1" /> Pending
                        </Button>
                      ) : status === "accepted" ? (
                        <Button size="sm" variant="secondary" disabled>
                          <Check className="h-4 w-4 mr-1" /> Connected
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No matches found</p>
            )}
          </div>
        )}
      </div>

      {/* Connect request dialog with optional note */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send connection request</DialogTitle>
            <DialogDescription>
              {connectTarget?.display_name || "This user"} will see your public profile — your name, route, travel dates, languages, and help tags. Add an optional note to introduce yourself.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={'e.g. "Hi, I\'m also on Emirates EK225 with my mom!"'}
            value={connectNote}
            onChange={e => setConnectNote(e.target.value)}
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">{connectNote.length}/200</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConnect}>
              <UserPlus className="h-4 w-4 mr-1" /> Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
