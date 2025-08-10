(function() {
  'use strict';

  console.log('🚀 RT COD BOOST Widget Loading...');

  // Configuration
  const CONFIG = {
    formId: 'rt-cod-form',
    apiEndpoint: '/apps/rt-cod-boost-2-0/api/cod-submit', // Utilise le proxy Shopify
    debug: true
  };

  // Styles CSS injectés
  const WIDGET_STYLES = `
    .rt-cod-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 20px 0;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      border: 2px solid #e5e7eb;
      overflow: hidden;
      animation: slideInUp 0.5s ease-out;
    }
    
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .rt-cod-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
    }
    
    .rt-cod-header h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: bold;
    }
    
    .rt-cod-body {
      padding: 24px;
    }
    
    .rt-cod-field {
      margin-bottom: 16px;
    }
    
    .rt-cod-field label {
      display: block;
      margin-bottom: 6px;
      color: #374151;
      font-weight: 600;
      font-size: 14px;
    }
    
    .rt-cod-field input,
    .rt-cod-field select,
    .rt-cod-field textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }
    
    .rt-cod-field input:focus,
    .rt-cod-field select:focus,
    .rt-cod-field textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .rt-cod-submit {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 8px;
    }
    
    .rt-cod-submit:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }
    
    .rt-cod-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .rt-cod-error {
      color: #dc2626;
      font-size: 12px;
      margin-top: 4px;
    }
    
    .rt-cod-success {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      color: #059669;
      padding: 20px;
      text-align: center;
      font-weight: bold;
      border-radius: 12px;
      margin: 16px 0;
    }
    
    .rt-cod-order-summary {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid rgba(59, 130, 246, 0.2);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    
    .rt-cod-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    @media (max-width: 640px) {
      .rt-cod-grid {
        grid-template-columns: 1fr;
      }
      .rt-cod-body {
        padding: 16px;
      }
    }
  `;

  // Villes par wilaya (exemple)
  const WILAYAS = {
    'Alger': ['Alger Centre', 'Bab El Oued', 'Birtouta', 'Cheraga', 'Draria'],
    'Oran': ['Oran Centre', 'Es Senia', 'Bir El Djir', 'Hassi Bounif'],
    'Constantine': ['Constantine Centre', 'El Khroub', 'Hamma Bouziane'],
    'Annaba': ['Annaba Centre', 'Sidi Amar', 'El Bouni'],
    'Sétif': ['Sétif Centre', 'El Eulma', 'Béni Ourtilane']
  };

  // Injecter les styles
  function injectStyles() {
    if (document.getElementById('rt-cod-styles')) return;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'rt-cod-styles';
    styleSheet.textContent = WIDGET_STYLES;
    document.head.appendChild(styleSheet);
  }

  // Détecter le contexte de la page
  function detectPageContext() {
    const isProduct = !!(
      document.querySelector('[data-product-id]') ||
      window.location.pathname.includes('/products/') ||
      document.querySelector('.product-form, .product') ||
      window.ShopifyAnalytics?.meta?.product
    );
    
    const isCart = !!(
      window.location.pathname.includes('/cart') ||
      document.querySelector('.cart, [data-cart]')
    );
    
    return { isProduct, isCart };
  }

  // Obtenir les infos produit
  function getProductInfo() {
    const productMeta = window.ShopifyAnalytics?.meta?.product;
    
    if (productMeta) {
      return {
        id: productMeta.id,
        title: productMeta.title,
        price: productMeta.price / 100, // Shopify price is in cents
        vendor: productMeta.vendor
      };
    }
    
    // Fallback: essayer de récupérer depuis le DOM
    const titleEl = document.querySelector('h1, .product-title, [data-product-title]');
    const priceEl = document.querySelector('.price, [data-price], .product-price');
    const idEl = document.querySelector('[data-product-id]');
    
    return {
      id: idEl?.getAttribute('data-product-id') || 'unknown',
      title: titleEl?.textContent?.trim() || 'Produit',
      price: parseFloat(priceEl?.textContent?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
      vendor: ''
    };
  }

  // Créer le formulaire
  function createForm() {
    const product = getProductInfo();
    
    return `
      <div class="rt-cod-widget" id="${CONFIG.formId}">
        <div class="rt-cod-header">
          <h3>🛍️ Commande Express - Paiement à la livraison</h3>
        </div>
        
        <div class="rt-cod-body">
          <div class="rt-cod-order-summary">
            <div style="font-weight: bold; margin-bottom: 8px;">📦 Produit sélectionné</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>${product.title}</span>
              <span style="font-weight: bold; color: #059669;">${product.price.toFixed(2)} DA</span>
            </div>
          </div>
          
          <form id="rt-cod-form-element">
            <div class="rt-cod-grid">
              <div class="rt-cod-field">
                <label for="rt-name">Nom complet *</label>
                <input type="text" id="rt-name" name="customerName" required>
                <div class="rt-cod-error" id="rt-name-error"></div>
              </div>
              
              <div class="rt-cod-field">
                <label for="rt-phone">Téléphone *</label>
                <input type="tel" id="rt-phone" name="customerPhone" required placeholder="06 XX XX XX XX">
                <div class="rt-cod-error" id="rt-phone-error"></div>
              </div>
            </div>
            
            <div class="rt-cod-grid">
              <div class="rt-cod-field">
                <label for="rt-wilaya">Wilaya *</label>
                <select id="rt-wilaya" name="customerWilaya" required>
                  <option value="">Choisir une wilaya</option>
                  ${Object.keys(WILAYAS).map(w => `<option value="${w}">${w}</option>`).join('')}
                </select>
                <div class="rt-cod-error" id="rt-wilaya-error"></div>
              </div>
              
              <div class="rt-cod-field">
                <label for="rt-city">Ville *</label>
                <select id="rt-city" name="customerCity" required disabled>
                  <option value="">Choisir d'abord une wilaya</option>
                </select>
                <div class="rt-cod-error" id="rt-city-error"></div>
              </div>
            </div>
            
            <div class="rt-cod-field">
              <label for="rt-address">Adresse complète *</label>
              <textarea id="rt-address" name="customerAddress" required rows="2" 
                       placeholder="Numéro, rue, quartier..."></textarea>
              <div class="rt-cod-error" id="rt-address-error"></div>
            </div>
            
            <input type="hidden" name="productId" value="${product.id}">
            <input type="hidden" name="productTitle" value="${product.title}">
            <input type="hidden" name="productPrice" value="${product.price}">
            <input type="hidden" name="totalAmount" value="${product.price}">
            
            <button type="submit" class="rt-cod-submit" id="rt-submit">
              Confirmer la commande - ${product.price.toFixed(2)} DA 🛒
            </button>
          </form>
          
          <div id="rt-messages"></div>
        </div>
      </div>
    `;
  }

  // Gérer le changement de wilaya
  function handleWilayaChange() {
    const wilayaSelect = document.getElementById('rt-wilaya');
    const citySelect = document.getElementById('rt-city');
    
    if (!wilayaSelect || !citySelect) return;
    
    wilayaSelect.addEventListener('change', function() {
      const selectedWilaya = this.value;
      citySelect.innerHTML = '<option value="">Choisir une ville</option>';
      
      if (selectedWilaya && WILAYAS[selectedWilaya]) {
        citySelect.disabled = false;
        WILAYAS[selectedWilaya].forEach(city => {
          const option = document.createElement('option');
          option.value = city;
          option.textContent = city;
          citySelect.appendChild(option);
        });
      } else {
        citySelect.disabled = true;
      }
    });
  }

  // Validation
  function validateForm(formData) {
    const errors = {};
    
    if (!formData.get('customerName')?.trim()) {
      errors.name = 'Le nom est requis';
    }
    
    const phone = formData.get('customerPhone')?.trim();
    if (!phone) {
      errors.phone = 'Le téléphone est requis';
    } else if (!/^[0-9\s\-\+\(\)]{8,}$/.test(phone)) {
      errors.phone = 'Format invalide';
    }
    
    if (!formData.get('customerWilaya')) {
      errors.wilaya = 'Choisissez une wilaya';
    }
    
    if (!formData.get('customerCity')) {
      errors.city = 'Choisissez une ville';
    }
    
    if (!formData.get('customerAddress')?.trim()) {
      errors.address = 'L\'adresse est requise';
    }
    
    return errors;
  }

  // Attacher les événements
  function attachEvents() {
    const form = document.getElementById('rt-cod-form-element');
    const submitBtn = document.getElementById('rt-submit');
    
    if (!form || !submitBtn) return;
    
    handleWilayaChange();
    
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Traitement...';
      
      // Reset errors
      document.querySelectorAll('.rt-cod-error').forEach(el => el.textContent = '');
      
      const formData = new FormData(form);
      const errors = validateForm(formData);
      
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => {
          const errorEl = document.getElementById(`rt-${field}-error`);
          if (errorEl) errorEl.textContent = message;
        });
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmer la commande';
        return;
      }
      
      try {
        const response = await fetch(CONFIG.apiEndpoint, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          document.getElementById('rt-messages').innerHTML = `
            <div class="rt-cod-success">
              ✅ Commande confirmée !<br>
              Numéro: ${result.orderNumber}<br>
              Vous serez contacté sous peu.
            </div>
          `;
          form.style.display = 'none';
        } else {
          throw new Error(result.error || 'Erreur de commande');
        }
        
      } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('rt-messages').innerHTML = `
          <div style="background: #fef2f2; color: #dc2626; padding: 16px; border-radius: 8px; text-align: center;">
            ❌ ${error.message}
          </div>
        `;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmer la commande';
      }
    });
  }

  // Injecter le formulaire
  function injectForm() {
    if (document.getElementById(CONFIG.formId)) return; // Déjà présent
    
    const { isProduct, isCart } = detectPageContext();
    if (!isProduct && !isCart) return;
    
    let target;
    
    if (isProduct) {
      target = document.querySelector('.product-form, [data-product-form], .add-to-cart-form, .product-info');
    } else if (isCart) {
      target = document.querySelector('.cart-items, .cart-footer, .cart-content');
    }
    
    if (!target) {
      target = document.querySelector('main, .main-content, .container');
    }
    
    if (target) {
      const container = document.createElement('div');
      container.innerHTML = createForm();
      
      target.parentNode.insertBefore(container, target.nextSibling);
      
      // Attacher les événements après insertion
      setTimeout(attachEvents, 100);
    }
  }

  // Initialisation
  function init() {
    if (CONFIG.debug) console.log('🎯 RT COD Widget Init');
    
    injectStyles();
    
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // Délai pour laisser Shopify se charger
    setTimeout(injectForm, 1500);
  }

  init();
})();