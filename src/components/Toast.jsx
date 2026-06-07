import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { Icon } from './Icon';

const ToastContext = createContext(null);

const CONFIG = {
  success: { bg: 'var(--moss-bg)', color: 'var(--moss-deep)', iconBg: 'var(--moss)', icon: 'check' },
  error:   { bg: 'var(--terracotta-bg)', color: 'var(--terracotta-deep)', iconBg: 'var(--terracotta)', icon: 'x' },
  warning: { bg: 'var(--ochre-bg)', color: '#8A6020', iconBg: 'var(--ochre)', icon: 'alert' },
  info:    { bg: 'var(--indigo-bg)', color: 'var(--indigo)', iconBg: 'var(--indigo)', icon: 'info' },
};

function ToastItem({ id, message, type, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const c = CONFIG[type] || CONFIG.info;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(id), 280);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '11px 14px',
      background: c.bg,
      border: `1px solid ${c.bg}`,
      borderRadius: 'var(--r-md)',
      boxShadow: 'var(--shadow-lg)',
      maxWidth: 360, minWidth: 260,
      transform: visible ? 'translateX(0)' : 'translateX(110%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.28s var(--ease), opacity 0.28s ease',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        background: c.iconBg, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        <Icon name={c.icon} size={11} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, fontSize: 13.5, color: c.color, lineHeight: 1.45 }}>{message}</div>
      <button onClick={dismiss} style={{ color: c.color, opacity: 0.55, padding: 2, flexShrink: 0, marginTop: 1 }}>
        <Icon name="x" size={13} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => add(msg, 'success', dur),
    error:   (msg, dur) => add(msg, 'error', dur ?? 5500),
    info:    (msg, dur) => add(msg, 'info', dur),
    warning: (msg, dur) => add(msg, 'warning', dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { toast: { success: () => {}, error: () => {}, info: () => {}, warning: () => {} } };
  }
  return ctx;
}
