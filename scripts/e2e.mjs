// Parcours de bout en bout dans un vrai navigateur (Chromium via Playwright).
// Usage : npm run build && npm run e2e   (ou E2E_URL=https://... npm run e2e pour tester une URL publique)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const OUT = process.env.E2E_OUT ?? 'e2e-screenshots';
mkdirSync(OUT, { recursive: true });
let server;
let url = process.env.E2E_URL;
if (!url) {
  server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'pipe' });
  await new Promise((r) => setTimeout(r, 2500));
  url = 'http://localhost:4173/';
}
const log = (...a) => console.log('•', ...a);
const failures = [];
const check = (cond, msg) => { if (cond) log('OK', msg); else { failures.push(msg); console.log('✗ ÉCHEC', msg); } };

const launch = { executablePath: process.env.CHROMIUM_PATH || undefined };
try { await chromium.launch(launch).then((b) => b.close()); } catch { launch.executablePath = undefined; }
const browser = await chromium.launch(launch);

async function scenario(name, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: viewport.width < 600 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  check(await page.getByRole('heading', { name: /millionnaire/i }).isVisible(), `[${name}] la page d’accueil charge`);
  await page.screenshot({ path: `${OUT}/${name}-1-accueil.png`, fullPage: true });
  await page.getByRole('button', { name: /Commencer ma vie/ }).first().click();
  await page.getByLabel('Prénom').fill('Testeur');
  await page.getByRole('radio', { name: /héritier|héritière/i }).click();
  await page.screenshot({ path: `${OUT}/${name}-2-creation.png`, fullPage: true });
  await page.getByRole('button', { name: /Commencer ma vie/ }).click();
  await page.getByRole('dialog').waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}-3-evenement.png` });
  const nwBefore = await page.locator('.topbar .kpi-value').first().textContent();
  await page.locator('.choice:not([aria-disabled="true"])').first().click();
  await page.getByText('Ton choix').waitFor();
  check(true, `[${name}] un choix est pris en compte`);
  const chips = await page.locator('.outcome .chip').allTextContents();
  log(`conséquences affichées : ${chips.join(' | ')}`);
  check(chips.length > 0, `[${name}] la décision modifie l’état du personnage`);
  await page.screenshot({ path: `${OUT}/${name}-4-consequence.png` });
  await page.getByRole('button', { name: /Continuer|Événement suivant/ }).click();
  const nwAfter = await page.locator('.topbar .kpi-value').first().textContent();
  log(`patrimoine avant/après le choix : ${nwBefore} → ${nwAfter}`);
  await page.screenshot({ path: `${OUT}/${name}-5-tableau-de-bord.png`, fullPage: true });

  // Vivre plusieurs années
  for (let year = 0; year < 14; year++) {
    while (await page.locator('.choice').count()) {
      await page.locator('.choice:not([aria-disabled="true"])').first().click();
      await page.getByRole('button', { name: /Continuer|Événement suivant/ }).click();
    }
    const btn = page.getByRole('button', { name: /^Vivre mes \d+ ans/ });
    const before = await page.locator('.topbar .kpi-value').first().textContent();
    await btn.click();
    if (year === 0) {
      const after = await page.locator('.topbar .kpi-value').first().textContent();
      log(`patrimoine avant/après une année : ${before} → ${after}`);
      check(before !== after, `[${name}] le patrimoine affiché évolue après une année simulée`);
    }
    await page.getByRole('button', { name: /Découvrir mes/ }).waitFor();
    if (year === 0) await page.waitForTimeout(500);
    if (year === 0) await page.screenshot({ path: `${OUT}/${name}-6-bilan-annuel.png` });
    await page.getByRole('button', { name: /Découvrir mes/ }).click();
  }
  const ageText = await page.locator('.age-badge').textContent();
  check(Number(ageText) >= 32, `[${name}] le temps avance (âge ${ageText})`);
  for (const tab of ['Carrière', 'Argent', 'Logement', 'Proches', 'Entreprise', 'Parcours']) {
    while (await page.locator('.choice').count()) {
      await page.locator('.choice:not([aria-disabled="true"])').first().click();
      await page.getByRole('button', { name: /Continuer|Événement suivant/ }).click();
    }
    await page.getByRole('tab', { name: tab }).click();
    await page.screenshot({ path: `${OUT}/${name}-7-onglet-${tab}.png`, fullPage: true });
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 1, `[${name}] aucun défilement horizontal (${overflow}px)`);

  // Sauvegarde : rechargement de la page
  await page.reload();
  check(await page.getByRole('button', { name: /Reprendre — Testeur/ }).isVisible(), `[${name}] la sauvegarde est retrouvée après rechargement`);
  await page.getByRole('button', { name: /Reprendre — Testeur/ }).click();
  check(Number(await page.locator('.age-badge').textContent()) === Number(ageText), `[${name}] la partie reprend au même âge`);

  // Fin anticipée et bilan
  while (await page.locator('.choice').count()) {
    await page.locator('.choice:not([aria-disabled="true"])').first().click();
    await page.getByRole('button', { name: /Continuer|Événement suivant/ }).click();
  }
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: /Clore mon histoire/ }).click();
  await page.getByRole('button', { name: /Voir mon bilan/ }).click();
  await page.getByRole('button', { name: /Partager mon histoire/ }).waitFor();
  check(true, `[${name}] le bilan final est accessible`);
  await page.screenshot({ path: `${OUT}/${name}-8-bilan-final.png`, fullPage: true });
  const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow2 <= 1, `[${name}] bilan final sans défilement horizontal (${overflow2}px)`);
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await page.getByRole('button', { name: /Copier le texte et le lien/ }).click();
  await page.waitForTimeout(300);
  check(errors.length === 0, `[${name}] aucune erreur dans la console${errors.length ? ' : ' + errors.join(' | ') : ''}`);
  await ctx.close();
}

try {
  await scenario('mobile', { width: 390, height: 844 });
  await scenario('ordinateur', { width: 1366, height: 900 });
} catch (e) {
  failures.push(String(e));
  console.error(e);
} finally {
  await browser.close();
  server?.kill();
}
console.log(failures.length ? `\n${failures.length} échec(s)` : '\nTous les contrôles de bout en bout sont passés.');
process.exit(failures.length ? 1 : 0);
