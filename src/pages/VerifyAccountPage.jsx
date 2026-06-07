import { useState, useEffect } from 'react';
import { authApi } from '../utils/api';
import { Icon } from '../components/Icon';
import { Spinner } from '../components/Shared';

// ─── Page de vérification de compte ────────────────────────────────────────
// Appelée quand l'utilisateur clique sur le lien dans l'email :
// http://localhost:5173/?page=verify-account&token=abc123

export default function VerifyAccountPage({ token, onGoLogin }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Lien de vérification manquant ou invalide.');
      return;
    }

    authApi.verifyAccount(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.message || 'Token invalide ou expiré.');
      });
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.includes('@')) return;
    setResending(true);
    try {
      await authApi.resendVerification(resendEmail);
      setResendDone(true);
    } catch {
      setResendDone(true); // toujours afficher succès pour ne pas exposer les emails
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'var(--bg-paper)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border-soft)',
        padding: '48px 40px',
        textAlign: 'center',
        animation: 'fadeUp 0.4s var(--ease) both',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
          <div className="sidebar-brand-mark" style={{ width: 36, height: 36, fontSize: 20 }}>B</div>
          <div className="sidebar-brand-text" style={{ fontSize: 19 }}>Biograf <em>AI</em></div>
        </div>

        {/* Chargement */}
        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <Spinner size={36} />
            <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>Vérification en cours…</p>
          </div>
        )}

        {/* Succès */}
        {status === 'success' && (
          <div className="fade-up">
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--moss-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              animation: 'scaleIn 0.35s var(--ease) 0.1s both',
            }}>
              <Icon name="check" size={34} color="var(--moss-deep)" strokeWidth={2.5} />
            </div>
            <h1 className="display" style={{ fontSize: 26, color: 'var(--ink)', marginBottom: 12 }}>
              Compte vérifié !
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32, maxWidth: 320, margin: '0 auto 32px' }}>
              Votre adresse email a été confirmée avec succès. Vous pouvez maintenant vous connecter et commencer à écrire.
            </p>
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={onGoLogin}
            >
              Se connecter <Icon name="arrow-r" size={15} />
            </button>
          </div>
        )}

        {/* Erreur */}
        {status === 'error' && (
          <div className="fade-up">
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--terracotta-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              animation: 'scaleIn 0.35s var(--ease) 0.1s both',
            }}>
              <Icon name="alert" size={34} color="var(--terracotta-deep)" />
            </div>
            <h1 className="display" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 10 }}>
              Lien invalide ou expiré
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32, maxWidth: 320, margin: '0 auto 28px' }}>
              {errorMsg} Les liens de vérification expirent après <strong>24 heures</strong>.
            </p>

            {/* Renvoi de l'email */}
            {resendDone ? (
              <div style={{
                padding: '14px 16px',
                background: 'var(--moss-bg)',
                borderRadius: 'var(--r-md)',
                fontSize: 13,
                color: 'var(--moss-deep)',
                marginBottom: 20,
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="check" size={15} />
                Email envoyé ! Vérifiez votre boîte de réception.
              </div>
            ) : (
              <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'left' }}>
                  Recevoir un nouveau lien :
                </p>
                <div className="input-with-icon">
                  <Icon name="mail" size={16} />
                  <input
                    className="input"
                    type="email"
                    placeholder="votre@email.com"
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-secondary btn-block"
                  disabled={resending || !resendEmail.includes('@')}
                >
                  {resending ? <><Spinner size={13} /> Envoi…</> : <>Renvoyer le lien <Icon name="send" size={14} /></>}
                </button>
              </form>
            )}

            <button onClick={onGoLogin} className="btn btn-ghost btn-block" style={{ fontSize: 13 }}>
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
