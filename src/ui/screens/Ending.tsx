import { useMemo, useState } from 'react';
import { buildSummary } from '../../engine/summary';
import type { GameState } from '../../engine/types';
import { AdSlot } from '../../monetization';
import { copyText, resultUrl, shareStory } from '../../share/share';
import { LineChart } from '../components/common';
import { Icon, LogoMark } from '../components/Icon';
import { compactEur, eur } from '../format';

export function Ending({ game, onReplay, onHome, toast }: { game: GameState; onReplay: () => void; onHome: () => void; toast: (m: string, t?: 'ok' | 'err' | 'info') => void }) {
  const s = useMemo(() => buildSummary(game), [game]);
  const [showText, setShowText] = useState(false);
  const url = resultUrl({ e: s.ending.id, n: s.finalNetWorth, k: s.peakNetWorth, a: s.age, p: game.profileId });

  const share = async () => {
    const r = await shareStory(s.shareText, url);
    if (r === 'shared') toast('Merci du partage !', 'ok');
    else if (r === 'copied') toast('Texte et lien copiés : colle-les où tu veux.', 'ok');
    else if (r === 'failed') { setShowText(true); toast('Copie automatique impossible : sélectionne le texte ci-dessous.', 'err'); }
  };

  return (
    <div className="container page">
      <div className="result-card pop" aria-labelledby="result-title">
        <div className="brand"><LogoMark className="" /> De zéro à millionnaire</div>
        <div className="row" style={{ marginTop: '1rem', alignItems: 'flex-start' }}>
          <div className="result-emoji" aria-hidden>{s.ending.emoji}</div>
          <div>
            <div className="eyebrow">Fin · rareté : {s.ending.rarity.toLowerCase()}</div>
            <h1 id="result-title" className="result-title">{s.ending.title}</h1>
          </div>
        </div>
        <p className="muted" style={{ margin: 0 }}>{s.name}, {s.age} ans · départ : {s.profileEmoji} {s.profileName}</p>
        <div style={{ margin: '1.2rem 0 0.4rem' }} className="muted">Patrimoine final</div>
        <div className={`result-nw num ${s.finalNetWorth < 0 ? 'neg' : 'gold'}`}>{eur(s.finalNetWorth)}</div>
        <div className="result-grid">
          <div className="money-tile"><div className="label">Au départ</div><div className="value">{eur(s.startMoney)}</div></div>
          <div className="money-tile"><div className="label">Record</div><div className="value">{eur(s.peakNetWorth)}</div><div className="muted" style={{ fontSize: '0.75rem' }}>à {s.peakAge} ans</div></div>
          <div className="money-tile"><div className="label">Satisfaction</div><div className="value">{Math.round(s.happiness)}/100</div></div>
          <div className="money-tile"><div className="label">Entreprises</div><div className="value">{s.businessesCreated}{s.bankruptcies ? ` · ${s.bankruptcies} échec(s)` : ''}</div></div>
        </div>
        <p className="event-text" style={{ marginTop: '1rem', marginBottom: 0 }}>{s.ending.conclusion}</p>
      </div>

      <div className="btn-row" style={{ justifyContent: 'center', margin: '1.2rem 0' }}>
        <button className="btn btn-primary btn-lg" onClick={share}><Icon name="share" /> Partager mon histoire</button>
        <button className="btn btn-lg" onClick={onReplay}><Icon name="refresh" /> Rejouer une vie</button>
        <button className="btn btn-ghost" onClick={onHome}><Icon name="back" /> Accueil</button>
      </div>

      <section className="card" style={{ maxWidth: 760, margin: '0 auto 1rem' }}>
        <h2 className="card-title" style={{ fontSize: '1.1rem' }}><Icon name="copy" /> Texte de partage</h2>
        <p style={{ margin: 0 }}>{s.shareText}</p>
        <small className="muted">Le lien ouvre le jeu et affiche un aperçu de ton résultat (fin, âge, montants). Ton prénom et ton histoire détaillée ne sont pas transmis.</small>
        <div className="btn-row" style={{ marginTop: '0.6rem' }}>
          <button className="btn btn-sm" onClick={async () => toast((await copyText(`${s.shareText}\n${url}`)) ? 'Copié !' : 'Copie impossible.', 'ok')}>Copier le texte et le lien</button>
          <button className="btn btn-sm" onClick={() => setShowText((v) => !v)}>{showText ? 'Masquer' : 'Afficher'} le texte brut</button>
        </div>
        {showText && <textarea className="input" readOnly rows={4} value={`${s.shareText}\n${url}`} style={{ marginTop: '0.6rem' }} onFocus={(e) => e.target.select()} />}
      </section>

      <div className="grid grid-2" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <section className="card">
          <h2 className="card-title" style={{ fontSize: '1.1rem' }}><Icon name="chart" /> Ma courbe de richesse</h2>
          <LineChart title="Patrimoine net au fil de la vie" format={compactEur} series={[{ label: 'Patrimoine net', color: '#f3d08c', values: game.history.map((h) => ({ x: h.age, y: h.netWorth })) }]} />
        </section>
        <section className="card">
          <h2 className="card-title" style={{ fontSize: '1.1rem' }}><Icon name="career" /> Parcours professionnel</h2>
          {s.careerPath.length ? <p>{s.careerPath.join(' → ')}</p> : <p className="muted">Une vie hors des sentiers du salariat.</p>}
          <p className="muted" style={{ margin: 0 }}>{s.diplomas} diplôme(s) obtenu(s) en route · {s.promotions} promotion(s)</p>
        </section>
        <section className="card">
          <h2 className="card-title" style={{ fontSize: '1.1rem' }}><Icon name="trophy" /> Principales réussites</h2>
          {s.successes.length ? <ul className="prose" style={{ paddingLeft: '1.1rem', margin: 0 }}>{s.successes.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="muted">Une vie sans coup d’éclat… mais sans drame.</p>}
        </section>
        <section className="card">
          <h2 className="card-title" style={{ fontSize: '1.1rem' }}><Icon name="alert" /> Plus grosses erreurs</h2>
          {s.mistakes.length ? <ul className="prose" style={{ paddingLeft: '1.1rem', margin: 0 }}>{s.mistakes.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="muted">Aucune erreur majeure. Impressionnant.</p>}
        </section>
        <section className="card">
          <h2 className="card-title" style={{ fontSize: '1.1rem' }}><Icon name="flag" /> Décisions les plus marquantes</h2>
          {s.keyDecisions.length ? (
            <ul className="feed">{s.keyDecisions.map((d, i) => <li key={i}><span className="feed-age">{d.age} ans</span><div><div className="feed-title">{d.title}</div><div className="feed-text">{d.choice}</div></div></li>)}</ul>
          ) : <p className="muted">—</p>}
        </section>
        <section className="card">
          <h2 className="card-title" style={{ fontSize: '1.1rem' }}><Icon name="heart" /> Relations et équilibre</h2>
          <p style={{ margin: 0 }}>
            {s.partner ? `En couple avec ${s.partner}${s.married ? ', unis officiellement' : ''}.` : 'Célibataire en fin de parcours.'}{' '}
            {s.children ? `${s.children} enfant${s.children > 1 ? 's' : ''}.` : 'Pas d’enfant.'}
          </p>
          <p className="muted" style={{ margin: '0.4rem 0 0' }}>Famille {Math.round(s.family)}/100 · Amitiés {Math.round(s.friends)}/100 · Santé {Math.round(s.health)}/100 · Satisfaction {Math.round(s.happiness)}/100</p>
        </section>
      </div>
      <AdSlot placement="ending" />
    </div>
  );
}
