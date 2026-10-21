import { describe, expect, it } from 'vitest';
import * as A from '../src/engine/actions';
import { JOB_BY_ID } from '../src/engine/catalog';
import {
  annualIncomeTax,
  balanceSheet,
  consumerDebt,
  loanPayment,
  monthlyBudget,
  netWorth,
  payExpense,
  repayDebtAmount,
  serviceDebtsMonth,
  addDebt,
} from '../src/engine/economy';
import { applyFx } from '../src/engine/effects';
import { choiceViews, drawEvents, eligibleEvents, getEvent, isEligible, PASS_CHOICE } from '../src/engine/events';
import type { GameEvent } from '../src/engine/eventTypes';
import { determineEnding, matchingEndings } from '../src/engine/endings';
import { makeRng } from '../src/engine/rng';
import {
  advanceYear,
  applyDebtSafetyNet,
  canAdvance,
  chooseOption,
  clone,
  continueAfterOutcome,
  createGame,
  endGameEarly,
} from '../src/engine/simulation';
import { buildShareText, buildSummary } from '../src/engine/summary';
import type { GameState } from '../src/engine/types';
import { checkInvariants } from '../src/engine/validate';
import { deserialize, loadGame, saveGame, serialize, type StorageLike } from '../src/save/storage';
import { decodeResult, encodeResult } from '../src/share/share';

const newGame = (profileId = 'cocon', seed = 42) => createGame({ name: 'Alex', gender: 'f', profileId, seed });

/** Répond automatiquement aux événements en attente (premier choix disponible). */
function settle(s: GameState): GameState {
  while (s.phase === 'event') {
    const ev = getEvent(s.eventQueue[0].eventId)!;
    const v = choiceViews(s, ev).find((c) => c.available)!;
    s = continueAfterOutcome(chooseOption(s, v.choice.id).state);
  }
  return s;
}

function memoryStorage(): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
}

describe('création de partie', () => {
  it('démarre à 18 ans avec un événement d’introduction et un état cohérent', () => {
    const s = newGame();
    expect(s.age).toBe(18);
    expect(s.phase).toBe('event');
    expect(s.eventQueue[0].eventId).toBe('intro_cocon');
    expect(checkInvariants(s)).toEqual([]);
  });
  it('est reproductible avec la même graine et varie avec une autre', () => {
    expect(newGame('heritier', 7)).toEqual(newGame('heritier', 7));
    expect(newGame('heritier', 7).cash).not.toBe(newGame('heritier', 8).cash);
  });
  it('applique une variation contrôlée (argent ±15 %)', () => {
    for (let seed = 0; seed < 30; seed++) {
      const s = newGame('cocon', seed);
      expect(s.cash).toBeGreaterThanOrEqual(400 * 0.85 - 1);
      expect(s.cash).toBeLessThanOrEqual(400 * 1.15 + 1);
    }
  });
});

