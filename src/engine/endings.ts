// Détermination de la fin de vie à partir de l'état complet de la partie.

import { ENDINGS, type EndingContext, type EndingDef } from '../content/endings';
import { JOB_BY_ID } from './catalog';
import { activeChildren, balanceSheet, consumerDebt, monthlyBudget } from './economy';
import type { GameState } from './types';

const DISADVANTAGED = new Set(['sans_diplome', 'pilier', 'endette', 'cocon', 'rural']);

export function endingContext(s: GameState): EndingContext {
  const b = balanceSheet(s);
  const rentalEquity = s.properties
    .filter((p) => !p.isMainHome)
    .reduce((t, p) => t + p.value - s.debts.filter((d) => d.propertyId === p.id).reduce((x, d) => x + d.principal, 0), 0);
  const financial = s.stocks + s.crypto + s.savings;
  const passiveIncome = financial * 0.04 + s.properties.filter((p) => !p.isMainHome).reduce((t, p) => t + p.rent * 12 * 0.65, 0);
  const passiveShare = b.netWorth > 0 ? (financial + Math.max(0, rentalEquity)) / b.netWorth : 0;
  const budget = monthlyBudget(s);
  const currentSpending = budget.expenses.reduce((t, l) => t + l.amount, 0) + budget.debtPayments;
  const bestSalary = Math.max(s.job?.salary ?? 0, s.lastGrossSalary, ...s.careerPath.map((c) => JOB_BY_ID[c.jobId]?.salary ?? 0));
  const levels = s.careerPath.map((c) => JOB_BY_ID[c.jobId]?.level ?? 0);
  const creativeIds = new Set(['artiste', 'graphiste', 'directeur_artistique']);
  return {
    netWorth: b.netWorth,
    peak: s.peakNetWorth,
    consumerDebt: consumerDebt(s),
    relationsAvg: (s.relations.family + s.relations.friends + (s.relations.partner?.strength ?? 0)) / 3,
    careerLevel: Math.max(0, ...levels, s.business ? 3 + Math.min(2, s.business.scale - 1) : 0),
    bestSalary,
    passiveShare,
    passiveIncome,
    annualExpenses: currentSpending * 12,
    children: s.relations.childrenBirthAges.length || activeChildren(s),
    disadvantagedStart: DISADVANTAGED.has(s.profileId),
    creativeCareer: s.careerPath.some((c) => creativeIds.has(c.jobId)) || s.business?.sector === 'agence',
  };
}

export function determineEnding(s: GameState): EndingDef {
  const ctx = endingContext(s);
  const sorted = [...ENDINGS].sort((a, b) => b.priority - a.priority);
  return sorted.find((e) => e.condition(s, ctx)) ?? sorted[sorted.length - 1];
}

/** Toutes les fins dont la condition est remplie (utile pour les tests et l'équilibrage). */
export function matchingEndings(s: GameState): string[] {
  const ctx = endingContext(s);
  return ENDINGS.filter((e) => e.condition(s, ctx)).map((e) => e.id);
}
