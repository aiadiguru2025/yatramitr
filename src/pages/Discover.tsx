import { useState, useEffect, useMemo } from "react";
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
import { Search, MapPin, UserPlus, Loader2, Check, Clock, Globe, Plane, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { formatAirportShort } from "@/data/airports";
import {
  rankMatches,
  type UserMatchProfile,
  type TravelPreferences,
  type MatchResult,
} from "@/lib/matching";

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  home_city: string | null;
  bio: string | null;
  languages: string[] | null;
  birth_year: number | null;
  gender: string | null;
}

interface Trip {
  user_id: string;
  role: "traveller" | "helper";
  dest_city: string;
  dest_country: string | null;
  origin_city: string;
  travel_date: string;
  return_date: string | null;
}

interface HelpProfile {
  user_id: string;
  can_help_with: string[] | null;
  needs_help_with: string[] | null;
}

interface TravelPref {
  user_id: string;
  travel_pace: string | null;
  planning_style: string | null;
  accommodation_pref: string | null;
  interests: string[] | null;
  must_have_interests: string[] | null;
  smoking: boolean | null;
  dietary: string | null;
  solo_experience: string | null;
  date_flexible: boolean | null;
  gender_preference: string | null;
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

function MatchScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-100 text-green-800 border-green-300" :
    score >= 60 ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
    "bg-gray-100 text-gray-600 border-gray-300";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      <Sparkles className="h-3 w-3" />
      {score}% match
    </span>
  );
}

