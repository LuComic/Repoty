const stripe = require("stripe");

function createCheckout() {
  return stripe;
}

module.exports = {
  createCheckout,
};
