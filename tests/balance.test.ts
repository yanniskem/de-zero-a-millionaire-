// Rapport d'équilibrage : joue de nombreuses parties et affiche la distribution des résultats.
import { it } from 'vitest';
import { PROFILES } from '../src/content/profiles';
import { netWorth } from '../src/engine/economy';
import { playGame, type StrategyName } from './bot';

it('rapport d’équilibrage', () => {
  const strategies: StrategyName[] = ['stable', 'entrepreneur', 'investisseur', 'depensier', 'famille', 'aleatoire'];
  const endings: Record<string, number> = {};
  const lines: string[] = [];
  let errors = 0;
  for (const strat of strategies) {
    const nws: number[] = [];
    for (let i = 0; i < 26; i++) {
      const p = PROFILES[i % PROFILES.length];
      const run = playGame(1000 + i * 7919, p.id, strat, 'normale', i < 4);
      errors += run.invariantErrors.length;
      if (run.invariantErrors.length) console.log(run.invariantErrors.slice(0, 5));
      nws.push(netWorth(run.final));
      endings[run.final.endingId!] = (endings[run.final.endingId!] ?? 0) + 1;
    }
    nws.sort((a, b) => a - b);
    const q = (x: number) => Math.round(nws[Math.floor(x * (nws.length - 1))]).toLocaleString('fr-FR');
    lines.push(`${strat.padEnd(13)} min ${q(0)} | p25 ${q(0.25)} | médiane ${q(0.5)} | p75 ${q(0.75)} | max ${q(1)} | ≥1M: ${nws.filter((n) => n >= 1e6).length}`);
  }
  console.log(lines.join('\n'));
  console.log(endings);
  console.log('erreurs d’invariants :', errors);
}, 120000);
