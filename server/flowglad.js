const { FlowgladServer } = require('@flowglad/server');

/**
 * Return guest details for a customer id. Replace with your user lookup when you add auth.
 */
async function getCustomerDetails(id) {
  return {
    email: `${id}@guest.medstudentpro.app`,
    name: 'Guest',
  };
}

/**
 * Flowglad server factory. customerExternalId is the ID from YOUR app (e.g. user.id).
 * We use getRequestingCustomer so the session has valid name/email (required by Flowglad).
 */
function flowglad(customerExternalId) {
  return new FlowgladServer({
    getRequestingCustomer: async () => {
      const details = await getCustomerDetails(customerExternalId);
      return {
        externalId: customerExternalId,
        name: details.name,
        email: details.email,
      };
    },
  });
}

module.exports = { flowglad };
