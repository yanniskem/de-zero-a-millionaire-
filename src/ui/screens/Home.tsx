import { ALL_EVENTS } from '../../content/events';
import { ENDINGS, ENDING_BY_ID } from '../../content/endings';
import { PROFILES, PROFILE_BY_ID } from '../../content/profiles';
import type { GameState } from '../../engine/types';
import { AdSlot } from '../../monetization';
import type { SharedResult } from '../../share/share';
import { Icon, LogoMark } from '../components/Icon';
import { eur } from '../format';

const strip = (t: string) => t.replace(/\{([^{}|]*)\|[^{}|]*\}/g, '$1');

export function Home({ saved, shared, storageOk, onNew, onResume, onRules, onSettings }: {
  saved: GameState | null;
  shared: SharedResult | null;
  storageOk: boolean;
  onNew: () => void;
  onResume: () => void;
  onRules: () => void;
  onSettings: () => void;
}) {
  const ending = shared ? ENDING_BY_ID[shared.e] : null;
  return (
    <div className="home">
      <main className="home-hero">
        <LogoMark className="logo-mark" />
        <h1 className="home-title">
          De zéro à <span className="accent">millionnaire</span>
        </h1>
        <p className="home-tagline">
          Une vie entière en quelques minutes. Études, travail, argent, amour, entreprise, coups durs : chaque décision compte, parfois des années plus tard.
        </p>

        {shared && ending && (
          <div className="teaser pop" role="note">
            <div className="eyebrow">Un ami te défie</div>
            <p style={{ margin: '0.4rem 0' }}>
              Départ : « {strip(PROFILE_BY_ID[shared.p]?.name ?? '')} ». Arrivée à {shared.a} ans avec <strong className="gold">{eur(shared.n)}</strong> de patrimoine
              {' '}et la fin « {ending.emoji} {strip(ending.title)} ».
            </p>
            <strong>Feras-tu mieux ?</strong>
          </div>
        )}

        <div className="home-actions">
          <button className="btn btn-primary btn-lg" onClick={onNew}>
            <Icon name="play" /> Commencer ma vie
          </button>
          {saved && saved.phase !== 'ended' && (
            <button className="btn btn-lg" onClick={onResume}>
              <Icon name="refresh" /> Reprendre — {saved.name}, {saved.age} ans
            </button>
          )}
          {saved && saved.phase === 'ended' && (
            <button className="btn btn-lg" onClick={onResume}>
              <Icon name="trophy" /> Revoir le bilan de {saved.name}
            </button>
          )}
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={onRules}><Icon name="book" /> Règles du jeu</button>
            <button className="btn btn-ghost" onClick={onSettings}><Icon name="settings" /> Paramètres</button>
          </div>
        </div>

        {!storageOk && (
          <p className="banner" role="status">
            La sauvegarde locale est indisponible sur ce navigateur (navigation privée ou stockage bloqué). Tu peux jouer, mais ta partie sera perdue si tu fermes la page.
          </p>
        )}

        <section className="home-features" aria-label="Points forts">
          <div className="feature"><strong>{PROFILES.length} départs différents</strong>Héritier, sans diplôme, étudiant fauché… chacun avec ses atouts.</div>
          <div className="feature"><strong>{ALL_EVENTS.length} événements</strong>Des dilemmes, des opportunités et des conséquences à retardement.</div>
          <div className="feature"><strong>Une vraie économie</strong>Salaires, impôts, loyers, crédits, bourse, immobilier, entreprises.</div>
          <div className="feature"><strong>{ENDINGS.length} fins possibles</strong>Millionnaire, phénix, vie de famille, ruine… à toi d’écrire la tienne.</div>
        </section>
        <AdSlot placement="home" />
      </main>
      <footer className="footer">
        Jeu de fiction gratuit, sans inscription. Les montants sont simplifiés et ne constituent pas un conseil financier.
        <br />Sauvegarde locale sur cet appareil uniquement (aucune synchronisation entre appareils).
      </footer>
    </div>
  );
}
