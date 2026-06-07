import { useState, useEffect } from "react";
import { Icon } from "../components/Icon";
import { Spinner } from "../components/Shared";
import { authApi } from "../utils/api";

const passwordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "var(--border-medium)" };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^a-zA-Z0-9]/.test(pwd)) s++;
  return [
    { score: 0, label: "", color: "var(--border-medium)" },
    { score: 1, label: "Faible", color: "var(--terracotta)" },
    { score: 2, label: "Moyen", color: "var(--ochre)" },
    { score: 3, label: "Bon", color: "var(--moss-soft)" },
    { score: 4, label: "Excellent", color: "var(--moss)" },
  ][s];
};

export default function AuthPage({ onLogin, initialMode, resetToken }) {
  const [mode, setMode] = useState(initialMode || "login");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1.1fr", background: "var(--bg-page)" }}>
      <LeftPanel mode={mode} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        <div style={{ width: "100%", maxWidth: 420 }} className="fade-up">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <div className="sidebar-brand-mark" style={{ width: 36, height: 36, fontSize: 20 }}>B</div>
            <div className="sidebar-brand-text" style={{ fontSize: 19 }}>Biograf <em>AI</em></div>
          </div>
          {mode === "login"             && <LoginForm setMode={setMode} onLogin={onLogin} />}
          {mode === "register"          && <RegisterForm setMode={setMode} setVerifiedEmail={setVerifiedEmail} />}
          {mode === "verify-email-sent" && <VerifyEmailSentView setMode={setMode} email={verifiedEmail} />}
          {mode === "forgot"            && <ForgotForm setMode={setMode} />}
          {mode === "reset-sent"        && <ResetSentView setMode={setMode} />}
          {mode === "new-pwd"           && <NewPwdForm setMode={setMode} resetToken={resetToken} />}
          {mode === "done"              && <DoneView setMode={setMode} />}
          <div style={{ marginTop: 60, fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 16 }}>
            <span>© 2026 Biograf AI</span>
            <a href="#" style={{ color: "inherit" }}>Confidentialité</a>
            <a href="#" style={{ color: "inherit" }}>Conditions</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeftPanel({ mode }) {
  const content = {
    login: { tag: "Connexion", title: "L'écriture vous attend.", quote: "« Chaque histoire vaut d'être écrite. »", author: "Aïssatou Kaboré, auteure" },
    register: { tag: "Inscription", title: "Donnez vie à vos histoires.", quote: "« Un peuple sans mémoire est un peuple sans avenir. »", author: "Proverbe akan" },
    "verify-email-sent": { tag: "Vérification", title: "Vérifiez votre email.", quote: "« La patience est la clé du succès. »", author: "Proverbe africain" },
    forgot: { tag: "Récupération", title: "Retrouvez votre voix.", quote: "« Le mot juste fait toujours retour. »", author: "Aimé Césaire" },
    "reset-sent": { tag: "Récupération", title: "Retrouvez votre voix.", quote: "« Le mot juste fait toujours retour. »", author: "Aimé Césaire" },
    "new-pwd": { tag: "Sécurité", title: "Protégez vos manuscrits.", quote: "« Le silence des archives est la mort du peuple. »", author: "Cheikh Anta Diop" },
    done: { tag: "Terminé", title: "C'est reparti.", quote: "« On ne remplace pas la mémoire. »", author: "" },
  }[mode] ?? { tag: "Biograf", title: "L'écriture vous attend.", quote: "", author: "" };

  return (
    <div style={{ position: "relative", background: "linear-gradient(135deg, #2D241C 0%, #4A3A2D 100%)", padding: 48, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(184,85,59,0.15), transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,151,74,0.12), transparent 70%)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 999, background: "rgba(250,246,240,0.08)", border: "1px solid rgba(250,246,240,0.15)", color: "#FAF6F0", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, background: "var(--terracotta-soft)", borderRadius: "50%" }} />
          {content.tag}
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, animation: "fadeUp 0.6s var(--ease) both" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 500, color: "#FAF6F0", lineHeight: 1.05, letterSpacing: "-0.025em", marginBottom: 8 }}>
          {content.title.split(" ").slice(0, -1).join(" ")} <em style={{ fontStyle: "italic", color: "var(--terracotta-soft)", fontWeight: 400 }}>{content.title.split(" ").slice(-1)[0]}</em>
        </h1>
        <p style={{ color: "rgba(250,246,240,0.65)", fontSize: 16, marginTop: 24, maxWidth: 380, lineHeight: 1.6 }}>
          La plateforme qui transforme la mémoire orale en patrimoine écrit pour les générations futures.
        </p>
        <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
          {[["12k+", "Auteurs"], ["48", "Pays"], ["320k", "Mots écrits"]].map(([v, l], i) => (
            <div key={i} style={{ animation: `fadeUp 0.6s ${0.2 + i * 0.1}s var(--ease) both` }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "#FAF6F0", fontWeight: 500 }}>{v}</div>
              <div style={{ fontSize: 12, color: "rgba(250,246,240,0.55)", marginTop: 2, letterSpacing: "0.05em", textTransform: "uppercase" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 1, animation: "fadeUp 0.6s 0.3s var(--ease) both" }}>
        <div style={{ height: 1, width: 48, background: "var(--terracotta-soft)", marginBottom: 16 }} />
        <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "rgba(250,246,240,0.85)", lineHeight: 1.5, maxWidth: 380, marginBottom: 8 }}>
          {content.quote}
        </p>
        <div style={{ fontSize: 12, color: "rgba(250,246,240,0.5)", letterSpacing: "0.05em" }}>— {content.author}</div>
      </div>
    </div>
  );
}

