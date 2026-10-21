import { useState } from 'react';
import { breakUp, formalizeUnion, moveInTogether, seeFriends, seekLove, tryForChild, visitFamily } from '../../engine/actions';
import { ConfirmDialog, StatBar } from '../components/common';
import { Icon } from '../components/Icon';
import { useGame } from '../GameContext';

export function RelationsPanel() {
  const { game, run } = useGame();
  const p = game.relations.partner;
  const ya = game.yearActions;
  const [confirm, setConfirm] = useState(false);
  const kids = game.relations.childrenBirthAges.map((b) => game.age - b);

  return (
    <div className="stack">
      <section className="card stack">
        <h3 className="card-title"><Icon name="heart" /> Vie amoureuse</h3>
        {p ? (
          <>
            <div className="row-between wrap">
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{p.name}</div>
                <div className="muted">Ensemble depuis {p.years} an{p.years > 1 ? 's' : ''} · {p.married ? 'Unis officiellement' : p.cohabiting ? 'Vous vivez ensemble' : 'Chacun chez soi'}</div>
              </div>
            </div>
            <StatBar label="Solidité du couple" value={p.strength} hint="Monte avec la priorité « Mes proches », baisse avec le surmenage, la fatigue et les dettes." />
            <div className="btn-row">
              {!p.cohabiting && <button className="btn" onClick={() => run(moveInTogether)}>Emménager ensemble</button>}
              {p.cohabiting && !p.married && (
                <>
                  <button className="btn" onClick={() => run((s) => formalizeUnion(s, 'pacs'))}>Se pacser (300 €)</button>
                  <button className="btn" onClick={() => run((s) => formalizeUnion(s, 'mariage'))}>Se marier (9 000 €)</button>
                </>
              )}
              <button className="btn" disabled={ya.childAttempt} onClick={() => run(tryForChild)}>Avoir un enfant</button>
              <button className="btn btn-danger" onClick={() => setConfirm(true)}>Rompre</button>
            </div>
          </>
        ) : (
          <>
            <p className="muted" style={{ margin: 0 }}>Tu es célibataire{game.relations.exPartners ? ` (${game.relations.exPartners} histoire${game.relations.exPartners > 1 ? 's' : ''} passée${game.relations.exPartners > 1 ? 's' : ''})` : ''}.</p>
            <div><button className="btn btn-primary" disabled={ya.dating} onClick={() => run(seekLove)}>Faire des rencontres</button></div>
            <small className="muted">Tes chances dépendent de ton relationnel, de tes amitiés et de ton moral. Une tentative par an.</small>
          </>
        )}
      </section>

      <div className="grid grid-2">
        <section className="card stack">
          <h3 className="card-title"><Icon name="home" /> Famille</h3>
          <StatBar label="Liens familiaux" value={game.relations.family} />
          {kids.length > 0 && <p style={{ margin: 0 }}>Enfants : {kids.map((a) => `${a} an${a > 1 ? 's' : ''}`).join(', ')}</p>}
          <div><button className="btn" disabled={ya.familyAction} onClick={() => run(visitFamily)}>Passer un week-end en famille (150 €)</button></div>
        </section>
        <section className="card stack">
          <h3 className="card-title"><Icon name="people" /> Amis et réseau</h3>
          <StatBar label="Amitiés" value={game.relations.friends} />
          <StatBar label="Réseau professionnel" value={game.relations.network} color="var(--blue)" hint="Augmente tes chances d’embauche et certaines opportunités." />
          <div><button className="btn" disabled={ya.friendsAction} onClick={() => run(seeFriends)}>Organiser une soirée (120 €)</button></div>
        </section>
      </div>
      <p className="muted" style={{ fontSize: '0.85rem' }}>
        Les relations influencent ta satisfaction, ouvrent ou ferment certains événements (associations, aides familiales, opportunités) et pèsent sur ta fin de vie.
      </p>
      {confirm && p && (
        <ConfirmDialog title={`Rompre avec ${p.name} ?`} message={p.married ? 'Un divorce a un coût financier et émotionnel important.' : 'Cette décision est difficile à défaire.'} confirmLabel="Rompre" danger
          onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); run(breakUp); }} />
      )}
    </div>
  );
}
