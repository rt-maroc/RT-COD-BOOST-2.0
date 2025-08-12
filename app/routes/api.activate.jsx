import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    console.log('🚀 API activate called');
    
    const { admin, session } = await authenticate.admin(request);
    
    console.log('✅ Auth réussie pour shop:', session.shop);
    
    // Récupérer les données de la requête
    const requestData = await request.json();
    console.log('📋 Request data:', requestData);
    
    const { isActive } = requestData;
    
    if (isActive) {
      console.log('📲 Activation demandée...');
      
      // 1. Créer le Script Tag dans Shopify
      const scriptTagData = {
        script_tag: {
          event: 'onload',
          src: 'https://rt-cod-boost-2-0.onrender.com/cod-form.js',
          display_scope: 'online_store'
        }
      };
      
      console.log('🔧 Création Script Tag...');
      
      const scriptResponse = await admin.rest.resources.ScriptTag.save({
        session,
        ...scriptTagData
      });
      
      console.log('✅ Script Tag créé:', scriptResponse.id);
      
      // 2. Sauvegarder en base de données
      const settings = await db.cod_settings.upsert({
        where: { shop: session.shop },
        update: {
          isActive: true,
          scriptTagId: scriptResponse.id.toString(),
          updatedAt: new Date()
        },
        create: {
          shop: session.shop,
          isActive: true,
          scriptTagId: scriptResponse.id.toString(),
          totalOrders: 0,
          totalRevenue: 0
        }
      });
      
      console.log('💾 Settings saved:', settings);
      
      return json({
        success: true,
        message: 'Application activée avec succès !',
        scriptTagId: scriptResponse.id,
        isActive: true
      });
      
    } else {
      // Désactivation
      console.log('⏹️ Désactivation demandée...');
      
      // Récupérer les settings actuels
      const currentSettings = await db.cod_settings.findUnique({
        where: { shop: session.shop }
      });
      
      if (currentSettings?.scriptTagId) {
        // Supprimer le Script Tag
        await admin.rest.resources.ScriptTag.delete({
          session,
          id: currentSettings.scriptTagId
        });
        
        console.log('🗑️ Script Tag supprimé');
      }
      
      // Mettre à jour en base
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
    }
    
  } catch (error) {
    console.error('❌ Erreur API activation:', error);
    
    return json({
      success: false,
      message: error.message || 'Erreur inconnue',
      error: error.toString()
    }, { status: 500 });
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
      isActive: settings?.isActive || false,
      scriptTagId: settings?.scriptTagId || null
    });
    
  } catch (error) {
    console.error('❌ Erreur loader:', error);
    return json({ isActive: false }, { status: 500 });
  }
};