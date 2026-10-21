// Moteur de simulation : création de partie, choix, avancement d'une année.
// Une « année » = 12 mois simulés un par un (revenus, impôts, dépenses, crédits, épargne),
// suivis des évolutions annuelles (placements, carrière, santé, relations, événements).

import { PROFILE_BY_ID } from '../content/profiles';
import {
  CRYPTO_RETURN,
  HOUSING_BY_ID,
  JOB_BY_ID,
  LIFESTYLES,
  PROPERTY_RETURN,
  SAVINGS_RATE,
  STOCK_RETURN,
  TRAINING_BY_ID,
  jobTitle,
} from './catalog';
import { simulateBusinessYear, bankruptcy } from './business';
import { hire, jobRequirementsMissing, leaveJob, salaryCap, trainingEnergyCost } from './career';
import {
  activeChildren,
  addDebt,
  balanceSheet,
  clamp,
  consumerDebt,
  monthlyBudget,
  netWorth,
  payExpense,
  round,
  round2,
  serviceDebtsMonth,
} from './economy';
import { applyFx, diffSnapshots, snapshot } from './effects';
import { choiceViews, drawEvents, fillText, getEvent, PASS_CHOICE } from './events';
import { determineEnding } from './endings';
import { makeRng, type Rng } from './rng';
import type { BudgetLine, Delta, GameState, Gender, SkillId, YearReport } from './types';

export const SAVE_VERSION = 1;
export const RETIREMENT_AGE = 64;

export const GAME_LENGTHS = {
  courte: { label: 'Courte', endAge: 45, description: 'Jusqu’à 45 ans (≈ 27 années de jeu)' },
  normale: { label: 'Normale', endAge: 67, description: 'Jusqu’à 67 ans, retraite comprise' },
  longue: { label: 'Longue', endAge: 80, description: 'Jusqu’à 80 ans' },
} as const;
export type GameLength = keyof typeof GAME_LENGTHS;

export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

export const emptyYearActions = () => ({
  applications: 0,
  moved: false,
  promotionAsked: false,
  dating: false,
  familyAction: false,
  friendsAction: false,
  negotiated: false,
  childAttempt: false,
});

export interface NewGameOptions {
  name: string;
  gender: Gender;
  profileId: string;
  seed: number;
  length?: GameLength;
}

/** Variation contrôlée : légère, bornée, et identique pour une même graine. */
function jitter(rng: Rng, value: number, spread: number, min = 0, max = 100): number {
  return round(clamp(value + rng.range(-spread, spread), min, max));
}

