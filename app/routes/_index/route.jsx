import { authenticate } from "../../shopify.server";
import { json, redirect } from "@remix-run/node";
import RTCodBoostDashboard from "../app._index.jsx";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  console.log("🔍 Route _index - URL:", url.toString());
  console.log("🏪 Shop param:", shop);
  
  // Si on a un shop mais pas de session, rediriger vers auth
  if (shop && !url.searchParams.get("id_token") && !url.searchParams.get("session")) {
    console.log("🔄 Redirection vers /auth pour créer une session");
    return redirect(`/auth?shop=${shop}`);
  }
  
  try {
    // Pour les requêtes directes sans shop, on essaie quand même l'auth
    if (!shop) {
      console.log("⚠️ Pas de shop param, tentative d'auth quand même");
    }
    
    const { session, admin } = await authenticate.admin(request);
    console.log("✅ Authentification réussie pour:", session?.shop);
    
    return json({ 
      success: true,
      shop: session?.shop 
    });
  } catch (error) {
    console.error("❌ Erreur auth:", error.message);
    
    // Si on a un shop, on redirige vers auth
    if (shop) {
      console.log("🔄 Erreur auth, redirection vers /auth");
      return redirect(`/auth?shop=${shop}`);
    }
    
    // Sinon on retourne une erreur
    throw new Response("Unauthorized - Please access the app from Shopify Admin", { 
      status: 401 
    });
  }
};

export default RTCodBoostDashboard;