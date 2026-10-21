// Petits utilitaires pour écrire les événements de façon lisible.

import { HOUSING_BY_ID, JOB_BY_ID, type SectorId } from '../../engine/catalog';
import { consumerDebt, netWorth } from '../../engine/economy';
import type { Outcome } from '../../engine/eventTypes';
import type { Rng } from '../../engine/rng';
import type { GameState } from '../../engine/types';

export const hasJob = (s: GameState) => !!s.job;
export const noJob = (s: GameState) => !s.job && !s.business && s.age < 64;
export const hasBiz = (s: GameState) => !!s.business;
export const sector = (s: GameState): SectorId | null => (s.job ? JOB_BY_ID[s.job.jobId]?.sector ?? null : null);
export const jobLevel = (s: GameState) => (s.job ? JOB_BY_ID[s.job.jobId]?.level ?? 0 : 0);
export const renting = (s: GameState) => (HOUSING_BY_ID[s.housingId]?.rent ?? 0) > 0;
export const atParents = (s: GameState) => s.housingId === 'parents';
export const owner = (s: GameState) => s.properties.some((p) => p.isMainHome);
export const landlord = (s: GameState) => s.properties.some((p) => !p.isMainHome);
export const single = (s: GameState) => !s.relations.partner;
export const coupled = (s: GameState) => !!s.relations.partner;
export const kids = (s: GameState) => s.relations.childrenBirthAges.length;
export const liquid = (s: GameState) => s.cash + s.savings;
export const nw = (s: GameState) => netWorth(s);
export const debtConso = (s: GameState) => consumerDebt(s);
export const studying = (s: GameState) => !!s.training;
export const working = (s: GameState) => !!s.job || !!s.business;
export const salary = (s: GameState) => s.job?.salary ?? 0;

/** Résultat aléatoire : `ok` avec la probabilité p, sinon `ko`. */
export const roll =
  (p: number | ((s: GameState) => number), ok: Outcome, ko: Outcome) =>
  (s: GameState, r: Rng): Outcome =>
    r.chance(Math.min(0.95, Math.max(0.05, typeof p === 'function' ? p(s) : p))) ? ok : ko;

export const eur = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`;
