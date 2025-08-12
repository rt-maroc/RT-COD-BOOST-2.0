import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    // Récupérer les données depuis le frontend
    const body = await request.json();
    const { isActive } = body;
    
    console.log('🔄 Requête activation reçue:', { isActive });
    
    // Pour l'instant, on simule l'activation (on corrigera l'auth Shopify plus tard)
    const shop = 'rt-solutions-test.myshopify.com'; // Temporaire pour test
    
    console.log(`🔄 ${isActive ? 'Activation' : 'Désactivation'} de l'app pour ${shop}`);

    if (method === "POST") {
      // Activation de l'application
      const { isActive } = await request.json();
      
      console.log(`🔄 ${isActive ? 'Activation' : 'Désactivation'} de l'app pour ${shop}`);

    if (isActive) {
      console.log('✅ Simulation activation réussie');
      
      // Temporairement, on simule la création du Script Tag
      const fakeScriptTagId = Date.now().toString();
      
      // Sauvegarder dans la base de données
      await db.cod_settings.upsert({
        where: { shop },
        update: {
          isActive: true,
          scriptTagId: fakeScriptTagId,
          updatedAt: new Date()
        },
        create: {
          shop,
          isActive: true,
          scriptTagId: fakeScriptTagId
        }
      });

      return json({
        success: true,
        message: "Application activée avec succès !",
        scriptTagId: fakeScriptTagId
      });
        } else {
      // Désactivation
      await db.cod_settings.upsert({
        where: { shop },
        update: {
          isActive: false,
          scriptTagId: null,
          updatedAt: new Date()
        },
        create: {
          shop,
          isActive: false
        }
      });

      return json({
        success: true,
        message: "Application désactivée avec succès !"
      });
    }
    }

  } catch (error) {
    console.error("❌ Erreur API activation:", error);
    return json({
      success: false,
      message: `Erreur: ${error.message}`
    }, { status: 500 });
  }
};

// Route GET pour récupérer le statut
export const loader = async ({ request }) => {
  try {
    const shop = 'rt-solutions-test.myshopify.com'; // Temporaire
    
    const settings = await db.cod_settings.findUnique({
      where: { shop }
    });

    return json({
      success: true,
      isActive: settings?.isActive || false,
      scriptTagId: settings?.scriptTagId,
      totalOrders: settings?.totalOrders || 0,
      totalRevenue: settings?.totalRevenue || 0
    });
  } catch (error) {
    console.error("❌ Erreur GET activation:", error);
    return json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
};