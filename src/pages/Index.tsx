import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Star, Users, Plane, MessageCircle, ArrowRight,
  TrendingUp, Globe, Calendar, Sparkles
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";

interface UpcomingTrip {
  id: string;
  origin_city: string;
  dest_city: string;
  travel_date: string;
  role: "traveller" | "helper";
}

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const navigate = useNavigate();

  const [tripCount, setTripCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!profileLoading && profile && !profile.onboarded) navigate("/onboarding", { replace: true });
  }, [profileLoading, profile, navigate]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  // Re-fetch when page becomes visible again (e.g. tab switch or navigate back)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && user) {
        fetchDashboardData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    // Also fetch on mount (covers navigation back from Messages)
    if (user) fetchDashboardData();
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const fetchDashboardData = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    // First fetch accepted connections to scope unread messages
    const [tripsRes, connectionsRes, pendingRes, upcomingRes] = await Promise.all([
      supabase.from("trips").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("connections").select("id", { count: "exact" })
        .eq("status", "accepted")
        .or(`requester.eq.${user.id},addressee.eq.${user.id}`),
      supabase.from("connections").select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("addressee", user.id),
      supabase.from("trips").select("id, origin_city, dest_city, travel_date, role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gte("travel_date", today)
        .order("travel_date", { ascending: true })
        .limit(3),
    ]);

    // Count unread messages only within user's connections
    const connIds = (connectionsRes.data || []).map(c => c.id);
    let unread = 0;
    if (connIds.length > 0) {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("connection_id", connIds)
        .neq("sender_id", user.id)
        .is("read_at", null);
      unread = count || 0;
    }

    setTripCount(tripsRes.count || 0);
    setConnectionCount(connectionsRes.count || 0);
    setPendingCount(pendingRes.count || 0);
    setUnreadCount(unread);
    setUpcomingTrips((upcomingRes.data as UpcomingTrip[]) || []);
    setStatsLoading(false);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full gradient-hero animate-pulse-warm" />
      </div>
    );
  }

  const statCards = [
    { icon: Plane, label: "Trips", value: tripCount, color: "text-primary", bg: "bg-primary/10", onClick: () => navigate("/trips") },
    { icon: Users, label: "Connections", value: connectionCount, color: "text-blue-500", bg: "bg-blue-500/10", onClick: () => navigate("/messages") },
    { icon: Star, label: "Karma", value: profile?.karma_score ?? 0, color: "text-karma", bg: "bg-karma/10", onClick: undefined },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="px-4 sm:px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {profile?.display_name?.[0] || "Y"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">{greeting()}</p>
              <h1 className="font-display text-lg font-bold text-foreground leading-tight">
                {profile?.display_name || profile?.full_name || "Mitran"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <div className="flex items-center gap-1 bg-karma/10 text-karma px-2.5 py-1 rounded-full text-xs font-semibold">
                <Star className="w-3.5 h-3.5" />
                {profile.karma_score}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 space-y-5 sm:space-y-6">
        {/* Notification banners */}
        {(pendingCount > 0 || unreadCount > 0) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            {pendingCount > 0 && (
              <div
                className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 cursor-pointer"
                onClick={() => navigate("/messages")}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    {pendingCount} pending connection {pendingCount === 1 ? "request" : "requests"}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-orange-400" />
              </div>
            )}
            {unreadCount > 0 && (
              <div
                className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 cursor-pointer"
                onClick={() => navigate("/messages")}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {unreadCount} unread {unreadCount === 1 ? "message" : "messages"}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-400" />
              </div>
            )}
          </motion.div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {statCards.map(({ icon: Icon, label, value, color, bg, onClick }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={onClick}
              className={onClick ? "cursor-pointer" : ""}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="font-bold text-xl sm:text-2xl text-foreground">
                    {statsLoading ? "–" : value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Hero CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="rounded-2xl gradient-hero p-6 text-primary-foreground shadow-warm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <h2 className="font-display text-xl font-bold">Find your Yatra Mitr</h2>
              </div>
              <p className="text-sm opacity-90 mb-4">Connect with travellers heading your way</p>
              <Button variant="secondary" size="sm" className="font-semibold" onClick={() => navigate("/discover")}>
                <Globe className="w-4 h-4 mr-1.5" />
                Explore matches
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Upcoming trips */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Upcoming Trips
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/trips")}>
              View all <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {statsLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 rounded-full gradient-hero animate-pulse-warm" />
            </div>
          ) : upcomingTrips.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-6 text-center">
                <Plane className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No upcoming trips planned</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/trips")}>
                  Add a trip
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingTrips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate("/trips")}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        trip.role === "traveller" ? "bg-primary/10" : "bg-green-500/10"
                      }`}>
                        <Plane className={`w-5 h-5 ${
                          trip.role === "traveller" ? "text-primary" : "text-green-500"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {trip.origin_city} → {trip.dest_city}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(trip.travel_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant={trip.role === "traveller" ? "default" : "secondary"} className="text-xs">
                        {trip.role === "traveller" ? "Travelling" : "Helping"}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate("/trips")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Add Trip</span>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate("/discover")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-foreground">Find People</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
