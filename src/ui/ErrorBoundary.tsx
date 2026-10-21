import { Component, type ReactNode } from 'react';

/**
 * Filet de sécurité : une erreur de rendu ne doit jamais laisser un écran figé ou vide.
 * On affiche ce qui s'est passé et des moyens concrets d'en sortir, sans perdre la sauvegarde.
 */
export class ErrorBoundary extends Component<{ children: ReactNode; onReset: () => void; onClearSave: () => void }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Erreur d’affichage du jeu :', error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="container page" role="alert" style={{ maxWidth: 640 }}>
        <h1>Oups, l’écran n’a pas pu s’afficher</h1>
        <p className="muted">Une erreur inattendue est survenue. Ta sauvegarde n’a pas été modifiée.</p>
        <pre className="banner" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{error.message}</pre>
        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn-primary" onClick={() => { this.setState({ error: null }); this.props.onReset(); }}>Revenir à l’accueil</button>
          <button type="button" className="btn btn-danger" onClick={() => { this.props.onClearSave(); this.setState({ error: null }); this.props.onReset(); }}>Effacer la sauvegarde et recommencer</button>
        </div>
      </div>
    );
  }
}
