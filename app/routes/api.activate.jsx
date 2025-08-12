import { json } from "@remix-run/node";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    const body = await request.json();
    const { isActive } = body;
    
    console.log('🔄 Requête activation reçue:', { isActive });
    
    const shop = 'rt-solutions-test.myshopify.com';
    console.log(`🔄 ${isActive ? 'Activation' : 'Désactivation'} de l'app pour ${shop}`);

    if (isActive) {
      console.log('✅ Simulation activation réussie');
      
      const fakeScriptTagId = Date.now().toString();
      
      await db.CodSettings.upsert({
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
      await db.CodSettings.upsert({
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
  } catch (error) {
    console.error("❌ Erreur API activation:", error);
    return json({
      success: false,
      message: `Erreur: ${error.message}`
    }, { status: 500 });
  }
};

export const loader = async ({ request }) => {
  try {
    const shop = 'rt-solutions-test.myshopify.com';
    
    const settings = await db.CodSettings.findUnique({
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