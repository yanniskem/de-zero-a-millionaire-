import { useEffect, useMemo, useRef, useState } from 'react';
import { PROFILES } from '../../content/profiles';
import { EDUCATION_LABELS, HOUSING_BY_ID, SKILL_LABELS, jobTitle } from '../../engine/catalog';
import { fillText } from '../../engine/events';
import { randomSeed } from '../../engine/rng';
import { createGame, GAME_LENGTHS, type GameLength } from '../../engine/simulation';
import type { Gender, SkillId } from '../../engine/types';
import { netWorth } from '../../engine/economy';
import { StatBar } from '../components/common';
import { Icon } from '../components/Icon';
import { eur } from '../format';

const NAMES_F = ['Léa', 'Inès', 'Chloé', 'Manon', 'Sarah', 'Jade', 'Camille', 'Lina', 'Zoé', 'Nora'];
const NAMES_M = ['Lucas', 'Hugo', 'Nathan', 'Yanis', 'Théo', 'Karim', 'Maxime', 'Adrien', 'Mehdi', 'Louis'];

export function Create({ onBack, onStart }: { onBack: () => void; onStart: (opts: { name: string; gender: Gender; profileId: string; seed: number; length: GameLength }) => void }) {
  const [gender, setGender] = useState<Gender>(() => (Math.random() < 0.5 ? 'f' : 'm'));
  const [name, setName] = useState(() => (gender === 'f' ? NAMES_F : NAMES_M)[Math.floor(Math.random() * 10)]);
  const [profileId, setProfileId] = useState(PROFILES[0].id);
  const [seed, setSeed] = useState(randomSeed);
  const [length, setLength] = useState<GameLength>('normale');

  const titleRef = useRef<HTMLHeadingElement>(null);
  // À l'ouverture de l'écran : on remonte en haut et on place le focus sur le titre
  // (le changement d'écran est ainsi visible et annoncé aux lecteurs d'écran).
  useEffect(() => {
    window.scrollTo({ top: 0 });
    titleRef.current?.focus();
  }, []);

  const preview = useMemo(() => createGame({ name: name || 'Alex', gender, profileId, seed, length }), [name, gender, profileId, seed, length]);
  const profile = PROFILES.find((p) => p.id === profileId)!;
  const trimmed = name.trim();
  const topSkills = (Object.entries(preview.skills) as [SkillId, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const randomProfile = () => {
    setProfileId(PROFILES[Math.floor(Math.random() * PROFILES.length)].id);
    setSeed(randomSeed());
  };

  return (
    <div className="container page">
      <header className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack} aria-label="Retour à l’accueil"><Icon name="back" /></button>
        <h1 ref={titleRef} tabIndex={-1} style={{ outline: 'none' }}>Qui seras-tu ?</h1>
      </header>

      <div className="stack">
        <section className="card stack" aria-labelledby="id-title">
          <h2 id="id-title" className="card-title" style={{ fontSize: '1.1rem' }}><Icon name="spark" /> Identité</h2>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="name">Prénom</label>
              <input id="name" className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} autoComplete="off" />
              {!trimmed && <small className="neg">Choisis un prénom pour commencer.</small>}
            </div>
            <div className="field">
              <span className="label" id="gender-label">Accords grammaticaux</span>
              <div className="segmented" role="radiogroup" aria-labelledby="gender-label">
                <button type="button" role="radio" aria-checked={gender === 'f'} onClick={() => setGender('f')}>Au féminin</button>
                <button type="button" role="radio" aria-checked={gender === 'm'} onClick={() => setGender('m')}>Au masculin</button>
              </div>
            </div>
            <div className="field">
              <span className="label" id="length-label">Durée de la vie simulée</span>
              <div className="segmented" role="radiogroup" aria-labelledby="length-label">
                {(Object.keys(GAME_LENGTHS) as GameLength[]).map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={length === k} onClick={() => setLength(k)} title={GAME_LENGTHS[k].description}>
                    {GAME_LENGTHS[k].label}
                  </button>
                ))}
              </div>
              <small className="muted">{GAME_LENGTHS[length].description}</small>
            </div>
          </div>
        </section>

        <section aria-labelledby="profile-title" className="stack">
          <div className="row-between wrap">
            <h2 id="profile-title" style={{ fontSize: '1.3rem', margin: 0 }}>Ta situation de départ</h2>
            <button className="btn btn-sm" onClick={randomProfile}><Icon name="refresh" size={16} /> Destin au hasard</button>
          </div>
          <div className="profile-grid" role="radiogroup" aria-labelledby="profile-title">
            {PROFILES.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={p.id === profileId} className="profile-card" onClick={() => setProfileId(p.id)}>
                <span className="profile-emoji" aria-hidden>{p.emoji}</span>
                <span className="profile-name">{fillText(p.name, preview)}</span>
                <span className="profile-tag">{fillText(p.tagline, preview)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card stack pop" key={profileId + seed} aria-live="polite">
          <div className="row-between wrap">
            <div>
              <div className="eyebrow">Aperçu de ton personnage</div>
              <h2 style={{ margin: '0.2rem 0' }}>{profile.emoji} {trimmed || 'Ton personnage'}, 18 ans</h2>
            </div>
            <button className="btn btn-sm" onClick={() => setSeed(randomSeed())}><Icon name="refresh" size={16} /> Nouveau tirage</button>
          </div>
          <p className="event-text" style={{ marginBottom: 0 }}>{fillText(profile.description, preview)}</p>
          <div className="preview-stats">
            <div><div className="muted">Argent</div><strong className="gold">{eur(preview.cash + preview.savings)}</strong></div>
            <div><div className="muted">Patrimoine net</div><strong>{eur(netWorth(preview))}</strong></div>
            <div><div className="muted">Études</div><strong>{EDUCATION_LABELS[preview.education]}</strong></div>
            <div><div className="muted">Logement</div><strong>{HOUSING_BY_ID[preview.housingId].name}</strong></div>
            <div><div className="muted">Situation</div><strong>{preview.job ? jobTitle(preview.job.jobId, gender) : preview.training ? 'En formation' : 'Sans emploi'}</strong></div>
            <div><div className="muted">Points forts</div><strong>{topSkills.map(([k, v]) => `${SKILL_LABELS[k]} ${v}`).join(', ')}</strong></div>
          </div>
          <div className="grid grid-3">
            <StatBar label="Santé" value={preview.health} icon="heart" />
            <StatBar label="Énergie" value={preview.energy} icon="bolt" />
            <StatBar label="Satisfaction" value={preview.happiness} icon="smile" />
            <StatBar label="Famille" value={preview.relations.family} icon="home" />
            <StatBar label="Amitiés" value={preview.relations.friends} icon="people" />
            <StatBar label="Réseau pro" value={preview.relations.network} icon="career" />
          </div>
          <div className="grid grid-2">
            <div><div className="label pos">Atouts</div><ul className="prose" style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem' }}>{profile.perks.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div><div className="label neg">Difficultés</div><ul className="prose" style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem' }}>{profile.challenges.map((x) => <li key={x}>{x}</li>)}</ul></div>
          </div>
        </section>
      </div>

      <div className="sticky-cta">
        <div className="inner">
          <button className="btn btn-primary btn-lg btn-block" disabled={!trimmed} onClick={() => onStart({ name: trimmed, gender, profileId, seed, length })}>
            Commencer ma vie <Icon name="arrow" />
          </button>
        </div>
      </div>
    </div>
  );
}
