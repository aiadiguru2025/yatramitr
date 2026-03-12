import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, ArrowLeft, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUPPORTED_LANGUAGES, type LangCode } from "@/i18n";
import i18n from "@/i18n";
import { toast } from "sonner";

type AuthMode = "phone" | "email";
type AuthStep = "input" | "otp";

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState<AuthMode>("phone");
  const [step, setStep] = useState<AuthStep>("input");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) navigate("/home", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [countdown]);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      if (mode === "phone") {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
      }
      setStep("otp");
      setCountdown(60);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("auth.error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      let result;
      if (mode === "phone") {
        result = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
      } else {
        result = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
      }
      if (result.error) throw result.error;
      navigate("/home", { replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("auth.error_invalid_otp"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/home` },
    });
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header strip */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">Y</span>
          </div>
          <span className="font-display font-bold text-lg text-foreground">{t("app.name")}</span>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setShowLangPicker((p) => !p)}
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs">{currentLang.nativeLabel}</span>
          </Button>
          <AnimatePresence>
            {showLangPicker && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-full mt-1 w-48 sm:w-52 bg-card border border-border rounded-lg shadow-float overflow-hidden z-50"
              >
                <div className="max-h-72 overflow-y-auto py-1">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { i18n.changeLanguage(lang.code as LangCode); setShowLangPicker(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors ${i18n.language === lang.code ? "text-primary font-medium" : "text-foreground"}`}
                    >
                      <span>{lang.nativeLabel}</span>
                      <span className="text-muted-foreground text-xs">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hero */}
      <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-8 sm:pb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground leading-tight mb-2">
            {step === "input" ? t("auth.create_account") : (mode === "phone" ? t("auth.verify_otp") : t("auth.verify_otp"))}
          </h1>
          <p className="text-muted-foreground text-base">{t("app.tagline")}</p>
        </motion.div>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 sm:px-6 max-w-sm w-full mx-auto">
        <AnimatePresence mode="wait">
          {step === "input" ? (
            <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Phone / Email input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {mode === "phone" ? t("auth.phone") : t("auth.email")}
                </label>
                {mode === "phone" ? (
                  <Input
                    type="tel"
                    placeholder={t("auth.phone_placeholder")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 text-base"
                  />
                ) : (
                  <Input
                    type="email"
                    placeholder={t("auth.email_placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base"
                  />
                )}
              </div>

              <Button
                className="w-full h-12 gradient-hero text-primary-foreground font-semibold text-base shadow-warm"
                onClick={handleSendOtp}
                disabled={loading || (mode === "phone" ? phone.length < 10 : email.length < 5)}
              >
                {loading ? t("common.loading") : t("auth.send_otp")}
              </Button>

              {/* Toggle mode */}
              <button
                onClick={() => setMode(mode === "phone" ? "email" : "phone")}
                className="flex items-center gap-1.5 text-sm text-secondary font-medium mx-auto"
              >
                {mode === "phone" ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                {mode === "phone" ? t("auth.use_email") : t("auth.use_phone")}
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-xs">{t("auth.or")}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button variant="outline" className="w-full h-12 font-medium" onClick={handleGoogle}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t("auth.continue_google")}
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">{t("auth.terms")}</p>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <button onClick={() => setStep("input")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                <ArrowLeft className="w-4 h-4" /> {t("onboarding.back")}
              </button>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("auth.otp")}</label>
                <Input
                  type="number"
                  placeholder={t("auth.otp_placeholder")}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="h-12 text-base tracking-widest text-center"
                  maxLength={6}
                />
              </div>

              <Button
                className="w-full h-12 gradient-hero text-primary-foreground font-semibold text-base shadow-warm"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
              >
                {loading ? t("common.loading") : t("auth.verify_otp")}
              </Button>

              <button
                onClick={countdown === 0 ? handleSendOtp : undefined}
                disabled={countdown > 0}
                className={`w-full text-center text-sm font-medium ${countdown > 0 ? "text-muted-foreground" : "text-secondary"}`}
              >
                {countdown > 0 ? t("auth.resend_in", { seconds: countdown }) : t("auth.resend_otp")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
