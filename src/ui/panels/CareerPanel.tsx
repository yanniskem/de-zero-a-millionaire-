import { useState } from 'react';
import { DIPLOMA_LABELS, EDUCATION_LABELS, JOBS, JOB_BY_ID, SECTORS, SKILL_LABELS, TRAININGS, jobTitle, type SectorId } from '../../engine/catalog';
import { applicationChance, jobRequirementsMissing, salaryCap, trainingRequirementsMissing } from '../../engine/career';
import { abandonTraining, applyForJob, askPromotion, quitJob, startTraining, toggleSideGig } from '../../engine/actions';
import { NET_RATIO } from '../../engine/economy';
import { RETIREMENT_AGE } from '../../engine/simulation';
import type { SkillId } from '../../engine/types';
import { ConfirmDialog, StatBar } from '../components/common';
import { Icon } from '../components/Icon';
import { eur, pct } from '../format';
import { useGame } from '../GameContext';

const MODE_LABEL = { full: 'Temps plein', part: 'Cours du soir', alternance: 'Alternance (payée)' } as const;

export function CareerPanel() {
  const { game, run } = useGame();
  const [sector, setSector] = useState<SectorId | 'eligible'>('eligible');
  const [confirmQuit, setConfirmQuit] = useState(false);
  const job = game.job ? JOB_BY_ID[game.job.jobId] : null;
  const appsLeft = Math.max(0, 2 - game.yearActions.applications);
  const retired = game.age >= RETIREMENT_AGE;

  const jobs = JOBS.filter((j) => j.id !== game.job?.jobId).filter((j) => (sector === 'eligible' ? jobRequirementsMissing(game, j.id).length === 0 : j.sector === sector));

  return (
    <div className="stack">
      <section className="card">
        <h3 className="card-title"><Icon name="career" /> Mon travail</h3>
        {game.job && job ? (
          <div className="stack" style={{ gap: '0.75rem' }}>
            <div className="row-between wrap">
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{jobTitle(job.id, game.gender)}</div>
                <div className="muted">{SECTORS[job.sector]} · {game.job.years} an(s) dans ce poste · {job.hours} h/semaine</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="gold" style={{ fontWeight: 700, fontSize: '1.2rem' }}>{eur(game.job.salary)} brut</div>
                <div className="muted">≈ {eur(game.job.salary * NET_RATIO)} net / mois · plafond du poste {eur(salaryCap(game, job.id))}</div>
              </div>
            </div>
            <StatBar label="Performance" value={game.job.performance} hint="Dépend de tes compétences, de ton énergie et de ta priorité. Elle influence augmentations, promotions et risque de licenciement." />
            <div className="row wrap" style={{ gap: '0.4rem' }}>
              <span className="pill">Stress {job.stress}/100</span>
              <span className="pill">Pénibilité {job.physical}/100</span>
              <span className="pill">Risque de licenciement {pct(job.risk)}/an</span>
              {job.variable ? <span className="pill pill-gold">Part variable ±{pct(job.variable)}</span> : null}
            </div>
            {job.next && (
              <div className="money-tile">
                <div className="label">Évolution possible</div>
                <div style={{ fontWeight: 700 }}>{jobTitle(job.next, game.gender)} — {eur(JOB_BY_ID[job.next].salary)} brut</div>
                {jobRequirementsMissing(game, job.next).length ? (
                  <ul className="reqs">{jobRequirementsMissing(game, job.next).map((r) => <li key={r}>{r}</li>)}</ul>
                ) : <div className="ok-note">Conditions remplies : demande une promotion !</div>}
              </div>
            )}
            <div className="btn-row">
              <button className="btn btn-primary" disabled={game.yearActions.promotionAsked} onClick={() => run(askPromotion)}>
                {job.next && !jobRequirementsMissing(game, job.next).length ? 'Demander une promotion' : 'Demander une augmentation'}
              </button>
              <button className="btn" disabled={game.yearActions.negotiated} onClick={() => run((s) => quitJob(s, 'rupture'))}>Négocier une rupture conventionnelle</button>
              <button className="btn btn-danger" onClick={() => setConfirmQuit(true)}>Démissionner</button>
            </div>
            {game.yearActions.promotionAsked && <small className="muted">Tu as déjà sollicité ta direction cette année.</small>}
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            {retired ? 'Tu es à la retraite.' : game.training ? 'Tu es en formation.' : game.business ? 'Tu te consacres à ton entreprise.' : 'Tu n’as pas d’emploi.'}
            {!game.job && game.unemploymentMonths > 0 && ` Il te reste ${game.unemploymentMonths} mois d’allocation chômage.`}
          </p>
        )}
        {!retired && (
          <div className="switch" style={{ borderBottom: 0, marginTop: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Petit boulot le week-end</div>
              <small className="muted">≈ 450 € net par mois, mais −12 d’énergie par an et moins de temps pour tes proches.</small>
            </div>
            <button className={`btn btn-sm ${game.sideGig ? 'btn-danger' : ''}`} onClick={() => run(toggleSideGig)}>{game.sideGig ? 'Arrêter' : 'Commencer'}</button>
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="card-title"><Icon name="spark" /> Compétences et diplômes</h3>
        <div className="grid grid-2" style={{ gap: '0.7rem 1.5rem' }}>
          {(Object.keys(SKILL_LABELS) as SkillId[]).map((k) => <StatBar key={k} label={SKILL_LABELS[k]} value={game.skills[k]} color="var(--violet)" />)}
        </div>
        <p style={{ marginTop: '0.9rem', marginBottom: 0 }}>
          <strong>Niveau d’études :</strong> {EDUCATION_LABELS[game.education]}
          {game.diplomas.length > 0 && <> · <strong>Diplômes :</strong> {game.diplomas.map((d) => DIPLOMA_LABELS[d] ?? d).join(', ')}</>}
        </p>
      </section>

      {!retired && (
        <section className="card">
          <div className="row-between wrap" style={{ marginBottom: '0.5rem' }}>
            <h3 className="card-title" style={{ margin: 0 }}><Icon name="arrow" /> Offres d’emploi</h3>
            <span className="pill">{appsLeft} candidature{appsLeft > 1 ? 's' : ''} possible{appsLeft > 1 ? 's' : ''} cette année</span>
          </div>
          <label className="label" htmlFor="sector">Filtrer</label>
          <select id="sector" className="input" value={sector} onChange={(e) => setSector(e.target.value as SectorId | 'eligible')} style={{ marginBottom: '0.5rem' }}>
            <option value="eligible">Postes accessibles maintenant</option>
            {(Object.keys(SECTORS) as SectorId[]).map((k) => <option key={k} value={k}>{SECTORS[k]}</option>)}
          </select>
          {jobs.length === 0 && <p className="empty">Aucun poste accessible pour l’instant. Forme-toi ou gagne de l’expérience, puis explore les secteurs.</p>}
          <ul className="list">
            {jobs.sort((a, b) => a.salary - b.salary).map((j) => {
              const missing = jobRequirementsMissing(game, j.id);
              const chance = applicationChance(game, j.id);
              return (
                <li key={j.id}>
                  <div className="item-row">
                    <div className="item-main">
                      <div style={{ fontWeight: 700 }}>{jobTitle(j.id, game.gender)}</div>
                      <div className="muted" style={{ fontSize: '0.88rem' }}>{SECTORS[j.sector]} · {eur(j.salary)} brut · {j.hours} h · stress {j.stress}</div>
                      {missing.length ? <ul className="reqs">{missing.map((r) => <li key={r}>{r}</li>)}</ul> : <div className="ok-note">Accessible · chances estimées : {pct(chance)}</div>}
                    </div>
                    <button className="btn btn-sm" disabled={missing.length > 0 || appsLeft === 0} onClick={() => run((s) => applyForJob(s, j.id))}>Postuler</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card">
        <h3 className="card-title"><Icon name="book" /> Formations</h3>
        {game.training ? (
          <div className="stack" style={{ gap: '0.5rem' }}>
            <div>
              En cours : <strong>{TRAININGS.find((t) => t.id === game.training!.trainingId)?.name}</strong> ({MODE_LABEL[game.training.mode]}) — année {game.training.yearsDone + 1} sur {TRAININGS.find((t) => t.id === game.training!.trainingId)?.years}
            </div>
            <small className="muted">Garde ton énergie au-dessus de 25 (ou choisis la priorité « Apprendre ») pour valider chaque année.</small>
            <div><button className="btn btn-danger btn-sm" onClick={() => run(abandonTraining)}>Abandonner la formation</button></div>
          </div>
        ) : (
          <ul className="list">
            {TRAININGS.filter((t) => !game.diplomas.includes(t.diploma)).map((t) => (
              <li key={t.id}>
                <div className="item-main">
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                  <div className="muted" style={{ fontSize: '0.88rem' }}>{t.years} an{t.years > 1 ? 's' : ''} · {t.cost ? eur(t.cost) : 'gratuite'} · {t.description}</div>
                  <div className="btn-row" style={{ marginTop: '0.5rem' }}>
                    {t.modes.map((m) => {
                      const missing = trainingRequirementsMissing(game, t.id, m);
                      const cost = m === 'alternance' ? 0 : t.cost;
                      const affordable = game.cash + game.savings >= cost;
                      return (
                        <span key={m} className="row wrap" style={{ gap: '0.35rem' }}>
                          <button className="btn btn-sm" disabled={missing.length > 0} title={missing.join(' ; ')} onClick={() => run((s) => startTraining(s, t.id, m, affordable ? 'cash' : 'loan'))}>
                            {MODE_LABEL[m]}{cost > 0 && !affordable ? ' (avec prêt)' : ''}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  {t.modes.every((m) => trainingRequirementsMissing(game, t.id, m).length > 0) && (
                    <ul className="reqs">{[...new Set(t.modes.flatMap((m) => trainingRequirementsMissing(game, t.id, m)))].map((r) => <li key={r}>{r}</li>)}</ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirmQuit && (
        <ConfirmDialog
          title="Démissionner ?"
          message="Une démission ne donne pas droit aux allocations chômage. Tu perds immédiatement ton salaire."
          confirmLabel="Je démissionne"
          danger
          onCancel={() => setConfirmQuit(false)}
          onConfirm={() => {
            setConfirmQuit(false);
            run((s) => quitJob(s, 'demission'));
          }}
        />
      )}
    </div>
  );
}
