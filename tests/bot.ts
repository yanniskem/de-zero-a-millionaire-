// Joueurs automatiques utilisés pour tester des parcours complets et l'équilibrage.

import * as A from '../src/engine/actions';
import { JOBS, PROPERTY_TYPES, SECTOR_BY_ID } from '../src/engine/catalog';
import { jobRequirementsMissing } from '../src/engine/career';
import { monthlyBudget } from '../src/engine/economy';
import { choiceViews, getEvent } from '../src/engine/events';
import { makeRng, type Rng } from '../src/engine/rng';
import { advanceYear, chooseOption, continueAfterOutcome, createGame, type GameLength } from '../src/engine/simulation';
import type { GameState } from '../src/engine/types';
import { checkInvariants } from '../src/engine/validate';

export type StrategyName = 'stable' | 'entrepreneur' | 'investisseur' | 'depensier' | 'famille' | 'aleatoire';

const keep = (s: GameState, r: { state: GameState }) => r.state ?? s;

function bestJob(s: GameState): string | null {
  const eligible = JOBS.filter((j) => j.id !== s.job?.jobId && jobRequirementsMissing(s, j.id).length === 0 && j.id !== 'artiste');
  if (!eligible.length) return null;
  eligible.sort((a, b) => b.salary - a.salary);
  const current = s.job ? JOBS.find((j) => j.id === s.job!.jobId)!.salary : 0;
  return eligible[0].salary > current * 1.05 ? eligible[0].id : null;
}

function monthlySpend(s: GameState) {
  return monthlyBudget(s).totalExpenses;
}

function pickChoice(s: GameState, strategy: StrategyName, rng: Rng): string {
  const ev = getEvent(s.eventQueue[0].eventId)!;
  const views = choiceViews(s, ev).filter((v) => v.available);
  if (strategy === 'aleatoire' || strategy === 'depensier') return rng.pick(views).choice.id;
  // Les autres stratégies préfèrent le premier choix disponible, avec un peu de hasard.
  return rng.chance(0.6) ? views[0].choice.id : rng.pick(views).choice.id;
}

