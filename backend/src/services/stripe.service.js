const stripe = require("stripe")(process.env.STRIPE_SECRET);

module.exports = {
  createPaymentIntent: async (amount) => {
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur"
    });
  }
};
