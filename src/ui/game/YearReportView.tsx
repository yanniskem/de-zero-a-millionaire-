import type { YearReport } from '../../engine/types';
import { Deltas, Modal } from '../components/common';
import { Icon } from '../components/Icon';
import { eur, eurSigned } from '../format';

export function YearReportView({ report, onClose, detailed }: { report: YearReport; onClose: () => void; detailed: boolean }) {
  const diff = report.netWorthAfter - report.netWorthBefore;
  const net = report.incomeTotal - report.expenseTotal;
  return (
    <Modal title={`Bilan de tes ${report.ageFrom} ans`} onClose={onClose} wide>
      <div className="report-hero">
        <div>
          <div className="muted">Patrimoine net</div>
          <div className="big-number num">{eur(report.netWorthAfter)}</div>
        </div>
        <span className={`pill ${diff >= 0 ? 'pill-green' : 'pill-red'}`} style={{ fontSize: '1rem' }}>{eurSigned(diff)} sur l’année</span>
      </div>

      {report.notes.length > 0 && (
        <section style={{ marginBottom: '1rem' }}>
          <h3 className="card-title"><Icon name="spark" /> Ce qui s’est passé</h3>
          <ul className="notes">{report.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </section>
      )}

      <div className="grid grid-2">
        <section>
          <h3 className="card-title"><Icon name="money" /> Revenus de l’année</h3>
          <table className="lines">
            <tbody>
              {report.incomeLines.length === 0 && <tr><td className="muted">Aucun revenu</td><td>0 €</td></tr>}
              {report.incomeLines.map((l) => (
                <tr key={l.label}><td>{l.label}{detailed && l.detail && <span className="detail">{l.detail}</span>}</td><td className="pos">{eur(l.amount)}</td></tr>
              ))}
              <tr className="total"><td>Total</td><td>{eur(report.incomeTotal)}</td></tr>
            </tbody>
          </table>
        </section>
        <section>
          <h3 className="card-title"><Icon name="career" /> Dépenses de l’année</h3>
          <table className="lines">
            <tbody>
              {report.expenseLines.map((l) => (
                <tr key={l.label}><td>{l.label}{detailed && l.detail && <span className="detail">{l.detail}</span>}</td><td className="neg">{eur(l.amount)}</td></tr>
              ))}
              <tr className="total"><td>Total</td><td>{eur(report.expenseTotal)}</td></tr>
            </tbody>
          </table>
        </section>
      </div>

      <table className="lines" style={{ marginTop: '0.75rem' }}>
        <tbody>
          <tr className="total"><td>Solde de l’année (revenus − dépenses)</td><td className={net >= 0 ? 'pos' : 'neg'}>{eurSigned(net)}</td></tr>
        </tbody>
      </table>

      {(report.investLines.length > 0 || report.businessLine) && (
        <section style={{ marginTop: '1rem' }}>
          <h3 className="card-title"><Icon name="chart" /> Placements, biens et entreprise</h3>
          <table className="lines">
            <tbody>
              {report.investLines.map((l) => (
                <tr key={l.label}><td>{l.label}{l.detail && <span className="detail">{l.detail}</span>}</td><td className={l.amount >= 0 ? 'pos' : 'neg'}>{eurSigned(l.amount)}</td></tr>
              ))}
              {report.businessLine && (
                <>
                  <tr><td>Chiffre d’affaires de l’entreprise</td><td>{eur(report.businessLine.revenue)}</td></tr>
                  <tr><td>Charges de l’entreprise (dont ta rémunération)</td><td>{eur(report.businessLine.costs)}</td></tr>
                  <tr><td>Résultat de l’entreprise</td><td className={report.businessLine.profit >= 0 ? 'pos' : 'neg'}>{eurSigned(report.businessLine.profit)}</td></tr>
                  <tr><td>Trésorerie en fin d’année</td><td>{eur(report.businessLine.treasury)}</td></tr>
                </>
              )}
            </tbody>
          </table>
        </section>
      )}

      {report.statChanges.length > 0 && (
        <section style={{ marginTop: '1rem' }}>
          <h3 className="card-title"><Icon name="heart" /> Évolution personnelle</h3>
          <Deltas deltas={report.statChanges} />
          <p className="muted" style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>
            La santé, l’énergie, la satisfaction et les relations évoluent selon ton travail, ta priorité de l’année, ton train de vie, ton logement et tes finances.
          </p>
        </section>
      )}

      <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: '1rem' }} onClick={onClose} data-autofocus>
        Découvrir mes {report.ageTo} ans <Icon name="arrow" />
      </button>
    </Modal>
  );
}