describe('économie', () => {
  it('calcule un budget : salaire net, dépenses, solde', () => {
    let s = settle(newGame());
    s = clone(s);
    s.job = { jobId: 'vendeur', salary: 2000, years: 0, performance: 50 };
    s.housingId = 'studio';
    s.lifestyle = 'normal';
    const b = monthlyBudget(s);
    expect(b.incomes.find((l) => l.label === 'Salaire net')!.amount).toBe(1560);
    expect(b.expenses.find((l) => l.label === 'Loyer')!.amount).toBe(520);
    expect(b.net).toBeCloseTo(b.totalIncome - b.totalExpenses, 5);
  });
  it('applique un impôt progressif nul sous le seuil et croissant ensuite', () => {
    expect(annualIncomeTax(10000, 1)).toBe(0);
    expect(annualIncomeTax(30000, 1)).toBeGreaterThan(0);
    expect(annualIncomeTax(60000, 1)).toBeGreaterThan(annualIncomeTax(30000, 1) * 2);
    expect(annualIncomeTax(60000, 2)).toBeLessThan(annualIncomeTax(60000, 1));
  });
  it('définit le patrimoine net comme actifs − dettes', () => {
    const s = clone(settle(newGame()));
    s.cash = 1000; s.savings = 2000; s.stocks = 3000; s.crypto = 0;
    s.debts = [];
    addDebt(s, 'conso', 'Test', 1500, 0.05, 2);
    const b = balanceSheet(s);
    expect(b.netWorth).toBe(b.assets - b.debts);
    expect(netWorth(s)).toBe(1000 + 2000 + 3000 - 1500);
  });
  it('finance un manque d’argent par l’épargne puis par une dette explicite (jamais d’argent négatif)', () => {
    const s = clone(settle(newGame()));
    s.cash = 100; s.savings = 200; s.debts = [];
    const od = payExpense(s, 500);
    expect(s.cash).toBe(0);
    expect(s.savings).toBe(0);
    expect(od).toBe(200);
    expect(s.debts.find((d) => d.kind === 'decouvert')!.principal).toBe(200);
  });
  it('ne rembourse jamais plus que la dette restante ni que l’argent disponible', () => {
    const s = clone(settle(newGame()));
    s.debts = []; s.cash = 10000;
    const d = addDebt(s, 'conso', 'Petit crédit', 800, 0.05, 1);
    expect(repayDebtAmount(s, d.id, 5000)).toBe(800);
    expect(s.cash).toBe(9200);
    expect(s.debts).toHaveLength(0);
    s.cash = 50;
    const d2 = addDebt(s, 'conso', 'Autre', 800, 0.05, 1);
    expect(repayDebtAmount(s, d2.id, 500)).toBe(50);
  });
  it('amortit un prêt jusqu’à zéro avec les intérêts', () => {
    const s = clone(settle(newGame()));
    s.debts = [];
    addDebt(s, 'conso', 'Prêt', 12000, 0.06, 2);
    let paid = 0;
    for (let m = 0; m < 24; m++) paid += serviceDebtsMonth(s).paid;
    expect(s.debts).toHaveLength(0);
    expect(paid).toBeCloseTo(loanPayment(12000, 0.06, 2) * 24, 0);
    expect(paid).toBeGreaterThan(12000);
  });
  it('déclenche un plan de surendettement qui borne la dette', () => {
    const s = clone(settle(newGame()));
    s.debts = [];
    addDebt(s, 'conso', 'Énorme crédit', 80000, 0.2, 5);
    const note = applyDebtSafetyNet(s, 15000);
    expect(note).toMatch(/Surendettement/);
    expect(s.flags.ficheBanqueDeFrance).toBe(true);
    expect(consumerDebt(s)).toBeLessThanOrEqual(15000 / 12 * 0.35 * 96 + 1);
    expect(s.debts.every((d) => d.rate === 0 || d.kind === 'immo')).toBe(true);
  });
});

describe('choix et conséquences', () => {
  it('un choix modifie réellement l’état et ne peut être fait qu’une fois', () => {
    const s0 = newGame('heritier', 3);
    const r = chooseOption(s0, 'bourse');
    expect(r.ok).toBe(true);
    expect(r.state.stocks).toBe(30000);
    expect(r.state.savings).toBeLessThan(s0.savings);
    expect(r.state.eventQueue[0].outcome!.deltas.length).toBeGreaterThan(0);
    expect(chooseOption(r.state, 'bourse').ok).toBe(false);
    expect(s0.stocks).toBe(0); // immutabilité
  });
  it('refuse un choix trop cher et explique pourquoi', () => {
    const s = clone(settle(newGame()));
    s.cash = 10; s.savings = 0;
    const ev = getEvent('bud_smartphone')!;
    const view = choiceViews(s, ev).find((v) => v.choice.id === 'comptant')!;
    expect(view.available).toBe(false);
    expect(view.reason).toMatch(/1\s?250/);
  });
  it('ajoute un choix « Laisser passer » quand aucun choix n’est disponible', () => {
    const s = settle(newGame());
    const ev: GameEvent = { id: 'test', category: 'budget', title: 'T', text: 't', choices: [{ id: 'a', label: 'A', requires: () => false, outcome: { text: 'x' } }] };
    const views = choiceViews(s, ev);
    expect(views.some((v) => v.choice.id === PASS_CHOICE.id && v.available)).toBe(true);
  });
  it('programme une conséquence différée qui s’applique des années plus tard', () => {
    let s = clone(settle(newGame()));
    const rng = makeRng(1);
    applyFx(s, { delayed: [{ years: 2, title: 'Retour', text: 'Remboursé', fx: { money: 5000 } }] }, rng, 'Test');
    expect(s.pending).toHaveLength(1);
    const target = s.age + 2;
    const cashBefore = s.cash;
    let sawIt = false;
    while (s.age < target) {
      s = settle(advanceYear(s).state);
      if (s.log.some((l) => l.title === 'Retour')) sawIt = true;
    }
    expect(sawIt).toBe(true);
    expect(s.pending.find((p) => p.title === 'Retour')).toBeUndefined();
    void cashBefore;
  });
});

