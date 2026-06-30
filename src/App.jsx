import { useState, useEffect, useRef, useCallback } from "react";

const HISTORY_KEY = "fasalmitra_history";
const GEMINI_MODELS = [ "gemini-2.5-flash"];

function getGeminiUrl(apiKey, model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

function loadApiKey() {
  if (typeof window !== "undefined" && window.__FASALMITRA__?.GEMINI_API_KEY) {
    return window.__FASALMITRA__.GEMINI_API_KEY;
  }
  return process.env.REACT_APP_GEMINI_API_KEY || "";
}

async function askGemini(prompt) {
  const apiKey = loadApiKey();
  if (!apiKey?.trim()) {
    return "API key set nahi hai. public/config.js mein GEMINI_API_KEY add karein ya .env mein REACT_APP_GEMINI_API_KEY set karke app restart karein.";
  }
  let lastError = "";
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(getGeminiUrl(apiKey, model), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await response.json();
      if (data.error) {
        const msg = data.error.message || "";
        lastError = msg;
        if (msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("expired")) {
          return "API key reject ya expire ho gayi hai. Naya free key banayein: aistudio.google.com/apikey — phir config.js ya .env update karein.";
        }
        if (msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) {
          return "Aaj ki limit khatam ho gayi. Thodi der baad dobara try karein ya naya API key use karein.";
        }
        if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("not supported")) {
          continue;
        }
        return `AI error: ${msg}. Dobara try karein.`;
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch {
      lastError = "network";
    }
  }
  if (lastError === "network") {
    return "Internet connection check karein aur dobara try karein.";
  }
  return "Koi jawab nahi mila. Dobara try karein.";
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const SEASONS = ["Kharif", "Rabi", "Zaid"];
const SOIL_TYPES = [
  "Clay (Chikni Mitti)", "Sandy (Baluyi Mitti)", "Loam (Domat Mitti)",
  "Black Cotton Soil", "Red Soil", "Alluvial Soil",
];
const LAND_SIZES = ["1 acre se kam", "1-2 acres", "2-5 acres", "5-10 acres", "10 acres se zyada"];

const C = {
  bg: "#F9F6F0",
  green: "#2D5A27",
  greenLight: "#3d7a35",
  brown: "#8B5A2B",
  gold: "#E1A140",
  goldLight: "#FFF8E7",
  cream: "#EAE5D9",
  dark: "#1A1A1A",
  muted: "#4A4A4A",
  white: "#FFFFFF",
  border: "#DCD5C5",
  shadow: "0 4px 20px rgba(45,90,39,0.08)",
  shadowLg: "0 16px 48px rgba(0,0,0,0.12)",
  shadowGold: "0 8px 28px rgba(225,161,64,0.35)",
};

function useIsWide() {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.innerWidth >= 900);
  useEffect(() => {
    const fn = () => setWide(window.innerWidth >= 900);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return wide;
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function parseNavCommand(transcript) {
  const t = transcript.toLowerCase();
  if (t.includes("crop problem") || t.includes("fasal ki samasya") || t.includes("samasya")) return "crop";
  if (t.includes("best crop") || t.includes("sabse acchi") || t.includes("best fasal")) return "best";
  if (t.includes("mausam") || t.includes("weather")) return "weather";
  if (t.includes("yojana") || t.includes("scheme") || t.includes("sarkari")) return "scheme";
  if (t.includes("history") || t.includes("purane")) return "history";
  if (t.includes("home") || t.includes("wapas") || t.includes("ghar")) return "home";
  return null;
}

// ── Global Styles ──────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { background: ${C.bg}; -webkit-font-smoothing: antialiased; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes wave {
        0%, 100% { transform: scaleY(0.4); }
        50% { transform: scaleY(1); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @keyframes pulseRing {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      button:active { transform: scale(0.98); }
      a { color: inherit; }
    `}</style>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
function IconLeaf() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D5A27" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  );
}
function IconSeedling() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5A2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12M12 12C12 7 8 4 3 3c0 5 3 9 9 9zM12 12c0-5 4-8 9-9 0 5-3 9-9 9"/>
    </svg>
  );
}
function IconSun() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E1A140" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D5A27" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16"/><path d="M2 22h20"/><path d="M9 22V12h6v10"/>
    </svg>
  );
}
function IconBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D5A27" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}
function IconWheat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E1A140" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22 16 8M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94zM7.47 7.53 9 6l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 14l-1.53-1.53a3.5 3.5 0 0 1 0-4.94zM11.47 2.53 13 1l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 9l-1.53-1.53a3.5 3.5 0 0 1 0-4.94zM20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4zM20 8h2v2a4 4 0 0 1-4 4h-2v-2a4 4 0 0 1 4-4zM20 14h2v2a4 4 0 0 1-4 4h-2v-2a4 4 0 0 1 4-4z"/>
    </svg>
  );
}
function IconHistory() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D5A27" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  );
}
function IconSend() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}
function IconMic({ color = "white", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  );
}

// ── Wave Animation ─────────────────────────────────────────────────────────
function WaveAnimation() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", height: 24 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: 4, height: 24, background: "#E1A140", borderRadius: 2,
          animation: "wave 0.8s ease-in-out infinite",
          animationDelay: `${i * 0.12}s`,
        }}/>
      ))}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px", gap: 12 }}>
      <div style={{
        width: 40, height: 40, border: "4px solid #EAE5D9",
        borderTop: "4px solid #2D5A27", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}/>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#8B5A2B" }}>AI soch raha hai...</p>
    </div>
  );
}

// ── Page Transition Wrapper ────────────────────────────────────────────────
function PageTransition({ pageKey, children }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(timer);
  }, [pageKey]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
    }}>
      {children}
    </div>
  );
}

// ── Result Card ────────────────────────────────────────────────────────────
function ResultCard({ text }) {
  const isError = text.includes("Dobara try") || text.includes("API key") || text.includes("limit khatam") || text.includes("Internet");
  const sections = text.split("\n").filter(l => l.trim());
  return (
    <div style={{
      background: isError ? C.goldLight : C.white,
      borderRadius: 16, padding: "20px",
      border: `1px solid ${isError ? C.gold : C.cream}`,
      marginTop: 16, boxShadow: C.shadow,
    }}>
      {sections.map((line, i) => {
        const isBold = line.startsWith("**") || line.startsWith("##") || line.match(/^[A-Z*][^:]*:/);
        const clean = line.replace(/\*\*/g, "").replace(/##/g, "").replace(/^#+\s*/, "").trim();
        return (
          <p key={i} style={{
            fontFamily: "Inter, sans-serif",
            fontSize: isBold ? 15 : 14,
            fontWeight: isBold ? 700 : 500,
            color: isBold ? "#2D5A27" : "#4A4A4A",
            marginBottom: 8,
            lineHeight: 1.6,
            borderLeft: isBold ? "3px solid #E1A140" : "none",
            paddingLeft: isBold ? 10 : 0,
          }}>{clean}</p>
        );
      })}
    </div>
  );
}

// ── Mic Button (inline field) ──────────────────────────────────────────────
function MicButton({ listening, onClick, testId }) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      style={{
        minWidth: 56, minHeight: 56, borderRadius: 16,
        background: listening ? "#2D5A27" : "#E1A140",
        border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {listening ? <WaveAnimation /> : <IconMic color="#2D5A27" />}
    </button>
  );
}

// ── Voice Hook ─────────────────────────────────────────────────────────────
function useVoiceInput({ onResult, mode = "text" }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      alert("Aapke browser mein voice support nahi hai. Chrome try karein.");
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (mode === "navigate") {
        const nav = parseNavCommand(transcript);
        if (nav) onResult(nav, transcript);
        else onResult(null, transcript);
      } else {
        onResult(transcript);
      }
    };
    recognition.start();
  }, [onResult, mode]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setListening(false);
  }, []);

  return { listening, startListening, stopListening };
}

// ── Floating Voice Assistant ───────────────────────────────────────────────
function FloatingVoiceAssistant({ page, setPage, onFieldFill }) {
  const [showHint, setShowHint] = useState(false);

  const handleResult = useCallback((nav, transcript) => {
    if (nav) {
      setPage(nav);
      setShowHint(false);
    } else if ((page === "crop" || page === "weather") && transcript) {
      onFieldFill(transcript);
      setShowHint(false);
    } else {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 3000);
    }
  }, [page, setPage, onFieldFill]);

  const { listening, startListening, stopListening } = useVoiceInput({
    onResult: handleResult,
    mode: "navigate",
  });

  const toggle = () => {
    if (listening) stopListening();
    else startListening();
  };

  return (
    <>
      {showHint && (
        <div style={{
          position: "fixed", bottom: 90, right: 16, maxWidth: 260,
          background: "#2D5A27", color: "white", padding: "12px 16px",
          borderRadius: 12, fontFamily: "Inter, sans-serif", fontSize: 13,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 1000,
        }}>
          Bolein: "Crop Problem", "Best Crop", "Mausam", "Yojana"
        </div>
      )}
      {listening && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "white", padding: "10px 20px", borderRadius: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 1000,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <WaveAnimation />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#2D5A27", fontWeight: 600 }}>
            Sun raha hoon...
          </span>
        </div>
      )}
      <button
        data-testid="floating-voice-btn"
        onClick={toggle}
        style={{
          position: "fixed", bottom: 88, right: 16,
          width: 64, height: 64, borderRadius: "50%",
          background: listening ? "#2D5A27" : "#E1A140",
          border: "3px solid white", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(225,161,64,0.5)", zIndex: 1001,
        }}
      >
        {listening ? <WaveAnimation /> : <IconMic color="#2D5A27" size={26} />}
      </button>
    </>
  );
}

// ── BACK BUTTON ────────────────────────────────────────────────────────────
function BackBtn({ setPage }) {
  return (
    <button
      data-testid="back-btn"
      onClick={() => setPage("home")}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "Work Sans, sans-serif", fontWeight: 700,
        fontSize: 15, color: "#2D5A27", padding: "16px 16px 8px",
        minHeight: 56,
      }}
    >
      <IconBack /> Wapas Jaayein
    </button>
  );
}

const selectStyle = {
  width: "100%", minHeight: 56, background: "white", border: "1px solid #DCD5C5",
  borderRadius: 16, padding: "0 16px", fontSize: 15, fontFamily: "Inter, sans-serif",
  fontWeight: 500, color: "#1A1A1A", outline: "none", marginBottom: 12,
  appearance: "none", cursor: "pointer",
};

const submitBtnStyle = (loading, disabled) => ({
  width: "100%", marginTop: 12, minHeight: 56, borderRadius: 16,
  background: loading || disabled ? "#4A4A4A" : C.green, color: "white",
  fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 16,
  border: "none", cursor: loading || disabled ? "not-allowed" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  boxShadow: loading || disabled ? "none" : "0 4px 16px rgba(45,90,39,0.25)",
  transition: "all 0.2s ease",
});

// ── SITE LAYOUT COMPONENTS ─────────────────────────────────────────────────
function Logo({ size = "md", light = false }) {
  const fs = size === "lg" ? 18 : size === "sm" ? 11 : 14;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        background: light ? "rgba(225,161,64,0.2)" : C.goldLight,
        borderRadius: 10, padding: 6, display: "flex",
      }}>
        <IconWheat />
      </div>
      <span style={{
        fontFamily: "Work Sans, sans-serif", fontWeight: 800,
        fontSize: fs, color: light ? C.gold : C.green, letterSpacing: 2,
      }}>
        FASALMITRA
      </span>
    </div>
  );
}

function Navbar({ setPage, page, onAppClick }) {
  const wide = useIsWide();
  const inApp = page !== "home";

  const navItems = [
    { label: "Home", action: () => { setPage("home"); scrollToId("top"); } },
    { label: "Features", action: () => { setPage("home"); setTimeout(() => scrollToId("features"), 100); } },
    { label: "Kaise Kaam Kare", action: () => { setPage("home"); setTimeout(() => scrollToId("how-it-works"), 100); } },
    { label: "App", action: onAppClick },
  ];

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 200,
      background: inApp ? C.white : "rgba(249,246,240,0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${C.cream}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: wide ? "14px 32px" : "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <button
          data-testid="nav-logo"
          onClick={() => { setPage("home"); scrollToId("top"); }}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <Logo size={wide ? "lg" : "md"} />
        </button>

        {wide && !inApp && (
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {navItems.map(n => (
              <button
                key={n.label}
                data-testid={`nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
                onClick={n.action}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14,
                  color: C.muted, transition: "color 0.2s",
                }}
              >
                {n.label}
              </button>
            ))}
          </div>
        )}

        <button
          data-testid="nav-start-btn"
          onClick={onAppClick}
          style={{
            minHeight: 44, padding: "0 20px", borderRadius: 12,
            background: C.green, color: "white", border: "none",
            fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 14,
            cursor: "pointer", boxShadow: "0 4px 14px rgba(45,90,39,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          {inApp ? "Home" : "App Shuru Karein"}
        </button>
      </div>
    </nav>
  );
}

