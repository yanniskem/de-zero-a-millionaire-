import { careerPathLabels } from '../../engine/summary';
import { LineChart } from '../components/common';
import { Icon } from '../components/Icon';
import { compactEur } from '../format';
import { useGame } from '../GameContext';

export function HistoryPanel() {
  const { game } = useGame();
  const h = game.history;
  const path = careerPathLabels(game);
  return (
    <div className="stack">
      <section className="card">
        <h3 className="card-title"><Icon name="chart" /> Patrimoine net</h3>
        <LineChart title="Évolution du patrimoine net" format={compactEur} series={[{ label: 'Patrimoine net', color: '#f3d08c', values: h.map((x) => ({ x: x.age, y: x.netWorth })) }]} />
      </section>
      <div className="grid grid-2">
        <section className="card">
          <h3 className="card-title"><Icon name="money" /> Revenus et dépenses annuels</h3>
          <LineChart title="Revenus et dépenses" format={compactEur} series={[
            { label: 'Revenus', color: '#63d49e', values: h.slice(1).map((x) => ({ x: x.age, y: x.income })) },
            { label: 'Dépenses', color: '#ff8a80', values: h.slice(1).map((x) => ({ x: x.age, y: x.expenses })) },
          ]} />
        </section>
        <section className="card">
          <h3 className="card-title"><Icon name="spark" /> Compétences, carrière et satisfaction</h3>
          <LineChart title="Compétences et satisfaction" format={(n) => String(Math.round(n))} series={[
            { label: 'Compétences (moyenne)', color: '#b9a2ff', values: h.map((x) => ({ x: x.age, y: x.skillAvg })) },
            { label: 'Niveau de carrière ×20', color: '#86b6ff', values: h.map((x) => ({ x: x.age, y: x.careerLevel * 20 })) },
            { label: 'Satisfaction', color: '#e4b864', values: h.map((x) => ({ x: x.age, y: x.happiness })) },
          ]} />
        </section>
      </div>

      <section className="card">
        <h3 className="card-title"><Icon name="career" /> Parcours professionnel</h3>
        {path.length ? <p style={{ margin: 0 }}>{path.join(' → ')}</p> : <p className="muted" style={{ margin: 0 }}>Pas encore d’emploi.</p>}
      </section>

      <div className="grid grid-2">
        <section className="card">
          <h3 className="card-title"><Icon name="trophy" /> Moments marquants</h3>
          {game.highlights.length === 0 ? <p className="empty">Rien encore… ça viendra.</p> : (
            <ul className="feed">
              {[...game.highlights].reverse().map((x, i) => (
                <li key={i}><span className="feed-age">{x.age} ans</span><span className={x.kind === 'success' ? 'pos' : x.kind === 'mistake' ? 'neg' : ''}>{x.text}</span></li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h3 className="card-title"><Icon name="flag" /> Mes décisions</h3>
          {game.decisions.length === 0 ? <p className="empty">Aucune décision pour l’instant.</p> : (
            <ul className="feed">
              {[...game.decisions].reverse().slice(0, 40).map((d, i) => (
                <li key={i}><span className="feed-age">{d.age} ans</span><div><div className="feed-title">{d.title}</div><div className="feed-text">{d.choice}</div></div></li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <details className="card">
        <summary>Journal complet ({game.log.length} entrées)</summary>
        <ul className="feed">
          {[...game.log].reverse().map((l, i) => (
            <li key={i}><span className="feed-age">{l.age} ans</span><div><div className="feed-title">{l.title}</div><div className="feed-text">{l.text}</div></div></li>
          ))}
        </ul>
      </details>
    </div>
  );
}
