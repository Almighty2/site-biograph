import { useState } from "react";
import { Icon } from "../components/Icon";
import { Avatar } from "../components/Shared";
import { Spinner } from "../components/Shared";
import { REMINDERS, BOOKS, STATUS_LABELS } from "../utils/mockData";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../utils/api";

export default function SettingsPage({ onLogout }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("profile");

  return (
    <div>
      <div className="page-header fade-up">
        <div>
          <div className="page-eyebrow">Configuration</div>
          <h1 className="page-title">Vos <em>paramètres</em></h1>
          <p className="page-subtitle">Personnalisez votre expérience Biograf AI.</p>
        </div>
      </div>

      <div className="tabs fade-up" data-stagger="1">
        {[
          ["profile", "Profil"], ["reminders", "Rappels"],
          ["plan", "Forfait"], ["security", "Sécurité"],
        ].map(([k, l]) => (
          <div key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</div>
        ))}
      </div>

      {tab === "profile"   && <ProfileTab user={user} />}
      {tab === "reminders" && <RemindersTab />}
      {tab === "plan"      && <PlanTab user={user} />}
      {tab === "security"  && <SecurityTab onLogout={onLogout} user={user} />}
    </div>
  );
}

function ProfileTab({ user }) {
  const { updateLocalUser } = useAuth();

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    bio:      user?.bio      || "",
    language: user?.language || "fr",
    timezone: user?.timezone || "Africa/Abidjan",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setSuccess(false); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError("Le nom complet est requis."); return; }
    setLoading(true); setError(""); setSuccess(false);
    try {
      const res = await authApi.updateUser(user.id, form);
      updateLocalUser(res.user);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  const code      = user?.code      || "—";
  const plan      = user?.plan      || "FREE";
  const createdAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="fade-up grid-2-side" style={{ alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <form className="card card-padded" onSubmit={handleSubmit}>
          <h3 className="display" style={{ fontSize: 17, marginBottom: 18 }}>Informations personnelles</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
            <Avatar name={form.fullName || user?.email} size="lg" />
            <div>
              <button type="button" className="btn btn-secondary btn-sm">Changer la photo</button>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6 }}>JPG ou PNG · max 2 Mo</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field-group">
                <label className="field-label">Nom complet</label>
                <input className="input" value={form.fullName} onChange={set("fullName")} />
              </div>
              <div className="field-group">
                <label className="field-label">Email</label>
                <input className="input" type="email" value={user?.email || ""} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Biographie</label>
              <textarea className="textarea" value={form.bio} onChange={set("bio")} rows={3} style={{ minHeight: 80 }} />
              <div className="field-hint">Apparaîtra sur la page publique de vos livres publiés.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field-group">
                <label className="field-label">Langue préférée</label>
                <select className="select" value={form.language} onChange={set("language")}>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="wo">Wolof</option>
                  <option value="bm">Bambara</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Fuseau horaire</label>
                <select className="select" value={form.timezone} onChange={set("timezone")}>
                  <option value="Africa/Abidjan">Africa/Abidjan</option>
                  <option value="Africa/Dakar">Africa/Dakar</option>
                  <option value="Africa/Lagos">Africa/Lagos</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                </select>
              </div>
            </div>
            {error   && <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "var(--terracotta-bg)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--terracotta-deep)" }}><Icon name="alert" size={15} /> {error}</div>}
            {success && <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "var(--moss-bg)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--moss-deep)" }}><Icon name="check" size={15} /> Profil mis à jour avec succès.</div>}
            <div className="divider" />
            <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={loading}>
              {loading ? <><Spinner size={13} /> Enregistrement…</> : <>Enregistrer les modifications</>}
            </button>
          </div>
        </form>
      </div>

      <div className="card card-padded">
        <h3 className="display" style={{ fontSize: 16, marginBottom: 14 }}>Compte</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Stat label="Code utilisateur" value={code} mono />
          <Stat label="Membre depuis" value={createdAt} />
          <Stat label="Forfait" value={plan} badge />
          <Stat label="Livres créés" value={BOOKS.length} />
          <Stat label="Mots écrits" value={BOOKS.reduce((a, b) => a + b.wordCount, 0).toLocaleString("fr-FR")} />
        </div>
      </div>
    </div>
  );
}

