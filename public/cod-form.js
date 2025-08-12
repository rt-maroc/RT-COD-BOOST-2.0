import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    
    const body = await request.json();
    const { isActive } = body;
    
    console.log('🔄 Requête activation reçue:', { isActive });
    
    // Récupérer les informations de session
    const session = await authenticate.admin(request);
    const shop = session.session?.shop;
    
    if (!shop) {
      return json({ error: "Shop non trouvé dans la session" }, { status: 400 });
    }
    
    console.log('🔄 Activation de l\'app pour', shop);

    if (isActive) {
      // === ACTIVATION : CRÉER LE SCRIPT TAG ===
      
      // URL du script COD
      const scriptUrl = `${process.env.SHOPIFY_APP_URL || 'https://rt-cod-boost-2-0.onrender.com'}/cod-form.js`;
      
      console.log('📝 Création du Script Tag avec URL:', scriptUrl);
      
      try {
        const scriptTag = await admin.rest.resources.ScriptTag.save({
          session: session.session,
          src: scriptUrl,
          event: 'onload',
          display_scope: 'all'
        });
        
        console.log('✅ Script Tag créé avec ID:', scriptTag.id);
        
        // Sauvegarder dans la base de données
        await db.cod_settings.upsert({
          where: { shop },
          update: {
            isActive: true,
            scriptTagId: scriptTag.id.toString(),
            updatedAt: new Date()
          },
          create: {
            shop,
            isActive: true,
            scriptTagId: scriptTag.id.toString()
          }
        });
        
        console.log('✅ Paramètres sauvegardés dans la base');
        
        return json({ 
          success: true, 
          message: "App activée avec succès!",
          scriptTagId: scriptTag.id
        });
        
      } catch (scriptError) {
        console.error('❌ Erreur création Script Tag:', scriptError);
        return json({ 
          error: "Erreur lors de la création du script", 
          details: scriptError.message 
        }, { status: 500 });
      }
      
    } else {
      // === DÉSACTIVATION : SUPPRIMER LE SCRIPT TAG ===
      
      // Récupérer le scriptTagId depuis la base
      const settings = await db.cod_settings.findUnique({
        where: { shop }
      });
      
      if (settings?.scriptTagId) {
        try {
          await admin.rest.resources.ScriptTag.delete({
            session: session.session,
            id: parseInt(settings.scriptTagId)
          });
          
          console.log('✅ Script Tag supprimé:', settings.scriptTagId);
        } catch (deleteError) {
          console.warn('⚠️ Erreur suppression Script Tag:', deleteError.message);
        }
      }
      
      // Mettre à jour la base de données
      await db.cod_settings.upsert({
        where: { shop },
        update: {
          isActive: false,
          scriptTagId: null,
          updatedAt: new Date()
        },
        create: {
          shop,
          isActive: false,
          scriptTagId: null
        }
      });
      
      return json({ 
        success: true, 
        message: "App désactivée avec succès!"
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur API activation:', error);
    return json({ 
      error: "Erreur serveur", 
      details: error.message 
    }, { status: 500 });
  }
};

// GET : Récupérer le statut d'activation
export const loader = async ({ request }) => {
  try {
    const session = await authenticate.admin(request);
    const shop = session.session?.shop;
    
    if (!shop) {
      return json({ error: "Shop non trouvé" }, { status: 400 });
    }
    
    const settings = await db.cod_settings.findUnique({
      where: { shop }
    });
    
    return json({
      isActive: settings?.isActive || false,
      scriptTagId: settings?.scriptTagId,
      shop
    });
    
  } catch (error) {
    console.error('❌ Erreur GET status:', error);
    return json({ error: "Erreur serveur" }, { status: 500 });
  }
};