function LoginForm({ setMode, onLogin }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !pwd) { setError("Merci de remplir tous les champs."); return; }
    setError(""); setLoading(true);
    try {
      await onLogin({ email, password: pwd });
    } catch (err) {
      const msg = err.message || "Erreur de connexion.";
      if (msg.toLowerCase().includes("vérifi")) {
        setError("Compte non vérifié. Vérifiez votre email et cliquez sur le lien reçu.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h2 className="display" style={{ fontSize: 28, color: "var(--ink)", letterSpacing: "-0.02em" }}>Bon retour parmi nous.</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
          Connectez-vous pour reprendre l'écriture.{" "}
          <span style={{ color: "var(--terracotta)", cursor: "pointer", fontWeight: 500 }} onClick={() => setMode("register")}>Créer un compte →</span>
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        <button disabled title="Bientôt disponible" className="btn btn-secondary btn-block" style={{ opacity: 0.5, cursor: "not-allowed" }}><GoogleIcon /> Continuer avec Google</button>
        <button disabled title="Bientôt disponible" className="btn btn-secondary btn-block" style={{ opacity: 0.5, cursor: "not-allowed" }}><FacebookIcon /> Continuer avec Facebook</button>
        <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 2 }}>Social login — bientôt disponible</p>
      </div>
      <Divider label="ou" />
      <form onSubmit={submit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field-group">
          <label className="field-label">Adresse email</label>
          <div className="input-with-icon">
            <Icon name="mail" size={16} />
            <input className="input" type="email" placeholder="vous@exemple.com" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} />
          </div>
        </div>
        <div className="field-group">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <label className="field-label">Mot de passe</label>
            <span style={{ fontSize: 12, color: "var(--terracotta)", cursor: "pointer", fontWeight: 500 }} onClick={() => setMode("forgot")}>Oublié ?</span>
          </div>
          <div className="input-with-icon" style={{ position: "relative" }}>
            <Icon name="lock" size={16} />
            <input className="input" type={showPwd ? "text" : "password"} placeholder="••••••••" value={pwd} onChange={e => { setPwd(e.target.value); setError(""); }} style={{ paddingRight: 40 }} />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", padding: 6, color: "var(--text-muted)" }}>
              <Icon name={showPwd ? "eye-off" : "eye"} size={15} />
            </button>
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", marginTop: -4 }} onClick={() => setRemember(v => !v)}>
          <div style={{ width: 16, height: 16, border: `1.5px solid ${remember ? "var(--ink)" : "var(--border-medium)"}`, background: remember ? "var(--ink)" : "transparent", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
            {remember && <Icon name="check" size={12} color="var(--bg-paper)" strokeWidth={3} />}
          </div>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Se souvenir de moi pendant 30 jours</span>
        </label>
        {error && <ErrorBox text={error} />}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <><Spinner size={14} /> Connexion…</> : <>Se connecter <Icon name="arrow-r" size={15} /></>}
        </button>
      </form>
    </>
  );
}

