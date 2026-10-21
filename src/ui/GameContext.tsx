import { createContext, useContext } from 'react';
import type { EngineResult } from '../engine/simulation';
import type { GameState } from '../engine/types';

export interface GameApi {
  game: GameState;
  /** Exécute une action du moteur et affiche son message. */
  run: (fn: (s: GameState) => EngineResult, opts?: { silent?: boolean }) => boolean;
  toast: (message: string, tone?: 'ok' | 'err' | 'info') => void;
}

export const GameContext = createContext<GameApi | null>(null);

export function useGame(): GameApi {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('GameContext manquant');
  return ctx;
}
