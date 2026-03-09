import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MapPin, UserPlus, Loader2 } from "lucide-react";
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
  travel_date: string;
}

interface HelpProfile {
  user_id: string;
  can_help_with: string[] | null;
  needs_help_with: string[] | null;
}

const HELP_TAGS = [
  "Airport Pickup", "Local Guide", "Accommodation", "Translation",
  "Medical", "Business", "Education", "Shopping", "Temple Visit"
];

export default function Discover() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "traveller" | "helper">("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [helpProfiles, setHelpProfiles] = useState<HelpProfile[]>([]);
  const [connections, setConnections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    const [profilesRes, tripsRes, helpRes, connectionsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, home_city, bio, languages").neq("user_id", user.id),
      supabase.from("trips").select("user_id, role, dest_city, travel_date").eq("is_active", true),
      supabase.from("help_profile").select("user_id, can_help_with, needs_help_with").eq("is_active", true),
      supabase.from("connections").select("addressee, requester").or(`requester.eq.${user.id},addressee.eq.${user.id}`)
    ]);

    setProfiles(profilesRes.data || []);
    setTrips(tripsRes.data || []);
    setHelpProfiles(helpRes.data || []);
    
    const connectedIds = (connectionsRes.data || []).map(c =>
      c.requester === user.id ? c.addressee : c.requester
    );
    setConnections(connectedIds);
    setLoading(false);
  };

  const handleConnect = async (addresseeId: string) => {
    if (!user) return;
    setConnecting(addresseeId);
    
    const { error } = await supabase.from("connections").insert({
      requester: user.id,
      addressee: addresseeId
    });

    if (error) {
      toast({ title: "Error", description: "Could not send request", variant: "destructive" });
    } else {
      toast({ title: "Request sent!" });
      setConnections(prev => [...prev, addresseeId]);
    }
    setConnecting(null);
  };

  const filtered = profiles.filter(p => {
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
              {tag}
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
              const isConnected = connections.includes(profile.user_id);
              const userTrip = trips.find(t => t.user_id === profile.user_id);
              
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
                          <Badge variant="secondary" className="mt-1">
                            {userTrip.role === "traveller" ? "Travelling" : "Helping"} to {userTrip.dest_city}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={isConnected ? "secondary" : "default"}
                        disabled={isConnected || connecting === profile.user_id}
                        onClick={() => handleConnect(profile.user_id)}
                      >
                        {connecting === profile.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isConnected ? "Requested" : (
                          <><UserPlus className="h-4 w-4" /></>
                        )}
                      </Button>
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
      <BottomNav />
    </div>
  );
}
