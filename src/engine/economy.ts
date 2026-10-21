// Système économique : budget mensuel, impôts, dettes, patrimoine.
// Ces fonctions sont pures (hors helpers explicitement « mutate ») et testées indépendamment de l'interface.

import {
  CHILD_MONTHLY_COST,
  HOUSING_BY_ID,
  JOB_BY_ID,
  LIFESTYLES,
  SECTOR_BY_ID,
  SMIC_BRUT,
} from './catalog';
import type { BudgetLine, Business, Debt, DebtKind, GameState } from './types';

export const NET_RATIO = 0.78; // brut -> net (cotisations salariales simplifiées)
export const APPRENTICE_NET = 1050;
export const SIDE_GIG_NET = 450;
export const RSA_AMOUNT = 620;
export const OVERDRAFT_RATE = 0.16;
export const FOUNDER_CHARGES = 1.45; // coût employeur d'un euro net versé au dirigeant

export const round = (n: number) => Math.round(n);
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

/** Mensualité d'un prêt amortissable classique. */
export function loanPayment(amount: number, annualRate: number, years: number): number {
  const n = Math.max(1, Math.round(years * 12));
  const r = annualRate / 12;
  if (r === 0) return amount / n;
  return (amount * r) / (1 - Math.pow(1 + r, -n));
}

/** Barème progressif simplifié de l'impôt sur le revenu (par part). */
export const TAX_BRACKETS: [number, number][] = [
  [11497, 0],
  [29315, 0.11],
  [83823, 0.3],
  [180294, 0.41],
  [Infinity, 0.45],
];

export function taxForOnePart(taxable: number): number {
  let tax = 0;
  let lower = 0;
  for (const [upper, rate] of TAX_BRACKETS) {
    if (taxable > lower) tax += (Math.min(taxable, upper) - lower) * rate;
    lower = upper;
  }
  return tax;
}

export function activeChildren(s: GameState): number {
  return s.relations.childrenBirthAges.filter((b) => s.age - b < 20).length;
}

export function taxParts(s: GameState): number {
  let parts = s.relations.partner?.married ? 2 : 1;
  const kids = activeChildren(s);
  parts += Math.min(kids, 2) * 0.5 + Math.max(0, kids - 2);
  return parts;
}

export function annualIncomeTax(taxableAnnual: number, parts: number): number {
  if (taxableAnnual <= 0) return 0;
  return taxForOnePart(taxableAnnual / parts) * parts;
}

export function effectiveLifestyle(s: GameState) {
  return s.flags.planSurendettement ? 'frugal' : s.lifestyle;
}

export function isStudentFullTime(s: GameState): boolean {
  return !!s.training && s.training.mode === 'full';
}

export interface MonthlyBudget {
  incomes: BudgetLine[];
  expenses: BudgetLine[];
  debtPayments: number;
  tax: number;
  totalIncome: number;
  totalExpenses: number; // dépenses courantes + impôts + remboursements
  net: number;
  taxable: number; // revenu imposable mensuel
}

export interface BudgetOptions {
  salaryFactor?: number; // part variable de l'année
  unemploymentActive?: boolean;
  /** Rémunération de dirigeant réellement versée (si différente de la rémunération prévue). */
  founderPay?: number;
}