function BottomNav({ page, setPage }) {
  const tabs = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "crop", label: "Samasya", icon: "🌿" },
    { id: "best", label: "Fasal", icon: "🌱" },
    { id: "weather", label: "Mausam", icon: "☀️" },
    { id: "scheme", label: "Yojana", icon: "🏛️" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480, zIndex: 999,
      background: C.white, borderTop: `1px solid ${C.cream}`,
      boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      display: "flex", justifyContent: "space-around", padding: "8px 4px 12px",
    }}>
      {tabs.map(t => {
        const active = page === t.id;
        return (
          <button
            key={t.id}
            data-testid={`bottom-nav-${t.id}`}
            onClick={() => setPage(t.id)}
            style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "6px 4px", borderRadius: 12,
              backgroundColor: active ? C.goldLight : "transparent",
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{
              fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: active ? 700 : 500,
              color: active ? C.green : C.muted,
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SiteFooter({ setPage }) {
  const wide = useIsWide();
  return (
    <footer style={{ background: C.green, color: "white", marginTop: 48 }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: wide ? "48px 32px 32px" : "36px 20px 28px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: wide ? "1.5fr 1fr 1fr" : "1fr",
          gap: wide ? 40 : 28,
        }}>
          <div>
            <Logo light />
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, marginTop: 14, lineHeight: 1.7, opacity: 0.9 }}>
              Bharat ke kisanon ke liye AI-powered digital saathi. Fasal, mausam aur sarkari yojana — sab ek jagah.
            </p>
            <p style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 15, marginTop: 12, color: C.gold, fontStyle: "italic" }}>
              Aapki Fasal, Hamari Zimmedari
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14, color: C.gold }}>Sevaayein</p>
            {["Crop Problem", "Best Crop", "Mausam Salah", "Sarkari Yojana"].map(s => (
              <p key={s} style={{ fontFamily: "Inter, sans-serif", fontSize: 13, marginBottom: 8, opacity: 0.85 }}>{s}</p>
            ))}
          </div>
          <div>
            <p style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14, color: C.gold }}>Contact</p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, marginBottom: 8, opacity: 0.85 }}>📞 1800-FASAL-AI</p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, marginBottom: 8, opacity: 0.85 }}>✉️ help@fasalmitra.in</p>
            <button
              data-testid="footer-app-btn"
              onClick={() => { setPage("crop"); scrollToId("app-section"); }}
              style={{
                marginTop: 12, minHeight: 48, padding: "0 20px", borderRadius: 12,
                background: C.gold, color: C.green, border: "none",
                fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              App Try Karein →
            </button>
          </div>
        </div>
        <div style={{
          marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.15)",
          textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, opacity: 0.7,
        }}>
          © 2026 FasalMitra. Made with ❤️ for Indian Farmers.
        </div>
      </div>
    </footer>
  );
}

