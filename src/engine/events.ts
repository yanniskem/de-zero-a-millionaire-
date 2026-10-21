// Sélection et disponibilité des événements narratifs.

import { ALL_EVENTS } from '../content/events';
import { jobTitle } from './catalog';
import { liquidity } from './economy';
import type { Choice, GameEvent } from './eventTypes';
import type { Rng } from './rng';
import type { GameState } from './types';

export const EVENT_BY_ID: Record<string, GameEvent> = Object.fromEntries(ALL_EVENTS.map((e) => [e.id, e]));

export const PASS_CHOICE: Choice = {
  id: '__pass',
  label: 'Laisser passer',
  hint: 'Aucune option n’est accessible pour le moment.',
  outcome: { text: 'Tu n’as pas les moyens d’agir cette fois. La vie continue.' },
};

export function getEvent(id: string): GameEvent | undefined {
  return EVENT_BY_ID[id];
}

export function fillText(text: string, s: GameState): string {
  const fem = s.gender === 'f';
  return text
    .replace(/\{name\}/g, s.name)
    .replace(/\{age\}/g, String(s.age))
    .replace(/\{partner\}/g, s.relations.partner?.name ?? 'ton ancien amour')
    .replace(/\{job\}/g, s.job ? jobTitle(s.job.jobId, s.gender).toLowerCase() : 'sans emploi')
    .replace(/\{business\}/g, s.business?.name ?? 'ton entreprise')
    .replace(/\{e\}/g, fem ? 'e' : '')
    .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_m, m: string, f: string) => (fem ? f : m));
}

export function eventText(ev: GameEvent, s: GameState): string {
  return fillText(typeof ev.text === 'function' ? ev.text(s) : ev.text, s);
}

export function isEligible(s: GameState, ev: GameEvent): boolean {
  if (ev.followUp || ev.profile) return false;
  if (ev.minAge !== undefined && s.age < ev.minAge) return false;
  if (ev.maxAge !== undefined && s.age > ev.maxAge) return false;
  const seen = s.seenEvents[ev.id];
  if (seen !== undefined && (ev.cooldown === undefined || s.age - seen < ev.cooldown)) return false;
  if (s.eventQueue.some((q) => q.eventId === ev.id)) return false;
  try {
    return ev.when ? ev.when(s) : true;
  } catch {
    return false;
  }
}

export function eventWeight(s: GameState, ev: GameEvent): number {
  let w = typeof ev.weight === 'function' ? ev.weight(s) : ev.weight ?? 1;
  if (ev.rare) w *= 0.15;
  const recent = s.recentCategories.slice(-3);
  if (recent.includes(ev.category)) w *= 0.35;
  return w;
}

export function eligibleEvents(s: GameState): GameEvent[] {
  return ALL_EVENTS.filter((e) => isEligible(s, e));
}

/** Tire jusqu'à `count` événements distincts selon les conditions et les poids. */
export function drawEvents(s: GameState, rng: Rng, count: number): GameEvent[] {
  const picked: GameEvent[] = [];
  let pool = eligibleEvents(s);
  for (let i = 0; i < count && pool.length; i++) {
    const ev = rng.weighted(pool, (e) => eventWeight(s, e));
    if (!ev) break;
    picked.push(ev);
    pool = pool.filter((e) => e.id !== ev.id && e.category !== ev.category);
  }
  return picked;
}

export interface ChoiceView {
  choice: Choice;
  available: boolean;
  reason?: string;
}

export function choiceViews(s: GameState, ev: GameEvent): ChoiceView[] {
  const views = ev.choices.map((choice): ChoiceView => {
    if (choice.requires) {
      let ok = false;
      try {
        ok = choice.requires(s);
      } catch {
        ok = false;
      }
      if (!ok) return { choice, available: false, reason: choice.requiresText ?? 'Conditions non remplies' };
    }
    if (choice.cost && liquidity(s) < choice.cost) {
      return {
        choice,
        available: false,
        reason: `Il te faut ${choice.cost.toLocaleString('fr-FR')} € (argent disponible + épargne).`,
      };
    }
    return { choice, available: true };
  });
  if (!views.some((v) => v.available)) views.push({ choice: PASS_CHOICE, available: true });
  return views;
}
