// Catalogues statiques : métiers, formations, logements, biens immobiliers, secteurs d'entreprise.
// Montants indicatifs inspirés de la France contemporaine (simplifiés, fictifs).

import type { EducationLevel, Gender, SkillId } from './types';

export const SMIC_BRUT = 1800;

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  0: 'Sans diplôme',
  1: 'CAP / BEP',
  2: 'Baccalauréat',
  3: 'Bac +2',
  4: 'Bac +3',
  5: 'Bac +5',
};

export const SKILL_LABELS: Record<SkillId, string> = {
  tech: 'Informatique',
  social: 'Relationnel',
  manage: 'Gestion & leadership',
  craft: 'Savoir-faire manuel',
  care: 'Soin & écoute',
  creative: 'Créativité',
  finance: 'Culture financière',
};

export const SECTORS = {
  commerce: 'Commerce et vente',
  securite: 'Sécurité',
  restauration: 'Restauration',
  logistique: 'Logistique',
  artisanat: 'Artisanat',
  administration: 'Administration',
  informatique: 'Informatique',
  sante: 'Santé',
  technique: 'Métiers techniques',
  management: 'Management',
  creatif: 'Métiers créatifs',
  finance: 'Banque et finance',
} as const;
export type SectorId = keyof typeof SECTORS;

export interface JobDef {
  id: string;
  title: [string, string]; // [masculin, féminin]
  sector: SectorId;
  salary: number; // brut mensuel de départ
  level: number; // 1 = entrée, 5 = direction
  education?: EducationLevel;
  diploma?: string[]; // l'un de ces diplômes est requis
  skills?: Partial<Record<SkillId, number>>;
  experience?: number; // années dans le secteur
  flag?: string; // condition spéciale (ex. concours réussi)
  stress: number; // 0-100
  hours: number; // heures hebdomadaires
  physical: number; // pénibilité 0-100
  risk: number; // probabilité annuelle de licenciement
  gains: Partial<Record<SkillId, number>>; // progression annuelle des compétences
  next?: string;
  variable?: number; // part variable aléatoire (± % du salaire)
  partTimeCompatible?: boolean;
  passion?: number; // satisfaction intrinsèque 0-20
}

