// 🚀 SOLUTION ALTERNATIVE: app/routes/_index/route.jsx
// Si l'import précédent ne fonctionne pas

import { authenticate } from "../../shopify.server";
import { json } from "@remix-run/node";

// Essayez ce chemin d'import
import RTCodBoostDashboard from "../app._index";

// Ou cette version si les autres ne marchent pas :
// import RTCodBoostDashboard from "../../app._index.jsx";

export const loader = async ({ request }) => {
  try {
    console.log("🔄 Loading RT COD BOOST 2.0 Dashboard...");
    await authenticate.admin(request);
    console.log("✅ Authentication successful");
    return json({ success: true });
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    throw new Response("Unauthorized", { status: 401 });
  }
};

export default RTCodBoostDashboard;