function RegisterForm({ setMode, setVerifiedEmail }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: "", email: "", language: "fr", pwd: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setError(""); };
  const strength = passwordStrength(form.pwd);

  const goStep2 = () => {
    if (!form.fullName.trim()) { setError("Veuillez entrer votre nom complet."); return; }
    if (!form.email.includes("@")) { setError("Adresse email invalide."); return; }
    setError(""); setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.pwd.length < 8) { setError("Mot de passe trop court (8 caractères minimum)."); return; }
    if (form.pwd !== form.confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (!agree) { setError("Veuillez accepter les conditions."); return; }
    setError(""); setLoading(true);
    try {
      await authApi.register({ email: form.email, password: form.pwd, fullName: form.fullName, language: form.language });
      setVerifiedEmail(form.email);
      setMode("verify-email-sent");
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h2 className="display" style={{ fontSize: 28, color: "var(--ink)", letterSpacing: "-0.02em" }}>Créer votre compte.</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
          Étape {step} sur 2. <span style={{ color: "var(--terracotta)", cursor: "pointer", fontWeight: 500 }} onClick={() => setMode("login")}>Déjà inscrit ? Se connecter →</span>
        </p>
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--ink)" }} />
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: step === 2 ? "var(--ink)" : "var(--bg-soft)", transition: "background 0.3s" }} />
        </div>
      </div>

      {step === 1 && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
            <button disabled title="Bientôt disponible" className="btn btn-secondary btn-block" style={{ opacity: 0.5, cursor: "not-allowed" }}><GoogleIcon /> S'inscrire avec Google</button>
            <button disabled title="Bientôt disponible" className="btn btn-secondary btn-block" style={{ opacity: 0.5, cursor: "not-allowed" }}><FacebookIcon /> S'inscrire avec Facebook</button>
            <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 2 }}>Social login — bientôt disponible</p>
          </div>
          <Divider label="ou avec votre email" />
          <div className="field-group">
            <label className="field-label">Nom complet</label>
            <div className="input-with-icon">
              <Icon name="user" size={16} />
              <input className="input" placeholder="Aïssatou Kaboré" value={form.fullName} onChange={set("fullName")} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Adresse email</label>
            <div className="input-with-icon">
              <Icon name="mail" size={16} />
              <input className="input" type="email" placeholder="vous@exemple.com" value={form.email} onChange={set("email")} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Langue préférée</label>
            <select className="select" value={form.language} onChange={set("language")}>
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
              <option value="wo">Wolof</option>
              <option value="bm">Bambara</option>
            </select>
          </div>
          {error && <ErrorBox text={error} />}
          <button onClick={goStep2} className="btn btn-primary btn-lg btn-block" style={{ marginTop: 8 }}>
            Continuer <Icon name="arrow-r" size={15} />
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={submit} className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: "10px 14px", background: "var(--bg-soft)", borderRadius: "var(--r-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{form.fullName}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{form.email}</div>
            </div>
            <button type="button" onClick={() => setStep(1)} style={{ fontSize: 12, color: "var(--terracotta)", fontWeight: 500 }}>Modifier</button>
          </div>
          <div className="field-group">
            <label className="field-label">Mot de passe</label>
            <div className="input-with-icon" style={{ position: "relative" }}>
              <Icon name="lock" size={16} />
              <input className="input" type={showPwd ? "text" : "password"} placeholder="Min. 8 caractères" value={form.pwd} onChange={set("pwd")} style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", padding: 6, color: "var(--text-muted)" }}>
                <Icon name={showPwd ? "eye-off" : "eye"} size={15} />
              </button>
            </div>
            {form.pwd && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : "var(--bg-soft)", transition: "background 0.2s" }} />
                ))}
                <span style={{ fontSize: 11, color: strength.color, fontWeight: 500, marginLeft: 4, minWidth: 70 }}>{strength.label}</span>
              </div>
            )}
          </div>
          <div className="field-group">
            <label className="field-label">Confirmer le mot de passe</label>
            <input className={`input ${form.confirm && form.confirm !== form.pwd ? "input-error" : ""}`} type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} />
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }} onClick={() => setAgree(v => !v)}>
            <div style={{ width: 16, height: 16, marginTop: 2, border: `1.5px solid ${agree ? "var(--ink)" : "var(--border-medium)"}`, background: agree ? "var(--ink)" : "transparent", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
              {agree && <Icon name="check" size={12} color="var(--bg-paper)" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              J'accepte les <a style={{ color: "var(--terracotta)", fontWeight: 500 }}>conditions d'utilisation</a> et la <a style={{ color: "var(--terracotta)", fontWeight: 500 }}>politique de confidentialité</a>.
            </span>
          </label>
          {error && <ErrorBox text={error} />}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}><Icon name="arrow-l" size={14} /> Retour</button>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <><Spinner size={14} /> Création…</> : <>Créer mon compte <Icon name="arrow-r" size={15} /></>}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

function ForgotForm({ setMode }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await authApi.forgotPassword(email);
      setMode("reset-sent");
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setMode("login")} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, fontSize: 13, color: "var(--text-secondary)" }}>
        <Icon name="arrow-l" size={14} /> Retour à la connexion
      </button>
      <div style={{ marginBottom: 28 }}>
        <h2 className="display" style={{ fontSize: 28, color: "var(--ink)", letterSpacing: "-0.02em" }}>Mot de passe oublié ?</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>
          Pas d'inquiétude. Entrez votre email et nous vous enverrons un lien sécurisé pour le réinitialiser.
        </p>
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="field-group">
          <label className="field-label">Adresse email</label>
          <div className="input-with-icon">
            <Icon name="mail" size={16} />
            <input className="input" type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading || !email}>
          {loading ? <><Spinner size={14} /> Envoi en cours…</> : <>Envoyer le lien <Icon name="send" size={14} /></>}
        </button>
        {error && <ErrorBox text={error} />}
      </form>
    </>
  );
}

