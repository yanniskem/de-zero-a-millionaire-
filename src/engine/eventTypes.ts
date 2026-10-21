// Contrat des événements narratifs. Les définitions vivent dans src/content/events.

import type { Rng } from './rng';
import type { Fx, GameState } from './types';

export type EventCategory =
  | 'etudes'
  | 'carriere'
  | 'budget'
  | 'investissement'
  | 'entreprise'
  | 'logement'
  | 'relations'
  | 'sante'
  | 'opportunite'
  | 'difficulte'
  | 'reussite'
  | 'morale'
  | 'changement'
  | 'depart';

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  etudes: 'Études et formation',
  carriere: 'Emploi et carrière',
  budget: 'Budget et dépenses',
  investissement: 'Épargne et investissements',
  entreprise: 'Entrepreneuriat',
  logement: 'Logement',
  relations: 'Famille et relations',
  sante: 'Santé et bien-être',
  opportunite: 'Opportunité inattendue',
  difficulte: 'Coup dur',
  reussite: 'Réussite',
  morale: 'Dilemme moral',
  changement: 'Changement de vie',
  depart: 'Le début',
};

export interface Outcome {
  text: string;
  fx?: Fx;
}

export interface Choice {
  id: string;
  label: string;
  hint?: string;
  /** Montant à débourser immédiatement : le choix est indisponible si les liquidités ne suffisent pas. */
  cost?: number;
  requires?: (s: GameState) => boolean;
  requiresText?: string;
  outcome: Outcome | ((s: GameState, r: Rng) => Outcome);
}

export interface GameEvent {
  id: string;
  category: EventCategory;
  title: string;
  text: string | ((s: GameState) => string);
  minAge?: number;
  maxAge?: number;
  when?: (s: GameState) => boolean;
  weight?: number | ((s: GameState) => number);
  rare?: boolean;
  /** Si défini : l'événement peut revenir après ce nombre d'années. */
  cooldown?: number;
  /** Événement de suite uniquement (déclenché par une conséquence différée). */
  followUp?: boolean;
  /** Événement d'introduction propre à un profil de départ. */
  profile?: string;
  choices: Choice[];
}
