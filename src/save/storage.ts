// Sauvegarde locale versionnée (localStorage). Aucune donnée ne quitte l'appareil.

import { SAVE_VERSION } from '../engine/simulation';
import type { GameState } from '../engine/types';

export const SAVE_KEY = 'dzam.save';
export const SETTINGS_KEY = 'dzam.settings';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveEnvelope {
  format: 'dzam-save';
  version: number;
  savedAt: string;
  state: GameState;
}

export type LoadResult =
  | { status: 'none' }
  | { status: 'ok'; state: GameState; savedAt: string }
  | { status: 'invalid'; error: string }
  | { status: 'unavailable' };

export function getStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const probe = '__dzam_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Migrations successives du format de sauvegarde (clé = version source). */
const MIGRATIONS: Record<number, (state: Record<string, unknown>) => Record<string, unknown>> = {
  // 1: (s) => ({ ...s, nouveauChamp: valeurParDéfaut }),
};

const REQUIRED: [string, string][] = [
  ['name', 'string'], ['age', 'number'], ['endAge', 'number'], ['phase', 'string'], ['cash', 'number'],
  ['savings', 'number'], ['stocks', 'number'], ['crypto', 'number'], ['rngState', 'number'], ['profileId', 'string'],
  ['housingId', 'string'], ['lifestyle', 'string'], ['priority', 'string'], ['health', 'number'], ['energy', 'number'],
  ['happiness', 'number'], ['nextId', 'number'],
];
const REQUIRED_ARRAYS = ['properties', 'debts', 'careerPath', 'diplomas', 'pending', 'eventQueue', 'log', 'history', 'highlights', 'decisions', 'recentCategories'];
const REQUIRED_OBJECTS = ['skills', 'relations', 'flags', 'counters', 'seenEvents', 'sectorYears', 'yearActions'];

export function validateShape(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return 'Données illisibles';
  const s = raw as Record<string, unknown>;
  for (const [k, t] of REQUIRED) if (typeof s[k] !== t) return `Champ « ${k} » manquant ou invalide`;
  for (const k of REQUIRED_ARRAYS) if (!Array.isArray(s[k])) return `Liste « ${k} » manquante`;
  for (const k of REQUIRED_OBJECTS) if (!s[k] || typeof s[k] !== 'object') return `Objet « ${k} » manquant`;
  if (!['event', 'free', 'ended'].includes(s.phase as string)) return 'Phase de jeu inconnue';
  return null;
}

export function serialize(state: GameState): string {
  const env: SaveEnvelope = { format: 'dzam-save', version: SAVE_VERSION, savedAt: new Date().toISOString(), state };
  return JSON.stringify(env);
}

export function deserialize(text: string): LoadResult {
  let env: Partial<SaveEnvelope>;
  try {
    env = JSON.parse(text);
  } catch {
    return { status: 'invalid', error: 'La sauvegarde est corrompue (JSON illisible).' };
  }
  if (!env || env.format !== 'dzam-save' || typeof env.version !== 'number') {
    return { status: 'invalid', error: 'Format de sauvegarde inconnu.' };
  }
  if (env.version > SAVE_VERSION) {
    return { status: 'invalid', error: 'Cette sauvegarde provient d’une version plus récente du jeu.' };
  }
  let state = env.state as unknown as Record<string, unknown>;
  for (let v = env.version; v < SAVE_VERSION; v++) {
    const m = MIGRATIONS[v];
    if (m) state = m(state);
  }
  if (state) state.version = SAVE_VERSION;
  const err = validateShape(state);
  if (err) return { status: 'invalid', error: `Sauvegarde incomplète : ${err}.` };
  return { status: 'ok', state: state as unknown as GameState, savedAt: env.savedAt ?? '' };
}

export function saveGame(state: GameState, storage: StorageLike | null = getStorage()): { ok: boolean; error?: string } {
  if (!storage) return { ok: false, error: 'Stockage local indisponible : la partie ne sera pas sauvegardée.' };
  try {
    storage.setItem(SAVE_KEY, serialize(state));
    return { ok: true };
  } catch {
    return { ok: false, error: 'Impossible d’écrire la sauvegarde (espace plein ou navigation privée).' };
  }
}

export function loadGame(storage: StorageLike | null = getStorage()): LoadResult {
  if (!storage) return { status: 'unavailable' };
  let text: string | null;
  try {
    text = storage.getItem(SAVE_KEY);
  } catch {
    return { status: 'unavailable' };
  }
  if (!text) return { status: 'none' };
  return deserialize(text);
}

export function deleteSave(storage: StorageLike | null = getStorage()): void {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    /* rien à faire */
  }
}

export interface Settings {
  reduceMotion: boolean;
  largeText: boolean;
  showDetails: boolean;
}

export const DEFAULT_SETTINGS: Settings = { reduceMotion: false, largeText: false, showDetails: true };

export function loadSettings(storage: StorageLike | null = getStorage()): Settings {
  try {
    const raw = storage?.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings, storage: StorageLike | null = getStorage()): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* les réglages restent en mémoire */
  }
}