export function createGame(opts: NewGameOptions): GameState {
  const profile = PROFILE_BY_ID[opts.profileId] ?? PROFILE_BY_ID.cocon;
  const rng = makeRng(opts.seed);
  const skills = { tech: 10, social: 10, manage: 8, craft: 10, care: 10, creative: 10, finance: 8 };
  for (const k of Object.keys(skills) as SkillId[]) {
    skills[k] = jitter(rng, profile.skills[k] ?? skills[k], 5, 0, 100);
  }
  const cash = round(profile.cash * rng.range(0.85, 1.15));
  const s: GameState = {
    version: SAVE_VERSION,
    id: `g${opts.seed.toString(36)}`,
    seed: opts.seed,
    rngState: 0,
    name: opts.name.trim().slice(0, 24) || 'Alex',
    gender: opts.gender,
    profileId: profile.id,
    age: 18,
    endAge: GAME_LENGTHS[opts.length ?? 'normale'].endAge,
    phase: 'event',
    cash,
    savings: profile.savings ?? 0,
    stocks: 0,
    stocksBasis: 0,
    crypto: 0,
    cryptoBasis: 0,
    properties: [],
    debts: [],
    autoSave: 0,
    job: null,
    lastJobId: null,
    sideGig: false,
    unemploymentMonths: 0,
    lastGrossSalary: 0,
    sectorYears: {},
    careerPath: [],
    education: profile.education,
    diplomas: [...profile.diplomas],
    training: profile.training ? { ...profile.training, yearsDone: 0 } : null,
    skills,
    health: jitter(rng, profile.health, 5),
    energy: jitter(rng, profile.energy, 5),
    happiness: jitter(rng, profile.happiness, 5),
    relations: {
      family: jitter(rng, profile.family, 6),
      friends: jitter(rng, profile.friends, 6),
      network: jitter(rng, profile.network, 4),
      partner: null,
      childrenBirthAges: [],
      exPartners: 0,
    },
    housingId: profile.housingId,
    lifestyle: profile.lifestyle,
    priority: 'equilibre',
    familyContribution: profile.familyContribution ?? 0,
    business: null,
    flags: { ...(profile.flags ?? {}) },
    counters: {
      businessesCreated: 0, businessesSold: 0, bankruptcies: 0, promotions: 0, jobsHeld: 0,
      unemploymentYears: 0, yearsInDebt: 0, diplomas: 0, reconversions: 0, burnouts: 0,
      inheritance: 0, bestBusinessSale: 0, moralGood: 0, moralBad: 0,
    },
    pending: [],
    seenEvents: {},
    eventQueue: [],
    recentCategories: [],
    log: [],
    history: [],
    highlights: [],
    decisions: [],
    yearActions: emptyYearActions(),
    lastReport: null,
    peakNetWorth: 0,
    peakAge: 18,
    startNetWorth: 0,
    startCash: 0,
    endingId: null,
    nextId: 0,
  };
  if (profile.jobId) {
    hire(s, profile.jobId);
    const job = JOB_BY_ID[profile.jobId];
    s.sectorYears[job.sector] = profile.jobYears ?? 0;
    s.job!.years = profile.jobYears ?? 0;
  }
  for (const d of profile.debts ?? []) addDebt(s, d.kind, d.label, d.amount, d.rate, d.years);
  if (profile.flags?.boursier) s.flags.boursier = true;

  const nw = netWorth(s);
  s.startNetWorth = nw;
  s.startCash = round(s.cash + s.savings);
  s.peakNetWorth = nw;
  s.history.push(yearSnapshot(s, 0, 0));
  s.eventQueue = [{ eventId: `intro_${profile.id}` }];
  s.log.push({ age: 18, kind: 'milestone', title: 'Une vie commence', text: `${s.name}, 18 ans. ${profile.tagline}` });
  s.rngState = rng.state;
  return s;
}

export function careerLevel(s: GameState): number {
  if (s.job) return JOB_BY_ID[s.job.jobId]?.level ?? 1;
  if (s.business) return Math.min(5, 2 + s.business.scale);
  return 0;
}

function yearSnapshot(s: GameState, income: number, expenses: number) {
  const skillVals = Object.values(s.skills);
  return {
    age: s.age,
    netWorth: netWorth(s),
    cash: round(s.cash + s.savings),
    income: round(income),
    expenses: round(expenses),
    skillAvg: round(skillVals.reduce((a, b) => a + b, 0) / skillVals.length),
    careerLevel: careerLevel(s),
    happiness: round(s.happiness),
    health: round(s.health),
  };
}

// ---------------------------------------------------------------------------
// Événements

export interface EngineResult {
  state: GameState;
  ok: boolean;
  message?: string;
}

export function chooseOption(state: GameState, choiceId: string): EngineResult {
  const current = state.eventQueue[0];
  if (state.phase !== 'event' || !current) return { state, ok: false, message: 'Aucun événement en attente.' };
  if (current.outcome) return { state, ok: false, message: 'Ce choix a déjà été fait.' };
  const ev = getEvent(current.eventId);
  if (!ev) {
    const s = clone(state);
    s.eventQueue.shift();
    if (!s.eventQueue.length) s.phase = 'free';
    return { state: s, ok: false, message: 'Événement introuvable : il a été ignoré.' };
  }
  const view = choiceViews(state, ev).find((v) => v.choice.id === choiceId);
  if (!view) return { state, ok: false, message: 'Choix inconnu.' };
  if (!view.available) return { state, ok: false, message: view.reason ?? 'Ce choix est indisponible.' };

  const s = clone(state);
  const rng = makeRng(s.rngState);
  const before = snapshot(s);
  const choice = view.choice;
  let outcome;
  try {
    outcome = typeof choice.outcome === 'function' ? choice.outcome(s, rng) : choice.outcome;
  } catch {
    // Garde-fou : une situation imprévue ne doit jamais bloquer la partie.
    outcome = { text: 'La situation a changé entre-temps : rien ne se passe finalement.' };
  }
  const notes: string[] = [];
  if (choice.cost) {
    const od = payExpense(s, choice.cost);
    if (od > 0) notes.push(`${round(od)} € passent en découvert.`);
  }
  notes.push(...applyFx(s, outcome.fx, rng, ev.title));
  const deltas = diffSnapshots(before, snapshot(s));
  const text = fillText([outcome.text, ...notes].join(' '), s);
  s.eventQueue[0] = { ...current, outcome: { choiceLabel: fillText(choice.label, s), text, deltas } };
  s.seenEvents[ev.id] = s.age;
  s.recentCategories = [...s.recentCategories, ev.category].slice(-6);
  if (choice.id !== PASS_CHOICE.id) {
    const impact = deltas.reduce((t, d) => t + (d.unit === '€' ? Math.abs(d.value) / 1000 : Math.abs(d.value) / 5), 0);
    s.decisions.push({ age: s.age, title: fillText(ev.title, s), choice: fillText(choice.label, s), impact: Math.round(impact * 10) / 10 });
  }
  s.log.push({ age: s.age, kind: 'event', title: fillText(ev.title, s), text: `${fillText(choice.label, s)} — ${text}`, deltas });
  s.rngState = rng.state;
  checkMilestones(s);
  return { state: s, ok: true };
}

