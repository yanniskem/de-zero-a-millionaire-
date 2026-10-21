import { useState } from 'react';
import { currentJobTitle } from '../../engine/career';
import { balanceSheet } from '../../engine/economy';
import { advanceYear, canAdvance, endGameEarly } from '../../engine/simulation';
import { ConfirmDialog, Modal } from '../components/common';
import { Icon } from '../components/Icon';
import { compactEur, eur } from '../format';
import { useGame } from '../GameContext';
import { EventView } from '../game/EventView';
import { YearReportView } from '../game/YearReportView';
import { BusinessPanel } from '../panels/BusinessPanel';
import { CareerPanel } from '../panels/CareerPanel';
import { HistoryPanel } from '../panels/HistoryPanel';
import { HousingPanel } from '../panels/HousingPanel';
import { LifePanel } from '../panels/LifePanel';
import { MoneyPanel } from '../panels/MoneyPanel';
import { RelationsPanel } from '../panels/RelationsPanel';

const TABS = [
  { id: 'vie', label: 'Ma vie', icon: 'life' },
  { id: 'carriere', label: 'Carrière', icon: 'career' },
  { id: 'argent', label: 'Argent', icon: 'money' },
  { id: 'logement', label: 'Logement', icon: 'home' },
  { id: 'proches', label: 'Proches', icon: 'people' },
  { id: 'entreprise', label: 'Entreprise', icon: 'rocket' },
  { id: 'parcours', label: 'Parcours', icon: 'chart' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function Game({ onHome, onRules, onSettings, showDetails }: { onHome: () => void; onRules: () => void; onSettings: () => void; showDetails: boolean }) {
  const { game, run } = useGame();
  const [tab, setTab] = useState<TabId>('vie');
  const [showReport, setShowReport] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const b = balanceSheet(game);
  const adv = canAdvance(game);

  const live = () => {
    const ok = run(advanceYear, { silent: true });
    if (ok) {
      setShowReport(true);
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="age-badge" aria-label={`${game.age} ans`}>{game.age}</div>
          <div className="topbar-id">
            <span className="topbar-name">{game.name}</span>
            <span className="topbar-sub">{currentJobTitle(game)}</span>
          </div>
          <div className="topbar-stats">
            <div className="kpi"><span className="kpi-label">Patrimoine</span><span className={`kpi-value ${b.netWorth < 0 ? 'neg' : 'gold'}`}>{compactEur(b.netWorth)}</span></div>
            <div className="kpi"><span className="kpi-label">Disponible</span><span className="kpi-value">{compactEur(game.cash)}</span></div>
            <div className="kpi"><span className="kpi-label">Dettes</span><span className="kpi-value">{compactEur(b.debts)}</span></div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setMenu(true)} aria-label="Menu"><Icon name="menu" /></button>
        </div>
        <nav className="tabs" role="tablist" aria-label="Sections du jeu">
          {TABS.map((t) => (
            <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls="panel" className="tab" onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={18} /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="container game-main" id="panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'vie' && <LifePanel />}
        {tab === 'carriere' && <CareerPanel />}
        {tab === 'argent' && <MoneyPanel />}
        {tab === 'logement' && <HousingPanel />}
        {tab === 'proches' && <RelationsPanel />}
        {tab === 'entreprise' && <BusinessPanel />}
        {tab === 'parcours' && <HistoryPanel />}
      </main>

      <div className="bottom-bar">
        <div className="bottom-inner">
          <div className="bottom-hint">
            {game.phase === 'event' ? 'Un événement attend ta décision.' : `Ajuste tes choix, puis vis l’année de tes ${game.age} ans. Fin de l’histoire à ${game.endAge} ans.`}
          </div>
          <button className="btn btn-primary btn-lg" style={{ flex: '0 0 auto' }} disabled={!adv.ok} title={adv.reason} onClick={live}>
            Vivre mes {game.age} ans <Icon name="arrow" />
          </button>
        </div>
      </div>

      {showReport && game.lastReport && <YearReportView report={game.lastReport} detailed={showDetails} onClose={() => setShowReport(false)} />}
      {!showReport && game.phase === 'event' && <EventView />}

      {menu && (
        <Modal title="Menu" onClose={() => setMenu(false)}>
          <div className="stack" style={{ gap: '0.6rem' }}>
            <p className="muted" style={{ margin: 0 }}>Ta partie est sauvegardée automatiquement sur cet appareil.</p>
            <button className="btn btn-block" onClick={() => { setMenu(false); onRules(); }}><Icon name="book" /> Règles du jeu</button>
            <button className="btn btn-block" onClick={() => { setMenu(false); onSettings(); }}><Icon name="settings" /> Paramètres</button>
            <button className="btn btn-block" disabled={game.age < 30 || game.phase === 'event'} onClick={() => { setMenu(false); setConfirmEnd(true); }}>
              <Icon name="flag" /> Clore mon histoire maintenant
            </button>
            {game.age < 30 && <small className="muted">Possible à partir de 30 ans.</small>}
            <button className="btn btn-block btn-ghost" onClick={() => { setMenu(false); onHome(); }}><Icon name="back" /> Retour à l’accueil</button>
          </div>
        </Modal>
      )}
      {confirmEnd && (
        <ConfirmDialog
          title="Clore ton histoire ?"
          message={`${game.name} terminera sa vie simulée à ${game.age} ans avec un patrimoine de ${eur(b.netWorth)}. Le bilan final sera calculé maintenant.`}
          confirmLabel="Voir mon bilan"
          onCancel={() => setConfirmEnd(false)}
          onConfirm={() => { setConfirmEnd(false); run(endGameEarly); }}
        />
      )}
    </div>
  );
}
