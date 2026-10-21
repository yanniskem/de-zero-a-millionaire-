// Contrôles de cohérence de l'état de jeu (utilisés par les tests et au chargement d'une sauvegarde).

import { HOUSING_BY_ID, JOB_BY_ID } from './catalog';
import { balanceSheet } from './economy';
import type { GameState } from './types';

function findNonFinite(value: unknown, path: string, out: string[]) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) out.push(`${path} n'est pas un nombre fini`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => findNonFinite(v, `${path}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) findNonFinite(v, `${path}.${k}`, out);
  }
}

export function checkInvariants(s: GameState): string[] {
  const errors: string[] = [];
  findNonFinite(s, 'state', errors);
  if (s.cash < -0.01) errors.push(`Argent disponible négatif sans dette : ${s.cash}`);
  if (s.savings < -0.01) errors.push(`Épargne négative : ${s.savings}`);
  if (s.stocks < -0.01 || s.crypto < -0.01) errors.push('Placements négatifs');
  for (const d of s.debts) {
    if (d.principal <= 0) errors.push(`Dette nulle ou négative conservée : ${d.label}`);
    if (d.monthlyPayment < 0) errors.push(`Mensualité négative : ${d.label}`);
  }
  for (const p of s.properties) if (p.value <= 0) errors.push(`Bien sans valeur : ${p.label}`);
  if (s.properties.filter((p) => p.isMainHome).length > 1) errors.push('Plusieurs résidences principales');
  if (s.housingId === 'proprietaire' && !s.properties.some((p) => p.isMainHome)) errors.push('Propriétaire sans résidence principale');
  for (const [k, v] of Object.entries({ health: s.health, energy: s.energy, happiness: s.happiness, family: s.relations.family, friends: s.relations.friends, network: s.relations.network })) {
    if (v < 0 || v > 100) errors.push(`${k} hors limites : ${v}`);
  }
  for (const [k, v] of Object.entries(s.skills)) if (v < 0 || v > 100) errors.push(`Compétence ${k} hors limites : ${v}`);
  if (s.job && !JOB_BY_ID[s.job.jobId]) errors.push(`Métier inconnu : ${s.job.jobId}`);
  if (s.job && s.job.salary <= 0) errors.push('Salaire nul');
  if (!HOUSING_BY_ID[s.housingId]) errors.push(`Logement inconnu : ${s.housingId}`);
  if (s.age < 18 || s.age > s.endAge) errors.push(`Âge incohérent : ${s.age}`);
  if (s.phase === 'event' && s.eventQueue.length === 0) errors.push('Phase événement sans événement');
  if (s.phase === 'free' && s.eventQueue.length > 0) errors.push('Événements en attente en phase libre');
  if (s.phase === 'ended' && !s.endingId) errors.push('Partie terminée sans fin');
  const b = balanceSheet(s);
  if (Math.abs(b.assets - b.debts - b.netWorth) > 1) errors.push('Patrimoine net incohérent');
  if (s.business && s.business.scale < 1) errors.push('Entreprise de taille invalide');
  return errors;
}
