"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Eye, EyeOff, Fingerprint, LockKeyhole, Orbit, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const particles = Array.from({ length: 34 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`, delay: `${(i % 9) * -0.8}s`, duration: `${8 + (i % 8) * 1.5}s`, size: `${2 + (i % 3)}px`,
}));

export default function NexusEntry() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [guestEntering, setGuestEntering] = useState(false);
  const [configured, setConfigured] = useState(true);

  function enterAsGuest() {
    if (guestEntering || success) return;
    setGuestEntering(true);
    window.setTimeout(() => router.push("/portfolio"), 750);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Masukkan email dan password terlebih dahulu.");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError || !data.user) throw new Error(authError?.message || "Autentikasi gagal.");

      const { data: admin, error: roleError } = await supabase
        .from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();

      if (roleError || !admin) {
        await supabase.auth.signOut();
        throw new Error("Akun berhasil masuk, tetapi belum terdaftar sebagai administrator.");
      }

      setSuccess(true);
      window.setTimeout(() => router.replace("/admin"), 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat masuk.";
      if (message.includes("Supabase belum dikonfigurasi")) setConfigured(false);
      setError(message);
      setLoading(false);
    }
  }

  return (
    <main className={`nexus-entry ${success ? "is-entering" : ""} ${guestEntering ? "is-guest-entering" : ""}`}>
      <div className="entry-grid" />
      <div className="aurora aurora-one" /><div className="aurora aurora-two" /><div className="aurora aurora-three" />
      <div className="particle-field" aria-hidden="true">
        {particles.map((p, i) => <span key={i} className="particle" style={{ left: p.left, top: p.top, animationDelay: p.delay, animationDuration: p.duration, width: p.size, height: p.size }} />)}
      </div>

      <header className="entry-topbar">
        <div className="brand-mark"><span className="brand-glyph">N</span><span>NEXUS <small>/ PERSONAL SPACE</small></span></div>
        <div className="topbar-status"><span className="status-dot" /> SYSTEM ONLINE <span className="topbar-divider">/</span> PORTFOLIO 2026</div>
      </header>

      <section className="entry-stage">
        <div className="entry-copy">
          <p className="eyebrow"><Sparkles size={13} /> WELCOME TO MY UNIVERSE</p>
          <h1>Enter the <span>unknown.</span></h1>
          <p className="entry-subtitle">A space where ideas become reality.</p>
          <div className="entry-index"><span>01</span><i /> A PORTAL INTO MY DIGITAL UNIVERSE</div>
        </div>

        <div className="portal-scene" aria-hidden="true">
          <div className="portal-halo" />
          <div className="portal-ring ring-outer"><span /></div>
          <div className="portal-ring ring-middle"><span /></div>
          <div className="portal-ring ring-inner"><span /></div>
          <div className="portal-core"><div className="core-shine" /><div className="core-shadow" /></div>
          <div className="portal-orbit orbit-a" /><div className="portal-orbit orbit-b" />
          <div className="portal-caption"><Orbit size={12} /> NEXUS GATEWAY <span>•</span> 001</div>
        </div>

        <motion.section className="login-panel" initial={{ opacity: 0, y: 24, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .8, delay: .15 }}>
          <div className="panel-topline"><span><Fingerprint size={14} /> ACCESS TERMINAL</span><span className="panel-version">NX-01</span></div>
          <div className="panel-heading"><div className="panel-icon"><LockKeyhole size={19} /></div><div><h2>Initialize access</h2><p>Administrator authentication required</p></div></div>
          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="email">EMAIL ADDRESS</label>
            <input id="email" type="email" autoComplete="username" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading || success} />
            <label htmlFor="password">ACCESS KEY</label>
            <div className="password-wrap"><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading || success} /><button className="show-password" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
            <AnimatePresence>{error && <motion.p className="login-error" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p>}</AnimatePresence>
            {!configured && <p className="setup-hint">Isi `.env.local` dengan kredensial Supabase sebelum login dapat digunakan.</p>}
            <button className="initialize-button" type="submit" disabled={loading || success}>
              <span>{success ? "ACCESS GRANTED" : loading ? "AUTHENTICATING..." : "INITIALIZE ACCESS"}</span>
              {success ? <span className="success-mark">✓</span> : <ArrowUpRight size={17} />}
            </button>
          </form>
          <div className="panel-foot"><span><i className="secure-dot" /> ENCRYPTED CONNECTION</span><span>AUTH ONLY</span></div>
        </motion.section>
      </section>

      <footer className="entry-footer"><span>© 2026 NEXUS INTERFACE</span><button onClick={enterAsGuest} className="guest-link" disabled={guestEntering || success}>EXPLORE AS GUEST <ArrowUpRight size={14} /></button><span className="footer-coordinates">LATENCY: <b>OPTIMAL</b></span></footer>
      <div className="success-flash" />
    </main>
  );
}