/** Budget mensuel courant, utilisé à la fois par l'affichage et par la simulation. */
export function monthlyBudget(s: GameState, opts: BudgetOptions = {}): MonthlyBudget {
  const incomes: BudgetLine[] = [];
  const expenses: BudgetLine[] = [];
  let taxable = 0;

  const job = s.job ? JOB_BY_ID[s.job.jobId] : null;
  if (s.job && job) {
    const net = s.job.salary * NET_RATIO * (opts.salaryFactor ?? 1);
    incomes.push({ label: 'Salaire net', amount: round(net), detail: `${round(s.job.salary)} € brut / mois` });
    taxable += net * 0.9;
  }
  if (s.training?.mode === 'alternance') {
    incomes.push({ label: "Salaire d'alternance", amount: APPRENTICE_NET, detail: 'Exonéré d’impôt' });
  }
  if (s.sideGig) {
    incomes.push({ label: 'Petit boulot', amount: SIDE_GIG_NET, detail: 'Missions le week-end' });
    taxable += SIDE_GIG_NET * 0.9;
  }
  const unemploymentActive = opts.unemploymentActive ?? s.unemploymentMonths > 0;
  if (!s.job && unemploymentActive && s.lastGrossSalary > 0) {
    const are = round(Math.max(0.57 * s.lastGrossSalary, 0.57 * SMIC_BRUT * 0.9));
    incomes.push({ label: 'Allocation chômage', amount: are, detail: `${s.unemploymentMonths} mois de droits restants` });
    taxable += are * 0.9;
  }
  const founderPay = opts.founderPay ?? s.business?.founderPay ?? 0;
  if (s.business && founderPay > 0) {
    incomes.push({ label: 'Rémunération de dirigeant', amount: round2(founderPay), detail: s.business.name });
    taxable += founderPay * 0.9;
  }
  if (typeof s.flags.pension === 'number' && s.flags.pension > 0) {
    incomes.push({ label: 'Pension de retraite', amount: s.flags.pension });
    taxable += s.flags.pension * 0.9;
  }
  const rentals = s.properties.filter((p) => !p.isMainHome);
  if (rentals.length) {
    const gross = rentals.reduce((t, p) => t + p.rent, 0) * 0.95;
    incomes.push({ label: 'Loyers perçus', amount: round(gross), detail: `${rentals.length} bien(s) en location, vacance locative comprise` });
    expenses.push({ label: 'Charges des biens loués', amount: round(gross * 0.25), detail: 'Taxe foncière, entretien, gestion' });
    taxable += gross * 0.7;
  }
  if (s.training?.mode === 'full' && s.flags.boursier) {
    incomes.push({ label: "Bourse d'études", amount: 320 });
  }

  // Aides sociales simplifiées
  const earned = incomes.reduce((t, l) => t + l.amount, 0);
  const housing = HOUSING_BY_ID[s.housingId] ?? HOUSING_BY_ID.parents;
  if (s.age >= 25 && !s.job && !isStudentFullTime(s) && earned < RSA_AMOUNT) {
    incomes.push({ label: 'RSA', amount: round(RSA_AMOUNT - earned), detail: 'Revenu de solidarité active (simplifié)' });
  }
  const cohab = !!s.relations.partner?.cohabiting;
  const rent = housing.rent * (cohab ? 0.5 : 1);
  if (rent > 0 && earned < 1600) {
    const apl = round(clamp(0.35 * rent - 0.12 * Math.max(0, earned - 500), 0, 280));
    if (apl > 0) incomes.push({ label: 'Aide au logement', amount: apl, detail: 'APL simplifiée' });
  }

  // Dépenses (un plan de surendettement impose un train de vie frugal)
  const life = LIFESTYLES[effectiveLifestyle(s)];
  if (rent > 0) expenses.push({ label: 'Loyer', amount: round(rent), detail: housing.name + (cohab ? ' (partagé en couple)' : '') });
  const main = s.properties.find((p) => p.isMainHome);
  if (main) expenses.push({ label: 'Taxe foncière et entretien', amount: round((main.value * 0.011) / 12 * (cohab ? 0.5 : 1)), detail: main.label });
  expenses.push({ label: 'Énergie, assurances, téléphone', amount: round(housing.utilities * (cohab ? 0.6 : 1)) });
  expenses.push({ label: 'Alimentation', amount: life.food });
  expenses.push({ label: 'Transport', amount: housing.transport + (s.flags.voiture && housing.transport < 200 ? 180 : 0) });
  expenses.push({ label: 'Loisirs et sorties', amount: life.leisure });
  expenses.push({ label: 'Vie courante', amount: round(life.misc + life.share * Math.max(0, earned - 1000)), detail: 'Vêtements, santé, équipement, imprévus : augmente avec le niveau de vie' });
  const kids = activeChildren(s);
  if (kids > 0) expenses.push({ label: 'Enfants', amount: round(kids * CHILD_MONTHLY_COST * (s.relations.partner ? 0.5 : 0.85)), detail: `${kids} enfant(s) à charge` });
  if (s.familyContribution > 0) expenses.push({ label: 'Aide à ma famille', amount: s.familyContribution });

  const debtPayments = round2(s.debts.reduce((t, d) => t + Math.min(d.monthlyPayment, d.principal * (1 + d.rate / 12)), 0));
  const tax = round2(annualIncomeTax(taxable * 12, taxParts(s)) / 12);

  const totalIncome = incomes.reduce((t, l) => t + l.amount, 0);
  const current = expenses.reduce((t, l) => t + l.amount, 0);
  const totalExpenses = current + tax + debtPayments;
  return { incomes, expenses, debtPayments, tax, totalIncome, totalExpenses, net: totalIncome - totalExpenses, taxable };
}

export function businessValuation(b: Business | null): number {
  if (!b) return 0;
  const sector = SECTOR_BY_ID[b.sector];
  const multiple = (sector?.multiple ?? 2) * b.valuationBonus;
  // Valeur des titres : trésorerie nette du prêt professionnel + bénéfices capitalisés. Jamais négative
  // (responsabilité limitée) : une entreprise déficitaire vaut simplement zéro pour son fondateur.
  return round(Math.max(0, b.treasury - b.loanPrincipal + Math.max(0, b.lastProfit) * multiple) * (b.ownership ?? 1));
}

export interface Balance {
  cash: number;
  savings: number;
  stocks: number;
  crypto: number;
  realEstate: number;
  business: number;
  assets: number;
  debts: number;
  netWorth: number;
}

