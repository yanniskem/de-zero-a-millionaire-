import { useState } from 'react';
import { BUSINESS_SECTORS, SECTOR_BY_ID } from '../../engine/catalog';
import { businessRequirementsMissing, expansionCost, expansionReputation, maturity } from '../../engine/business';
import { closeBusiness, expandBusiness, injectBusiness, sellBusiness, setFounderPay, startBusiness, withdrawDividends } from '../../engine/actions';
import { businessValuation } from '../../engine/economy';
import { AmountForm, ConfirmDialog, MoneyTile, StatBar } from '../components/common';
import { Icon } from '../components/Icon';
import { eur, eurSigned } from '../format';
import { useGame } from '../GameContext';

export function BusinessPanel() {
  const { game, run } = useGame();
  const b = game.business;
  const [sectorId, setSectorId] = useState(BUSINESS_SECTORS[0].id);
  const [name, setName] = useState('');
  const [capital, setCapital] = useState(0);
  const [loan, setLoan] = useState(0);
  const [confirm, setConfirm] = useState<null | 'sell' | 'close'>(null);

  if (!b) {
    const sector = SECTOR_BY_ID[sectorId];
    const missing = businessRequirementsMissing(game, sectorId, capital + loan);
    return (
      <div className="stack">
        <section className="card">
          <h3 className="card-title"><Icon name="rocket" /> Créer mon entreprise</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Une entreprise peut réussir, stagner ou échouer. Son résultat dépend du capital, de tes compétences, de sa réputation, de la demande (qui varie chaque année) et de ta présence : si tu gardes un emploi, elle tourne au ralenti.
            {game.counters.businessesCreated > 0 && ` Tu as déjà créé ${game.counters.businessesCreated} entreprise(s).`}
          </p>
          <ul className="list">
            {BUSINESS_SECTORS.map((s) => {
              const miss = businessRequirementsMissing(game, s.id, s.minCapital);
              return (
                <li key={s.id}>
                  <div className="item-row">
                    <div className="item-main">
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <div className="muted" style={{ fontSize: '0.88rem' }}>{s.description} Capital minimum : {eur(s.minCapital)}.</div>
                      {miss.filter((m) => !m.startsWith('Capital')).length > 0 && <ul className="reqs">{miss.filter((m) => !m.startsWith('Capital')).map((m) => <li key={m}>{m}</li>)}</ul>}
                    </div>
                    <button className="btn btn-sm" aria-pressed={sectorId === s.id} onClick={() => { setSectorId(s.id); setCapital(Math.min(Math.floor(game.cash), s.minCapital)); setLoan(0); }}>
                      {sectorId === s.id ? 'Sélectionné' : 'Choisir'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="card stack">
          <h3 className="card-title"><Icon name="flag" /> {sector.name}</h3>
          <div className="field">
            <label className="label" htmlFor="bname">Nom de l’entreprise</label>
            <input id="bname" className="input" value={name} maxLength={30} placeholder={sector.name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="cap">Ton apport : {eur(capital)} (argent disponible : {eur(game.cash)})</label>
            <input id="cap" type="range" min={0} max={Math.max(0, Math.floor(game.cash))} step={100} value={Math.min(capital, Math.floor(game.cash))} onChange={(e) => setCapital(Number(e.target.value))} />
            {game.savings > 0 && <small className="muted">Ton épargne doit d’abord être retirée vers l’argent disponible (onglet Argent).</small>}
          </div>
          <div className="field">
            <label className="label" htmlFor="loan">Prêt bancaire professionnel : {eur(loan)} (max 2 × l’apport, caution personnelle de 50 %)</label>
            <input id="loan" type="range" min={0} max={capital * 2} step={500} value={Math.min(loan, capital * 2)} onChange={(e) => setLoan(Number(e.target.value))} />
          </div>
          {missing.length > 0 && <ul className="reqs">{missing.map((m) => <li key={m}>{m}</li>)}</ul>}
          <button className="btn btn-primary" disabled={missing.length > 0 || capital > game.cash} onClick={() => run((s) => startBusiness(s, sectorId, capital, Math.min(loan, capital * 2), name))}>
            Créer {name.trim() || sector.name}
          </button>
        </section>
      </div>
    );
  }

  const sector = SECTOR_BY_ID[b.sector];
  const value = businessValuation(b);
  return (
    <div className="stack">
      <section className="card stack">
        <div className="row-between wrap">
          <div>
            <div className="eyebrow">{sector.name}</div>
            <h2 style={{ margin: '0.2rem 0 0' }}>{b.name}</h2>
            <div className="muted">{b.years} an{b.years > 1 ? 's' : ''} d’activité · taille {b.scale}/5 · {game.job ? 'à temps partiel (tu as un emploi)' : 'à temps plein'}{b.ownership < 1 ? ` · tu détiens ${Math.round(b.ownership * 100)} %` : ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}><div className="muted">Valeur estimée de tes parts</div><div className="big-number gold num">{eur(value)}</div></div>
        </div>
        <div className="tiles">
          <MoneyTile label="Trésorerie" value={eur(b.treasury)} tone={b.treasury < 0 ? 'neg' : undefined} />
          <MoneyTile label="Chiffre d’affaires (an passé)" value={eur(b.lastRevenue)} />
          <MoneyTile label="Résultat (an passé)" value={eurSigned(b.lastProfit)} tone={b.lastProfit >= 0 ? 'pos' : 'neg'} />
          <MoneyTile label="Prêt pro restant" value={eur(b.loanPrincipal)} />
          <MoneyTile label="Maturité" value={`${Math.round(maturity(b.sector, b.years) * 100)} %`} sub="Montée en puissance de l’activité" />
        </div>
        <StatBar label="Réputation" value={b.reputation} color="var(--blue)" hint="Augmente le chiffre d’affaires. Progresse avec tes compétences et la priorité « Carrière »." />
        {b.treasury < 0 && <p className="banner">Trésorerie négative : sous {eur(-3 * (sector.baseCosts + sector.extraCosts * (b.scale - 1)))}, c’est la liquidation judiciaire. Apporte de l’argent ou réduis ta rémunération.</p>}
      </section>

      <div className="grid grid-2">
        <section className="card stack">
          <h3 className="card-title"><Icon name="money" /> Ma rémunération</h3>
          <select className="input" aria-label="Rémunération mensuelle nette" value={b.founderPay} onChange={(e) => run((s) => setFounderPay(s, Number(e.target.value)))}>
            {[...new Set([0, 800, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 7000, 10000, b.founderPay])].sort((x, y) => x - y).map((v) => <option key={v} value={v}>{v ? `${eur(v)} net / mois` : 'Aucune'}</option>)}
          </select>
          <small className="muted">Coûte 45 % de plus à l’entreprise (charges). Versée seulement si la trésorerie le permet.</small>
          <AmountForm max={game.cash} label="Apporter de l’argent" action="Apporter" onSubmit={(n) => run((s) => injectBusiness(s, n))} />
          <AmountForm max={Math.max(0, b.treasury - b.loanPrincipal - sector.baseCosts * b.scale)} label="Se verser des dividendes (impôt 30 %)" action="Verser" onSubmit={(n) => run((s) => withdrawDividends(s, n))} />
        </section>
        <section className="card stack">
          <h3 className="card-title"><Icon name="rocket" /> Stratégie</h3>
          <div>
            <button className="btn" disabled={b.scale >= 5} onClick={() => run(expandBusiness)}>Développer l’entreprise ({eur(expansionCost(b))})</button>
            <small className="muted" style={{ display: 'block', marginTop: '0.3rem' }}>Requiert une année bénéficiaire et une réputation de {expansionReputation(b)}. Plus de chiffre d’affaires, mais aussi plus de charges.</small>
          </div>
          <div>
            <button className="btn" onClick={() => setConfirm('sell')}>Vendre l’entreprise</button>
            <small className="muted" style={{ display: 'block', marginTop: '0.3rem' }}>Possible après 2 ans si elle est rentable. Prix autour de sa valeur estimée.</small>
          </div>
          <div><button className="btn btn-danger" onClick={() => setConfirm('close')}>Fermer l’entreprise</button></div>
        </section>
      </div>
      {confirm && (
        <ConfirmDialog
          title={confirm === 'sell' ? 'Vendre l’entreprise ?' : 'Fermer l’entreprise ?'}
          message={confirm === 'sell' ? `Un repreneur fera une offre autour de ${eur(value)}. La plus-value est imposée à 20 %.` : 'Si la trésorerie ne couvre pas le prêt, ta caution personnelle sera engagée.'}
          confirmLabel={confirm === 'sell' ? 'Chercher un repreneur' : 'Fermer'}
          danger={confirm === 'close'}
          onCancel={() => setConfirm(null)}
          onConfirm={() => { const c = confirm; setConfirm(null); run(c === 'sell' ? sellBusiness : closeBusiness); }}
        />
      )}
    </div>
  );
}
