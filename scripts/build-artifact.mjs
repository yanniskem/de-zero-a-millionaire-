// Produit une page autonome en un seul fichier (CSS et JavaScript intégrés) à partir de dist/.
// Utilisation : npm run build && node scripts/build-artifact.mjs
//  - dist-single/index.html            : page HTML complète, jouable depuis n'importe quel hébergement ou en local ;
//  - dist-single/artifact.html          : même contenu sans <html>/<head>/<body>, au format attendu par les Artifacts Claude
//    (la plateforme ajoute elle-même le squelette et n'autorise que des scripts intégrés ou issus de CDN reconnus).
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const assets = readdirSync('dist/assets');
const jsFile = assets.find((f) => f.endsWith('.js'));
const cssFile = assets.find((f) => f.endsWith('.css'));
if (!jsFile || !cssFile) throw new Error('Build introuvable : lance d’abord « npm run build ».');
let js = readFileSync(`dist/assets/${jsFile}`, 'utf8');
const css = readFileSync(`dist/assets/${cssFile}`, 'utf8');

// Une séquence « </script » dans le code fermerait la balise : on l'échappe (valide en chaîne comme en expression régulière).
js = js.replace(/<\/script/gi, '<\\/script');
if (/<!--/.test(js)) js = js.replace(/<!--/g, '<\\!--');

const fallback = `<div id="root"><p style="padding:24px;font-family:system-ui,sans-serif;color:#eee9df;background:#0a0c11;min-height:100vh;margin:0">Chargement de De zéro à millionnaire…</p></div>
<noscript>Ce jeu nécessite JavaScript.</noscript>`;
const body = `<title>De zéro à millionnaire</title>
<meta name="theme-color" content="#0a0c11">
<style>${css}</style>
${fallback}
<script>${js}</script>
`;
mkdirSync('dist-single', { recursive: true });
writeFileSync('dist-single/artifact.html', body);
writeFileSync('dist-single/index.html', `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head>
<body>
${body}</body>
</html>
`);
console.log(`dist-single/ : ${(body.length / 1024).toFixed(0)} Ko (script ${jsFile}, styles ${cssFile})`);
