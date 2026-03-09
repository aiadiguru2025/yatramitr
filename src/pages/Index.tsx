import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Users } from "lucide-react";

export default function Index() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!profileLoading && profile && !profile.onboarded) navigate("/onboarding", { replace: true });
  }, [profileLoading, profile, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full gradient-hero animate-pulse-warm" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">Y</span>
          </div>
          <span className="font-display font-bold text-lg">{t("app.name")}</span>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-1.5 bg-karma/10 text-karma px-2.5 py-1 rounded-full text-xs font-semibold">
              <Star className="w-3.5 h-3.5" />
              {profile.karma_score}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>{t("auth.sign_out")}</Button>
        </div>
      </header>

      {/* Hero */}
      <div className="px-6 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {t("auth.welcome_back")},{" "}
            <span className="text-primary">{profile?.display_name || profile?.full_name || "Mitran"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">{t("app.tagline")}</p>
        </motion.div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 px-6 mb-8">
        {[
          { icon: MapPin, label: "Trips", value: "0", color: "text-primary" },
          { icon: Users, label: "Connections", value: "0", color: "text-secondary" },
          { icon: Star, label: "Karma", value: String(profile?.karma_score ?? 0), color: "text-karma" },
        ].map(({ icon: Icon, label, value, color }) => (
          <motion.div key={label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-4 text-center shadow-card">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <div className="font-bold text-xl text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Placeholder CTA */}
      <div className="px-6">
        <div className="rounded-2xl gradient-hero p-6 text-primary-foreground shadow-warm">
          <h2 className="font-display text-xl font-bold mb-1">Find your Yata Mitr</h2>
          <p className="text-sm opacity-90 mb-4">Connect with travellers heading your way</p>
          <Button variant="secondary" size="sm" className="font-semibold" onClick={() => navigate("/discover")}>Explore matches</Button>
        </div>
      </div>
    </div>
  );
}
