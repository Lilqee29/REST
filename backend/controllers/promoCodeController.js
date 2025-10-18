// ==========================================
// UPDATED PROMO CODE CONTROLLER
// promoCodeController.js
// ==========================================

import promoCodeModel from "../models/promoCodeModel.js";

// Create promo code
const createPromoCode = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, conditions, maxDiscount, usageLimit, perUserLimit, validFrom, validUntil } = req.body;
    
    const existingCode = await promoCodeModel.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.json({ success: false, message: "Ce code promo existe déjà" });
    }

    const promoCode = new promoCodeModel({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      conditions,
      maxDiscount,
      usageLimit,
      perUserLimit,
      validFrom: validFrom || Date.now(),
      validUntil,
      isActive: true,
      usedCount: 0,
      usedBy: [],
      createdAt: new Date(),
      createdBy: req.body.userId
    });

    await promoCode.save();
    res.json({ success: true, message: "Code promo créé avec succès", data: promoCode });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur lors de la création" });
  }
};

// Update promo code
const updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow changing the code itself
    delete updates.code;
    
    const promoCode = await promoCodeModel.findByIdAndUpdate(id, updates, { new: true });
    if (!promoCode) {
      return res.json({ success: false, message: "Code promo introuvable" });
    }
    
    res.json({ success: true, message: "Code promo mis à jour", data: promoCode });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur lors de la mise à jour" });
  }
};

// Delete promo code
const deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const promoCode = await promoCodeModel.findByIdAndDelete(id);
    
    if (!promoCode) {
      return res.json({ success: false, message: "Code promo introuvable" });
    }
    
    res.json({ success: true, message: "Code promo supprimé" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur lors de la suppression" });
  }
};

// Get all promo codes with analytics
const getAllPromoCodes = async (req, res) => {
  try {
    const promoCodes = await promoCodeModel.find({}).sort({ createdAt: -1 });
    
    // Enhance with calculated analytics
    const enhancedCodes = promoCodes.map(promo => {
      const uniqueUsers = new Set(promo.usedBy?.map(u => u.userId.toString()) || []).size;
      const totalDiscountGiven = promo.usedBy?.reduce((sum, use) => sum + (use.discountApplied || 0), 0) || 0;
      const usageRate = promo.usageLimit ? ((promo.usedCount / promo.usageLimit) * 100).toFixed(1) : null;
      
      return {
        ...promo.toObject(),
        analytics: {
          uniqueUsers,
          totalDiscountGiven,
          usageRate,
          lastUsedAt: promo.usedBy?.[promo.usedBy.length - 1]?.usedAt || null
        }
      };
    });
    
    res.json({ success: true, data: enhancedCodes });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur lors de la récupération" });
  }
};

// Get detailed analytics for a single promo code
const getPromoAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const promoCode = await promoCodeModel.findById(id);
    
    if (!promoCode) {
      return res.json({ success: false, message: "Code promo introuvable" });
    }

    const uniqueUsers = new Set(promoCode.usedBy?.map(u => u.userId.toString()) || []).size;
    const totalDiscountGiven = promoCode.usedBy?.reduce((sum, use) => sum + (use.discountApplied || 0), 0) || 0;
    const averageDiscount = promoCode.usedCount > 0 ? (totalDiscountGiven / promoCode.usedCount).toFixed(2) : 0;
    const usageRate = promoCode.usageLimit ? ((promoCode.usedCount / promoCode.usageLimit) * 100).toFixed(1) : null;
    const totalOrderValue = promoCode.usedBy?.reduce((sum, use) => sum + (use.orderAmount || 0), 0) || 0;

    // Get usage by date
    const usageByDate = {};
    promoCode.usedBy?.forEach(use => {
      const date = new Date(use.usedAt).toLocaleDateString('fr-FR');
      usageByDate[date] = (usageByDate[date] || 0) + 1;
    });

    const analytics = {
      code: promoCode.code,
      description: promoCode.description,
      totalUsages: promoCode.usedCount,
      uniqueUsers,
      totalDiscountGiven: totalDiscountGiven.toFixed(2),
      averageDiscount,
      totalOrderValue: totalOrderValue.toFixed(2),
      usageRate,
      usageLimit: promoCode.usageLimit || "Illimité",
      isActive: promoCode.isActive,
      validUntil: promoCode.validUntil,
      usageByDate,
      recentUsages: promoCode.usedBy?.slice(-10).reverse().map(use => ({
        userId: use.userId,
        usedAt: use.usedAt,
        orderAmount: use.orderAmount,
        discountApplied: use.discountApplied
      })) || []
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur lors de la récupération des analytics" });
  }
};

// Toggle active status
const togglePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const promoCode = await promoCodeModel.findById(id);
    
    if (!promoCode) {
      return res.json({ success: false, message: "Code promo introuvable" });
    }

    promoCode.isActive = !promoCode.isActive;
    await promoCode.save();
    
    res.json({ 
      success: true, 
      message: `Code promo ${promoCode.isActive ? 'activé' : 'désactivé'}`, 
      data: promoCode 
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur" });
  }
};