function SectionTitle({ badge, title, subtitle, center = true }) {
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: 32 }}>
      {badge && (
        <span style={{
          display: "inline-block", background: C.goldLight, color: C.brown,
          fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12,
          padding: "6px 14px", borderRadius: 20, marginBottom: 12,
          border: `1px solid ${C.gold}`,
        }}>{badge}</span>
      )}
      <h2 style={{
        fontFamily: "Work Sans, sans-serif", fontWeight: 800,
        fontSize: 28, color: C.dark, lineHeight: 1.25, marginBottom: 10,
      }}>{title}</h2>
      {subtitle && (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: C.muted, lineHeight: 1.6, maxWidth: 560, margin: center ? "0 auto" : 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function AppFrame({ children, title }) {
  const wide = useIsWide();
  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", width: "100%",
      background: C.white,
      borderRadius: wide ? 28 : 0,
      boxShadow: wide ? C.shadowLg : "none",
      border: wide ? `1px solid ${C.cream}` : "none",
      overflow: "hidden",
      position: "relative",
    }}>
      {wide && title && (
        <div style={{
          background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenLight} 100%)`,
          padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }}/>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }}/>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }}/>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.9)", marginLeft: 8 }}>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}

function AppPageLayout({ setPage, page, icon, title, subtitle, children }) {
  const wide = useIsWide();
  return (
    <div style={{ minHeight: "100vh", background: wide ? C.bg : C.bg, paddingBottom: 90 }}>
      <Navbar setPage={setPage} page={page} onAppClick={() => setPage("home")} />
      <div style={{ maxWidth: wide ? 1100 : 480, margin: "0 auto", padding: wide ? "24px 32px" : 0 }}>
        {wide && (
          <p style={{
            fontFamily: "Inter, sans-serif", fontSize: 13, color: C.muted,
            marginBottom: 16, textAlign: "center",
          }}>
            FasalMitra App — {title}
          </p>
        )}
        <AppFrame title={`FasalMitra — ${title}`}>
          <BackBtn setPage={setPage} />
          <div style={{ padding: wide ? "0 24px 32px" : "0 16px 32px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 6,
              padding: "16px", background: C.goldLight, borderRadius: 16,
              border: `1px solid ${C.gold}`,
            }}>
              <div style={{ background: C.white, borderRadius: 14, padding: 10, boxShadow: C.shadow }}>{icon}</div>
              <div>
                <h2 style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 800, fontSize: 22, color: C.dark, margin: 0 }}>{title}</h2>
                <p style={{ fontFamily: "Inter, sans-serif", color: C.muted, fontSize: 13, margin: "4px 0 0" }}>{subtitle}</p>
              </div>
            </div>
            {children}
          </div>
        </AppFrame>
      </div>
      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

// ── HOME PAGE (Site + App) ───────────────────────────────────────────────────
function HomePage({ setPage, history }) {
  const wide = useIsWide();
  const features = [
    { id: "crop", hindi: "Fasal ki Samasya", english: "Crop Problem", desc: "Keede, rog aur patte peele — turant upay", icon: <IconLeaf />, testId: "crop-problem-btn", color: C.green },
    { id: "best", hindi: "Sabse Acchi Fasal", english: "Best Crop", desc: "State, season aur mitti ke hisaab se", icon: <IconSeedling />, testId: "best-crop-btn", color: C.brown },
    { id: "weather", hindi: "Mausam Salah", english: "Weather Advice", desc: "Aaj kya karein, kya na karein", icon: <IconSun />, testId: "weather-btn", color: C.gold },
    { id: "scheme", hindi: "Sarkari Yojana", english: "Govt Schemes", desc: "PM Kisan aur state yojanaayein", icon: <IconBuilding />, testId: "scheme-btn", color: C.green },
  ];

  const stats = [
    { num: "10L+", label: "Kisan Parivaar" },
    { num: "4", label: "AI Sevaayein" },
    { num: "24/7", label: "Madad" },
    { num: "Hindi", label: "+ English" },
  ];

  const steps = [
    { step: "01", title: "Sawal Puchein", desc: "Type karein ya mic se bolein — Hindi ya English dono chalega" },
    { step: "02", title: "AI Samjhe", desc: "Gemini AI aapki fasal ki problem samajh kar jawab deta hai" },
    { step: "03", title: "Upay Lagayein", desc: "Prakritik aur rasayanik upay — seedha khet mein kaam aayega" },
  ];

  const testimonials = [
    { name: "Ram Kumar", place: "Varanasi, UP", text: "Gobhi mein keede lage the — FasalMitra ne sahi dawai aur upay bataya. Bahut kaam aaya!" },
    { name: "Sunita Devi", place: "Patna, Bihar", text: "PM Kisan yojana ke baare mein yahan se jaankari mili. Aasaan language mein samjhaya." },
    { name: "Gurpreet Singh", place: "Ludhiana, Punjab", text: "Mausam salah se barish se pehle katai kar li. Voice se shehar bol diya — bahut aasaan!" },
  ];

  const goApp = () => scrollToId("app-section");

  return (
    <div id="top" style={{ minHeight: "100vh", background: C.bg }}>
      <Navbar setPage={setPage} page="home" onAppClick={() => setPage("crop")} />

      {/* HERO */}
      <section style={{
        maxWidth: 1100, margin: "0 auto",
        padding: wide ? "48px 32px 56px" : "0",
        display: wide ? "grid" : "block",
        gridTemplateColumns: wide ? "1fr 1fr" : "1fr",
        gap: wide ? 48 : 0,
        alignItems: "center",
      }}>
        {wide && (
          <div style={{ animation: "fadeIn 0.6s ease" }}>
            <span style={{
              display: "inline-block", background: C.goldLight, color: C.brown,
              fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12,
              padding: "6px 14px", borderRadius: 20, marginBottom: 20,
              border: `1px solid ${C.gold}`,
            }}>🇮🇳 Bharat ke Kisanon ke liye #1 AI Saathi</span>
            <h1 style={{
              fontFamily: "Work Sans, sans-serif", fontWeight: 800,
              fontSize: 48, color: C.dark, lineHeight: 1.15, marginBottom: 16,
            }}>
              Namaste<br />
              <span style={{ color: C.green }}>Kisan Bhai</span> 🙏
            </h1>
            <p style={{
              fontFamily: "Inter, sans-serif", fontSize: 18, color: C.muted,
              lineHeight: 1.7, marginBottom: 28, fontStyle: "italic",
            }}>
              Aapki Fasal, Hamari Zimmedari
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 32 }}>
              Fasal ki samasya ho, mausam ki chinta ho ya sarkari yojana — FasalMitra AI se turant jawab, Hindi aur English dono mein.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button
                data-testid="hero-cta-btn"
                onClick={() => setPage("crop")}
                style={{
                  minHeight: 56, padding: "0 32px", borderRadius: 16,
                  background: C.green, color: "white", border: "none",
                  fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 16,
                  cursor: "pointer", boxShadow: "0 6px 20px rgba(45,90,39,0.35)",
                }}
              >
                Abhi Shuru Karein →
              </button>
              <button
                data-testid="hero-learn-btn"
                onClick={goApp}
                style={{
                  minHeight: 56, padding: "0 32px", borderRadius: 16,
                  background: "transparent", color: C.green,
                  border: `2px solid ${C.green}`,
                  fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 16,
                  cursor: "pointer",
                }}
              >
                Aur Jaanein
              </button>
            </div>
          </div>
        )}

        <div style={{
          position: "relative", height: wide ? 420 : 300, overflow: "hidden",
          borderRadius: wide ? 24 : 0,
          boxShadow: wide ? C.shadowLg : "none",
        }}>
          <img
            src="https://images.unsplash.com/photo-1627475320102-d73fcb4eb427?w=800"
            alt="Farmer in green field"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: wide
              ? "linear-gradient(135deg, rgba(45,90,39,0.15) 0%, rgba(0,0,0,0.45) 100%)"
              : "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
          }}/>
          {!wide && (
            <div style={{ position: "absolute", bottom: 28, left: 20, right: 20 }}>
              <Logo light />
              <h1 style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 800, fontSize: 32, color: "white", margin: "10px 0 6px", lineHeight: 1.2 }}>
                Namaste Kisan Bhai 🙏
              </h1>
              <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.9)", fontSize: 15, fontStyle: "italic" }}>
                Aapki Fasal, Hamari Zimmedari
              </p>
            </div>
          )}
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: C.green, padding: wide ? "36px 32px" : "28px 16px" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16,
        }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 800, fontSize: wide ? 32 : 24, color: C.gold }}>{s.num}</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES SHOWCASE */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: wide ? "64px 32px" : "40px 16px" }}>
        <SectionTitle
          badge="Hamari Sevaayein"
          title="Kisan ke har kaam mein saath"
          subtitle="Char powerful AI tools — phone se seedha khet tak madad"
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: wide ? "repeat(4, 1fr)" : "1fr 1fr",
          gap: 16,
        }}>
          {features.map(f => (
            <div
              key={f.id}
              onClick={() => setPage(f.id)}
              data-testid={`site-feature-${f.id}`}
              style={{
                background: C.white, borderRadius: 20, padding: 24,
                border: `1px solid ${C.cream}`, cursor: "pointer",
                boxShadow: C.shadow, transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: C.goldLight, display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16, border: `2px solid ${C.gold}`,
              }}>{f.icon}</div>
              <p style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 16, color: C.dark }}>{f.hindi}</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.brown, margin: "4px 0 8px" }}>{f.english}</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ background: C.white, padding: wide ? "64px 32px" : "40px 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionTitle
            badge="Seedha aur Aasaan"
            title="Kaise kaam karta hai?"
            subtitle="Teen aasaan kadam — koi technical jaankari nahi chahiye"
          />
          <div style={{
            display: "grid",
            gridTemplateColumns: wide ? "repeat(3, 1fr)" : "1fr",
            gap: 24,
          }}>
            {steps.map(s => (
              <div key={s.step} style={{
                background: C.bg, borderRadius: 20, padding: 28,
                border: `1px solid ${C.cream}`, position: "relative",
              }}>
                <span style={{
                  fontFamily: "Work Sans, sans-serif", fontWeight: 800,
                  fontSize: 40, color: C.gold, opacity: 0.4, lineHeight: 1,
                }}>{s.step}</span>
                <p style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 18, color: C.green, margin: "8px 0 10px" }}>{s.title}</p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: wide ? "64px 32px" : "40px 16px" }}>
        <SectionTitle badge="Kisan ki Zubaani" title="Kisan bhai kya kehte hain" />
        <div style={{ display: "grid", gridTemplateColumns: wide ? "repeat(3, 1fr)" : "1fr", gap: 16 }}>
          {testimonials.map(t => (
            <div key={t.name} style={{
              background: C.white, borderRadius: 20, padding: 24,
              border: `1px solid ${C.cream}`, boxShadow: C.shadow,
            }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.7, fontStyle: "italic", marginBottom: 16 }}>
                "{t.text}"
              </p>
              <p style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 14, color: C.dark }}>{t.name}</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.brown }}>📍 {t.place}</p>
            </div>
          ))}
        </div>
      </section>

      {/* APP SECTION */}
      <section id="app-section" style={{
        background: `linear-gradient(180deg, ${C.bg} 0%, ${C.cream} 100%)`,
        padding: wide ? "64px 32px 80px" : "40px 16px 100px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionTitle
            badge="📱 Mobile App"
            title="App abhi try karein"
            subtitle="Neeche se koi bhi seva chunein — turant AI jawab milega"
          />
          <AppFrame title="FasalMitra App">
            <div style={{ padding: "20px 16px 24px", background: C.bg }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {features.map(f => (
                  <button
                    key={f.id}
                    data-testid={f.testId}
                    onClick={() => setPage(f.id)}
                    style={{
                      background: C.white, borderRadius: 20, padding: "18px 12px",
                      border: `1px solid ${C.cream}`, cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 10, minHeight: 130, boxShadow: C.shadow,
                    }}
                  >
                    <div style={{ background: C.goldLight, borderRadius: 14, padding: 10 }}>{f.icon}</div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 13, color: C.dark, margin: 0 }}>{f.hindi}</p>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.brown, margin: "3px 0 0" }}>{f.english}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                data-testid="history-btn"
                onClick={() => setPage("history")}
                style={{
                  width: "100%", marginTop: 14, minHeight: 56, borderRadius: 16,
                  background: history.length > 0 ? C.cream : C.white,
                  border: `2px solid ${C.green}`, color: C.green,
                  fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 15,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8,
                }}
              >
                <IconHistory />
                {history.length > 0 ? `Purane Sawal (${history.length})` : "Purane Sawal"}
              </button>
            </div>
          </AppFrame>
        </div>
      </section>

      <SiteFooter setPage={setPage} />
      <BottomNav page="home" setPage={setPage} />
    </div>
  );
}

// ── CROP PROBLEM PAGE ──────────────────────────────────────────────────────
function CropPage({ setPage, addHistory, voiceText, clearVoiceText }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (voiceText) {
      setInput(prev => prev ? prev + " " + voiceText : voiceText);
      clearVoiceText();
    }
  }, [voiceText, clearVoiceText]);

  const handleVoiceResult = useCallback((transcript) => {
    setInput(prev => prev ? prev + " " + transcript : transcript);
  }, []);

  const { listening, startListening, stopListening } = useVoiceInput({
    onResult: handleVoiceResult,
    mode: "text",
  });

  async function handleSubmit() {
    if (!input.trim()) return;
    setLoading(true);
    setResult("");
    const prompt = `Tu ek experienced Indian agricultural expert hai. Ek farmer ne yeh problem batai hai: "${input}"

Hinglish mein (Hindi + English mix) clearly batao:
**Samasya Ka Naam (Problem Name):**
**Karan (Cause):**
**Prakritik Upay (Natural Remedy):**
**Rasayanik Upay (Chemical Remedy):**
**Bachav Ke Tarike (Prevention Tips):**

Simple aur practical language use karo jo farmers samajh sakein.`;
    const answer = await askGemini(prompt);
    setResult(answer);
    addHistory({ type: "Crop Problem", question: input, answer, date: new Date().toISOString() });
    setLoading(false);
  }

  return (
    <AppPageLayout
      setPage={setPage} page="crop"
      icon={<IconLeaf />} title="Crop Problem"
      subtitle="Apni fasal ki samasya Hindi ya English mein likhein ya bolein"
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <textarea
          data-testid="crop-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Jaise: Mere tamatar ke patte peele ho rahe hain..."
          rows={4}
          style={{
            flex: 1, background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "16px", fontSize: 15, fontFamily: "Inter, sans-serif",
            fontWeight: 500, color: C.dark, outline: "none", resize: "none", lineHeight: 1.6,
            boxShadow: C.shadow,
          }}
        />
        <MicButton
          testId="crop-mic-btn"
          listening={listening}
          onClick={() => listening ? stopListening() : startListening()}
        />
      </div>

      {listening && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "10px 14px", background: C.goldLight, borderRadius: 12 }}>
          <WaveAnimation />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.brown }}>Boliye apni samasya...</span>
        </div>
      )}

      <button
        data-testid="crop-submit-btn"
        onClick={handleSubmit}
        disabled={loading || !input.trim()}
        style={submitBtnStyle(loading, !input.trim())}
      >
        {loading ? "Soch raha hoon..." : <><IconSend /> Samasya Bhejein</>}
      </button>

      {loading && <Spinner />}
      {result && <ResultCard text={result} />}
    </AppPageLayout>
  );
}

// ── BEST CROP PAGE ─────────────────────────────────────────────────────────
function BestCropPage({ setPage, addHistory }) {
  const [state, setState] = useState("");
  const [season, setSeason] = useState("");
  const [soil, setSoil] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!state || !season || !soil) return;
    setLoading(true);
    setResult("");
    const prompt = `Tu ek Indian agriculture expert hai. Farmer ki details:
- State: ${state}
- Season: ${season}
- Soil Type: ${soil}

Hinglish mein Top 3 sabse profitable crops suggest karo. Har crop ke liye:
**Crop 1: [Naam]**
Kyu: [reason]
Pani ki zaroorat: [water needs]
Kamaai: [estimated profit per acre in INR]

**Crop 2: [Naam]**
Kyu: ...
Pani ki zaroorat: ...
Kamaai: ...

**Crop 3: [Naam]**
Kyu: ...
Pani ki zaroorat: ...
Kamaai: ...

Practical aur specific information do.`;
    const answer = await askGemini(prompt);
    setResult(answer);
    addHistory({ type: "Best Crop", question: `${state} | ${season} | ${soil}`, answer, date: new Date().toISOString() });
    setLoading(false);
  }

  return (
    <AppPageLayout
      setPage={setPage} page="best"
      icon={<IconSeedling />} title="Best Crop"
      subtitle="Apni details bharo, AI best fasal suggest karega"
    >
      <label style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: C.green, display: "block", marginBottom: 6 }}>Aapka State</label>
      <select data-testid="state-select" value={state} onChange={e => setState(e.target.value)} style={selectStyle}>
        <option value="">State chunein...</option>
        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <label style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: C.green, display: "block", marginBottom: 6 }}>Season</label>
      <select data-testid="season-select" value={season} onChange={e => setSeason(e.target.value)} style={selectStyle}>
        <option value="">Season chunein...</option>
        {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <label style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: C.green, display: "block", marginBottom: 6 }}>Mitti Ka Prakar</label>
      <select data-testid="soil-select" value={soil} onChange={e => setSoil(e.target.value)} style={selectStyle}>
        <option value="">Mitti chunein...</option>
        {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <button
        data-testid="best-crop-submit-btn"
        onClick={handleSubmit}
        disabled={loading || !state || !season || !soil}
        style={submitBtnStyle(loading, !state || !season || !soil)}
      >
        {loading ? "Soch raha hoon..." : <><IconSend /> Best Crop Jaano</>}
      </button>

      {loading && <Spinner />}
      {result && <ResultCard text={result} />}
    </AppPageLayout>
  );
}

// ── WEATHER PAGE ───────────────────────────────────────────────────────────
function WeatherPage({ setPage, addHistory, voiceText, clearVoiceText }) {
  const [city, setCity] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (voiceText) {
      setCity(voiceText);
      clearVoiceText();
    }
  }, [voiceText, clearVoiceText]);

  const handleVoiceResult = useCallback((transcript) => {
    setCity(transcript);
  }, []);

  const { listening, startListening, stopListening } = useVoiceInput({
    onResult: handleVoiceResult,
    mode: "text",
  });

  async function handleSubmit() {
    if (!city.trim()) return;
    setLoading(true);
    setResult("");
    const prompt = `Tu ek Indian agricultural weather advisor hai. Farmer ${city} mein rehta hai.

Aaj ke mausam ke hisaab se farming advice do Hinglish mein:

**Mausam Ki Sthiti (Weather Condition):**
**Kya Karein (What Farmer Should Do):**
**Kya Na Karein (What to Avoid):**
**Agli 3 Din Ki Salah (Next 3 Days Advice):**

Practical farming-specific advice do based on typical ${city} weather patterns for this time of year.`;
    const answer = await askGemini(prompt);
    setResult(answer);
    addHistory({ type: "Mausam Salah", question: city, answer, date: new Date().toISOString() });
    setLoading(false);
  }

  return (
    <AppPageLayout
      setPage={setPage} page="weather"
      icon={<IconSun />} title="Mausam Salah"
      subtitle="Apna shehar batao, mausam ke hisaab se salah milegi"
    >
      <div style={{ display: "flex", gap: 10 }}>
        <input
          data-testid="city-input"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Jaise: Varanasi, Lucknow, Patna..."
          style={{
            flex: 1, minHeight: 56, background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "0 16px", fontSize: 15, fontFamily: "Inter, sans-serif",
            fontWeight: 500, color: C.dark, outline: "none", boxShadow: C.shadow,
          }}
        />
        <MicButton
          testId="weather-mic-btn"
          listening={listening}
          onClick={() => listening ? stopListening() : startListening()}
        />
      </div>

      {listening && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "10px 14px", background: C.goldLight, borderRadius: 12 }}>
          <WaveAnimation />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.brown }}>Boliye apna shehar...</span>
        </div>
      )}

      <button
        data-testid="weather-submit-btn"
        onClick={handleSubmit}
        disabled={loading || !city.trim()}
        style={submitBtnStyle(loading, !city.trim())}
      >
        {loading ? "Dekh raha hoon..." : <><IconSend /> Mausam Salah Lo</>}
      </button>

      {loading && <Spinner />}
      {result && <ResultCard text={result} />}
    </AppPageLayout>
  );
}

// ── SCHEME PAGE ────────────────────────────────────────────────────────────
function SchemePage({ setPage, addHistory }) {
  const [state, setState] = useState("");
  const [land, setLand] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!state || !land) return;
    setLoading(true);
    setResult("");
    const prompt = `Tu ek Indian government schemes expert hai. Farmer ki details:
- State: ${state}
- Land Size: ${land}

Hinglish mein top 5 relevant government schemes batao jo is farmer ke liye suitable hain:

Har scheme ke liye:
**Scheme Ka Naam:**
Kya milta hai: [benefit]
Kaun apply kar sakta hai: [eligibility]
Kaise apply karein: [simple steps]

PM Kisan, crop insurance, soil health card jaise schemes zaroor include karo agar relevant ho.`;
    const answer = await askGemini(prompt);
    setResult(answer);
    addHistory({ type: "Sarkari Yojana", question: `${state} | ${land}`, answer, date: new Date().toISOString() });
    setLoading(false);
  }

  return (
    <AppPageLayout
      setPage={setPage} page="scheme"
      icon={<IconBuilding />} title="Sarkari Yojana"
      subtitle="Apni details do, suitable government schemes jaano"
    >
      <label style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: C.green, display: "block", marginBottom: 6 }}>Aapka State</label>
      <select data-testid="scheme-state-select" value={state} onChange={e => setState(e.target.value)} style={selectStyle}>
        <option value="">State chunein...</option>
        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <label style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: C.green, display: "block", marginBottom: 6 }}>Zameen Ki Matra</label>
      <select data-testid="land-select" value={land} onChange={e => setLand(e.target.value)} style={selectStyle}>
        <option value="">Land size chunein...</option>
        {LAND_SIZES.map(l => <option key={l} value={l}>{l}</option>)}
      </select>

      <button
        data-testid="scheme-submit-btn"
        onClick={handleSubmit}
        disabled={loading || !state || !land}
        style={submitBtnStyle(loading, !state || !land)}
      >
        {loading ? "Dhoondh raha hoon..." : <><IconSend /> Yojana Dekhein</>}
      </button>

      {loading && <Spinner />}
      {result && <ResultCard text={result} />}
    </AppPageLayout>
  );
}

// ── HISTORY PAGE ───────────────────────────────────────────────────────────
const TYPE_COLORS = {
  "Crop Problem": "#2D5A27",
  "Best Crop": "#8B5A2B",
  "Mausam Salah": "#E1A140",
  "Sarkari Yojana": "#2D5A27",
};

function HistoryPage({ setPage, history, clearHistory }) {
  return (
    <AppPageLayout
      setPage={setPage} page="history"
      icon={<IconHistory />} title="Purane Sawal"
      subtitle={history.length > 0 ? `Aapke pichle ${history.length} sawal` : "Abhi tak koi sawal nahi pucha"}
    >
      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", background: C.white, borderRadius: 16, border: `1px solid ${C.cream}` }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
          <p style={{ color: C.muted, fontFamily: "Inter, sans-serif", fontSize: 15 }}>Pehle koi feature use karein, yahan history dikhegi.</p>
        </div>
      ) : (
        history.slice().reverse().map((h, i) => (
          <div
            key={i}
            data-testid={`history-item-${i}`}
            style={{ background: C.white, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${C.cream}`, boxShadow: C.shadow }}
          >
            <span style={{
              background: C.goldLight, color: TYPE_COLORS[h.type] || C.green,
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
              fontFamily: "Inter, sans-serif", border: `1px solid ${TYPE_COLORS[h.type] || C.green}`,
            }}>
              {h.type}
            </span>
            <p style={{ fontFamily: "Work Sans, sans-serif", fontWeight: 700, color: C.dark, fontSize: 14, margin: "10px 0 6px" }}>
              {h.question}
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
              {h.answer.replace(/\*\*/g, "").slice(0, 150)}{h.answer.length > 150 ? "..." : ""}
            </p>
          </div>
        ))
      )}
      {history.length > 0 && (
        <button
          data-testid="clear-history-btn"
          onClick={clearHistory}
          style={{
            width: "100%", minHeight: 56, borderRadius: 16, marginTop: 8,
            background: C.white, border: `2px solid ${C.brown}`, color: C.brown,
            fontFamily: "Work Sans, sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer",
          }}
        >
          History Saaf Karein
        </button>
      )}
    </AppPageLayout>
  );
}

