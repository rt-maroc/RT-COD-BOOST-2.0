import { useState } from 'react';

export default function FormBuilder() {
  const [formMode, setFormMode] = useState('integrated');
  const [selectedCountry, setSelectedCountry] = useState('Morocco');
  const [showMultiplePages, setShowMultiplePages] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState(35.00);
  const [subtotal, setSubtotal] = useState(19.99);
  const [total, setTotal] = useState(54.99);
  const [formStyle, setFormStyle] = useState({
    backgroundColor: 'rgba(0,0,0,0.1)',
    textColor: 'rgba(255,255,255,1)',
    borderRadius: '0.5',
    borderWidth: '0.5',
    borderColor: 'rgba(0,0,0,0.1)'
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f6f6f7',
      color: '#202223',
      lineHeight: '1.5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #00d4aa 0%, #008060 100%)',
        color: 'white',
        padding: '1.5rem 0',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem', margin: 0 }}>
          📝 Concepteur de Formulaire
        </h1>
        <p style={{ fontSize: '1rem', opacity: '0.9', margin: 0 }}>
          Configurez votre formulaire COD personnalisé
        </p>
      </div>

      {/* Container */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* Navigation tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #e1e3e5',
          paddingBottom: '1rem'
        }}>
          <button style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            fontSize: '1rem',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #00d4aa 0%, #008060 100%)',
            color: 'white',
            cursor: 'pointer',
            borderBottom: '3px solid #00d4aa'
          }}>
            📝 Concepteur de Formulaire
          </button>
          <button style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            fontSize: '1rem',
            fontWeight: '600',
            background: '#f6f6f7',
            color: '#666',
            cursor: 'pointer'
          }}>
            🚚 Tarifs de Livraison
          </button>
        </div>

        {/* Main content grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '2rem',
          alignItems: 'start'
        }}>
          
          {/* Left column - Form configuration */}
          <div>
            
            {/* Step 1: Form mode selection */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              marginBottom: '2rem',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e1e3e5',
                background: '#fafbfb'
              }}>
                <h3 style={{ margin: 0 }}>1. Sélectionnez votre mode de formulaire</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div 
                    onClick={() => setFormMode('popup')}
                    style={{
                      border: formMode === 'popup' ? '2px solid #00d4aa' : '2px solid #e1e3e5',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: formMode === 'popup' ? '#f0fffe' : 'white',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
                    <strong>Popup</strong>
                  </div>
                  <div 
                    onClick={() => setFormMode('integrated')}
                    style={{
                      border: formMode === 'integrated' ? '2px solid #00d4aa' : '2px solid #e1e3e5',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: formMode === 'integrated' ? '#f0fffe' : 'white',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔗</div>
                    <strong>Intégré</strong>
                  </div>
                </div>
                
                {formMode === 'integrated' && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: '#e6f3ff',
                    borderRadius: '8px',
                    borderLeft: '4px solid #0066cc',
                    color: '#003d7a'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>ℹ️</span>
                      <span>Vos clients verront le formulaire intégré directement sur leurs pages sans qu'il n'aient pas à cliquer sur un bouton pour l'ouvrir.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Country selection */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              marginBottom: '2rem',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e1e3e5',
                background: '#fafbfb'
              }}>
                <h3 style={{ margin: 0 }}>2. Sélectionnez votre pays de formulaire</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Pays</label>
                  <select 
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #c9cccf',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="Morocco">Morocco</option>
                    <option value="Algeria">Algeria</option>
                    <option value="Tunisia">Tunisia</option>
                    <option value="Egypt">Egypt</option>
                  </select>
                </div>
                
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fff4e6',
                  borderRadius: '8px',
                  borderLeft: '4px solid #ff8c00',
                  color: '#994c00',
                  marginBottom: '1rem'
                }}>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    Toutes les commandes créées grâce au formulaire seront enregistrées avec ce pays que vous sélectionnez ici. Si vous ne trouvez pas votre pays, n'hésitez pas à nous contacter. Nous serons heureux d'intégrer les conditions dont vous avez besoin dans votre formulaire de commande.
                  </p>
                </div>

                <div>
                  <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Voulez-vous dans plusieurs pays ?</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={showMultiplePages}
                      onChange={(e) => setShowMultiplePages(e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <label>Activer le mode pays</label>
                  </div>
                  <p style={{ color: '#666', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                    Activez plusieurs pays sur le formulaire ici →
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Form customization */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              marginBottom: '2rem',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e1e3e5',
                background: '#fafbfb'
              }}>
                <h3 style={{ margin: 0 }}>3. Personnalisez votre formulaire</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                
                {/* Form style options */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: '600', margin: 0 }}>
                      Les blocs gris sont <strong>désactivés</strong> sur votre formulaire. Utilisez le bouton en forme d'œil pour les activer.
                    </p>
                    <button style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00d4aa',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}>
                      Généraliser par défaut
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    
                    {/* Field toggles */}
                    {[
                      { label: 'Les blocs gris sont désactivés', active: false },
                      { label: 'Les blocs blancs sont actifs', active: true },
                      { label: 'Les blocs bleus sont actifs', active: true }
                    ].map((field, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        border: '1px solid #e1e3e5',
                        borderRadius: '6px',
                        background: field.active ? 'white' : '#f6f6f7'
                      }}>
                        <input type="checkbox" defaultChecked={field.active} />
                        <span style={{ fontSize: '0.875rem' }}>{field.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced styling */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input 
                      type="checkbox" 
                      checked={showAdvancedSettings}
                      onChange={(e) => setShowAdvancedSettings(e.target.checked)}
                    />
                    <span style={{ fontWeight: '600' }}>Cliquez sur la roue dentée pour modifier un bloc.</span>
                  </div>

                  {showAdvancedSettings && (
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#fafbfb',
                      borderRadius: '8px',
                      border: '1px solid #e1e3e5'
                    }}>
                      <h4 style={{ margin: '0 0 1rem 0' }}>Style de formulaire</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                            Couleur du texte
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="color" 
                              value="#000000" 
                              style={{
                                width: '40px',
                                height: '40px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            />
                            <span style={{ fontSize: '0.875rem' }}>Taille du texte</span>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                            Couleur de l'arrière-plan
                          </label>
                          <input 
                            type="color" 
                            value="#ffffff" 
                            style={{
                              width: '40px',
                              height: '40px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                            Rayon de bordure
                          </label>
                          <input 
                            type="range" 
                            min="0" 
                            max="20" 
                            defaultValue="5"
                            style={{ width: '100%' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                            Largeur de la bordure
                          </label>
                          <input 
                            type="range" 
                            min="0" 
                            max="5" 
                            defaultValue="1"
                            style={{ width: '100%' }}
                          />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                            Couleur de la bordure
                          </label>
                          <input 
                            type="color" 
                            value="#e1e3e5" 
                            style={{
                              width: '40px',
                              height: '40px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input type="checkbox" />
                          <span>Masquer les étiquettes des champs</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <input type="checkbox" defaultChecked />
                          <span>Activer RTL (pour les langues arabes)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 4: Text customization */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              marginBottom: '2rem',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e1e3e5',
                background: '#fafbfb'
              }}>
                <h3 style={{ margin: 0 }}>4. Personnalisez les textes génériques du formulaire</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      Texte d'entête de champ obligatoire
                    </label>
                    <textarea 
                      defaultValue="Ce champ est requis."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c9cccf',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      Texte d'erreur de champ générique non valide
                    </label>
                    <textarea 
                      defaultValue="Entrez une valeur valide."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c9cccf',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Live preview */}
          <div style={{ position: 'sticky', top: '2rem' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #e1e3e5',
                background: '#fafbfb',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: 0 }}>📱 Aperçu en direct :</h4>
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                {/* Form preview */}
                <div style={{
                  border: '1px solid #e1e3e5',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  backgroundColor: '#fafbfb'
                }}>
                  
                  {/* Form fields */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      أدخل بيانات مطلوبة *
                    </label>
                    <input 
                      type="text" 
                      placeholder="Prénom"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c9cccf',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      * Téléphone
                    </label>
                    <input 
                      type="tel" 
                      placeholder="Téléphone - الهاتف"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c9cccf',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      * Ville
                    </label>
                    <select style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #c9cccf',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}>
                      <option>Ville - المدينة</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      * Adresse
                    </label>
                    <textarea 
                      placeholder="Adresse - العنوان"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c9cccf',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      * Voiture
                    </label>
                    <input 
                      type="text" 
                      placeholder="Marque et modèle de la voiture"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c9cccf',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {/* Order summary */}
                  <div style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #e1e3e5',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>Mode de livraison</h4>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>dh {deliveryCost.toFixed(2)}</span>
                      <span>COUT DE LIVRAISON</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>dh {subtotal.toFixed(2)}</span>
                      <span>Sous-total</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>dh {deliveryCost.toFixed(2)}</span>
                      <span>Livraison</span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontWeight: '700',
                      borderTop: '1px solid #e1e3e5',
                      paddingTop: '0.5rem',
                      marginTop: '0.5rem'
                    }}>
                      <span>dh {total.toFixed(2)}</span>
                      <span>Total</span>
                    </div>
                  </div>

                  {/* Confirm button */}
                  <button style={{
                    width: '100%',
                    padding: '1rem',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #00d4aa 0%, #008060 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}>
                    Confirmer - {total.toFixed(2)} dh - تأكيد
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}