describe('événements', () => {
  it('respecte les conditions de déclenchement', () => {
    const s = clone(settle(newGame()));
    s.business = null;
    expect(isEligible(s, getEvent('ent_mauvais_payeur')!)).toBe(false);
    s.relations.partner = null;
    expect(isEligible(s, getEvent('rel_emmenager')!)).toBe(false);
    s.age = 30;
    expect(isEligible(s, getEvent('etu_salon_orientation')!)).toBe(false);
    expect(eligibleEvents(s).every((e) => !e.followUp && !e.profile)).toBe(true);
  });
  it('ne rejoue pas un événement déjà vu (sauf délai de réapparition)', () => {
    const s = clone(settle(newGame()));
    s.seenEvents['etu_bibliotheque'] = s.age;
    expect(isEligible(s, getEvent('etu_bibliotheque')!)).toBe(false);
    s.seenEvents['bud_vacances'] = s.age - 5;
    expect(isEligible(s, getEvent('bud_vacances')!)).toBe(true);
  });
  it('tire des événements distincts de catégories différentes', () => {
    const s = settle(newGame());
    const evs = drawEvents(s, makeRng(9), 3);
    expect(new Set(evs.map((e) => e.category)).size).toBe(evs.length);
  });
});

describe('avancement du temps', () => {
  it('interdit d’avancer tant qu’un événement attend', () => {
    const s = newGame();
    expect(canAdvance(s).ok).toBe(false);
    expect(advanceYear(s).ok).toBe(false);
  });
  it('avance exactement d’un an et produit un bilan cohérent', () => {
    const s = settle(newGame());
    const r = advanceYear(s);
    expect(r.ok).toBe(true);
    expect(r.state.age).toBe(s.age + 1);
    expect(r.state.history).toHaveLength(s.history.length + 1);
    const rep = r.state.lastReport!;
    expect(rep.ageFrom).toBe(s.age);
    expect(Math.abs(rep.incomeTotal - rep.incomeLines.reduce((t, l) => t + l.amount, 0))).toBeLessThanOrEqual(rep.incomeLines.length);
    expect(Math.abs(rep.expenseTotal - rep.expenseLines.reduce((t, l) => t + l.amount, 0))).toBeLessThanOrEqual(rep.expenseLines.length);
    expect(checkInvariants(r.state)).toEqual([]);
  });
  it('verse le salaire une seule fois par mois (12 fois par an)', () => {
    const s = clone(settle(newGame()));
    s.job = { jobId: 'assistant_admin', salary: 2000, years: 3, performance: 50 };
    s.business = null; s.sideGig = false; s.training = null;
    const line = advanceYear(s).state.lastReport!.incomeLines.find((l) => l.label === 'Salaire net')!;
    expect(line.amount).toBe(Math.round(2000 * 0.78) * 12);
  });
  it('termine la partie à l’âge choisi et attribue une fin', () => {
    let s = createGame({ name: 'Z', gender: 'm', profileId: 'cocon', seed: 5, length: 'courte' });
    let guard = 0;
    while (s.phase !== 'ended' && guard++ < 200) s = s.phase === 'event' ? settle(s) : advanceYear(s).state;
    expect(s.age).toBe(45);
    expect(s.endingId).toBeTruthy();
    expect(advanceYear(s).ok).toBe(false);
  });
  it('permet de clore son histoire à partir de 30 ans seulement', () => {
    const s = settle(newGame());
    expect(endGameEarly(s).ok).toBe(false);
    const old = clone(s); old.age = 31;
    const r = endGameEarly(old);
    expect(r.ok).toBe(true);
    expect(r.state.phase).toBe('ended');
  });
});

