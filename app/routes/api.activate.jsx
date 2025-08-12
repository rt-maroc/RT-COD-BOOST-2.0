import { json } from "@remix-run/node";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    console.log('🚀 API activate called - DIRECT VERSION');
    
    // Récupérer les paramètres depuis l'URL
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const session = url.searchParams.get('session');
    
    console.log('🔍 Paramètres reçus:', { shop, session });
    
    if (!shop || !session) {
      return json({
        success: false,
        message: 'Paramètres shop ou session manquants'
      }, { status: 400 });
    }
    
    // Récupérer les données POST
    const requestData = await request.json();
    const { isActive } = requestData;
    
    console.log('📋 Action demandée:', { isActive, shop });
    
    if (isActive) {
      console.log('✅ Activation en cours...');
      
      // Créer le Script Tag directement via fetch vers Shopify API
      const shopifyApiUrl = `https://${shop}/admin/api/2023-10/script_tags.json`;
      
      const scriptTagData = {
        script_tag: {
          event: 'onload',
          src: 'https://rt-cod-boost-2-0.onrender.com/cod-form.js',
          display_scope: 'online_store'
        }
      };
      
      try {
        // Récupérer le token d'accès depuis la base de données sessions
        console.log('🔍 Recherche session pour:', { shop, session });
        
        let sessionRecord = await db.session.findFirst({
          where: { 
            shop: shop,
            id: session 
          }
        });
        
        // Si pas trouvé avec l'ID exact, chercher par shop seulement
        if (!sessionRecord) {
          console.log('🔍 Tentative recherche par shop uniquement...');
          sessionRecord = await db.session.findFirst({
            where: { shop: shop },
            orderBy: { updatedAt: 'desc' }
          });
        }
        
        if (!sessionRecord) {
          console.log('❌ Aucune session trouvée pour ce shop');
          
          // Debug: lister toutes les sessions
          const allSessions = await db.session.findMany({
            select: { id: true, shop: true, updatedAt: true }
          });
          console.log('📋 Sessions disponibles:', allSessions);
          
          return json({
            success: false,
            message: 'Session non trouvée'
          }, { status: 401 });
        }
        
        console.log('✅ Session trouvée:', { id: sessionRecord.id, shop: sessionRecord.shop });
        
        // Faire l'appel direct à Shopify
        const response = await fetch(shopifyApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': sessionRecord.accessToken
          },
          body: JSON.stringify(scriptTagData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('❌ Erreur Shopify API:', response.status, errorText);
          return json({
            success: false,
            message: `Erreur Shopify: ${response.status}`
          }, { status: response.status });
        }
        
        const scriptResult = await response.json();
        const scriptTagId = scriptResult.script_tag.id;
        
        console.log('✅ Script Tag créé:', scriptTagId);
        
        // Sauvegarder en base
        const settings = await db.cod_settings.upsert({
          where: { shop: shop },
          update: {
            isActive: true,
            scriptTagId: scriptTagId.toString(),
            updatedAt: new Date()
          },
          create: {
            shop: shop,
            isActive: true,
            scriptTagId: scriptTagId.toString(),
            totalOrders: 0,
            totalRevenue: 0
          }
        });
        
        console.log('💾 Settings sauvegardés:', settings);
        
        return json({
          success: true,
          message: 'Application activée avec succès !',
          scriptTagId: scriptTagId,
          isActive: true
        });
        
      } catch (shopifyError) {
        console.error('❌ Erreur Shopify:', shopifyError);
        return json({
          success: false,
          message: 'Erreur lors de la création du Script Tag: ' + shopifyError.message
        }, { status: 500 });
      }
      
    } else {
      // Désactivation
      console.log('⏹️ Désactivation...');
      
      try {
        const settings = await db.cod_settings.findUnique({
          where: { shop: shop }
        });
        
        if (settings?.scriptTagId) {
          const sessionRecord = await db.session.findFirst({
            where: { shop: shop }
          });
          
          if (sessionRecord) {
            await fetch(`https://${shop}/admin/api/2023-10/script_tags/${settings.scriptTagId}.json`, {
              method: 'DELETE',
              headers: {
                'X-Shopify-Access-Token': sessionRecord.accessToken
              }
            });
          }
        }
        
        await db.cod_settings.update({
          where: { shop: shop },
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
        
      } catch (error) {
        console.error('❌ Erreur désactivation:', error);
        return json({
          success: false,
          message: 'Erreur désactivation: ' + error.message
        }, { status: 500 });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return json({
      success: false,
      message: 'Erreur: ' + error.message
    }, { status: 500 });
  }
};