function ResetSentView({ setMode }) {
  return (
    <div className="fade-up" style={{ textAlign: "center" }}>
      <div style={{ width: 64, height: 64, margin: "0 auto 20px", borderRadius: "50%", background: "var(--moss-bg)", display: "flex", alignItems: "center", justifyContent: "center", animation: "scaleIn 0.3s var(--ease) 0.1s both" }}>
        <Icon name="mail" size={28} color="var(--moss-deep)" />
      </div>
      <h2 className="display" style={{ fontSize: 26, color: "var(--ink)", marginBottom: 10 }}>Vérifiez votre boîte mail.</h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 340, margin: "0 auto 12px" }}>
        Un lien de réinitialisation a été envoyé à votre adresse. Le lien expire dans <strong>1 heure</strong>.
      </p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 340, margin: "0 auto 28px", lineHeight: 1.6 }}>
        Cliquez sur le lien dans l'email pour choisir un nouveau mot de passe. Si vous ne le voyez pas, vérifiez vos spams.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => setMode("forgot")} className="btn btn-secondary btn-block">Renvoyer le lien</button>
        <button onClick={() => setMode("login")} className="btn btn-ghost btn-block" style={{ fontSize: 13 }}>Retour à la connexion</button>
      </div>
    </div>
  );
}

