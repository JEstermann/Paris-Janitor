import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container">
      {/* Hero */}
      <div className="home-hero">
        <h1>
          <span className="home-hero-accent">Paris Janitor</span>
        </h1>
        <p className="home-hero-tagline">
          On s'occupe de votre logement pendant que vos voyageurs en profitent.
        </p>

        {!isAuthenticated ? (
          <div className="home-hero-actions">
            <Link to="/register" className="btn btn-primary">
              Je crée mon compte
            </Link>
            <Link to="/prestations" className="btn btn-secondary">
              Voir les services
            </Link>
          </div>
        ) : (
          <div className="home-hero-actions">
            <Link to="/prestations" className="btn btn-primary">
              Découvrir les services
            </Link>
          </div>
        )}
      </div>

      {/* Services */}
      <div className="home-services">
        <h2 className="home-section-title">Nos services</h2>

        <div className="home-services-grid">
          <div className="home-service-card">
            <h3>Ménage complet</h3>
            <p>
              Votre appartement nickel après chaque départ — on change les draps, on aspire, on fait briller.
            </p>
            <span className="home-service-price">À partir de 40 € HT</span>
          </div>

          <div className="home-service-card">
            <h3>Check-in à la main</h3>
            <p>
              On accueille vos voyageurs en personne, on leur remet les clés et on répond à leurs questions.
            </p>
            <span className="home-service-price">À partir de 25 € HT</span>
          </div>

          <div className="home-service-card">
            <h3>Navette aéroport</h3>
            <p>
              Un chauffeur pour CDG, Orly ou Beauvais — on vous l'envoie avec le sourire.
            </p>
            <span className="home-service-price">À partir de 60 € HT</span>
          </div>
        </div>
      </div>

      {/* Social proof / trust */}
      {!isAuthenticated && (
        <div className="home-trust">
          <p>
            Déjà plus de 200 propriétaires qui nous font confiance sur Paris.
          </p>
          <Link to="/register" className="home-trust-link">
            Rejoignez-les &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

export default HomePage;
