import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }

    const formData = await request.json();
    const { isActive } = formData;

    console.log(`[ACTIVATION] Shop: ${session.shop}, Action: ${isActive ? 'ACTIVATE' : 'DEACTIVATE'}`);

    if (isActive) {
      // ✅ ACTIVER : Créer le script tag
      const scriptTag = await admin.rest.ScriptTag.save({
        session,
        script_tag: {
          event: "onload",
          src: `${process.env.SHOPIFY_APP_URL}/cod-form.js`
        }
      });

      console.log(`[SUCCESS] Script Tag créé: ${scriptTag.id}`);

      // Sauvegarder en base de données
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
          totalRevenue: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return json({ 
        success: true, 
        message: "✅ Application activée ! Le formulaire COD est maintenant visible sur vos pages produit.",
        scriptTagId: scriptTag.id,
        isActive: true
      });

    } else {
      // ❌ DÉSACTIVER : Supprimer le script tag
      const settings = await db.cod_settings.findUnique({
        where: { shop: session.shop }
      });

      if (settings && settings.scriptTagId) {
        try {
          await admin.rest.ScriptTag.delete({
            session,
            id: parseInt(settings.scriptTagId)
          });
          console.log(`[SUCCESS] Script Tag supprimé: ${settings.scriptTagId}`);
        } catch (error) {
          console.warn(`[WARNING] Impossible de supprimer le script tag: ${error.message}`);
        }
      }

      // Mettre à jour la base de données
      await db.cod_settings.upsert({
        where: { shop: session.shop },
        update: { 
          isActive: false, 
          scriptTagId: null,
          updatedAt: new Date()
        },
        create: { 
          shop: session.shop,
          isActive: false,
          scriptTagId: null,
          totalOrders: 0,
          totalRevenue: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return json({ 
        success: true, 
        message: "❌ Application désactivée. Le formulaire COD n'est plus visible.",
        isActive: false
      });
    }

  } catch (error) {
    console.error("[ERROR] Échec de l'activation:", error);
    return json({ 
      success: false,
      error: "Erreur lors de l'activation. Vérifiez les logs.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
};

// GET : Récupérer le statut actuel
export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    
    const settings = await db.cod_settings.findUnique({
      where: { shop: session.shop }
    });

    return json({
      success: true,
      isActive: settings?.isActive || false,
      shop: session.shop,
      hasScriptTag: !!settings?.scriptTagId,
      totalOrders: settings?.totalOrders || 0,
      totalRevenue: settings?.totalRevenue || 0
    });

  } catch (error) {
    console.error("[ERROR] Impossible de récupérer le statut:", error);
    return json({ 
      success: false,
      error: "Erreur lors de la récupération du statut",
      isActive: false
    }, { status: 500 });
  }
};