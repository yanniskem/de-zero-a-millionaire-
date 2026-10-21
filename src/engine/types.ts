// Types centraux du moteur de simulation.
// Tout l'état de partie est sérialisable en JSON (aucune fonction stockée) :
// les fonctions (conditions, résolutions de choix) vivent dans le contenu, référencé par identifiant.

export type SkillId = 'tech' | 'social' | 'manage' | 'craft' | 'care' | 'creative' | 'finance';
export type Skills = Record<SkillId, number>;

export type EducationLevel = 0 | 1 | 2 | 3 | 4 | 5; // aucun, CAP, bac, bac+2, bac+3, bac+5

export type Priority = 'carriere' | 'equilibre' | 'proches' | 'sante' | 'formation';
export type Lifestyle = 'frugal' | 'normal' | 'confort' | 'luxe';
export type Gender = 'f' | 'm';

export type DebtKind = 'conso' | 'etudiant' | 'immo' | 'pro' | 'decouvert' | 'famille';

export interface Debt {
  id: string;
  kind: DebtKind;
  label: string;
  principal: number; // capital restant dû
  rate: number; // taux annuel (0.05 = 5 %)
  monthlyPayment: number;
  propertyId?: string;
}

export interface Property {
  id: string;
  typeId: string;
  label: string;
  value: number;
  purchasePrice: number;
  rent: number; // loyer mensuel perçu si mis en location
  isMainHome: boolean;
  boughtAge: number;
}

export interface JobState {
  jobId: string;
  salary: number; // brut mensuel
  years: number; // ancienneté dans ce poste
  performance: number; // 0-100
}

export interface TrainingState {
  trainingId: string;
  yearsDone: number;
  mode: 'full' | 'part' | 'alternance';
}

export interface Partner {
  name: string;
  strength: number; // 0-100
  years: number;
  cohabiting: boolean;
  married: boolean;
}

export interface Relations {
  family: number;
  friends: number;
  network: number; // réseau professionnel
  partner: Partner | null;
  childrenBirthAges: number[];
  exPartners: number;
}

export interface Business {
  name: string;
  sector: string;
  treasury: number; // trésorerie de l'entreprise (peut être négative = dettes fournisseurs)
  reputation: number; // 0-100
  scale: number; // 1 à 5
  founderPay: number; // rémunération nette mensuelle versée au fondateur
  years: number;
  lastRevenue: number; // annuel
  lastProfit: number; // annuel
  invested: number; // capital apporté par le joueur au total
  loanPrincipal: number; // prêt professionnel restant (dette de l'entreprise)
  loanPayment: number; // mensualité du prêt professionnel
  personalGuarantee: number; // part du prêt garantie personnellement (caution)
  valuationBonus: number; // multiplicateur de valorisation (levée de fonds, buzz...)
  ownership: number; // part du capital détenue par le joueur (1 = 100 %)
  profitableYears: number;
}

export interface PendingConsequence {
  id: string;
  dueAge: number;
  sourceTitle: string;
  title?: string;
  text?: string;
  fx?: Fx;
  eventId?: string; // événement de suite à déclencher
}

export type FlagValue = boolean | number | string;

export interface Fx {
  money?: number;
  savings?: number;
  health?: number;
  energy?: number;
  happiness?: number;
  family?: number;
  friends?: number;
  partner?: number;
  network?: number;
  performance?: number;
  skills?: Partial<Skills>;
  flags?: Record<string, FlagValue>;
  salaryPct?: number;
  loseJob?: 'licenciement' | 'demission' | 'rupture';
  setJob?: { jobId: string; salaryPct?: number };
  addDebt?: { kind: DebtKind; label: string; amount: number; rate: number; years: number };
  startPartner?: boolean;
  breakup?: boolean;
  cohabit?: boolean;
  marry?: boolean;
  child?: boolean;
  startTraining?: { trainingId: string; mode?: 'full' | 'part' | 'alternance' };
  diploma?: string;
  biz?: { cash?: number; reputation?: number; scale?: number; valuationBonus?: number; dilution?: number; close?: 'faillite' | 'fermeture' };
  startBusiness?: { sector: string; capital: number; name?: string };
  stocksPct?: number;
  cryptoPct?: number;
  stocks?: number;
  sellStocksPct?: number; // part du portefeuille vendue (fiscalité de 30 % sur la plus-value)
  propertyValuePct?: number;
  unemploymentMonths?: number;
  sideGig?: boolean;
  familyContribution?: number;
  housingId?: string;
  lifestyle?: Lifestyle;
  repayDebts?: DebtKind;
  consolidateDebts?: { rate: number; years: number; label: string };
  delayed?: DelayedSpec[];
  highlight?: { kind: HighlightKind; text: string };
  moral?: 'good' | 'bad';
  recordSale?: number; // prix de cession d'une entreprise
}

