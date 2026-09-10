import "server-only";
import { isIsolatedTestEnvironment } from "./test-mode";
export const legal = {
  operator: process.env.LEGAL_OPERATOR_NAME?.trim() || "",
  country: process.env.LEGAL_COUNTRY?.trim() || "",
  address: process.env.LEGAL_POSTAL_ADDRESS?.trim() || "",
  email: process.env.PRIVACY_CONTACT_EMAIL?.trim() || "",
};
export const legalReady = Boolean(
  legal.operator &&
  legal.country &&
  legal.address &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(legal.email),
);
export const registrationOpen =
  isIsolatedTestEnvironment() ||
  (legalReady && process.env.ENABLE_REGISTRATION === "true");
