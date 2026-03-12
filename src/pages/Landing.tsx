import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ── Split-flap departure board ── */
const FLAP_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FLAP_SPEED = 50;

const ROTATING_SUBJECTS = [
  "YOUR MOM",
  "YOUR DAD",
  "YOUR NANI",
  "YOUR DADI",
  "YOUR AUNT",
  "YOUR UNCLE",
  "YOUR AJJI",
  "YOUR THATHA",
  "YOUR AMMA",
  "YOUR ABBA",
];
const MAX_SUBJECT_LEN = Math.max(...ROTATING_SUBJECTS.map(s => s.length));
const CYCLE_INTERVAL = 3000;

function FlapChar({ target, delay }: { target: string; delay: number }) {
  const [display, setDisplay] = useState(" ");
  const [flip, setFlip] = useState(false);
  const prevTarget = useRef(target);

  useEffect(() => {
    const upper = target.toUpperCase();
    const prev = prevTarget.current.toUpperCase();
    prevTarget.current = target;

    if (upper === prev) {
      setDisplay(upper);
      return;
    }

    // Calculate steps: from previous char index to target char index through the alphabet
    const fromIdx = Math.max(0, FLAP_CHARS.indexOf(prev));
    const toIdx = Math.max(0, FLAP_CHARS.indexOf(upper));
    const steps = toIdx >= fromIdx
      ? toIdx - fromIdx
      : FLAP_CHARS.length - fromIdx + toIdx;
    const totalSteps = Math.max(1, steps + Math.floor(Math.random() * 2));

    let step = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        step++;
        setFlip(true);
        setDisplay(FLAP_CHARS[(fromIdx + step) % FLAP_CHARS.length]);
        setTimeout(() => setFlip(false), FLAP_SPEED * 0.6);
        if (step >= totalSteps) {
          clearInterval(interval);
          setDisplay(upper);
        }
      }, FLAP_SPEED);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);

  return (
    <span
      style={{
        display: "inline-block",
        width: "clamp(22px, 3.5vw, 44px)",
        height: "clamp(32px, 5vw, 64px)",
        lineHeight: "clamp(32px, 5vw, 64px)",
        background: "#1A1A1C",
        color: display === " " ? "transparent" : "#F5E6A3",
        fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
        fontSize: "clamp(20px, 3.2vw, 40px)",
        fontWeight: 700,
        textAlign: "center",
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        transform: flip ? "scaleY(0.92)" : "scaleY(1)",
        transition: `transform ${FLAP_SPEED * 0.6}ms ease`,
        flexShrink: 0,
      }}
    >
      <span style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(0,0,0,0.5)", zIndex: 2 }} />
      {display}
    </span>
  );
}

function FlapRow({ text, maxLen, charDelay }: { text: string; maxLen: number; charDelay: number }) {
  const padded = text.padEnd(maxLen, " ");
  return (
    <span style={{ display: "inline-flex", gap: "clamp(2px, 0.25vw, 3px)" }}>
      {padded.split("").map((ch, i) => (
        <FlapChar key={i} target={ch} delay={i * charDelay} />
      ))}
    </span>
  );
}

