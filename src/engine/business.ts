// Entrepreneuriat : création, simulation annuelle, croissance, cession, faillite.

import { SECTOR_BY_ID, SKILL_LABELS } from './catalog';
import { addDebt, businessValuation, clamp, FOUNDER_CHARGES, loanPayment, netWorth, round, round2 } from './economy';
import type { Rng } from './rng';
import type { Business, GameState } from './types';

export const PRO_LOAN_RATE = 0.055;

export function sectorSkillAvg(s: GameState, sectorId: string): number {
  const sector = SECTOR_BY_ID[sectorId];
  if (!sector) return 0;
  return sector.skills.reduce((t, k) => t + s.skills[k], 0) / sector.skills.length;
}

export function businessRequirementsMissing(s: GameState, sectorId: string, capital: number): string[] {
  const sector = SECTOR_BY_ID[sectorId];
  if (!sector) return ['Secteur inconnu'];
  const missing: string[] = [];
  if (s.business) missing.push('Tu diriges déjà une entreprise');
  if (s.age < 18) missing.push('Il faut être majeur');
  if (capital < sector.minCapital) missing.push(`Capital minimum : ${sector.minCapital.toLocaleString('fr-FR')} €`);
  const req = sector.requires;
  if (req?.skill && req.min && s.skills[req.skill] < req.min) {
    missing.push(`${SKILL_LABELS[req.skill]} ${req.min}+ requis`);
  } else if (req && !req.skill && req.min) {
    const best = Math.max(...sector.skills.map((k) => s.skills[k]));
    if (best < req.min) missing.push(`Une expertise à ${req.min}+ en ${sector.skills.map((k) => SKILL_LABELS[k]).join(', ')}`);
  }
  return missing;
}

/**
 * Crée l'entreprise. `fromCash` est prélevé sur l'argent disponible ;
 * `loan` est un prêt professionnel porté par l'entreprise, garanti à 50 % par le fondateur.
 */
export function createBusiness(s: GameState, sectorId: string, fromCash: number, loan: number, name?: string): Business {
  const sector = SECTOR_BY_ID[sectorId];
  s.cash = round2(s.cash - fromCash);
  const b: Business = {
    name: name || sector.name,
    sector: sectorId,
    treasury: round2(fromCash + loan),
    reputation: round(clamp(20 + s.relations.network / 5 + s.skills.social / 10)),
    scale: 1,
    founderPay: 0,
    years: 0,
    lastRevenue: 0,
    lastProfit: 0,
    invested: fromCash,
    loanPrincipal: loan,
    loanPayment: loan > 0 ? round2(loanPayment(loan, PRO_LOAN_RATE, 7)) : 0,
    personalGuarantee: 0.5,
    valuationBonus: 1,
    ownership: 1,
    profitableYears: 0,
  };
  s.business = b;
  s.counters.businessesCreated += 1;
  s.flags.entrepreneur = true;
  return b;
}

export interface BusinessYearResult {
  revenue: number;
  costs: number;
  profit: number;
  founderPaid: number;
  notes: string[];
  failed: boolean;
}

