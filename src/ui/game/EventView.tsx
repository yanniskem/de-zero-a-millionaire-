import { CATEGORY_LABELS } from '../../engine/eventTypes';
import { choiceViews, eventText, fillText, getEvent } from '../../engine/events';
import { chooseOption, continueAfterOutcome } from '../../engine/simulation';
import { Deltas, Modal } from '../components/common';
import { Icon } from '../components/Icon';
import { eur } from '../format';
import { useGame } from '../GameContext';

/** Carte d'événement : récit, choix, puis conséquences. */
export function EventView() {
  const { game, run } = useGame();
  const current = game.eventQueue[0];
  if (!current) return null;
  const ev = getEvent(current.eventId);
  if (!ev) {
    // Événement inconnu (sauvegarde ancienne) : on le passe sans bloquer la partie.
    return (
      <Modal title="Événement indisponible">
        <p>Cet événement n’existe plus dans cette version du jeu.</p>
        <button className="btn btn-primary" onClick={() => run(() => chooseOption(game, '__pass'), { silent: true })}>Continuer</button>
      </Modal>
    );
  }
  const remaining = game.eventQueue.length - 1;
  const titleId = `ev-${ev.id}`;

  if (current.outcome) {
    return (
      <Modal labelledBy={titleId}>
        <div className="event-head">
          <span className="pill pill-gold">{CATEGORY_LABELS[ev.category]}</span>
          <span className="muted num">{game.age} ans</span>
        </div>
        <h2 id={titleId} className="event-title">{fillText(ev.title, game)}</h2>
        <div className="outcome pop">
          <div className="outcome-choice">Ton choix : {current.outcome.choiceLabel}</div>
          <p className="event-text" style={{ marginTop: '0.4rem' }}>{current.outcome.text}</p>
          <Deltas deltas={current.outcome.deltas} />
        </div>
        <button className="btn btn-primary btn-block btn-lg" data-autofocus onClick={() => run((s) => ({ state: continueAfterOutcome(s), ok: true }), { silent: true })}>
          {remaining > 0 ? `Événement suivant (${remaining})` : 'Continuer mon année'} <Icon name="arrow" />
        </button>
      </Modal>
    );
  }

  const views = choiceViews(game, ev);
  return (
    <Modal labelledBy={titleId}>
      <div className="event-head">
        <span className="pill pill-gold">{CATEGORY_LABELS[ev.category]}</span>
        <span className="muted num">{game.age} ans{remaining > 0 ? ` · encore ${remaining} événement${remaining > 1 ? 's' : ''}` : ''}</span>
      </div>
      <h2 id={titleId} className="event-title">{fillText(ev.title, game)}</h2>
      <p className="event-text">{eventText(ev, game)}</p>
      <div className="choices" role="group" aria-label="Choix possibles">
        {views.map(({ choice, available, reason }) => (
          <button
            key={choice.id}
            className="choice"
            aria-disabled={!available}
            onClick={() => {
              if (!available) return;
              run((s) => chooseOption(s, choice.id), { silent: true });
            }}
          >
            {choice.cost ? <span className="choice-cost">{eur(choice.cost)}</span> : null}
            <span className="choice-label">{fillText(choice.label, game)}</span>
            {choice.hint && <span className="choice-hint">{fillText(choice.hint, game)}</span>}
            {!available && reason && (
              <span className="choice-reason"><Icon name="lock" size={14} /> {fillText(reason, game)}</span>
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}