export function continueAfterOutcome(state: GameState): GameState {
  if (state.phase !== 'event' || !state.eventQueue[0]?.outcome) return state;
  const s = clone(state);
  s.eventQueue.shift();
  // Un événement encore en attente peut ne plus avoir de sens (ex. : emploi perdu entre-temps).
  s.eventQueue = s.eventQueue.filter((q) => {
    const ev = getEvent(q.eventId);
    if (!ev) return false;
    if (ev.followUp || !ev.when) return true;
    try {
      return ev.when(s);
    } catch {
      return false;
    }
  });
  if (!s.eventQueue.length) s.phase = 'free';
  return s;
}

// ---------------------------------------------------------------------------
// Avancement annuel

function addLine(map: Map<string, BudgetLine>, line: BudgetLine) {
  const prev = map.get(line.label);
  if (prev) prev.amount += line.amount;
  else map.set(line.label, { label: line.label, amount: line.amount, detail: line.detail });
}

export function checkMilestones(s: GameState) {
  const nw = netWorth(s);
  if (nw > s.peakNetWorth) {
    s.peakNetWorth = nw;
    s.peakAge = s.age;
  }
  const marks: [number, string][] = [
    [100000, 'Premier patrimoine à six chiffres : 100 000 € !'],
    [500000, 'Demi-millionnaire : 500 000 € de patrimoine net.'],
    [1000000, 'Millionnaire ! Ton patrimoine net dépasse 1 000 000 €.'],
  ];
  for (const [threshold, text] of marks) {
    const key = `palier${threshold}`;
    if (nw >= threshold && !s.flags[key]) {
      s.flags[key] = s.age;
      s.highlights.push({ kind: 'success', age: s.age, text });
      s.log.push({ age: s.age, kind: 'milestone', title: 'Cap franchi', text });
    }
  }
}

export function canAdvance(s: GameState): { ok: boolean; reason?: string } {
  if (s.phase === 'ended') return { ok: false, reason: 'La partie est terminée.' };
  if (s.phase === 'event') return { ok: false, reason: 'Un événement attend ta décision.' };
  return { ok: true };
}

