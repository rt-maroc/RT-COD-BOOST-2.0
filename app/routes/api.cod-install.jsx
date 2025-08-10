// =======================================
// 🚀 SOLUTION DÉFINITIVE - app/routes/api.cod-install.jsx
// =======================================

import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  console.log("🔄 Starting COD Script Tag Installation...");
  
  try {
    // Authentification Shopify
    const { admin } = await authenticate.admin(request);
    
    if (!admin || !admin.rest) {
      throw new Error("Shopify Admin API not available");
    }
    
    const shop = admin.session.shop;
    const accessToken = admin.session.accessToken;
    
    console.log("✅ Authenticated for shop:", shop);
    console.log("🔑 Access token available:", !!accessToken);
    
    // URL du script à injecter
    const scriptUrl = `${process.env.SHOPIFY_APP_URL}/cod-form-widget.js`;
    console.log("📜 Script URL:", scriptUrl);
    
    // Vérifier que l'URL est correcte
    if (!process.env.SHOPIFY_APP_URL) {
      throw new Error("SHOPIFY_APP_URL not defined in environment");
    }
    
    // Supprimer les anciens script tags d'abord
    console.log("🗑️ Cleaning up old script tags...");
    
    try {
      const existingScripts = await admin.rest.resources.ScriptTag.all({
        session: admin.session
      });
      
      console.log(`📋 Found ${existingScripts.data.length} existing script tags`);
      
      for (const script of existingScripts.data) {
        if (script.src && (
          script.src.includes('cod-form-widget') || 
          script.src.includes('rt-cod') ||
          script.src.includes('onrender.com')
        )) {
          console.log("🗑️ Removing old script:", script.id, script.src);
          await admin.rest.resources.ScriptTag.delete({
            session: admin.session,
            id: script.id
          });
        }
      }
    } catch (cleanupError) {
      console.warn("⚠️ Cleanup warning:", cleanupError.message);
    }
    
    // Créer le nouveau script tag
    console.log("📝 Creating new script tag...");
    
    const scriptTag = new admin.rest.resources.ScriptTag({
      session: admin.session
    });
    
    scriptTag.event = "onload";
    scriptTag.src = scriptUrl;
    scriptTag.display_scope = "all";
    
    console.log("💾 Saving script tag with data:", {
      event: scriptTag.event,
      src: scriptTag.src,
      display_scope: scriptTag.display_scope
    });
    
    const savedScript = await scriptTag.save();
    
    if (!savedScript) {
      throw new Error("Script tag save returned null");
    }
    
    console.log("✅ Script tag created successfully:", {
      id: scriptTag.id,
      src: scriptTag.src,
      event: scriptTag.event,
      display_scope: scriptTag.display_scope,
      created_at: scriptTag.created_at
    });
    
    // Vérification finale - relire les script tags
    console.log("🔍 Verifying script tag creation...");
    
    try {
      const verifyScripts = await admin.rest.resources.ScriptTag.all({
        session: admin.session
      });
      
      const ourScript = verifyScripts.data.find(s => 
        s.src && s.src.includes('cod-form-widget')
      );
      
      if (ourScript) {
        console.log("✅ Verification successful - Script tag found:", ourScript.id);
      } else {
        console.warn("⚠️ Verification failed - Script tag not found in list");
      }
    } catch (verifyError) {
      console.warn("⚠️ Verification failed:", verifyError.message);
    }
    
    return json({ 
      success: true, 
      message: "COD Widget activé avec succès!",
      scriptId: scriptTag.id,
      scriptUrl: scriptTag.src,
      debug: {
        shop: shop,
        scriptTagCreated: !!scriptTag.id,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error("❌ Complete Installation Error:", error);
    console.error("❌ Error stack:", error.stack);
    
    return json({ 
      success: false, 
      error: `Installation failed: ${error.message}`,
      debug: {
        errorType: error.constructor.name,
        timestamp: new Date().toISOString(),
        shopifyAppUrl: process.env.SHOPIFY_APP_URL
      }
    }, { status: 500 });
  }
}

// Test endpoint pour vérifier l'API
export async function loader({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    
    return json({
      message: "RT COD Install API Ready",
      authenticated: !!admin,
      shop: admin?.session?.shop || "unknown",
      hasRestAPI: !!admin?.rest,
      shopifyAppUrl: process.env.SHOPIFY_APP_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return json({
      message: "Authentication failed",
      error: error.message,
      shopifyAppUrl: process.env.SHOPIFY_APP_URL,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

console.log("🚀 Fixed COD Installation API Loaded!");