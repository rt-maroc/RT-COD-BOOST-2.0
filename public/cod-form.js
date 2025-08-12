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
    return (
      window.location.pathname.includes('/products/') || 
      document.querySelector('form[action*="/cart/add"]') !== null ||
      document.querySelector('[data-product-id]') !== null ||
      document.querySelector('.product-form') !== null
    );
  }

  // Obtenir les infos du produit
  function getProductInfo() {
    try {
      // Méthode 1: Meta tags
      const productTitle = document.querySelector('meta[property="og:title"]')?.content;
      const productPrice = document.querySelector('meta[property="product:price:amount"]')?.content;
      const productImage = document.querySelector('meta[property="og:image"]')?.content;
      
      if (productTitle) {
        return {
          title: productTitle,
          price: productPrice || '0',
          image: productImage,
          url: window.location.href
        };
      }

      // Méthode 2: Recherche dans le DOM
      const titleElement = document.querySelector('h1, .product-title, [data-product-title]');
      const priceElement = document.querySelector('.price, [data-price], .product-price');
      
      return {
        title: titleElement?.textContent?.trim() || 'Produit',
        price: priceElement?.textContent?.replace(/[^\d.,]/g, '') || '0',
        image: document.querySelector('img')?.src,
        url: window.location.href
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des infos produit:', error);
      return {
        title: 'Produit',
        price: '0',
        image: '',
        url: window.location.href
      };
    }
  }

  // Créer le bouton COD
  function createCODButton() {
    const button = document.createElement('button');
    button.id = CONFIG.BUTTON_ID;
    button.type = 'button';
    button.innerHTML = `
      <span style="margin-right: 0.5rem;">💰</span>
      Commander à la livraison
    `;
    
    button.style.cssText = `
      width: 100%;
      padding: 15px 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      margin: 10px 0;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Effets hover
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
    });

    button.addEventListener('click', () => {
      console.log('🛒 Bouton COD cliqué');
      openCODModal();
    });
    
    return button;
  }

  // Créer le modal
  function createCODModal() {
    const modal = document.createElement('div');
    modal.id = CONFIG.MODAL_ID;
    modal.style.cssText = `
      display: none;
      position: fixed;
      z-index: 10000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      backdrop-filter: blur(5px);
    `;

    const productInfo = getProductInfo();
    
    modal.innerHTML = `
      <div style="
        background: white;
        margin: 5% auto;
        padding: 30px;
        border-radius: 15px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        position: relative;
      ">
        <span id="rt-cod-close" style="
          color: #aaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
          position: absolute;
          right: 20px;
          top: 15px;
        ">&times;</span>
        
        <h2 style="color: #1e293b; margin-bottom: 20px; text-align: center;">
          🚚 Commande à la livraison
        </h2>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #166534;">Produit sélectionné:</h4>
          <p style="margin: 0; font-weight: bold;">${productInfo.title}</p>
          ${productInfo.price !== '0' ? `<p style="margin: 5px 0 0 0; color: #059669; font-size: 18px;">Prix: ${productInfo.price} DH</p>` : ''}
        </div>

        <form id="rt-cod-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Prénom *</label>
              <input type="text" name="firstName" required style="
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
              ">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Nom *</label>
              <input type="text" name="lastName" required style="
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
              ">
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Téléphone *</label>
            <input type="tel" name="phone" required style="
              width: 100%;
              padding: 12px;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              font-size: 14px;
            ">
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Email</label>
            <input type="email" name="email" style="
              width: 100%;
              padding: 12px;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              font-size: 14px;
            ">
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Adresse complète *</label>
            <textarea name="address" required rows="2" style="
              width: 100%;
              padding: 12px;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              font-size: 14px;
              resize: vertical;
            "></textarea>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Ville *</label>
            <input type="text" name="city" required style="
              width: 100%;
              padding: 12px;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              font-size: 14px;
            ">
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e40af; text-align: center;">
              <strong>💡 Paiement à la livraison</strong><br>
              Vous paierez lors de la réception de votre commande
            </p>
          </div>

          <button type="submit" style="
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            🛒 Confirmer ma commande
          </button>
        </form>
      </div>
    `;

    return modal;
  }

  // Ouvrir le modal
  function openCODModal() {
    let modal = document.getElementById(CONFIG.MODAL_ID);
    
    if (!modal) {
      modal = createCODModal();
      document.body.appendChild(modal);
      
      // Event listeners
      modal.querySelector('#rt-cod-close').addEventListener('click', closeCODModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCODModal();
      });
      
      // Form submission
      modal.querySelector('#rt-cod-form').addEventListener('submit', handleFormSubmit);
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  // Fermer le modal
  function closeCODModal() {
    const modal = document.getElementById(CONFIG.MODAL_ID);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  // Gérer la soumission du formulaire
  function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const productInfo = getProductInfo();
    
    const orderData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      city: formData.get('city'),
      product: productInfo,
      shopDomain: window.Shopify?.shop || window.location.hostname
    };

    console.log('📤 Envoi de la commande:', orderData);
    
    // Pour l'instant, juste fermer le modal et montrer un message
    closeCODModal();
    showSuccessMessage();
  }

  // Afficher le message de succès
  function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #d1fae5;
      color: #065f46;
      padding: 15px 20px;
      border: 1px solid #10b981;
      border-radius: 10px;
      z-index: 10001;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      max-width: 300px;
    `;
    
    successDiv.innerHTML = `
      <h4 style="margin: 0 0 10px 0;">✅ Commande reçue!</h4>
      <p style="margin: 0; font-size: 14px;">
        Votre demande a été enregistrée.<br>
        Vous serez contacté pour confirmation.
      </p>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 5000);
  }

  // Injecter le bouton COD
  function injectCODButton() {
    if (!isProductPage()) {
      console.log('❌ Pas une page produit, arrêt du script');
      return;
    }

    console.log('✅ Page produit détectée');

    // Éviter les doublons
    if (document.getElementById(CONFIG.BUTTON_ID)) {
      console.log('⚠️ Bouton COD déjà présent');
      return;
    }

    // Chercher où injecter le bouton
    const addToCartForm = document.querySelector('form[action*="/cart/add"]');
    const addToCartButton = document.querySelector('[name="add"], .btn-cart, .add-to-cart');
    const productForm = document.querySelector('.product-form');
    
    const codButton = createCODButton();
    
    if (addToCartForm) {
      addToCartForm.appendChild(codButton);
      console.log('✅ Bouton COD injecté dans le formulaire');
    } else if (addToCartButton && addToCartButton.parentNode) {
      addToCartButton.parentNode.insertBefore(codButton, addToCartButton.nextSibling);
      console.log('✅ Bouton COD injecté après le bouton d\'ajout');
    } else if (productForm) {
      productForm.appendChild(codButton);
      console.log('✅ Bouton COD injecté dans product-form');
    } else {
      // Dernier recours : après le premier bouton trouvé
      const firstButton = document.querySelector('button');
      if (firstButton && firstButton.parentNode) {
        firstButton.parentNode.insertBefore(codButton, firstButton.nextSibling);
        console.log('✅ Bouton COD injecté (position de secours)');
      } else {
        console.log('❌ Impossible de trouver un endroit pour injecter le bouton');
      }
    }
  }

  // Initialisation
  function init() {
    console.log('🔄 Initialisation RT COD BOOST...');
    
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectCODButton);
    } else {
      injectCODButton();
    }

    // Observer les changements (pour les SPA)
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        if (!document.getElementById(CONFIG.BUTTON_ID)) {
          setTimeout(injectCODButton, 1000);
        }
      });
      
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
    }
  }

  // Démarrer
  init();

})();