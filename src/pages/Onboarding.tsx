import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { Check, Plane, HandHeart } from "lucide-react";
import { INTEREST_TAGS, INTEREST_TAG_LABELS } from "@/lib/matching";
import AirportSearch from "@/components/AirportSearch";

const HELP_TAGS = [
  "airport_pickup","local_guide","translation","accommodation",
  "food_recommendations","emergency_contact","document_help","transport",
] as const;

const TOTAL_STEPS = 5;

interface FormData {
  full_name: string;
  display_name: string;
  bio: string;
  gender: "male" | "female" | "non_binary" | "prefer_not_to_say" | "";
  birth_year: string;
  languages: string[];
  home_city: string;
  role: "traveller" | "helper";
  origin_city: string;
  dest_city: string;
  travel_date: string;
  return_date: string;
  // Travel preferences
  travel_pace: "slow" | "moderate" | "fast" | "";
  planning_style: "spontaneous" | "flexible" | "structured" | "";
  accommodation_pref: "budget" | "mid_range" | "luxury" | "";
  interests: string[];
  dietary: "none" | "vegetarian" | "vegan" | "halal" | "kosher" | "";
  smoking: boolean;
  date_flexible: boolean;
  // Help
  needs_help_with: string[];
  can_help_with: string[];
  // Privacy
  show_phone: boolean;
  show_email: boolean;
  show_full_name: boolean;
  discoverable: boolean;
}

