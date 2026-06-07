import { Icon } from "../components/Icon";
import { ProgressRing } from "../components/Shared";
import { WRITING_STATS, BOOKS } from "../utils/mockData";

export default function StatsPage() {
  const totalWords = BOOKS.reduce((a, b) => a + b.wordCount, 0);
  const totalPages = BOOKS.reduce((a, b) => a + b.pageCount, 0);

  return (
    <div>
      <div className="page-header fade-up">
        <div>
          <div className="page-eyebrow">Progression</div>
          <h1 className="page-title">Vos <em>statistiques</em> d'écriture</h1>
          <p className="page-subtitle">Mesurez votre progression mot après mot.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="select" style={{ width: 160 }}>
            <option>Cette semaine</option>
            <option>Ce mois</option>
            <option>Cette année</option>
            <option>Tout</option>
          </select>
          <button className="btn btn-secondary"><Icon name="download" size={13} /> Exporter</button>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid-4 fade-up" data-stagger="1" style={{ marginBottom: 28 }}>
        {[
          { label: "Mots écrits", value: WRITING_STATS.totalWords.toLocaleString('fr-FR'), trend: "+12% vs sem. dernière", icon: "feather", color: "terracotta" },
          { label: "Streak actuel", value: WRITING_STATS.currentStreak, suffix: "jours", trend: "Record personnel !", icon: "flame", color: "ochre" },
          { label: "Temps d'écriture", value: `${Math.floor(WRITING_STATS.totalMinutes / 60)}h ${WRITING_STATS.totalMinutes % 60}m`, trend: "Cette semaine", icon: "clock", color: "indigo" },
          { label: "Meilleur jour", value: WRITING_STATS.bestDay.wordsWritten, suffix: "mots", trend: "Samedi", icon: "trending", color: "moss" },
        ].map((s, i) => (
          <div key={i} className="card card-padded" style={{ animation: `fadeUp 0.4s ${i * 0.05}s var(--ease) both` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <span className="stat-label">{s.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", background: `var(--${s.color}-bg)`, color: `var(--${s.color})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} size={14} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span className="stat-value" style={{ fontSize: 32 }}>{s.value}</span>
              {s.suffix && <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{s.suffix}</span>}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>{s.trend}</div>
          </div>
        ))}
      </div>

      {/* Graphique semaine */}
      <div className="grid-2-side fade-up" data-stagger="2" style={{ marginBottom: 28 }}>
        <div className="card card-padded">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h3 className="display" style={{ fontSize: 18, color: "var(--ink)" }}>Activité quotidienne</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>7 derniers jours · Mots écrits</p>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, background: "var(--terracotta)", borderRadius: 2 }} /> Mots
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, background: "var(--moss)", borderRadius: 2 }} /> Temps
              </span>
            </div>
          </div>
          <BigChart data={WRITING_STATS.weekly} />
        </div>

        <div className="card card-padded">
          <h3 className="display" style={{ fontSize: 17, color: "var(--ink)", marginBottom: 16 }}>Objectif mensuel</h3>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0" }}>
            <ProgressRing value={68} size={140} strokeWidth={10} />
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>20 400 sur 30 000 mots</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>9 600 mots restants · 12 jours restants</div>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text-secondary)" }}>Rythme nécessaire</span>
              <strong style={{ color: "var(--ink)" }}>800 mots/jour</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text-secondary)" }}>Votre rythme actuel</span>
              <strong style={{ color: "var(--moss)" }}>643 mots/jour</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Progression par livre + Heatmap */}
      <div className="grid-2-side fade-up" data-stagger="3">
        <div className="card card-padded">
          <h3 className="display" style={{ fontSize: 17, color: "var(--ink)", marginBottom: 16 }}>Mots par livre</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {WRITING_STATS.byBook.map(b => {
              const book = BOOKS.find(x => x.id === b.bookId);
              return (
                <div key={b.bookId}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: book?.coverColor }} />
                      <span style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{b.title}</span>
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <strong style={{ color: "var(--ink)" }}>{b.words.toLocaleString('fr-FR')}</strong>
                      <span style={{ color: "var(--text-muted)" }}> mots</span>
                    </div>
                  </div>
                  <div className="progress" style={{ height: 6 }}>
                    <div className="progress-bar" style={{
                      width: `${(b.words / WRITING_STATS.totalWords) * 100}%`,
                      background: book?.coverColor,
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {b.minutes} minutes d'écriture · {Math.round(b.words / b.minutes)} mots/min
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card card-padded">
          <h3 className="display" style={{ fontSize: 17, color: "var(--ink)", marginBottom: 16 }}>Bibliothèque totale</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Stat label="Total mots écrits" value={totalWords.toLocaleString('fr-FR')} />
            <Stat label="Total pages" value={totalPages.toLocaleString('fr-FR')} />
            <Stat label="Livres créés" value={BOOKS.length} />
            <Stat label="Livres publiés" value={BOOKS.filter(b => b.status === "PUBLISHED").length} />
            <Stat label="Chapitres écrits" value={BOOKS.reduce((a, b) => a + b.chapters, 0)} />
          </div>
          <div className="divider" />
          <div style={{ padding: "12px 14px", background: "var(--moss-bg)", borderRadius: "var(--r-sm)", fontSize: 12.5, color: "var(--moss-deep)", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Icon name="info" size={14} />
            <span>Vous écrivez en moyenne <strong>643 mots/jour</strong> — c'est l'équivalent de <strong>2.5 pages</strong>. Au rythme actuel, votre prochain livre sera terminé dans <strong>environ 6 semaines</strong>.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-soft)" }}>
      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
      <span className="display" style={{ fontSize: 18, color: "var(--ink)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function BigChart({ data }) {
  const max = Math.max(...data.map(d => d.words));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, height: 220, padding: "8px 0" }}>
      {data.map((d, i) => {
        const isToday = i === data.length - 2;
        const h = max > 0 ? (d.words / max) * 180 : 0;
        const minH = max > 0 ? (d.minutes / Math.max(...data.map(x => x.minutes))) * 180 : 0;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, height: 180 }}>
              <div style={{
                width: "35%", height: `${h}px`, minHeight: 4,
                background: isToday ? "var(--terracotta)" : "var(--terracotta-bg)",
                borderRadius: "var(--r-xs) var(--r-xs) 0 0",
                transition: "height 0.6s var(--ease)",
                animation: `fadeUp 0.5s ${0.1 + i * 0.05}s var(--ease) both`,
              }} title={`${d.words} mots`} />
              <div style={{
                width: "35%", height: `${minH}px`, minHeight: 4,
                background: isToday ? "var(--moss)" : "var(--moss-bg)",
                borderRadius: "var(--r-xs) var(--r-xs) 0 0",
                transition: "height 0.6s var(--ease)",
                animation: `fadeUp 0.5s ${0.15 + i * 0.05}s var(--ease) both`,
              }} title={`${d.minutes} minutes`} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11.5, color: isToday ? "var(--ink)" : "var(--text-muted)", fontWeight: isToday ? 500 : 400 }}>{d.day}</div>
              <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 2 }}>{d.words}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
