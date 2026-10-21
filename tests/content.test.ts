import { describe, expect, it } from 'vitest';
import { ALL_EVENTS } from '../src/content/events';
import { ENDINGS } from '../src/content/endings';
import { PROFILES } from '../src/content/profiles';
import { HOUSING_BY_ID, JOB_BY_ID, SECTOR_BY_ID, TRAINING_BY_ID } from '../src/engine/catalog';
import { CATEGORY_LABELS } from '../src/engine/eventTypes';
import type { Fx } from '../src/engine/types';

const randomEvents = ALL_EVENTS.filter((e) => !e.profile && !e.followUp);

describe('contenu narratif', () => {
  it('contient au moins 100 événements distincts (hors introductions et suites)', () => {
    expect(randomEvents.length).toBeGreaterThanOrEqual(100);
  });

  it('a des identifiants et des titres uniques', () => {
    const ids = ALL_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const titles = ALL_EVENTS.map((e) => e.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('propose en moyenne au moins 2,5 choix par événement', () => {
    const avg = ALL_EVENTS.reduce((t, e) => t + e.choices.length, 0) / ALL_EVENTS.length;
    expect(avg).toBeGreaterThanOrEqual(2.5);
  });

  it('couvre toutes les catégories demandées', () => {
    const cats = new Set(randomEvents.map((e) => e.category));
    for (const c of Object.keys(CATEGORY_LABELS)) if (c !== 'depart') expect(cats.has(c as never), c).toBe(true);
  });

  it('a une introduction pour chaque profil (≥ 10 profils)', () => {
    expect(PROFILES.length).toBeGreaterThanOrEqual(10);
    for (const p of PROFILES) expect(ALL_EVENTS.some((e) => e.id === `intro_${p.id}`), p.id).toBe(true);
  });

  it('définit au moins 12 fins distinctes', () => {
    expect(ENDINGS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(ENDINGS.map((e) => e.title)).size).toBe(ENDINGS.length);
  });

  it('ne référence que des métiers, formations, secteurs, logements et suites existants', () => {
    const ids = new Set(ALL_EVENTS.map((e) => e.id));
    const check = (fx: Fx | undefined) => {
      if (!fx) return;
      if (fx.setJob) expect(JOB_BY_ID[fx.setJob.jobId], fx.setJob.jobId).toBeDefined();
      if (fx.startTraining) expect(TRAINING_BY_ID[fx.startTraining.trainingId], fx.startTraining.trainingId).toBeDefined();
      if (fx.startBusiness) expect(SECTOR_BY_ID[fx.startBusiness.sector]).toBeDefined();
      if (fx.housingId) expect(HOUSING_BY_ID[fx.housingId]).toBeDefined();
      for (const d of fx.delayed ?? []) {
        if (d.eventId) expect(ids.has(d.eventId), d.eventId).toBe(true);
        check(d.fx);
      }
    };
    for (const e of ALL_EVENTS) for (const c of e.choices) if (typeof c.outcome !== 'function') check(c.outcome.fx);
    for (const p of PROFILES) {
      if (p.jobId) expect(JOB_BY_ID[p.jobId]).toBeDefined();
      if (p.training) expect(TRAINING_BY_ID[p.training.trainingId]).toBeDefined();
      expect(HOUSING_BY_ID[p.housingId]).toBeDefined();
    }
    for (const j of Object.values(JOB_BY_ID)) if (j.next) expect(JOB_BY_ID[j.next], j.next).toBeDefined();
  });
});
