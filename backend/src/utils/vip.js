// Helpers pour la logique VIP voyageurs

const VIP_PRICES = {
  free: 0,
  bag_packer: 49,   // €/an
  explorator: 99    // €/an (avec -10% renouvellement -> 89.10)
};

const VIP_DURATION_DAYS = 365;

// Avantages par formule
const VIP_BENEFITS = {
  free: {
    label: "Free",
    price: 0,
    reduction: 0,
    freebiesPerYear: 0,
    freebiesPerWeek: 0,
    priorityAccess: false,
    renewalBonus: false
  },
  bag_packer: {
    label: "Bag Packer",
    price: 49,
    reduction: 5,
    freebiesPerYear: 1,
    freebiesPerWeek: 0,
    maxFreebiePrice: 80,
    priorityAccess: true,
    renewalBonus: false
  },
  explorator: {
    label: "Explorator",
    price: 99,
    reduction: 5,
    freebiesPerYear: 0,
    freebiesPerWeek: 1,
    maxFreebiePrice: null, // sans limite
    priorityAccess: true,
    renewalBonus: true // -10% sur le prix annuel au renouvellement
  }
};

// Calcule le début de la semaine (lundi) pour une date donnée
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=dim, 1=lundi
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Calcule le début de l'année
function getYearStart(date = new Date()) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
}

// Remet à zéro les compteurs si nécessaire (semaine/année glissante)
function refreshVipCounters(user) {
  const now = new Date();
  const vip = user.vipSubscription;

  if (!vip || !vip.active) return;

  const weekStart = getWeekStart(now);
  const yearStart = getYearStart(now);

  if (!vip.weekStartDate || vip.weekStartDate < weekStart) {
    vip.freebiesUsedThisWeek = 0;
    vip.weekStartDate = weekStart;
  }
  if (!vip.yearStartDate || vip.yearStartDate < yearStart) {
    vip.freebiesUsedThisYear = 0;
    vip.yearStartDate = yearStart;
  }
}

// Vérifie si l'utilisateur peut utiliser une prestation offerte sur une prestation donnée
function canUseFreebie(user, prestation) {
  if (!user || !user.vipSubscription || !user.vipSubscription.active) return false;

  refreshVipCounters(user);

  const type = user.vipSubscription.type;
  const benefits = VIP_BENEFITS[type];
  if (!benefits) return false;

  const vip = user.vipSubscription;

  // Bag Packer : 1/an < 80€
  if (type === "bag_packer") {
    if (vip.freebiesUsedThisYear >= benefits.freebiesPerYear) return false;
    if (prestation.priceTTC > benefits.maxFreebiePrice) return false;
    return true;
  }

  // Explorator : 1/semaine sans limite
  if (type === "explorator") {
    if (vip.freebiesUsedThisWeek >= benefits.freebiesPerWeek) return false;
    return true;
  }

  return false;
}

// Marque une prestation comme utilisée dans le quota
function consumeFreebie(user) {
  refreshVipCounters(user);
  const vip = user.vipSubscription;
  vip.freebiesUsedThisWeek = (vip.freebiesUsedThisWeek || 0) + 1;
  vip.freebiesUsedThisYear = (vip.freebiesUsedThisYear || 0) + 1;
}

// Applique la réduction VIP au prix d'une prestation
function applyVipReduction(user, priceTTC) {
  if (!user || !user.vipSubscription || !user.vipSubscription.active) {
    return { finalPrice: priceTTC, reduction: 0 };
  }
  const benefits = VIP_BENEFITS[user.vipSubscription.type];
  if (!benefits || benefits.reduction <= 0) {
    return { finalPrice: priceTTC, reduction: 0 };
  }
  const reductionAmount = Math.round(priceTTC * benefits.reduction) / 100;
  return {
    finalPrice: Math.round((priceTTC - reductionAmount) * 100) / 100,
    reduction: reductionAmount
  };
}

// Calcule le prix avec réduction renouvellement (-10%)
function getRenewalPrice(type) {
  const basePrice = VIP_PRICES[type];
  const benefits = VIP_BENEFITS[type];
  if (benefits.renewalBonus) {
    return Math.round(basePrice * 0.9 * 100) / 100;
  }
  return basePrice;
}

module.exports = {
  VIP_PRICES,
  VIP_DURATION_DAYS,
  VIP_BENEFITS,
  refreshVipCounters,
  canUseFreebie,
  consumeFreebie,
  applyVipReduction,
  getRenewalPrice,
  getWeekStart,
  getYearStart
};