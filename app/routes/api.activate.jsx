import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    console.log('🚀 API activate called - PRODUCTION VERSION');
    
    // Authentification Shopify robuste
    const { admin, session } = await authenticate.admin(request);
    
    console.log('✅ Auth réussie pour shop:', session.shop);
    
    // Validation des données
    const requestData = await request.json();
    console.log('📋 Request data:', requestData);
    
    const { isActive } = requestData;
    
    if (typeof isActive !== 'boolean') {
      return json({
        success: false,
        message: 'Paramètre isActive invalide'
      }, { status: 400 });
    }
    
    if (isActive) {
      console.log('📲 Activation pour boutique:', session.shop);
      
      try {
        // Créer le Script Tag Shopify
        const scriptTag = new admin.rest.resources.ScriptTag({ session });
        scriptTag.event = 'onload';
        scriptTag.src = 'https://rt-cod-boost-2-0.onrender.com/cod-form.js';
        scriptTag.display_scope = 'online_store';
        
        await scriptTag.save({
          update: true
        });
        
        console.log('✅ Script Tag créé avec ID:', scriptTag.id);
        
        // Sauvegarder en base de données
        const settings = await db.cod_settings.upsert({
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
        
        console.log('💾 Paramètres sauvegardés:', settings);
        
        return json({
          success: true,
          message: 'Application activée avec succès',
          scriptTagId: scriptTag.id,
          isActive: true,
          shop: session.shop
        });
        
      } catch (scriptError) {
        console.error('❌ Erreur Script Tag:', scriptError);
        return json({
          success: false,
          message: 'Erreur lors de la création du Script Tag: ' + scriptError.message
        }, { status: 500 });
      }
      
    } else {
      // Désactivation
      console.log('⏹️ Désactivation pour boutique:', session.shop);
      
      try {
        // Récupérer les paramètres actuels
        const currentSettings = await db.cod_settings.findUnique({
          where: { shop: session.shop }
        });
        
        if (currentSettings?.scriptTagId) {
          // Supprimer le Script Tag
          const scriptTag = new admin.rest.resources.ScriptTag({ 
            session,
            id: parseInt(currentSettings.scriptTagId)
          });
          
          await scriptTag.delete();
          console.log('🗑️ Script Tag supprimé:', currentSettings.scriptTagId);
        }
        
        // Mettre à jour la base
        await db.cod_settings.update({
          where: { shop: session.shop },
          data: {
            isActive: false,
            scriptTagId: null,
            updatedAt: new Date()
          }
        });
        
        return json({
          success: true,
          message: 'Application désactivée',
          isActive: false,
          shop: session.shop
        });
        
      } catch (deactivateError) {
        console.error('❌ Erreur désactivation:', deactivateError);
        return json({
          success: false,
          message: 'Erreur lors de la désactivation: ' + deactivateError.message
        }, { status: 500 });
      }
    }
    
  } catch (authError) {
    console.error('❌ Erreur authentification:', authError);
    
    // Erreur spécifique d'authentification
    return json({
      success: false,
      message: 'Authentification échouée. Veuillez accéder à l\'app depuis l\'admin Shopify.',
      error: 'AUTHENTICATION_FAILED'
    }, { status: 401 });
  }
};

// GET pour récupérer le statut
export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    
    const settings = await db.cod_settings.findUnique({
      where: { shop: session.shop }
    });
    
    return json({
      success: true,
      isActive: settings?.isActive || false,
      scriptTagId: settings?.scriptTagId || null,
      shop: session.shop
    });
    
  } catch (error) {
    console.error('❌ Erreur loader:', error);
    return json({ 
      success: false,
      isActive: false,
      error: 'AUTHENTICATION_FAILED'
    }, { status: 401 });
  }
};