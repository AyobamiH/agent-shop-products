/**
 * A distinct, externally verified service discovery route, not a second
 * product authoring source or marketplace/payment integration.
 */
export const SUBCONTRACTING_CAPABILITY_SLUG = "agent-subcontracting-commercial-handoff";
export const SUBCONTRACTING_PROVIDER_NAME = "Tail Wagging Website Design Factory Northampton";
export const SUBCONTRACTING_SERVICE_GUIDE = "https://tailwaggingwebdesign.com/agents/";
export const SUBCONTRACTING_SERVICE_CATALOGUE =
  "https://tailwaggingwebdesign.com/agent-services.json";

// Human enquiries go to the live form, not agent API documentation.
// UTM markers are unsigned marketing signals, never proof of conversion.
const PROVIDER_CONTACT = "https://tailwaggingwebdesign.com/contact/";
const REFERRAL_QUERY = "?utm_source=agent_shop&utm_medium=referral&utm_campaign=";
export const SUBCONTRACTING_INTEGRATION_QUOTE_URL =
  PROVIDER_CONTACT + REFERRAL_QUERY + "integration_services";
export const SUBCONTRACTING_CAPABILITY_QUOTE_URL =
  PROVIDER_CONTACT + REFERRAL_QUERY + "capability_brief";
