export const eur = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`;

export const eurSigned = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n)).toLocaleString('fr-FR')} €`;

export const compactEur = (n: number) => {
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (a >= 1e6) return `${sign}${(a / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M€`;
  if (a >= 1e4) return `${sign}${Math.round(a / 1e3).toLocaleString('fr-FR')} k€`;
  return `${sign}${Math.round(a).toLocaleString('fr-FR')} €`;
};

export const pct = (n: number, digits = 0) => `${(n * 100).toLocaleString('fr-FR', { maximumFractionDigits: digits })} %`;

export const years = (n: number) => `${n} an${n > 1 ? 's' : ''}`;
