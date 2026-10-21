// Carrière et formation : conditions d'accès, embauche, départ, formation.

import { DIPLOMA_LABELS, EDUCATION_LABELS, JOB_BY_ID, SKILL_LABELS, TRAINING_BY_ID, jobTitle } from './catalog';
import type { GameState, SkillId } from './types';
import { clamp, round } from './economy';

/** Liste des conditions non remplies pour un métier (vide = accessible). */
export function jobRequirementsMissing(s: GameState, jobId: string): string[] {
  const job = JOB_BY_ID[jobId];
  if (!job) return ['Métier inconnu'];
  const missing: string[] = [];
  if (job.education !== undefined && s.education < job.education) {
    missing.push(`Niveau ${EDUCATION_LABELS[job.education]} requis`);
  }
  if (job.diploma && !job.diploma.some((d) => s.diplomas.includes(d))) {
    missing.push(`Diplôme requis : ${job.diploma.map((d) => DIPLOMA_LABELS[d] ?? d).join(' ou ')}`);
  }
  if (job.skills) {
    for (const [k, v] of Object.entries(job.skills) as [SkillId, number][]) {
      if (s.skills[k] < v) missing.push(`${SKILL_LABELS[k]} ${v}+ (actuellement ${round(s.skills[k])})`);
    }
  }
  if (job.experience && (s.sectorYears[job.sector] ?? 0) < job.experience) {
    missing.push(`${job.experience} an(s) d'expérience dans le secteur (actuellement ${s.sectorYears[job.sector] ?? 0})`);
  }
  if (job.flag && !s.flags[job.flag]) {
    missing.push(job.flag === 'concours' ? 'Réussir un concours de la fonction publique' : 'Condition spéciale non remplie');
  }
  if (s.training?.mode === 'full') missing.push('Impossible pendant une formation à temps plein');
  return missing;
}

/** Plafond de la grille salariale d'un poste (un travail à l'étranger le relève). */
export function salaryCap(s: GameState, jobId: string): number {
  const job = JOB_BY_ID[jobId];
  return round((job?.salary ?? 0) * 1.6 * (s.flags.suisse ? 1.75 : 1));
}

/** Probabilité qu'une candidature aboutisse (si les conditions sont remplies). */
export function applicationChance(s: GameState, jobId: string): number {
  const job = JOB_BY_ID[jobId];
  if (!job) return 0;
  let p = 0.5 + s.relations.network / 250 + s.skills.social / 400;
  if (job.level >= 3) p -= 0.1;
  if (job.level >= 4) p -= 0.12;
  if (job.level >= 5) p -= 0.15;
  if (s.job && JOB_BY_ID[s.job.jobId]?.sector === job.sector) p += 0.1;
  if (!s.job && s.flags.chomageLong) p -= 0.1;
  if (s.flags.casierPro) p -= 0.15;
  if (s.age >= 55) p -= 0.15;
  return clamp(p, 0.1, 0.85);
}

export function hire(s: GameState, jobId: string, salaryPct = 0): void {
  const job = JOB_BY_ID[jobId];
  if (!job) return;
  const prevJob = s.job ? JOB_BY_ID[s.job.jobId] : null;
  const base = job.salary * (1 + Math.min(0.4, ((s.sectorYears[job.sector] ?? 0) * 0.015)));
  // On ne perd pas brutalement de salaire en changeant de poste dans le même secteur.
  const keep = prevJob && prevJob.sector === job.sector && s.job ? s.job.salary : 0;
  const salary = Math.min(salaryCap(s, jobId), round(Math.max(base, keep) * (1 + salaryPct / 100)));
  if (prevJob && prevJob.sector !== job.sector && s.age >= 30) {
    s.counters.reconversions += 1;
    s.flags.reconversionAge = s.age;
  }
  s.job = { jobId, salary, years: 0, performance: 55 };
  s.lastJobId = jobId;
  s.lastGrossSalary = salary;
  s.unemploymentMonths = 0;
  s.counters.jobsHeld += 1;
  s.careerPath.push({ age: s.age, jobId });
  delete s.flags.chomageLong;
}

/** Quitte l'emploi. Un licenciement ou une rupture conventionnelle ouvrent des droits au chômage. */
export function leaveJob(s: GameState, mode: 'licenciement' | 'demission' | 'rupture'): void {
  if (!s.job) return;
  s.lastGrossSalary = s.job.salary;
  const worked = s.job.years + 1;
  s.job = null;
  if (mode !== 'demission') {
    s.unemploymentMonths = Math.min(24, Math.max(6, worked * 12));
  } else {
    s.unemploymentMonths = 0;
  }
}

export function currentJobTitle(s: GameState): string {
  if (s.job) return jobTitle(s.job.jobId, s.gender);
  if (s.business) return `Dirigeant${s.gender === 'f' ? 'e' : ''} de ${s.business.name}`;
  if (s.training) return s.training.mode === 'alternance' ? 'En alternance' : 'En formation';
  return s.age >= 65 ? 'À la retraite' : 'Sans emploi';
}

export function trainingRequirementsMissing(s: GameState, trainingId: string, mode: 'full' | 'part' | 'alternance'): string[] {
  const t = TRAINING_BY_ID[trainingId];
  if (!t) return ['Formation inconnue'];
  const missing: string[] = [];
  if (s.training) missing.push('Une formation est déjà en cours');
  if (s.diplomas.includes(t.diploma)) missing.push('Diplôme déjà obtenu');
  if (!t.modes.includes(mode)) missing.push('Ce format n’est pas proposé');
  if (t.education !== undefined && s.education < t.education) missing.push(`Niveau ${EDUCATION_LABELS[t.education]} requis`);
  if (mode === 'full' && s.job) missing.push('À temps plein, il faut d’abord quitter son emploi');
  if (mode === 'alternance' && s.job) missing.push('L’alternance remplace l’emploi actuel : quitte-le d’abord');
  if (mode === 'part' && !s.job && !s.business && trainingId === 'formation_management') missing.push('Réservé aux personnes en poste');
  if (mode === 'alternance' && s.age > 29) missing.push('L’alternance est réservée aux moins de 30 ans');
  return missing;
}

/** Coût annuel en énergie d'une formation selon le format. */
export function trainingEnergyCost(mode: 'full' | 'part' | 'alternance'): number {
  return mode === 'part' ? 14 : mode === 'alternance' ? 10 : 6;
}
