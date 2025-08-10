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
    
    if (!admin) {
      throw new Error("Admin authentication failed");
    }
    
    // Extraire shop et session de différentes manières possibles
    let shop, session;
    
    if (admin.session) {
      shop = admin.session.shop;
      session = admin.session;
    } else if (admin.shop) {
      shop = admin.shop;
      session = admin;
    } else if (admin.context?.session) {
      shop = admin.context.session.shop;
      session = admin.context.session;
    } else {
      throw new Error("Cannot find shop/session in admin object");
    }
    
    if (!shop) {
      throw new Error("Shop domain not found");
    }
    
    console.log("✅ Authenticated for shop:", shop);
    console.log("🔑 Session object keys:", Object.keys(session));
    
    // Créer le REST client si pas disponible
    let restClient;
    if (admin.rest) {
      restClient = admin.rest;
    } else {
      // Fallback - utiliser fetch direct
      const accessToken = session.accessToken;
      if (!accessToken) {
        throw new Error("Access token not found");
      }
      console.log("🔄 Using direct fetch method");
    }
    
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
      let existingScripts;
      
      if (restClient && admin.rest?.resources?.ScriptTag) {
        existingScripts = await admin.rest.resources.ScriptTag.all({
          session: session
        });
        existingScripts = existingScripts.data;
      } else {
        // Méthode fetch directe
        const response = await fetch(`https://${shop}/admin/api/2023-10/script_tags.json`, {
          headers: {
            'X-Shopify-Access-Token': session.accessToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        existingScripts = data.script_tags || [];
      }
      
      console.log(`📋 Found ${existingScripts.length} existing script tags`);
      
      for (const script of existingScripts) {
        if (script.src && (
          script.src.includes('cod-form-widget') || 
          script.src.includes('rt-cod') ||
          script.src.includes('onrender.com')
        )) {
          console.log("🗑️ Removing old script:", script.id, script.src);
          
          if (restClient && admin.rest?.resources?.ScriptTag) {
            await admin.rest.resources.ScriptTag.delete({
              session: session,
              id: script.id
            });
          } else {
            await fetch(`https://${shop}/admin/api/2023-10/script_tags/${script.id}.json`, {
              method: 'DELETE',
              headers: {
                'X-Shopify-Access-Token': session.accessToken
              }
            });
          }
        }
      }
    } catch (cleanupError) {
      console.warn("⚠️ Cleanup warning:", cleanupError.message);
    }
    
    // Créer le nouveau script tag
    console.log("📝 Creating new script tag...");
    
    let scriptTag;
    
    if (restClient && admin.rest?.resources?.ScriptTag) {
      // Méthode REST API
      scriptTag = new admin.rest.resources.ScriptTag({
        session: session
      });
      
      scriptTag.event = "onload";
      scriptTag.src = scriptUrl;
      scriptTag.display_scope = "all";
      
      console.log("💾 Saving script tag with REST API...");
      await scriptTag.save();
      
    } else {
      // Méthode fetch directe
      const scriptData = {
        script_tag: {
          event: "onload",
          src: scriptUrl,
          display_scope: "all"
        }
      };
      
      console.log("💾 Creating script tag with fetch...");
      
      const response = await fetch(`https://${shop}/admin/api/2023-10/script_tags.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': session.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scriptData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      scriptTag = result.script_tag;
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