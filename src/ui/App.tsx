import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createGame, type EngineResult, type GameLength } from '../engine/simulation';
import type { GameState, Gender } from '../engine/types';
import { checkInvariants } from '../engine/validate';
import { deleteSave, getStorage, loadGame, loadSettings, saveGame, saveSettings, type Settings } from '../save/storage';
import { decodeResult } from '../share/share';
import { ConfirmDialog } from './components/common';
import { GameContext, type GameApi } from './GameContext';
import { Create } from './screens/Create';
import { Ending } from './screens/Ending';
import { Game } from './screens/Game';
import { Home } from './screens/Home';
import { Rules, SettingsScreen } from './screens/Info';

type Screen = 'home' | 'create' | 'game' | 'ending' | 'rules' | 'settings';
interface Toast { id: number; message: string; tone: 'ok' | 'err' | 'info' }

export function App() {
  const storageOk = useMemo(() => getStorage() !== null, []);
  const initial = useMemo(() => loadGame(), []);
  const [game, setGame] = useState<GameState | null>(initial.status === 'ok' ? initial.state : null);
  const [loadError, setLoadError] = useState<string | null>(initial.status === 'invalid' ? initial.error : null);
  const [screen, setScreen] = useState<Screen>('home');
  const [back, setBack] = useState<Screen>('home');
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingStart, setPendingStart] = useState<null | { name: string; gender: Gender; profileId: string; seed: number; length: GameLength }>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saveWarned = useRef(false);
  const shared = useMemo(() => decodeResult(new URLSearchParams(window.location.search).get('r')), []);
  const toastId = useRef(0);

  const toast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  // Sauvegarde automatique à chaque changement d'état.
  useEffect(() => {
    if (!game) return;
    const r = saveGame(game);
    if (!r.ok && !saveWarned.current) {
      saveWarned.current = true;
      toast(r.error ?? 'Sauvegarde impossible.', 'err');
    }
    if (import.meta.env.DEV) {
      const errs = checkInvariants(game);
      if (errs.length) console.warn('Incohérences détectées :', errs);
    }
  }, [game, toast]);

  useEffect(() => {
    document.body.classList.toggle('reduce-motion', settings.reduceMotion);
    document.body.classList.toggle('large-text', settings.largeText);
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (game?.phase === 'ended' && screen === 'game') setScreen('ending');
  }, [game, screen]);

  useEffect(() => window.scrollTo({ top: 0 }), [screen]);

  const run = useCallback<GameApi['run']>((fn, opts) => {
    if (!game) return false;
    let res: EngineResult;
    try {
      res = fn(game);
    } catch (e) {
      console.error(e);
      toast('Une erreur inattendue est survenue. Ta partie est intacte.', 'err');
      return false;
    }
    if (res.state !== game) setGame(res.state);
    if (res.message && !opts?.silent) toast(res.message, res.ok ? 'ok' : 'err');
    else if (!res.ok && res.message) toast(res.message, 'err');
    return res.ok;
  }, [game, toast]);

  const startGame = (o: { name: string; gender: Gender; profileId: string; seed: number; length: GameLength }) => {
    setGame(createGame(o));
    setPendingStart(null);
    setLoadError(null);
    setScreen('game');
  };

  const open = (s: Screen) => {
    setBack(screen);
    setScreen(s);
  };

  let content;
  if (screen === 'create') {
    content = <Create onBack={() => setScreen('home')} onStart={(o) => (game && game.phase !== 'ended' ? setPendingStart(o) : startGame(o))} />;
  } else if (screen === 'rules') {
    content = <Rules onBack={() => setScreen(back)} />;
  } else if (screen === 'settings') {
    content = (
      <SettingsScreen settings={settings} onChange={setSettings} onBack={() => setScreen(back)} hasSave={!!game} storageOk={storageOk}
        onDeleteSave={() => setConfirmDelete(true)} />
    );
  } else if (screen === 'ending' && game) {
    content = <Ending game={game} toast={toast} onHome={() => setScreen('home')} onReplay={() => setScreen('create')} />;
  } else if (screen === 'game' && game) {
    content = (
      <GameContext.Provider value={{ game, run, toast }}>
        <Game onHome={() => setScreen('home')} onRules={() => open('rules')} onSettings={() => open('settings')} showDetails={settings.showDetails} />
      </GameContext.Provider>
    );
  } else {
    content = (
      <>
        {loadError && (
          <div className="container" style={{ paddingTop: 16 }}>
            <p className="banner" role="alert">
              Ta sauvegarde n’a pas pu être chargée : {loadError} Tu peux commencer une nouvelle partie (l’ancienne sauvegarde sera remplacée).
            </p>
          </div>
        )}
        <Home saved={game} shared={shared} storageOk={storageOk} onNew={() => setScreen('create')} onResume={() => setScreen(game?.phase === 'ended' ? 'ending' : 'game')}
          onRules={() => open('rules')} onSettings={() => open('settings')} />
      </>
    );
  }

  return (
    <>
      {content}
      {pendingStart && game && (
        <ConfirmDialog
          title="Écraser la partie en cours ?"
          message={`La vie de ${game.name} (${game.age} ans) sera définitivement remplacée par cette nouvelle partie.`}
          confirmLabel="Commencer une nouvelle vie"
          danger
          onCancel={() => setPendingStart(null)}
          onConfirm={() => startGame(pendingStart)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog title="Effacer la sauvegarde ?" message="La partie en cours sera définitivement supprimée de cet appareil." confirmLabel="Effacer" danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { deleteSave(); setGame(null); setConfirmDelete(false); toast('Sauvegarde effacée.', 'ok'); }} />
      )}
      <div className="toast-zone" aria-live="polite" role="status">
        {toasts.map((t) => <div key={t.id} className={`toast ${t.tone}`}>{t.message}</div>)}
      </div>
    </>
  );
}