export default function Onboarding() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    full_name: "", display_name: "", bio: "", gender: "", birth_year: "",
    languages: [], home_city: "", role: "traveller",
    origin_city: "", dest_city: "", travel_date: "", return_date: "",
    travel_pace: "", planning_style: "", accommodation_pref: "",
    interests: [],
    dietary: "", smoking: false, date_flexible: false,
    needs_help_with: [], can_help_with: [],
    show_phone: false, show_email: false, show_full_name: true, discoverable: true,
  });

  const set = (key: keyof FormData, val: unknown) => setForm((f) => ({ ...f, [key]: val }));
  const toggleArr = (key: "languages" | "needs_help_with" | "can_help_with" | "interests", val: string) =>
    set(key, (form[key] as string[]).includes(val) ? (form[key] as string[]).filter((v) => v !== val) : [...(form[key] as string[]), val]);

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        full_name: form.full_name || null,
        display_name: form.display_name || null,
        bio: form.bio || null,
        gender: (form.gender || null) as "male" | "female" | "non_binary" | "prefer_not_to_say" | null,
        birth_year: form.birth_year ? parseInt(form.birth_year) : null,
        languages: form.languages,
        home_city: form.home_city || null,
        onboarded: true,
      }).eq("user_id", user.id);

      if (form.origin_city && form.dest_city && form.travel_date) {
        await supabase.from("trips").insert({
          user_id: user.id,
          role: form.role,
          origin_city: form.origin_city,
          dest_city: form.dest_city,
          travel_date: form.travel_date,
        });
        // Update return_date separately if provided (column may not be in generated types yet)
        if (form.return_date) {
          const { data: tripRows } = await supabase.from("trips")
            .select("id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);
          if (tripRows?.[0]) {
            await (supabase as unknown as { from(t: string): { update(v: Record<string, unknown>): { eq(k: string, v: string): unknown } } })
              .from("trips").update({ return_date: form.return_date }).eq("id", tripRows[0].id);
          }
        }
      }

      // Save travel preferences (table may not be in generated types yet)
      const tpClient = supabase as unknown as {
        from(t: string): {
          upsert(v: Record<string, unknown>, opts: { onConflict: string }): unknown;
        };
      };
      await tpClient.from("travel_preferences").upsert({
        user_id: user.id,
        travel_pace: form.travel_pace || null,
        planning_style: form.planning_style || null,
        accommodation_pref: form.accommodation_pref || null,
        interests: form.interests,
        smoking: form.smoking,
        dietary: form.dietary || "none",
        date_flexible: form.date_flexible,
      }, { onConflict: "user_id" });

      await supabase.from("help_profile").upsert({
        user_id: user.id,
        needs_help_with: form.needs_help_with,
        can_help_with: form.can_help_with,
      }, { onConflict: "user_id" });

      await supabase.from("privacy_settings").update({
        show_phone: form.show_phone,
        show_email: form.show_email,
        show_full_name: form.show_full_name,
        discoverable: form.discoverable,
      }).eq("user_id", user.id);

      navigate("/home", { replace: true });
    } catch (err: unknown) {
      console.error("Onboarding save error:", err);
      toast.error(err instanceof Error ? err.message : t("auth.error_generic"));
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: t("onboarding.step1_title"), subtitle: t("onboarding.step1_subtitle") },
    { title: t("onboarding.step2_title"), subtitle: t("onboarding.step2_subtitle") },
    { title: "Travel Style", subtitle: "Help us find your ideal travel companion" },
    { title: t("onboarding.step3_title"), subtitle: t("onboarding.step3_subtitle") },
    { title: t("onboarding.step4_title"), subtitle: t("onboarding.step4_subtitle") },
  ];

  const pillBtn = (selected: boolean, accent: "primary" | "accent" | "secondary" = "primary") => {
    const colors = {
      primary: selected ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary",
      accent: selected ? "bg-accent text-accent-foreground border-accent" : "border-border text-foreground hover:border-accent",
      secondary: selected ? "bg-secondary text-secondary-foreground border-secondary" : "border-border text-foreground hover:border-secondary",
    };
    return `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${colors[accent]}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("onboarding.step", { current: step, total: TOTAL_STEPS })}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">{steps[step - 1].title}</h2>
              <p className="text-muted-foreground text-sm mt-1">{steps[step - 1].subtitle}</p>
            </div>

            {/* Step 1: Profile */}
            {step === 1 && (
              <div className="space-y-4">
                <div><label className="text-sm font-medium text-foreground">{t("onboarding.full_name")}</label>
                  <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="mt-1 h-11" /></div>
                <div><label className="text-sm font-medium text-foreground">{t("onboarding.display_name")}</label>
                  <Input value={form.display_name} onChange={(e) => set("display_name", e.target.value)} className="mt-1 h-11" /></div>
                <div><label className="text-sm font-medium text-foreground">{t("onboarding.bio")}</label>
                  <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder={t("onboarding.bio_placeholder")}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t("onboarding.gender")}</label>
                  <div className="flex flex-wrap gap-2">
                    {(["male", "female", "non_binary", "prefer_not_to_say"] as const).map((g) => (
                      <button key={g} onClick={() => set("gender", form.gender === g ? "" : g)}
                        className={pillBtn(form.gender === g)}>
                        {t(`common.${g}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="text-sm font-medium text-foreground">{t("onboarding.home_city")}</label>
                  <Input value={form.home_city} onChange={(e) => set("home_city", e.target.value)} className="mt-1 h-11" /></div>
                <div><label className="text-sm font-medium text-foreground mb-2 block">{t("onboarding.languages")}</label>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button key={lang.code} onClick={() => toggleArr("languages", lang.code)}
                        className={pillBtn(form.languages.includes(lang.code))}>
                        {lang.nativeLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Trip */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(["traveller", "helper"] as const).map((r) => (
                    <button key={r} onClick={() => set("role", r)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${form.role === r ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      {r === "traveller" ? <Plane className="w-6 h-6 text-primary" /> : <HandHeart className="w-6 h-6 text-secondary" />}
                      <span className="text-sm font-medium">{t(`onboarding.${r}`)}</span>
                    </button>
                  ))}
                </div>
                <div><label className="text-sm font-medium text-foreground">{t("onboarding.origin_city")}</label>
                  <AirportSearch value={form.origin_city} onChange={(v) => set("origin_city", v)} placeholder="Search origin airport..." className="mt-1" /></div>
                <div><label className="text-sm font-medium text-foreground">{t("onboarding.dest_city")}</label>
                  <AirportSearch value={form.dest_city} onChange={(v) => set("dest_city", v)} placeholder="Search destination airport..." className="mt-1" /></div>
                <div><label className="text-sm font-medium text-foreground">{t("onboarding.travel_date")}</label>
                  <Input type="date" value={form.travel_date} onChange={(e) => set("travel_date", e.target.value)} className="mt-1 h-11" /></div>
                <div><label className="text-sm font-medium text-foreground">Return Date (optional)</label>
                  <Input type="date" value={form.return_date} onChange={(e) => set("return_date", e.target.value)} className="mt-1 h-11" /></div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                  <span className="text-sm text-foreground">Flexible dates?</span>
                  <Switch checked={form.date_flexible} onCheckedChange={(v) => set("date_flexible", v)} />
                </div>
              </div>
            )}

            {/* Step 3: Travel Style & Preferences */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Travel Pace</p>
                  <div className="flex flex-wrap gap-2">
                    {(["slow", "moderate", "fast"] as const).map((v) => (
                      <button key={v} onClick={() => set("travel_pace", form.travel_pace === v ? "" : v)}
                        className={pillBtn(form.travel_pace === v)}>
                        {v === "slow" ? "Slow & Relaxed" : v === "moderate" ? "Moderate" : "Fast-Paced"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Planning Style</p>
                  <div className="flex flex-wrap gap-2">
                    {(["spontaneous", "flexible", "structured"] as const).map((v) => (
                      <button key={v} onClick={() => set("planning_style", form.planning_style === v ? "" : v)}
                        className={pillBtn(form.planning_style === v)}>
                        {v === "spontaneous" ? "Spontaneous" : v === "flexible" ? "Flexible" : "Well-Planned"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Accommodation</p>
                  <div className="flex flex-wrap gap-2">
                    {(["budget", "mid_range", "luxury"] as const).map((v) => (
                      <button key={v} onClick={() => set("accommodation_pref", form.accommodation_pref === v ? "" : v)}
                        className={pillBtn(form.accommodation_pref === v)}>
                        {v === "budget" ? "Budget" : v === "mid_range" ? "Mid-Range" : "Luxury"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_TAGS.map((tag) => (
                      <button key={tag} onClick={() => toggleArr("interests", tag)}
                        className={`flex items-center gap-1.5 ${pillBtn(form.interests.includes(tag))}`}>
                        {form.interests.includes(tag) && <Check className="w-3 h-3" />}
                        {INTEREST_TAG_LABELS[tag] || tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Dietary Preference</p>
                  <div className="flex flex-wrap gap-2">
                    {(["none", "vegetarian", "vegan", "halal", "kosher"] as const).map((v) => (
                      <button key={v} onClick={() => set("dietary", form.dietary === v ? "" : v)}
                        className={pillBtn(form.dietary === v)}>
                        {v === "none" ? "No Restrictions" : v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                  <span className="text-sm text-foreground">Smoker?</span>
                  <Switch checked={form.smoking} onCheckedChange={(v) => set("smoking", v)} />
                </div>
              </div>
            )}

            {/* Step 4: Help */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{t("onboarding.help_needs")}</p>
                  <div className="flex flex-wrap gap-2">
                    {HELP_TAGS.map((tag) => (
                      <button key={tag} onClick={() => toggleArr("needs_help_with", tag)}
                        className={`flex items-center gap-1.5 ${pillBtn(form.needs_help_with.includes(tag), "accent")}`}>
                        {form.needs_help_with.includes(tag) && <Check className="w-3 h-3" />}
                        {t(`help_tags.${tag}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{t("onboarding.help_offers")}</p>
                  <div className="flex flex-wrap gap-2">
                    {HELP_TAGS.map((tag) => (
                      <button key={tag} onClick={() => toggleArr("can_help_with", tag)}
                        className={`flex items-center gap-1.5 ${pillBtn(form.can_help_with.includes(tag), "secondary")}`}>
                        {form.can_help_with.includes(tag) && <Check className="w-3 h-3" />}
                        {t(`help_tags.${tag}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Privacy */}
            {step === 5 && (
              <div className="space-y-4">
                {([
                  { key: "show_full_name", label: t("onboarding.show_full_name") },
                  { key: "show_phone", label: t("onboarding.show_phone") },
                  { key: "show_email", label: t("onboarding.show_email") },
                  { key: "discoverable", label: t("onboarding.discoverable") },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                    <span className="text-sm text-foreground">{label}</span>
                    <Switch checked={form[key]} onCheckedChange={(v) => set(key, v)} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-border flex gap-3">
        {step > 1 && (
          <Button variant="outline" className="flex-1 h-12" onClick={() => setStep((s) => s - 1)}>
            {t("onboarding.back")}
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button className="flex-1 h-12 gradient-hero text-primary-foreground font-semibold shadow-warm" onClick={() => setStep((s) => s + 1)}>
            {t("onboarding.next")}
          </Button>
        ) : (
          <Button className="flex-1 h-12 gradient-hero text-primary-foreground font-semibold shadow-warm" onClick={handleFinish} disabled={saving}>
            {saving ? t("common.loading") : t("onboarding.finish")}
          </Button>
        )}
      </div>
    </div>
  );
}
