import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const method = request.method;
    const { shop } = session;

    if (method === "POST") {
      // Activation de l'application
      const { isActive } = await request.json();
      
      console.log(`🔄 ${isActive ? 'Activation' : 'Désactivation'} de l'app pour ${shop}`);

      if (isActive) {
        // 1. Créer le Script Tag dans Shopify
        const scriptTag = await admin.rest.resources.ScriptTag.save({
          session,
          src: `${process.env.SHOPIFY_APP_URL}/cod-form.js`,
          event: "onload"
        });

        console.log(`✅ Script Tag créé : ID ${scriptTag.id}`);

        // 2. Sauvegarder dans la base de données
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

        return json({
          success: true,
          message: "Application activée avec succès !",
          scriptTagId: scriptTag.id
        });

      } else {
        // Désactivation
        const settings = await db.cod_settings.findUnique({
          where: { shop }
        });

        if (settings?.scriptTagId) {
          // Supprimer le Script Tag
          await admin.rest.resources.ScriptTag.delete({
            session,
            id: settings.scriptTagId
          });
        }

        // Mettre à jour la base
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

    if (method === "GET") {
      // Récupérer le statut d'activation
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
    }

  } catch (error) {
    console.error("❌ Erreur API activation:", error);
    return json({
      success: false,
      message: `Erreur: ${error.message}`
    }, { status: 500 });
  }
};