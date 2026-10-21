// Parcours complets joués automatiquement, avec contrôle des invariants à chaque étape.
import { describe, expect, it } from 'vitest';
import { netWorth } from '../src/engine/economy';
import { playGame } from './bot';

describe('parcours complets', () => {
  it('1. parcours stable avec un emploi', () => {
    const r = playGame(101, 'bac_pro', 'stable');
    expect(r.invariantErrors).toEqual([]);
    expect(r.final.age).toBe(67);
    expect(r.final.careerPath.length).toBeGreaterThan(0);
    expect(r.final.endingId).toBeTruthy();
  });

  it('2. parcours entrepreneurial qui réussit (au moins une graine)', () => {
    let success = false;
    for (let seed = 1; seed < 40 && !success; seed++) {
      const r = playGame(seed * 31, 'entrepreneur', 'entrepreneur', 'normale', seed < 4);
      expect(r.invariantErrors).toEqual([]);
      if (r.final.counters.businessesCreated > 0 && (r.final.counters.bestBusinessSale > 100000 || (r.final.business?.lastProfit ?? 0) > 30000)) success = true;
    }
    expect(success).toBe(true);
  });

  it('3. parcours qui connaît une faillite', () => {
    let failed = false;
    for (let seed = 1; seed < 60 && !failed; seed++) {
      const r = playGame(seed * 17, 'entrepreneur', 'entrepreneur', 'normale', seed < 4);
      if (r.final.counters.bankruptcies > 0) failed = true;
    }
    expect(failed).toBe(true);
  });

  it('4. parcours où le joueur investit', () => {
    const r = playGame(303, 'codeur', 'investisseur');
    expect(r.invariantErrors).toEqual([]);
    expect(r.final.stocks + r.final.properties.reduce((t, p) => t + p.value, 0)).toBeGreaterThan(0);
    expect(r.final.flags.premierInvestissement).toBeDefined();
  });

  it('5. parcours avec des relations privilégiées', () => {
    const r = playGame(404, 'rural', 'famille');
    expect(r.invariantErrors).toEqual([]);
    expect(r.final.relations.family).toBeGreaterThan(50);
    expect(r.final.relations.exPartners + (r.final.relations.partner ? 1 : 0)).toBeGreaterThan(0);
  });

  it('6. parcours avec des difficultés financières', () => {
    const r = playGame(505, 'endette', 'depensier');
    expect(r.invariantErrors).toEqual([]);
    expect(r.final.debts.length > 0 || r.final.counters.yearsInDebt > 0 || netWorth(r.final) < 50000).toBe(true);
  });

  it('aucune incohérence sur 26 parties variées (tous profils, partie courte)', () => {
    const strategies = ['stable', 'entrepreneur', 'investisseur', 'depensier', 'famille', 'aleatoire'] as const;
    for (let i = 0; i < 26; i++) {
      const profiles = ['cocon', 'etudiant', 'bac_pro', 'sans_diplome', 'heritier', 'pilier', 'reveur', 'debrouillard', 'metropole', 'entrepreneur', 'codeur', 'rural', 'endette'];
      const r = playGame(9000 + i, profiles[i % profiles.length], strategies[i % strategies.length], 'courte');
      expect(r.invariantErrors, `partie ${i}`).toEqual([]);
      expect(r.final.age).toBe(45);
    }
  });
});