function yearlyActions(s: GameState, strategy: StrategyName, rng: Rng): GameState {
  const fin = s.cash + s.savings;
  // Tout le monde cherche un emploi s'il n'en a pas (sauf pendant les études ou avec une entreprise).
  if (!s.training && s.age < 64 && !(strategy === 'entrepreneur' && s.business)) {
    const target = bestJob(s);
    if (target && (!s.job || strategy !== 'famille')) s = keep(s, A.applyForJob(s, target));
  }
  if (s.job && s.age < 60) s = keep(s, A.askPromotion(s));
  if (!s.job && !s.training && s.age < 25 && strategy !== 'entrepreneur' && rng.chance(0.5)) {
    s = keep(s, A.startTraining(s, 'bts_gestion', 'alternance', 'loan'));
  }

  switch (strategy) {
    case 'stable': {
      s = keep(s, A.setLifestyle(s, 'normal'));
      if (s.cash > monthlySpend(s) * 2) s = keep(s, A.depositSavings(s, s.cash - monthlySpend(s)));
      if (s.age >= 25 && s.relations.family > 30 && s.housingId === 'parents') s = keep(s, A.moveHousing(s, 'studio'));
      break;
    }
    case 'investisseur': {
      s = keep(s, A.setLifestyle(s, 'frugal'));
      if (s.priority !== 'carriere') s = keep(s, A.setPriority(s, 'carriere'));
      const reserve = monthlySpend(s) * 4;
      if (s.savings < reserve) s = keep(s, A.depositSavings(s, Math.max(0, s.cash - 500)));
      else if (s.cash > 500) s = keep(s, A.buyInvestment(s, 'stocks', s.cash - 300));
      for (const p of PROPERTY_TYPES) {
        const deposit = Math.round(p.price * 0.15);
        if (fin > deposit + reserve && s.properties.length < 3) {
          const q = A.mortgageQuote(s, p.id, false, deposit, 25);
          if (!q.problems.length) s = keep(s, A.buyProperty(s, p.id, false, deposit, 25));
        }
      }
      break;
    }
    case 'entrepreneur': {
      if (!s.business && s.age >= 20 && s.age < 55) {
        const sectors = ['conseil', 'artisan', 'agence', 'startup', 'ecommerce', 'food_truck', 'restaurant'];
        for (const id of sectors) {
          const sec = SECTOR_BY_ID[id];
          if (s.savings > 0) s = keep(s, A.withdrawSavings(s, s.savings));
          const capital = Math.min(s.cash, Math.max(sec.minCapital, s.cash * 0.7));
          if (capital >= sec.minCapital * 0.5) {
            const loan = Math.max(0, Math.min(capital * 2, sec.minCapital - capital + 5000));
            const r = A.startBusiness(s, id, capital, capital >= sec.minCapital ? 0 : loan, 'Ma Boîte');
            if (r.ok) {
              s = r.state;
              if (s.job) s = keep(s, A.quitJob(s, 'demission'));
              break;
            }
          }
        }
      }
      if (s.business) {
        const b = s.business;
        const pay = b.lastProfit > 60000 ? 4000 : b.lastProfit > 20000 ? 2500 : b.years >= 1 && b.treasury > 15000 ? 1500 : 0;
        s = keep(s, A.setFounderPay(s, pay));
        if (b.treasury < 0 && s.cash > 3000) s = keep(s, A.injectBusiness(s, s.cash - 2000));
        s = keep(s, A.expandBusiness(s));
        if (b.treasury > 80000) s = keep(s, A.withdrawDividends(s, b.treasury - 50000));
        if (b.years >= 8 && b.lastProfit > 0 && rng.chance(0.3)) s = keep(s, A.sellBusiness(s));
      }
      if (s.cash > 20000 && !s.business) s = keep(s, A.buyInvestment(s, 'stocks', s.cash - 10000));
      break;
    }
    case 'depensier': {
      s = keep(s, A.setLifestyle(s, 'luxe'));
      if (rng.chance(0.3)) s = keep(s, A.takePersonalLoan(s, 8000, 4));
      if (s.cash > 3000 && rng.chance(0.3)) s = keep(s, A.buyInvestment(s, 'crypto', s.cash / 2));
      if (s.housingId === 'parents' && s.age >= 20) s = keep(s, A.moveHousing(s, 't2'));
      break;
    }
    case 'famille': {
      s = keep(s, A.setPriority(s, 'proches'));
      if (!s.relations.partner) s = keep(s, A.seekLove(s));
      else {
        if (s.housingId === 'parents' || s.housingId === 'coloc') s = keep(s, A.moveHousing(s, 't2'));
        s = keep(s, A.moveInTogether(s));
        s = keep(s, A.formalizeUnion(s, 'pacs'));
        if (s.relations.childrenBirthAges.length < 2 && s.age >= 26) s = keep(s, A.tryForChild(s));
      }
      s = keep(s, A.visitFamily(s));
      s = keep(s, A.seeFriends(s));
      if (s.cash > monthlySpend(s) * 2) s = keep(s, A.depositSavings(s, s.cash - monthlySpend(s)));
      break;
    }
    case 'aleatoire': {
      const priorities = ['carriere', 'equilibre', 'proches', 'sante', 'formation'] as const;
      s = keep(s, A.setPriority(s, rng.pick(priorities)));
      if (rng.chance(0.3) && s.cash > 1000) s = keep(s, A.buyInvestment(s, rng.chance(0.5) ? 'stocks' : 'crypto', s.cash / 3));
      if (rng.chance(0.2)) s = keep(s, A.seekLove(s));
      break;
    }
  }
  // Rembourser les découverts coûteux en priorité
  for (const d of s.debts.filter((x) => x.kind === 'decouvert')) {
    if (s.savings > 0) s = keep(s, A.withdrawSavings(s, Math.min(s.savings, d.principal)));
    s = keep(s, A.repayDebt(s, d.id, d.principal));
  }
  return s;
}

export interface BotRun {
  final: GameState;
  invariantErrors: string[];
  years: number;
}

export function playGame(seed: number, profileId: string, strategy: StrategyName, length: GameLength = 'normale', checkEveryStep = true): BotRun {
  let s = createGame({ name: 'Bot', gender: seed % 2 ? 'f' : 'm', profileId, seed, length });
  const rng = makeRng(seed ^ 0x5bd1e995);
  const errors: string[] = [];
  const check = (label: string) => {
    if (!checkEveryStep) return;
    for (const e of checkInvariants(s)) errors.push(`[${s.age}] ${label}: ${e}`);
  };
  let guard = 0;
  let years = 0;
  while (s.phase !== 'ended' && guard++ < 1000) {
    if (s.phase === 'event') {
      const r = chooseOption(s, pickChoice(s, strategy, rng));
      if (!r.ok) throw new Error(`Choix refusé : ${r.message}`);
      s = continueAfterOutcome(r.state);
      check('choix');
      continue;
    }
    s = yearlyActions(s, strategy, rng);
    check('actions');
    const r = advanceYear(s);
    if (!r.ok) throw new Error(`Avancement refusé : ${r.message}`);
    s = r.state;
    years++;
    check('année');
  }
  return { final: s, invariantErrors: errors, years };
}
