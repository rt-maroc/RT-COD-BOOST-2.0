import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    console.log('🚀 API activate called - FINAL VERSION');
    
    // Utiliser l'authentification Remix directement
    const { admin, session } = await authenticate.admin(request);
    
    console.log('✅ Auth Remix réussie pour:', session.shop);
    
    // Récupérer les données POST
    const requestData = await request.json();
    const { isActive } = requestData;
    
    console.log('📋 Action demandée:', { isActive, shop: session.shop });
    
    if (isActive) {
      console.log('✅ Activation en cours...');
      
      try {
        // Créer le Script Tag directement avec l'API Shopify Admin (Remix)
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
        
        console.log('💾 Settings sauvegardés:', settings);
        
        return json({
          success: true,
          message: 'Application activée avec succès !',
          scriptTagId: scriptTag.id,
          isActive: true
        });
        
      } catch (shopifyError) {
        console.error('❌ Erreur Script Tag:', shopifyError);
        return json({
          success: false,
          message: 'Erreur lors de la création du Script Tag: ' + shopifyError.message
        }, { status: 500 });
      }
      
    } else {
      // Désactivation
      console.log('⏹️ Désactivation en cours...');
      
      try {
        // Récupérer les paramètres actuels
        const currentSettings = await db.cod_settings.findUnique({
          where: { shop: session.shop }
        });
        
        if (currentSettings?.scriptTagId) {
          // Supprimer le Script Tag avec l'API Remix
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
          isActive: false
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
    
    return json({
      success: false,
      message: 'Authentification échouée. Veuillez accéder à l\'app depuis l\'admin Shopify.',
      error: 'AUTHENTICATION_FAILED'
    }, { status: 401 });
  }
};