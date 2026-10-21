// Actions volontaires du joueur pendant la phase libre de chaque année.
// Chaque action vérifie ses règles et renvoie un message clair si elle est impossible.

import {
  HOUSING_BY_ID,
  JOB_BY_ID,
  MORTGAGE_RATE,
  PROPERTY_TYPE_BY_ID,
  SECTOR_BY_ID,
  TRAINING_BY_ID,
  jobTitle,
  type SectorId,
} from './catalog';
import { businessRequirementsMissing, createBusiness, expansionCost, expansionReputation, salePrice } from './business';
import {
  applicationChance,
  hire,
  salaryCap,
  jobRequirementsMissing,
  leaveJob,
  trainingRequirementsMissing,
} from './career';
import {
  addDebt,
  businessValuation,
  clamp,
  debtRatio,
  liquidity,
  loanPayment,
  monthlyBudget,
  newId,
  repayDebtAmount,
  round,
  round2,
} from './economy';
import { startPartner } from './effects';
import { netWorth as balanceSheetNw } from './economy';
import { makeRng, type Rng } from './rng';
import { checkMilestones, clone, type EngineResult, RETIREMENT_AGE } from './simulation';
import type { GameState, Lifestyle, Priority } from './types';

export class ActionError extends Error {}

const fmt = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`;
const fail = (msg: string): never => {
  throw new ActionError(msg);
};

interface ActOutcome {
  message: string;
  ok?: boolean;
  log?: boolean;
}

function act(state: GameState, title: string, fn: (s: GameState, rng: Rng) => ActOutcome | string): EngineResult {
  if (state.phase === 'ended') return { state, ok: false, message: 'La partie est terminée.' };
  if (state.phase === 'event') return { state, ok: false, message: 'Réponds d’abord à l’événement en cours.' };
  try {
    const s = clone(state);
    const rng = makeRng(s.rngState);
    const r = fn(s, rng);
    const out: ActOutcome = typeof r === 'string' ? { message: r } : r;
    s.rngState = rng.state;
    if (out.log !== false) s.log.push({ age: s.age, kind: 'action', title, text: out.message });
    checkMilestones(s);
    return { state: s, ok: out.ok ?? true, message: out.message };
  } catch (e) {
    if (e instanceof ActionError) return { state, ok: false, message: e.message };
    throw e;
  }
}

/** Réglages sans effet immédiat (pas de journalisation). */
function setting(state: GameState, fn: (s: GameState) => string): EngineResult {
  if (state.phase === 'ended') return { state, ok: false, message: 'La partie est terminée.' };
  try {
    const s = clone(state);
    const message = fn(s);
    return { state: s, ok: true, message };
  } catch (e) {
    if (e instanceof ActionError) return { state, ok: false, message: e.message };
    throw e;
  }
}

// ---- Réglages de vie ----

export const setPriority = (state: GameState, p: Priority) =>
  setting(state, (s) => {
    s.priority = p;
    return 'Priorité de l’année mise à jour.';
  });

export const setLifestyle = (state: GameState, l: Lifestyle) =>
  setting(state, (s) => {
    if (s.flags.planSurendettement && l !== 'frugal') fail('Ton plan de surendettement impose un train de vie frugal jusqu’au remboursement.');
    s.lifestyle = l;
    return 'Train de vie mis à jour.';
  });

export const setAutoSave = (state: GameState, amount: number) =>
  setting(state, (s) => {
    if (amount < 0 || amount > 5000) fail('Montant invalide.');
    s.autoSave = round(amount);
    return amount > 0 ? `Virement automatique de ${fmt(amount)} par mois vers l’épargne.` : 'Virement automatique désactivé.';
  });

export const setFamilyContribution = (state: GameState, amount: number) =>
  setting(state, (s) => {
    if (amount < 0 || amount > 2000) fail('Montant invalide.');
    s.familyContribution = round(amount);
    return amount > 0 ? `Tu verses désormais ${fmt(amount)} par mois à ta famille.` : 'Tu ne verses plus d’aide mensuelle à ta famille.';
  });

// ---- Carrière ----

export const applyForJob = (state: GameState, jobId: string) =>
  act(state, 'Candidature', (s, rng) => {
    if (!JOB_BY_ID[jobId]) fail('Métier inconnu.');
    if (s.age >= RETIREMENT_AGE) fail('Tu es à la retraite.');
    if (s.job?.jobId === jobId) fail('Tu occupes déjà ce poste.');
    if (s.yearActions.applications >= 2) fail('Tu as déjà envoyé 2 candidatures cette année. Réessaie l’an prochain.');
    const missing = jobRequirementsMissing(s, jobId);
    if (missing.length) fail(`Candidature impossible : ${missing.join(' ; ')}.`);
    s.yearActions.applications += 1;
    const title = jobTitle(jobId, s.gender);
    if (rng.chance(applicationChance(s, jobId))) {
      const hadJob = !!s.job;
      hire(s, jobId);
      if (s.training && s.training.mode === 'alternance') s.training = null;
      return `Embauche${hadJob ? ' (tu as démissionné de ton ancien poste)' : ''} : te voilà ${title.toLowerCase()} pour ${fmt(s.job!.salary)} brut par mois.`;
    }
    s.relations.network = clamp(s.relations.network + 1);
    return { ok: false, message: `Ta candidature au poste de ${title.toLowerCase()} n’a pas été retenue cette fois.` };
  });

export const quitJob = (state: GameState, mode: 'demission' | 'rupture') =>
  act(state, mode === 'rupture' ? 'Rupture conventionnelle' : 'Démission', (s, rng) => {
    if (!s.job) fail('Tu n’as pas d’emploi.');
    const title = jobTitle(s.job!.jobId, s.gender).toLowerCase();
    if (mode === 'rupture') {
      if (s.yearActions.negotiated) fail('Tu as déjà tenté une négociation cette année.');
      s.yearActions.negotiated = true;
      if (!rng.chance(0.35 + s.job!.performance / 250)) {
        return { ok: false, message: 'Ton employeur refuse la rupture conventionnelle. Tu restes en poste.' };
      }
      const indemnity = round(s.job!.salary * 0.25 * Math.max(1, s.job!.years));
      s.cash = round2(s.cash + indemnity);
      leaveJob(s, 'rupture');
      return `Rupture conventionnelle signée : tu quittes ton poste de ${title} avec ${fmt(indemnity)} d’indemnité et ${s.unemploymentMonths} mois de droits au chômage.`;
    }
    leaveJob(s, 'demission');
    return `Tu as démissionné de ton poste de ${title}. Une démission n’ouvre pas de droits au chômage.`;
  });

export const askPromotion = (state: GameState) =>
  act(state, 'Entretien avec la direction', (s, rng) => {
    if (!s.job) fail('Tu n’as pas d’emploi.');
    if (s.yearActions.promotionAsked) fail('Tu as déjà sollicité ta direction cette année.');
    s.yearActions.promotionAsked = true;
    const job = JOB_BY_ID[s.job!.jobId];
    const perf = s.job!.performance;
    if (job.next && jobRequirementsMissing(s, job.next).length === 0) {
      if (rng.chance(0.2 + perf / 140)) {
        const t = jobTitle(job.next, s.gender);
        hire(s, job.next, 4);
        s.counters.jobsHeld -= 1;
        s.counters.promotions += 1;
        s.highlights.push({ kind: 'success', age: s.age, text: `Promotion au poste de ${t.toLowerCase()}` });
        return `Promotion accordée ! Tu deviens ${t.toLowerCase()} (${fmt(s.job!.salary)} brut par mois).`;
      }
      s.happiness = clamp(s.happiness - 3);
      return { ok: false, message: 'Promotion refusée pour cette année. Améliore ta performance et retente ta chance.' };
    }
    const cap = salaryCap(s, s.job!.jobId);
    if (s.job!.salary >= cap) {
      return { ok: false, message: `Tu es au plafond de la grille salariale pour ce poste (${fmt(cap)} brut). Pour gagner plus, il faut changer de poste.` };
    }
    if (rng.chance(0.1 + perf / 250)) {
      const pct = rng.int(2, 6);
      s.job!.salary = Math.min(cap, round(s.job!.salary * (1 + pct / 100)));
      return `Augmentation de ${pct} % obtenue : ${fmt(s.job!.salary)} brut par mois.`;
    }
    s.happiness = clamp(s.happiness - 2);
    return { ok: false, message: 'Pas d’augmentation cette année. Ta direction évoque « le contexte ».' };
  });

export const toggleSideGig = (state: GameState) =>
  act(state, 'Petit boulot', (s) => {
    if (s.sideGig) {
      s.sideGig = false;
      return 'Tu arrêtes ton petit boulot du week-end.';
    }
    if (s.age >= RETIREMENT_AGE) fail('Profite de ta retraite !');
    if (s.business && !s.job) fail('Ton entreprise te prend déjà tout ton temps.');
    const job = s.job ? JOB_BY_ID[s.job.jobId] : null;
    if (job && job.hours >= 45) fail('Ton emploi actuel est trop prenant pour cumuler une autre activité.');
    s.sideGig = true;
    return `Tu commences un petit boulot le week-end : environ ${fmt(450)} net par mois, mais moins d’énergie et de temps libre.`;
  });

export const startTraining = (state: GameState, trainingId: string, mode: 'full' | 'part' | 'alternance', financing: 'cash' | 'loan') =>
  act(state, 'Formation', (s, rng) => {
    const t = TRAINING_BY_ID[trainingId] ?? fail('Formation inconnue.');
    const missing = trainingRequirementsMissing(s, trainingId, mode);
    if (missing.length) fail(`Inscription impossible : ${missing.join(' ; ')}.`);
    let cost = t.cost;
    if (mode === 'alternance') cost = 0; // frais pris en charge par l'employeur
    if (mode === 'alternance' && !rng.chance(0.65 + s.relations.network / 300 + s.skills.social / 400)) {
      return { ok: false, message: 'Aucune entreprise n’a retenu ta candidature en alternance cette année. Tu peux postuler autrement ou retenter l’an prochain.' };
    }
    if (cost > 0) {
      if (financing === 'cash') {
        if (liquidity(s) < cost) fail(`Il te faut ${fmt(cost)} pour payer la formation, ou choisis un prêt.`);
        const fromCash = Math.min(s.cash, cost);
        s.cash = round2(s.cash - fromCash);
        s.savings = round2(s.savings - (cost - fromCash));
      } else {
        const young = s.age < 28;
        addDebt(s, young ? 'etudiant' : 'conso', young ? `Prêt étudiant (${t.name})` : `Prêt formation (${t.name})`, cost, young ? 0.015 : 0.055, young ? 7 : 5);
      }
    }
    s.training = { trainingId, yearsDone: 0, mode };
    const modeLabel = mode === 'full' ? 'à temps plein' : mode === 'part' ? 'en cours du soir' : 'en alternance (rémunérée)';
    return `Inscription validée : ${t.name}, ${modeLabel}, pour ${t.years} an${t.years > 1 ? 's' : ''}${cost > 0 ? ` (${fmt(cost)}${financing === 'loan' ? ' financés par un prêt' : ''})` : ''}.`;
  });

export const abandonTraining = (state: GameState) =>
  act(state, 'Abandon de formation', (s) => {
    if (!s.training) fail('Aucune formation en cours.');
    const t = TRAINING_BY_ID[s.training!.trainingId];
    s.training = null;
    s.happiness = clamp(s.happiness - 4);
    return `Tu abandonnes ${t.name}. Les frais déjà engagés ne sont pas remboursés.`;
  });

// ---- Logement ----

export function movingCost(s: GameState, housingId: string): number {
  const h = HOUSING_BY_ID[housingId];
  if (!h) return 0;
  return h.rent * (s.relations.partner?.cohabiting ? 0.5 : 1) + 400;
}

export const moveHousing = (state: GameState, housingId: string) =>
  act(state, 'Déménagement', (s) => {
    const h = HOUSING_BY_ID[housingId] ?? fail('Logement inconnu.');
    if (h.owned) fail('Pour devenir propriétaire, achète un bien dans l’onglet Patrimoine.');
    if (s.housingId === housingId) fail('Tu habites déjà ici.');
    if (s.yearActions.moved) fail('Tu as déjà déménagé cette année.');
    if (housingId === 'parents') {
      if (s.relations.family < 30) fail('Tes relations avec ta famille sont trop tendues pour revenir vivre chez tes parents.');
      if (s.age >= 35) fail('Revenir chez tes parents n’est plus vraiment une option à ton âge.');
    }
    const cost = movingCost(s, housingId);
    if (liquidity(s) < cost) fail(`Il te faut ${fmt(cost)} pour le dépôt de garantie et le déménagement.`);
    const fromCash = Math.min(s.cash, cost);
    s.cash = round2(s.cash - fromCash);
    s.savings = round2(s.savings - (cost - fromCash));
    let extra = '';
    const main = s.properties.find((p) => p.isMainHome);
    if (main) {
      main.isMainHome = false;
      extra = ` Ton ancien logement (${main.label}) est désormais mis en location.`;
    }
    s.housingId = housingId;
    s.yearActions.moved = true;
    return `Déménagement : ${h.name}. Coût d’installation : ${fmt(cost)}.${extra}`;
  });

export interface MortgageQuote {
  price: number;
  fees: number;
  minDeposit: number;
  deposit: number;
  loan: number;
  monthly: number;
  ratio: number;
  problems: string[];
}

export function mortgageQuote(s: GameState, typeId: string, asMain: boolean, deposit: number, years: number): MortgageQuote {
  const t = PROPERTY_TYPE_BY_ID[typeId];
  const price = t?.price ?? 0;
  const fees = round(price * 0.08);
  const minDeposit = round(price * 0.1);
  const loan = Math.max(0, price + fees - deposit);
  const monthly = round2(loanPayment(loan, MORTGAGE_RATE, years));
  // Les loyers futurs comptent à 70 % pour la banque.
  const rentCredit = asMain ? 0 : (t?.rent ?? 0) * 0.95 * 0.7;
  const b = monthlyBudget(s);
  const income = b.incomes
    .filter((l) => !['RSA', 'Aide au logement', 'Allocation chômage', "Bourse d'études"].includes(l.label))
    .reduce((x, l) => x + (l.label === 'Loyers perçus' ? l.amount * 0.7 : l.amount), 0) + rentCredit;
  const existing = s.debts.filter((d) => d.kind !== 'decouvert').reduce((x, d) => x + d.monthlyPayment, 0);
  const ratio = income > 0 ? (existing + monthly) / income : Infinity;
  const problems: string[] = [];
  if (!t) problems.push('Bien inconnu.');
  if (deposit < minDeposit) problems.push(`Apport minimum : ${fmt(minDeposit)} (10 % du prix).`);
  if (deposit > liquidity(s)) problems.push(`Apport supérieur à tes liquidités (${fmt(liquidity(s))}).`);
  const stable = (s.job && (s.job.years >= 1 || JOB_BY_ID[s.job.jobId].level >= 3) && s.job.jobId !== 'artiste')
    || (s.business && s.business.profitableYears >= 2) || typeof s.flags.pension === 'number';
  if (!stable) problems.push('La banque exige des revenus stables : un emploi depuis au moins un an, ou une entreprise rentable depuis deux ans.');
  if (ratio > 0.35) problems.push(`Taux d’endettement de ${Math.round(ratio * 100)} % : la banque plafonne à 35 %.`);
  if (asMain && s.properties.some((p) => p.isMainHome)) problems.push('Tu possèdes déjà ta résidence principale.');
  if (s.flags.ficheBanqueDeFrance) problems.push(`Tu es fiché${s.gender === 'f' ? 'e' : ''} à la Banque de France : aucun crédit possible pour l’instant.`);
  return { price, fees, minDeposit, deposit, loan, monthly, ratio, problems };
}

export const buyProperty = (state: GameState, typeId: string, asMain: boolean, deposit: number, years: 20 | 25) =>
  act(state, 'Achat immobilier', (s) => {
    const t = PROPERTY_TYPE_BY_ID[typeId] ?? fail('Bien inconnu.');
    const q = mortgageQuote(s, typeId, asMain, deposit, years);
    if (q.problems.length) fail(`La banque refuse le prêt : ${q.problems.join(' ')}`);
    const fromCash = Math.min(s.cash, deposit);
    s.cash = round2(s.cash - fromCash);
    s.savings = round2(s.savings - (deposit - fromCash));
    const id = newId(s, 'b');
    s.properties.push({ id, typeId, label: t.label, value: t.price, purchasePrice: t.price, rent: t.rent, isMainHome: asMain, boughtAge: s.age });
    if (q.loan > 0) addDebt(s, 'immo', `Crédit immobilier (${t.label})`, q.loan, MORTGAGE_RATE, years, id);
    if (asMain) {
      s.housingId = 'proprietaire';
      s.yearActions.moved = true;
    }
    s.highlights.push({ kind: 'key', age: s.age, text: `Achat ${asMain ? 'de ma résidence principale' : 'd’un bien locatif'} : ${t.label.toLowerCase()}` });
    return `Achat signé : ${t.label} pour ${fmt(t.price)} (+ ${fmt(q.fees)} de frais de notaire). Apport : ${fmt(deposit)}, crédit de ${fmt(q.loan)} sur ${years} ans, soit ${fmt(q.monthly)} par mois.`;
  });

export const sellProperty = (state: GameState, propertyId: string) =>
  act(state, 'Vente immobilière', (s) => {
    const p = s.properties.find((x) => x.id === propertyId) ?? fail('Bien introuvable.');
    if (s.age - p.boughtAge < 1) fail('Attends au moins un an après l’achat avant de revendre.');
    const gross = round(p.value * 0.95);
    const loans = s.debts.filter((d) => d.propertyId === p.id);
    const loanTotal = loans.reduce((t, d) => t + d.principal, 0);
    const gain = Math.max(0, p.value - p.purchasePrice);
    const tax = p.isMainHome ? 0 : round(gain * 0.25);
    const net = round2(gross - loanTotal - tax);
    s.debts = s.debts.filter((d) => d.propertyId !== p.id);
    s.properties = s.properties.filter((x) => x.id !== p.id);
    if (net >= 0) s.cash = round2(s.cash + net);
    else {
      const short = -net;
      if (liquidity(s) < short) fail(`La vente ne couvre pas le crédit restant : il te manque ${fmt(short)}.`);
      const fromCash = Math.min(s.cash, short);
      s.cash = round2(s.cash - fromCash);
      s.savings = round2(s.savings - (short - fromCash));
    }
    if (p.isMainHome) {
      s.housingId = s.relations.partner?.cohabiting || s.relations.childrenBirthAges.length ? 't3' : 't2';
    }
    return `Vente de ${p.label.toLowerCase()} pour ${fmt(gross)} (frais d’agence déduits). Crédit soldé : ${fmt(loanTotal)}${tax ? `, impôt sur la plus-value : ${fmt(tax)}` : ''}. Il te reste ${fmt(net)}.${p.isMainHome ? ' Tu repasses en location.' : ''}`;
  });

// ---- Argent ----

export const depositSavings = (state: GameState, amount: number) =>
  act(state, 'Épargne', (s) => {
    const a = round2(Math.min(amount, s.cash));
    if (a <= 0) fail('Aucun argent disponible à placer.');
    s.cash = round2(s.cash - a);
    s.savings = round2(s.savings + a);
    return { message: `${fmt(a)} placés sur ton livret d’épargne.`, log: false };
  });

export const withdrawSavings = (state: GameState, amount: number) =>
  act(state, 'Retrait d’épargne', (s) => {
    const a = round2(Math.min(amount, s.savings));
    if (a <= 0) fail('Ton épargne est vide.');
    s.savings = round2(s.savings - a);
    s.cash = round2(s.cash + a);
    return { message: `${fmt(a)} retirés de ton épargne.`, log: false };
  });

export const buyInvestment = (state: GameState, kind: 'stocks' | 'crypto', amount: number) =>
  act(state, 'Investissement', (s) => {
    const a = round2(Math.min(amount, s.cash));
    if (a < 50) fail('Montant minimum : 50 € d’argent disponible.');
    s.cash = round2(s.cash - a);
    if (kind === 'stocks') {
      s.stocks = round2(s.stocks + a);
      s.stocksBasis = round2(s.stocksBasis + a);
    } else {
      s.crypto = round2(s.crypto + a);
      s.cryptoBasis = round2(s.cryptoBasis + a);
    }
    if (!s.flags.premierInvestissement) {
      s.flags.premierInvestissement = s.age;
      s.highlights.push({ kind: 'key', age: s.age, text: `Premier investissement en ${kind === 'stocks' ? 'bourse' : 'cryptomonnaies'}` });
    }
    return `${fmt(a)} investis en ${kind === 'stocks' ? 'fonds indiciels actions' : 'cryptomonnaies'}.`;
  });

/** Vente avec fiscalité forfaitaire de 30 % sur la plus-value réalisée. */
export const sellInvestment = (state: GameState, kind: 'stocks' | 'crypto', amount: number) =>
  act(state, 'Vente de placements', (s) => {
    const holding = kind === 'stocks' ? s.stocks : s.crypto;
    const basis = kind === 'stocks' ? s.stocksBasis : s.cryptoBasis;
    const a = round2(Math.min(amount, holding));
    if (a <= 0) fail('Rien à vendre.');
    const share = a / holding;
    const basisSold = basis * share;
    const gain = a - basisSold;
    const tax = gain > 0 ? round2(gain * 0.3) : 0;
    if (kind === 'stocks') {
      s.stocks = round2(s.stocks - a);
      s.stocksBasis = round2(basis - basisSold);
    } else {
      s.crypto = round2(s.crypto - a);
      s.cryptoBasis = round2(basis - basisSold);
    }
    s.cash = round2(s.cash + a - tax);
    return `Vente de ${fmt(a)} de ${kind === 'stocks' ? 'fonds indiciels' : 'cryptomonnaies'}${tax ? ` (impôt de 30 % sur la plus-value : ${fmt(tax)})` : gain < 0 ? ` (moins-value de ${fmt(-gain)})` : ''}.`;
  });

export const repayDebt = (state: GameState, debtId: string, amount: number) =>
  act(state, 'Remboursement anticipé', (s) => {
    const d = s.debts.find((x) => x.id === debtId) ?? fail('Dette introuvable.');
    if (s.cash <= 0) fail('Aucun argent disponible pour rembourser.');
    const label = d.label;
    const paid = repayDebtAmount(s, debtId, amount);
    if (paid <= 0) fail('Remboursement impossible.');
    const left = s.debts.find((x) => x.id === debtId)?.principal ?? 0;
    return left > 0 ? `${fmt(paid)} remboursés sur « ${label} ». Reste dû : ${fmt(left)}.` : `« ${label} » est entièrement remboursé !`;
  });

export function personalLoanProblems(s: GameState, amount: number, years: number): string[] {
  const problems: string[] = [];
  if (amount < 500 || amount > 30000) problems.push('Montant entre 500 € et 30 000 €.');
  if (s.flags.ficheBanqueDeFrance) problems.push(`Tu es fiché${s.gender === 'f' ? 'e' : ''} à la Banque de France.`);
  const payment = loanPayment(amount, 0.065, years);
  const ratio = debtRatio(s, payment);
  if (!isFinite(ratio)) problems.push('La banque exige des revenus.');
  else if (ratio > 0.4) problems.push(`Taux d’endettement trop élevé (${Math.round(ratio * 100)} %).`);
  return problems;
}

export const takePersonalLoan = (state: GameState, amount: number, years: number) =>
  act(state, 'Prêt personnel', (s) => {
    const problems = personalLoanProblems(s, amount, years);
    if (problems.length) fail(`Prêt refusé : ${problems.join(' ')}`);
    const d = addDebt(s, 'conso', 'Prêt personnel', amount, 0.065, years);
    s.cash = round2(s.cash + amount);
    return `Prêt de ${fmt(amount)} accordé à 6,5 % sur ${years} ans : ${fmt(d.monthlyPayment)} par mois.`;
  });

// ---- Relations ----

export const seekLove = (state: GameState) =>
  act(state, 'Vie sentimentale', (s, rng) => {
    if (s.relations.partner) fail('Tu es déjà en couple.');
    if (s.yearActions.dating) fail('Tu as déjà tenté ta chance cette année.');
    s.yearActions.dating = true;
    const p = 0.25 + s.skills.social / 250 + s.relations.friends / 300 + s.happiness / 400 - Math.max(0, s.age - 45) / 100;
    if (rng.chance(clamp(p, 0.1, 0.8))) {
      startPartner(s, rng, 50);
      s.happiness = clamp(s.happiness + 6);
      return `Une rencontre ! Tu commences une histoire avec ${s.relations.partner!.name}.`;
    }
    return { ok: false, message: 'Quelques rendez-vous sympathiques, mais pas d’étincelle cette année.' };
  });

export const moveInTogether = (state: GameState) =>
  act(state, 'Vie de couple', (s) => {
    const p = s.relations.partner ?? fail('Tu n’es pas en couple.');
    if (p.cohabiting) fail('Vous vivez déjà ensemble.');
    if (p.strength < 50) fail('Votre relation n’est pas encore assez solide (50+ requis).');
    if (s.housingId === 'parents' || s.housingId === 'coloc') fail('Il vous faut d’abord un logement à vous deux : déménage dans un appartement.');
    p.cohabiting = true;
    p.strength = clamp(p.strength + 5);
    return `${p.name} et toi emménagez ensemble. Loyer et charges sont désormais partagés.`;
  });

export const formalizeUnion = (state: GameState, kind: 'pacs' | 'mariage') =>
  act(state, kind === 'pacs' ? 'PACS' : 'Mariage', (s) => {
    const p = s.relations.partner ?? fail('Tu n’es pas en couple.');
    if (p.married) fail('Vous êtes déjà unis.');
    if (!p.cohabiting || p.years < 1) fail('Il faut vivre ensemble depuis au moins un an.');
    if (p.strength < 55) fail('Votre relation traverse une période trop fragile.');
    const cost = kind === 'mariage' ? 9000 : 300;
    if (liquidity(s) < cost) fail(`Il te faut ${fmt(cost)}.`);
    const fromCash = Math.min(s.cash, cost);
    s.cash = round2(s.cash - fromCash);
    s.savings = round2(s.savings - (cost - fromCash));
    p.married = true;
    p.strength = clamp(p.strength + (kind === 'mariage' ? 10 : 6));
    s.happiness = clamp(s.happiness + (kind === 'mariage' ? 8 : 5));
    s.relations.family = clamp(s.relations.family + (kind === 'mariage' ? 6 : 2));
    s.highlights.push({ kind: 'key', age: s.age, text: kind === 'mariage' ? `Mariage avec ${p.name}` : `PACS avec ${p.name}` });
    return kind === 'mariage' ? `Mariage avec ${p.name} ! Une fête inoubliable (${fmt(cost)}).` : `PACS signé avec ${p.name}. Simple et officiel.`;
  });

export const tryForChild = (state: GameState) =>
  act(state, 'Projet d’enfant', (s, rng) => {
    const p = s.relations.partner ?? fail('Ce projet se construit à deux : tu n’es pas en couple.');
    if (s.yearActions.childAttempt) fail('Une seule tentative par an.');
    if (p.strength < 55) fail('Votre couple doit d’abord être plus solide (55+).');
    if (s.age > 46) fail('Ce projet n’est plus d’actualité.');
    s.yearActions.childAttempt = true;
    if (!rng.chance(s.age < 35 ? 0.75 : 0.5)) return { ok: false, message: 'Pas de bonne nouvelle cette année. Vous pourrez réessayer.' };
    s.relations.childrenBirthAges.push(s.age);
    s.happiness = clamp(s.happiness + 8);
    s.energy = clamp(s.energy - 10);
    p.strength = clamp(p.strength + 4);
    s.relations.family = clamp(s.relations.family + 6);
    const n = s.relations.childrenBirthAges.length;
    s.highlights.push({ kind: 'key', age: s.age, text: n === 1 ? 'Naissance de mon premier enfant' : `Naissance de mon ${n}e enfant` });
    return `Naissance ! ${n === 1 ? 'Ton premier enfant' : `Ton ${n}e enfant`} vient au monde. Nuits courtes et immense bonheur.`;
  });

export const breakUp = (state: GameState) =>
  act(state, 'Rupture', (s) => {
    const p = s.relations.partner ?? fail('Tu n’es pas en couple.');
    let msg = `Tu mets fin à ton histoire avec ${p.name}.`;
    if (p.married) {
      const cost = round(Math.min(liquidity(s) * 0.3, 15000) + 2500);
      const fromCash = Math.min(s.cash, cost);
      s.cash = round2(s.cash - fromCash);
      s.savings = round2(s.savings - Math.min(s.savings, cost - fromCash));
      msg += ` Le divorce coûte ${fmt(cost)} (avocats et partage).`;
    }
    s.relations.partner = null;
    s.relations.exPartners += 1;
    s.happiness = clamp(s.happiness - 10);
    return msg;
  });

export const visitFamily = (state: GameState) =>
  act(state, 'Famille', (s) => {
    if (s.yearActions.familyAction) fail('Tu as déjà passé du temps de qualité avec ta famille cette année.');
    if (liquidity(s) < 150) fail('Il te faut au moins 150 € pour le trajet et les cadeaux.');
    s.yearActions.familyAction = true;
    s.cash = round2(s.cash - Math.min(150, s.cash));
    s.relations.family = clamp(s.relations.family + 7);
    s.happiness = clamp(s.happiness + 2);
    return { message: 'Un long week-end en famille. Ça fait du bien à tout le monde (–150 €).', log: true };
  });

export const seeFriends = (state: GameState) =>
  act(state, 'Amis', (s) => {
    if (s.yearActions.friendsAction) fail('Tu as déjà organisé une grande soirée cette année.');
    if (liquidity(s) < 120) fail('Il te faut au moins 120 €.');
    s.yearActions.friendsAction = true;
    s.cash = round2(s.cash - Math.min(120, s.cash));
    s.relations.friends = clamp(s.relations.friends + 7);
    s.relations.network = clamp(s.relations.network + 1);
    s.happiness = clamp(s.happiness + 2);
    return 'Tu organises une soirée mémorable avec tes amis (–120 €).';
  });

// ---- Entreprise ----

export const startBusiness = (state: GameState, sectorId: string, capital: number, loan: number, name: string) =>
  act(state, 'Création d’entreprise', (s) => {
    const sector = SECTOR_BY_ID[sectorId] ?? fail('Secteur inconnu.');
    const missing = businessRequirementsMissing(s, sectorId, capital + loan);
    if (missing.length) fail(`Création impossible : ${missing.join(' ; ')}.`);
    if (capital > s.cash) fail(`Ton apport (${fmt(capital)}) dépasse ton argent disponible (${fmt(s.cash)}). Retire d’abord de l’épargne.`);
    if (loan > capital * 2) fail('La banque prête au maximum deux fois ton apport.');
    if (loan > 0 && s.flags.ficheBanqueDeFrance) fail('Inscription au fichier de la Banque de France : pas de prêt professionnel.');
    if (s.age >= RETIREMENT_AGE + 6) fail('Il est temps de profiter de la vie.');
    createBusiness(s, sectorId, capital, loan, name.trim().slice(0, 30) || sector.name);
    s.highlights.push({ kind: 'key', age: s.age, text: `Création de ${s.business!.name} (${sector.name.toLowerCase()})` });
    return `${s.business!.name} est officiellement créée ! Trésorerie de départ : ${fmt(capital + loan)}${loan ? `, dont un prêt de ${fmt(loan)} garanti à 50 % sur tes biens personnels` : ''}. Pense à fixer ta rémunération.`;
  });

export const setFounderPay = (state: GameState, amount: number) =>
  setting(state, (s) => {
    if (!s.business) fail('Tu n’as pas d’entreprise.');
    if (amount < 0 || amount > 15000) fail('Montant invalide.');
    s.business!.founderPay = round(amount);
    return amount > 0 ? `Ta rémunération est fixée à ${fmt(amount)} net par mois (coût pour l’entreprise : ${fmt(amount * 1.45)}).` : 'Tu ne te verses plus de rémunération.';
  });

export const injectBusiness = (state: GameState, amount: number) =>
  act(state, 'Apport en trésorerie', (s) => {
    const b = s.business ?? fail('Tu n’as pas d’entreprise.');
    const a = round2(Math.min(amount, s.cash));
    if (a <= 0) fail('Aucun argent disponible.');
    s.cash = round2(s.cash - a);
    b.treasury = round2(b.treasury + a);
    b.invested = round2(b.invested + a);
    return `Tu apportes ${fmt(a)} à ${b.name}.`;
  });

export const withdrawDividends = (state: GameState, amount: number) =>
  act(state, 'Dividendes', (s) => {
    const b = s.business ?? fail('Tu n’as pas d’entreprise.');
    const reserve = SECTOR_BY_ID[b.sector].baseCosts * b.scale;
    const available = Math.max(0, b.treasury - b.loanPrincipal - reserve);
    if (available <= 0) fail(`Trésorerie insuffisante : il faut garder au moins un mois de charges (${fmt(reserve)}) et couvrir le prêt.`);
    const a = round2(Math.min(amount, available));
    b.treasury = round2(b.treasury - a);
    const net = round2(a * 0.7);
    s.cash = round2(s.cash + net);
    return `${fmt(a)} de dividendes versés, soit ${fmt(net)} après l’impôt forfaitaire de 30 %.`;
  });

export const expandBusiness = (state: GameState) =>
  act(state, 'Développement', (s) => {
    const b = s.business ?? fail('Tu n’as pas d’entreprise.');
    if (b.scale >= 5) fail('Ton entreprise a atteint sa taille maximale.');
    if (b.lastProfit <= 0) fail('Il faut au moins une année bénéficiaire pour convaincre de grandir.');
    if (b.reputation < expansionReputation(b)) fail(`La réputation de l’entreprise doit atteindre ${expansionReputation(b)}.`);
    const cost = expansionCost(b);
    if (b.treasury < cost) fail(`Il faut ${fmt(cost)} de trésorerie pour financer ce développement.`);
    b.treasury = round2(b.treasury - cost);
    b.scale += 1;
    return `${b.name} change de dimension (taille ${b.scale}) : nouveaux locaux, recrutements, plus de clients… et plus de charges. Investissement : ${fmt(cost)}.`;
  });

export const sellBusiness = (state: GameState) =>
  act(state, 'Cession d’entreprise', (s, rng) => {
    const b = s.business ?? fail('Tu n’as pas d’entreprise.');
    if (b.years < 2) fail('Un repreneur veut au moins deux années d’historique.');
    if (b.lastProfit <= 0) fail('Personne ne rachète une entreprise déficitaire à bon prix. Redresse-la d’abord.');
    const price = round(salePrice(b) * rng.range(0.85, 1.15));
    const gain = Math.max(0, price - b.invested);
    const tax = round(gain * 0.2);
    s.cash = round2(s.cash + price - tax);
    s.business = null;
    s.counters.businessesSold += 1;
    s.counters.bestBusinessSale = Math.max(s.counters.bestBusinessSale, price);
    s.highlights.push({ kind: 'success', age: s.age, text: `Vente de ${b.name} pour ${fmt(price)}` });
    return `Vendue ! ${b.name} est cédée pour ${fmt(price)}. Après impôt sur la plus-value (${fmt(tax)}), tu encaisses ${fmt(price - tax)}.`;
  });

export const closeBusiness = (state: GameState) =>
  act(state, 'Fermeture d’entreprise', (s) => {
    const b = s.business ?? fail('Tu n’as pas d’entreprise.');
    const net = b.treasury - b.loanPrincipal;
    s.business = null;
    if (net >= 0) {
      s.cash = round2(s.cash + net * 0.9);
      return `Tu fermes ${b.name} proprement et récupères ${fmt(net * 0.9)} après frais de liquidation.`;
    }
    const guaranteed = round(Math.min(-net, b.loanPrincipal) * b.personalGuarantee);
    if (guaranteed > 0) addDebt(s, 'pro', `Caution du prêt de ${b.name}`, guaranteed, 0.05, 5);
    s.counters.bankruptcies += 1;
    s.flags.faillite = true;
    if (b.invested >= 5000) s.flags.nwAtFaillite = balanceSheetNw(s);
    s.highlights.push({ kind: 'mistake', age: s.age, text: `Fermeture déficitaire de ${b.name}` });
    return `${b.name} ferme ses portes avec des dettes. ${guaranteed > 0 ? `Ta caution personnelle te coûte ${fmt(guaranteed)}, à rembourser sur 5 ans.` : 'Tu perds ta mise.'}`;
  });

export { businessValuation };
export type { SectorId };
