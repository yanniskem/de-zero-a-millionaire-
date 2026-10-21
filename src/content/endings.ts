// Fins de vie. La fin retenue est celle de plus haute priorité dont la condition est remplie.
// Les conditions combinent patrimoine, carrière, relations, santé et histoire vécue.

import type { GameState } from '../engine/types';

export interface EndingContext {
  netWorth: number;
  peak: number;
  consumerDebt: number;
  relationsAvg: number;
  careerLevel: number;
  bestSalary: number;
  passiveShare: number; // part du patrimoine en placements et immobilier locatif
  passiveIncome: number; // revenu passif annuel estimé
  annualExpenses: number;
  children: number;
  disadvantagedStart: boolean;
  creativeCareer: boolean;
}

export interface EndingDef {
  id: string;
  title: string;
  emoji: string;
  priority: number;
  rarity: string;
  condition: (s: GameState, c: EndingContext) => boolean;
  conclusion: (s: GameState, c: EndingContext) => string;
}

const eur = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`;

export const ENDINGS: EndingDef[] = [
  {
    id: 'phenix',
    title: 'Le phénix',
    emoji: '🔥',
    priority: 101,
    rarity: 'Rare',
    condition: (s, c) => s.counters.bankruptcies > 0 && c.netWorth >= 250000 && typeof s.flags.nwAtFaillite === 'number' && s.flags.nwAtFaillite < 100000,
    conclusion: (s, c) =>
      `${s.name} a connu la faillite, les nuits blanches et les regards inquiets. Mais au lieu d’abandonner, ${s.gender === 'f' ? 'elle' : 'il'} a tout reconstruit pour finir avec ${eur(c.netWorth)}. Sa plus grande richesse : savoir se relever.`,
  },
  {
    id: 'empire',
    title: '{Entrepreneur|Entrepreneuse} à succès',
    emoji: '🏆',
    priority: 100,
    rarity: 'Rare',
    condition: (s) => s.counters.bestBusinessSale >= 400000 || (s.business !== null && s.business.lastProfit * 3 >= 600000),
    conclusion: (s, c) =>
      `D’une idée à une entreprise solide : ${s.name} a bâti quelque chose qui lui survivra. Créations, risques, recrutements… le pari a payé, avec un patrimoine final de ${eur(c.netWorth)}.`,
  },
  {
    id: 'sacrifice',
    title: 'Au sommet, mais {seul|seule}',
    emoji: '🗻',
    priority: 99,
    rarity: 'Peu commune',
    condition: (s, c) => (c.netWorth >= 400000 || c.careerLevel >= 4) && c.relationsAvg < 35 && !s.relations.partner,
    conclusion: (s, c) =>
      `${s.name} a réussi ce que beaucoup envient : une carrière brillante et ${eur(c.netWorth)} de patrimoine. Mais les dîners de famille manqués et les amis perdus de vue ont laissé un grand silence. Une réussite au goût doux-amer.`,
  },
  {
    id: 'autodidacte',
    title: 'Millionnaire autodidacte',
    emoji: '💎',
    priority: 98,
    rarity: 'Très rare',
    condition: (s, c) => c.netWorth >= 1000000 && s.education <= 2 && !s.flags.heritier,
    conclusion: (s, c) =>
      `Sans grand diplôme ni héritage, ${s.name} est devenu${s.gender === 'f' ? 'e' : ''} millionnaire : ${eur(c.netWorth)} de patrimoine net. Une trajectoire construite décision après décision, à force de travail, d’audace et d’un peu de chance.`,
  },
  {
    id: 'investisseur',
    title: '{Investisseur fortuné|Investisseuse fortunée}',
    emoji: '📈',
    priority: 96,
    rarity: 'Rare',
    condition: (_s, c) => c.netWorth >= 700000 && c.passiveShare >= 0.5,
    conclusion: (s, c) =>
      `Placements, immobilier, patience : ${s.name} a laissé le temps travailler. Avec ${eur(c.netWorth)} et environ ${eur(c.passiveIncome)} de revenus passifs par an, l’argent n’est plus une question.`,
  },
  {
    id: 'chute',
    title: 'La fortune envolée',
    emoji: '🍂',
    priority: 94,
    rarity: 'Peu commune',
    condition: (_s, c) => c.peak >= 150000 && c.netWorth < c.peak * 0.25,
    conclusion: (s, c) =>
      `Il fut un temps où ${s.name} pesait ${eur(c.peak)}. Il n’en reste que ${eur(c.netWorth)}. Mauvais placements, dépenses, coups du sort : une leçon chèrement payée sur la fragilité de la richesse.`,
  },
  {
    id: 'ruine',
    title: 'Ruine financière',
    emoji: '🕳️',
    priority: 93,
    rarity: 'Peu commune',
    condition: (_s, c) => c.netWorth < -10000,
    conclusion: (s, c) =>
      `${s.name} termine avec un patrimoine négatif de ${eur(c.netWorth)}. Les dettes ont fini par tout emporter. Une histoire dure, mais pas sans enseignements pour la prochaine vie.`,
  },
  {
    id: 'millionnaire',
    title: 'Millionnaire',
    emoji: '💰',
    priority: 90,
    rarity: 'Rare',
    condition: (_s, c) => c.netWorth >= 1000000,
    conclusion: (s, c) =>
      `Le cap symbolique est franchi : ${eur(c.netWorth)} de patrimoine net. ${s.name} a su faire fructifier ses atouts et finit sa vie à l’abri du besoin.`,
  },
  {
    id: 'liberte',
    title: 'Libre avant l’heure',
    emoji: '🕊️',
    priority: 88,
    rarity: 'Rare',
    condition: (s, c) => c.netWorth >= 350000 && c.passiveIncome >= c.annualExpenses && s.age <= 60,
    conclusion: (s, c) =>
      `À ${s.age} ans, les revenus de son patrimoine (environ ${eur(c.passiveIncome)} par an) couvrent toutes ses dépenses. ${s.name} a gagné ce que l’argent offre de plus précieux : du temps libre.`,
  },
  {
    id: 'dettes',
    title: '{Prisonnier|Prisonnière} des dettes',
    emoji: '⛓️',
    priority: 85,
    rarity: 'Commune',
    condition: (s, c) => c.consumerDebt >= 8000 || s.counters.yearsInDebt >= 12,
    conclusion: (s, c) =>
      `Crédits, découverts, mensualités : ${s.name} a passé ${s.counters.yearsInDebt} années avec des dettes de consommation sur le dos${c.consumerDebt > 0 ? `, et en garde encore ${eur(c.consumerDebt)}` : ''}. Une vie où chaque fin de mois ressemblait à une course.`,
  },
  {
    id: 'artiste',
    title: 'Une vie d’artiste',
    emoji: '🎨',
    priority: 82,
    rarity: 'Peu commune',
    condition: (s, c) => !!s.flags.artisteReconnu || (c.creativeCareer && s.skills.creative >= 75),
    conclusion: (s, c) =>
      `${s.name} a fait de sa créativité un métier. Pas toujours simple, rarement confortable, mais profondément sien. Patrimoine final : ${eur(c.netWorth)}, et une œuvre qui compte.`,
  },
  {
    id: 'reconversion',
    title: 'La reconversion réussie',
    emoji: '🔄',
    priority: 80,
    rarity: 'Peu commune',
    condition: (s) => (s.counters.reconversions > 0 || !!s.flags.diplomeTardif) && (s.job !== null || !!s.flags.pension || s.business !== null) && s.happiness >= 55,
    conclusion: (s, c) =>
      `Changer de voie après 30 ans, beaucoup en rêvent : ${s.name} l’a fait. Le pari d’un nouveau métier a apporté sens et satisfaction, avec ${eur(c.netWorth)} de patrimoine à la clé.`,
  },
  {
    id: 'carriere_sans_patrimoine',
    title: 'Belle carrière, poches percées',
    emoji: '👔',
    priority: 78,
    rarity: 'Commune',
    condition: (_s, c) => c.careerLevel >= 3 && c.bestSalary >= 3500 && c.netWorth < 80000,
    conclusion: (s, c) =>
      `De beaux postes, un bon salaire (jusqu’à ${eur(c.bestSalary)} brut par mois)… mais seulement ${eur(c.netWorth)} de patrimoine. ${s.name} a bien gagné sa vie, et l’a bien dépensée.`,
  },
  {
    id: 'famille',
    title: 'Le bonheur en famille',
    emoji: '👨‍👩‍👧',
    priority: 75,
    rarity: 'Commune',
    condition: (s, c) => !!s.relations.partner && c.children >= 1 && s.relations.family >= 60 && s.happiness >= 62,
    conclusion: (s, c) =>
      `Pour ${s.name}, la vraie richesse avait des prénoms. Une famille unie, ${c.children} enfant${c.children > 1 ? 's' : ''}, une vie partagée avec ${s.relations.partner?.name}. Patrimoine : ${eur(c.netWorth)}, mais surtout des souvenirs.`,
  },
  {
    id: 'ascension',
    title: '{Parti|Partie} de rien',
    emoji: '🧗',
    priority: 70,
    rarity: 'Peu commune',
    condition: (_s, c) => c.disadvantagedStart && c.netWorth >= 150000,
    conclusion: (s, c) =>
      `Personne n’aurait parié sur ${s.name} à 18 ans. Et pourtant : ${eur(c.netWorth)} de patrimoine, construit sans filet. Une ascension discrète, mais remarquable.`,
  },
  {
    id: 'confort',
    title: 'Une vie stable et confortable',
    emoji: '🛋️',
    priority: 60,
    rarity: 'Commune',
    condition: (s, c) => c.netWorth >= 100000 && s.happiness >= 50 && c.consumerDebt < 3000,
    conclusion: (s, c) =>
      `Pas de fortune spectaculaire, mais pas de drame non plus : ${s.name} a mené une vie équilibrée et sereine, avec ${eur(c.netWorth)} de patrimoine. Beaucoup appelleraient ça une réussite.`,
  },
  {
    id: 'simple',
    title: 'Simple et {heureux|heureuse}',
    emoji: '🌻',
    priority: 55,
    rarity: 'Commune',
    condition: (s, c) => s.happiness >= 66 && c.netWorth < 100000,
    conclusion: (s, c) =>
      `${s.name} n’a jamais été riche (${eur(c.netWorth)} de patrimoine), mais a su être heureux${s.gender === 'f' ? 'se' : ''}. Des proches, des moments simples, et la conviction que l’essentiel était ailleurs.`,
  },
  {
    id: 'atypique',
    title: 'Un parcours inclassable',
    emoji: '🧭',
    priority: 0,
    rarity: 'Commune',
    condition: () => true,
    conclusion: (s, c) =>
      `Ni conte de fées ni tragédie : la vie de ${s.name} a pris des chemins inattendus, avec ses hauts, ses bas et ${eur(c.netWorth)} de patrimoine à l’arrivée. Une histoire qui ne ressemble à aucune autre.`,
  },
];

export const ENDING_BY_ID: Record<string, EndingDef> = Object.fromEntries(ENDINGS.map((e) => [e.id, e]));