export const JOBS: JobDef[] = [
  // Commerce
  { id: 'vendeur', title: ['Vendeur en magasin', 'Vendeuse en magasin'], sector: 'commerce', salary: 1800, level: 1, stress: 35, hours: 35, physical: 35, risk: 0.05, gains: { social: 3 }, next: 'conseiller_commercial', passion: 5 },
  { id: 'conseiller_commercial', title: ['Conseiller commercial', 'Conseillère commerciale'], sector: 'commerce', salary: 2300, level: 2, skills: { social: 35 }, experience: 2, stress: 50, hours: 39, physical: 15, risk: 0.05, gains: { social: 4, finance: 1 }, next: 'responsable_magasin', variable: 0.2, passion: 7 },
  { id: 'responsable_magasin', title: ['Responsable de magasin', 'Responsable de magasin'], sector: 'commerce', salary: 3000, level: 3, skills: { social: 45, manage: 35 }, experience: 4, stress: 60, hours: 42, physical: 20, risk: 0.04, gains: { manage: 4, social: 2 }, next: 'directeur_regional', passion: 8 },
  { id: 'directeur_regional', title: ['Directeur régional des ventes', 'Directrice régionale des ventes'], sector: 'commerce', salary: 5200, level: 4, skills: { manage: 65, social: 60 }, experience: 10, stress: 72, hours: 48, physical: 10, risk: 0.04, gains: { manage: 3, finance: 2 }, variable: 0.25, passion: 9 },
  // Sécurité
  { id: 'agent_securite', title: ['Agent de sécurité', 'Agente de sécurité'], sector: 'securite', salary: 1850, level: 1, diploma: ['cqp_aps'], stress: 40, hours: 40, physical: 40, risk: 0.05, gains: { social: 2 }, next: 'chef_equipe_securite', passion: 4 },
  { id: 'chef_equipe_securite', title: ["Chef d'équipe sécurité", "Cheffe d'équipe sécurité"], sector: 'securite', salary: 2400, level: 2, diploma: ['cqp_aps'], skills: { manage: 25 }, experience: 3, stress: 50, hours: 42, physical: 30, risk: 0.04, gains: { manage: 3 }, next: 'responsable_surete', passion: 6 },
  { id: 'responsable_surete', title: ['Responsable sûreté', 'Responsable sûreté'], sector: 'securite', salary: 3600, level: 3, skills: { manage: 45 }, experience: 8, stress: 55, hours: 42, physical: 15, risk: 0.03, gains: { manage: 3 }, passion: 8 },
  // Restauration
  { id: 'equipier', title: ['Équipier en restauration', 'Équipière en restauration'], sector: 'restauration', salary: 1800, level: 1, stress: 45, hours: 35, physical: 55, risk: 0.07, gains: { social: 2, craft: 1 }, next: 'cuisinier', partTimeCompatible: true, passion: 3 },
  { id: 'cuisinier', title: ['Cuisinier', 'Cuisinière'], sector: 'restauration', salary: 2050, level: 2, diploma: ['cap_cuisine'], skills: { craft: 25 }, stress: 55, hours: 42, physical: 60, risk: 0.06, gains: { craft: 4, creative: 1 }, next: 'chef_cuisine', passion: 10 },
  { id: 'chef_cuisine', title: ['Chef de cuisine', 'Cheffe de cuisine'], sector: 'restauration', salary: 3100, level: 3, skills: { craft: 55, manage: 30 }, experience: 5, stress: 70, hours: 50, physical: 55, risk: 0.05, gains: { craft: 3, manage: 3 }, passion: 13 },
  // Logistique
  { id: 'preparateur', title: ['Préparateur de commandes', 'Préparatrice de commandes'], sector: 'logistique', salary: 1850, level: 1, stress: 40, hours: 35, physical: 65, risk: 0.06, gains: { craft: 1 }, next: 'cariste', partTimeCompatible: true, passion: 2 },
  { id: 'cariste', title: ['Cariste', 'Cariste'], sector: 'logistique', salary: 2050, level: 2, diploma: ['caces'], stress: 40, hours: 37, physical: 50, risk: 0.05, gains: { craft: 2 }, next: 'chef_quai', passion: 4 },
  { id: 'chauffeur_pl', title: ['Chauffeur poids lourd', 'Conductrice poids lourd'], sector: 'logistique', salary: 2350, level: 2, diploma: ['permis_c'], stress: 45, hours: 45, physical: 45, risk: 0.04, gains: { craft: 1 }, passion: 6 },
  { id: 'chef_quai', title: ['Chef de quai', 'Cheffe de quai'], sector: 'logistique', salary: 2650, level: 3, skills: { manage: 25 }, experience: 3, stress: 55, hours: 40, physical: 35, risk: 0.04, gains: { manage: 4 }, next: 'responsable_logistique', passion: 6 },
  { id: 'responsable_logistique', title: ['Responsable logistique', 'Responsable logistique'], sector: 'logistique', salary: 3900, level: 4, education: 3, skills: { manage: 50 }, experience: 7, stress: 60, hours: 43, physical: 15, risk: 0.03, gains: { manage: 3, finance: 1 }, passion: 8 },
  // Artisanat
  { id: 'electricien', title: ['Électricien', 'Électricienne'], sector: 'artisanat', salary: 2100, level: 2, diploma: ['cap_elec', 'bts_tech'], stress: 35, hours: 39, physical: 55, risk: 0.03, gains: { craft: 4, tech: 1 }, next: 'chef_chantier', passion: 10 },
  { id: 'chef_chantier', title: ['Chef de chantier', 'Cheffe de chantier'], sector: 'artisanat', salary: 3000, level: 3, skills: { craft: 50, manage: 30 }, experience: 5, stress: 55, hours: 44, physical: 40, risk: 0.03, gains: { manage: 3, craft: 2 }, passion: 11 },
  { id: 'boulanger', title: ['Boulanger', 'Boulangère'], sector: 'artisanat', salary: 1950, level: 2, diploma: ['cap_boulangerie'], stress: 40, hours: 42, physical: 60, risk: 0.03, gains: { craft: 4 }, passion: 12 },
  // Administration
  { id: 'assistant_admin', title: ['Assistant administratif', 'Assistante administrative'], sector: 'administration', salary: 1950, level: 1, education: 2, stress: 30, hours: 35, physical: 5, risk: 0.04, gains: { manage: 2, tech: 1 }, next: 'gestionnaire_paie', passion: 4 },
  { id: 'gestionnaire_paie', title: ['Gestionnaire de paie', 'Gestionnaire de paie'], sector: 'administration', salary: 2500, level: 2, education: 3, skills: { finance: 25 }, stress: 40, hours: 37, physical: 5, risk: 0.03, gains: { finance: 3, manage: 1 }, next: 'responsable_admin', passion: 5 },
  { id: 'responsable_admin', title: ['Responsable administratif et financier', 'Responsable administrative et financière'], sector: 'administration', salary: 3700, level: 3, education: 3, skills: { manage: 40, finance: 45 }, experience: 6, stress: 55, hours: 42, physical: 5, risk: 0.03, gains: { finance: 3, manage: 3 }, passion: 7 },
  { id: 'fonctionnaire', title: ['Agent de la fonction publique', 'Agente de la fonction publique'], sector: 'administration', salary: 2000, level: 2, flag: 'concours', stress: 25, hours: 35, physical: 5, risk: 0, gains: { manage: 1, social: 1 }, next: 'attache', passion: 7 },
  { id: 'attache', title: ["Attaché d'administration", "Attachée d'administration"], sector: 'administration', salary: 2900, level: 3, flag: 'concours', education: 4, experience: 5, stress: 35, hours: 38, physical: 5, risk: 0, gains: { manage: 3 }, passion: 9 },
  // Informatique
  { id: 'technicien_support', title: ['Technicien support informatique', 'Technicienne support informatique'], sector: 'informatique', salary: 2000, level: 1, skills: { tech: 25 }, stress: 35, hours: 35, physical: 5, risk: 0.04, gains: { tech: 4, social: 1 }, next: 'dev_junior', passion: 6 },
  { id: 'dev_junior', title: ['Développeur junior', 'Développeuse junior'], sector: 'informatique', salary: 2750, level: 2, skills: { tech: 45 }, diploma: ['bootcamp_dev', 'bts_info', 'licence_info', 'master_info'], stress: 40, hours: 39, physical: 5, risk: 0.05, gains: { tech: 5 }, next: 'dev_confirme', passion: 10 },
  { id: 'dev_confirme', title: ['Développeur confirmé', 'Développeuse confirmée'], sector: 'informatique', salary: 3800, level: 3, skills: { tech: 60 }, experience: 3, stress: 45, hours: 40, physical: 5, risk: 0.05, gains: { tech: 4, manage: 1 }, next: 'lead_dev', passion: 12 },
  { id: 'lead_dev', title: ['Responsable technique', 'Responsable technique'], sector: 'informatique', salary: 5100, level: 4, skills: { tech: 72, manage: 35 }, experience: 6, stress: 58, hours: 44, physical: 5, risk: 0.04, gains: { manage: 3, tech: 2 }, next: 'cto', passion: 13 },
  { id: 'cto', title: ['Directeur technique (CTO)', 'Directrice technique (CTO)'], sector: 'informatique', salary: 7600, level: 5, skills: { tech: 80, manage: 60 }, experience: 10, stress: 75, hours: 50, physical: 5, risk: 0.06, gains: { manage: 3, finance: 2 }, variable: 0.2, passion: 14 },
  // Santé
  { id: 'aide_soignant', title: ['Aide-soignant', 'Aide-soignante'], sector: 'sante', salary: 1950, level: 1, diploma: ['deas', 'ide'], stress: 55, hours: 37, physical: 60, risk: 0.01, gains: { care: 4, social: 1 }, passion: 12 },
  { id: 'infirmier', title: ['Infirmier', 'Infirmière'], sector: 'sante', salary: 2450, level: 2, diploma: ['ide'], stress: 62, hours: 38, physical: 45, risk: 0.01, gains: { care: 4, manage: 1 }, next: 'cadre_sante', passion: 14 },
  { id: 'cadre_sante', title: ['Cadre de santé', 'Cadre de santé'], sector: 'sante', salary: 3500, level: 3, diploma: ['ide'], skills: { manage: 45 }, experience: 8, stress: 62, hours: 42, physical: 20, risk: 0.01, gains: { manage: 3, care: 1 }, passion: 12 },
  // Technique
  { id: 'technicien_maintenance', title: ['Technicien de maintenance', 'Technicienne de maintenance'], sector: 'technique', salary: 2250, level: 2, diploma: ['bts_tech', 'cap_elec', 'bac_pro'], skills: { craft: 30, tech: 20 }, stress: 40, hours: 37, physical: 40, risk: 0.04, gains: { craft: 3, tech: 2 }, next: 'ingenieur', passion: 8 },
  { id: 'ingenieur', title: ['Ingénieur', 'Ingénieure'], sector: 'technique', salary: 3700, level: 3, diploma: ['diplome_ingenieur', 'master_info'], skills: { tech: 50 }, stress: 50, hours: 41, physical: 10, risk: 0.04, gains: { tech: 3, manage: 2 }, next: 'ingenieur_senior', passion: 11 },
  { id: 'ingenieur_senior', title: ['Ingénieur principal', 'Ingénieure principale'], sector: 'technique', salary: 4900, level: 4, skills: { tech: 65, manage: 40 }, experience: 6, stress: 55, hours: 43, physical: 5, risk: 0.04, gains: { manage: 3, tech: 1 }, passion: 12 },
  // Management
  { id: 'chef_projet', title: ['Chef de projet', 'Cheffe de projet'], sector: 'management', salary: 3400, level: 3, education: 4, skills: { manage: 40, social: 35 }, stress: 55, hours: 42, physical: 5, risk: 0.05, gains: { manage: 4, social: 2 }, next: 'directeur_operations', passion: 9 },
  { id: 'directeur_operations', title: ['Directeur des opérations', 'Directrice des opérations'], sector: 'management', salary: 6500, level: 5, skills: { manage: 70, finance: 40 }, experience: 10, stress: 78, hours: 52, physical: 5, risk: 0.06, gains: { manage: 2, finance: 3 }, variable: 0.25, passion: 11 },
  // Créatif
  { id: 'graphiste', title: ['Graphiste', 'Graphiste'], sector: 'creatif', salary: 2050, level: 2, skills: { creative: 40, tech: 20 }, stress: 40, hours: 38, physical: 5, risk: 0.07, gains: { creative: 4, tech: 1 }, next: 'directeur_artistique', passion: 14 },
  { id: 'directeur_artistique', title: ['Directeur artistique', 'Directrice artistique'], sector: 'creatif', salary: 3800, level: 4, skills: { creative: 70, manage: 30 }, experience: 6, stress: 55, hours: 44, physical: 5, risk: 0.05, gains: { creative: 3, manage: 2 }, passion: 16 },
  { id: 'artiste', title: ['Artiste indépendant', 'Artiste indépendante'], sector: 'creatif', salary: 1350, level: 2, skills: { creative: 50 }, stress: 45, hours: 40, physical: 15, risk: 0, gains: { creative: 5, social: 1 }, variable: 0.6, passion: 20 },
  // Finance
  { id: 'conseiller_bancaire', title: ['Conseiller bancaire', 'Conseillère bancaire'], sector: 'finance', salary: 2350, level: 2, education: 3, skills: { social: 30 }, stress: 50, hours: 38, physical: 5, risk: 0.03, gains: { finance: 4, social: 2 }, next: 'analyste_financier', variable: 0.1, passion: 5 },
  { id: 'analyste_financier', title: ['Analyste financier', 'Analyste financière'], sector: 'finance', salary: 4200, level: 3, education: 5, skills: { finance: 60 }, stress: 65, hours: 46, physical: 5, risk: 0.05, gains: { finance: 4, tech: 1 }, next: 'gestionnaire_patrimoine', variable: 0.25, passion: 8 },
  { id: 'gestionnaire_patrimoine', title: ['Gestionnaire de patrimoine', 'Gestionnaire de patrimoine'], sector: 'finance', salary: 5800, level: 4, skills: { finance: 70, social: 55 }, experience: 8, stress: 62, hours: 45, physical: 5, risk: 0.04, gains: { finance: 3, social: 2 }, variable: 0.3, passion: 9 },
];

