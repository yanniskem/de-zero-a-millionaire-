import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { Delta } from '../../engine/types';
import { eur } from '../format';
import { Icon } from './Icon';

// ---------- Fenêtre modale accessible ----------

export function Modal({ title, children, onClose, wide, labelledBy }: { title?: string; children: ReactNode; onClose?: () => void; wide?: boolean; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>('[data-autofocus], button:not([disabled]), [href], input, select');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
      if (e.key === 'Tab' && el) {
        const items = [...el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} className={`sheet${wide ? ' sheet-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy ?? (title ? titleId : undefined)}>
        {(title || onClose) && (
          <div className="row-between" style={{ marginBottom: '0.75rem' }}>
            {title ? <h2 id={titleId} style={{ margin: 0, fontSize: '1.4rem' }}>{title}</h2> : <span />}
            {onClose && (
              <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fermer">
                <Icon name="close" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: { title: string; message: ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="event-text">{message}</div>
      <div className="btn-row" style={{ marginTop: '1.2rem', justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onCancel} data-autofocus>Annuler</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

// ---------- Jauges ----------

export function StatBar({ label, value, icon, color, hint }: { label: string; value: number; icon?: string; color?: string; hint?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const c = color ?? (v >= 65 ? 'var(--green)' : v >= 35 ? 'var(--gold)' : 'var(--red)');
  return (
    <div className="stat" title={hint}>
      <div className="stat-head">
        <span className="row" style={{ gap: '0.4rem' }}>
          {icon && <Icon name={icon} size={16} />}
          {label}
        </span>
        <span className="num" style={{ fontWeight: 700 }}>{v}<span className="muted">/100</span></span>
      </div>
      <div className="stat-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
        <div className="stat-fill" style={{ width: `${v}%`, background: c }} />
      </div>
    </div>
  );
}

export function Deltas({ deltas }: { deltas: Delta[] }) {
  if (!deltas.length) return <p className="muted" style={{ fontSize: '0.88rem' }}>Aucun changement mesurable.</p>;
  // Le patrimoine net résume déjà l'argent : on évite les doublons visuels.
  const shown = deltas.filter((d) => !(d.label === 'Patrimoine net' && deltas.some((x) => x.label === 'Argent disponible' && x.value === d.value)));
  return (
    <div className="chips" aria-label="Conséquences">
      {shown.map((d) => {
        const good = d.label === 'Dettes' ? d.value < 0 : d.value > 0;
        const v = d.unit === '€' ? `${d.value > 0 ? '+' : '−'}${eur(Math.abs(d.value))}` : `${d.value > 0 ? '+' : '−'}${Math.abs(d.value)}`;
        return (
          <span key={d.label} className={`chip ${good ? 'up' : 'down'}`}>
            {d.label} {v}
          </span>
        );
      })}
    </div>
  );
}

export function MoneyTile({ label, value, tone, sub }: { label: string; value: string; tone?: 'pos' | 'neg' | 'gold'; sub?: string }) {
  return (
    <div className="money-tile">
      <div className="label">{label}</div>
      <div className={`value ${tone ?? ''}`}>{value}</div>
      {sub && <div className="muted" style={{ fontSize: '0.78rem' }}>{sub}</div>}
    </div>
  );
}

// ---------- Saisie d'un montant ----------

export function AmountForm({ max, label, action, onSubmit, presets = true, min = 0 }: { max: number; label: string; action: string; onSubmit: (n: number) => void; presets?: boolean; min?: number }) {
  const [value, setValue] = useState('');
  const id = useId();
  const n = Math.round(Number(value.replace(/\s/g, '').replace(',', '.')));
  const valid = Number.isFinite(n) && n > min && n <= Math.floor(max);
  return (
    <form
      className="stack"
      style={{ gap: '0.4rem' }}
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) {
          onSubmit(n);
          setValue('');
        }
      }}
    >
      <label htmlFor={id} className="label">{label} <span className="muted">(max {eur(Math.max(0, max))})</span></label>
      <div className="amount-form">
        <input id={id} className="input" inputMode="numeric" placeholder="Montant en €" value={value} onChange={(e) => setValue(e.target.value)} />
        <button className="btn btn-primary" type="submit" disabled={!valid}>{action}</button>
      </div>
      {presets && max > 0 && (
        <div className="btn-row">
          {[0.25, 0.5, 1].map((f) => (
            <button key={f} type="button" className="btn btn-sm" onClick={() => setValue(String(Math.floor(max * f)))}>
              {f === 1 ? 'Tout' : `${f * 100} %`}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

// ---------- Graphique linéaire SVG (léger, sans dépendance) ----------

export interface Series {
  label: string;
  color: string;
  values: { x: number; y: number }[];
}

export function LineChart({ series, height = 180, format, title }: { series: Series[]; height?: number; format: (n: number) => string; title: string }) {
  const W = 600;
  const H = height;
  const pad = { l: 64, r: 12, t: 12, b: 26 };
  const all = series.flatMap((s) => s.values);
  if (all.length < 2) return <p className="empty">Le graphique apparaîtra après ta première année.</p>;
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  let yMin = Math.min(0, ...ys);
  let yMax = Math.max(...ys);
  if (yMax === yMin) yMax = yMin + 1;
  const span = yMax - yMin;
  yMax += span * 0.05;
  yMin -= yMin < 0 ? span * 0.05 : 0;
  const sx = (x: number) => pad.l + ((x - xMin) / Math.max(1, xMax - xMin)) * (W - pad.l - pad.r);
  const sy = (y: number) => pad.t + (1 - (y - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  const ticks = [yMin, yMin + (yMax - yMin) / 2, yMax];
  const last = series.map((s) => s.values[s.values.length - 1]).filter(Boolean);
  return (
    <figure style={{ margin: 0 }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. Dernière valeur : ${last.map((p, i) => `${series[i].label} ${format(p.y)}`).join(', ')}`}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} stroke="rgba(255,255,255,0.07)" />
            <text x={pad.l - 8} y={sy(t) + 4} textAnchor="end" fontSize="11" fill="#9aa1b0">{format(t)}</text>
          </g>
        ))}
        {yMin < 0 && <line x1={pad.l} x2={W - pad.r} y1={sy(0)} y2={sy(0)} stroke="rgba(255,138,128,0.4)" strokeDasharray="4 4" />}
        <text x={pad.l} y={H - 6} fontSize="11" fill="#9aa1b0">{xMin} ans</text>
        <text x={W - pad.r} y={H - 6} fontSize="11" fill="#9aa1b0" textAnchor="end">{xMax} ans</text>
        {series.map((s) => {
          const d = s.values.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
          const lastP = s.values[s.values.length - 1];
          return (
            <g key={s.label}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {lastP && <circle cx={sx(lastP.x)} cy={sy(lastP.y)} r="4" fill={s.color} />}
            </g>
          );
        })}
      </svg>
      {series.length > 1 && (
        <figcaption className="chart-legend">
          {series.map((s) => (
            <span key={s.label}><span className="legend-dot" style={{ background: s.color }} />{s.label}</span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
