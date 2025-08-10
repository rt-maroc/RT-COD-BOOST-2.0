// rt-cod-boost-2-0/app/routes/api.cod-order.jsx
// Adapté de votre logique index.js

import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { 
  createCodOrder, 
  createShopifyOrderFromCod, 
  getCodOrders,
  updateCodOrderStatus,
  getCodStats
} from "../models/cod.server";

// ===============================
// 🚀 API ENDPOINTS COD
// ===============================

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    switch (action) {
      // ===============================
      // 📝 CRÉER COMMANDE COD
      // ===============================
      case "create":
        const orderData = {
          customerName: formData.get("customerName"),
          customerPhone: formData.get("customerPhone"),
          customerEmail: formData.get("customerEmail"),
          customerAddress: formData.get("customerAddress"),
          customerCity: formData.get("customerCity"),
          customerWilaya: formData.get("customerWilaya"),
          productName: formData.get("productName"),
          productPrice: formData.get("productPrice"),
          quantity: formData.get("quantity"),
          totalAmount: formData.get("totalAmount")
        };

        console.log("🚀 Création commande COD:", orderData);
        const createResult = await createCodOrder(orderData);
        
        if (createResult.success) {
          return json({ 
            success: true, 
            message: "Commande COD créée avec succès!",
            orderId: createResult.order.id 
          });
        } else {
          return json({ 
            success: false, 
            error: createResult.error 
          }, { status: 400 });
        }

      // ===============================
      // 🔄 CONVERTIR EN SHOPIFY
      // ===============================
      case "convert":
        const codOrderId = formData.get("codOrderId");
        console.log("🔄 Conversion vers Shopify:", codOrderId);
        
        const convertResult = await createShopifyOrderFromCod(admin, codOrderId);
        
        if (convertResult.success) {
          return json({ 
            success: true, 
            message: "Commande convertie vers Shopify!",
            shopifyOrderId: convertResult.shopifyOrder.id 
          });
        } else {
          return json({ 
            success: false, 
            error: convertResult.error 
          }, { status: 400 });
        }

      // ===============================
      // 📊 METTRE À JOUR STATUT
      // ===============================
      case "updateStatus":
        const orderIdToUpdate = formData.get("orderId");
        const newStatus = formData.get("status");
        
        console.log(`📊 Mise à jour statut: ${orderIdToUpdate} -> ${newStatus}`);
        
        const updateResult = await updateCodOrderStatus(orderIdToUpdate, newStatus);
        
        if (updateResult.success) {
          return json({ 
            success: true, 
            message: "Statut mis à jour avec succès!",
            order: updateResult.order 
          });
        } else {
          return json({ 
            success: false, 
            error: updateResult.error 
          }, { status: 400 });
        }

      default:
        return json({ 
          success: false, 
          error: "Action non reconnue" 
        }, { status: 400 });
    }
  } catch (error) {
    console.error("❌ Erreur API COD:", error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// ===============================
// 📖 RÉCUPÉRER DONNÉES COD
// ===============================
export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  try {
    switch (action) {
      // ===============================
      // 📋 LISTE DES COMMANDES
      // ===============================
      case "list":
        const filters = {
          status: url.searchParams.get("status"),
          wilaya: url.searchParams.get("wilaya"),
          dateFrom: url.searchParams.get("dateFrom"),
          dateTo: url.searchParams.get("dateTo")
        };

        const ordersResult = await getCodOrders(filters);
        
        if (ordersResult.success) {
          return json({ 
            success: true, 
            orders: ordersResult.orders 
          });
        } else {
          return json({ 
            success: false, 
            error: ordersResult.error 
          }, { status: 400 });
        }

      // ===============================
      // 📊 STATISTIQUES
      // ===============================
      case "stats":
        const statsResult = await getCodStats();
        
        if (statsResult.success) {
          return json({ 
            success: true, 
            stats: statsResult.stats 
          });
        } else {
          return json({ 
            success: false, 
            error: statsResult.error 
          }, { status: 400 });
        }

      default:
        return json({ 
          success: false, 
          error: "Action loader non reconnue" 
        }, { status: 400 });
    }
  } catch (error) {
    console.error("❌ Erreur loader API COD:", error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}