export const JOB_BY_ID: Record<string, JobDef> = Object.fromEntries(JOBS.map((j) => [j.id, j]));

export function jobTitle(jobId: string | null | undefined, gender: Gender): string {
  if (!jobId) return 'Sans emploi';
  const j = JOB_BY_ID[jobId];
  if (!j) return 'Métier inconnu';
  return gender === 'f' ? j.title[1] : j.title[0];
}

export interface TrainingDef {
  id: string;
  name: string;
  years: number;
  cost: number; // frais totaux
  modes: ('full' | 'part' | 'alternance')[];
  education?: EducationLevel; // niveau requis
  requiresDiploma?: string[];
  grantsEducation?: EducationLevel;
  diploma: string;
  gains: Partial<Record<SkillId, number>>; // par année
  description: string;
}

export const TRAININGS: TrainingDef[] = [
  { id: 'cqp_aps', name: "CQP Agent de prévention et de sécurité", years: 1, cost: 1800, modes: ['part', 'full'], diploma: 'cqp_aps', gains: { social: 3 }, description: "Formation courte qui ouvre les métiers de la sécurité privée." },
  { id: 'caces', name: 'CACES (conduite de chariots)', years: 1, cost: 900, modes: ['part'], diploma: 'caces', gains: { craft: 3 }, description: 'Certification indispensable pour devenir cariste.' },
  { id: 'permis_c', name: 'Permis poids lourd', years: 1, cost: 3200, modes: ['part', 'full'], diploma: 'permis_c', gains: { craft: 2 }, description: 'Ouvre le métier de chauffeur poids lourd, très recherché.' },
  { id: 'cap_cuisine', name: 'CAP Cuisine', years: 1, cost: 600, modes: ['full', 'alternance'], grantsEducation: 1, diploma: 'cap_cuisine', gains: { craft: 8, creative: 2 }, description: 'Le socle pour travailler en cuisine.' },
  { id: 'cap_elec', name: 'CAP Électricien', years: 2, cost: 600, modes: ['full', 'alternance'], grantsEducation: 1, diploma: 'cap_elec', gains: { craft: 7, tech: 2 }, description: 'Un métier manuel recherché, avec une vraie porte vers l’indépendance.' },
  { id: 'cap_boulangerie', name: 'CAP Boulanger', years: 1, cost: 600, modes: ['full', 'alternance'], grantsEducation: 1, diploma: 'cap_boulangerie', gains: { craft: 8 }, description: 'Lever tôt, mais un savoir-faire qui permet un jour d’ouvrir sa boutique.' },
  { id: 'deas', name: "Diplôme d'aide-soignant", years: 1, cost: 0, modes: ['full', 'alternance'], diploma: 'deas', gains: { care: 8, social: 2 }, description: 'Formation financée, accès direct aux métiers du soin.' },
  { id: 'ide', name: 'Diplôme d’infirmier (IFSI)', years: 3, cost: 600, modes: ['full'], education: 2, grantsEducation: 4, diploma: 'ide', gains: { care: 7, social: 2 }, description: 'Trois années exigeantes pour un emploi quasi garanti.' },
  { id: 'bts_tech', name: 'BTS Maintenance des systèmes', years: 2, cost: 400, modes: ['full', 'alternance'], education: 2, grantsEducation: 3, diploma: 'bts_tech', gains: { craft: 5, tech: 4 }, description: 'Un bac+2 technique très apprécié des industriels.' },
  { id: 'bts_info', name: 'BTS Services informatiques', years: 2, cost: 400, modes: ['full', 'alternance'], education: 2, grantsEducation: 3, diploma: 'bts_info', gains: { tech: 9 }, description: 'Le chemin classique vers le développement et le support.' },
  { id: 'bts_gestion', name: 'BTS Gestion de la PME', years: 2, cost: 400, modes: ['full', 'alternance'], education: 2, grantsEducation: 3, diploma: 'bts_gestion', gains: { manage: 5, finance: 4 }, description: 'Polyvalent : administration, gestion, comptabilité.' },
  { id: 'licence_eco', name: 'Licence Économie-gestion', years: 3, cost: 500, modes: ['full'], education: 2, grantsEducation: 4, diploma: 'licence_eco', gains: { finance: 5, manage: 3 }, description: "À l'université, avec bourse possible selon la situation." },
  { id: 'licence_info', name: 'Licence Informatique', years: 3, cost: 500, modes: ['full'], education: 2, grantsEducation: 4, diploma: 'licence_info', gains: { tech: 8 }, description: "À l'université, solide et peu coûteuse." },
  { id: 'master_info', name: 'Master Informatique', years: 2, cost: 600, modes: ['full', 'alternance'], education: 4, grantsEducation: 5, diploma: 'master_info', gains: { tech: 8, manage: 2 }, description: 'Ouvre les postes d’ingénieur et de développeur confirmé.' },
  { id: 'master_finance', name: 'Master Finance', years: 2, cost: 4000, modes: ['full', 'alternance'], education: 4, grantsEducation: 5, diploma: 'master_finance', gains: { finance: 10 }, description: 'La porte d’entrée vers l’analyse financière.' },
  { id: 'ecole_ingenieur', name: "École d'ingénieurs", years: 3, cost: 9000, modes: ['full', 'alternance'], education: 3, grantsEducation: 5, diploma: 'diplome_ingenieur', gains: { tech: 7, manage: 3 }, description: 'Admission après un bac+2. Coûteuse, mais très valorisée.' },
  { id: 'bootcamp_dev', name: 'Formation intensive développeur web', years: 1, cost: 6500, modes: ['full', 'part'], diploma: 'bootcamp_dev', gains: { tech: 18 }, description: 'Un an pour se reconvertir dans le code. Intense.' },
  { id: 'formation_management', name: 'Certificat en management', years: 1, cost: 3500, modes: ['part'], education: 2, diploma: 'cert_management', gains: { manage: 12, social: 3 }, description: 'Cours du soir pour encadrer une équipe.' },
  { id: 'formation_design', name: 'Formation graphisme et design', years: 1, cost: 4000, modes: ['full', 'part'], diploma: 'cert_design', gains: { creative: 14, tech: 3 }, description: 'Maîtriser les outils et construire un portfolio.' },
  { id: 'formation_finance_perso', name: 'Cours de finances personnelles', years: 1, cost: 300, modes: ['part'], diploma: 'cert_finance_perso', gains: { finance: 12 }, description: 'Budget, épargne, investissement : les bases solides.' },
];