function RemindersTab() {
  const [list, setList] = useState(REMINDERS);
  const toggle = (id) => setList(l => l.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));

  return (
    <div className="fade-up">
      <div className="card card-padded" style={{ marginBottom: 20 }}>
        <h3 className="display" style={{ fontSize: 17, marginBottom: 6 }}>Rappels d'écriture</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          Recevez des notifications pour maintenir votre régularité d'écriture.
        </p>
        <button className="btn btn-accent btn-sm">
          <Icon name="plus" size={13} /> Nouveau rappel
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {list.map((r, i) => (
          <div key={r.id} style={{
            display: "flex", alignItems: "center", gap: 16, padding: 18,
            borderBottom: i < list.length - 1 ? "1px solid var(--border-soft)" : "none",
            opacity: r.isActive ? 1 : 0.6, transition: "opacity 0.15s",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: r.isActive ? "var(--terracotta-bg)" : "var(--bg-soft)", color: r.isActive ? "var(--terracotta)" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="bell" size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 15, color: "var(--ink)" }}>
                {r.bookTitle || "Tous les livres"}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                {STATUS_LABELS[r.frequency]} à {r.time}
              </div>
            </div>
            <div onClick={() => toggle(r.id)} className={`switch ${r.isActive ? "switch-on" : ""}`} />
            <button className="icon-btn"><Icon name="more" size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanTab() {
  const plans = [
    { id: "FREE", name: "Découverte", price: "0", priceUnit: "Gratuit",
      features: ["3 livres maximum", "Export PDF basique", "5 suggestions IA / mois", "Support par email"],
      current: false },
    { id: "PRO", name: "Pro", price: "4 900", priceUnit: "XOF / mois",
      features: ["Livres illimités", "Tous les exports (PDF, EPUB, DOCX)", "100 suggestions IA / mois", "Audio narration incluse", "Ancrage blockchain (3/mois)", "Support prioritaire"],
      current: true, highlight: true },
    { id: "TEAM", name: "Équipe", price: "12 000", priceUnit: "XOF / mois",
      features: ["Tout de Pro", "Jusqu'à 5 collaborateurs", "Espace de travail partagé", "API d'export", "Manager dédié"],
      current: false },
    { id: "ENTERPRISE", name: "Entreprise", price: "Sur devis", priceUnit: "",
      features: ["Tout de Équipe", "Utilisateurs illimités", "API complète", "SLA 99.9%", "Onboarding sur mesure"],
      current: false },
  ];

  return (
    <div className="fade-up">
      <div className="grid-4">
        {plans.map((p, i) => (
          <div key={p.id} className="card" style={{
            padding: 24,
            border: p.current ? "2px solid var(--terracotta)" : p.highlight ? "1px solid var(--border-medium)" : "1px solid var(--border-soft)",
            background: p.current ? "linear-gradient(135deg, var(--terracotta-bg) 0%, var(--bg-paper) 100%)" : "var(--bg-paper)",
            position: "relative", display: "flex", flexDirection: "column",
            animation: `fadeUp 0.4s ${i * 0.06}s var(--ease) both`,
          }}>
            {p.current && (
              <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)" }}>
                <span className="badge badge-terracotta" style={{ background: "var(--terracotta)", color: "white" }}>
                  <Icon name="check" size={10} /> Actuel
                </span>
              </div>
            )}
            <div className="display" style={{ fontSize: 18, color: "var(--ink)", marginBottom: 4 }}>{p.name}</div>
            <div style={{ marginBottom: 16 }}>
              <span className="display" style={{ fontSize: 28, color: "var(--ink)", fontWeight: 500 }}>{p.price}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>{p.priceUnit}</span>
            </div>
            <ul style={{ listStyle: "none", flex: 1, display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {p.features.map((f, j) => (
                <li key={j} style={{ display: "flex", gap: 8, fontSize: 12.5, color: "var(--text-secondary)" }}>
                  <Icon name="check" size={13} color="var(--moss)" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {p.current ? (
              <button className="btn btn-secondary btn-block" disabled>Forfait actuel</button>
            ) : (
              <button className={`btn btn-block ${p.highlight ? "btn-accent" : "btn-secondary"}`}>
                {p.id === "ENTERPRISE" ? "Nous contacter" : "Choisir ce forfait"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityTab({ onLogout, user }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError,   setPwdError]   = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const setPwd = (k) => (e) => { setPwdForm(f => ({ ...f, [k]: e.target.value })); setPwdError(""); setPwdSuccess(false); };

  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (!pwdForm.current) { setPwdError("Saisissez votre mot de passe actuel."); return; }
    if (pwdForm.next.length < 8) { setPwdError("Le nouveau mot de passe doit faire au moins 8 caractères."); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError("Les mots de passe ne correspondent pas."); return; }
    setPwdLoading(true); setPwdError(""); setPwdSuccess(false);
    try {
      await authApi.changePassword(user.id, { currentPassword: pwdForm.current, newPassword: pwdForm.next });
      setPwdSuccess(true);
      setPwdForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwdError(err.message || "Erreur lors du changement de mot de passe.");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm) { setConfirm(true); return; }
    setLoggingOut(true);
    try { await onLogout(); } catch { setLoggingOut(false); setConfirm(false); }
  };

  return (
    <div className="fade-up grid-2-side" style={{ alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <form className="card card-padded" onSubmit={handleChangePwd}>
          <h3 className="display" style={{ fontSize: 17, marginBottom: 6 }}>Mot de passe</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            Changez régulièrement votre mot de passe pour sécuriser votre compte.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="field-group"><label className="field-label">Mot de passe actuel</label><input className="input" type="password" value={pwdForm.current} onChange={setPwd("current")} /></div>
            <div className="field-group"><label className="field-label">Nouveau mot de passe</label><input className="input" type="password" value={pwdForm.next} onChange={setPwd("next")} /></div>
            <div className="field-group"><label className="field-label">Confirmer</label><input className={`input ${pwdForm.confirm && pwdForm.confirm !== pwdForm.next ? "input-error" : ""}`} type="password" value={pwdForm.confirm} onChange={setPwd("confirm")} /></div>
            {pwdError   && <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "var(--terracotta-bg)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--terracotta-deep)" }}><Icon name="alert" size={15} /> {pwdError}</div>}
            {pwdSuccess && <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "var(--moss-bg)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--moss-deep)" }}><Icon name="check" size={15} /> Mot de passe modifié avec succès.</div>}
            <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 4 }} disabled={pwdLoading}>
              {pwdLoading ? <><Spinner size={13} /> Modification…</> : <><Icon name="lock" size={13} /> Modifier le mot de passe</>}
            </button>
          </div>
        </form>

        <div className="card card-padded">
          <h3 className="display" style={{ fontSize: 17, marginBottom: 6 }}>Sessions actives</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>Appareils connectés à votre compte.</p>
          {[
            { device: "Session actuelle", location: user?.email || "", current: true, lastSeen: "Maintenant" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0" }}>
              <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--bg-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="lock" size={16} color="var(--text-secondary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{s.device}</span>
                  {s.current && <span className="badge badge-moss" style={{ fontSize: 10 }}>Cette session</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{s.location} · {s.lastSeen}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-padded" style={{ borderColor: "var(--terracotta-bg)", background: "linear-gradient(135deg, var(--terracotta-bg) 0%, var(--bg-paper) 100%)" }}>
        <h3 className="display" style={{ fontSize: 17, color: "var(--terracotta-deep)", marginBottom: 6 }}>Zone de danger</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.6 }}>
          Ces actions sont irréversibles. Procédez avec précaution.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {confirm && (
            <div style={{ padding: "12px 14px", background: "var(--terracotta-bg)", border: "1px solid var(--terracotta)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--terracotta-deep)", marginBottom: 4 }}>
              <strong>Confirmer la déconnexion ?</strong> Vous serez redirigé vers la page de connexion.
            </div>
          )}
          <button
            className="btn btn-secondary btn-block"
            onClick={handleLogout}
            disabled={loggingOut}
            style={confirm ? { borderColor: "var(--terracotta)", color: "var(--terracotta-deep)" } : {}}
          >
            {loggingOut
              ? <><Spinner size={13} /> Déconnexion…</>
              : confirm
                ? <><Icon name="check" size={13} /> Confirmer la déconnexion</>
                : <><Icon name="logout" size={13} /> Se déconnecter</>}
          </button>
          {confirm && (
            <button className="btn btn-ghost btn-block" onClick={() => setConfirm(false)} style={{ fontSize: 13 }}>Annuler</button>
          )}
          <button className="btn btn-danger btn-block">
            <Icon name="download" size={13} /> Exporter toutes mes données
          </button>
          <button className="btn btn-danger btn-block">
            <Icon name="trash" size={13} /> Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, mono, badge }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-soft)" }}>
      <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}</span>
      {badge ? (
        <span className="badge badge-terracotta">{value}</span>
      ) : (
        <span style={{ fontSize: 13, color: "var(--ink)", fontFamily: mono ? "var(--font-mono)" : undefined, fontWeight: 500 }}>{value}</span>
      )}
    </div>
  );
}
