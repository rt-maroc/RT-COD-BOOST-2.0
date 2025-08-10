// rt-cod-boost-2-0/app/models/cod.server.js
// Version corrigée avec les bons noms de tables

import prisma from "../db.server";

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
  productId,
  productPrice,
  quantity,
  totalAmount,
  shopifyOrderId = null,
  status = "pending",
  source = "widget",
  shop = "unknown"
}) {
  try {
    const codOrder = await prisma.cod_orders.create({
      data: {
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        customerAddress,
        customerCity: customerCity || '',
        customerWilaya: customerWilaya || '',
        productName: productName || 'Produit',
        productId: productId || '',
        productPrice: parseFloat(productPrice) || 0,
        quantity: parseInt(quantity) || 1,
        totalAmount: parseFloat(totalAmount) || parseFloat(productPrice) || 0,
        shopifyOrderId,
        status,
        source,
        shop,
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

    const orders = await prisma.cod_orders.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100 // Limiter pour performance
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
    const updatedOrder = await prisma.cod_orders.update({
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
    const codOrder = await prisma.cod_orders.findUnique({
      where: { id: parseInt(codOrderId) }
    });

    if (!codOrder) {
      throw new Error("Commande COD introuvable");
    }

    // Créer la commande Shopify via l'API REST
    const shopifyOrder = new admin.rest.Order({session: admin.session});
    
    shopifyOrder.email = codOrder.customerEmail;
    shopifyOrder.financial_status = "pending";
    shopifyOrder.fulfillment_status = null;
    shopifyOrder.send_receipt = true;
    shopifyOrder.send_fulfillment_receipt = true;
    shopifyOrder.note = `Commande COD #${codOrder.id} - ${codOrder.customerWilaya || 'Maroc'}`;
    shopifyOrder.tags = "COD, Paiement à la livraison";
    
    shopifyOrder.customer = {
      first_name: codOrder.customerName.split(' ')[0],
      last_name: codOrder.customerName.split(' ').slice(1).join(' ') || '',
      email: codOrder.customerEmail,
      phone: codOrder.customerPhone
    };
    
    shopifyOrder.billing_address = {
      first_name: codOrder.customerName.split(' ')[0],
      last_name: codOrder.customerName.split(' ').slice(1).join(' ') || '',
      address1: codOrder.customerAddress,
      city: codOrder.customerCity,
      province: codOrder.customerWilaya,
      country: "MA", // Morocco
      phone: codOrder.customerPhone
    };
    
    shopifyOrder.shipping_address = {
      first_name: codOrder.customerName.split(' ')[0],
      last_name: codOrder.customerName.split(' ').slice(1).join(' ') || '',
      address1: codOrder.customerAddress,
      city: codOrder.customerCity,
      province: codOrder.customerWilaya,
      country: "MA", // Morocco
      phone: codOrder.customerPhone
    };
    
    shopifyOrder.line_items = [
      {
        title: codOrder.productName,
        price: codOrder.productPrice.toString(),
        quantity: codOrder.quantity,
        requires_shipping: true
      }
    ];
    
    shopifyOrder.transactions = [
      {
        kind: "sale",
        status: "pending",
        amount: codOrder.totalAmount.toString(),
        gateway: "COD"
      }
    ];

    await shopifyOrder.save({update: true});

    // Mettre à jour la commande COD avec l'ID Shopify
    await prisma.cod_orders.update({
      where: { id: parseInt(codOrderId) },
      data: { 
        shopifyOrderId: shopifyOrder.id?.toString(),
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
      prisma.cod_orders.count(),
      prisma.cod_orders.count({ where: { status: "pending" } }),
      prisma.cod_orders.count({ where: { status: "converted" } }),
      prisma.cod_orders.aggregate({
        _sum: { totalAmount: true },
        where: { status: "converted" }
      })
    ]);

    // Stats par wilaya
    const ordersByWilaya = await prisma.cod_orders.groupBy({
      by: ['customerWilaya'],
      _count: { _all: true },
      _sum: { totalAmount: true }
    });

    return {
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        convertedOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        ordersByWilaya
      }
    };
  } catch (error) {
    console.error("❌ Erreur statistiques:", error);
    return { success: false, error: error.message };
  }
}