export const TRAINING_BY_ID: Record<string, TrainingDef> = Object.fromEntries(TRAININGS.map((t) => [t.id, t]));

export const DIPLOMA_LABELS: Record<string, string> = Object.fromEntries([
  ...TRAININGS.map((t) => [t.diploma, t.name]),
  ['bac', 'Baccalauréat'],
  ['bac_pro', 'Bac professionnel'],
  ['permis_b', 'Permis B'],
]);

export interface HousingDef {
  id: string;
  name: string;
  rent: number; // loyer mensuel
  utilities: number; // charges, énergie, assurance, téléphone
  transport: number; // coût de transport mensuel
  comfort: number; // bonus bien-être annuel
  bigCity: boolean;
  description: string;
  owned?: boolean;
}

export const HOUSINGS: HousingDef[] = [
  { id: 'parents', name: 'Chez mes parents', rent: 0, utilities: 60, transport: 60, comfort: -1, bigCity: false, description: 'Aucun loyer, mais une indépendance limitée.' },
  { id: 'coloc', name: 'Colocation', rent: 480, utilities: 110, transport: 75, comfort: 1, bigCity: true, description: 'Pas cher et convivial, si les colocataires sont sympathiques.' },
  { id: 'studio', name: 'Studio en ville moyenne', rent: 520, utilities: 140, transport: 90, comfort: 1, bigCity: false, description: 'Petit, mais à soi.' },
  { id: 'studio_metropole', name: 'Studio en grande ville', rent: 780, utilities: 140, transport: 75, comfort: 1, bigCity: true, description: 'Cher, mais au cœur des opportunités.' },
  { id: 't2', name: 'Deux-pièces en grande ville', rent: 1050, utilities: 170, transport: 75, comfort: 3, bigCity: true, description: 'Le confort urbain, à un prix certain.' },
  { id: 't3', name: 'Trois-pièces familial', rent: 1300, utilities: 210, transport: 90, comfort: 4, bigCity: true, description: 'De la place pour une famille.' },
  { id: 'maison_location', name: 'Maison en périphérie', rent: 1050, utilities: 230, transport: 280, comfort: 5, bigCity: false, description: 'Un jardin, mais la voiture devient indispensable.' },
  { id: 'proprietaire', name: 'Ma résidence principale', rent: 0, utilities: 220, transport: 140, comfort: 6, bigCity: false, description: 'Chez moi, enfin.', owned: true },
];