function MatchBreakdown({ result }: { result: MatchResult }) {
  const [open, setOpen] = useState(false);
  const factors = Object.entries(result.factors)
    .filter(([, f]) => f.weight > 0)
    .sort((a, b) => b[1].weight - a[1].weight);

  const labels: Record<string, string> = {
    destination: "Destination",
    dates: "Date Overlap",
    travel_style: "Travel Style",
    interests: "Interests",
    budget: "Budget",
    demographics: "Demographics",
    preferences: "Preferences",
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? "Hide" : "Show"} breakdown
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {factors.map(([key, factor]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="w-20 text-muted-foreground truncate">{labels[key] || key}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.round(factor.score * 100)}%` }}
                />
              </div>
              <span className="w-8 text-right text-muted-foreground">{Math.round(factor.score * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Discover() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "traveller" | "helper">("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [helpProfiles, setHelpProfiles] = useState<HelpProfile[]>([]);
  const [travelPrefs, setTravelPrefs] = useState<TravelPref[]>([]);
  const [connections, setConnections] = useState<Record<string, { status: string; direction: "sent" | "received" }>>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [minThreshold, setMinThreshold] = useState(0);

  // Current user's profile data for matching
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [myHelp, setMyHelp] = useState<HelpProfile | null>(null);
  const [myPrefs, setMyPrefs] = useState<TravelPref | null>(null);

  // Dialog state for optional note
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectTarget, setConnectTarget] = useState<Profile | null>(null);
  const [connectNote, setConnectNote] = useState("");

  useEffect(() => {
    fetchData();
  }, [user]);

  // Realtime: listen for connection status changes so buttons update live
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("discover-connections-realtime")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "connections",
        filter: `requester=eq.${user.id}`
      }, (payload) => {
        const c = payload.new as ConnectionRecord & { id?: string };
        if (c.addressee) {
          setConnections(prev => ({
            ...prev,
            [c.addressee]: { status: c.status, direction: "sent" },
          }));
        }
      })
      .on("postgres_changes", {
        event: "*", schema: "public", table: "connections",
        filter: `addressee=eq.${user.id}`
      }, (payload) => {
        const c = payload.new as ConnectionRecord & { id?: string };
        if (c.requester) {
          setConnections(prev => ({
            ...prev,
            [c.requester]: { status: c.status, direction: "received" },
          }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch travel_preferences via untyped client (table may not be in generated types)
    const tpClient = supabase as unknown as {
      from(t: string): {
        select(s: string): {
          eq(k: string, v: unknown): { maybeSingle(): Promise<{ data: TravelPref | null }> };
          then(resolve: (v: { data: TravelPref[] | null }) => void): void;
        } & Promise<{ data: TravelPref[] | null }>;
      };
    };

    const [profilesRes, tripsRes, helpRes, connectionsRes, myProfileRes, myTripsRes, myHelpRes, myPrefsRes, allPrefsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, home_city, bio, languages, birth_year, gender").neq("user_id", user.id),
      supabase.from("trips").select("user_id, role, dest_city, dest_country, origin_city, travel_date, return_date").eq("is_active", true),
      supabase.from("help_profile").select("user_id, can_help_with, needs_help_with").eq("is_active", true),
      supabase.from("connections").select("addressee, requester, status").or(`requester.eq.${user.id},addressee.eq.${user.id}`),
      supabase.from("profiles").select("user_id, display_name, avatar_url, home_city, bio, languages, birth_year, gender").eq("user_id", user.id).maybeSingle(),
      supabase.from("trips").select("user_id, role, dest_city, dest_country, origin_city, travel_date, return_date").eq("user_id", user.id).eq("is_active", true),
      supabase.from("help_profile").select("user_id, can_help_with, needs_help_with").eq("user_id", user.id).maybeSingle(),
      tpClient.from("travel_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      tpClient.from("travel_preferences").select("*"),
    ]);

    setProfiles((profilesRes.data || []) as Profile[]);
    setTrips((tripsRes.data || []) as Trip[]);
    setHelpProfiles((helpRes.data || []) as HelpProfile[]);
    setTravelPrefs((allPrefsRes.data || []) as TravelPref[]);
    setMyProfile((myProfileRes.data || null) as Profile | null);
    setMyTrips((myTripsRes.data || []) as Trip[]);
    setMyHelp((myHelpRes.data || null) as HelpProfile | null);
    setMyPrefs((myPrefsRes.data || null) as TravelPref | null);

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

  // Build match profiles and compute scores
  const matchResults = useMemo(() => {
    if (!user || !myProfile) return new Map<string, MatchResult>();

    const meProfile: UserMatchProfile = {
      user_id: user.id,
      birth_year: myProfile.birth_year,
      gender: myProfile.gender,
      languages: myProfile.languages,
      home_city: myProfile.home_city,
      trips: myTrips.map(t => ({
        dest_city: t.dest_city,
        dest_country: t.dest_country || undefined,
        origin_city: t.origin_city,
        travel_date: t.travel_date,
        return_date: t.return_date,
        role: t.role,
      })),
      help: myHelp ? {
        needs_help_with: myHelp.needs_help_with || [],
        can_help_with: myHelp.can_help_with || [],
      } : null,
      prefs: myPrefs ? {
        travel_pace: myPrefs.travel_pace as TravelPreferences["travel_pace"],
        planning_style: myPrefs.planning_style as TravelPreferences["planning_style"],
        accommodation_pref: myPrefs.accommodation_pref as TravelPreferences["accommodation_pref"],
        interests: myPrefs.interests,
        must_have_interests: myPrefs.must_have_interests,
        smoking: myPrefs.smoking,
        dietary: myPrefs.dietary as TravelPreferences["dietary"],
        solo_experience: myPrefs.solo_experience as TravelPreferences["solo_experience"],
        date_flexible: myPrefs.date_flexible,
        gender_preference: myPrefs.gender_preference as TravelPreferences["gender_preference"],
      } : null,
    };

    const candidates: UserMatchProfile[] = profiles.map(p => {
      const pTrips = trips.filter(t => t.user_id === p.user_id);
      const pHelp = helpProfiles.find(h => h.user_id === p.user_id);
      const pPrefs = travelPrefs.find(tp => tp.user_id === p.user_id);

      return {
        user_id: p.user_id,
        birth_year: p.birth_year,
        gender: p.gender,
        languages: p.languages,
        home_city: p.home_city,
        trips: pTrips.map(t => ({
          dest_city: t.dest_city,
          dest_country: t.dest_country || undefined,
          origin_city: t.origin_city,
          travel_date: t.travel_date,
          return_date: t.return_date,
          role: t.role,
        })),
        help: pHelp ? {
          needs_help_with: pHelp.needs_help_with || [],
          can_help_with: pHelp.can_help_with || [],
        } : null,
        prefs: pPrefs ? {
          travel_pace: pPrefs.travel_pace as TravelPreferences["travel_pace"],
          planning_style: pPrefs.planning_style as TravelPreferences["planning_style"],
          accommodation_pref: pPrefs.accommodation_pref as TravelPreferences["accommodation_pref"],
          interests: pPrefs.interests,
          must_have_interests: pPrefs.must_have_interests,
          smoking: pPrefs.smoking,
          dietary: pPrefs.dietary as TravelPreferences["dietary"],
          solo_experience: pPrefs.solo_experience as TravelPreferences["solo_experience"],
          date_flexible: pPrefs.date_flexible,
          gender_preference: pPrefs.gender_preference as TravelPreferences["gender_preference"],
        } : null,
      };
    });

    const results = rankMatches(meProfile, candidates, { threshold: minThreshold });
    const map = new Map<string, MatchResult>();
    for (const r of results) map.set(r.user_id, r);
    return map;
  }, [user, myProfile, myTrips, myHelp, myPrefs, profiles, trips, helpProfiles, travelPrefs, minThreshold]);

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
    return conn.status;
  };

  // Filter then sort by match score
  const filtered = useMemo(() => {
    const base = profiles.filter(p => {
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

    // Sort by match score (highest first), unscored at the end
    return base.sort((a, b) => {
      const sa = matchResults.get(a.user_id)?.overall ?? -1;
      const sb = matchResults.get(b.user_id)?.overall ?? -1;
      return sb - sa;
    });
  }, [profiles, connections, search, roleFilter, tagFilter, trips, helpProfiles, matchResults]);

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

        <div className="flex gap-2 items-center">
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
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Min:</span>
            <select
              value={minThreshold}
              onChange={e => setMinThreshold(Number(e.target.value))}
              className="text-xs border rounded px-1.5 py-1 bg-background text-foreground"
            >
              <option value={0}>All</option>
              <option value={40}>40%+</option>
              <option value={60}>60%+</option>
              <option value={80}>80%+</option>
            </select>
          </div>
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
              const matchResult = matchResults.get(profile.user_id);

              return (
                <Card key={profile.user_id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback>{profile.display_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{profile.display_name || "User"}</h3>
                          {matchResult && <MatchScoreBadge score={matchResult.overall} />}
                        </div>
                        {profile.home_city && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {profile.home_city}
                          </p>
                        )}
                        {userTrip && (
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Plane className="h-3 w-3 mr-1" />
                              {userTrip.role === "traveller" ? "Travelling" : "Helping"} to {formatAirportShort(userTrip.dest_city)}
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
                        {matchResult && <MatchBreakdown result={matchResult} />}
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
