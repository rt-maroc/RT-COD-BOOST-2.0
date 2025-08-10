 // ===============================
// 🔧 FICHIER 3: app/routes/api.cod-submit.jsx
// API publique pour recevoir les commandes du widget
// ===============================

import { json } from "@remix-run/node";
import { createCodOrder } from "../models/cod.server";

export async function action({ request }) {
  try {
    // Cette API est publique (pas d'authentification admin)
    const formData = await request.formData();
    
    const orderData = {
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"), 
      customerEmail: formData.get("customerEmail") || '',
      customerAddress: formData.get("customerAddress"),
      customerCity: formData.get("customerCity") || '',
      customerWilaya: formData.get("customerWilaya"),
      productName: formData.get("productTitle") || formData.get("productName"),
      productPrice: parseFloat(formData.get("productPrice")) || 0,
      quantity: parseInt(formData.get("quantity")) || 1,
      totalAmount: parseFloat(formData.get("totalAmount")) || parseFloat(formData.get("productPrice")) || 0,
      source: 'widget',
      shop: request.headers.get('origin')?.replace(/https?:\/\//, '') || 'unknown',
      productId: formData.get("productId"),
      createdAt: new Date().toISOString()
    };

    console.log("📝 Nouvelle commande COD widget:", orderData);

    // Validation basique
    if (!orderData.customerName || !orderData.customerPhone || !orderData.customerAddress) {
      return json({
        success: false,
        error: "Informations client incomplètes"
      }, { status: 400 });
    }

    // Utiliser votre fonction existante
    const result = await createCodOrder(orderData);
    
    if (result.success) {
      return json({
        success: true,
        message: "Commande créée avec succès!",
        orderId: result.order.id,
        orderNumber: result.order.id // Pour affichage
      });
    } else {
      return json({
        success: false,
        error: result.error || "Erreur lors de la création"
      }, { status: 400 });
    }

  } catch (error) {
    console.error("❌ Erreur API COD Submit:", error);
    return json({
      success: false,
      error: "Erreur lors du traitement de la commande"
    }, { status: 500 });
  }
}

// Endpoint de test
export async function loader({ request }) {
  return json({
    message: "RT COD BOOST Submit API Ready",
    timestamp: new Date().toISOString(),
    origin: request.headers.get('origin')
  });
}