export function balanceSheet(s: GameState): Balance {
  const realEstate = s.properties.reduce((t, p) => t + p.value, 0);
  const business = businessValuation(s.business);
  const assets = s.cash + s.savings + s.stocks + s.crypto + realEstate + business;
  const debts = s.debts.reduce((t, d) => t + d.principal, 0);
  return {
    cash: s.cash,
    savings: s.savings,
    stocks: s.stocks,
    crypto: s.crypto,
    realEstate,
    business,
    assets: round(assets),
    debts: round(debts),
    netWorth: round(assets - debts),
  };
}

export const netWorth = (s: GameState) => balanceSheet(s).netWorth;
export const totalDebt = (s: GameState) => round(s.debts.reduce((t, d) => t + d.principal, 0));
/** Dettes de consommation : crédits conso, découverts et dettes familiales (hors immobilier, études et prêts pro). */
export const consumerDebt = (s: GameState) =>
  round(s.debts.filter((d) => d.kind === 'conso' || d.kind === 'decouvert' || d.kind === 'famille').reduce((t, d) => t + d.principal, 0));

// ---- Helpers de mutation (appliqués sur une copie de l'état) ----

export function newId(s: GameState, prefix: string): string {
  s.nextId += 1;
  return `${prefix}${s.nextId}`;
}

export function addDebt(
  s: GameState,
  kind: DebtKind,
  label: string,
  amount: number,
  rate: number,
  years: number,
  propertyId?: string,
): Debt {
  const debt: Debt = {
    id: newId(s, 'd'),
    kind,
    label,
    principal: round2(amount),
    rate,
    monthlyPayment: round2(loanPayment(amount, rate, years)),
    propertyId,
  };
  s.debts.push(debt);
  return debt;
}

/** Ajoute un montant au découvert (fusionné en une seule dette renouvelable). */
export function addOverdraft(s: GameState, amount: number): void {
  if (amount <= 0) return;
  const existing = s.debts.find((d) => d.kind === 'decouvert');
  if (existing) {
    existing.principal = round2(existing.principal + amount);
    existing.monthlyPayment = round2(Math.max(50, existing.principal * 0.05));
  } else {
    s.debts.push({
      id: newId(s, 'd'),
      kind: 'decouvert',
      label: 'Découvert et crédit renouvelable',
      principal: round2(amount),
      rate: OVERDRAFT_RATE,
      monthlyPayment: round2(Math.max(50, amount * 0.05)),
    });
  }
}

/**
 * Paie une dépense : d'abord avec l'argent disponible, puis l'épargne,
 * et enfin par un découvert (dette explicite). Retourne le montant passé en découvert.
 */
export function payExpense(s: GameState, amount: number): number {
  if (amount <= 0) return 0;
  let rest = amount;
  const fromCash = Math.min(s.cash, rest);
  s.cash = round2(s.cash - fromCash);
  rest -= fromCash;
  if (rest > 0) {
    const fromSavings = Math.min(s.savings, rest);
    s.savings = round2(s.savings - fromSavings);
    rest -= fromSavings;
  }
  if (rest > 0.005) {
    addOverdraft(s, rest);
    return round2(rest);
  }
  return 0;
}

/** Ressources mobilisables immédiatement (argent disponible + épargne de précaution). */
export const liquidity = (s: GameState) => s.cash + s.savings;

/** Rembourse une dette sans jamais dépasser le capital restant dû. Retourne le montant effectivement remboursé. */
export function repayDebtAmount(s: GameState, debtId: string, amount: number): number {
  const debt = s.debts.find((d) => d.id === debtId);
  if (!debt || amount <= 0) return 0;
  const paid = round2(Math.min(amount, debt.principal, s.cash));
  if (paid <= 0) return 0;
  s.cash = round2(s.cash - paid);
  debt.principal = round2(debt.principal - paid);
  if (debt.principal <= 0.01) s.debts = s.debts.filter((d) => d.id !== debtId);
  else if (debt.kind === 'decouvert') debt.monthlyPayment = round2(Math.max(50, debt.principal * 0.05));
  return paid;
}

/** Applique un mois d'intérêts et de remboursement sur toutes les dettes. */
export function serviceDebtsMonth(s: GameState): { interest: number; principalPaid: number; paid: number } {
  let interest = 0;
  let principalPaid = 0;
  let paid = 0;
  for (const d of s.debts) {
    const i = d.principal * (d.rate / 12);
    const due = Math.min(d.monthlyPayment, d.principal + i);
    interest += i;
    principalPaid += due - i;
    paid += due;
    d.principal = round2(d.principal + i - due);
  }
  s.debts = s.debts.filter((d) => d.principal > 0.01);
  return { interest: round2(interest), principalPaid: round2(principalPaid), paid: round2(paid) };
}

export function debtRatio(s: GameState, extraPayment = 0): number {
  const b = monthlyBudget(s);
  const income = b.incomes
    .filter((l) => l.label !== 'RSA' && l.label !== 'Aide au logement')
    .reduce((t, l) => t + (l.label === 'Loyers perçus' ? l.amount * 0.7 : l.amount), 0);
  if (income <= 0) return Infinity;
  return (b.debtPayments - (s.debts.find((d) => d.kind === 'decouvert')?.monthlyPayment ?? 0) + extraPayment) / income;
}
