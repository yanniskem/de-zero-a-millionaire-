// Rendu des écrans principaux sans navigateur (vérifie l'absence d'erreur de rendu).
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { advanceYear, chooseOption, continueAfterOutcome, createGame, endGameEarly } from '../src/engine/simulation';
import { GameContext } from '../src/ui/GameContext';
import { BusinessPanel } from '../src/ui/panels/BusinessPanel';
import { CareerPanel } from '../src/ui/panels/CareerPanel';
import { HistoryPanel } from '../src/ui/panels/HistoryPanel';
import { HousingPanel } from '../src/ui/panels/HousingPanel';
import { LifePanel } from '../src/ui/panels/LifePanel';
import { MoneyPanel } from '../src/ui/panels/MoneyPanel';
import { RelationsPanel } from '../src/ui/panels/RelationsPanel';
import { Home } from '../src/ui/screens/Home';
import { Rules } from '../src/ui/screens/Info';

describe('interface', () => {
  const s0 = createGame({ name: 'Léa', gender: 'f', profileId: 'entrepreneur', seed: 3 });
  let s = continueAfterOutcome(chooseOption(s0, 'lancer').state);
  s = advanceYear(s).state;

  it('rend l’accueil et les règles', () => {
    const html = renderToString(<Home saved={s} shared={null} storageOk onNew={() => {}} onResume={() => {}} onRules={() => {}} onSettings={() => {}} />);
    expect(html).toContain('Commencer ma vie');
    expect(html).toContain('Reprendre');
    expect(renderToString(<Rules onBack={() => {}} />)).toContain('Règles du jeu');
  });

  it('rend tous les onglets du jeu avec les vraies données', () => {
    const api = { game: s, run: () => true, toast: () => {} };
    for (const P of [LifePanel, CareerPanel, MoneyPanel, HousingPanel, RelationsPanel, BusinessPanel, HistoryPanel]) {
      const html = renderToString(<GameContext.Provider value={api}><P /></GameContext.Provider>);
      expect(html.length).toBeGreaterThan(200);
    }
    const biz = renderToString(<GameContext.Provider value={api}><BusinessPanel /></GameContext.Provider>);
    expect(biz).toContain('Seconde Foulée');
  });

  it('une partie terminée est cohérente', () => {
    const old = { ...s, age: 31, phase: 'free' as const, eventQueue: [] };
    expect(endGameEarly(old).state.endingId).toBeTruthy();
  });
});