export const HOUSING_BY_ID: Record<string, HousingDef> = Object.fromEntries(HOUSINGS.map((h) => [h.id, h]));

export interface PropertyTypeDef {
  id: string;
  label: string;
  price: number;
  rent: number; // loyer de marché mensuel
  description: string;
}

export const PROPERTY_TYPES: PropertyTypeDef[] = [
  { id: 'studio_inv', label: 'Studio en ville moyenne', price: 95000, rent: 480, description: 'Petit ticket d’entrée, rendement correct.' },
  { id: 'appartement', label: 'Appartement deux-pièces', price: 185000, rent: 780, description: 'Bien polyvalent, à habiter ou à louer.' },
  { id: 'maison', label: 'Maison avec jardin', price: 270000, rent: 1050, description: 'Idéale pour une famille.' },
  { id: 'appartement_metropole', label: 'Trois-pièces en métropole', price: 390000, rent: 1450, description: 'Cher, mais recherché.' },
  { id: 'immeuble', label: 'Petit immeuble de rapport (4 lots)', price: 520000, rent: 2600, description: 'Pour investisseur aguerri.' },
];

export const PROPERTY_TYPE_BY_ID: Record<string, PropertyTypeDef> = Object.fromEntries(PROPERTY_TYPES.map((p) => [p.id, p]));