function NewPwdForm({ setMode, resetToken }) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const strength = passwordStrength(pwd);
  const submit = async (e) => {
    e.preventDefault();
    if (pwd.length < 8) { setError("Mot de passe trop court."); return; }
    if (pwd !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (!resetToken) { setError("Token de réinitialisation manquant. Utilisez le lien reçu par email."); return; }
    setLoading(true); setError("");
    try {
      await authApi.resetPassword({ token: resetToken, newPassword: pwd });
      setMode("done");
    } catch (err) {
      setError(err.message || "Token invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h2 className="display" style={{ fontSize: 28, color: "var(--ink)", letterSpacing: "-0.02em" }}>Nouveau mot de passe.</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>Choisissez un mot de passe fort et unique.</p>
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field-group">
          <label className="field-label">Nouveau mot de passe</label>
          <div className="input-with-icon">
            <Icon name="lock" size={16} />
            <input className="input" type="password" placeholder="Min. 8 caractères" value={pwd} onChange={e => setPwd(e.target.value)} />
          </div>
          {pwd && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : "var(--bg-soft)", transition: "background 0.2s" }} />
              ))}
              <span style={{ fontSize: 11, color: strength.color, fontWeight: 500, marginLeft: 4, minWidth: 70 }}>{strength.label}</span>
            </div>
          )}
        </div>
        <div className="field-group">
          <label className="field-label">Confirmer</label>
          <input className={`input ${confirm && confirm !== pwd ? "input-error" : ""}`} type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        {error && <ErrorBox text={error} />}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <><Spinner size={14} /> Mise à jour…</> : <>Réinitialiser <Icon name="check" size={15} /></>}
        </button>
      </form>
    </>
  );
}

function VerifyEmailSentView({ setMode, email }) {
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try { await authApi.resendVerification(email); } catch { /* best-effort */ }
    finally { setResending(false); setResendDone(true); }
  };

  return (
    <div className="fade-up" style={{ textAlign: "center" }}>
      <div style={{ width: 64, height: 64, margin: "0 auto 20px", borderRadius: "50%", background: "var(--moss-bg)", display: "flex", alignItems: "center", justifyContent: "center", animation: "scaleIn 0.3s var(--ease) 0.1s both" }}>
        <Icon name="mail" size={28} color="var(--moss-deep)" />
      </div>
      <h2 className="display" style={{ fontSize: 26, color: "var(--ink)", marginBottom: 10 }}>Vérifiez votre boite mail.</h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 340, margin: "0 auto 8px" }}>
        Un lien de confirmation a été envoyé à <strong>{email}</strong>.
      </p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28 }}>Le lien expire dans <strong>24 heures</strong>.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {resendDone
          ? <div style={{ padding: "10px 14px", background: "var(--moss-bg)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--moss-deep)", display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
              <Icon name="check" size={15} /> Email renvoyé !
            </div>
          : <button onClick={handleResend} disabled={resending} className="btn btn-secondary btn-block">
              {resending ? <><Spinner size={13} /> Envoi…</> : <>Renvoyer l'email <Icon name="send" size={14} /></>}
            </button>
        }
        <button onClick={() => setMode("login")} className="btn btn-ghost btn-block" style={{ fontSize: 13 }}>Retour à la connexion</button>
      </div>
    </div>
  );
}

function DoneView({ setMode }) {
  return (
    <div className="fade-up" style={{ textAlign: "center" }}>
      <div style={{ width: 64, height: 64, margin: "0 auto 20px", borderRadius: "50%", background: "var(--moss)", display: "flex", alignItems: "center", justifyContent: "center", animation: "scaleIn 0.3s var(--ease) both" }}>
        <Icon name="check" size={32} color="var(--bg-paper)" strokeWidth={3} />
      </div>
      <h2 className="display" style={{ fontSize: 26, color: "var(--ink)", marginBottom: 10 }}>Mot de passe réinitialisé.</h2>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6, maxWidth: 340, margin: "0 auto 28px" }}>
        Vos sessions actives ont été déconnectées. Reconnectez-vous avec votre nouveau mot de passe.
      </p>
      <button onClick={() => setMode("login")} className="btn btn-primary btn-lg btn-block">
        Se connecter <Icon name="arrow-r" size={15} />
      </button>
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: "var(--border-soft)" }} />
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border-soft)" }} />
    </div>
  );
}

function ErrorBox({ text }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "var(--terracotta-bg)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--terracotta-deep)", animation: "fadeUp 0.2s both" }}>
      <Icon name="alert" size={16} /> {text}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
