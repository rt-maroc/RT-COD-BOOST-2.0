import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    console.log('🚀 Route activate - Début activation');
    
    const { admin, session } = await authenticate.admin(request);
    
    console.log('✅ Auth réussie pour:', session.shop);
    
    // Créer le Script Tag
    const scriptTag = new admin.rest.resources.ScriptTag({ session });
    scriptTag.event = 'onload';
    scriptTag.src = 'https://rt-cod-boost-2-0.onrender.com/cod-form.js';
    scriptTag.display_scope = 'online_store';
    
    await scriptTag.save({ update: true });
    
    console.log('✅ Script Tag créé avec ID:', scriptTag.id);
    
    // Sauvegarder en base
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
        totalRevenue: 0
      }
    });
    
    console.log('💾 Settings sauvegardés');
    
    // Redirect avec succès
    return redirect('/?success=activated');
    
  } catch (error) {
    console.error('❌ Erreur activation:', error);
    return redirect('/?error=' + encodeURIComponent(error.message));
  }
};

export const loader = async ({ request }) => {
  return redirect('/');
};