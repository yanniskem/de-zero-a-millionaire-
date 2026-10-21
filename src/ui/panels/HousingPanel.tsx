import { useState } from 'react';
import { HOUSINGS, HOUSING_BY_ID, MORTGAGE_RATE, PROPERTY_TYPES } from '../../engine/catalog';
import { buyProperty, mortgageQuote, moveHousing, movingCost, sellProperty } from '../../engine/actions';
import { liquidity } from '../../engine/economy';
import { ConfirmDialog } from '../components/common';
import { Icon } from '../components/Icon';
import { eur, pct } from '../format';
import { useGame } from '../GameContext';

export function HousingPanel() {
  const { game, run } = useGame();
  const current = HOUSING_BY_ID[game.housingId];
  const [typeId, setTypeId] = useState(PROPERTY_TYPES[0].id);
  const [asMain, setAsMain] = useState(!game.properties.some((p) => p.isMainHome));
  const [years, setYears] = useState<20 | 25>(25);
  const type = PROPERTY_TYPES.find((p) => p.id === typeId)!;
  const [deposit, setDeposit] = useState(Math.round(type.price * 0.1));
  const q = mortgageQuote(game, typeId, asMain, deposit, years);
  const [sellId, setSellId] = useState<string | null>(null);

  return (
    <div className="stack">
      <section className="card">
        <h3 className="card-title"><Icon name="home" /> Où je vis</h3>
        <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{current.name}</div>
        <p className="muted" style={{ margin: 0 }}>
          {current.description} {current.rent > 0 && `Loyer : ${eur(current.rent)} / mois${game.relations.partner?.cohabiting ? ' (partagé en couple)' : ''}.`}
        </p>
      </section>

      <section className="card">
        <div className="row-between wrap"><h3 className="card-title" style={{ margin: 0 }}><Icon name="arrow" /> Déménager</h3>{game.yearActions.moved && <span className="pill">Déjà déménagé cette année</span>}</div>
        <ul className="list">
          {HOUSINGS.filter((h) => !h.owned && h.id !== game.housingId).map((h) => {
            const cost = movingCost(game, h.id);
            return (
              <li key={h.id}>
                <div className="item-row">
                  <div className="item-main">
                    <div style={{ fontWeight: 700 }}>{h.name}</div>
                    <div className="muted" style={{ fontSize: '0.88rem' }}>
                      {h.rent ? `${eur(h.rent)} de loyer` : 'Sans loyer'} · charges {eur(h.utilities)} · transport {eur(h.transport)} · confort {h.comfort > 0 ? '+' : ''}{h.comfort}
                    </div>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>{h.description} Installation : {eur(cost)}.</div>
                  </div>
                  <button className="btn btn-sm" disabled={game.yearActions.moved || liquidity(game) < cost} onClick={() => run((s) => moveHousing(s, h.id))}>Emménager</button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card stack">
        <h3 className="card-title"><Icon name="flag" /> Acheter un bien immobilier</h3>
        <div className="grid grid-2">
          <div className="field">
            <label className="label" htmlFor="ptype">Bien</label>
            <select id="ptype" className="input" value={typeId} onChange={(e) => { const t = PROPERTY_TYPES.find((p) => p.id === e.target.value)!; setTypeId(t.id); setDeposit(Math.round(t.price * 0.1)); }}>
              {PROPERTY_TYPES.map((p) => <option key={p.id} value={p.id}>{p.label} — {eur(p.price)}</option>)}
            </select>
            <small className="muted">{type.description} Loyer de marché : {eur(type.rent)} / mois.</small>
          </div>
          <div className="field">
            <span className="label" id="usage">Usage</span>
            <div className="segmented" role="radiogroup" aria-labelledby="usage">
              <button role="radio" aria-checked={asMain} onClick={() => setAsMain(true)}>Y habiter</button>
              <button role="radio" aria-checked={!asMain} onClick={() => setAsMain(false)}>Le louer</button>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="deposit">Apport : {eur(deposit)}</label>
            <input id="deposit" type="range" min={Math.round(type.price * 0.1)} max={Math.max(Math.round(type.price * 0.1), Math.round(Math.min(liquidity(game), type.price * 1.08)))} step={500} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
            <small className="muted">Minimum 10 % du prix. Tes liquidités : {eur(liquidity(game))}.</small>
          </div>
          <div className="field">
            <span className="label" id="dur">Durée du crédit</span>
            <div className="segmented" role="radiogroup" aria-labelledby="dur">
              {([20, 25] as const).map((y) => <button key={y} role="radio" aria-checked={years === y} onClick={() => setYears(y)}>{y} ans</button>)}
            </div>
          </div>
        </div>
        <table className="lines">
          <tbody>
            <tr><td>Prix + frais de notaire (8 %)</td><td>{eur(q.price + q.fees)}</td></tr>
            <tr><td>Montant emprunté à {pct(MORTGAGE_RATE, 1)}</td><td>{eur(q.loan)}</td></tr>
            <tr><td>Mensualité</td><td>{eur(q.monthly)}</td></tr>
            <tr className="total"><td>Taux d’endettement (max 35 %)</td><td className={q.ratio > 0.35 ? 'neg' : 'pos'}>{isFinite(q.ratio) ? pct(q.ratio) : '—'}</td></tr>
          </tbody>
        </table>
        {q.problems.length > 0 ? <ul className="reqs">{q.problems.map((p) => <li key={p}>{p}</li>)}</ul> : <div className="ok-note">La banque est d’accord sur le principe.</div>}
        <button className="btn btn-primary" disabled={q.problems.length > 0} onClick={() => run((s) => buyProperty(s, typeId, asMain, deposit, years))}>Signer l’achat</button>
      </section>

      <section className="card">
        <h3 className="card-title"><Icon name="money" /> Mes biens</h3>
        {game.properties.length === 0 ? <p className="empty">Tu ne possèdes aucun bien immobilier.</p> : (
          <ul className="list">
            {game.properties.map((p) => {
              const loan = game.debts.filter((d) => d.propertyId === p.id).reduce((t, d) => t + d.principal, 0);
              return (
                <li key={p.id}>
                  <div className="item-row">
                    <div className="item-main">
                      <div style={{ fontWeight: 700 }}>{p.label} {p.isMainHome ? <span className="pill pill-gold">Résidence principale</span> : <span className="pill">En location · {eur(p.rent)} / mois</span>}</div>
                      <div className="muted" style={{ fontSize: '0.88rem' }}>Valeur estimée {eur(p.value)} · acheté {eur(p.purchasePrice)} à {p.boughtAge} ans · crédit restant {eur(loan)}</div>
                    </div>
                    <button className="btn btn-sm" onClick={() => setSellId(p.id)}>Vendre</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {sellId && (
        <ConfirmDialog
          title="Vendre ce bien ?"
          message="Les frais d’agence (5 %) sont déduits, le crédit restant est soldé et, pour un bien locatif, la plus-value est imposée à 25 %."
          confirmLabel="Vendre"
          onCancel={() => setSellId(null)}
          onConfirm={() => { const id = sellId; setSellId(null); run((s) => sellProperty(s, id)); }}
        />
      )}
    </div>
  );
}