/** Simule une année d'activité. Le salaire du dirigeant n'est versé que si la trésorerie le permet. */
export function simulateBusinessYear(s: GameState, rng: Rng): BusinessYearResult {
  const b = s.business!;
  const sector = SECTOR_BY_ID[b.sector];
  const notes: string[] = [];
  const partTime = s.job ? 0.55 : 1;
  const market = s.flags.recession ? 0.82 : 1;
  const demand = clamp(rng.normal(1, sector.volatility), 0.45, 1.6) * market;
  const skill = sectorSkillAvg(s, b.sector) / 100;
  const quality = 0.7 + 0.5 * skill;
  const repFactor = 0.75 + (b.reputation / 100) * 0.45;
  const growth = maturity(sector.id, b.years);
  const extra = b.scale - 1;
  const monthlyRevenue = (sector.baseRevenue * partTime + sector.extraRevenue * extra) * demand * quality * repFactor * growth;
  const monthlyCosts = sector.baseCosts * (s.job ? 0.55 : 1) + sector.extraCosts * extra;

  let revenue = 0;
  let costs = 0;
  let founderPaid = 0;
  for (let m = 0; m < 12; m++) {
    revenue += monthlyRevenue;
    costs += monthlyCosts;
    b.treasury += monthlyRevenue - monthlyCosts;
    if (b.loanPrincipal > 0) {
      const interest = b.loanPrincipal * (PRO_LOAN_RATE / 12);
      const due = Math.min(b.loanPayment, b.loanPrincipal + interest);
      b.loanPrincipal = round2(b.loanPrincipal + interest - due);
      if (b.loanPrincipal < 0.01) b.loanPrincipal = 0;
      b.treasury -= due;
      costs += interest;
    }
    if (b.founderPay > 0) {
      const cost = b.founderPay * FOUNDER_CHARGES;
      if (b.treasury >= cost) {
        b.treasury -= cost;
        costs += cost;
        founderPaid += b.founderPay;
      }
    }
  }
  b.treasury = round2(b.treasury);
  const profit = round(revenue - costs);
  if (b.founderPay > 0 && founderPaid < b.founderPay * 12) {
    notes.push(`Trésorerie insuffisante : ${b.name} n'a pu te verser que ${round(founderPaid).toLocaleString('fr-FR')} € sur l'année.`);
  }
  b.lastRevenue = round(revenue);
  b.lastProfit = profit;
  b.years += 1;
  if (profit > 0) b.profitableYears += 1;
  const repDelta = (quality - 1) * 18 + (s.priority === 'carriere' ? 4 : 0) + (profit > 0 ? 2 : -3) + rng.normal(0, 3) - (s.job ? 2 : 0);
  b.reputation = round(clamp(b.reputation + repDelta));
  if (demand < 0.75) notes.push(`Année difficile pour ${b.name} : la demande a nettement baissé.`);
  if (demand > 1.3) notes.push(`Excellente année pour ${b.name} : la demande a explosé.`);

  if (b.treasury < 0) notes.push(`Attention : la trésorerie de ${b.name} est négative (${round(b.treasury).toLocaleString('fr-FR')} €). Sous ${round(-3 * (sector.baseCosts + sector.extraCosts * extra)).toLocaleString('fr-FR')} €, c’est la liquidation.`);
  const failureThreshold = -3 * (sector.baseCosts + sector.extraCosts * extra);
  // Les banques et fournisseurs laissent une année de répit à une jeune entreprise, sauf effondrement.
  const failed = b.treasury < failureThreshold && (b.years >= 2 || b.treasury < 2 * failureThreshold);
  return { revenue: round(revenue), costs: round(costs), profit, founderPaid: round(founderPaid), notes, failed };
}

/** Liquidation judiciaire : l'entreprise disparaît, la caution personnelle devient une dette du joueur. */
export function bankruptcy(s: GameState): string {
  const b = s.business!;
  const guaranteed = round(b.loanPrincipal * b.personalGuarantee);
  if (guaranteed > 0) addDebt(s, 'pro', `Caution du prêt de ${b.name}`, guaranteed, 0.05, 5);
  s.business = null;
  s.counters.bankruptcies += 1;
  s.flags.faillite = true;
  s.flags.failliteAge = s.age;
  if (b.invested >= 5000) s.flags.nwAtFaillite = netWorth(s);
  return guaranteed > 0
    ? `${b.name} est placée en liquidation judiciaire. Ta caution personnelle t'oblige à rembourser ${guaranteed.toLocaleString('fr-FR')} €.`
    : `${b.name} est placée en liquidation judiciaire. Tu perds ton investissement.`;
}

/**
 * Montée en puissance : une jeune entreprise ne réalise qu'une partie de son potentiel.
 * Une start-up peut, elle, dépasser largement son chiffre d'affaires de départ si elle survit.
 */
export function maturity(sectorId: string, years: number): number {
  const sector = SECTOR_BY_ID[sectorId];
  if (sectorId === 'startup') return Math.min(1 + sector.growth * years * 1.5, 3);
  return Math.min(1, 0.65 + 0.2 * years) * (1 + sector.growth * Math.min(years, 5) * 0.3);
}

export function expansionCost(b: Business): number {
  const sector = SECTOR_BY_ID[b.sector];
  return round(sector.minCapital * 0.6 + sector.extraCosts * 3 * b.scale);
}

export function expansionReputation(b: Business): number {
  return 30 + b.scale * 10;
}

export function salePrice(b: Business): number {
  return businessValuation(b);
}