export function advanceYear(state: GameState): EngineResult {
  const check = canAdvance(state);
  if (!check.ok) return { state, ok: false, message: check.reason };
  const s = clone(state);
  const rng = makeRng(s.rngState);
  const notes: string[] = [];
  const nwBefore = netWorth(s);
  const statsBefore = snapshot(s);
  const ageFrom = s.age;

  // --- Facteurs de l'année
  const job = s.job ? JOB_BY_ID[s.job.jobId] : null;
  const salaryFactor = job?.variable ? clamp(rng.normal(1, job.variable), 0.45, 1.8) : 1;
  if (job?.variable && Math.abs(salaryFactor - 1) > 0.12) {
    notes.push(salaryFactor > 1
      ? `Bonne année : ta part variable a porté ton salaire à ${round(salaryFactor * 100)} % de la normale.`
      : `Année maigre : ta part variable a réduit ton salaire à ${round(salaryFactor * 100)} % de la normale.`);
  }
  const recession = typeof s.flags.recessionUntil === 'number' && s.flags.recessionUntil >= s.age;
  const stockReturn = clamp(rng.normal(recession ? -0.06 : STOCK_RETURN.mean, STOCK_RETURN.sd), -0.45, 0.5);
  const cryptoReturn = clamp(rng.normal(CRYPTO_RETURN.mean, CRYPTO_RETURN.sd), -0.85, 2.5);

  // --- Entreprise (année complète, avant le budget personnel pour connaître la rémunération réellement versée)
  let businessLine: YearReport['businessLine'] = null;
  let founderMonthly = 0;
  let businessFailed = false;
  if (s.business) {
    const r = simulateBusinessYear(s, rng);
    founderMonthly = r.founderPaid / 12;
    businessLine = { revenue: r.revenue, costs: r.costs, profit: r.profit, treasury: round(s.business.treasury) };
    notes.push(...r.notes);
    businessFailed = r.failed;
  }

  // --- 12 mois de budget
  const incomeMap = new Map<string, BudgetLine>();
  const expenseMap = new Map<string, BudgetLine>();
  let overdraft = 0;
  let savingsInterest = 0;
  let interestPaid = 0;
  let incomeTotal = 0;
  let expenseTotal = 0;
  for (let m = 0; m < 12; m++) {
    const b = monthlyBudget(s, { salaryFactor, founderPay: founderMonthly });
    for (const l of b.incomes) addLine(incomeMap, l);
    for (const l of b.expenses) addLine(expenseMap, l);
    if (b.tax > 0) addLine(expenseMap, { label: 'Impôt sur le revenu', amount: b.tax });
    const current = b.expenses.reduce((t, l) => t + l.amount, 0);
    s.cash = round2(s.cash + b.totalIncome - current - b.tax);
    incomeTotal += b.totalIncome;
    expenseTotal += current + b.tax;
    const debt = serviceDebtsMonth(s);
    if (debt.paid > 0) {
      addLine(expenseMap, { label: 'Remboursements de crédits', amount: debt.paid, detail: `dont ${round(debt.interest)} € d’intérêts ce mois-ci` });
      s.cash = round2(s.cash - debt.paid);
      expenseTotal += debt.paid;
      interestPaid += debt.interest;
    }
    if (s.unemploymentMonths > 0 && !s.job) s.unemploymentMonths -= 1;
    if (s.cash < 0) {
      const deficit = -s.cash;
      s.cash = 0;
      overdraft += payExpense(s, deficit);
    }
    if (s.autoSave > 0 && s.cash >= s.autoSave + 200) {
      s.cash = round2(s.cash - s.autoSave);
      s.savings = round2(s.savings + s.autoSave);
    }
    const si = s.savings * (SAVINGS_RATE / 12);
    s.savings = round2(s.savings + si);
    savingsInterest += si;
  }
  if (overdraft > 0) notes.push(`Tes dépenses ont dépassé tes ressources : ${round(overdraft).toLocaleString('fr-FR')} € ont été financés par découvert, au taux de 16 %.`);
  const planNote = applyDebtSafetyNet(s, incomeTotal);
  if (planNote) {
    notes.push(planNote);
    if (planNote.startsWith('Surendettement')) s.highlights.push({ kind: 'mistake', age: s.age, text: 'Plan de surendettement imposé par la Banque de France' });
  }

  // --- Placements et immobilier
  const investLines: BudgetLine[] = [];
  if (s.stocks > 0) {
    const gain = s.stocks * stockReturn;
    s.stocks = round2(s.stocks + gain);
    investLines.push({ label: 'Fonds indiciels (actions)', amount: round(gain), detail: `${(stockReturn * 100).toFixed(1)} % sur l’année` });
  }
  if (s.crypto > 0) {
    const gain = s.crypto * cryptoReturn;
    s.crypto = round2(Math.max(0, s.crypto + gain));
    investLines.push({ label: 'Cryptomonnaies', amount: round(gain), detail: `${(cryptoReturn * 100).toFixed(1)} % sur l’année` });
  }
  if (s.properties.length) {
    let delta = 0;
    for (const p of s.properties) {
      const g = clamp(rng.normal(recession ? -0.02 : PROPERTY_RETURN.mean, PROPERTY_RETURN.sd), -0.12, 0.12);
      const d = round(p.value * g);
      p.value += d;
      delta += d;
    }
    investLines.push({ label: 'Valeur de l’immobilier', amount: delta, detail: 'Évolution estimée du marché' });
  }
  if (savingsInterest > 0) investLines.unshift({ label: 'Intérêts de l’épargne', amount: round(savingsInterest), detail: `${(SAVINGS_RATE * 100).toFixed(1)} % par an` });

  // --- Entreprise : faillite éventuelle
  if (businessFailed && s.business) {
    const msg = bankruptcy(s);
    notes.push(msg);
    s.highlights.push({ kind: 'mistake', age: s.age, text: msg });
    s.happiness = clamp(s.happiness - 15);
    if (!s.job) s.unemploymentMonths = 0;
  }

  // --- Carrière
  if (s.job && job) {
    s.job.years += 1;
    s.sectorYears[job.sector] = (s.sectorYears[job.sector] ?? 0) + 1;
    const skillMatch = Object.keys(job.gains).reduce((t, k) => t + s.skills[k as SkillId], 0) / Math.max(1, Object.keys(job.gains).length);
    const perfTarget = 35 + skillMatch * 0.4 + (s.priority === 'carriere' ? 15 : 0) + (s.energy - 50) * 0.25 - (s.priority === 'proches' ? 4 : 0);
    s.job.performance = round(clamp(s.job.performance + (perfTarget - s.job.performance) * 0.4 + rng.normal(0, 5)));
    const raise = 0.004 + Math.max(0, s.job.performance - 50) / 1600;
    s.job.salary = Math.min(Math.max(s.job.salary, salaryCap(s, s.job.jobId)), round(s.job.salary * (1 + raise)));
    // Promotion spontanée
    if (job.next && s.job.performance >= 65 && jobRequirementsMissing(s, job.next).length === 0 && rng.chance(0.3)) {
      const nextTitle = jobTitle(job.next, s.gender);
      hire(s, job.next, 3);
      s.counters.jobsHeld -= 1;
      s.counters.promotions += 1;
      notes.push(`Promotion ! Ta direction te nomme ${nextTitle.toLowerCase()}.`);
      s.highlights.push({ kind: 'success', age: s.age, text: `Promotion au poste de ${nextTitle.toLowerCase()}` });
    } else {
      // Risque de licenciement
      const risk = job.risk * (s.job.performance < 35 ? 2.5 : 1) * (recession ? 2 : 1);
      if (rng.chance(risk)) {
        notes.push(`Mauvaise nouvelle : ton poste de ${jobTitle(job.id, s.gender).toLowerCase()} est supprimé. Tu touches le chômage.`);
        s.highlights.push({ kind: 'mistake', age: s.age, text: 'Licenciement' });
        leaveJob(s, 'licenciement');
      }
    }
  }

  // --- Formation
  if (s.training) {
    const t = TRAINING_BY_ID[s.training.trainingId];
    const succeeds = !s.flags.redoublement && (s.energy >= 25 || s.priority === 'formation' || rng.chance(0.5));
    delete s.flags.redoublement;
    const mult = s.priority === 'formation' ? 1.3 : 1;
    for (const [k, v] of Object.entries(t.gains) as [SkillId, number][]) s.skills[k] = clamp(s.skills[k] + v * mult);
    if (succeeds) {
      s.training.yearsDone += 1;
      if (s.training.yearsDone >= t.years) {
        if (!s.diplomas.includes(t.diploma)) s.diplomas.push(t.diploma);
        s.counters.diplomas += 1;
        if (t.grantsEducation && t.grantsEducation > s.education) s.education = t.grantsEducation;
        notes.push(`Diplôme obtenu : ${t.name} !`);
        s.highlights.push({ kind: 'success', age: s.age, text: `Diplôme obtenu : ${t.name}` });
        if (s.age >= 30) s.flags.diplomeTardif = true;
        s.training = null;
      }
    } else {
      notes.push(`Année difficile en formation (${t.name}) : trop épuisé${s.gender === 'f' ? 'e' : ''}, tu dois redoubler.`);
    }
  }

  // --- Compétences liées au travail
  const learnMult = s.priority === 'formation' ? 1.4 : s.priority === 'carriere' ? 1.2 : 1;
  if (s.job && job) {
    for (const [k, v] of Object.entries(job.gains) as [SkillId, number][]) {
      s.skills[k] = clamp(s.skills[k] + v * learnMult * (1 - s.skills[k] / 130));
    }
  }
  if (s.business) {
    s.skills.manage = clamp(s.skills.manage + 3 * (1 - s.skills.manage / 130));
    s.skills.finance = clamp(s.skills.finance + 2 * (1 - s.skills.finance / 130));
  }
  if (s.priority === 'formation') s.skills.finance = clamp(s.skills.finance + 1);

  // --- Énergie, santé
  const kids = activeChildren(s);
  const hours = job && s.job ? job.hours : 0;
  const stress = job && s.job ? job.stress : s.business ? 55 : s.training ? 30 : 15;
  const physical = job && s.job ? job.physical : 0;
  let energyTarget = 78 - Math.max(0, s.age - 35) * 0.4 - Math.max(0, hours - 35) * 1.2 - physical / 8 - (s.sideGig ? 12 : 0) - kids * 4;
  if (s.training) energyTarget -= trainingEnergyCost(s.training.mode);
  if (s.business) energyTarget -= s.job ? 18 : 12;
  if (s.flags.teletravail && s.job) energyTarget += 4;
  if (s.flags.chien) energyTarget += 1;
  energyTarget += { carriere: -6, equilibre: 4, proches: 2, sante: 12, formation: -3 }[s.priority];
  s.energy = round(clamp(s.energy * 0.45 + energyTarget * 0.55 + rng.normal(0, 3)));

  let healthDelta = 2 - stress / 28 - physical / 40 + (s.priority === 'sante' ? 5 : 0) + (s.energy < 30 ? -4 : 0);
  if (s.age > 45) healthDelta -= 0.7;
  if (s.age > 60) healthDelta -= 0.9;
  if (s.lifestyle === 'luxe') healthDelta -= 0.5;
  if (s.flags.fumeur) healthDelta -= 1.5;
  if (s.flags.sportif) healthDelta += 1.5;
  s.health = round(clamp(s.health + healthDelta + rng.normal(0, 1.5)));

  // --- Relations
  const overwork = Math.max(0, hours - 40) / 3 + (s.business && !s.job ? 2 : 0) + (s.sideGig ? 2 : 0);
  const p = s.priority;
  s.relations.friends = round(clamp(s.relations.friends - 3 + (p === 'proches' ? 8 : p === 'equilibre' ? 3 : 0) - overwork + (s.housingId === 'coloc' ? 2 : 0) + rng.normal(0, 2)));
  s.relations.family = round(clamp(s.relations.family - 1.5 + (p === 'proches' ? 6 : p === 'equilibre' ? 1.5 : 0) + (s.housingId === 'parents' ? 1 : 0) + (s.familyContribution > 0 ? 2 : 0) + (kids ? 1 : 0) - overwork / 2 + rng.normal(0, 2)));
  s.relations.network = round(clamp(s.relations.network - 1 + (s.job ? 2 : 0) + (p === 'carriere' ? 4 : 0) + (s.business ? 3 : 0) + (HOUSING_BY_ID[s.housingId]?.bigCity ? 1 : 0)));
  if (s.relations.partner) {
    const pt = s.relations.partner;
    pt.years += 1;
    pt.strength = round(clamp(pt.strength - 2.5 + (p === 'proches' ? 8 : p === 'equilibre' ? 2.5 : 0) - overwork - (s.energy < 30 ? 4 : 0) + (pt.married ? 1 : 0) - (consumerDebt(s) > 15000 ? 3 : 0) + rng.normal(0, 3)));
    if (pt.strength < 20 && !s.pending.some((x) => x.eventId === 'suite_rupture')) {
      s.pending.push({ id: `p${++s.nextId}`, dueAge: s.age + 1, sourceTitle: 'Couple', eventId: 'suite_rupture' });
    }
  }

  // --- Satisfaction (convergence vers une cible expliquée par plusieurs facteurs)
  const b = monthlyBudget(s);
  const liquid = s.cash + s.savings;
  const months = liquid / Math.max(1, b.totalExpenses);
  const relAvg = (s.relations.family + s.relations.friends + (s.relations.partner?.strength ?? 35)) / 3;
  let jobSat = -6;
  if (s.job && job) jobSat = (job.passion ?? 5) * 0.5 + s.job.performance / 20 - job.stress / 15;
  else if (s.business) jobSat = 6 + (s.business.lastProfit > 0 ? 3 : -3);
  else if (s.training) jobSat = 4;
  else if (s.age >= RETIREMENT_AGE) jobSat = 6;
  const target = 18 + relAvg * 0.25 + s.health * 0.15 + s.energy * 0.1 + Math.min(months, 12)
    - Math.min(10, consumerDebt(s) / 2000) + jobSat + LIFESTYLES[s.lifestyle].happiness
    + (HOUSING_BY_ID[s.housingId]?.comfort ?? 0) + (kids && s.relations.partner ? 3 : 0)
    - (s.housingId === 'parents' && s.age >= 25 ? 4 : 0);
  s.happiness = round(clamp(s.happiness + (target - s.happiness) * 0.35 + rng.normal(0, 2)));

  // --- Compteurs
  if (!s.job && !s.business && !s.training && s.age < RETIREMENT_AGE) {
    s.counters.unemploymentYears += 1;
    if (s.unemploymentMonths <= 0 || s.counters.unemploymentYears >= 2) s.flags.chomageLong = true;
  }
  if (consumerDebt(s) > 3000) s.counters.yearsInDebt += 1;
  if (s.energy < 20 && s.health < 45 && !s.pending.some((x) => x.eventId === 'suite_burnout')) {
    s.pending.push({ id: `p${++s.nextId}`, dueAge: s.age + 1, sourceTitle: 'Épuisement', eventId: 'suite_burnout' });
  }

  // --- On vieillit d'un an
  s.age += 1;

  // Retraite
  if (s.age >= RETIREMENT_AGE && !s.flags.pension) {
    const ref = s.job?.salary ?? s.lastGrossSalary ?? 0;
    const pension = round(Math.max(1050, ref * 0.78 * 0.62));
    s.flags.pension = pension;
    if (s.job) leaveJob(s, 'demission');
    s.unemploymentMonths = 0;
    s.sideGig = false;
    notes.push(`Retraite ! Tu touches désormais une pension de ${pension.toLocaleString('fr-FR')} € par mois.`);
    s.log.push({ age: s.age, kind: 'milestone', title: 'La retraite', text: `Pension de ${pension.toLocaleString('fr-FR')} € par mois.` });
  }

  // --- Conséquences différées arrivées à échéance
  const due = s.pending.filter((x) => x.dueAge <= s.age);
  s.pending = s.pending.filter((x) => x.dueAge > s.age);
  const followUps: string[] = [];
  for (const c of due) {
    if (c.eventId) {
      followUps.push(c.eventId);
      continue;
    }
    const before = snapshot(s);
    const extra = applyFx(s, c.fx, rng, c.sourceTitle);
    const deltas = diffSnapshots(before, snapshot(s));
    const text = fillText([c.text ?? '', ...extra].join(' ').trim(), s);
    s.log.push({ age: s.age, kind: 'consequence', title: c.title ?? `Conséquence : ${c.sourceTitle}`, text, deltas });
    notes.push(`${c.title ?? c.sourceTitle} — ${text}`);
  }

  // --- Bilan de l'année
  const nwAfter = netWorth(s);
  const statChanges: Delta[] = diffSnapshots(statsBefore, snapshot(s)).filter((d) => d.unit === 'pts');
  const incomeLines = [...incomeMap.values()].map((l) => ({ ...l, amount: round(l.amount) }));
  const expenseLines = [...expenseMap.values()].map((l) => ({ ...l, amount: round(l.amount), detail: l.label === 'Remboursements de crédits' ? `dont ${round(interestPaid).toLocaleString('fr-FR')} € d’intérêts` : l.detail }));
  s.lastReport = {
    ageFrom,
    ageTo: s.age,
    incomeLines,
    expenseLines,
    incomeTotal: round(incomeTotal),
    expenseTotal: round(expenseTotal),
    savingsInterest: round(savingsInterest),
    investLines,
    businessLine,
    netWorthBefore: nwBefore,
    netWorthAfter: nwAfter,
    overdraft: round(overdraft),
    notes,
    statChanges,
  };
  s.history.push(yearSnapshot(s, incomeTotal, expenseTotal));
  s.log.push({
    age: s.age,
    kind: 'year',
    title: `Bilan de mes ${ageFrom} ans`,
    text: `Revenus ${round(incomeTotal).toLocaleString('fr-FR')} €, dépenses ${round(expenseTotal).toLocaleString('fr-FR')} €. Patrimoine net : ${nwAfter.toLocaleString('fr-FR')} €.`,
  });
  checkMilestones(s);
  s.yearActions = emptyYearActions();

  // --- Fin de partie ?
  if (s.age >= s.endAge) {
    s.rngState = rng.state;
    return { state: finishGame(s), ok: true };
  }

  // --- Événements de la nouvelle année
  const queue = followUps.filter((id) => getEvent(id)).map((eventId) => ({ eventId }));
  const extra = Math.max(0, (rng.chance(0.3) ? 2 : 1) - queue.length);
  for (const ev of drawEvents(s, rng, extra)) queue.push({ eventId: ev.id });
  s.eventQueue = queue.slice(0, 3);
  s.phase = s.eventQueue.length ? 'event' : 'free';
  s.rngState = rng.state;
  return { state: s, ok: true };
}