export interface BusinessSectorDef {
  id: string;
  name: string;
  minCapital: number;
  baseRevenue: number; // chiffre d'affaires mensuel de référence (échelle 1)
  baseCosts: number; // charges mensuelles de référence (échelle 1)
  extraRevenue: number; // chiffre d'affaires ajouté par niveau de développement
  extraCosts: number; // charges ajoutées par niveau (salariés, locaux)
  volatility: number; // écart type annuel de la demande
  skills: SkillId[];
  requires?: { skill?: SkillId; min?: number; diploma?: string[] };
  multiple: number; // multiple de valorisation des bénéfices
  growth: number; // potentiel de croissance du chiffre d'affaires
  description: string;
}

export const BUSINESS_SECTORS: BusinessSectorDef[] = [
  { id: 'ecommerce', name: 'Boutique en ligne', minCapital: 4000, baseRevenue: 5600, baseCosts: 3000, extraRevenue: 5000, extraCosts: 4200, volatility: 0.25, skills: ['tech', 'social', 'creative'], multiple: 3, growth: 0.12, description: 'Peu de capital, beaucoup de concurrence.' },
  { id: 'conseil', name: 'Activité de conseil indépendant', minCapital: 1500, baseRevenue: 6500, baseCosts: 1500, extraRevenue: 7000, extraCosts: 6000, volatility: 0.18, skills: ['tech', 'finance', 'manage'], requires: { min: 50 }, multiple: 1.5, growth: 0.05, description: 'Vendre son expertise. Nécessite une compétence forte (50+).' },
  { id: 'artisan', name: 'Entreprise artisanale', minCapital: 8000, baseRevenue: 8500, baseCosts: 5200, extraRevenue: 7500, extraCosts: 6300, volatility: 0.15, skills: ['craft', 'social', 'manage'], requires: { skill: 'craft', min: 40 }, multiple: 2.5, growth: 0.07, description: 'Les clients ne manquent pas pour les bons artisans.' },
  { id: 'restaurant', name: 'Restaurant', minCapital: 35000, baseRevenue: 23500, baseCosts: 18500, extraRevenue: 20000, extraCosts: 17500, volatility: 0.25, skills: ['craft', 'manage', 'social'], multiple: 2.5, growth: 0.06, description: 'Un rêve exigeant : marges faibles, risques élevés.' },
  { id: 'food_truck', name: 'Food truck', minCapital: 22000, baseRevenue: 10000, baseCosts: 7200, extraRevenue: 9000, extraCosts: 7600, volatility: 0.22, skills: ['craft', 'social', 'creative'], multiple: 2, growth: 0.06, description: 'Moins cher qu’un restaurant, plus de liberté.' },
  { id: 'agence', name: 'Agence créative', minCapital: 3000, baseRevenue: 7000, baseCosts: 4800, extraRevenue: 7000, extraCosts: 5800, volatility: 0.22, skills: ['creative', 'social', 'manage'], requires: { skill: 'creative', min: 45 }, multiple: 3, growth: 0.1, description: 'Design, vidéo, communication pour les entreprises.' },
  { id: 'startup', name: 'Start-up technologique', minCapital: 12000, baseRevenue: 3000, baseCosts: 5000, extraRevenue: 6000, extraCosts: 5500, volatility: 0.45, skills: ['tech', 'manage', 'finance'], requires: { skill: 'tech', min: 55 }, multiple: 8, growth: 0.3, description: 'Tout ou rien : pertes au début, potentiel énorme.' },
];

