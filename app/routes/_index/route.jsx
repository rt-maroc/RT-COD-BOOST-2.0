import { authenticate } from "../../shopify.server";
import { json } from "@remix-run/node";
import RTCodBoostDashboard from "../app._index.jsx";

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);
    return json({ success: true });
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    throw new Response("Unauthorized", { status: 401 });
  }
};

export default RTCodBoostDashboard;