describe('fins de partie', () => {
  const base = () => { const s = clone(settle(newGame('cocon', 11))); s.debts = []; s.age = 67; s.business = null; return s; };
  it('ruine : patrimoine très négatif', () => {
    const s = base(); s.cash = 0; s.savings = 0;
    addDebt(s, 'conso', 'Dette', 60000, 0.1, 5);
    expect(determineEnding(s).id).toBe('ruine');
  });
  it('millionnaire autodidacte : 1 M€ sans diplôme ni héritage', () => {
    const s = base(); s.savings = 1200000; s.education = 2; s.relations.family = 70; s.relations.friends = 70;
    expect(determineEnding(s).id).toBe('autodidacte');
  });
  it('investisseur : patrimoine surtout placé', () => {
    const s = base(); s.stocks = 900000; s.education = 4; s.relations.family = 70; s.relations.friends = 70;
    expect(determineEnding(s).id).toBe('investisseur');
  });
  it('famille : couple, enfants, bonheur', () => {
    const s = base(); s.cash = 30000; s.happiness = 80; s.relations.family = 80;
    s.relations.partner = { name: 'Lina', strength: 80, years: 20, cohabiting: true, married: true };
    s.relations.childrenBirthAges = [30, 33];
    expect(determineEnding(s).id).toBe('famille');
  });
  it('fin atypique toujours disponible en dernier recours', () => {
    const s = base();
    expect(matchingEndings(s)).toContain('atypique');
  });
  it('une patrimoine nul ou négatif ne casse ni la fin ni le bilan', () => {
    const s = base(); s.cash = 0; s.savings = 0; s.stocks = 0;
    s.endingId = determineEnding(s).id;
    const sum = buildSummary(s);
    expect(sum.finalNetWorth).toBe(0);
    expect(sum.shareText).toMatch(/0 €/);
  });
});

describe('sauvegarde', () => {
  it('sauvegarde puis recharge une partie identique', () => {
    const st = memoryStorage();
    const s = settle(newGame('metropole', 21));
    expect(saveGame(s, st).ok).toBe(true);
    const r = loadGame(st);
    expect(r.status).toBe('ok');
    if (r.status === 'ok') expect(r.state).toEqual(s);
  });
  it('détecte une sauvegarde corrompue sans planter', () => {
    const st = memoryStorage();
    st.setItem('dzam.save', '{pas du json');
    expect(loadGame(st).status).toBe('invalid');
    expect(deserialize(JSON.stringify({ format: 'dzam-save', version: 1, state: { age: 'x' } })).status).toBe('invalid');
    expect(deserialize(JSON.stringify({ format: 'dzam-save', version: 99, state: {} })).status).toBe('invalid');
  });
  it('signale l’absence de stockage et l’absence de sauvegarde', () => {
    expect(loadGame(null).status).toBe('unavailable');
    expect(saveGame(newGame(), null).ok).toBe(false);
    expect(loadGame(memoryStorage()).status).toBe('none');
  });
  it('gère une erreur d’écriture (quota plein)', () => {
    const st: StorageLike = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
    expect(saveGame(newGame(), st).ok).toBe(false);
  });
  it('un redémarrage crée une partie neuve indépendante', () => {
    const a = settle(newGame('cocon', 1));
    const b = createGame({ name: 'Bis', gender: 'm', profileId: 'rural', seed: 2 });
    expect(b.age).toBe(18);
    expect(b.log).toHaveLength(1);
    expect(a.name).toBe('Alex');
    expect(JSON.parse(serialize(b)).state.name).toBe('Bis');
  });
});