export interface DelayedSpec {
  years: number;
  title?: string;
  text?: string;
  fx?: Fx;
  eventId?: string;
}

export type HighlightKind = 'success' | 'mistake' | 'key';

export interface Highlight {
  kind: HighlightKind;
  age: number;
  text: string;
}

export interface LogEntry {
  age: number;
  kind: 'event' | 'action' | 'year' | 'consequence' | 'milestone';
  title: string;
  text: string;
  deltas?: Delta[];
}

export interface Delta {
  label: string;
  value: number;
  unit: '€' | 'pts' | '';
}

export interface YearSnapshot {
  age: number;
  netWorth: number;
  cash: number;
  income: number; // revenus nets annuels
  expenses: number; // dépenses annuelles (impôts et remboursements compris)
  skillAvg: number;
  careerLevel: number;
  happiness: number;
  health: number;
}

export interface BudgetLine {
  label: string;
  amount: number; // mensuel
  detail?: string;
}

export interface YearReport {
  ageFrom: number;
  ageTo: number;
  incomeLines: BudgetLine[]; // totaux annuels
  expenseLines: BudgetLine[];
  incomeTotal: number;
  expenseTotal: number;
  savingsInterest: number;
  investLines: BudgetLine[];
  businessLine: { revenue: number; costs: number; profit: number; treasury: number } | null;
  netWorthBefore: number;
  netWorthAfter: number;
  overdraft: number;
  notes: string[];
  statChanges: Delta[];
}

export interface CurrentEvent {
  eventId: string;
  outcome?: { choiceLabel: string; text: string; deltas: Delta[] };
}

export interface YearActions {
  applications: number;
  moved: boolean;
  promotionAsked: boolean;
  dating: boolean;
  familyAction: boolean;
  friendsAction: boolean;
  negotiated: boolean;
  childAttempt: boolean;
}

export interface Counters {
  businessesCreated: number;
  businessesSold: number;
  bankruptcies: number;
  promotions: number;
  jobsHeld: number;
  unemploymentYears: number;
  yearsInDebt: number;
  diplomas: number;
  reconversions: number;
  burnouts: number;
  inheritance: number; // montants reçus en héritage / dons familiaux
  bestBusinessSale: number;
  moralGood: number;
  moralBad: number;
}

export interface GameState {
  version: number;
  id: string;
  seed: number;
  rngState: number;
  name: string;
  gender: Gender;
  profileId: string;
  age: number;
  endAge: number;
  phase: 'event' | 'free' | 'ended';

  cash: number;
  savings: number;
  stocks: number;
  stocksBasis: number;
  crypto: number;
  cryptoBasis: number;
  properties: Property[];
  debts: Debt[];
  autoSave: number; // virement mensuel automatique vers l'épargne

  job: JobState | null;
  lastJobId: string | null;
  sideGig: boolean;
  unemploymentMonths: number; // mois d'indemnisation chômage restants
  lastGrossSalary: number;
  sectorYears: Record<string, number>;
  careerPath: { age: number; jobId: string }[];

  education: EducationLevel;
  diplomas: string[];
  training: TrainingState | null;
  skills: Skills;

  health: number;
  energy: number;
  happiness: number;

  relations: Relations;
  housingId: string;
  lifestyle: Lifestyle;
  priority: Priority;
  familyContribution: number; // aide mensuelle versée à la famille

  business: Business | null;

  flags: Record<string, FlagValue>;
  counters: Counters;
  pending: PendingConsequence[];
  seenEvents: Record<string, number>;
  eventQueue: CurrentEvent[];
  recentCategories: string[];
  log: LogEntry[];
  history: YearSnapshot[];
  highlights: Highlight[];
  decisions: { age: number; title: string; choice: string; impact: number }[];
  yearActions: YearActions;
  lastReport: YearReport | null;
  peakNetWorth: number;
  peakAge: number;
  startNetWorth: number;
  startCash: number;
  endingId: string | null;
  nextId: number;
}