/**
 * Filet de sécurité contre la spirale de la dette : au-delà d'un an de revenus en dettes de consommation,
 * la commission de surendettement regroupe les dettes à 0 %, plafonne les mensualités à 35 % des revenus
 * (l'excédent est effacé), impose un train de vie frugal et inscrit le joueur au fichier bancaire.
 */
export function applyDebtSafetyNet(s: GameState, annualIncome: number): string | null {
  const bad = s.debts.filter((d) => d.kind !== 'immo');
  const total = bad.reduce((t, d) => t + d.principal, 0);
  const threshold = Math.max(12000, annualIncome);
  if (s.flags.planSurendettement) {
    if (!s.debts.some((d) => d.kind !== 'immo')) {
      delete s.flags.planSurendettement;
      return 'Ton plan de surendettement est terminé : tes dettes sont soldées. Tu retrouves la liberté de ton budget.';
    }
    const extra = s.debts.filter((d) => d.kind === 'decouvert');
    if (!extra.length) return null;
  } else if (total <= threshold) {
    return null;
  }
  const monthlyIncome = Math.max(0, annualIncome / 12);
  const maxPayment = Math.max(80, monthlyIncome * 0.35);
  const months = 96;
  const payable = maxPayment * months;
  const kept = Math.min(total, payable);
  const erased = round(total - kept);
  s.debts = s.debts.filter((d) => d.kind === 'immo');
  s.debts.push({ id: `d${++s.nextId}`, kind: 'conso', label: 'Plan de surendettement', principal: round2(kept), rate: 0, monthlyPayment: round2(kept / months) });
  const first = !s.flags.planSurendettement;
  s.flags.planSurendettement = s.age;
  s.flags.ficheBanqueDeFrance = true;
  if (first) s.counters.yearsInDebt += 1;
  return `${first ? 'Surendettement : la Banque de France impose un plan' : 'Ton plan de surendettement est révisé'}. Tes dettes (${round(total).toLocaleString('fr-FR')} €) sont regroupées sans intérêts sur 8 ans${erased > 0 ? `, dont ${erased.toLocaleString('fr-FR')} € effacés car impossibles à rembourser` : ''}. Train de vie frugal imposé, aucun nouveau crédit possible.`;
}

export function finishGame(state: GameState): GameState {
  const s = state;
  s.phase = 'ended';
  s.eventQueue = [];
  checkMilestones(s);
  s.endingId = determineEnding(s).id;
  s.log.push({ age: s.age, kind: 'milestone', title: 'Fin de l’histoire', text: `${s.name} referme le livre de sa vie à ${s.age} ans.` });
  return s;
}

/** Le joueur peut clore son histoire plus tôt (à partir de 30 ans). */
export function endGameEarly(state: GameState): EngineResult {
  if (state.phase === 'ended') return { state, ok: false, message: 'La partie est déjà terminée.' };
  if (state.age < 30) return { state, ok: false, message: 'Tu pourras clore ton histoire à partir de 30 ans.' };
  if (state.phase === 'event') return { state, ok: false, message: 'Réponds d’abord à l’événement en cours.' };
  return { state: finishGame(clone(state)), ok: true };
}

export { balanceSheet };
