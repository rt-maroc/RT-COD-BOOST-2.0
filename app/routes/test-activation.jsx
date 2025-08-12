import { useState, useEffect } from 'react';

export default function TestActivation() {
  const [isAppActive, setIsAppActive] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [message, setMessage] = useState('');

  // Charger le statut au montage du composant
  useEffect(() => {
    loadActivationStatus();
  }, []);

  const loadActivationStatus = async () => {
    try {
      const response = await fetch('/api/activate', {
        method: 'GET',
      });
      const data = await response.json();
      
      if (data.success) {
        setIsAppActive(data.isActive);
        setMessage(data.isActive ? 'Application active' : 'Application inactive');
      }
    } catch (error) {
      setMessage('Erreur lors du chargement du statut');
      console.error(error);
    }
  };

  const handleActivation = async () => {
    setIsActivating(true);
    setMessage('');

    try {
      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isAppActive }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsAppActive(!isAppActive);
        setMessage(data.message);
      } else {
        setMessage(`Erreur: ${data.message}`);
      }
    } catch (error) {
      setMessage(`Erreur: ${error.message}`);
      console.error(error);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '50px auto', 
      padding: '30px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#333',
        marginBottom: '30px',
        fontSize: '28px'
      }}>
        🧪 Test d'Activation - RT COD BOOST 2.0
      </h1>

      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        marginBottom: '25px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: '#495057' 
        }}>
          📊 Statut actuel
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isAppActive ? '#28a745' : '#dc3545'
          }}></div>
          <span style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: isAppActive ? '#28a745' : '#dc3545'
          }}>
            {isAppActive ? '✅ Application ACTIVE' : '❌ Application INACTIVE'}
          </span>
        </div>

        {message && (
          <div style={{
            padding: '10px 15px',
            backgroundColor: message.includes('Erreur') ? '#f8d7da' : '#d4edda',
            color: message.includes('Erreur') ? '#721c24' : '#155724',
            border: `1px solid ${message.includes('Erreur') ? '#f5c6cb' : '#c3e6cb'}`,
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        marginBottom: '25px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: '#495057' 
        }}>
          🎛️ Contrôles
        </h3>
        
        <button
          onClick={handleActivation}
          disabled={isActivating}
          style={{
            width: '100%',
            padding: '15px 25px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: isActivating ? 'not-allowed' : 'pointer',
            backgroundColor: isActivating 
              ? '#6c757d' 
              : (isAppActive ? '#dc3545' : '#28a745'),
            color: 'white',
            opacity: isActivating ? 0.7 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {isActivating 
            ? '⏳ Traitement en cours...' 
            : (isAppActive 
              ? '🔴 Désactiver l\'application' 
              : '🟢 Activer l\'application'
            )
          }
        </button>
      </div>

      <div style={{
        backgroundColor: '#fff3cd',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #ffeaa7',
        marginBottom: '25px'
      }}>
        <h4 style={{ 
          margin: '0 0 10px 0', 
          color: '#856404' 
        }}>
          ℹ️ Instructions
        </h4>
        <ol style={{ 
          margin: 0, 
          paddingLeft: '20px', 
          color: '#856404',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          <li>Cliquez sur "Activer l'application" pour créer le Script Tag Shopify</li>
          <li>Vérifiez que le statut passe à "ACTIVE" ✅</li>
          <li>Allez sur une page produit de votre boutique test</li>
          <li>Cherchez le bouton "Commander à la livraison" 💰</li>
          <li>Testez le formulaire COD</li>
        </ol>
      </div>

      <div style={{
        backgroundColor: '#d1ecf1',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #bee5eb'
      }}>
        <h4 style={{ 
          margin: '0 0 10px 0', 
          color: '#0c5460' 
        }}>
          🔗 Liens utiles
        </h4>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '20px', 
          color: '#0c5460',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          <li>
            <a 
              href="https://rt-solutions-test.myshopify.com" 
              target="_blank"
              style={{ color: '#0c5460', textDecoration: 'underline' }}
            >
              Boutique test Shopify
            </a>
          </li>
          <li>
            <a 
              href="/app" 
              style={{ color: '#0c5460', textDecoration: 'underline' }}
            >
              Retour au Dashboard principal
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}