// ── APP ROOT ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [history, setHistory] = useState([]);
  const [voiceText, setVoiceText] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* ignore corrupt data */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch { /* ignore storage errors */ }
  }, [history]);

  function addHistory(entry) {
    setHistory(prev => [...prev, entry]);
  }

  const clearVoiceText = useCallback(() => setVoiceText(null), []);

  const handleFieldFill = useCallback((text) => {
    setVoiceText(text);
  }, []);

  const renderPage = () => {
    switch (page) {
      case "home":
        return <HomePage setPage={setPage} history={history} />;
      case "crop":
        return <CropPage setPage={setPage} addHistory={addHistory} voiceText={voiceText} clearVoiceText={clearVoiceText} />;
      case "best":
        return <BestCropPage setPage={setPage} addHistory={addHistory} />;
      case "weather":
        return <WeatherPage setPage={setPage} addHistory={addHistory} voiceText={voiceText} clearVoiceText={clearVoiceText} />;
      case "scheme":
        return <SchemePage setPage={setPage} addHistory={addHistory} />;
      case "history":
        return <HistoryPage setPage={setPage} history={history} clearHistory={() => setHistory([])} />;
      default:
        return <HomePage setPage={setPage} history={history} />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", fontFamily: "Inter, sans-serif", position: "relative", background: C.bg }}>
        <PageTransition pageKey={page}>
          {renderPage()}
        </PageTransition>
        <FloatingVoiceAssistant page={page} setPage={setPage} onFieldFill={handleFieldFill} />
      </div>
    </>
  );
}
