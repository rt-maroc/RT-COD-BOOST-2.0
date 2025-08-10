// rt-cod-boost-2-0/app/models/cod.server.js
// Adapté depuis votre rt-cod-boost/index.js existant

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ===============================
// 🚀 FONCTIONS COD ADAPTÉES
// ===============================

/**
 * Créer une commande COD dans la base
 */
export async function createCodOrder({
  customerName,
  customerPhone,
  customerEmail,
  customerAddress,
  customerCity,
  customerWilaya,
  productName,
  productPrice,
  quantity,
  totalAmount,
  shopifyOrderId = null,
  status = "pending"
}) {
  try {
    const codOrder = await prisma.codOrder.create({
      data: {
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        customerCity,
        customerWilaya,
        productName,
        productPrice: parseFloat(productPrice),
        quantity: parseInt(quantity),
        totalAmount: parseFloat(totalAmount),
        shopifyOrderId,
        status,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log("✅ Commande COD créée:", codOrder.id);
    return { success: true, order: codOrder };
  } catch (error) {
    console.error("❌ Erreur création commande COD:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupérer toutes les commandes COD
 */
export async function getCodOrders(filters = {}) {
  try {
    const { status, wilaya, dateFrom, dateTo } = filters;
    
    const where = {};
    if (status) where.status = status;
    if (wilaya) where.customerWilaya = wilaya;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const orders = await prisma.codOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, orders };
  } catch (error) {
    console.error("❌ Erreur récupération commandes:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mettre à jour le statut d'une commande COD
 */
export async function updateCodOrderStatus(orderId, newStatus) {
  try {
    const updatedOrder = await prisma.codOrder.update({
      where: { id: parseInt(orderId) },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Statut mis à jour: ${orderId} -> ${newStatus}`);
    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("❌ Erreur mise à jour statut:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Créer une commande Shopify depuis une commande COD
 */
export async function createShopifyOrderFromCod(admin, codOrderId) {
  try {
    // Récupérer la commande COD
    const codOrder = await prisma.codOrder.findUnique({
      where: { id: parseInt(codOrderId) }
    });

    if (!codOrder) {
      throw new Error("Commande COD introuvable");
    }

    // Créer la commande Shopify
    const shopifyOrder = await admin.rest.resources.Order.save({
      session: admin.session,
      email: codOrder.customerEmail,
      financial_status: "pending",
      fulfillment_status: null,
      send_receipt: true,
      send_fulfillment_receipt: true,
      note: `Commande COD #${codOrder.id} - ${codOrder.customerWilaya}`,
      tags: "COD, Algérie",
      customer: {
        first_name: codOrder.customerName.split(' ')[0],
        last_name: codOrder.customerName.split(' ').slice(1).join(' '),
        email: codOrder.customerEmail,
        phone: codOrder.customerPhone
      },
      billing_address: {
        first_name: codOrder.customerName.split(' ')[0],
        last_name: codOrder.customerName.split(' ').slice(1).join(' '),
        address1: codOrder.customerAddress,
        city: codOrder.customerCity,
        province: codOrder.customerWilaya,
        country: "Algeria",
        phone: codOrder.customerPhone
      },
      shipping_address: {
        first_name: codOrder.customerName.split(' ')[0],
        last_name: codOrder.customerName.split(' ').slice(1).join(' '),
        address1: codOrder.customerAddress,
        city: codOrder.customerCity,
        province: codOrder.customerWilaya,
        country: "Algeria",
        phone: codOrder.customerPhone
      },
      line_items: [
        {
          title: codOrder.productName,
          price: codOrder.productPrice.toString(),
          quantity: codOrder.quantity,
          requires_shipping: true
        }
      ],
      transactions: [
        {
          kind: "sale",
          status: "pending",
          amount: codOrder.totalAmount.toString(),
          gateway: "COD"
        }
      ]
    });

    // Mettre à jour la commande COD avec l'ID Shopify
    await prisma.codOrder.update({
      where: { id: parseInt(codOrderId) },
      data: { 
        shopifyOrderId: shopifyOrder.id.toString(),
        status: "converted",
        updatedAt: new Date()
      }
    });

    console.log("✅ Commande Shopify créée:", shopifyOrder.id);
    return { success: true, shopifyOrder, codOrder };
  } catch (error) {
    console.error("❌ Erreur création commande Shopify:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Statistiques COD
 */
export async function getCodStats() {
  try {
    const [
      totalOrders,
      pendingOrders,
      convertedOrders,
      totalRevenue
    ] = await Promise.all([
      prisma.codOrder.count(),
      prisma.codOrder.count({ where: { status: "pending" } }),
      prisma.codOrder.count({ where: { status: "converted" } }),
      prisma.codOrder.aggregate({
        _sum: { totalAmount: true },
        where: { status: "converted" }
      })
    ]);

    return {
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        convertedOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0
      }
    };
  } catch (error) {
    console.error("❌ Erreur statistiques:", error);
    return { success: false, error: error.message };
  }
}