// RT COD BOOST 2.0 - Script d'injection formulaire COD
console.log('🚀 RT COD Script chargé!');

(function() {
  'use strict';
  
  // Vérifier si on est sur une page produit
  function isProductPage() {
    return window.location.pathname.includes('/products/') || 
           document.querySelector('.product-single') ||
           document.querySelector('[data-section-type="product"]') ||
           document.querySelector('.product-form') ||
           document.querySelector('.shopify-product-form');
  }
  
  // Créer le bouton COD
  function createCodButton() {
    const button = document.createElement('button');
    button.id = 'rt-cod-button';
    button.innerHTML = '🚚 Commander à la livraison';
    button.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 25px;
      margin: 15px 0;
      border-radius: 12px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      width: 100%;
      transition: all 0.3s ease;
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    button.addEventListener('mouseover', function() {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.4)';
    });
    
    button.addEventListener('mouseout', function() {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
    });
    
    button.addEventListener('click', function(e) {
      e.preventDefault();
      openCodModal();
    });
    
    return button;
  }
  
  // Créer la modal COD
  function createCodModal() {
    // Éviter les doublons
    if (document.getElementById('rt-cod-modal')) {
      return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'rt-cod-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 20px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    `;
    
    // Animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-50px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    document.head.appendChild(style);
    
    // Récupérer les infos du produit
    const productTitle = getProductTitle();
    const productPrice = getProductPrice();
    const productImage = getProductImage();
    
    modalContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 25px;">
        ${productImage ? `<img src="${productImage}" alt="${productTitle}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px; margin-bottom: 15px;">` : ''}
        <h2 style="color: #1e293b; margin: 0 0 10px 0; font-size: 1.8rem; font-weight: bold;">🚚 Commande à la livraison</h2>
        <p style="color: #667eea; margin: 0; font-weight: 600; font-size: 1.1rem;">${productTitle}</p>
        ${productPrice ? `<p style="color: #10b981; font-size: 1.4rem; font-weight: bold; margin: 10px 0;">${productPrice}</p>` : ''}
      </div>
      
      <form id="cod-form" style="display: flex; flex-direction: column; gap: 15px;">
        
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151; font-size: 14px;">Nom complet *</label>
          <input type="text" name="customer_name" required 
                 style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 15px; transition: border-color 0.3s ease;"
                 placeholder="Votre nom complet"
                 onfocus="this.style.borderColor='#667eea'"
                 onblur="this.style.borderColor='#e5e7eb'">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151; font-size: 14px;">Téléphone *</label>
          <input type="tel" name="customer_phone" required 
                 style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 15px; transition: border-color 0.3s ease;"
                 placeholder="06XXXXXXXX"
                 onfocus="this.style.borderColor='#667eea'"
                 onblur="this.style.borderColor='#e5e7eb'">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151; font-size: 14px;">Ville *</label>
          <select name="customer_city" required 
                  style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 15px; cursor: pointer; background: white;"
                  onfocus="this.style.borderColor='#667eea'"
                  onblur="this.style.borderColor='#e5e7eb'">
            <option value="">Choisir votre ville</option>
            <option value="Casablanca">Casablanca</option>
            <option value="Rabat">Rabat</option>
            <option value="Marrakech">Marrakech</option>
            <option value="Fès">Fès</option>
            <option value="Tanger">Tanger</option>
            <option value="Agadir">Agadir</option>
            <option value="Meknès">Meknès</option>
            <option value="Oujda">Oujda</option>
            <option value="Kenitra">Kenitra</option>
            <option value="Tétouan">Tétouan</option>
            <option value="Salé">Salé</option>
            <option value="Autre">Autre ville</option>
          </select>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151; font-size: 14px;">Adresse complète *</label>
          <textarea name="customer_address" required rows="3"
                    style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 15px; resize: vertical; font-family: inherit; transition: border-color 0.3s ease;"
                    placeholder="Adresse complète avec numéro, rue, quartier..."
                    onfocus="this.style.borderColor='#667eea'"
                    onblur="this.style.borderColor='#e5e7eb'"></textarea>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151; font-size: 14px;">Quantité</label>
          <input type="number" name="quantity" value="1" min="1" max="10"
                 style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 15px; transition: border-color 0.3s ease;"
                 onfocus="this.style.borderColor='#667eea'"
                 onblur="this.style.borderColor='#e5e7eb'">
        </div>
        
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid rgba(59, 130, 246, 0.1);">
          <h4 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px; font-weight: bold;">📋 Informations de livraison</h4>
          <div style="display: flex; flex-direction: column; gap: 8px; color: #475569; font-size: 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>🚚</span>
              <span><strong>Livraison :</strong> Sous 24-48h ouvrables</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>💰</span>
              <span><strong>Paiement :</strong> À la livraison en espèces</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>📞</span>
              <span><strong>Confirmation :</strong> Nous vous appellerons</span>
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 12px; margin-top: 25px;">
          <button type="button" onclick="closeCodModal()" 
                  style="flex: 1; padding: 15px; border: 2px solid #e5e7eb; background: white; color: #6b7280; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s ease;"
                  onmouseover="this.style.background='#f9fafb'; this.style.borderColor='#d1d5db'"
                  onmouseout="this.style.background='white'; this.style.borderColor='#e5e7eb'">
            Annuler
          </button>
          <button type="submit" 
                  style="flex: 2; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3); transition: all 0.3s ease;"
                  onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(102, 126, 234, 0.4)'"
                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(102, 126, 234, 0.3)'">
            🛒 Confirmer ma commande
          </button>
        </div>
        
      </form>
      
      <button onclick="closeCodModal()" 
              style="position: absolute; top: 15px; right: 20px; background: rgba(107, 114, 128, 0.1); border: none; width: 35px; height: 35px; border-radius: 50%; font-size: 20px; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;"
              onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444'"
              onmouseout="this.style.background='rgba(107, 114, 128, 0.1)'; this.style.color='#6b7280'">
        ×
      </button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Gérer la soumission du formulaire
    const form = modal.querySelector('#cod-form');
    form.addEventListener('submit', handleCodSubmit);
    
    // Fermer en cliquant sur le fond
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeCodModal();
      }
    });
  }
  
  // Fonctions utilitaires pour récupérer les infos produit
  function getProductTitle() {
    const selectors = [
      'h1[itemprop="name"]',
      '.product-single__title',
      '.product__title',
      '.product-title',
      'h1.product-meta__title',
      'h1'
    ];
    
    for (let selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return 'Produit sélectionné';
  }
  
  function getProductPrice() {
    const selectors = [
      '.price--current',
      '.product-price',
      '.price',
      '[data-price]',
      '.money',
      '.product__price',
      '.product-single__price'
    ];
    
    for (let selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return null;
  }
  
  function getProductImage() {
    const selectors = [
      '.product__media img',
      '.product-single__media img',
      '.product-featured-media img',
      '.product-images img'
    ];
    
    for (let selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.src) {
        return element.src;
      }
    }
    return null;
  }
  
  // Ouvrir la modal
  window.openCodModal = function() {
    const modal = document.getElementById('rt-cod-modal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // Empêcher le scroll
    }
  };
  
  // Fermer la modal
  window.closeCodModal = function() {
    const modal = document.getElementById('rt-cod-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto'; // Rétablir le scroll
    }
  };
  
  // Gérer la soumission du formulaire
  function handleCodSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const orderData = Object.fromEntries(formData);
    
    // Validation simple
    if (!orderData.customer_name || !orderData.customer_phone || !orderData.customer_city || !orderData.customer_address) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Ajouter les infos du produit
    orderData.product_title = getProductTitle();
    orderData.product_url = window.location.href;
    orderData.product_price = getProductPrice();
    orderData.timestamp = new Date().toISOString();
    
    console.log('📦 Données commande COD:', orderData);
    
    // Animation du bouton
    const submitButton = e.target.querySelector('[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '⏳ Envoi en cours...';
    submitButton.disabled = true;
    submitButton.style.opacity = '0.7';
    
    // Simuler l'envoi (à remplacer par l'API réelle plus tard)
    setTimeout(() => {
      // Succès
      submitButton.innerHTML = '✅ Commande envoyée !';
      submitButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      
      setTimeout(() => {
        alert('✅ Commande envoyée avec succès !\n\nNous vous appellerons dans les plus brefs délais pour confirmer votre commande.\n\nMerci de votre confiance ! 🙏');
        closeCodModal();
        
        // Remettre le bouton à l'état normal
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        submitButton.style.opacity = '1';
        submitButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        e.target.reset();
      }, 1500);
    }, 2000);
  }
  
  // Initialiser le script
  function initCodScript() {
    if (!isProductPage()) {
      console.log('❌ Pas une page produit, script COD non chargé');
      return;
    }
    
    console.log('✅ Page produit détectée, chargement du COD');
    
    // Éviter les doublons
    if (document.getElementById('rt-cod-button')) {
      console.log('⚠️ Bouton COD déjà présent');
      return;
    }
    
    // Créer la modal
    createCodModal();
    
    // Trouver où insérer le bouton
    const insertionSelectors = [
      '.product-form__buttons',
      '.product-form__cart',
      '.product-form',
      '.shopify-product-form',
      '.product-single__meta',
      '.product__form',
      '.product-meta',
      '[name="add"]'
    ];
    
    let insertionPoint = null;
    
    for (let selector of insertionSelectors) {
      if (selector === '[name="add"]') {
        const addButton = document.querySelector(selector);
        if (addButton) {
          insertionPoint = addButton.parentNode;
          break;
        }
      } else {
        const element = document.querySelector(selector);
        if (element) {
          insertionPoint = element;
          break;
        }
      }
    }
    
    if (insertionPoint) {
      const codButton = createCodButton();
      insertionPoint.appendChild(codButton);
      console.log('✅ Bouton COD ajouté avec succès !');
    } else {
      console.warn('⚠️ Point d\'insertion non trouvé, tentative sur le body');
      // Fallback : ajouter en bas de la page
      const codButton = createCodButton();
      codButton.style.position = 'fixed';
      codButton.style.bottom = '20px';
      codButton.style.left = '50%';
      codButton.style.transform = 'translateX(-50%)';
      codButton.style.width = '300px';
      codButton.style.zIndex = '9999';
      document.body.appendChild(codButton);
      console.log('✅ Bouton COD ajouté en position fixe !');
    }
  }
  
  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCodScript);
  } else {
    // DOM déjà prêt, attendre un peu pour les thèmes dynamiques
    setTimeout(initCodScript, 1000);
  }
  
  // Observer les changements dynamiques (pour les thèmes AJAX)
  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      let shouldReinit = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (let node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
              if (node.classList && (node.classList.contains('product') || 
                  node.querySelector && node.querySelector('.product-form'))) {
                shouldReinit = true;
                break;
              }
            }
          }
        }
      });
      
      if (shouldReinit) {
        setTimeout(initCodScript, 500);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
})();