// Application des effets (Fx) des choix et des conséquences différées.

import { SKILL_LABELS } from './catalog';
import { createBusiness, bankruptcy } from './business';
import { hire, leaveJob, salaryCap } from './career';
import { addDebt, balanceSheet, clamp, newId, payExpense, repayDebtAmount, round, round2 } from './economy';
import { fillText } from './events';
import type { Rng } from './rng';
import type { Delta, Fx, GameState, SkillId } from './types';

export const PARTNER_NAMES = [
  'Camille', 'Léa', 'Lucas', 'Inès', 'Hugo', 'Chloé', 'Nathan', 'Sarah', 'Yanis', 'Manon',
  'Karim', 'Emma', 'Théo', 'Jade', 'Mehdi', 'Clara', 'Antoine', 'Amina', 'Julien', 'Lina',
  'Maxime', 'Sofia', 'Romain', 'Zoé', 'Bilal', 'Alice', 'Thomas', 'Nora', 'Adrien', 'Eva',
];

export function startPartner(s: GameState, rng: Rng, strength = 45): void {
  const used = new Set([s.name]);
  const name = rng.pick(PARTNER_NAMES.filter((n) => !used.has(n)));
  s.relations.partner = { name, strength, years: 0, cohabiting: false, married: false };
}

export function applyFx(s: GameState, fx: Fx | undefined, rng: Rng, sourceTitle: string): string[] {
  const notes: string[] = [];
  if (!fx) return notes;
  if (fx.addDebt) {
    const d = fx.addDebt;
    addDebt(s, d.kind, d.label, d.amount, d.rate, d.years);
    s.cash = round2(s.cash + d.amount);
  }
  if (fx.money) {
    if (fx.money > 0) s.cash = round2(s.cash + fx.money);
    else {
      const overdraft = payExpense(s, -fx.money);
      if (overdraft > 0) notes.push(`Faute de liquidités, ${round(overdraft).toLocaleString('fr-FR')} € passent en découvert.`);
    }
  }
  if (fx.savings) {
    if (fx.savings > 0) {
      const moved = Math.min(fx.savings, s.cash);
      s.cash = round2(s.cash - moved);
      s.savings = round2(s.savings + moved);
    } else {
      const moved = Math.min(-fx.savings, s.savings);
      s.savings = round2(s.savings - moved);
      s.cash = round2(s.cash + moved);
    }
  }
  if (fx.stocksPct) s.stocks = round2(Math.max(0, s.stocks * (1 + fx.stocksPct / 100)));
  if (fx.stocks) {
    const amount = Math.min(fx.stocks, s.cash);
    s.cash = round2(s.cash - amount);
    s.stocks = round2(s.stocks + amount);
    s.stocksBasis = round2(s.stocksBasis + amount);
  }
  if (fx.sellStocksPct && s.stocks > 0) {
    const share = Math.min(1, fx.sellStocksPct / 100);
    const sold = s.stocks * share;
    const basis = s.stocksBasis * share;
    const tax = Math.max(0, sold - basis) * 0.3;
    s.stocks = round2(s.stocks - sold);
    s.stocksBasis = round2(s.stocksBasis - basis);
    s.cash = round2(s.cash + sold - tax);
    if (tax > 0) notes.push(`Impôt sur la plus-value : ${round(tax).toLocaleString('fr-FR')} €.`);
  }
  if (fx.cryptoPct) s.crypto = round2(Math.max(0, s.crypto * (1 + fx.cryptoPct / 100)));
  if (fx.propertyValuePct) for (const p of s.properties) p.value = round(p.value * (1 + fx.propertyValuePct / 100));

  if (fx.health) s.health = clamp(s.health + fx.health);
  if (fx.energy) s.energy = clamp(s.energy + fx.energy);
  if (fx.happiness) s.happiness = clamp(s.happiness + fx.happiness);
  if (fx.family) s.relations.family = clamp(s.relations.family + fx.family);
  if (fx.friends) s.relations.friends = clamp(s.relations.friends + fx.friends);
  if (fx.network) s.relations.network = clamp(s.relations.network + fx.network);
  if (fx.skills) {
    for (const [k, v] of Object.entries(fx.skills) as [SkillId, number][]) s.skills[k] = clamp(s.skills[k] + v);
  }
  if (fx.flags) {
    for (const [k, v] of Object.entries(fx.flags)) {
      if (v === false) delete s.flags[k];
      else s.flags[k] = v;
    }
  }
  if (fx.diploma && !s.diplomas.includes(fx.diploma)) {
    s.diplomas.push(fx.diploma);
    s.counters.diplomas += 1;
  }

  // Carrière
  if (fx.loseJob && s.job) leaveJob(s, fx.loseJob);
  if (fx.setJob) {
    if (s.training && s.training.mode !== 'part') s.training = null;
    hire(s, fx.setJob.jobId, fx.setJob.salaryPct ?? 0);
  }
  if (fx.salaryPct && s.job) s.job.salary = Math.min(salaryCap(s, s.job.jobId), round(s.job.salary * (1 + fx.salaryPct / 100)));
  if (fx.performance && s.job) s.job.performance = clamp(s.job.performance + fx.performance);
  if (fx.unemploymentMonths !== undefined) s.unemploymentMonths = fx.unemploymentMonths;
  if (fx.startTraining && !s.training) {
    const mode = fx.startTraining.mode ?? 'full';
    if (mode !== 'part' && s.job) leaveJob(s, 'demission');
    s.training = { trainingId: fx.startTraining.trainingId, yearsDone: 0, mode };
  }

  // Relations
  if (fx.breakup && s.relations.partner) {
    s.relations.partner = null;
    s.relations.exPartners += 1;
  }
  if (fx.startPartner && !s.relations.partner) startPartner(s, rng);
  if (fx.partner && s.relations.partner) s.relations.partner.strength = clamp(s.relations.partner.strength + fx.partner);
  if (fx.cohabit && s.relations.partner) s.relations.partner.cohabiting = true;
  if (fx.marry && s.relations.partner) s.relations.partner.married = true;
  if (fx.child) s.relations.childrenBirthAges.push(s.age);

  // Entreprise
  if (fx.startBusiness && !s.business) {
    const capital = Math.min(fx.startBusiness.capital, s.cash);
    createBusiness(s, fx.startBusiness.sector, capital, 0, fx.startBusiness.name);
  }
  if (fx.biz && s.business) {
    const b = s.business;
    if (fx.biz.cash) b.treasury = round2(b.treasury + fx.biz.cash);
    if (fx.biz.reputation) b.reputation = clamp(b.reputation + fx.biz.reputation);
    if (fx.biz.scale) b.scale = clamp(b.scale + fx.biz.scale, 1, 5);
    if (fx.biz.valuationBonus) b.valuationBonus = Math.max(0.5, b.valuationBonus * fx.biz.valuationBonus);
    if (fx.biz.dilution) b.ownership = Math.max(0.1, b.ownership * (1 - fx.biz.dilution / 100));
    if (fx.biz.close === 'faillite') notes.push(bankruptcy(s));
    else if (fx.biz.close === 'fermeture') {
      const net = b.treasury - b.loanPrincipal;
      if (net > 0) s.cash = round2(s.cash + net);
      s.business = null;
    }
  }

  if (fx.sideGig !== undefined) s.sideGig = fx.sideGig;
  if (fx.familyContribution !== undefined) s.familyContribution = fx.familyContribution;
  if (fx.lifestyle) s.lifestyle = fx.lifestyle;
  if (fx.housingId && fx.housingId !== s.housingId) {
    const main = s.properties.find((p) => p.isMainHome);
    if (main) main.isMainHome = false;
    s.housingId = fx.housingId;
  }
  if (fx.repayDebts) {
    for (const d of s.debts.filter((x) => x.kind === fx.repayDebts)) {
      const paid = repayDebtAmount(s, d.id, d.principal);
      if (paid > 0) notes.push(`${round(paid).toLocaleString('fr-FR')} € remboursés sur « ${d.label} ».`);
    }
  }
  if (fx.consolidateDebts) {
    const merged = s.debts.filter((d) => d.kind === 'conso' || d.kind === 'decouvert');
    const total = merged.reduce((t, d) => t + d.principal, 0);
    if (total > 0) {
      s.debts = s.debts.filter((d) => !merged.includes(d));
      const c = fx.consolidateDebts;
      addDebt(s, 'conso', c.label, total, c.rate, c.years);
    }
  }
  if (fx.recordSale) {
    s.counters.businessesSold += 1;
    s.counters.bestBusinessSale = Math.max(s.counters.bestBusinessSale, fx.recordSale);
  }
  if (fx.moral === 'good') s.counters.moralGood += 1;
  if (fx.moral === 'bad') s.counters.moralBad += 1;
  if (fx.delayed) {
    for (const d of fx.delayed) {
      s.pending.push({
        id: newId(s, 'p'),
        dueAge: s.age + Math.max(1, d.years),
        sourceTitle,
        title: d.title,
        text: d.text,
        fx: d.fx,
        eventId: d.eventId,
      });
    }
  }
  if (fx.highlight) s.highlights.push({ kind: fx.highlight.kind, text: fillText(fx.highlight.text, s), age: s.age });
  return notes;
}

