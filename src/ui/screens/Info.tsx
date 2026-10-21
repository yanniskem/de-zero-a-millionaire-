import { ENDINGS } from '../../content/endings';
import type { Settings } from '../../save/storage';
import { Icon } from '../components/Icon';

export function Rules({ onBack }: { onBack: () => void }) {
  const strip = (t: string) => t.replace(/\{([^{}|]*)\|[^{}|]*\}/g, '$1');
  return (
    <div className="container page prose" style={{ maxWidth: 820 }}>
      <header className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack} aria-label="Retour"><Icon name="back" /></button>
        <h1>Règles du jeu</h1>
      </header>
      <p>Tu incarnes un personnage de 18 ans en France et tu fais avancer sa vie, année après année, jusqu’à l’âge choisi (45, 67 ou 80 ans). Tu peux aussi clore ton histoire dès 30 ans.</p>
      <h2>Le déroulement d’une année</h2>
      <ol>
        <li><strong>Événements</strong> : un ou deux événements surviennent. Chaque choix modifie réellement ta situation. Certains effets n’apparaissent que des années plus tard.</li>
        <li><strong>Tes décisions</strong> : dans les onglets, tu peux postuler, te former, déménager, épargner, investir, emprunter, rembourser, faire des rencontres ou créer une entreprise. Certaines actions sont limitées à une par an.</li>
        <li><strong>Vivre l’année</strong> : le jeu simule 12 mois : salaires, aides, impôts, loyers, dépenses, crédits, épargne. Puis viennent les rendements des placements, la carrière, la santé et les relations. Un bilan détaillé explique chaque variation.</li>
      </ol>
      <h2>L’argent</h2>
      <ul>
        <li><strong>Argent disponible</strong> : ton compte courant. Si tes dépenses le dépassent, ton épargne est utilisée, puis un découvert à 16 % (une vraie dette).</li>
        <li><strong>Patrimoine net</strong> = tout ce que tu possèdes (argent, épargne, placements, immobilier, parts d’entreprise) − toutes tes dettes.</li>
        <li>Le salaire affiché est brut ; environ 78 % arrive en net, puis l’impôt sur le revenu (barème progressif simplifié) est prélevé.</li>
        <li>Les montants sont en <strong>euros constants</strong> (hors inflation). Les placements ont des rendements réels moyens modestes et peuvent perdre de l’argent.</li>
        <li>Au-delà d’un an de revenus en dettes de consommation, un plan de surendettement est imposé : dettes regroupées, train de vie frugal et plus aucun crédit.</li>
      </ul>
      <h2>Carrière, santé, relations</h2>
      <ul>
        <li>Les métiers exigent diplômes, compétences ou expérience. Les conditions manquantes sont toujours indiquées.</li>
        <li>La <strong>priorité de l’année</strong> (carrière, équilibre, proches, santé, apprendre) oriente l’évolution de ta performance, de ton énergie, de ta santé et de tes relations.</li>
        <li>Un métier bien payé peut être stressant et peu compatible avec la vie de famille. Les relations influencent certains événements et ta fin.</li>
      </ul>
      <h2>Les fins possibles</h2>
      <p>Il existe {ENDINGS.length} fins. Elles dépendent du patrimoine mais aussi de ta carrière, de tes relations, de ta santé et des épreuves traversées.</p>
      <ul>{ENDINGS.map((e) => <li key={e.id}>{e.emoji} {strip(e.title)} <span className="muted">({e.rarity.toLowerCase()})</span></li>)}</ul>
      <h2>Important</h2>
      <p>Ce jeu est une fiction simplifiée. Il ne reproduit pas exactement la fiscalité ni les règles sociales françaises et ne constitue en aucun cas un conseil financier ou d’investissement.</p>
      <p>Ta partie est sauvegardée uniquement dans ce navigateur, sur cet appareil. Elle ne se synchronise pas entre appareils et disparaît si tu effaces les données du site.</p>
    </div>
  );
}

export function SettingsScreen({ settings, onChange, onBack, onDeleteSave, hasSave, storageOk }: { settings: Settings; onChange: (s: Settings) => void; onBack: () => void; onDeleteSave: () => void; hasSave: boolean; storageOk: boolean }) {
  const toggle = (k: keyof Settings) => onChange({ ...settings, [k]: !settings[k] });
  return (
    <div className="container page" style={{ maxWidth: 720 }}>
      <header className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack} aria-label="Retour"><Icon name="back" /></button>
        <h1>Paramètres</h1>
      </header>
      <section className="card">
        {([
          ['reduceMotion', 'Réduire les animations', 'Supprime les transitions et effets de mouvement.'],
          ['largeText', 'Texte plus grand', 'Augmente la taille du texte dans tout le jeu.'],
          ['showDetails', 'Afficher le détail des calculs', 'Montre les explications sous chaque ligne du bilan annuel.'],
        ] as const).map(([k, label, desc]) => (
          <label key={k} className="switch">
            <span><strong>{label}</strong><br /><small className="muted">{desc}</small></span>
            <input type="checkbox" checked={settings[k]} onChange={() => toggle(k)} />
          </label>
        ))}
      </section>
      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 className="card-title" style={{ fontSize: '1.1rem' }}><Icon name="lock" /> Sauvegarde</h2>
        <p className="muted">
          {storageOk ? 'La partie est sauvegardée automatiquement dans ce navigateur après chaque action. Aucune donnée n’est envoyée sur Internet.' : 'Le stockage local est indisponible : la partie ne peut pas être sauvegardée.'}
        </p>
        <button className="btn btn-danger" disabled={!hasSave} onClick={onDeleteSave}>Effacer la sauvegarde</button>
      </section>
      <p className="muted" style={{ fontSize: '0.82rem', marginTop: '1rem' }}>Aucune publicité, aucun cookie de suivi, aucun compte requis.</p>
    </div>
  );
}
