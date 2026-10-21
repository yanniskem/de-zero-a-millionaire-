// Profils de départ. Chacun a des avantages et des handicaps : aucun ne gagne d'office.

import type { EducationLevel, FlagValue, Lifestyle, Skills } from '../engine/types';

export interface ProfileDef {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  cash: number;
  savings?: number;
  education: EducationLevel;
  diplomas: string[];
  skills: Partial<Skills>;
  health: number;
  energy: number;
  happiness: number;
  family: number;
  friends: number;
  network: number;
  housingId: string;
  lifestyle: Lifestyle;
  jobId?: string;
  jobYears?: number;
  training?: { trainingId: string; mode: 'full' | 'part' | 'alternance' };
  familyContribution?: number;
  flags?: Record<string, FlagValue>;
  debts?: { kind: 'etudiant' | 'conso' | 'famille'; label: string; amount: number; rate: number; years: number }[];
  perks: string[];
  challenges: string[];
}

export const PROFILES: ProfileDef[] = [
  {
    id: 'cocon',
    name: 'Le cocon familial',
    emoji: '🏡',
    tagline: 'Chez tes parents, peu d’économies, beaucoup de temps.',
    description: 'Tu viens d’avoir ton bac et tu vis toujours dans ta chambre d’ado. Tes parents t’aiment, mais ils aimeraient bien te voir avancer.',
    cash: 400,
    education: 2,
    diplomas: ['bac'],
    skills: { social: 20 },
    health: 80, energy: 75, happiness: 62, family: 72, friends: 55, network: 10,
    housingId: 'parents', lifestyle: 'normal',
    perks: ['Pas de loyer', 'Famille soutenante'],
    challenges: ['Peu d’argent', 'Aucune expérience'],
  },
  {
    id: 'etudiant',
    name: 'L’{étudiant fauché|étudiante fauchée}',
    emoji: '🎓',
    tagline: 'Première année de licence, petit budget, grandes ambitions.',
    description: 'Tu viens d’emménager dans un studio pour ta licence. Ta bourse couvre l’essentiel, à condition de ne pas faire d’écart.',
    cash: 650,
    education: 2,
    diplomas: ['bac'],
    skills: { finance: 15, tech: 18 },
    health: 78, energy: 70, happiness: 60, family: 55, friends: 50, network: 15,
    housingId: 'studio', lifestyle: 'frugal',
    training: { trainingId: 'licence_eco', mode: 'full' },
    flags: { boursier: true },
    perks: ['Licence déjà commencée', 'Bourse d’études'],
    challenges: ['Budget très serré', 'Loyer à payer'],
  },
  {
    id: 'bac_pro',
    name: '{Le diplômé|La diplômée} du bac pro',
    emoji: '🧰',
    tagline: 'Bac pro en poche, à la recherche d’un premier emploi.',
    description: 'Ton bac pro maintenance en poche, tu as fait tes stages et tu connais déjà le monde du travail. Reste à décrocher un vrai poste.',
    cash: 1300,
    education: 2,
    diplomas: ['bac_pro'],
    skills: { craft: 30, tech: 18 },
    health: 80, energy: 75, happiness: 58, family: 60, friends: 50, network: 18,
    housingId: 'parents', lifestyle: 'normal',
    perks: ['Savoir-faire technique', 'Expérience de stage'],
    challenges: ['Pas encore d’emploi'],
  },
  {
    id: 'sans_diplome',
    name: 'Sans diplôme, plein d’énergie',
    emoji: '⚡',
    tagline: 'L’école, ce n’était pas pour toi. Le reste, tout est à écrire.',
    description: 'Tu as quitté le lycée sans diplôme. Tu as de l’énergie à revendre et tu sais te débrouiller, mais beaucoup de portes restent fermées pour l’instant.',
    cash: 180,
    education: 0,
    diplomas: [],
    skills: { social: 22, craft: 15 },
    health: 85, energy: 85, happiness: 55, family: 45, friends: 62, network: 8,
    housingId: 'parents', lifestyle: 'normal',
    perks: ['Énergie élevée', 'Bon entourage amical'],
    challenges: ['Aucun diplôme', 'Presque pas d’argent'],
  },
  {
    id: 'heritier',
    name: 'L’{héritier|héritière}',
    emoji: '💼',
    tagline: '60 000 € d’héritage, et aucune idée de quoi en faire.',
    description: 'Ta grand-mère t’a laissé une jolie somme. Tout le monde a un conseil à te donner. Toi, tu n’as jamais géré plus que ton argent de poche.',
    cash: 4000,
    savings: 56000,
    education: 2,
    diplomas: ['bac'],
    skills: { finance: 5, social: 18 },
    health: 78, energy: 68, happiness: 64, family: 48, friends: 52, network: 25,
    housingId: 'parents', lifestyle: 'confort',
    flags: { heritier: true },
    perks: ['Capital important', 'Réseau familial'],
    challenges: ['Aucune culture financière', 'Goût pour le confort'],
  },
  {
    id: 'pilier',
    name: 'Le pilier de la famille',
    emoji: '🤝',
    tagline: 'Tu dois aider ta mère à payer les factures.',
    description: 'Depuis que ton père est parti, tu participes aux dépenses de la maison. 250 € par mois, ce n’est pas rien quand on commence dans la vie.',
    cash: 300,
    education: 2,
    diplomas: ['bac_pro'],
    skills: { care: 30, social: 22, manage: 15 },
    health: 76, energy: 66, happiness: 50, family: 82, friends: 45, network: 10,
    housingId: 'parents', lifestyle: 'frugal',
    jobId: 'equipier', jobYears: 1,
    familyContribution: 250,
    perks: ['Déjà en emploi', 'Liens familiaux très forts', 'Sens des responsabilités'],
    challenges: ['250 € par mois versés à la famille'],
  },
  {
    id: 'reveur',
    name: '{Le rêveur passionné|La rêveuse passionnée}',
    emoji: '🎨',
    tagline: 'Une vocation artistique… et des parents qui veulent un vrai métier.',
    description: 'Tu dessines depuis toujours. Tes amis te disent que tu as du talent. Ta famille te répète qu’on ne vit pas de l’art.',
    cash: 700,
    education: 2,
    diplomas: ['bac'],
    skills: { creative: 42, tech: 15 },
    health: 76, energy: 70, happiness: 65, family: 50, friends: 58, network: 12,
    housingId: 'parents', lifestyle: 'normal',
    flags: { passionArt: true },
    perks: ['Talent créatif rare'],
    challenges: ['Vocation peu rémunératrice au début', 'Pression familiale'],
  },
  {
    id: 'debrouillard',
    name: '{Le débrouillard|La débrouillarde}',
    emoji: '🔧',
    tagline: 'Apprenti depuis 16 ans, déjà deux ans de métier.',
    description: 'Tu as signé ton CAP cuisine en apprentissage à 16 ans. Tu as déjà ta place en brigade, un petit pécule et des mains qui savent faire.',
    cash: 2600,
    education: 1,
    diplomas: ['cap_cuisine'],
    skills: { craft: 32, social: 18 },
    health: 74, energy: 70, happiness: 58, family: 55, friends: 50, network: 20,
    housingId: 'studio', lifestyle: 'normal',
    jobId: 'cuisinier', jobYears: 2,
    perks: ['Emploi et expérience', 'Petit pécule'],
    challenges: ['Métier physiquement exigeant', 'Pas de bac'],
  },
  {
    id: 'metropole',
    name: '{Le nouvel arrivant|La nouvelle arrivante} en métropole',
    emoji: '🌆',
    tagline: 'Tu viens de débarquer dans une grande ville.',
    description: 'Tu as quitté ta petite ville pour la métropole avec une valise et quelques économies. Le loyer est cher, mais les opportunités sont partout.',
    cash: 1800,
    education: 2,
    diplomas: ['bac'],
    skills: { social: 28 },
    health: 78, energy: 74, happiness: 60, family: 50, friends: 28, network: 22,
    housingId: 'studio_metropole', lifestyle: 'normal',
    flags: { metropole: true },
    perks: ['Plus d’opportunités', 'Bon relationnel'],
    challenges: ['Loyer élevé', 'Aucun ami sur place'],
  },
  {
    id: 'entrepreneur',
    name: 'L’{entrepreneur|entrepreneuse} en herbe',
    emoji: '🚀',
    tagline: '8 000 € économisés et une idée par jour.',
    description: 'Tu as revendu des baskets, réparé des téléphones, fait des marchés. Tu as mis 8 000 € de côté et tu rêves d’être ton propre patron.',
    cash: 1500,
    savings: 6500,
    education: 2,
    diplomas: ['bac'],
    skills: { social: 30, finance: 18, manage: 15 },
    health: 78, energy: 78, happiness: 62, family: 52, friends: 50, network: 20,
    housingId: 'parents', lifestyle: 'frugal',
    flags: { fibreEntrepreneur: true },
    perks: ['Petit capital', 'Sens du commerce'],
    challenges: ['Aucun diplôme supérieur', 'Tendance à prendre des risques'],
  },
  {
    id: 'codeur',
    name: '{Le|La} prodige du code',
    emoji: '💻',
    tagline: 'Autodidacte, tu codes depuis tes 13 ans.',
    description: 'Tu as appris seul à programmer. Tu sais créer des sites et des petites applications, mais tu n’as aucun diplôme pour le prouver.',
    cash: 600,
    education: 2,
    diplomas: ['bac'],
    skills: { tech: 42, creative: 15 },
    health: 72, energy: 68, happiness: 58, family: 55, friends: 38, network: 10,
    housingId: 'parents', lifestyle: 'normal',
    perks: ['Compétences techniques avancées'],
    challenges: ['Relationnel à développer', 'Pas de diplôme d’informatique'],
  },
  {
    id: 'rural',
    name: '{Le|La} jeune de la campagne',
    emoji: '🌾',
    tagline: 'Village de 800 habitants, permis en poche, voiture d’occasion.',
    description: 'Tu as grandi à la campagne. La vie y est peu chère et tout le monde se connaît, mais les emplois sont rares et la voiture indispensable.',
    cash: 1100,
    education: 2,
    diplomas: ['bac_pro', 'permis_b'],
    skills: { craft: 28, care: 15 },
    health: 82, energy: 76, happiness: 62, family: 70, friends: 60, network: 12,
    housingId: 'parents', lifestyle: 'frugal',
    flags: { voiture: true, rural: true },
    perks: ['Vie peu chère', 'Permis et voiture', 'Solidarité locale'],
    challenges: ['Peu d’emplois à proximité', 'Frais de voiture'],
  },
  {
    id: 'endette',
    name: 'Le départ avec un crédit',
    emoji: '🧾',
    tagline: 'Un crédit auto de 7 000 € avant même ton premier salaire.',
    description: 'Tu as cédé à la voiture de tes rêves avec un crédit à la consommation. Tu as un emploi de {vendeur|vendeuse}, mais chaque mois commence par une mensualité.',
    cash: 500,
    education: 2,
    diplomas: ['bac', 'permis_b'],
    skills: { social: 30 },
    health: 80, energy: 72, happiness: 60, family: 55, friends: 58, network: 15,
    housingId: 'parents', lifestyle: 'normal',
    jobId: 'vendeur', jobYears: 0,
    flags: { voiture: true },
    debts: [{ kind: 'conso', label: 'Crédit auto', amount: 7000, rate: 0.069, years: 4 }],
    perks: ['Emploi et voiture', 'Bon relationnel'],
    challenges: ['Crédit à rembourser'],
  },
];

export const PROFILE_BY_ID: Record<string, ProfileDef> = Object.fromEntries(PROFILES.map((p) => [p.id, p]));