function DepartureBoard() {
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Initial reveal animation
  useEffect(() => {
    const t = setTimeout(() => setInitialized(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Cycle through subjects
  useEffect(() => {
    if (!initialized) return;
    const interval = setInterval(() => {
      setSubjectIdx(prev => {
        let next: number;
        do { next = Math.floor(Math.random() * ROTATING_SUBJECTS.length); } while (next === prev);
        return next;
      });
    }, CYCLE_INTERVAL);
    return () => clearInterval(interval);
  }, [initialized]);

  const subject = initialized ? ROTATING_SUBJECTS[subjectIdx] : "";
  const suffix = "SHOULDN'T FLY ALONE.";
  const suffixMaxLen = suffix.length;

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "clamp(6px, 0.8vw, 10px)",
        padding: "clamp(20px, 3vw, 40px) clamp(16px, 2.5vw, 32px)",
        background: "linear-gradient(180deg, #0D0D0D 0%, #1A1A1C 100%)",
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle scan line effect */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        zIndex: 3,
      }} />
      {/* Row 1: rotating subject */}
      <FlapRow text={subject} maxLen={MAX_SUBJECT_LEN} charDelay={40} />
      {/* Row 2: static suffix */}
      <FlapRow text={initialized ? suffix : ""} maxLen={suffixMaxLen} charDelay={30} />
      {/* Tiny ambient dot */}
      <div style={{
        position: "absolute", bottom: 10, right: 14,
        width: 6, height: 6, borderRadius: "50%",
        background: "#C45D3E",
        boxShadow: "0 0 6px 2px rgba(196,93,62,0.4)",
        animation: "pulse-dot 2s ease-in-out infinite",
      }} />
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

/* ── Scroll-fade hook with staggered children ── */
function useFadeIn() {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          // Stagger children
          const children = el.querySelectorAll("[data-stagger]");
          children.forEach((child, i) => {
            const c = child as HTMLElement;
            c.style.transitionDelay = `${i * 100}ms`;
            c.style.opacity = "1";
            c.style.transform = "translateY(0)";
          });
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FadeSection({
  children,
  className = "",
  style,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}) {
  const ref = useFadeIn();
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={className}
      id={id}
      style={{
        opacity: 0,
        transform: "translateY(30px)",
        transition: "opacity 600ms cubic-bezier(0.25,0.1,0.25,1), transform 600ms cubic-bezier(0.25,0.1,0.25,1)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

/* ── Style constants ── */
const FONT = "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
const WHITE = "#FFFFFF";
const GRAY_BG = "#F5F5F7";
const HEADLINE = "#1D1D1F";
const BODY_COLOR = "#424245";
const CAPTION_COLOR = "#86868B";
const ACCENT = "#C45D3E";
const DIVIDER = "#E5E5E7";
const DARK_BG = "#1D1D1F";
const MAX_W = 980;

const stagger: React.CSSProperties = {
  opacity: 0,
  transform: "translateY(30px)",
  transition: "opacity 600ms cubic-bezier(0.25,0.1,0.25,1), transform 600ms cubic-bezier(0.25,0.1,0.25,1)",
};

const caption: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CAPTION_COLOR,
  marginBottom: 16,
};

const headline: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: "clamp(34px, 5vw, 56px)",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  lineHeight: 1.08,
  color: HEADLINE,
  margin: 0,
};

const body19: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 19,
  fontWeight: 400,
  lineHeight: 1.5,
  color: BODY_COLOR,
  margin: 0,
};

export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.style.opacity = "1";
      });
    }
  }, []);

  const goAuth = useCallback(() => navigate("/auth"), [navigate]);

  return (
    <div style={{ backgroundColor: WHITE, fontFamily: FONT, color: HEADLINE, scrollBehavior: "smooth" }}>
      {/* ── STICKY NAV ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(16px, 3vw, 24px)",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          maxWidth: "100%",
        }}
      >
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: HEADLINE, textDecoration: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
        >
          <img src="/favicon.png" alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
          Yata Mitr
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 3vw, 32px)" }}>
          {[
            { label: "Problem", href: "#problem" },
            { label: "How It Works", href: "#how-it-works" },
            { label: "Scenarios", href: "#scenarios" },
            { label: "Trust", href: "#trust" },
            { label: "Community", href: "#community" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 500,
                color: BODY_COLOR,
                textDecoration: "none",
                display: "none",
              }}
              className="nav-link-desktop"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={goAuth}
            style={{
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 600,
              color: ACCENT,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Get Started
          </button>
        </div>
      </nav>
      <style>{`
        html { scroll-behavior: smooth; scroll-padding-top: 56px; }
        @media (min-width: 768px) {
          .nav-link-desktop { display: inline !important; }
          .nav-link-desktop:hover { color: ${ACCENT} !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section
        ref={heroRef as React.RefObject<HTMLElement>}
        style={{
          opacity: 0,
          transition: "opacity 400ms ease",
          padding: "clamp(80px, 12vw, 120px) 24px",
          textAlign: "center",
          backgroundColor: WHITE,
        }}
      >
        <div style={{ maxWidth: MAX_W, margin: "0 auto" }}>
          <div style={{ marginBottom: 28 }}>
            <DepartureBoard />
          </div>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 21,
              lineHeight: 1.5,
              color: CAPTION_COLOR,
              maxWidth: 480,
              margin: "0 auto 32px",
            }}
          >
            Match your loved one with a travel companion on the same route. Same flight. Same language. Same peace of mind.
          </p>
          <button onClick={goAuth} style={pillBtn}>
            Find a companion
          </button>
          <p style={{ ...captionSmall, marginTop: 16 }}>
            Free forever. No ads. No data selling.
          </p>
          {/* App screenshot placeholder */}
          <div
            style={{
              maxWidth: 800,
              margin: "48px auto 0",
              aspectRatio: "16/9",
              backgroundColor: GRAY_BG,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontFamily: FONT, fontSize: 15, color: CAPTION_COLOR }}>
              [App Screenshot — Matching Dashboard]
            </span>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <FadeSection
        id="problem"
        style={{ backgroundColor: GRAY_BG, padding: "clamp(80px, 10vw, 120px) 24px" }}
      >
        <div style={{ maxWidth: MAX_W, margin: "0 auto" }}>
          <p data-stagger style={{ ...caption, ...stagger }}>THE PROBLEM</p>
          <h2 data-stagger style={{ ...headline, fontSize: "clamp(34px, 4vw, 56px)", marginBottom: 64, ...stagger }}>
            You've been here before.
          </h2>

          {/* Moment 1: Facebook post with no replies */}
          <div data-stagger style={{ ...momentRow, ...stagger }}>
            <div style={illustrationBox}>
              <img src="/problem-facebook.png" alt="Facebook post asking if anyone is on the same flight — 2 heart reacts, 0 replies" style={illustrationImg} />
            </div>
            <p style={{ ...body19, maxWidth: 380 }}>
              You posted in a Facebook group: "Anyone on Emirates EK225? My mom is flying alone." Two heart reacts. Zero&nbsp;replies.
            </p>
          </div>

          {/* Moment 2: Airline counter rejection */}
          <div data-stagger style={{ ...momentRow, flexDirection: "row-reverse" as const, ...stagger }}>
            <div style={illustrationBox}>
              <img src="/problem-counter.png" alt="Airport information counter with sign: Escort service is for minors only" style={illustrationImg} />
            </div>
            <p style={{ ...body19, maxWidth: 380 }}>
              You called the airline about an escort service. It's for unaccompanied minors&nbsp;only.
            </p>
          </div>

          {/* Moment 3: Crying phone call after landing */}
          <div data-stagger style={{ ...momentRow, ...stagger }}>
            <div style={illustrationBox}>
              <img src="/problem-crying.png" alt="Elderly woman crying alone at airport gate while on a phone call" style={illustrationImg} />
            </div>
            <p style={{ ...body19, maxWidth: 380 }}>
              She landed 23 hours later and called you crying — not because anything went wrong, but because she was alone the entire&nbsp;time.
            </p>
          </div>
        </div>
      </FadeSection>

      {/* ── SOLUTION ── */}
      <FadeSection
        id="how-it-works"
        style={{ backgroundColor: WHITE, padding: "clamp(80px, 10vw, 120px) 24px" }}
      >
        <div style={{ maxWidth: MAX_W, margin: "0 auto" }}>
          <p data-stagger style={{ ...caption, ...stagger }}>HOW YATA MITR WORKS</p>
          <h2 data-stagger style={{ ...headline, fontSize: "clamp(34px, 4vw, 56px)", marginBottom: 64, ...stagger }}>
            Matched with care. Connected with&nbsp;trust.
          </h2>

          <div data-stagger style={{ ...solutionGrid, ...stagger }}>
            {[
              {
                label: "Route",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BODY_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.6 3.4-3.5 3.5-2.1-.6c-.4-.1-.8 0-1 .3l-.2.3c-.2.3-.1.7.2.9L6 18l2.3 3.3c.2.3.6.4.9.2l.3-.2c.3-.2.4-.6.3-1l-.6-2.1 3.5-3.5 3.4 5.6c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1Z"/>
                  </svg>
                ),
                title: "Same flight. Same layover.",
                desc: "Matched by city, destination, date, and flight number.",
              },
              {
                label: "Lang",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BODY_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                    <path d="M2 12h20"/>
                  </svg>
                ),
                title: "Same language. Real conversation.",
                desc: "13 South Asian languages. Someone she can actually talk to.",
              },
              {
                label: "Help",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BODY_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/>
                    <path d="m18 15-2-2"/>
                    <path d="m15 18-2-2"/>
                  </svg>
                ),
                title: "They need it. They offer it.",
                desc: "She needs help with forms. He's flown this route 12 times.",
              },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "0 clamp(16px, 3vw, 32px)",
                  borderLeft: i > 0 ? `1px solid ${DIVIDER}` : "none",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: GRAY_BG,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  {item.icon}
                </div>
                <h3 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: HEADLINE, marginBottom: 8, lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ fontFamily: FONT, fontSize: 16, color: CAPTION_COLOR, lineHeight: 1.5, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── HOW IT WORKS ── */}
      <FadeSection
        style={{ backgroundColor: GRAY_BG, padding: "clamp(80px, 10vw, 120px) 24px" }}
      >
        <div style={{ maxWidth: MAX_W, margin: "0 auto" }}>
          <p data-stagger style={{ ...caption, ...stagger }}>THREE STEPS</p>
          <h2 data-stagger style={{ ...headline, fontSize: "clamp(34px, 4vw, 56px)", marginBottom: 64, ...stagger }}>
            Five minutes to peace of&nbsp;mind.
          </h2>

          <div data-stagger style={{ ...stepsGrid, ...stagger }}>
            {[
              { n: "1", title: "Share your route", desc: "Where, when, and what language." },
              { n: "2", title: "See your matches", desc: "Ranked by compatibility. Same flight = top priority." },
              { n: "3", title: "Connect and fly", desc: "Both accept. Details shared. You coordinate." },
            ].map((s) => (
              <div key={s.n} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: FONT, fontSize: 72, fontWeight: 700, color: DIVIDER, lineHeight: 1, marginBottom: 16 }}>
                  {s.n}
                </div>
                <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: HEADLINE, marginBottom: 8 }}>
                  {s.title}
                </h3>
                <p style={{ fontFamily: FONT, fontSize: 15, color: CAPTION_COLOR, lineHeight: 1.5, margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── SCENARIOS ── */}
      <FadeSection
        id="scenarios"
        style={{ backgroundColor: WHITE, padding: "clamp(80px, 10vw, 120px) 24px" }}
      >
        <div style={{ maxWidth: MAX_W, margin: "0 auto" }}>
          <p data-stagger style={{ ...caption, ...stagger }}>REAL SITUATIONS</p>
          <h2 data-stagger style={{ ...headline, fontSize: "clamp(34px, 4vw, 56px)", marginBottom: 48, ...stagger }}>
            Who we built this&nbsp;for.
          </h2>

          <div data-stagger style={{ ...scenarioGrid, ...stagger }}>
            {[
              {
                quote: "My father is 72, flying Dhaka to JFK via Dubai. He speaks Bengali and no English.",
                label: "Son in New York",
              },
              {
                quote: "I fly SFO to Hyderabad twice a year. I'd love to help someone's parent — I just never had a way to find them.",
                label: "Frequent flyer",
              },
              {
                quote: "We matched with a woman on the same flight who sat with my mother-in-law at the Doha layover. My wife cried.",
                label: "Family in Toronto",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  backgroundColor: GRAY_BG,
                  borderRadius: 16,
                  padding: 32,
                }}
              >
                <p style={{ fontFamily: FONT, fontSize: 17, fontStyle: "italic", color: HEADLINE, lineHeight: 1.5, margin: "0 0 16px" }}>
                  "{s.quote}"
                </p>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: CAPTION_COLOR, margin: 0 }}>
                  — {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── TRUST ── */}
      <FadeSection
        id="trust"
        style={{ backgroundColor: GRAY_BG, padding: "clamp(80px, 10vw, 120px) 24px" }}
      >
        <div style={{ maxWidth: MAX_W, margin: "0 auto" }}>
          <p data-stagger style={{ ...caption, ...stagger }}>TRUST & PRIVACY</p>
          <h2 data-stagger style={{ ...headline, fontSize: "clamp(34px, 4vw, 56px)", marginBottom: 48, ...stagger }}>
            Private by&nbsp;default.
          </h2>

          <div data-stagger style={{ ...trustGrid, ...stagger }}>
            {[
              { emoji: "🔒", title: "Hidden until you choose", desc: "No details shared until both accept." },
              { emoji: "🤝", title: "Always mutual", desc: "Both travelers must accept the connection." },
              { emoji: "⭐", title: "Earned reputation", desc: "Post-trip endorsements build trust over time." },
              { emoji: "🚫", title: "No ads. No data sales.", desc: "Come when you need it. Leave when you're done." },
            ].map((item) => (
              <div key={item.title} style={{ padding: "8px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{item.emoji}</div>
                <h3 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: HEADLINE, marginBottom: 4 }}>
                  {item.title}
                </h3>
                <p style={{ fontFamily: FONT, fontSize: 15, color: CAPTION_COLOR, lineHeight: 1.5, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── KARMA ── */}
      <FadeSection
        id="community"
        style={{ backgroundColor: WHITE, padding: "clamp(80px, 10vw, 120px) 24px" }}
      >
        <div style={{ maxWidth: MAX_W, margin: "0 auto" }}>
          <p data-stagger style={{ ...caption, ...stagger }}>COMMUNITY</p>
          <h2 data-stagger style={{ ...headline, fontSize: "clamp(34px, 4vw, 56px)", marginBottom: 16, ...stagger }}>
            Help more. Get trusted&nbsp;more.
          </h2>
          <p data-stagger style={{ ...body19, marginBottom: 40, maxWidth: 600, ...stagger }}>
            Every endorsement earns karma. Higher karma = higher match visibility.
          </p>

          <div data-stagger style={{ display: "flex", flexWrap: "wrap", gap: 12, ...stagger }}>
            {[
              { label: "New Traveler", bg: GRAY_BG, color: CAPTION_COLOR },
              { label: "Friendly Traveler", bg: "#EAEAEC", color: BODY_COLOR },
              { label: "Trusted Companion", bg: "#D4D4D7", color: HEADLINE },
              { label: "Community Guide", bg: "#E8AFA0", color: HEADLINE },
              { label: "Ambassador", bg: ACCENT, color: WHITE },
            ].map((pill) => (
              <span
                key={pill.label}
                style={{
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 600,
                  color: pill.color,
                  backgroundColor: pill.bg,
                  padding: "10px 20px",
                  borderRadius: 28,
                  whiteSpace: "nowrap",
                }}
              >
                {pill.label}
              </span>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── FINAL CTA ── */}
      <FadeSection
        id="signup"
        style={{
          backgroundColor: DARK_BG,
          padding: "clamp(80px, 12vw, 120px) 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2
            data-stagger
            style={{
              fontFamily: FONT,
              fontSize: "clamp(34px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: WHITE,
              marginBottom: 16,
              ...stagger,
            }}
          >
            Next time, she won't be&nbsp;alone.
          </h2>
          <p
            data-stagger
            style={{
              fontFamily: FONT,
              fontSize: 19,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.5,
              marginBottom: 32,
              ...stagger,
            }}
          >
            Sign up in five minutes. Free forever.
          </p>
          <button data-stagger onClick={goAuth} style={{ ...pillBtn, ...stagger }}>
            Get started
          </button>
          <p
            data-stagger
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              marginTop: 20,
              ...stagger,
            }}
          >
            Yata Mitr means "travel friend."
          </p>
        </div>
      </FadeSection>

      {/* ── FOOTER ── */}
      <footer
        style={{
          backgroundColor: DARK_BG,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: MAX_W,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 14, color: CAPTION_COLOR }}>
            &copy; 2026 Yata Mitr
          </span>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="#" style={{ fontFamily: FONT, fontSize: 14, color: CAPTION_COLOR, textDecoration: "none" }}>About</a>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>&middot;</span>
            <a href="#" style={{ fontFamily: FONT, fontSize: 14, color: CAPTION_COLOR, textDecoration: "none" }}>Privacy</a>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>&middot;</span>
            <a href="#" style={{ fontFamily: FONT, fontSize: 14, color: CAPTION_COLOR, textDecoration: "none" }}>Contact</a>
          </div>
          <span style={{ fontFamily: FONT, fontSize: 14, color: CAPTION_COLOR }}>
            Made for the South Asian diaspora
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ── Shared styles ── */
const pillBtn: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 17,
  fontWeight: 600,
  color: "#FFFFFF",
  backgroundColor: ACCENT,
  padding: "14px 36px",
  borderRadius: 28,
  border: "none",
  cursor: "pointer",
  display: "inline-block",
};

const captionSmall: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 13,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CAPTION_COLOR,
  margin: 0,
};

const illustrationBox: React.CSSProperties = {
  width: "clamp(200px, 32vw, 320px)",
  height: "clamp(200px, 32vw, 320px)",
  flexShrink: 0,
  borderRadius: 20,
  overflow: "hidden",
};

const illustrationImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const momentRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "clamp(24px, 5vw, 64px)",
  marginBottom: 48,
  flexWrap: "wrap",
  justifyContent: "center",
};

const solutionGrid: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 0,
};

const stepsGrid: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "clamp(24px, 4vw, 48px)",
};

const scenarioGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
};

const trustGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 32,
};