export const SECTOR_BY_ID: Record<string, BusinessSectorDef> = Object.fromEntries(BUSINESS_SECTORS.map((b) => [b.id, b]));

export const LIFESTYLES = {
  frugal: { label: 'Frugal', food: 230, leisure: 40, misc: 90, share: 0.03, happiness: -3, description: 'Chaque euro compte. Moins de sorties, plus d’épargne.' },
  normal: { label: 'Équilibré', food: 300, leisure: 140, misc: 170, share: 0.1, happiness: 0, description: 'Un train de vie raisonnable.' },
  confort: { label: 'Confortable', food: 420, leisure: 380, misc: 280, share: 0.18, happiness: 3, description: 'Restaurants, sorties, petits plaisirs réguliers.' },
  luxe: { label: 'Grand train', food: 650, leisure: 1300, misc: 500, share: 0.3, happiness: 5, description: 'Voyages, marques, dépenses sans compter.' },
} as const;

export const PRIORITIES = {
  carriere: { label: 'Carrière', description: 'Performance et réseau en hausse, mais énergie et proches en baisse.' },
  equilibre: { label: 'Équilibre', description: 'Un peu de tout, sans excès.' },
  proches: { label: 'Mes proches', description: 'Famille, amis et couple avant tout.' },
  sante: { label: 'Santé', description: 'Sport, sommeil, récupération.' },
  formation: { label: 'Apprendre', description: 'Les compétences progressent plus vite, réussite des études facilitée.' },
} as const;

export const CHILD_MONTHLY_COST = 420;
// Tous les montants sont exprimés en euros constants (hors inflation) : les rendements sont des rendements réels.
export const MORTGAGE_RATE = 0.034;
export const SAVINGS_RATE = 0.01;
export const STOCK_RETURN = { mean: 0.04, sd: 0.16 };
export const CRYPTO_RETURN = { mean: 0.05, sd: 0.7 };
export const PROPERTY_RETURN = { mean: 0.008, sd: 0.035 };
