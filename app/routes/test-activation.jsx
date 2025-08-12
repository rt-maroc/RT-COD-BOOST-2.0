import { useState, useEffect } from 'react';

export default function TestActivation() {
  const [isAppActive, setIsAppActive] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [message, setMessage] = useState('');
  const [shopInfo, setShopInfo] = useState(null);

  // Vérifier le statut au chargement
  useEffect(() => {
    checkActivationStatus();
  }, []);

  const checkActivationStatus = async () => {
    try {
      const response = await fetch('/api/activate');
      const result = await response.json();
      
      if (result.success) {
        setIsAppActive(result.isActive);
        setShopInfo({
          shop: result.shop,
          totalOrders: result.totalOrders,
          totalRevenue: result.totalRevenue
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      setMessage('❌ Erreur de connexion à l\'API');
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
        body: JSON.stringify({
          isActive: !isAppActive
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsAppActive(result.isActive);
        setMessage(result.message);
        
        // Actualiser les infos
        setTimeout(checkActivationStatus, 1000);
      } else {
        throw new Error(result.error || 'Erreur lors de l\'activation');
      }

    } catch (error) {
      console.error('Erreur d\'activation:', error);
      setMessage('❌ ' + error.message);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '3rem',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '1rem'
        }}>
          🧪 Test d'Activation
        </h1>
        
        <h2 style={{
          fontSize: '1.2rem',
          color: '#64748b',
          marginBottom: '2rem'
        }}>
          RT COD BOOST 2.0
        </h2>

        {/* Statut visuel */}
        <div style={{
          fontSize: '5rem',
          marginBottom: '1rem'
        }}>
          {isAppActive ? '✅' : '⚠️'}
        </div>

        <h3 style={{
          fontSize: '1.8rem',
          color: isAppActive ? '#10b981' : '#ef4444',
          marginBottom: '1rem'
        }}>
          {isAppActive ? 'APPLICATION ACTIVE' : 'APPLICATION INACTIVE'}
        </h3>

        {/* Infos boutique */}
        {shopInfo && (
          <div style={{
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>📊 Informations:</h4>
            <p style={{ margin: '0.25rem 0', color: '#64748b' }}>
              <strong>Boutique:</strong> {shopInfo.shop}
            </p>
            <p style={{ margin: '0.25rem 0', color: '#64748b' }}>
              <strong>Commandes totales:</strong> {shopInfo.totalOrders}
            </p>
            <p style={{ margin: '0.25rem 0', color: '#64748b' }}>
              <strong>Revenus totaux:</strong> {shopInfo.totalRevenue} DH
            </p>
          </div>
        )}

        {/* Description */}
        <p style={{
          color: '#64748b',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          {isAppActive ? (
            <>
              🎉 <strong>Parfait !</strong> Le formulaire COD est maintenant visible sur vos pages produit. 
              Visitez une page produit de votre boutique pour voir le bouton "Commander à la livraison".
            </>
          ) : (
            <>
              ⚡ Cliquez sur le bouton ci-dessous pour activer le formulaire COD. 
              Cela créera un Script Tag dans Shopify qui affichera le bouton sur vos pages produit.
            </>
          )}
        </p>

        {/* Bouton d'activation */}
        <button
          onClick={handleActivation}
          disabled={isActivating}
          style={{
            padding: '1.25rem 2.5rem',
            background: isActivating ? '#94a3b8' : (
              isAppActive ? 
                'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            ),
            color: 'white',
            border: 'none',
            borderRadius: '15px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: isActivating ? 'not-allowed' : 'pointer',
            opacity: isActivating ? 0.7 : 1,
            transition: 'all 0.3s ease',
            marginBottom: '2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}
        >
          {isActivating ? (
            '⏳ En cours...'
          ) : (
            isAppActive ? 
              '🔴 Désactiver l\'application' : 
              '🟢 Activer l\'application'
          )}
        </button>

        {/* Message de résultat */}
        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '10px',
            background: message.includes('❌') ? 
              'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' :
              'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            color: message.includes('❌') ? '#991b1b' : '#065f46',
            border: `2px solid ${message.includes('❌') ? '#ef4444' : '#10b981'}`,
            marginBottom: '1rem'
          }}>
            <strong>{message}</strong>
          </div>
        )}

        {/* Instructions */}
        <div style={{
          background: '#f0f9ff',
          padding: '1.5rem',
          borderRadius: '10px',
          fontSize: '0.9rem',
          color: '#0369a1',
          textAlign: 'left',
          border: '2px solid #0ea5e9'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#0c4a6e' }}>📋 Instructions de test:</h4>
          <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>Activez l'application avec le bouton ci-dessus</li>
            <li>Allez sur votre boutique : <strong>rt-solutions-test.myshopify.com</strong></li>
            <li>Visitez n'importe quelle page produit</li>
            <li>Vérifiez que le bouton "Commander à la livraison" apparaît</li>
            <li>Testez le formulaire de commande</li>
          </ol>
        </div>

        {/* Bouton retour */}
        <div style={{ marginTop: '2rem' }}>
          <a 
            href="/app" 
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            ← Retour au Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}