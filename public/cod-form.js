(function() {
  'use strict';
  
  console.log('🚀 RT COD BOOST 2.0 - Script chargé');

  // Configuration
  const CONFIG = {
    APP_URL: 'https://rt-cod-boost-2-0.onrender.com',
    BUTTON_ID: 'rt-cod-button',
    MODAL_ID: 'rt-cod-modal'
  };

  // Vérifier si on est sur une page produit
  function isProductPage() {
    return window.location.pathname.includes('/products/') || 
           document.querySelector('[data-section-type="product"]') ||
           document.querySelector('.product-form') ||
           document.querySelector('#product-form');
  }

  // Créer le bouton COD
  function createCODButton() {
    const button = document.createElement('button');
    button.id = CONFIG.BUTTON_ID;
    button.innerHTML = `
      <span>💰</span>
      <span>Commander à la livraison</span>
    `;
    button.style.cssText = `
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      margin: 15px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      transition: all 0.3s ease;
      font-family: inherit;
    `;

    // Effets hover
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
    });

    // Événement click
    button.addEventListener('click', () => {
      console.log('🛒 Bouton COD cliqué');
      showCODModal();
    });

    return button;
  }

  // Créer la modal COD
  function createCODModal() {
    const modal = document.createElement('div');
    modal.id = CONFIG.MODAL_ID;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    modalContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="margin: 0; color: #333; font-size: 24px;">🛒 Commander à la livraison</h2>
        <p style="margin: 10px 0 0 0; color: #666;">Remplissez le formulaire pour passer commande</p>
      </div>

      <form id="cod-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Nom complet *</label>
          <input type="text" name="customerName" required 
                 style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px;"
                 placeholder="Votre nom complet">
        </div>

        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Téléphone *</label>
          <input type="tel" name="customerPhone" required 
                 style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px;"
                 placeholder="06 12 34 56 78">
        </div>

        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Email</label>
          <input type="email" name="customerEmail" 
                 style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px;"
                 placeholder="votre@email.com">
        </div>

        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Adresse complète *</label>
          <textarea name="customerAddress" required rows="3"
                    style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical;"
                    placeholder="Adresse, ville, code postal"></textarea>
        </div>

        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Quantité</label>
          <input type="number" name="quantity" value="1" min="1" 
                 style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px;">
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" onclick="closeCODModal()" 
                  style="flex: 1; padding: 12px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 16px;">
            Annuler
          </button>
          <button type="submit" 
                  style="flex: 2; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold;">
            Confirmer la commande
          </button>
        </div>
      </form>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Gérer la soumission du formulaire
    const form = modal.querySelector('#cod-form');
    form.addEventListener('submit', handleCODSubmit);

    // Fermer en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCODModal();
      }
    });

    return modal;
  }

  // Afficher la modal
  function showCODModal() {
    const modal = document.getElementById(CONFIG.MODAL_ID);
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  // Fermer la modal
  window.closeCODModal = function() {
    const modal = document.getElementById(CONFIG.MODAL_ID);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  // Gérer la soumission du formulaire
  function handleCODSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const orderData = Object.fromEntries(formData.entries());
    
    // Ajouter les infos du produit
    orderData.productTitle = document.querySelector('h1, .product-title, [data-product-title]')?.textContent?.trim() || 'Produit';
    orderData.productUrl = window.location.href;
    orderData.shop = window.Shopify?.shop || window.location.hostname;

    console.log('📋 Données commande COD:', orderData);

    // Simuler l'envoi (à remplacer par l'API plus tard)
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Envoi en cours...';
    submitBtn.disabled = true;

    setTimeout(() => {
      alert('✅ Commande enregistrée ! Nous vous contacterons bientôt.');
      closeCODModal();
      submitBtn.textContent = 'Confirmer la commande';
      submitBtn.disabled = false;
      e.target.reset();
    }, 1500);
  }

  // Trouver où insérer le bouton
  function findInsertionPoint() {
    // Essayer différents sélecteurs pour les boutons d'achat
    const selectors = [
      '.product-form__buttons',
      '.product-form__cart',
      '.product__buttons',
      '.product-form',
      'form[action*="add"]',
      '.product-add-to-cart',
      '.btn-product-add-cart',
      '.product-form-container'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ Point d'insertion trouvé: ${selector}`);
        return element;
      }
    }

    console.log('⚠️ Aucun point d\'insertion standard trouvé');
    return null;
  }

  // Initialiser le script
  function init() {
    console.log('🔍 Vérification de la page...');
    
    if (!isProductPage()) {
      console.log('ℹ️ Pas une page produit, script non initialisé');
      return;
    }

    console.log('✅ Page produit détectée, initialisation...');

    // Créer la modal (une seule fois)
    if (!document.getElementById(CONFIG.MODAL_ID)) {
      createCODModal();
    }

    // Créer et insérer le bouton
    if (!document.getElementById(CONFIG.BUTTON_ID)) {
      const button = createCODButton();
      const insertionPoint = findInsertionPoint();
      
      if (insertionPoint) {
        insertionPoint.appendChild(button);
        console.log('🚀 Bouton COD ajouté avec succès !');
      } else {
        // Fallback : ajouter après le premier formulaire trouvé
        const form = document.querySelector('form');
        if (form && form.parentNode) {
          form.parentNode.insertBefore(button, form.nextSibling);
          console.log('🚀 Bouton COD ajouté (fallback) !');
        }
      }
    }
  }

  // Démarrer quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-initialiser si le contenu change (thèmes SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(init, 500); // Délai pour laisser le temps au nouveau contenu de se charger
    }
  }).observe(document, { subtree: true, childList: true });

})();