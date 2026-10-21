import { useState } from 'react';
import { SAVINGS_RATE, STOCK_RETURN } from '../../engine/catalog';
import {
  buyInvestment,
  depositSavings,
  personalLoanProblems,
  repayDebt,
  sellInvestment,
  setAutoSave,
  setFamilyContribution,
  takePersonalLoan,
  withdrawSavings,
} from '../../engine/actions';
import { balanceSheet, loanPayment, monthlyBudget } from '../../engine/economy';
import { AmountForm, MoneyTile } from '../components/common';
import { Icon } from '../components/Icon';
import { eur, eurSigned, pct } from '../format';
import { useGame } from '../GameContext';

const DEBT_KIND = { conso: 'Crédit conso', etudiant: 'Prêt étudiant', immo: 'Immobilier', pro: 'Professionnel', decouvert: 'Découvert', famille: 'Familial' } as const;

export function MoneyPanel() {
  const { game, run } = useGame();
  const b = balanceSheet(game);
  const budget = monthlyBudget(game);
  const [loanAmount, setLoanAmount] = useState(5000);
  const [loanYears, setLoanYears] = useState(4);
  const loanProblems = personalLoanProblems(game, loanAmount, loanYears);

  return (
    <div className="stack">
      <section className="card">
        <h3 className="card-title"><Icon name="chart" /> Mon patrimoine</h3>
        <div className="tiles">
          <MoneyTile label="Argent disponible" value={eur(b.cash)} />
          <MoneyTile label="Épargne (livret)" value={eur(b.savings)} sub={`${pct(SAVINGS_RATE, 1)} par an, sans risque`} />
          <MoneyTile label="Fonds indiciels" value={eur(b.stocks)} sub={game.stocks ? `+/− ${eurSigned(game.stocks - game.stocksBasis)} latents` : 'Actions mondiales'} />
          <MoneyTile label="Cryptomonnaies" value={eur(b.crypto)} sub="Très volatil" />
          <MoneyTile label="Immobilier" value={eur(b.realEstate)} />
          <MoneyTile label="Entreprise" value={eur(b.business)} sub="Valeur estimée de tes parts" />
          <MoneyTile label="Dettes" value={eur(b.debts)} tone={b.debts ? 'neg' : undefined} />
          <MoneyTile label="Patrimoine net" value={eur(b.netWorth)} tone={b.netWorth >= 0 ? 'gold' : 'neg'} sub="Actifs − dettes" />
        </div>
        <p className="muted" style={{ fontSize: '0.82rem', margin: '0.75rem 0 0' }}>
          Tous les montants sont en euros constants (hors inflation). Les rendements affichés sont donc des rendements réels.
        </p>
      </section>

      <section className="card">
        <h3 className="card-title"><Icon name="money" /> Budget mensuel actuel</h3>
        <div className="grid grid-2">
          <table className="lines">
            <tbody>
              {budget.incomes.length === 0 && <tr><td className="muted">Aucun revenu</td><td>0 €</td></tr>}
              {budget.incomes.map((l) => <tr key={l.label}><td>{l.label}{l.detail && <span className="detail">{l.detail}</span>}</td><td className="pos">{eur(l.amount)}</td></tr>)}
              <tr className="total"><td>Revenus</td><td>{eur(budget.totalIncome)}</td></tr>
            </tbody>
          </table>
          <table className="lines">
            <tbody>
              {budget.expenses.map((l) => <tr key={l.label}><td>{l.label}{l.detail && <span className="detail">{l.detail}</span>}</td><td className="neg">{eur(l.amount)}</td></tr>)}
              {budget.tax > 0 && <tr><td>Impôt sur le revenu<span className="detail">Barème progressif simplifié</span></td><td className="neg">{eur(budget.tax)}</td></tr>}
              {budget.debtPayments > 0 && <tr><td>Remboursements de crédits</td><td className="neg">{eur(budget.debtPayments)}</td></tr>}
              <tr className="total"><td>Dépenses</td><td>{eur(budget.totalExpenses)}</td></tr>
            </tbody>
          </table>
        </div>
        <table className="lines" style={{ marginTop: '0.5rem' }}>
          <tbody><tr className="total"><td>Solde mensuel</td><td className={budget.net >= 0 ? 'pos' : 'neg'}>{eurSigned(budget.net)}</td></tr></tbody>
        </table>
      </section>

      <div className="grid grid-2">
        <section className="card stack">
          <h3 className="card-title"><Icon name="lock" /> Épargne de précaution</h3>
          <AmountForm max={game.cash} label="Placer sur le livret" action="Placer" onSubmit={(n) => run((s) => depositSavings(s, n))} />
          <AmountForm max={game.savings} label="Retirer du livret" action="Retirer" onSubmit={(n) => run((s) => withdrawSavings(s, n))} />
          <div className="field">
            <label className="label" htmlFor="autosave">Virement automatique mensuel</label>
            <select id="autosave" className="input" value={game.autoSave} onChange={(e) => run((s) => setAutoSave(s, Number(e.target.value)))}>
              {[0, 50, 100, 200, 300, 500, 800, 1000, 1500, 2000, 3000].map((v) => <option key={v} value={v}>{v ? `${eur(v)} par mois` : 'Aucun'}</option>)}
            </select>
            <small className="muted">Effectué chaque mois si ton compte garde au moins 200 € après le virement.</small>
          </div>
        </section>

        <section className="card stack">
          <h3 className="card-title"><Icon name="chart" /> Investir</h3>
          <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
            Fonds indiciels : environ {pct(STOCK_RETURN.mean, 1)} par an en moyenne, avec des années très négatives. Cryptomonnaies : pari spéculatif, gains ou pertes extrêmes. Impôt de 30 % sur les plus-values à la vente.
          </p>
          <AmountForm max={game.cash} label="Acheter des fonds indiciels" action="Acheter" onSubmit={(n) => run((s) => buyInvestment(s, 'stocks', n))} />
          {game.stocks > 0 && <AmountForm max={game.stocks} label="Vendre des fonds indiciels" action="Vendre" onSubmit={(n) => run((s) => sellInvestment(s, 'stocks', n))} />}
          <AmountForm max={game.cash} label="Acheter des cryptomonnaies" action="Acheter" onSubmit={(n) => run((s) => buyInvestment(s, 'crypto', n))} />
          {game.crypto > 0 && <AmountForm max={game.crypto} label="Vendre des cryptomonnaies" action="Vendre" onSubmit={(n) => run((s) => sellInvestment(s, 'crypto', n))} />}
        </section>
      </div>

      <section className="card stack">
        <h3 className="card-title"><Icon name="alert" /> Dettes et crédits</h3>
        {game.flags.planSurendettement && <p className="banner">Plan de surendettement en cours : train de vie frugal imposé et aucun nouveau crédit possible jusqu’au remboursement.</p>}
        {game.debts.length === 0 ? <p className="empty">Aucune dette. Bravo !</p> : (
          <ul className="list">
            {game.debts.map((d) => (
              <li key={d.id}>
                <div className="item-row">
                  <div className="item-main">
                    <div style={{ fontWeight: 700 }}>{d.label}</div>
                    <div className="muted" style={{ fontSize: '0.88rem' }}>{DEBT_KIND[d.kind]} · taux {pct(d.rate, 1)} · {eur(d.monthlyPayment)} / mois · reste {eur(d.principal)}</div>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <AmountForm max={Math.min(game.cash, d.principal)} label="Remboursement anticipé" action="Rembourser" onSubmit={(n) => run((s) => repayDebt(s, d.id, n))} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <details className="card" style={{ boxShadow: 'none' }}>
          <summary>Demander un prêt personnel (6,5 %)</summary>
          <div className="grid grid-2">
            <div className="field">
              <label className="label" htmlFor="loan-amount">Montant</label>
              <select id="loan-amount" className="input" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}>
                {[1000, 2000, 5000, 8000, 10000, 15000, 20000, 30000].map((v) => <option key={v} value={v}>{eur(v)}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="loan-years">Durée</label>
              <select id="loan-years" className="input" value={loanYears} onChange={(e) => setLoanYears(Number(e.target.value))}>
                {[2, 3, 4, 5, 7].map((v) => <option key={v} value={v}>{v} ans</option>)}
              </select>
            </div>
          </div>
          <p style={{ margin: '0.6rem 0' }}>Mensualité : <strong>{eur(loanPayment(loanAmount, 0.065, loanYears))}</strong> · coût total des intérêts : {eur(loanPayment(loanAmount, 0.065, loanYears) * loanYears * 12 - loanAmount)}</p>
          {loanProblems.length > 0 && <ul className="reqs">{loanProblems.map((p) => <li key={p}>{p}</li>)}</ul>}
          <button className="btn" disabled={loanProblems.length > 0} onClick={() => run((s) => takePersonalLoan(s, loanAmount, loanYears))}>Demander le prêt</button>
        </details>
      </section>

      <section className="card">
        <h3 className="card-title"><Icon name="home" /> Aide à ma famille</h3>
        <div className="field">
          <label className="label" htmlFor="family">Montant versé chaque mois</label>
          <select id="family" className="input" value={game.familyContribution} onChange={(e) => run((s) => setFamilyContribution(s, Number(e.target.value)))}>
            {[...new Set([0, 100, 150, 250, 400, 600, game.familyContribution])].sort((a, b) => a - b).map((v) => <option key={v} value={v}>{v ? `${eur(v)} par mois` : 'Aucune aide'}</option>)}
          </select>
          <small className="muted">Aider tes proches renforce vos liens chaque année.</small>
        </div>
      </section>
    </div>
  );
}