// Validate promo code (used during checkout)
const validatePromoCode = async (req, res) => {
  try {
    const { code, cartItems, cartAmount } = req.body;
    const userId = req.body.userId;
    
    const promoCode = await promoCodeModel.findOne({ code: code.toUpperCase() });
    if (!promoCode) {
      return res.json({ success: false, message: "Code promo invalide" });
    }

    if (!promoCode.isActive) {
      return res.json({ success: false, message: "Ce code promo n'est plus actif" });
    }

    const now = new Date();
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      return res.json({ success: false, message: "Ce code promo a expiré" });
    }

    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
      return res.json({ success: false, message: "Ce code promo a atteint sa limite d'utilisation" });
    }

    const userUsage = promoCode.usedBy.filter(u => u.userId.toString() === userId).length;
    if (userUsage >= promoCode.perUserLimit) {
      return res.json({ success: false, message: "Vous avez déjà utilisé ce code promo" });
    }

    if (promoCode.conditions.minItems && cartItems.length < promoCode.conditions.minItems) {
      return res.json({ success: false, message: `Minimum ${promoCode.conditions.minItems} articles requis` });
    }

    if (promoCode.conditions.minAmount && cartAmount < promoCode.conditions.minAmount) {
      return res.json({ success: false, message: `Montant minimum ${promoCode.conditions.minAmount}€ requis` });
    }

    let discount = 0;
    if (promoCode.discountType === "percentage") {
      discount = (cartAmount * promoCode.discountValue) / 100;
      if (promoCode.maxDiscount && discount > promoCode.maxDiscount) {
        discount = promoCode.maxDiscount;
      }
    } else if (promoCode.discountType === "fixed") {
      discount = promoCode.discountValue;
    } else if (promoCode.discountType === "conditional") {
      if (cartItems.length >= promoCode.conditions.minItems) {
        discount = (cartAmount * promoCode.discountValue) / 100;
      }
    }

    discount = Math.min(discount, cartAmount);

    res.json({
      success: true,
      message: "Code promo valide",
      discount: discount.toFixed(2),
      finalAmount: (cartAmount - discount).toFixed(2),
      promoCode: { 
        code: promoCode.code, 
        description: promoCode.description,
        _id: promoCode._id
      }
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur lors de la validation" });
  }
};

// Apply promo code (record usage)
const applyPromoCode = async (req, res) => {
  try {
    const { code, orderAmount, discount } = req.body;
    const userId = req.body.userId;
    
    const promoCode = await promoCodeModel.findOne({ code: code.toUpperCase() });
    if (!promoCode) {
      return res.json({ success: false, message: "Code promo invalide" });
    }

    // Add usage record
    promoCode.usedBy.push({
      userId,
      usedAt: new Date(),
      orderAmount,
      discountApplied: discount
    });
    
    promoCode.usedCount += 1;
    await promoCode.save();

    res.json({ 
      success: true, 
      message: "Code promo appliqué",
      data: {
        totalUsages: promoCode.usedCount,
        discountApplied: discount
      }
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur" });
  }
};

// Get promo statistics dashboard
const getPromoStatistics = async (req, res) => {
  try {
    const promoCodes = await promoCodeModel.find({});
    
    const totalCodes = promoCodes.length;
    const activeCodes = promoCodes.filter(p => p.isActive).length;
    const totalUsages = promoCodes.reduce((sum, p) => sum + (p.usedCount || 0), 0);
    const totalDiscountsGiven = promoCodes.reduce((sum, p) => 
      sum + (p.usedBy?.reduce((s, u) => s + (u.discountApplied || 0), 0) || 0), 0
    );
    const uniqueUsersAll = new Set(
      promoCodes.flatMap(p => p.usedBy?.map(u => u.userId.toString()) || [])
    ).size;

    const mostUsedCode = promoCodes.reduce((max, p) => 
      (p.usedCount || 0) > (max.usedCount || 0) ? p : max
    );

    const topCodesByDiscount = promoCodes
      .map(p => ({
        code: p.code,
        totalDiscount: p.usedBy?.reduce((sum, u) => sum + (u.discountApplied || 0), 0) || 0
      }))
      .sort((a, b) => b.totalDiscount - a.totalDiscount)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalCodes,
        activeCodes,
        inactiveCodes: totalCodes - activeCodes,
        totalUsages,
        totalDiscountsGiven: totalDiscountsGiven.toFixed(2),
        uniqueUsersAll,
        mostUsedCode: {
          code: mostUsedCode.code,
          usages: mostUsedCode.usedCount || 0
        },
        topCodesByDiscount
      }
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur lors de la récupération des statistiques" });
  }
};

export { 
  createPromoCode, 
  updatePromoCode, 
  deletePromoCode, 
  getAllPromoCodes,
  getPromoAnalytics,
  togglePromoCode, 
  validatePromoCode, 
  applyPromoCode,
  getPromoStatistics
};