describe('actions du joueur', () => {
  it('refuse une candidature sans les prérequis, avec la raison', () => {
    const s = settle(newGame('sans_diplome', 4));
    const r = A.applyForJob(s, 'ingenieur');
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/Diplôme requis/);
  });
  it('limite les candidatures à deux par an', () => {
    let s = clone(settle(newGame('cocon', 4)));
    s.job = null;
    s.training = null;
    s = A.applyForJob(s, 'vendeur').state;
    if (s.job) s = A.quitJob(s, 'demission').state;
    s = A.applyForJob(s, 'equipier').state;
    const third = A.applyForJob(s, 'preparateur');
    expect(third.ok).toBe(false);
    expect(third.message).toMatch(/2 candidatures/);
  });
  it('refuse un achat immobilier sans revenus stables ni apport', () => {
    const s = settle(newGame('cocon', 4));
    const r = A.buyProperty(s, 'maison', true, 1000, 25);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/banque refuse/i);
  });
  it('crée une entreprise et refuse sans capital suffisant', () => {
    const s = clone(settle(newGame('cocon', 4)));
    s.cash = 500;
    expect(A.startBusiness(s, 'restaurant', 500, 0, 'Chez moi').ok).toBe(false);
    s.cash = 10000;
    const r = A.startBusiness(s, 'ecommerce', 6000, 0, 'Boutique');
    expect(r.ok).toBe(true);
    expect(r.state.business!.treasury).toBe(6000);
    expect(r.state.cash).toBe(4000);
  });
  it('la vente de placements taxe la plus-value', () => {
    const s = clone(settle(newGame()));
    s.cash = 0; s.stocks = 2000; s.stocksBasis = 1000;
    const r = A.sellInvestment(s, 'stocks', 2000);
    expect(r.state.cash).toBe(1700);
    expect(r.state.stocks).toBe(0);
  });
});

describe('partage', () => {
  it('encode et décode un résultat sans donnée personnelle', () => {
    const code = encodeResult({ e: 'phenix', n: 123456, k: 200000, a: 52, p: 'heritier' });
    const r = decodeResult(code)!;
    expect(r).toEqual({ e: 'phenix', n: 123500, k: 200000, a: 52, p: 'heritier' });
    expect(atob(code.replace(/-/g, '+').replace(/_/g, '/') + '==')).not.toMatch(/Alex/);
  });
  it('rejette un lien falsifié', () => {
    expect(decodeResult('n_importe_quoi')).toBeNull();
    expect(decodeResult(encodeResult({ e: 'inexistante', n: 1, k: 1, a: 30, p: 'cocon' }))).toBeNull();
  });
  it('génère un texte calculé à partir de la vraie partie', () => {
    const s = clone(settle(newGame()));
    s.counters.businessesCreated = 2; s.counters.bankruptcies = 1; s.cash = 1850000; s.age = 42;
    const t = buildShareText(s, 'Le phénix');
    expect(t).toMatch(/terminé avec 1\s850\s\d{3} € à 42 ans/);
    expect(t).toMatch(/deux entreprises/);
    expect(t).toMatch(/une faillite/);
    expect(t).not.toMatch(/Alex/);
  });
});

describe('cohérence des métiers', () => {
  it('chaque métier a un salaire au moins égal au SMIC (sauf artiste) et des données valides', () => {
    for (const j of Object.values(JOB_BY_ID)) {
      if (j.id !== 'artiste') expect(j.salary).toBeGreaterThanOrEqual(1800);
      expect(j.stress).toBeGreaterThanOrEqual(0);
    }
  });
});
