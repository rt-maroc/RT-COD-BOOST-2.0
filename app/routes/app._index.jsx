import { useState, useEffect } from 'react';
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    return json({ shop: session.shop });
  } catch (error) {
    return json({ shop: null });
  }
};
export const action = async ({ request }) => {
  const formData = await request.formData();
  const actionType = formData.get("action");
  
  if (actionType === "activate") {
    try {
      console.log('🚀 Activation via formulaire Remix');
      
      const { admin, session } = await authenticate.admin(request);
      
      console.log('✅ Auth Remix réussie pour:', session.shop);
      
      const isActive = formData.get("isActive") === "true";
      
      if (isActive) {
        const scriptTag = new admin.rest.resources.ScriptTag({ session });
        scriptTag.event = 'onload';
        scriptTag.src = 'https://rt-cod-boost-2-0.onrender.com/cod-form.js';
        scriptTag.display_scope = 'online_store';
        
        await scriptTag.save({ update: true });
        
        console.log('✅ Script Tag créé avec ID:', scriptTag.id);
        
        await db.cod_settings.upsert({
          where: { shop: session.shop },
          update: {
            isActive: true,
            scriptTagId: scriptTag.id.toString(),
            updatedAt: new Date()
          },
          create: {
            shop: session.shop,
            isActive: true,
            scriptTagId: scriptTag.id.toString(),
            totalOrders: 0,
            totalRevenue: 0
          }
        });
        
        return json({ 
          success: true, 
          message: "Application activée avec succès !",
          scriptTagId: scriptTag.id 
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur activation:', error);
      return json({ 
        success: false, 
        message: "Erreur: " + error.message 
      }, { status: 500 });
    }
  }
  
  return json({ success: false, message: "Action inconnue" });
};
export default function RTCodBoostDashboard() {
  // États de navigation et language
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [language, setLanguage] = useState('francais');
  
  // États pour les tarifs de livraison
  const [deliveryRates, setDeliveryRates] = useState([
    { id: 1, country: 'Algerie', zone: 'Centre', price: 500, active: true },
    { id: 2, country: 'Algerie', zone: 'Est', price: 600, active: true },
    { id: 3, country: 'Algerie', zone: 'Ouest', price: 650, active: true },
    { id: 4, country: 'Algerie', zone: 'Sud', price: 800, active: true }
  ]);
  const [showAddRate, setShowAddRate] = useState(false);
  const [newRate, setNewRate] = useState({ country: '', zone: '', price: '', active: true });
  
  // États pour les commandes
  const [orders, setOrders] = useState([
    { 
      id: 'RT001', 
      client: 'Ahmed Benali', 
      phone: '0555123456', 
      email: 'ahmed@example.com',
      product: 'Smartphone Samsung', 
      wilaya: 'Alger',
      commune: 'Bab El Oued',
      address: '123 Rue Didouche Mourad',
      status: 'En attente', 
      amount: 45000, 
      deliveryFee: 500,
      date: '2025-01-15',
      source: 'Facebook',
      notes: ''
    },
    { 
      id: 'RT002', 
      client: 'Fatima Kaci', 
      phone: '0661789012',
      email: 'fatima@example.com', 
      product: 'Casque Bluetooth', 
      wilaya: 'Oran',
      commune: 'Es Senia',
      address: '45 Boulevard de la Soummam',
      status: 'Confirme', 
      amount: 8500,
      deliveryFee: 600, 
      date: '2025-01-14',
      source: 'Instagram',
      notes: 'Client fidèle'
    },
    { 
      id: 'RT003', 
      client: 'Mohamed Tahir', 
      phone: '0777345678',
      email: 'mohamed@example.com', 
      product: 'Montre connectee', 
      wilaya: 'Constantine',
      commune: 'El Khroub',
      address: '78 Avenue de la République',
      status: 'Expedie', 
      amount: 25000,
      deliveryFee: 650, 
      date: '2025-01-13',
      source: 'Site Web',
      notes: 'Livraison express demandée'
    },
    { 
      id: 'RT004', 
      client: 'Amina Saidi', 
      phone: '0698456789',
      email: 'amina@example.com', 
      product: 'Ecouteurs sans fil', 
      wilaya: 'Setif',
      commune: 'Centre',
      address: '12 Rue de la Liberté',
      status: 'Livre', 
      amount: 12000,
      deliveryFee: 600, 
      date: '2025-01-12',
      source: 'WhatsApp',
      notes: ''
    },
    { 
      id: 'RT005', 
      client: 'Yacine Brahimi', 
      phone: '0555987654',
      email: 'yacine@example.com', 
      product: 'Tablette iPad', 
      wilaya: 'Annaba',
      commune: 'Sidi Amar',
      address: '89 Boulevard Victor Hugo',
      status: 'Annule', 
      amount: 85000,
      deliveryFee: 650, 
      date: '2025-01-11',
      source: 'Facebook',
      notes: 'Client injoignable'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wilayaFilter, setWilayaFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // États pour la sélection de pays
  const [selectedCountries, setSelectedCountries] = useState(['Morocco']);
  const [enableMultiCountry, setEnableMultiCountry] = useState(false);

  const availableCountries = [
    { code: 'MA', name: 'Morocco', flag: '🇲🇦', currency: 'MAD' },
    { code: 'DZ', name: 'Algeria', flag: '🇩🇿', currency: 'DZD' },
    { code: 'TN', name: 'Tunisia', flag: '🇹🇳', currency: 'TND' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED' },
    { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR' }
  ];

  // États pour le concepteur de formulaire
  const [formType, setFormType] = useState('integrated');
  const [rtlSupport, setRtlSupport] = useState(true);
  const [textColor, setTextColor] = useState('#000000');
  const [borderRadius, setBorderRadius] = useState(4);
  const [previewMode, setPreviewMode] = useState(false);
  const [showMultipleCountries, setShowMultipleCountries] = useState(false);
  
  // États Google Sheets pour page commandes
  const [googleSheetConnected, setGoogleSheetConnected] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [showSheetConfig, setShowSheetConfig] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // États pour les paramètres
  const [activeTab, setActiveTab] = useState('visibility');
  const [showOnProducts, setShowOnProducts] = useState(true);
  const [showOnCart, setShowOnCart] = useState(true);

  // Animation states
  const [mounted, setMounted] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [formFields] = useState([
    { id: 1, name: 'CODES DE RÉDUCTION', type: 'discount', visible: true, required: false },
    { id: 2, name: 'Prénom', type: 'text', visible: true, required: true },
    { id: 3, name: 'Nom de famille', type: 'text', visible: true, required: true },
    { id: 4, name: 'Téléphone', type: 'tel', visible: true, required: true },
    { id: 5, name: 'Adresse', type: 'text', visible: true, required: true },
    { id: 6, name: 'Ville', type: 'text', visible: true, required: true },
    { id: 7, name: 'Province', type: 'text', visible: true, required: true },
    { id: 8, name: 'Code postal', type: 'text', visible: true, required: false },
    { id: 9, name: 'E-mail', type: 'email', visible: true, required: false },
    { id: 10, name: 'RÉSUMÉ DE LA COMMANDE', type: 'summary', visible: true, required: false }
  ]);

  // Fonctions utilitaires
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-DZ', { 
      style: 'currency', 
      currency: 'DZD', 
      minimumFractionDigits: 0
    }).format(price).replace('DZD', 'DA');
  };

  const getStatusColor = (status) => {
    const colors = {
      'En attente': '#f59e0b',
      'Confirme': '#10b981', 
      'Expedie': '#3b82f6',
      'Livre': '#059669',
      'Annule': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'En attente': '⏳',
      'Confirme': '✅', 
      'Expedie': '📦',
      'Livre': '🎯',
      'Annule': '❌'
    };
    return icons[status] || '📋';
  };

  // Gestion des tarifs de livraison
  // Page Tarifs de livraison
const DeliveryRates = () => {
  const [selectedCity, setSelectedCity] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRate, setShowAddRate] = useState(false);
  
  // Liste vide - l'admin ajoute ses propres villes/pays
  const [deliveryRates, setDeliveryRates] = useState([]);
  
  const [newRate, setNewRate] = useState({
    country: '',
    zone: '',
    price: '',
    active: true
  });

  const addDeliveryRate = () => {
    if (newRate.country && newRate.zone && newRate.price) {
      const rate = {
        id: Date.now(),
        country: newRate.country,
        zone: newRate.zone,
        price: parseInt(newRate.price),
        active: newRate.active
      };
      setDeliveryRates(prev => [...prev, rate]);
      setNewRate({ country: '', zone: '', price: '', active: true });
      setShowAddRate(false);
    }
  };

  const deleteRate = (id) => {
    setDeliveryRates(prev => prev.filter(rate => rate.id !== id));
  };

  const toggleRateStatus = (id) => {
    setDeliveryRates(prev => prev.map(rate =>
      rate.id === id ? { ...rate, active: !rate.active } : rate
    ));
  };

  const filteredRates = deliveryRates.filter(rate =>
    rate.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistiques
  const stats = {
    totalCities: deliveryRates.length,
    activeCities: deliveryRates.filter(r => r.active).length,
    averageRate: deliveryRates.length > 0 ? Math.round(deliveryRates.reduce((acc, r) => acc + r.price, 0) / deliveryRates.length) : 0,
    minRate: deliveryRates.length > 0 ? Math.min(...deliveryRates.map(r => r.price)) : 0,
    maxRate: deliveryRates.length > 0 ? Math.max(...deliveryRates.map(r => r.price)) : 0
  };

  return (
    <div style={{ 
      padding: '2rem', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: '3rem',
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '30px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(20px)'
        }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '900', 
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '2px',
            lineHeight: '1.5',
            minHeight: '80px'
          }}>
            🚚 Tarifs d'Expedition
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.3rem' }}>
            Gerez vos tarifs de livraison par zone
          </p>
        </div>

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[
            { label: 'Total Zones', value: stats.totalCities, icon: '🌍', color: '#667eea' },
            { label: 'Actives', value: stats.activeCities, icon: '✅', color: '#10b981' },
            { label: 'Tarif Moyen', value: stats.averageRate > 0 ? stats.averageRate : '-', icon: '💰', color: '#f59e0b' },
            { label: 'Min - Max', value: stats.totalCities > 0 ? `${stats.minRate}-${stats.maxRate}` : '-', icon: '📊', color: '#ef4444' }
          ].map((stat, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {stat.label}
                  </p>
                  <p style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: 'bold', 
                    color: stat.color,
                    lineHeight: '1.2'
                  }}>
                    {stat.value}
                  </p>
                </div>
                <span style={{ fontSize: '2.5rem' }}>{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Rate Section */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '1.5rem'
          }}>
            ➕ Ajouter un nouveau tarif
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: '1rem',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b' }}>
                Pays / Region
              </label>
              <input
                type="text"
                value={newRate.country}
                onChange={(e) => setNewRate({...newRate, country: e.target.value})}
                placeholder="Ex: France, USA..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b' }}>
                Zone / Ville
              </label>
              <input
                type="text"
                value={newRate.zone}
                onChange={(e) => setNewRate({...newRate, zone: e.target.value})}
                placeholder="Ex: Paris, New York..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b' }}>
                Tarif
              </label>
              <input
                type="number"
                value={newRate.price}
                onChange={(e) => setNewRate({...newRate, price: e.target.value})}
                placeholder="Ex: 10"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <button
              onClick={addDeliveryRate}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(16,185,129,0.3)'
              }}
            >
              Ajouter
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un pays ou une zone..."
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              fontSize: '1rem',
              outline: 'none',
              background: '#f3f4f6',
              borderRadius: '10px'
            }}
          />
        </div>

        {/* Rates Table */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '2rem'
          }}>
            Liste des tarifs
          </h3>
          
          {filteredRates.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b' }}>Pays</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b' }}>Zone</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b' }}>Tarif</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: '#64748b' }}>Statut</th>
                  <th style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((rate) => (
                  <tr key={rate.id} style={{ background: '#f9fafb', borderRadius: '10px' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{rate.country}</td>
                    <td style={{ padding: '1rem' }}>{rate.zone}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#667eea', fontSize: '1.1rem' }}>
                        {rate.price}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => toggleRateStatus(rate.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: rate.active ? 
                            'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                            'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {rate.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => deleteRate(rate.id)}
                        style={{
                          padding: '0.5rem',
                          background: '#fee2e2',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '1.2rem',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{
              padding: '4rem',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <p style={{ fontSize: '1.2rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Aucun tarif configure
              </p>
              <p style={{ fontSize: '1rem' }}>
                Commencez par ajouter vos premiers tarifs d'expedition ci-dessus
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

  // Gestion Google Sheets
  const handleSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('success');
      setLastSyncTime(new Date());
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 2000);
  };

  const connectGoogleSheet = () => {
    if (googleSheetUrl) {
      setGoogleSheetConnected(true);
      handleSync();
    }
  };

  // Filtrage des commandes
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesWilaya = wilayaFilter === 'all' || order.wilaya === wilayaFilter;
    
    return matchesSearch && matchesStatus && matchesWilaya;
  });

  // Gestion de la sélection multiple
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // Actions groupées
  const handleBulkStatusChange = (newStatus) => {
    setOrders(orders.map(order => 
      selectedOrders.includes(order.id) 
        ? { ...order, status: newStatus }
        : order
    ));
    setSelectedOrders([]);
  };

  // Calculs statistiques
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'En attente').length,
    confirmed: orders.filter(o => o.status === 'Confirme').length,
    shipped: orders.filter(o => o.status === 'Expedie').length,
    delivered: orders.filter(o => o.status === 'Livre').length,
    cancelled: orders.filter(o => o.status === 'Annule').length,
    revenue: orders.filter(o => o.status === 'Livre').reduce((sum, o) => sum + o.amount, 0)
  };

  // Wilayas uniques
  const uniqueWilayas = [...new Set(orders.map(o => o.wilaya))];

  // Navigation principale
  const Navigation = () => (
    <div style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 100
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '1rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center', 
        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ 
          color: 'white', 
          fontSize: '1.6rem', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>🚀</span>
          RT COD BOOST 2.0
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '0.5rem',
            borderRadius: '12px'
          }}>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{ 
                background: 'transparent', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                padding: '0.5rem',
                fontSize: '1rem'
              }}
            >
              <option value="francais" style={{ color: '#333' }}>🇫🇷 Français</option>
              <option value="arabe" style={{ color: '#333' }}>🇩🇿 العربية</option>
              <option value="english" style={{ color: '#333' }}>🇺🇸 English</option>
            </select>
          </div>
          <div style={{ 
            background: 'rgba(255,255,255,0.2)', 
            padding: '0.75rem', 
            borderRadius: '50%',
            cursor: 'pointer'
          }}>
            <div style={{ color: 'white', fontSize: '1.2rem' }}>👤</div>
          </div>
        </div>
      </div>
      
      <div style={{
        background: 'white', 
        borderBottom: '2px solid #e5e7eb', 
        padding: '0 1rem',
        display: 'flex', 
        gap: '0', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'form-builder', label: 'Concepteur', icon: '📝' },
          { id: 'delivery-rates', label: 'Tarifs', icon: '💰' },
          { id: 'orders', label: 'Commandes', icon: '📦' },
          { id: 'analytics', label: 'Analytics', icon: '📈' },
          { id: 'plans', label: 'Plans', icon: '💳' },
          { id: 'settings', label: 'Paramètres', icon: '⚙️' }
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setCurrentPage(item.id)} 
            style={{
              background: 'transparent', 
              color: currentPage === item.id ? '#667eea' : '#6b7280',
              border: 'none', 
              padding: '0.75rem 1rem',
              borderBottom: currentPage === item.id ? '3px solid #667eea' : '3px solid transparent',
              cursor: 'pointer', 
              fontWeight: currentPage === item.id ? 'bold' : 'normal',
              fontSize: '0.9rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

// 🆕 PAGE COMMANDES 
const Orders = () => {
  // États pour les commandes
  const [orders, setOrders] = useState([
    { 
      id: 'RT001', 
      client: 'Ahmed Benali', 
      phone: '0555123456', 
      email: 'ahmed@example.com',
      product: 'Smartphone Samsung', 
      wilaya: 'Alger',
      commune: 'Bab El Oued',
      address: '123 Rue Didouche Mourad',
      status: 'En attente', 
      amount: 45000, 
      deliveryFee: 500,
      date: '2025-01-15',
      source: 'Facebook',
      notes: '',
      trackingNumber: '',
      paymentMethod: 'COD'
    },
    { 
      id: 'RT002', 
      client: 'Fatima Kaci', 
      phone: '0661789012',
      email: 'fatima@example.com', 
      product: 'Casque Bluetooth', 
      wilaya: 'Oran',
      commune: 'Es Senia',
      address: '45 Boulevard de la Soummam',
      status: 'Confirme', 
      amount: 8500,
      deliveryFee: 600, 
      date: '2025-01-14',
      source: 'Instagram',
      notes: 'Client fidele',
      trackingNumber: 'TR123456789',
      paymentMethod: 'COD'
    },
    { 
      id: 'RT003', 
      client: 'Mohamed Tahir', 
      phone: '0777345678',
      email: 'mohamed@example.com', 
      product: 'Montre connectee', 
      wilaya: 'Constantine',
      commune: 'El Khroub',
      address: '78 Avenue de la Republique',
      status: 'Expedie', 
      amount: 25000,
      deliveryFee: 650, 
      date: '2025-01-13',
      source: 'Site Web',
      notes: 'Livraison express demandee',
      trackingNumber: 'TR987654321',
      paymentMethod: 'COD'
    },
    { 
      id: 'RT004', 
      client: 'Amina Saidi', 
      phone: '0698456789',
      email: 'amina@example.com', 
      product: 'Ecouteurs sans fil', 
      wilaya: 'Setif',
      commune: 'Centre',
      address: '12 Rue de la Liberte',
      status: 'Livre', 
      amount: 12000,
      deliveryFee: 600, 
      date: '2025-01-12',
      source: 'WhatsApp',
      notes: '',
      trackingNumber: 'TR456789123',
      paymentMethod: 'COD'
    },
    { 
      id: 'RT005', 
      client: 'Yacine Brahimi', 
      phone: '0555987654',
      email: 'yacine@example.com', 
      product: 'Tablette iPad', 
      wilaya: 'Annaba',
      commune: 'Sidi Amar',
      address: '89 Boulevard Victor Hugo',
      status: 'Annule', 
      amount: 85000,
      deliveryFee: 650, 
      date: '2025-01-11',
      source: 'Facebook',
      notes: 'Client injoignable',
      trackingNumber: '',
      paymentMethod: 'COD'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
  
  // États Google Sheets
  const [googleSheetConnected, setGoogleSheetConnected] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState('30'); // minutes

  // États pour l'export
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFields, setExportFields] = useState(['all']);

  // Nouvel ordre
  const [newOrder, setNewOrder] = useState({
    client: '',
    phone: '',
    email: '',
    product: '',
    wilaya: '',
    commune: '',
    address: '',
    amount: '',
    deliveryFee: '',
    source: 'Facebook',
    notes: '',
    paymentMethod: 'COD'
  });

  // Animation on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-sync avec Google Sheets
  useEffect(() => {
    if (autoSync && googleSheetConnected) {
      const interval = setInterval(() => {
        handleSync();
      }, parseInt(syncInterval) * 60000);
      return () => clearInterval(interval);
    }
  }, [autoSync, googleSheetConnected, syncInterval]);

  // Fonctions utilitaires
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStatusColor = (status) => {
    const colors = {
      'En attente': '#f59e0b',
      'Confirme': '#10b981', 
      'Expedie': '#3b82f6',
      'Livre': '#059669',
      'Annule': '#ef4444',
      'Retour': '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'En attente': '⏳',
      'Confirme': '✅', 
      'Expedie': '📦',
      'Livre': '🎯',
      'Annule': '❌',
      'Retour': '↩️'
    };
    return icons[status] || '📋';
  };

  const getSourceIcon = (source) => {
    const icons = {
      'Facebook': '📘',
      'Instagram': '📷',
      'WhatsApp': '💬',
      'Site Web': '🌐',
      'TikTok': '🎵',
      'Google': '🔍'
    };
    return icons[source] || '📱';
  };

  // Gestion Google Sheets
  const handleSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('success');
      setLastSyncTime(new Date());
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 2000);
  };

  const connectGoogleSheet = () => {
    if (googleSheetUrl) {
      setGoogleSheetConnected(true);
      handleSync();
    }
  };

  const disconnectGoogleSheet = () => {
    setGoogleSheetConnected(false);
    setGoogleSheetUrl('');
    setAutoSync(false);
  };

  // Filtrage des commandes
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || order.source === sourceFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.date);
      const today = new Date();
      if (dateFilter === 'today') {
        matchesDate = orderDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === 'month') {
        matchesDate = orderDate.getMonth() === today.getMonth();
      }
    }
    
    return matchesSearch && matchesStatus && matchesSource && matchesDate;
  });

  // Gestion de la sélection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // Actions groupées
  const handleBulkStatusChange = (newStatus) => {
    setOrders(orders.map(order => 
      selectedOrders.includes(order.id) 
        ? { ...order, status: newStatus }
        : order
    ));
    setSelectedOrders([]);
    setShowBulkActions(false);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Supprimer ${selectedOrders.length} commandes?`)) {
      setOrders(orders.filter(order => !selectedOrders.includes(order.id)));
      setSelectedOrders([]);
      setShowBulkActions(false);
    }
  };

  // Ajouter une commande
  const handleAddOrder = () => {
    const order = {
      ...newOrder,
      id: `RT${String(orders.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'En attente',
      amount: parseFloat(newOrder.amount),
      deliveryFee: parseFloat(newOrder.deliveryFee),
      trackingNumber: ''
    };
    setOrders([order, ...orders]);
    setShowAddOrderModal(false);
    setNewOrder({
      client: '',
      phone: '',
      email: '',
      product: '',
      wilaya: '',
      commune: '',
      address: '',
      amount: '',
      deliveryFee: '',
      source: 'Facebook',
      notes: '',
      paymentMethod: 'COD'
    });
  };

  // Statistiques
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'En attente').length,
    confirmed: orders.filter(o => o.status === 'Confirme').length,
    shipped: orders.filter(o => o.status === 'Expedie').length,
    delivered: orders.filter(o => o.status === 'Livre').length,
    cancelled: orders.filter(o => o.status === 'Annule').length,
    revenue: orders.filter(o => o.status === 'Livre').reduce((sum, o) => sum + o.amount + o.deliveryFee, 0),
    todayOrders: orders.filter(o => new Date(o.date).toDateString() === new Date().toDateString()).length,
    conversionRate: orders.length > 0 ? ((orders.filter(o => o.status === 'Livre').length / orders.length) * 100).toFixed(1) : 0
  };

  // Sources uniques
  const uniqueSources = [...new Set(orders.map(o => o.source))];

  return (
    <div style={{ 
      padding: '2rem', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh'
    }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .stats-card {
          animation: slideIn 0.5s ease-out;
          transition: all 0.3s ease;
        }
        .stats-card:hover {
          transform: translateY(-5px);
        }
        .order-row {
          animation: slideIn 0.3s ease-out;
          transition: all 0.2s ease;
        }
        .order-row:hover {
          transform: translateX(5px);
          background: rgba(102, 126, 234, 0.05);
        }
        .sync-animation {
          animation: pulse 1s infinite;
        }
      `}</style>

      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header avec titre et actions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '25px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <div>
              <h1 style={{
  fontSize: '2.5rem',
  fontWeight: 'bold',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: '0.5rem',
  lineHeight: '1.4',        // ✅ Améliore l'espacement vertical
  paddingTop: '0.5rem',     // ✅ Ajoute de l'espace en haut
  paddingBottom: '0.5rem',  // ✅ Ajoute de l'espace en bas
  minHeight: '3.5rem',      // ✅ Garantit une hauteur minimale
  display: 'flex',          // ✅ Pour un meilleur alignement
  alignItems: 'center'      // ✅ Centre verticalement le texte
}}>
  📦 Gestion des Commandes
</h1>
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                {orders.length} commandes au total • {stats.todayOrders} aujourd'hui
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Bouton Ajouter */}
              <button
                onClick={() => setShowAddOrderModal(true)}
                style={{
                  padding: '0.875rem 1.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>➕</span>
                Nouvelle Commande
              </button>
              
              {/* Bouton Import */}
              <button
                onClick={() => setShowImportModal(true)}
                style={{
                  padding: '0.875rem 1.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📥</span>
                Importer
              </button>
              
              {/* Bouton Export */}
              <button
                onClick={() => setShowExportModal(true)}
                style={{
                  padding: '0.875rem 1.5rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📤</span>
                Exporter
              </button>
            </div>
          </div>

          {/* Statistiques Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            {[
              { label: 'En attente', value: stats.pending, color: '#f59e0b', icon: '⏳' },
              { label: 'Confirmees', value: stats.confirmed, color: '#10b981', icon: '✅' },
              { label: 'Expediees', value: stats.shipped, color: '#3b82f6', icon: '📦' },
              { label: 'Livrees', value: stats.delivered, color: '#059669', icon: '🎯' },
              { label: 'Annulees', value: stats.cancelled, color: '#ef4444', icon: '❌' },
              { label: 'Conversion', value: `${stats.conversionRate}%`, color: '#8b5cf6', icon: '📈' }
            ].map((stat, idx) => (
              <div
                key={idx}
                className="stats-card"
                style={{
                  background: 'white',
                  borderRadius: '15px',
                  padding: '1.25rem',
                  border: `2px solid ${stat.color}20`,
                  boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  animationDelay: `${idx * 0.1}s`
                }}
                onClick={() => setStatusFilter(stat.label === 'Conversion' ? 'all' : stat.label)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      {stat.label}
                    </p>
                    <p style={{
                      fontSize: '1.8rem',
                      fontWeight: 'bold',
                      color: stat.color
                    }}>
                      {stat.value}
                    </p>
                  </div>
                  <span style={{ fontSize: '2rem', opacity: 0.8 }}>{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Google Sheets Integration */}
        <div style={{
          background: googleSheetConnected ? 
            'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 
            'white',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          border: googleSheetConnected ? '2px solid #10b981' : '2px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: googleSheetConnected ? 'white' : '#f3f4f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                📊
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginBottom: '0.25rem'
                }}>
                  Integration Google Sheets
                </h3>
                <p style={{
                  color: googleSheetConnected ? '#059669' : '#64748b',
                  fontSize: '0.9rem'
                }}>
                  {googleSheetConnected ? 
                    `Connecte • Derniere sync: ${lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Jamais'}` : 
                    'Synchronisez vos commandes automatiquement'}
                </p>
              </div>
            </div>
            
            {!googleSheetConnected ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="URL Google Sheet..."
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    width: '300px',
                    fontSize: '0.95rem'
                  }}
                />
                <button
                  onClick={connectGoogleSheet}
                  disabled={!googleSheetUrl}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: googleSheetUrl ? 
                      'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                      '#e5e7eb',
                    color: googleSheetUrl ? 'white' : '#94a3b8',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: googleSheetUrl ? 'pointer' : 'not-allowed'
                  }}
                >
                  Connecter
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {/* Auto-sync toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'white',
                  borderRadius: '8px'
                }}>
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#10b981'
                    }}
                  />
                  <label style={{ fontSize: '0.9rem', color: '#374151' }}>
                    Auto-sync
                  </label>
                  {autoSync && (
                    <select
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(e.target.value)}
                      style={{
                        padding: '0.25rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="5">5 min</option>
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="60">1h</option>
                    </select>
                  )}
                </div>
                
                <button
                  onClick={handleSync}
                  disabled={syncStatus === 'syncing'}
                  className={syncStatus === 'syncing' ? 'sync-animation' : ''}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#059669',
                    border: '2px solid #10b981',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>
                    {syncStatus === 'syncing' ? '🔄' : '🔃'}
                  </span>
                  {syncStatus === 'syncing' ? 'Synchronisation...' : 'Synchroniser'}
                </button>
                
                <button
                  onClick={disconnectGoogleSheet}
                  style={{
                    padding: '0.75rem',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Deconnecter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filtres et Recherche */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
            gap: '1rem',
            alignItems: 'center'
          }}>
            {/* Barre de recherche */}
            <div style={{
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.2rem'
              }}>
                🔍
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, ID, telephone, produit..."
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            
            {/* Filtre Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.875rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.95rem',
                cursor: 'pointer',
                background: 'white'
              }}
            >
              <option value="all">📋 Tous les statuts</option>
              <option value="En attente">⏳ En attente</option>
              <option value="Confirme">✅ Confirme</option>
              <option value="Expedie">📦 Expedie</option>
              <option value="Livre">🎯 Livre</option>
              <option value="Annule">❌ Annule</option>
            </select>
            
            {/* Filtre Source */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={{
                padding: '0.875rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.95rem',
                cursor: 'pointer',
                background: 'white'
              }}
            >
              <option value="all">🌐 Toutes les sources</option>
              {uniqueSources.map(source => (
                <option key={source} value={source}>
                  {getSourceIcon(source)} {source}
                </option>
              ))}
            </select>
            
            {/* Filtre Date */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '0.875rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.95rem',
                cursor: 'pointer',
                background: 'white'
              }}
            >
              <option value="all">📅 Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
            
            {/* Toggle View Mode */}
            <div style={{
              display: 'flex',
              background: '#f3f4f6',
              borderRadius: '10px',
              padding: '4px'
            }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '0.5rem 1rem',
                  background: viewMode === 'table' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: viewMode === 'table' ? 'bold' : 'normal',
                  color: viewMode === 'table' ? '#667eea' : '#64748b',
                  transition: 'all 0.2s ease'
                }}
              >
                📊 Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                style={{
                  padding: '0.5rem 1rem',
                  background: viewMode === 'kanban' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: viewMode === 'kanban' ? 'bold' : 'normal',
                  color: viewMode === 'kanban' ? '#667eea' : '#64748b',
                  transition: 'all 0.2s ease'
                }}
              >
                📋 Kanban
              </button>
            </div>
          </div>
          
          {/* Actions de selection */}
          {selectedOrders.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  {selectedOrders.length} selectionnees
                </span>
                
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'white',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    color: '#3b82f6',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  ⚡ Actions groupees
                </button>
              </div>
              
              {showBulkActions && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleBulkStatusChange('Confirme')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    ✅ Confirmer
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('Expedie')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    📦 Expedier
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('Annule')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Annuler
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vue Table */}
        {viewMode === 'table' && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={handleSelectAll}
                      style={{ width: '18px', height: '18px', accentColor: '#667eea' }}
                    />
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Client</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Produit</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Montant</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Source</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Statut</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <tr 
                    key={order.id}
                    className="order-row"
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      animationDelay: `${idx * 0.05}s`
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        style={{ width: '18px', height: '18px', accentColor: '#667eea' }}
                      />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}>
                        {order.id}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{order.client}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>📱 {order.phone}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500', color: '#374151' }}>{order.product}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#059669' }}>
                        {formatPrice(order.amount + order.deliveryFee)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        + {formatPrice(order.deliveryFee)} livraison
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.75rem',
                        background: '#f3f4f6',
                        borderRadius: '6px',
                        fontSize: '0.85rem'
                      }}>
                        {getSourceIcon(order.source)} {order.source}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.5rem 1rem',
                        background: `${getStatusColor(order.status)}20`,
                        color: getStatusColor(order.status),
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                      {new Date(order.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                          style={{
                            padding: '0.5rem',
                            background: '#f0f9ff',
                            color: '#3b82f6',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1.1rem'
                          }}
                        >
                          👁️
                        </button>
                        <button
                          style={{
                            padding: '0.5rem',
                            background: '#f0fdf4',
                            color: '#10b981',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1.1rem'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          style={{
                            padding: '0.5rem',
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1.1rem'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredOrders.length === 0 && (
              <div style={{
                padding: '4rem',
                textAlign: 'center',
                color: '#94a3b8'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <p style={{ fontSize: '1.2rem' }}>Aucune commande trouvee</p>
              </div>
            )}
          </div>
        )}

        {/* Vue Kanban */}
        {viewMode === 'kanban' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {['En attente', 'Confirme', 'Expedie', 'Livre', 'Annule'].map(status => (
              <div
                key={status}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '2px solid #f3f4f6'
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>{getStatusIcon(status)}</span>
                    {status}
                  </h3>
                  <span style={{
                    background: `${getStatusColor(status)}20`,
                    color: getStatusColor(status),
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}>
                    {orders.filter(o => o.status === status).length}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  maxHeight: '500px',
                  overflowY: 'auto'
                }}>
                  {filteredOrders
                    .filter(order => order.status === status)
                    .map(order => (
                      <div
                        key={order.id}
                        style={{
                          padding: '1rem',
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '2px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = getStatusColor(status);
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{
                            fontWeight: 'bold',
                            color: '#667eea',
                            fontSize: '0.85rem'
                          }}>
                            {order.id}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            {new Date(order.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '0.25rem'
                        }}>
                          {order.client}
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#64748b',
                          marginBottom: '0.5rem'
                        }}>
                          {order.product}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            fontWeight: 'bold',
                            color: '#059669'
                          }}>
                            {formatPrice(order.amount + order.deliveryFee)}
                          </span>
                          <span style={{
                            fontSize: '0.8rem',
                            padding: '0.25rem 0.5rem',
                            background: '#f3f4f6',
                            borderRadius: '4px'
                          }}>
                            {getSourceIcon(order.source)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Details Commande */}
      {showOrderModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '25px',
            padding: '2.5rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                Details de la commande
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  fontSize: '1rem'
                }}>
                  {selectedOrder.id}
                </span>
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '2rem',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>
                  👤 Informations Client
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Nom:</span>
                    <span style={{ fontWeight: '600' }}>{selectedOrder.client}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Telephone:</span>
                    <span style={{ fontWeight: '600' }}>{selectedOrder.phone}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Email:</span>
                    <span style={{ fontWeight: '600' }}>{selectedOrder.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Adresse:</span>
                    <span style={{ fontWeight: '600', textAlign: 'right' }}>{selectedOrder.address}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>
                  📦 Details Commande
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Produit:</span>
                    <span style={{ fontWeight: '600' }}>{selectedOrder.product}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Montant:</span>
                    <span style={{ fontWeight: '600', color: '#059669' }}>{formatPrice(selectedOrder.amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Livraison:</span>
                    <span style={{ fontWeight: '600' }}>{formatPrice(selectedOrder.deliveryFee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Total:</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#667eea' }}>
                      {formatPrice(selectedOrder.amount + selectedOrder.deliveryFee)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowOrderModal(false)}
                style={{
                  padding: '0.875rem 1.75rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
              <button
                style={{
                  padding: '0.875rem 1.75rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
                }}
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  // Page Dashboard
const Dashboard = () => {
  const navigation = useNavigation();
  const actionData = useActionData();
  const [embedStatus, setEmbedStatus] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeSetupStep, setActiveSetupStep] = useState(1);
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Plan data
  const planLimits = {
    current: 45,
    max: 50,
    plan: 'Gratuit'
  };
  
  const percentageUsed = (planLimits.current / planLimits.max) * 100;

  return (
    <div style={{ 
      padding: '2rem', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        left: '-100px',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to { width: ${percentageUsed}%; }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .hover-card {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .hover-card:hover {
          transform: translateY(-8px) scale(1.02);
        }
        .pulse-icon {
          animation: pulse 2s infinite;
        }
        .slide-in {
          animation: slideIn 0.6s ease-out;
        }
        .progress-fill {
          animation: progressBar 1.5s ease-out;
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Main Header */}
        <div className="slide-in" style={{ 
          textAlign: 'center',
          marginBottom: '3rem',
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '30px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #667eea, #764ba2, #667eea)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite'
          }} />
          
          <div className="pulse-icon" style={{ 
            fontSize: '4rem', 
            marginBottom: '1rem',
            display: 'inline-block'
          }}>
            🚀
          </div>
          
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '900', 
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '2px',
            wordSpacing: '8px',
            padding: '0 20px',
            lineHeight: '1.5',
            minHeight: '80px',
            display: 'block'
          }}>
            RT COD BOOST 2.0
          </h1>
          
          <p style={{ 
            color: '#64748b', 
            fontSize: '1.3rem',
            maxWidth: '800px',
            margin: '0 auto 2rem',
            lineHeight: '1.6'
          }}>
            La solution complete pour <span style={{ color: '#667eea', fontWeight: 'bold' }}>multiplier vos ventes COD par 3</span> avec des formulaires optimises et intelligents
          </p>

          {/* Key Benefits */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',
            flexWrap: 'wrap',
            marginTop: '2rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              color: '#475569',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⚡</span>
              Installation en 2 minutes
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              color: '#475569',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📈</span>
              +300% de conversion
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              color: '#475569',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🎯</span>
              Zero abandon de panier
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              color: '#475569',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🚀</span>
              Support 24/7
            </div>
          </div>
        </div>

        {/* Plan Usage Statistics */}
        <div className="hover-card" style={{ 
          marginBottom: '2rem',
          background: 'white',
          borderRadius: '20px', 
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: '2px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h3 style={{ 
                fontSize: '1.4rem', 
                fontWeight: '700', 
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                📊 Utilisation du forfait {planLimits.plan}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                {planLimits.current} commandes sur {planLimits.max} autorisees ce mois
              </p>
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              background: percentageUsed > 80 ? 
                'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: '1.5',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {Math.round(percentageUsed)}%
            </div>
          </div>
          
          <div style={{
            background: '#e5e7eb',
            height: '20px',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div className="progress-fill" style={{
              height: '100%',
              background: percentageUsed > 80 ? 
                'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' : 
                'linear-gradient(90deg, #10b981 0%, #059669 100%)',
              borderRadius: '10px',
              width: `${percentageUsed}%`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 2s infinite'
              }} />
            </div>
          </div>
          
          {percentageUsed > 80 && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#dc2626' }}>Limite bientot atteinte!</strong>
                <p style={{ margin: '0.25rem 0 0', color: '#7f1d1d', fontSize: '0.9rem' }}>
                  Passez au plan Pro pour des commandes illimitees
                </p>
              </div>
              <button
                style={{
                  marginLeft: 'auto',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}
              >
                Upgrader
              </button>
            </div>
          )}
        </div>

        {/* Application Status */}
        <div className="hover-card" style={{ 
  marginBottom: '2rem',
  background: embedStatus ? 
    'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 
    'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
  borderRadius: '20px', 
  padding: '2rem',
  border: `3px solid ${embedStatus ? '#10b981' : '#f59e0b'}`,
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  position: 'relative',
  overflow: 'hidden'
}}>
  <div style={{
    position: 'absolute',
    top: 0,
    right: 0,
    width: '200px',
    height: '200px',
    background: embedStatus ? 
      'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' :
      'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
    borderRadius: '50%'
  }} />
  
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <div className="pulse-icon" style={{ 
        fontSize: '3rem',
        background: 'white',
        padding: '1rem',
        borderRadius: '20px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '70px',
        height: '70px'
      }}>
        {embedStatus ? '✅' : '⚠️'}
      </div>
      <div>
        <h3 style={{ 
          margin: 0, 
          color: '#1e293b', 
          fontSize: '1.3rem',
          fontWeight: 'bold'
        }}>
          {embedStatus ? 
            "Application activée avec succès!" : 
            "Action requise: Activez l'application"}
        </h3>
        <p style={{ 
          margin: '0.5rem 0 0 0', 
          color: '#475569',
          fontSize: '1rem'
        }}>
          {embedStatus ? 
            'Votre formulaire COD est maintenant visible sur votre boutique' : 
            'Dernière étape pour commencer à recevoir des commandes'}
        </p>
      </div>
    </div>
    
    {/* ✅ FORMULAIRE REMIX POUR ACTIVATION */}
{!embedStatus && (
  <Form method="post">
    <input type="hidden" name="action" value="activate" />
    <input type="hidden" name="isActive" value="true" />
    
    <button 
      type="submit"
      disabled={navigation.state === "submitting"}
      onMouseEnter={(e) => {
        if (navigation.state !== "submitting") {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(245, 158, 11, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (navigation.state !== "submitting") {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(245, 158, 11, 0.3)';
        }
      }}
      style={{
        background: navigation.state === "submitting" 
          ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
          : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: 'white',
        border: 'none',
        padding: '1rem 2rem',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: navigation.state === "submitting" ? 'not-allowed' : 'pointer',
        boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.3s ease',
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{ fontSize: '1.3rem' }}>
        {navigation.state === "submitting" ? '⏳' : '⚡'}
      </span>
      {navigation.state === "submitting" ? 'Activation...' : 'Activer maintenant'}
    </button>
  </Form>
)}
  </div>
</div>

        {/* Installation Guide */}
        <div style={{ 
          background: 'white',
          borderRadius: '25px', 
          padding: '3rem', 
          marginBottom: '2rem',
          boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <h2 style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold', 
            color: '#1e293b', 
            marginBottom: '3rem',
            textAlign: 'center'
          }}>
            🎯 Guide d'installation rapide
          </h2>

          {/* Timeline Style Progress */}
          <div style={{ position: 'relative', marginBottom: '3rem' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              right: '0',
              height: '4px',
              background: '#e5e7eb',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              width: `${(activeSetupStep / 4) * 100}%`,
              transition: 'width 0.5s ease',
              zIndex: 1
            }} />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 2
            }}>
              {[
                { step: 1, title: 'Installation', icon: '📲', desc: 'App installee' },
                { step: 2, title: 'Activation', icon: '🔧', desc: 'Embed active' },
                { step: 3, title: 'Configuration', icon: '⚙️', desc: 'Formulaire personnalise' },
                { step: 4, title: 'Go Live', icon: '🚀', desc: 'Pret a vendre!' }
              ].map((item) => {
                const isCompleted = activeSetupStep >= item.step;
                const isCurrent = activeSetupStep === item.step;
                
                return (
                  <div 
                    key={item.step}
                    onClick={() => setActiveSetupStep(item.step)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: isCompleted ? 
                        'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                        isCurrent ?
                        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                        '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      marginBottom: '1rem',
                      boxShadow: isCompleted || isCurrent ? 
                        '0 10px 30px rgba(0,0,0,0.15)' : 
                        '0 5px 15px rgba(0,0,0,0.08)',
                      border: '3px solid white',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}>
                      {isCompleted ? '✓' : item.icon}
                      {isCurrent && (
                        <div style={{
                          position: 'absolute',
                          inset: '-6px',
                          border: '3px solid #667eea',
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite'
                        }} />
                      )}
                    </div>
                    <h4 style={{
                      margin: '0 0 0.5rem',
                      color: isCompleted || isCurrent ? '#1e293b' : '#94a3b8',
                      fontWeight: isCompleted || isCurrent ? 'bold' : 'normal',
                      fontSize: '1.1rem'
                    }}>
                      {item.title}
                    </h4>
                    <p style={{
                      margin: 0,
                      color: isCompleted ? '#10b981' : '#94a3b8',
                      fontSize: '0.85rem'
                    }}>
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[
            { 
              title: 'Formulaire', 
              icon: '📝', 
              color: '#667eea',
              gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              desc: 'Personnalisez votre formulaire'
            },
            { 
              title: 'Commandes', 
              icon: '📦', 
              color: '#10b981',
              gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              desc: 'Gerez vos commandes COD'
            },
            { 
              title: 'Analytics', 
              icon: '📊', 
              color: '#3b82f6',
              gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              desc: 'Analysez vos performances'
            }
          ].map((action, index) => (
            <div
              key={index}
              className="hover-card"
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                cursor: 'pointer',
                border: '2px solid transparent',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = `2px solid ${action.color}`;
                e.currentTarget.style.boxShadow = `0 20px 40px ${action.color}30`;
                setHoveredCard(index);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '2px solid transparent';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                setHoveredCard(null);
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                background: action.gradient,
                borderRadius: '50%',
                opacity: hoveredCard === index ? 0.1 : 0,
                transition: 'opacity 0.3s ease'
              }} />
              
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                transform: hoveredCard === index ? 'scale(1.2) rotate(10deg)' : 'scale(1)',
                transition: 'transform 0.3s ease'
              }}>
                {action.icon}
              </div>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                {action.title}
              </h3>
              <p style={{
                color: '#64748b',
                fontSize: '0.95rem',
                margin: 0
              }}>
                {action.desc}
              </p>
              <div style={{
                marginTop: '1.5rem',
                padding: '0.75rem',
                background: action.gradient,
                color: 'white',
                borderRadius: '10px',
                textAlign: 'center',
                fontWeight: 'bold',
                transform: hoveredCard === index ? 'translateY(0)' : 'translateY(10px)',
                opacity: hoveredCard === index ? 1 : 0,
                transition: 'all 0.3s ease'
              }}>
                Ouvrir →
              </div>
            </div>
          ))}
        </div>

        {/* Learning Center and Support */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '2rem'
        }}>
          {/* Learning Center */}
          <div className="hover-card" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.8rem' }}>🎓</span>
              Centre d'Apprentissage
            </h3>
            
            <button
              onClick={() => setShowVideoModal(true)}
              style={{
                width: '100%',
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 25px rgba(239,68,68,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(239,68,68,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(239,68,68,0.3)';
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>▶️</span>
              Regarder le Tutoriel Video
            </button>
          </div>

          {/* Support */}
          <div className="hover-card" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.8rem' }}>💬</span>
              Support & Contact
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <span style={{ fontSize: '1.5rem' }}>📧</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                    support@rtcodboost.com
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Reponse sous 24h
                  </div>
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <span style={{ fontSize: '1.5rem' }}>💬</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                    Chat en Direct
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Lun-Ven 9h-18h
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '25px',
            padding: '2.5rem',
            width: '90%',
            maxWidth: '900px',
            position: 'relative',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <button
              onClick={() => setShowVideoModal(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 5px 15px rgba(239,68,68,0.3)'
              }}
            >
              ×
            </button>
            
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '2rem',
              textAlign: 'center',
              letterSpacing: '1px',
              wordSpacing: '5px',
              lineHeight: '1.5',
              minHeight: '50px'
            }}>
              📺 Comment configurer RT COD BOOST 2.0 en 2 minutes
            </h2>
            
            <div style={{
              background: '#f3f4f6',
              height: '450px',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              color: '#64748b'
            }}>
              Integration video YouTube ici
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  // Page Concepteur de Formulaire
// 🔥 VERSION COMPLÈTE AVEC TOUS LES PARAMÈTRES DE STYLE COMME RELEASIT
// Remplacez UNIQUEMENT la fonction FormBuilder par celle-ci

const FormBuilder = () => {
  // États pour le formulaire
  const [formType, setFormType] = useState('popup');
  const [selectedCountry, setSelectedCountry] = useState('Morocco');
  const [multiCountryEnabled, setMultiCountryEnabled] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditField, setCurrentEditField] = useState(null);
  const [buttonText, setButtonText] = useState('Confirmer ma commande');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  
  // États pour le style COMPLET
  const [formStyle, setFormStyle] = useState({
    textColor: '#1e293b',
    fieldTextColor: '#333333',
    fieldBorderColor: '#e5e7eb',
    fieldBgColor: '#ffffff',
    buttonColor: '#667eea',
    buttonTextColor: '#ffffff',
    formBackground: '#ffffff',
    borderRadius: 10,
    fieldBorderRadius: 8,
    borderWidth: 2,
    showLabels: true,
    rtlEnabled: false,
    showShadow: false,
    fontFamily: 'system-ui',
    fontSize: 14
  });

  // États pour les messages
  const [errorMessages, setErrorMessages] = useState({
    required: 'Ce champ est requis',
    invalid: 'Veuillez vérifier vos informations'
  });

  // États pour les champs (SANS CODE PROMO)
  const [fields, setFields] = useState([
    { 
      id: 2, 
      type: 'text', 
      label: 'Prénom', 
      placeholder: 'Votre prénom', 
      visible: true, 
      required: true, 
      editable: true,
      movable: true,
      width: '50%' 
    },
    { 
      id: 3, 
      type: 'text', 
      label: 'Nom', 
      placeholder: 'Votre nom', 
      visible: true, 
      required: true, 
      editable: true,
      movable: true,
      width: '50%' 
    },
    { 
      id: 4, 
      type: 'tel', 
      label: 'Téléphone', 
      placeholder: '06 XX XX XX XX', 
      visible: true, 
      required: true, 
      editable: true,
      movable: true,
      width: '100%' 
    },
    { 
      id: 5, 
      type: 'text', 
      label: 'Adresse', 
      placeholder: 'Numéro et nom de rue', 
      visible: true, 
      required: true, 
      editable: true,
      movable: true,
      width: '100%' 
    },
    { 
      id: 6, 
      type: 'text', 
      label: 'Ville', 
      placeholder: 'Votre ville', 
      visible: true, 
      required: true, 
      editable: true,
      movable: true,
      width: '50%' 
    },
    { 
      id: 7, 
      type: 'email', 
      label: 'Email', 
      placeholder: 'email@exemple.com', 
      visible: false, 
      required: false, 
      editable: true,
      movable: true,
      width: '100%' 
    }
  ]);

  // Données du produit pour le résumé
  const [orderSummary] = useState({
    productName: 'iPhone 15 Pro Max',
    quantity: 2,
    unitPrice: 12999,
    shippingFee: 35,
    productIcon: '📱'
  });

  // Calculs
  const subtotal = orderSummary.unitPrice * orderSummary.quantity;
  const total = subtotal + orderSummary.shippingFee;

  // Fonctions pour drag and drop
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null) return;
    
    const draggedField = fields[draggedItem];
    const newFields = [...fields];
    
    // Supprimer l'élément de sa position actuelle
    newFields.splice(draggedItem, 1);
    
    // L'insérer à la nouvelle position
    newFields.splice(dropIndex, 0, draggedField);
    
    setFields(newFields);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Autres fonctions
  const toggleFieldVisibility = (fieldId) => {
    setFields(fields.map(field =>
      field.id === fieldId ? { ...field, visible: !field.visible } : field
    ));
  };

  const editField = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      setCurrentEditField({ ...field });
      setShowEditModal(true);
    }
  };

  const saveFieldChanges = () => {
    if (currentEditField) {
      setFields(fields.map(field =>
        field.id === currentEditField.id ? currentEditField : field
      ));
      setShowEditModal(false);
      setCurrentEditField(null);
    }
  };

  const deleteField = (fieldId) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const addCustomField = () => {
    const newField = {
      id: Date.now(),
      type: 'text',
      label: 'Nouveau champ',
      placeholder: 'Entrez une valeur',
      visible: true,
      required: false,
      editable: true,
      movable: true,
      width: '100%'
    };
    setFields([...fields, newField]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 2000000) { // 2MB max
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Image trop grande ! Max 2MB');
    }
  };

  const getFieldIcon = (type) => {
    const icons = {
      text: '📝',
      email: '✉️',
      tel: '📞',
      number: '🔢',
      textarea: '📄'
    };
    return icons[type] || '📝';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header avec titre LISIBLE */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#667eea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '2.5rem' }}>📝</span>
            RT COD BOOST 2.0
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.2rem' }}>
            Créez des formulaires de commande qui convertissent
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '2rem' }}>
          {/* Main Panel */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            borderRadius: '25px',
            padding: '3rem',
            boxShadow: '0 25px 80px rgba(0,0,0,0.12)'
          }}>
            
            {/* Section 1: Mode de formulaire */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)'
                }}>
                  1
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b' }}>
                  Sélectionnez votre mode de formulaire
                </h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div 
                  onClick={() => setFormType('popup')}
                  style={{
                    border: '3px solid',
                    borderColor: formType === 'popup' ? 'transparent' : '#e5e7eb',
                    borderRadius: '20px',
                    padding: '2.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.4s',
                    background: formType === 'popup' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                    color: formType === 'popup' ? 'white' : '#1e293b',
                    transform: formType === 'popup' ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: formType === 'popup' ? '0 20px 50px rgba(102, 126, 234, 0.4)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚀</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    Popup
                  </div>
                  <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                    S'ouvre en modal au-dessus du contenu
                  </div>
                </div>
                
                <div 
                  onClick={() => setFormType('integrated')}
                  style={{
                    border: '3px solid',
                    borderColor: formType === 'integrated' ? 'transparent' : '#e5e7eb',
                    borderRadius: '20px',
                    padding: '2.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.4s',
                    background: formType === 'integrated' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                    color: formType === 'integrated' ? 'white' : '#1e293b',
                    transform: formType === 'integrated' ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: formType === 'integrated' ? '0 20px 50px rgba(102, 126, 234, 0.4)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📄</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    Intégré
                  </div>
                  <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                    Intégré directement dans la page
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Configuration géographique */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)'
                }}>
                  2
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b' }}>
                  Configuration géographique
                </h3>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', color: '#374151', fontWeight: '600' }}>
                  Pays principal
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    background: 'white'
                  }}
                >
                  <option value="Morocco">🇲🇦 Maroc</option>
                  <option value="Algeria">🇩🇿 Algérie</option>
                  <option value="Tunisia">🇹🇳 Tunisie</option>
                  <option value="France">🇫🇷 France</option>
                  <option value="Belgium">🇧🇪 Belgique</option>
                </select>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={multiCountryEnabled}
                  onChange={(e) => setMultiCountryEnabled(e.target.checked)}
                  style={{
                    width: '22px',
                    height: '22px',
                    cursor: 'pointer',
                    accentColor: '#667eea'
                  }}
                />
                <label style={{ cursor: 'pointer', flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>
                    Vendez-vous dans plusieurs pays ?
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Permet aux clients de choisir leur pays
                  </div>
                </label>
              </div>
            </div>

            {/* Section 3: Personnalisation des champs */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)'
                }}>
                  3
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b' }}>
                  Personnalisez votre formulaire
                </h3>
              </div>
              
              {/* Liste des champs avec DRAG AND DROP */}
              <div style={{ marginBottom: '1rem' }}>
                {fields.map((field, index) => (
                  <div 
                    key={field.id}
                    draggable={field.movable}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1.25rem',
                      background: draggedItem === index ? '#f3f4f6' : 'white',
                      border: '2px solid',
                      borderColor: draggedItem === index ? '#667eea' : '#e5e7eb',
                      borderRadius: '16px',
                      marginBottom: '1rem',
                      cursor: field.movable ? 'move' : 'default',
                      transition: 'all 0.3s',
                      opacity: draggedItem === index ? 0.5 : 1
                    }}
                  >
                    {/* Poignée de drag */}
                    {field.movable && (
                      <span style={{ 
                        fontSize: '1.3rem', 
                        color: '#9ca3af', 
                        marginRight: '1rem', 
                        cursor: 'move' 
                      }}>
                        ≡
                      </span>
                    )}
                    
                    {/* Checkbox de visibilité */}
                    <input
                      type="checkbox"
                      checked={field.visible}
                      onChange={() => toggleFieldVisibility(field.id)}
                      style={{
                        width: '22px',
                        height: '22px',
                        marginRight: '1rem',
                        cursor: 'pointer',
                        accentColor: '#667eea'
                      }}
                    />
                    
                    {/* Icône du type */}
                    <span style={{ fontSize: '1.4rem', marginRight: '1rem' }}>
                      {getFieldIcon(field.type)}
                    </span>
                    
                    {/* Label */}
                    <span style={{ flex: 1, fontWeight: '500', color: '#374151' }}>
                      {field.label}
                      {field.required && <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>}
                    </span>
                    
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {field.editable && (
                        <button
                          onClick={() => editField(field.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          ✏️
                        </button>
                      )}
                      {field.id > 10 && (
                        <button
                          onClick={() => deleteField(field.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Bouton ajouter un champ */}
              <button
                onClick={addCustomField}
                style={{
                  width: '100%',
                  padding: '1.5rem',
                  border: '3px dashed #e5e7eb',
                  borderRadius: '16px',
                  background: 'transparent',
                  color: '#6b7280',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                  e.currentTarget.style.color = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>➕</span>
                Ajouter un champ personnalisé
              </button>

              {/* SECTION STYLE DU FORMULAIRE COMPLÈTE */}
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '20px',
                padding: '2rem',
                marginTop: '2rem'
              }}>
                <h4 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '700', 
                  color: '#1e293b', 
                  marginBottom: '1.5rem' 
                }}>
                  🎨 Style du formulaire
                </h4>

                {/* Couleurs */}
                <div style={{ marginBottom: '2rem' }}>
                  <h5 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
                    Couleurs
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Couleur du texte */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                        Couleur du texte
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="color"
                          value={formStyle.textColor}
                          onChange={(e) => setFormStyle({...formStyle, textColor: e.target.value})}
                          style={{
                            width: '45px',
                            height: '40px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            cursor: 'pointer'
                          }}
                        />
                        <input
                          type="text"
                          value={formStyle.textColor}
                          onChange={(e) => setFormStyle({...formStyle, textColor: e.target.value})}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Couleur du fond des champs */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                        Couleur de fond des champs
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="color"
                          value={formStyle.fieldBgColor}
                          onChange={(e) => setFormStyle({...formStyle, fieldBgColor: e.target.value})}
                          style={{
                            width: '45px',
                            height: '40px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            cursor: 'pointer'
                          }}
                        />
                        <input
                          type="text"
                          value={formStyle.fieldBgColor}
                          onChange={(e) => setFormStyle({...formStyle, fieldBgColor: e.target.value})}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    </div>

                    {/* Couleur de l'arrière-plan */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                        Couleur de l'arrière-plan
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="color"
                          value={formStyle.formBackground}
                          onChange={(e) => setFormStyle({...formStyle, formBackground: e.target.value})}
                          style={{
                            width: '45px',
                            height: '40px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            cursor: 'pointer'
                          }}
                        />
                        <input
                          type="text"
                          value={formStyle.formBackground}
                          onChange={(e) => setFormStyle({...formStyle, formBackground: e.target.value})}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Couleur du bouton */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                        Couleur du bouton
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="color"
                          value={formStyle.buttonColor}
                          onChange={(e) => setFormStyle({...formStyle, buttonColor: e.target.value})}
                          style={{
                            width: '45px',
                            height: '40px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            cursor: 'pointer'
                          }}
                        />
                        <input
                          type="text"
                          value={formStyle.buttonColor}
                          onChange={(e) => setFormStyle({...formStyle, buttonColor: e.target.value})}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Texte du bouton */}
                <div style={{ marginBottom: '2rem' }}>
                  <h5 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
                    Personnalisation du bouton de confirmation
                  </h5>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                      Texte du bouton
                    </label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="Ex: Commander maintenant"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>
                </div>

                {/* Rayons de bordure */}
                <div style={{ marginBottom: '2rem' }}>
                  <h5 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
                    Rayon de bordure
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontSize: '0.9rem' }}>
                        Rayon de bordure: {formStyle.fieldBorderRadius}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        value={formStyle.fieldBorderRadius}
                        onChange={(e) => setFormStyle({...formStyle, fieldBorderRadius: parseInt(e.target.value)})}
                        style={{
                          width: '100%',
                          height: '6px',
                          borderRadius: '3px',
                          background: '#e5e7eb',
                          outline: 'none',
                          WebkitAppearance: 'none'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.75rem', color: '#6b7280', fontSize: '0.9rem' }}>
                        Largeur de bordure: {formStyle.borderWidth}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={formStyle.borderWidth}
                        onChange={(e) => setFormStyle({...formStyle, borderWidth: parseInt(e.target.value)})}
                        style={{
                          width: '100%',
                          height: '6px',
                          borderRadius: '3px',
                          background: '#e5e7eb',
                          outline: 'none',
                          WebkitAppearance: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Options supplémentaires */}
                <div style={{ marginBottom: '2rem' }}>
                  <h5 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
                    Options supplémentaires
                  </h5>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <input
                      type="checkbox"
                      checked={!formStyle.showLabels}
                      onChange={(e) => setFormStyle({...formStyle, showLabels: !e.target.checked})}
                      style={{ width: '22px', height: '22px', accentColor: '#667eea' }}
                    />
                    <label>Masquer les étiquettes des champs</label>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <input
                      type="checkbox"
                      checked={formStyle.rtlEnabled}
                      onChange={(e) => setFormStyle({...formStyle, rtlEnabled: e.target.checked})}
                      style={{ width: '22px', height: '22px', accentColor: '#667eea' }}
                    />
                    <label>Activer RTL (pour les langues arabes)</label>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={formStyle.showShadow}
                      onChange={(e) => setFormStyle({...formStyle, showShadow: e.target.checked})}
                      style={{ width: '22px', height: '22px', accentColor: '#667eea' }}
                    />
                    <label>Ajouter une ombre au formulaire</label>
                  </div>
                </div>

                {/* Image d'arrière-plan */}
                <div>
                  <h5 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
                    Image d'arrière-plan
                  </h5>
                  <div
                    onClick={() => document.getElementById('bgImageInput').click()}
                    style={{
                      border: '3px dashed #e5e7eb',
                      borderRadius: '20px',
                      padding: '3rem',
                      textAlign: 'center',
                      background: '#fafafa',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#fafafa';
                    }}
                  >
                    <input
                      id="bgImageInput"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />
                    <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🖼️</div>
                    <div style={{ color: '#667eea', fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                      Cliquez pour télécharger une image
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                      JPG, PNG ou GIF - Max 2MB
                    </div>
                    {backgroundImage && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.5rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '6px',
                        color: '#059669',
                        fontSize: '0.85rem'
                      }}>
                        ✅ Image téléchargée avec succès
                      </div>
                    )}
                  </div>
                  
                  {backgroundImage && (
                    <button
                      onClick={() => setBackgroundImage(null)}
                      style={{
                        marginTop: '1rem',
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#dc2626',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Supprimer l'image d'arrière-plan
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Textes génériques */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)'
                }}>
                  4
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b' }}>
                  Personnalisez les textes génériques du formulaire
                </h3>
              </div>
              
              <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                    Texte d'erreur pour champ obligatoire
                  </label>
                  <input
                    type="text"
                    value={errorMessages.required}
                    onChange={(e) => setErrorMessages({...errorMessages, required: e.target.value})}
                    placeholder="Ex: Veuillez remplir ce champ"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                    Texte d'erreur de champ générique non valide
                  </label>
                  <input
                    type="text"
                    value={errorMessages.invalid}
                    onChange={(e) => setErrorMessages({...errorMessages, invalid: e.target.value})}
                    placeholder="Ex: Format invalide"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bouton Sauvegarder */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
              <button style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '1rem 3rem',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)'
              }}>
                💾 Sauvegarder les changements
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
            <div style={{
              background: 'white',
              borderRadius: '25px',
              padding: '2.5rem',
              boxShadow: '0 25px 80px rgba(0,0,0,0.12)'
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '700',
                color: '#1e293b',
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                👁️ Aperçu en direct
              </h3>
              
              {/* Résumé de commande COMPLET */}
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontWeight: '700',
                  color: '#0c4a6e',
                  marginBottom: '1rem',
                  fontSize: '1.1rem'
                }}>
                  📦 Résumé de votre commande
                </div>
                
                {/* Produit avec détails */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'white',
                  borderRadius: '10px',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      {orderSummary.productIcon}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>
                        {orderSummary.productName}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        Quantité: {orderSummary.quantity}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', color: '#059669', fontSize: '1.1rem' }}>
                    {orderSummary.unitPrice.toLocaleString()} DH
                  </div>
                </div>
                
                <div style={{ height: '1px', background: '#e5e7eb', margin: '1rem 0' }} />
                
                {/* Sous-total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ color: '#6b7280' }}>Sous-total</span>
                  <span style={{ fontWeight: '600' }}>{subtotal.toLocaleString()} DH</span>
                </div>
                
                {/* Frais de livraison */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ color: '#6b7280' }}>Frais de livraison</span>
                  <span style={{ fontWeight: '600', color: '#059669' }}>{orderSummary.shippingFee} DH</span>
                </div>
                
                {/* Total */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '2px solid #e5e7eb',
                  marginTop: '1rem'
                }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>Total à payer</span>
                  <span style={{
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {total.toLocaleString()} DH
                  </span>
                </div>
              </div>
              
              {/* Formulaire de prévisualisation */}
              <div style={{
                borderRadius: `${formStyle.fieldBorderRadius}px`,
                padding: '1.5rem',
                border: `${formStyle.borderWidth}px solid ${formStyle.fieldBorderColor}`,
                background: backgroundImage ? `url(${backgroundImage})` : formStyle.formBackground,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: formStyle.showShadow ? '0 10px 30px rgba(0,0,0,0.1)' : 'none',
                direction: formStyle.rtlEnabled ? 'rtl' : 'ltr',
                position: 'relative'
              }}>
                {backgroundImage && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: `${formStyle.fieldBorderRadius}px`
                  }} />
                )}
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {fields.filter(f => f.visible).map((field) => (
                    <div key={field.id} style={{ marginBottom: '1.25rem' }}>
                      {formStyle.showLabels && (
                        <label style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          fontWeight: '500',
                          color: formStyle.textColor
                        }}>
                          {field.label}
                          {field.required && <span style={{ color: '#dc2626' }}> *</span>}
                        </label>
                      )}
                      <input
                        type={field.type === 'textarea' ? 'text' : field.type}
                        placeholder={field.placeholder || field.label}
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: `${formStyle.borderWidth}px solid ${formStyle.fieldBorderColor}`,
                          borderRadius: `${formStyle.fieldBorderRadius}px`,
                          fontSize: '0.95rem',
                          background: formStyle.fieldBgColor,
                          color: formStyle.fieldTextColor
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Bouton de confirmation personnalisé */}
              <button style={{
                width: '100%',
                padding: '1.25rem',
                background: `linear-gradient(135deg, ${formStyle.buttonColor} 0%, ${formStyle.buttonColor}dd 100%)`,
                color: formStyle.buttonTextColor,
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.2rem',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '1.5rem',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s'
              }}>
                {buttonText} - {total.toLocaleString()} DH 🛒
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition COMPLÈTE */}
      {showEditModal && currentEditField && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '25px',
            padding: '2.5rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#1e293b' }}>
                ✏️ Modifier le champ
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '2rem',
                  color: '#6b7280',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                  Nom du champ
                </label>
                <input
                  type="text"
                  value={currentEditField.label}
                  onChange={(e) => setCurrentEditField({...currentEditField, label: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                  Placeholder
                </label>
                <input
                  type="text"
                  value={currentEditField.placeholder || ''}
                  onChange={(e) => setCurrentEditField({...currentEditField, placeholder: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                  Type de champ
                </label>
                <select
                  value={currentEditField.type}
                  onChange={(e) => setCurrentEditField({...currentEditField, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    background: 'white'
                  }}
                >
                  <option value="text">Texte</option>
                  <option value="email">Email</option>
                  <option value="tel">Téléphone</option>
                  <option value="number">Nombre</option>
                  <option value="textarea">Zone de texte</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
                  Largeur
                </label>
                <select
                  value={currentEditField.width || '100%'}
                  onChange={(e) => setCurrentEditField({...currentEditField, width: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    background: 'white'
                  }}
                >
                  <option value="25%">25%</option>
                  <option value="50%">50%</option>
                  <option value="75%">75%</option>
                  <option value="100%">100%</option>
                </select>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <input
                  type="checkbox"
                  checked={currentEditField.required}
                  onChange={(e) => setCurrentEditField({...currentEditField, required: e.target.checked})}
                  style={{
                    width: '22px',
                    height: '22px',
                    accentColor: '#667eea'
                  }}
                />
                <label>Champ obligatoire</label>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    padding: '0.875rem 1.75rem',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={saveFieldChanges}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.875rem 1.75rem',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
  // Page Analytics
  // Page Analytics & Rapports complète et corrigée
const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [animatedValues, setAnimatedValues] = useState({
    conversion: 0,
    revenue: 0,
    orders: 0,
    averageCart: 0
  });

  // Animation des chiffres au montage
  useEffect(() => {
    const targets = {
      conversion: 23.5,
      revenue: 2450000,
      orders: 245,
      averageCart: 45250
    };

    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedValues({
        conversion: Math.round(targets.conversion * progress * 10) / 10,
        revenue: Math.round(targets.revenue * progress),
        orders: Math.round(targets.orders * progress),
        averageCart: Math.round(targets.averageCart * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, increment);

    return () => clearInterval(interval);
  }, []);

  // Données pour les graphiques
  const revenueData = [
    { month: 'Jan', revenue: 850000, orders: 42 },
    { month: 'Fév', revenue: 1250000, orders: 58 },
    { month: 'Mar', revenue: 1850000, orders: 89 },
    { month: 'Avr', revenue: 2100000, orders: 105 },
    { month: 'Mai', revenue: 2450000, orders: 124 },
    { month: 'Juin', revenue: 2800000, orders: 145 }
  ];

  const sourceData = [
    { source: 'Facebook', value: 45, color: '#1877f2' },
    { source: 'Instagram', value: 25, color: '#e4405f' },
    { source: 'Site Web', value: 18, color: '#10b981' },
    { source: 'WhatsApp', value: 8, color: '#25d366' },
    { source: 'Autres', value: 4, color: '#94a3b8' }
  ];

  const wilayaData = [
    { wilaya: 'Alger', orders: 89, revenue: 890000 },
    { wilaya: 'Oran', orders: 56, revenue: 560000 },
    { wilaya: 'Constantine', orders: 45, revenue: 450000 },
    { wilaya: 'Sétif', orders: 34, revenue: 340000 },
    { wilaya: 'Annaba', orders: 21, revenue: 210000 }
  ];

  const productPerformance = [
    { 
      name: 'Smartphone Samsung', 
      sales: 245, 
      revenue: 12250000,
      trend: '+15%',
      trendUp: true,
      icon: '📱'
    },
    { 
      name: 'Casque Bluetooth', 
      sales: 189, 
      revenue: 1606500,
      trend: '+8%',
      trendUp: true,
      icon: '🎧'
    },
    { 
      name: 'Montre connectée', 
      sales: 156, 
      revenue: 3900000,
      trend: '-3%',
      trendUp: false,
      icon: '⌚'
    },
    { 
      name: 'Écouteurs sans fil', 
      sales: 134, 
      revenue: 1608000,
      trend: '+22%',
      trendUp: true,
      icon: '🎵'
    },
    { 
      name: 'Tablette iPad', 
      sales: 98, 
      revenue: 8330000,
      trend: '+5%',
      trendUp: true,
      icon: '📱'
    }
  ];

  // Fonction pour créer un graphique en barres SVG
  const BarChart = ({ data, height = 300 }) => {
    const maxValue = Math.max(...data.map(d => d.revenue));
    const barWidth = 100 / data.length;

    return (
      <svg width="100%" height={height} style={{ marginTop: '1rem' }}>
        {data.map((item, index) => {
          const barHeight = (item.revenue / maxValue) * (height - 40);
          const x = (index * barWidth) + '%';
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={height - barHeight - 20}
                width={`${barWidth * 0.6}%`}
                height={barHeight}
                fill="url(#gradient)"
                rx="8"
                style={{
                  animation: `slideUp 0.5s ease-out ${index * 0.1}s both`,
                  transformOrigin: 'bottom'
                }}
              />
              <text
                x={x}
                y={height - 5}
                fill="#64748b"
                fontSize="12"
                textAnchor="start"
              >
                {item.month}
              </text>
              <text
                x={x}
                y={height - barHeight - 25}
                fill="#1e293b"
                fontSize="11"
                fontWeight="bold"
                textAnchor="start"
              >
                {(item.revenue / 1000000).toFixed(1)}M
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // Fonction pour créer un graphique circulaire
  const PieChart = ({ data, size = 200 }) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;
    
    let cumulativePercentage = 0;
    
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size}>
          {data.map((segment, index) => {
            const startAngle = (cumulativePercentage * 360) / 100;
            const endAngle = ((cumulativePercentage + segment.value) * 360) / 100;
            cumulativePercentage += segment.value;
            
            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startAngleRad - Math.PI / 2);
            const y1 = centerY + radius * Math.sin(startAngleRad - Math.PI / 2);
            const x2 = centerX + radius * Math.cos(endAngleRad - Math.PI / 2);
            const y2 = centerY + radius * Math.sin(endAngleRad - Math.PI / 2);
            
            const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            return (
              <g key={index}>
                <path
                  d={pathData}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="2"
                  style={{
                    animation: `pieSliceIn 0.5s ease-out ${index * 0.1}s both`,
                    transformOrigin: `${centerX}px ${centerY}px`
                  }}
                />
              </g>
            );
          })}
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
            100%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Total
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '2rem', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes slideUp {
          from { 
            transform: scaleY(0);
            opacity: 0;
          }
          to { 
            transform: scaleY(1);
            opacity: 1;
          }
        }
        @keyframes pieSliceIn {
          from { 
            transform: scale(0) rotate(-90deg);
            opacity: 0;
          }
          to { 
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideRight {
          from { width: 0; }
        }
        .metric-card {
          animation: fadeInUp 0.6s ease-out;
          transition: all 0.3s ease;
        }
        .metric-card:hover {
          transform: translateY(-5px) scale(1.02);
        }
        .chart-container {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>

      {/* Éléments de fond animés */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-50px',
        left: '-50px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header CORRIGÉ */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: '3rem',
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '30px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(20px)'
        }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '900', 
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            lineHeight: '1.5',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            minHeight: '4rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ 
              fontSize: '2.5rem',
              display: 'inline-block'
            }}>📊</span>
            <span style={{
              display: 'inline-block',
              whiteSpace: 'nowrap'
            }}>
              Analytics & Rapports
            </span>
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '1.3rem',
            marginTop: '0.5rem'
          }}>
            Analysez vos performances COD en détail
          </p>

          {/* Sélecteur de période */}
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {['today', 'week', 'month', 'year'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: selectedPeriod === period ? 
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                    'white',
                  color: selectedPeriod === period ? 'white' : '#64748b',
                  border: selectedPeriod === period ? 'none' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap'
                }}
              >
                {period === 'today' ? "Aujourd'hui" :
                 period === 'week' ? 'Cette semaine' :
                 period === 'month' ? 'Ce mois' :
                 'Cette année'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {[
            { 
              title: 'Taux de conversion', 
              value: `${animatedValues.conversion}%`, 
              color: '#10b981',
              icon: '📈',
              description: '+5.2% vs mois dernier',
              trend: 'up'
            },
            { 
              title: 'Panier moyen', 
              value: `${animatedValues.averageCart.toLocaleString()} DA`, 
              color: '#3b82f6',
              icon: '🛒',
              description: '+12% vs mois dernier',
              trend: 'up'
            },
            { 
              title: 'Taux de livraison', 
              value: '89.2%', 
              color: '#8b5cf6',
              icon: '🚚',
              description: '-2.1% vs mois dernier',
              trend: 'down'
            },
            { 
              title: 'Revenus mensuels', 
              value: `${(animatedValues.revenue / 1000000).toFixed(1)}M DA`, 
              color: '#f59e0b',
              icon: '💰',
              description: '+18% vs mois dernier',
              trend: 'up'
            }
          ].map((kpi, index) => (
            <div 
              key={index}
              className="metric-card"
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: `3px solid ${kpi.color}20`,
                position: 'relative',
                overflow: 'hidden',
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '5rem',
                opacity: 0.1,
                color: kpi.color
              }}>
                {kpi.icon}
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    color: '#64748b', 
                    fontSize: '0.95rem',
                    fontWeight: '600'
                  }}>
                    {kpi.title}
                  </h3>
                  <p style={{
                    margin: '0.5rem 0 0 0',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: kpi.color
                  }}>
                    {kpi.value}
                  </p>
                </div>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: `${kpi.color}20`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem'
                }}>
                  {kpi.icon}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: kpi.trend === 'up' ? '#10b981' : '#ef4444'
              }}>
                <span>{kpi.trend === 'up' ? '↑' : '↓'}</span>
                <span>{kpi.description}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Graphiques principaux */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Évolution des revenus */}
          <div className="chart-container" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>💹</span>
                Évolution des revenus
              </h3>
              <select style={{
                padding: '0.5rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: 'white'
              }}>
                <option>6 derniers mois</option>
                <option>3 derniers mois</option>
                <option>12 derniers mois</option>
              </select>
            </div>
            
            <BarChart data={revenueData} />
            
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-around'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Revenus</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#3b82f6' }}>
                  10.4M DA
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Commandes</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#10b981' }}>
                  563
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Croissance</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#f59e0b' }}>
                  +34%
                </div>
              </div>
            </div>
          </div>

          {/* Sources de trafic */}
          <div className="chart-container" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            animationDelay: '0.2s'
          }}>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🎯</span>
              Sources de trafic
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <PieChart data={sourceData} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sourceData.map((source, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: source.color
                    }} />
                    <span style={{ fontSize: '0.9rem', color: '#374151' }}>{source.source}</span>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{source.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Produits et Performances par Wilaya */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Top Produits */}
          <div className="chart-container" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            animationDelay: '0.3s'
          }}>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🏆</span>
              Top Produits
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {productPerformance.map((product, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    background: index === 0 ? 
                      'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 
                      '#f8fafc',
                    borderRadius: '12px',
                    border: index === 0 ? '2px solid #fbbf24' : '1px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (index !== 0) {
                      e.currentTarget.style.transform = 'translateX(10px)';
                      e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: index === 0 ? '#fbbf24' : '#e5e7eb',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    marginRight: '1rem'
                  }}>
                    {product.icon}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {product.name}
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: '#64748b'
                    }}>
                      {product.sales} ventes
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#059669',
                      marginBottom: '0.25rem'
                    }}>
                      {(product.revenue / 1000000).toFixed(1)}M DA
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: product.trendUp ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.25rem'
                    }}>
                      <span>{product.trendUp ? '↑' : '↓'}</span>
                      {product.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performances par Wilaya */}
          <div className="chart-container" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            animationDelay: '0.4s'
          }}>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📍</span>
              Top Wilayas
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {wilayaData.map((wilaya, index) => {
                const maxRevenue = Math.max(...wilayaData.map(w => w.revenue));
                const percentage = (wilaya.revenue / maxRevenue) * 100;
                
                return (
                  <div key={index}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        {wilaya.wilaya}
                      </span>
                      <span style={{
                        fontSize: '0.9rem',
                        color: '#64748b'
                      }}>
                        {wilaya.orders} commandes • {(wilaya.revenue / 1000).toFixed(0)}K DA
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '24px',
                      background: '#f3f4f6',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        padding: '0 0.5rem',
                        transition: 'width 1s ease-out',
                        animation: `slideRight 1s ease-out ${index * 0.1}s both`
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Total National
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                2.45M DA
              </div>
            </div>
          </div>
        </div>

        {/* Indicateurs de performance */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '1.4rem',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
            Indicateurs clés de performance
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem'
          }}>
            {[
              { label: 'Taux d\'abandon', value: '12.3%', status: 'good', target: '< 15%' },
              { label: 'Temps moyen de livraison', value: '3.2 jours', status: 'warning', target: '< 3 jours' },
              { label: 'Satisfaction client', value: '4.6/5', status: 'good', target: '> 4.5' },
              { label: 'Retour produits', value: '2.1%', status: 'good', target: '< 3%' },
              { label: 'Coût acquisition client', value: '850 DA', status: 'warning', target: '< 800 DA' },
              { label: 'Valeur vie client', value: '45K DA', status: 'good', target: '> 40K DA' }
            ].map((metric, index) => (
              <div key={index} style={{
                textAlign: 'center',
                padding: '1.5rem',
                background: '#f8fafc',
                borderRadius: '12px',
                border: `2px solid ${metric.status === 'good' ? '#10b981' : '#f59e0b'}20`
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#64748b',
                  marginBottom: '0.5rem'
                }}>
                  {metric.label}
                </div>
                <div style={{
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: metric.status === 'good' ? '#10b981' : '#f59e0b',
                  marginBottom: '0.5rem'
                }}>
                  {metric.value}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#94a3b8'
                }}>
                  Objectif: {metric.target}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

  // Page Plans
// Page Plans de Facturation complète et animée
const Plans = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [showAnnualSavings, setShowAnnualSavings] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [showComparisonTable, setShowComparisonTable] = useState(false);
  const [animatedNumbers, setAnimatedNumbers] = useState({
    savings: 0,
    users: 0
  });

  // Animation des nombres au montage
  useEffect(() => {
    const targets = {
      savings: 25,
      users: 5000
    };

    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedNumbers({
        savings: Math.round(targets.savings * progress),
        users: Math.round(targets.users * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, increment);

    return () => clearInterval(interval);
  }, []);

  // Données des plans
  const plans = [
    {
      id: 'free',
      name: 'Gratuit',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: '€',
      description: 'Parfait pour débuter',
      color: '#6b7280',
      popular: false,
      features: [
        { text: '50 Commandes/Mois', included: true },
        { text: 'Formulaire COD de base', included: true },
        { text: '1 pays uniquement', included: true },
        { text: 'Analytics de base', included: true },
        { text: 'Pixels Facebook/Google', included: false },
        { text: 'Intégration Google Sheets', included: false },
        { text: 'Support prioritaire', included: false },
        { text: 'WhatsApp Business API', included: false }
      ],
      limits: {
        orders: 50,
        countries: 1,
        customization: 'Basique'
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 9,
      yearlyPrice: 81,
      currency: '€',
      description: 'Idéal pour les boutiques en croissance',
      color: '#667eea',
      popular: true,
      ribbon: 'POPULAIRE',
      features: [
        { text: '300 Commandes/Mois', included: true },
        { text: 'Formulaire personnalisable', included: true },
        { text: 'Multi-pays (jusqu\'à 3)', included: true },
        { text: 'Analytics avancées', included: true },
        { text: 'Pixels Facebook/Google', included: true },
        { text: 'Intégration Google Sheets', included: true },
        { text: 'WhatsApp Business API', included: false },
        { text: 'API personnalisée', included: false }
      ],
      limits: {
        orders: 300,
        countries: 3,
        customization: 'Avancée'
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 50,
      yearlyPrice: 450,
      currency: '€',
      description: 'Toutes les fonctionnalités débloquées',
      color: '#fbbf24',
      popular: false,
      ribbon: 'ENTERPRISE',
      features: [
        { text: 'Commandes Illimitées', included: true },
        { text: 'Formulaire 100% personnalisable', included: true },
        { text: 'Multi-pays illimité', included: true },
        { text: 'Analytics temps réel & IA', included: true },
        { text: 'WhatsApp Business API', included: true },
        { text: 'API personnalisée', included: true },
        { text: 'Support prioritaire 24/7', included: true },
        { text: 'Formation personnalisée', included: true }
      ],
      limits: {
        orders: 'Illimité',
        countries: 'Illimité',
        customization: 'Complète'
      }
    }
  ];

  // Calcul des économies
  const calculateSavings = (plan) => {
    if (billingPeriod === 'yearly' && plan.monthlyPrice > 0) {
      const monthlyCost = plan.monthlyPrice * 12;
      const yearlyCost = plan.yearlyPrice;
      return monthlyCost - yearlyCost;
    }
    return 0;
  };

  // Tableau de comparaison des fonctionnalités
  const ComparisonTable = () => {
    const features = [
      { category: 'Général', items: [
        { name: 'Commandes mensuelles', free: '50', pro: '300', enterprise: 'Illimité' },
        { name: 'Nombre de pays', free: '1', pro: '3', enterprise: 'Illimité' },
        { name: 'Utilisateurs', free: '1', pro: '3', enterprise: 'Illimité' }
      ]},
      { category: 'Formulaire', items: [
        { name: 'Formulaire COD', free: '✅', pro: '✅', enterprise: '✅' },
        { name: 'Personnalisation', free: '❌', pro: '✅', enterprise: '✅' },
        { name: 'Multi-langues', free: '❌', pro: '✅', enterprise: '✅' },
        { name: 'A/B Testing', free: '❌', pro: '❌', enterprise: '✅' }
      ]},
      { category: 'Intégrations', items: [
        { name: 'Google Sheets', free: '❌', pro: '✅', enterprise: '✅' },
        { name: 'Pixels tracking', free: '❌', pro: '✅', enterprise: '✅' },
        { name: 'WhatsApp API', free: '❌', pro: '❌', enterprise: '✅' },
        { name: 'API personnalisée', free: '❌', pro: '❌', enterprise: '✅' }
      ]},
      { category: 'Support', items: [
        { name: 'Support email', free: '✅', pro: '✅', enterprise: '✅' },
        { name: 'Support prioritaire', free: '❌', pro: '✅', enterprise: '✅' },
        { name: 'Support 24/7', free: '❌', pro: '❌', enterprise: '✅' },
        { name: 'Formation dédiée', free: '❌', pro: '❌', enterprise: '✅' }
      ]}
    ];

    return (
      <div style={{
        background: 'white',
        borderRadius: '25px',
        padding: '2rem',
        marginTop: '3rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          📊 Comparaison détaillée des plans
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderRadius: '12px 0 0 0' }}>
                  Fonctionnalités
                </th>
                {plans.map((plan, index) => (
                  <th key={plan.id} style={{
                    padding: '1rem',
                    textAlign: 'center',
                    borderRadius: index === plans.length - 1 ? '0 12px 0 0' : '0'
                  }}>
                    <div style={{ fontWeight: 'bold', color: plan.color }}>
                      {plan.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((category) => (
                <>
                  <tr key={category.category}>
                    <td colSpan={4} style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      fontWeight: 'bold',
                      color: '#1e293b'
                    }}>
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((item, index) => (
                    <tr key={item.name} style={{
                      background: index % 2 === 0 ? 'white' : '#fafafa'
                    }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>
                        {item.free}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#667eea', fontWeight: '600' }}>
                        {item.pro}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#fbbf24', fontWeight: '600' }}>
                        {item.enterprise}
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .plan-card {
          animation: slideInUp 0.6s ease-out;
          transition: all 0.3s ease;
        }
        .plan-card:hover {
          transform: translateY(-10px);
        }
        .feature-check {
          animation: slideInUp 0.4s ease-out;
        }
        .popular-badge {
          animation: pulse 2s infinite;
        }
      `}</style>

      {/* Éléments de fond animés */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-50px',
        left: '-50px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header CORRIGÉ */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '30px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(20px)'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '900',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            lineHeight: '1.5',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            minHeight: '4rem',
            flexWrap: 'wrap'
          }}>
            <span style={{
              fontSize: '2.5rem',
              display: 'inline-block'
            }}>💳</span>
            <span style={{
              display: 'inline-block',
              whiteSpace: 'nowrap'
            }}>
              Plans de Facturation
            </span>
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '1.3rem',
            marginTop: '0.5rem'
          }}>
            Choisissez le plan qui correspond le mieux à vos besoins
          </p>

          {/* Statistiques animées */}
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.1rem',
              color: '#475569'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🚀</span>
              <span><strong>{animatedNumbers.users.toLocaleString()}</strong> boutiques actives</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.1rem',
              color: '#475569'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⭐</span>
              <span>Note moyenne <strong>4.8/5</strong></span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.1rem',
              color: '#475569'
            }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
              <span>Support <strong>24/7</strong></span>
            </div>
          </div>
        </div>

        {/* Notification de réduction */}
        {showAnnualSavings && (
          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            borderRadius: '20px',
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '2px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.15)',
            animation: 'slideInUp 0.5s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="popular-badge" style={{
                fontSize: '2.5rem',
                background: 'rgba(59, 130, 246, 0.2)',
                padding: '0.75rem',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                💡
              </div>
              <div>
                <h3 style={{ 
                  color: '#1e293b', 
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '0.25rem'
                }}>
                  Les plans annuels sont là !
                </h3>
                <p style={{ 
                  margin: 0, 
                  color: '#64748b', 
                  fontSize: '0.95rem' 
                }}>
                  Maximisez vos économies avec le Plan Annuel. 
                  Économisez jusqu'à <strong style={{ color: '#059669' }}>{animatedNumbers.savings}% !</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAnnualSavings(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.8rem',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Switch Mensuel/Annuel */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '3rem'
        }}>
          <span style={{
            color: billingPeriod === 'monthly' ? '#1e293b' : '#94a3b8',
            fontWeight: billingPeriod === 'monthly' ? 'bold' : 'normal',
            fontSize: '1.1rem',
            transition: 'all 0.3s ease'
          }}>
            Mensuel
          </span>
          <div
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            style={{
              width: '70px',
              height: '35px',
              background: billingPeriod === 'yearly' ? 
                'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                '#e5e7eb',
              borderRadius: '25px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: billingPeriod === 'yearly' ? 
                '0 4px 15px rgba(16, 185, 129, 0.3)' : 
                'inset 0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{
              width: '30px',
              height: '30px',
              background: 'white',
              borderRadius: '50%',
              position: 'absolute',
              top: '2.5px',
              left: billingPeriod === 'yearly' ? '37px' : '2.5px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }} />
          </div>
          <span style={{
            color: billingPeriod === 'yearly' ? '#1e293b' : '#94a3b8',
            fontWeight: billingPeriod === 'yearly' ? 'bold' : 'normal',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease'
          }}>
            Annuel
            {billingPeriod === 'yearly' && (
              <span style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
              }}>
                -25%
              </span>
            )}
          </span>
        </div>

        {/* Cartes des plans */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {plans.map((plan, index) => {
            const savings = calculateSavings(plan);
            const currentPrice = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            
            return (
              <div
                key={plan.id}
                className="plan-card"
                style={{
                  background: plan.id === 'enterprise' ? 
                    'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 
                    'white',
                  borderRadius: '25px',
                  padding: '2.5rem',
                  position: 'relative',
                  border: plan.popular ? '3px solid' : '2px solid',
                  borderColor: plan.popular ? '#667eea' : 
                    plan.id === 'enterprise' ? '#fbbf24' : '#e5e7eb',
                  boxShadow: plan.popular ? 
                    '0 30px 60px rgba(102, 126, 234, 0.25)' : 
                    '0 20px 50px rgba(0,0,0,0.1)',
                  transform: plan.popular ? 'scale(1.02)' : 'scale(1)',
                  animationDelay: `${index * 0.1}s`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 40px 80px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = plan.popular ? 'scale(1.02)' : 'scale(1)';
                  e.currentTarget.style.boxShadow = plan.popular ? 
                    '0 30px 60px rgba(102, 126, 234, 0.25)' : 
                    '0 20px 50px rgba(0,0,0,0.1)';
                }}
              >
                {/* Badge Populaire/Enterprise */}
                {plan.ribbon && (
                  <div style={{
                    position: 'absolute',
                    top: '-15px',
                    right: '30px',
                    background: plan.popular ? 
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                      'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: plan.id === 'enterprise' ? '#1e293b' : 'white',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '25px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                  }}>
                    <span>⭐</span>
                    {plan.ribbon}
                  </div>
                )}

                {/* Header du plan */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    color: plan.id === 'enterprise' ? 'white' : '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    {plan.name}
                  </h3>
                  <p style={{
                    color: plan.id === 'enterprise' ? '#cbd5e1' : '#64748b',
                    fontSize: '0.95rem',
                    marginBottom: '1.5rem'
                  }}>
                    {plan.description}
                  </p>

                  {/* Prix */}
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{
                      fontSize: '3.5rem',
                      fontWeight: 'bold',
                      color: plan.id === 'enterprise' ? '#fbbf24' : plan.color,
                      display: 'inline-block'
                    }}>
                      {currentPrice}{plan.currency}
                    </span>
                    <span style={{
                      color: plan.id === 'enterprise' ? '#94a3b8' : '#64748b',
                      fontSize: '1rem',
                      marginLeft: '0.5rem'
                    }}>
                      /{billingPeriod === 'yearly' ? 'an' : 'mois'}
                    </span>
                  </div>

                  {/* Économies annuelles */}
                  {savings > 0 && (
                    <div style={{
                      background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                      color: '#059669',
                      padding: '0.5rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      marginTop: '0.5rem'
                    }}>
                      💰 Économisez {savings}€ par an !
                    </div>
                  )}
                </div>

                {/* Liste des fonctionnalités */}
                <div style={{
                  marginBottom: '2rem',
                  borderTop: plan.id === 'enterprise' ? 
                    '1px solid rgba(255,255,255,0.1)' : 
                    '1px solid #e5e7eb',
                  paddingTop: '1.5rem'
                }}>
                  {plan.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="feature-check"
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        marginBottom: '0.75rem',
                        animationDelay: `${idx * 0.05}s`
                      }}
                    >
                      <span style={{
                        fontSize: '1.2rem',
                        color: feature.included ? 
                          (plan.id === 'enterprise' ? '#fbbf24' : plan.color) : 
                          '#dc2626',
                        marginTop: '-2px'
                      }}>
                        {feature.included ? '✓' : '✗'}
                      </span>
                      <span style={{
                        color: plan.id === 'enterprise' ? 
                          (feature.included ? '#e2e8f0' : '#94a3b8') : 
                          (feature.included ? '#374151' : '#94a3b8'),
                        fontSize: '0.95rem',
                        textDecoration: feature.included ? 'none' : 'line-through'
                      }}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bouton CTA */}
                <button
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    width: '100%',
                    padding: '1.25rem',
                    background: plan.id === 'free' ? '#6b7280' : 
                      plan.popular ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                      'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: plan.id === 'enterprise' ? '#1e293b' : 'white',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                  }}
                >
                  {plan.id === 'free' ? (
                    <>Plan Actuel</>
                  ) : (
                    <>
                      <span>⚡</span>
                      Passer au {plan.name}
                    </>
                  )}
                </button>

                {/* Informations supplémentaires */}
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: plan.id === 'enterprise' ? 
                    'rgba(255,255,255,0.05)' : 
                    '#f8fafc',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  color: plan.id === 'enterprise' ? '#94a3b8' : '#64748b',
                  textAlign: 'center'
                }}>
                  ✨ Annulation possible à tout moment
                </div>
              </div>
            );
          })}
        </div>

        {/* Bouton comparaison */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button
            onClick={() => setShowComparisonTable(!showComparisonTable)}
            style={{
              padding: '1rem 2rem',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '15px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#667eea';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>📊</span>
            {showComparisonTable ? 'Masquer' : 'Voir'} la comparaison détaillée
          </button>
        </div>

        {/* Tableau de comparaison */}
        {showComparisonTable && <ComparisonTable />}

        {/* Section FAQ et garanties */}
        <div style={{
          marginTop: '4rem',
          padding: '3rem',
          background: 'white',
          borderRadius: '25px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1e293b',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            🎯 Pourquoi choisir RT COD BOOST 2.0 ?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {[
              {
                icon: '🚀',
                title: 'Installation rapide',
                description: 'Configuration en moins de 2 minutes'
              },
              {
                icon: '💰',
                title: 'ROI garanti',
                description: '+300% de conversion moyenne'
              },
              {
                icon: '🔒',
                title: 'Paiements sécurisés',
                description: 'Via Shopify Billing'
              },
              {
                icon: '🎯',
                title: 'Support dédié',
                description: 'Équipe disponible 24/7'
              },
              {
                icon: '📈',
                title: 'Mises à jour gratuites',
                description: 'Nouvelles fonctionnalités régulières'
              },
              {
                icon: '✅',
                title: 'Sans engagement',
                description: 'Annulation à tout moment'
              }
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  padding: '1.5rem',
                  background: '#f8fafc',
                  borderRadius: '15px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                  {item.icon}
                </div>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginBottom: '0.5rem'
                }}>
                  {item.title}
                </h4>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#64748b'
                }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Témoignage */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center',
            border: '2px solid rgba(59, 130, 246, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⭐⭐⭐⭐⭐</div>
            <p style={{
              fontSize: '1.1rem',
              color: '#1e293b',
              fontStyle: 'italic',
              marginBottom: '1rem',
              lineHeight: '1.6'
            }}>
              "RT COD BOOST a transformé notre boutique ! Nous avons triplé nos conversions en seulement 2 mois. 
              Le support est exceptionnel et les fonctionnalités sont exactement ce dont nous avions besoin."
            </p>
            <div style={{
              fontWeight: 'bold',
              color: '#667eea'
            }}>
              - Sarah M., E-commerçante à Alger
            </div>
          </div>
        </div>

        {/* Footer de sécurité */}
        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <p style={{
            fontSize: '0.95rem',
            opacity: 0.9,
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            💳 Tous les paiements sont gérés de manière sécurisée via Shopify Billing. 
            Vous pouvez changer de plan à tout moment. Les commandes déjà utilisées ce mois-ci 
            compteront vers la limite du nouveau plan. Aucun engagement, annulation possible à tout moment.
          </p>
        </div>
      </div>
    </div>
  );
};

  // Page Paramètres
const Settings = () => {
  const [activeTab, setActiveTab] = useState('visibility');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [showNotification, setShowNotification] = useState(false);
  const [formStatus, setFormStatus] = useState('disabled');
  
  const [settings, setSettings] = useState({
    hideAddToCart: false,
    hideBuyNow: false,
    disableOnHomepage: false,
    disableOnCollections: false,
    specificProducts: false,
    specificCollections: false,
    specificCountries: false,
    enableCOD: true,
    enableUTM: false,
    enableShopifyIntegration: true,
    formTitle: 'Confirmer votre commande',
    successMessage: 'Merci pour votre commande !',
    customCSS: '',
    enableGoogleSheets: false,
    googleSheetsId: '',
    googleSheetsName: '',
    facebookPixel: { enabled: false, pixelId: '', testEventCode: '' },
    googleAnalytics: { enabled: false, measurementId: '' },
    tiktokPixel: { enabled: false, pixelId: '' },
    snapchatPixel: { enabled: false, pixelId: '' },
    pinterestTag: { enabled: false, tagId: '' }
  });

  const handleFormStatusChange = (status) => {
    setFormStatus(status);
  };

  const handleCheckboxChange = (field) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePixel = (pixelType, enabled) => {
    setSettings(prev => ({
      ...prev,
      [pixelType]: {
        ...prev[pixelType],
        enabled: enabled
      }
    }));
  };

  const updatePixelField = (pixelType, field, value) => {
    setSettings(prev => ({
      ...prev,
      [pixelType]: {
        ...prev[pixelType],
        [field]: value
      }
    }));
  };

  const saveSettings = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setShowNotification(true);
      setTimeout(() => {
        setSaveStatus('idle');
        setShowNotification(false);
      }, 3000);
    }, 1500);
  };

  const styles = {
    container: {
      padding: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    },
    header: {
      textAlign: 'center',
      marginBottom: '3rem',
      padding: '4rem 3rem',
      background: 'rgba(255, 255, 255, 0.98)',
      borderRadius: '30px',
      boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(20px)'
    },
    headerTitle: {
      fontSize: '3rem',
      fontWeight: '900',
      marginBottom: '1rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      lineHeight: '1.2',
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem'
    },
    mainLayout: {
      display: 'grid',
      gridTemplateColumns: '250px 1fr',
      gap: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    sidebar: {
      background: 'white',
      borderRadius: '20px',
      padding: '1.5rem',
      height: 'fit-content',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    },
    tabButton: {
      width: '100%',
      padding: '1rem',
      marginBottom: '0.5rem',
      border: 'none',
      borderRadius: '12px',
      fontSize: '1rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      transition: 'all 0.3s ease'
    },
    contentArea: {
      background: 'white',
      borderRadius: '20px',
      padding: '2.5rem',
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
    },
    sectionTitle: {
      fontSize: '1.8rem',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    infoBox: {
      padding: '2rem',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      borderRadius: '15px',
      marginBottom: '2rem',
      border: '2px solid rgba(59, 130, 246, 0.2)'
    },
    settingsSection: {
      padding: '2rem',
      background: '#f8fafc',
      borderRadius: '15px',
      marginBottom: '2rem'
    },
    toggleButton: {
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '10px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '0.95rem'
    },
    checkbox: {
      width: '22px',
      height: '22px',
      accentColor: '#667eea',
      cursor: 'pointer',
      marginTop: '2px'
    },
    inputField: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '0.95rem',
      transition: 'all 0.3s ease'
    },
    saveButton: {
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 100,
      padding: '1rem 2rem',
      background: saveStatus === 'saved' ? 
        'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
        saveStatus === 'saving' ?
        'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '15px',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      transition: 'all 0.3s ease'
    },
    pixelCard: {
      padding: '2rem',
      borderRadius: '15px',
      marginBottom: '1.5rem',
      transition: 'all 0.3s ease'
    },
    notification: {
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      padding: '1rem 1.5rem',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      display: showNotification ? 'flex' : 'none',
      alignItems: 'center',
      gap: '0.75rem',
      zIndex: 200,
      borderLeft: '4px solid #10b981'
    }
  };

  const tabs = [
    { id: 'visibility', label: 'Visibilité', icon: '👁️' },
    { id: 'general', label: 'Général', icon: '⚙️' },
    { id: 'pixels', label: 'Pixels', icon: '📊' },
    { id: 'google-sheets', label: 'Google Sheets', icon: '📄' },
    { id: 'integrations', label: 'Partenaires et Intégrations', icon: '🔗' }
  ];

  const platforms = [
    { icon: '📧', name: 'Mailchimp', desc: 'Email marketing', status: 'Bientôt' },
    { icon: '💬', name: 'WhatsApp Business', desc: 'Notifications', status: 'Actif' },
    { icon: '📊', name: 'Klaviyo', desc: 'Automation', status: 'Bientôt' },
    { icon: '📦', name: 'Zapier', desc: 'Automatisation', status: 'Bientôt' },
    { icon: '📱', name: 'SMS Marketing', desc: 'SMS Campaigns', status: 'Actif' },
    { icon: '🎯', name: 'ActiveCampaign', desc: 'CRM & Marketing', status: 'Bientôt' }
  ];

  const pixelConfigs = [
    {
      id: 'facebookPixel',
      name: 'Facebook Pixel',
      icon: 'f',
      iconBg: '#1877f2',
      events: 'InstallCheckout, Purchase, AddToCart',
      fields: ['pixelId', 'testEventCode']
    },
    {
      id: 'googleAnalytics',
      name: 'Google Analytics (GA4)',
      icon: 'G',
      iconBg: 'linear-gradient(135deg, #4285f4 0%, #ea4335 100%)',
      events: 'begin_checkout, purchase',
      fields: ['measurementId']
    },
    {
      id: 'tiktokPixel',
      name: 'TikTok Pixel',
      icon: '🎵',
      iconBg: '#000000',
      events: 'InitiateCheckout, PlaceAnOrder',
      fields: ['pixelId']
    },
    {
      id: 'snapchatPixel',
      name: 'Snapchat Pixel',
      icon: '👻',
      iconBg: '#FFFC00',
      events: 'PURCHASE, ADD_CART',
      fields: ['pixelId']
    },
    {
      id: 'pinterestTag',
      name: 'Pinterest Tag',
      icon: 'P',
      iconBg: '#E60023',
      events: 'checkout, addtocart',
      fields: ['tagId']
    }
  ];

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>
            <span style={{ fontSize: '2.5rem', display: 'inline-block', verticalAlign: 'middle' }}>⚙️</span>
            <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>Paramètres</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.3rem', marginTop: '0.5rem' }}>
            Configurez votre application RT COD BOOST
          </p>
        </div>

        <div style={styles.mainLayout}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabButton,
                  background: activeTab === tab.id ? 
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                    'transparent',
                  color: activeTab === tab.id ? 'white' : '#64748b',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal'
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div style={styles.contentArea}>
            {/* Visibilité Tab */}
            {activeTab === 'visibility' && (
              <div>
                <h2 style={styles.sectionTitle}>
                  <span>👁️</span>
                  Visibilité
                </h2>

                <div style={styles.infoBox}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>
                    Activer ou désactiver votre formulaire
                  </h3>
                  <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Vous pouvez choisir de désactiver votre formulaire ou de l'activer uniquement sur les pages de produits, 
                    uniquement sur la page du panier ou sur les pages du panier et des produits.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <button
                      onClick={() => handleFormStatusChange('disabled')}
                      style={{
                        ...styles.toggleButton,
                        background: formStatus === 'disabled' ? '#ef4444' : '#f3f4f6',
                        color: formStatus === 'disabled' ? 'white' : '#6b7280'
                      }}
                    >
                      Désactivé
                    </button>
                    <button
                      onClick={() => handleFormStatusChange('cart-only')}
                      style={{
                        ...styles.toggleButton,
                        background: formStatus === 'cart-only' ? 
                          'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f3f4f6',
                        color: formStatus === 'cart-only' ? 'white' : '#6b7280'
                      }}
                    >
                      Uniquement la page du panier
                    </button>
                    <button
                      onClick={() => handleFormStatusChange('product-only')}
                      style={{
                        ...styles.toggleButton,
                        background: formStatus === 'product-only' ? 
                          'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f3f4f6',
                        color: formStatus === 'product-only' ? 'white' : '#6b7280'
                      }}
                    >
                      Uniquement les pages produits
                    </button>
                    <button
                      onClick={() => handleFormStatusChange('both')}
                      style={{
                        ...styles.toggleButton,
                        background: formStatus === 'both' ? 
                          'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f3f4f6',
                        color: formStatus === 'both' ? 'white' : '#6b7280'
                      }}
                    >
                      Panier et pages de produits
                    </button>
                  </div>
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '1rem',
                    borderRadius: '10px',
                    borderLeft: '4px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 'bold' }}>
                      <span>⚠️</span>
                      <span>Releasit COD Form est correctement activé sur votre thème. [Concepteur de formulaires]</span>
                    </div>
                    <span style={{ cursor: 'pointer', color: '#ef4444' }}>✕</span>
                  </div>
                </div>

                <div style={styles.settingsSection}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>
                    Paramètres des pages produits
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.hideAddToCart}
                        onChange={() => handleCheckboxChange('hideAddToCart')}
                        style={styles.checkbox}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          Masquer le bouton Ajouter au panier sur les pages de produits
                        </div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.hideBuyNow}
                        onChange={() => handleCheckboxChange('hideBuyNow')}
                        style={styles.checkbox}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          Masquer le bouton Acheter maintenant sur les pages de produits
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={styles.settingsSection}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>
                    Paramètres des autres pages
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.disableOnHomepage}
                        onChange={() => handleCheckboxChange('disableOnHomepage')}
                        style={styles.checkbox}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          Désactiver Releasit sur votre page d'accueil
                        </div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.disableOnCollections}
                        onChange={() => handleCheckboxChange('disableOnCollections')}
                        style={styles.checkbox}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          Désactiver Releasit sur vos pages de collections
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={styles.settingsSection}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>
                    Limiter votre formulaire de commande à des produits, collections, pays ou totaux de commandes spécifiques
                  </h3>
                  <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Ici, vous pouvez choisir d'afficher votre formulaire de commande contre remboursement uniquement pour les clients de certains pays ou pour des produits et des collections spécifiques.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.specificProducts}
                        onChange={() => handleCheckboxChange('specificProducts')}
                        style={styles.checkbox}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          Activer votre formulaire uniquement pour des produits et des collections spécifiques
                        </div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.specificCollections}
                        onChange={() => handleCheckboxChange('specificCollections')}
                        style={styles.checkbox}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          Désactiver votre formulaire pour un ou plusieurs produits et collections
                        </div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.specificCountries}
                        onChange={() => handleCheckboxChange('specificCountries')}
                        style={styles.checkbox}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          Activer votre formulaire uniquement pour certains pays
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Général Tab */}
            {activeTab === 'general' && (
              <div>
                <h2 style={styles.sectionTitle}>
                  <span>⚙️</span>
                  Général
                </h2>

                <div style={styles.settingsSection}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>
                    Personnalisez vos paramètres avancés
                  </h3>
                  
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                      Options de commande
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={settings.enableCOD}
                          onChange={() => handleCheckboxChange('enableCOD')}
                          style={styles.checkbox}
                        />
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            Créer des commandes avec le mode de paiement Cash on Delivery (COD)
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>
                            Active le paiement à la livraison pour vos clients
                          </div>
                        </div>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={settings.enableUTM}
                          onChange={() => handleCheckboxChange('enableUTM')}
                          style={styles.checkbox}
                        />
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            Activer le suivi UTM
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>
                            Suivre les sources de trafic et les campagnes marketing
                          </div>
                        </div>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={settings.enableShopifyIntegration}
                          onChange={() => handleCheckboxChange('enableShopifyIntegration')}
                          style={styles.checkbox}
                        />
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            Intégration Shopify automatique
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>
                            Synchroniser automatiquement avec votre boutique Shopify
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                      Messages personnalisés
                    </h4>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                        Titre du formulaire
                      </label>
                      <input
                        type="text"
                        value={settings.formTitle}
                        onChange={(e) => handleInputChange('formTitle', e.target.value)}
                        placeholder="Titre du formulaire"
                        style={styles.inputField}
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                        Message de succès
                      </label>
                      <input
                        type="text"
                        value={settings.successMessage}
                        onChange={(e) => handleInputChange('successMessage', e.target.value)}
                        placeholder="Message après confirmation"
                        style={styles.inputField}
                      />
                    </div>
                  </div>
                </div>

                <div style={styles.settingsSection}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>
                    Ajouter un CSS personnalisé (avancé)
                  </h3>
                  <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.95rem' }}>
                    Personnalisez l'apparence de votre formulaire avec du CSS personnalisé
                  </p>
                  <textarea
                    value={settings.customCSS}
                    onChange={(e) => handleInputChange('customCSS', e.target.value)}
                    placeholder="/* Votre CSS personnalisé ici */&#10;.rt-cod-form {&#10;    /* Vos styles */&#10;}"
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      padding: '1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      background: 'white',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Pixels Tab */}
            {activeTab === 'pixels' && (
              <div>
                <h2 style={styles.sectionTitle}>
                  <span>📊</span>
                  Pixels
                </h2>

                <div style={styles.infoBox}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                    Configurez vos pixels analytiques
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                    Dans cette section, vous pouvez ajouter des pixels de suivi d'analyse pour suivre vos achats de formulaires et vos événements.
                  </p>
                </div>

                {pixelConfigs.map(pixel => (
                  <div
                    key={pixel.id}
                    style={{
                      ...styles.pixelCard,
                      background: settings[pixel.id].enabled ? 
                        'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)' : 
                        '#f8fafc',
                      border: settings[pixel.id].enabled ? 
                        '2px solid #3b82f6' : 
                        '2px solid #e5e7eb'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: settings[pixel.id].enabled ? '1.5rem' : 0
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          background: pixel.iconBg,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          color: pixel.icon === '🎵' || pixel.icon === '👻' ? 'inherit' : 'white',
                          fontWeight: 'bold'
                        }}>
                          {pixel.icon}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                            {pixel.name}
                          </h4>
                          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                            {pixel.events}
                          </p>
                        </div>
                      </div>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '60px',
                        height: '30px',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={settings[pixel.id].enabled}
                          onChange={(e) => togglePixel(pixel.id, e.target.checked)}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: settings[pixel.id].enabled ? 
                            'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                            '#e5e7eb',
                          borderRadius: '30px',
                          transition: 'all 0.3s ease'
                        }}>
                          <span style={{
                            position: 'absolute',
                            left: settings[pixel.id].enabled ? '32px' : '4px',
                            top: '3px',
                            width: '24px',
                            height: '24px',
                            background: 'white',
                            borderRadius: '50%',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                          }} />
                        </span>
                      </label>
                    </div>

                    {settings[pixel.id].enabled && (
                      <div>
                        {pixel.id === 'facebookPixel' && (
                          <>
                            <div style={{ marginBottom: '1rem' }}>
                              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                                Facebook Pixel ID
                              </label>
                              <input
                                type="text"
                                value={settings.facebookPixel.pixelId}
                                onChange={(e) => updatePixelField('facebookPixel', 'pixelId', e.target.value)}
                                placeholder="398504442854770"
                                style={styles.inputField}
                              />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                                Test Event Code (Optionnel)
                              </label>
                              <input
                                type="text"
                                value={settings.facebookPixel.testEventCode}
                                onChange={(e) => updatePixelField('facebookPixel', 'testEventCode', e.target.value)}
                                placeholder="TEST12345"
                                style={styles.inputField}
                              />
                            </div>
                          </>
                        )}
                        {pixel.id === 'googleAnalytics' && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                              Google Analytics Measurement ID
                            </label>
                            <input
                              type="text"
                              value={settings.googleAnalytics.measurementId}
                              onChange={(e) => updatePixelField('googleAnalytics', 'measurementId', e.target.value)}
                              placeholder="G-XXXXXXXXXX"
                              style={styles.inputField}
                            />
                          </div>
                        )}
                        {pixel.id === 'tiktokPixel' && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                              TikTok Pixel ID
                            </label>
                            <input
                              type="text"
                              value={settings.tiktokPixel.pixelId}
                              onChange={(e) => updatePixelField('tiktokPixel', 'pixelId', e.target.value)}
                              placeholder="CXXXXXXXXXXXXXXXXX"
                              style={styles.inputField}
                            />
                          </div>
                        )}
                        {pixel.id === 'snapchatPixel' && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                              Snapchat Pixel ID
                            </label>
                            <input
                              type="text"
                              value={settings.snapchatPixel.pixelId}
                              onChange={(e) => updatePixelField('snapchatPixel', 'pixelId', e.target.value)}
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                              style={styles.inputField}
                            />
                          </div>
                        )}
                        {pixel.id === 'pinterestTag' && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                              Pinterest Tag ID
                            </label>
                            <input
                              type="text"
                              value={settings.pinterestTag.tagId}
                              onChange={(e) => updatePixelField('pinterestTag', 'tagId', e.target.value)}
                              placeholder="2612XXXXXXXXX"
                              style={styles.inputField}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Google Sheets Tab */}
            {activeTab === 'google-sheets' && (
              <div>
                <h2 style={styles.sectionTitle}>
                  <span>📄</span>
                  Google Sheets
                </h2>

                <div style={styles.infoBox}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                    Intégration Google Sheets
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                    Exportez automatiquement vos commandes vers Google Sheets pour un suivi et une analyse faciles.
                  </p>
                </div>

                <div style={styles.settingsSection}>
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.enableGoogleSheets}
                        onChange={() => handleCheckboxChange('enableGoogleSheets')}
                        style={styles.checkbox}
                      />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          Activer l'export automatique vers Google Sheets
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>
                          Les commandes seront automatiquement ajoutées à votre feuille de calcul
                        </div>
                      </div>
                    </label>
                  </div>

                  {settings.enableGoogleSheets && (
                    <div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                          ID de la feuille Google Sheets
                        </label>
                        <input
                          type="text"
                          value={settings.googleSheetsId}
                          onChange={(e) => handleInputChange('googleSheetsId', e.target.value)}
                          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                          style={styles.inputField}
                        />
                      </div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                          Nom de la feuille
                        </label>
                        <input
                          type="text"
                          value={settings.googleSheetsName}
                          onChange={(e) => handleInputChange('googleSheetsName', e.target.value)}
                          placeholder="Sheet1"
                          style={styles.inputField}
                        />
                      </div>
                      <button 
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Connecter Google Sheets
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div>
                <h2 style={styles.sectionTitle}>
                  <span>🔗</span>
                  Partenaires et Intégrations
                </h2>

                <div style={styles.infoBox}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                    Connectez vos outils préférés
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                    Intégrez RT COD BOOST avec vos plateformes de marketing et de gestion préférées.
                  </p>
                </div>

                <div style={styles.settingsSection}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>
                    Plateformes disponibles
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {platforms.map((platform, index) => (
                      <div 
                        key={index}
                        style={{
                          padding: '1.5rem',
                          background: 'white',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{platform.icon}</div>
                        <h4 style={{ margin: 0, color: '#1e293b' }}>{platform.name}</h4>
                        <p style={{ margin: '0.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>{platform.desc}</p>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          background: platform.status === 'Actif' ? 
                            'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold'
                        }}>
                          {platform.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <button onClick={saveSettings} style={styles.saveButton}>
          <span style={{ fontSize: '1.3rem' }}>
            {saveStatus === 'saving' ? '⏳' : saveStatus === 'saved' ? '✅' : '💾'}
          </span>
          <span>
            {saveStatus === 'saving' ? 'Enregistrement...' : 
             saveStatus === 'saved' ? 'Enregistré!' : 
             'Paramètres sauvegardés'}
          </span>
        </button>

        {/* Notification */}
        <div style={styles.notification}>
          <span style={{ fontSize: '1.3rem' }}>✅</span>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>Paramètres enregistrés avec succès!</span>
        </div>
      </div>
    </div>
  );
};

  // Rendu principal
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <Navigation />
      
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'form-builder' && <FormBuilder />}
      {currentPage === 'delivery-rates' && <DeliveryRates />}
      {currentPage === 'orders' && <Orders />}
      {currentPage === 'analytics' && <Analytics />}
      {currentPage === 'plans' && <Plans />}
      {currentPage === 'settings' && <Settings />}
      
      {/* Modal Preview */}
      {previewMode && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.6)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '2rem', 
            maxWidth: '500px', 
            width: '90%', 
            maxHeight: '90vh', 
            overflow: 'auto', 
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem' 
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#1e293b', 
                margin: 0 
              }}>
                🛍️ Aperçu Formulaire COD
              </h2>
              <button 
                onClick={() => setPreviewMode(false)} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  fontSize: '1.5rem', 
                  color: '#64748b', 
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <button 
              onClick={() => setPreviewMode(false)}
              style={{
                width: '100%', 
                padding: '1rem', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                border: 'none', 
                borderRadius: `${borderRadius}px`, 
                fontSize: '1.1rem', 
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
              }}
            >
              Fermer l'aperçu
            </button>
          </div>
        </div>
      )}

      {/* Modal Order Details */}
      {showOrderModal && selectedOrder && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.6)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '2.5rem', 
            maxWidth: '700px', 
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '2rem',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '1rem'
            }}>
              <h2 style={{ 
                fontSize: '1.6rem', 
                fontWeight: 'bold', 
                color: '#1e293b', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📦 Détails de la commande
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}>
                  {selectedOrder.id}
                </span>
              </h2>
              <button 
                onClick={() => setShowOrderModal(false)} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  fontSize: '1.8rem', 
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  👤 Client
                </div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                  {selectedOrder.client}
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  📱 Téléphone
                </div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                  {selectedOrder.phone}
                </div>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '2rem', 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button 
                onClick={() => setShowOrderModal(false)} 
                style={{ 
                  background: '#f3f4f6', 
                  color: '#374151', 
                  border: 'none', 
                  padding: '0.875rem 1.75rem', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Export */}
      {showExportModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.6)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '2rem', 
            maxWidth: '500px', 
            width: '90%',
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1.5rem'
            }}>
              📥 Exporter les commandes
            </h3>
            
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '10px',
              border: '2px solid rgba(59, 130, 246, 0.2)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                <strong>{filteredOrders.length}</strong> commandes seront exportées
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button 
                onClick={() => setShowExportModal(false)} 
                style={{ 
                  background: '#f3f4f6', 
                  color: '#374151', 
                  border: 'none', 
                  padding: '0.875rem 1.75rem', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  alert(`Export de ${filteredOrders.length} commandes`);
                  setShowExportModal(false);
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '0.875rem 1.75rem', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
                }}
              >
                Exporter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}