// ---- Calcul des variations visibles pour le joueur ----

interface Snapshot {
  cash: number;
  savings: number;
  investments: number;
  debts: number;
  netWorth: number;
  health: number;
  energy: number;
  happiness: number;
  family: number;
  friends: number;
  network: number;
  partner: number;
  performance: number;
  skills: Record<SkillId, number>;
}

export function snapshot(s: GameState): Snapshot {
  const b = balanceSheet(s);
  return {
    cash: s.cash,
    savings: s.savings,
    investments: s.stocks + s.crypto,
    debts: b.debts,
    netWorth: b.netWorth,
    health: s.health,
    energy: s.energy,
    happiness: s.happiness,
    family: s.relations.family,
    friends: s.relations.friends,
    network: s.relations.network,
    partner: s.relations.partner?.strength ?? 0,
    performance: s.job?.performance ?? 0,
    skills: { ...s.skills },
  };
}

export function diffSnapshots(a: Snapshot, b: Snapshot): Delta[] {
  const out: Delta[] = [];
  const add = (label: string, x: number, y: number, unit: Delta['unit']) => {
    const v = round(y - x);
    if (v !== 0) out.push({ label, value: v, unit });
  };
  add('Argent disponible', a.cash, b.cash, '€');
  add('Épargne', a.savings, b.savings, '€');
  add('Placements', a.investments, b.investments, '€');
  add('Dettes', a.debts, b.debts, '€');
  add('Patrimoine net', a.netWorth, b.netWorth, '€');
  add('Santé', a.health, b.health, 'pts');
  add('Énergie', a.energy, b.energy, 'pts');
  add('Satisfaction', a.happiness, b.happiness, 'pts');
  add('Famille', a.family, b.family, 'pts');
  add('Amitiés', a.friends, b.friends, 'pts');
  add('Réseau', a.network, b.network, 'pts');
  add('Couple', a.partner, b.partner, 'pts');
  add('Performance', a.performance, b.performance, 'pts');
  for (const k of Object.keys(a.skills) as SkillId[]) add(SKILL_LABELS[k], a.skills[k], b.skills[k], 'pts');
  return out;
}
