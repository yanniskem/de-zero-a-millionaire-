import { HOUSING_BY_ID, LIFESTYLES, PRIORITIES } from '../../engine/catalog';
import { currentJobTitle } from '../../engine/career';
import { balanceSheet, effectiveLifestyle, monthlyBudget } from '../../engine/economy';
import { setLifestyle, setPriority } from '../../engine/actions';
import type { Lifestyle, Priority } from '../../engine/types';
import { MoneyTile, StatBar } from '../components/common';
import { Icon } from '../components/Icon';
import { eur, eurSigned } from '../format';
import { useGame } from '../GameContext';

export function LifePanel() {
  const { game, run } = useGame();
  const b = balanceSheet(game);
  const budget = monthlyBudget(game);
  const recent = [...game.log].reverse().filter((l) => l.kind !== 'year').slice(0, 8);
  const pending = game.pending.length;
  const p = game.relations.partner;
  const lifestyle = effectiveLifestyle(game);

  return (
    <div className="stack">
      <section className="card">
        <div className="row-between wrap" style={{ marginBottom: '0.75rem' }}>
          <div>
            <div className="eyebrow">Ma situation</div>
            <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.35rem' }}>{currentJobTitle(game)}</h2>
            <div className="muted">{HOUSING_BY_ID[game.housingId]?.name} · {p ? `En couple avec ${p.name}` : 'Célibataire'}{game.relations.childrenBirthAges.length ? ` · ${game.relations.childrenBirthAges.length} enfant(s)` : ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="muted">Patrimoine net</div>
            <div className={`big-number num ${b.netWorth < 0 ? 'neg' : 'gold'}`}>{eur(b.netWorth)}</div>
          </div>
        </div>
        <div className="tiles">
          <MoneyTile label="Argent disponible" value={eur(game.cash)} />
          <MoneyTile label="Revenus / mois" value={eur(budget.totalIncome)} tone="pos" />
          <MoneyTile label="Dépenses / mois" value={eur(budget.totalExpenses)} sub="impôts et crédits inclus" />
          <MoneyTile label="Solde mensuel" value={eurSigned(budget.net)} tone={budget.net >= 0 ? 'pos' : 'neg'} />
          <MoneyTile label="Épargne" value={eur(game.savings)} />
          <MoneyTile label="Dettes" value={eur(b.debts)} tone={b.debts > 0 ? 'neg' : undefined} />
        </div>
        {budget.net < 0 && (
          <p className="banner" style={{ marginTop: '0.75rem' }}>
            <Icon name="alert" size={16} /> Tes dépenses dépassent tes revenus de {eur(-budget.net)} par mois. Sans changement, ton épargne puis un découvert à 16 % combleront la différence.
          </p>
        )}
      </section>

      <div className="grid grid-2">
        <section className="card stack" style={{ gap: '0.8rem' }}>
          <h3 className="card-title"><Icon name="heart" /> Corps et esprit</h3>
          <StatBar label="Santé" value={game.health} icon="heart" hint="Baisse avec le stress et la pénibilité, remonte avec le sport et le repos." />
          <StatBar label="Énergie" value={game.energy} icon="bolt" hint="Ta capacité à tout mener de front. Sous 25, études et santé en pâtissent." />
          <StatBar label="Satisfaction" value={game.happiness} icon="smile" hint="Dépend des relations, de la santé, du travail, de la sécurité financière et du confort." />
          <h3 className="card-title" style={{ marginTop: '0.5rem' }}><Icon name="people" /> Liens</h3>
          <StatBar label="Famille" value={game.relations.family} />
          <StatBar label="Amitiés" value={game.relations.friends} />
          {p && <StatBar label={`Couple (${p.name})`} value={p.strength} />}
          <StatBar label="Réseau professionnel" value={game.relations.network} color="var(--blue)" />
        </section>

        <section className="card stack" style={{ gap: '0.9rem' }}>
          <h3 className="card-title"><Icon name="flag" /> Mes choix pour cette année</h3>
          <div className="field">
            <span className="label" id="prio-label">Priorité de l’année</span>
            <div className="segmented" role="radiogroup" aria-labelledby="prio-label">
              {(Object.keys(PRIORITIES) as Priority[]).map((k) => (
                <button key={k} role="radio" aria-checked={game.priority === k} onClick={() => run((s) => setPriority(s, k), { silent: true })}>
                  {PRIORITIES[k].label}
                </button>
              ))}
            </div>
            <small className="muted">{PRIORITIES[game.priority].description}</small>
          </div>
          <div className="field">
            <span className="label" id="life-label">Train de vie</span>
            <div className="segmented" role="radiogroup" aria-labelledby="life-label">
              {(Object.keys(LIFESTYLES) as Lifestyle[]).map((k) => (
                <button key={k} role="radio" aria-checked={lifestyle === k} onClick={() => run((s) => setLifestyle(s, k))}>
                  {LIFESTYLES[k].label}
                </button>
              ))}
            </div>
            <small className="muted">{LIFESTYLES[lifestyle].description}</small>
          </div>
          {pending > 0 && (
            <p className="banner info" style={{ margin: 0 }}>
              <Icon name="clock" size={16} /> {pending} conséquence{pending > 1 ? 's' : ''} de tes choix passés {pending > 1 ? 'vont' : 'va'} se manifester dans les années à venir.
            </p>
          )}
        </section>
      </div>

      <section className="card">
        <h3 className="card-title"><Icon name="book" /> Mon journal</h3>
        {recent.length === 0 ? <p className="empty">Ton histoire commence.</p> : (
          <ul className="feed">
            {recent.map((l, i) => (
              <li key={i}>
                <span className="feed-age">{l.age} ans</span>
                <div>
                  <div className="feed-title">{l.title}</div>
                  <div className="feed-text">{l.text}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
