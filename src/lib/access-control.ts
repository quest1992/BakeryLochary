export type AppRole = "OWNER" | "WORKER" | "INVESTOR";

export const investorTabs = ["finance", "customers", "reports"] as const;
export const investorBlockedApiAreas = new Set(["recipes", "production", "ingredients", "raw-materials", "stock", "warehouse", "inventory", "procurement", "purchases", "settings", "users"]);

export function canReadFinancials(role: AppRole) {
  return role === "OWNER" || role === "INVESTOR";
}

export function canWriteBusinessData(role: AppRole) {
  return role === "OWNER" || role === "WORKER";
}

export function canAccessTab(role: AppRole, tab: string) {
  if (role === "OWNER") return true;
  if (role === "INVESTOR") return (investorTabs as readonly string[]).includes(tab);
  return !["finance", "reports", "products", "recipes", "suppliers", "procurement"].includes(tab);
}

export function assertBusinessWrite(role: AppRole) {
  if (!canWriteBusinessData(role)) throw new Error("FORBIDDEN");
}

export function apiAreaStatus(role: AppRole, area: string) {
  return role === "INVESTOR" && investorBlockedApiAreas.has(area) ? 403 : 404;
}

export function hasRestrictedFinancialFields(value: unknown): boolean {
  const forbidden = new Set(["recipe", "recipes", "recipeItem", "recipeItems", "ingredient", "ingredients", "quantityPerUnit", "usageNorm", "norm"]);
  const visit = (item: unknown): boolean => {
    if (!item || typeof item !== "object") return false;
    if (Array.isArray(item)) return item.some(visit);
    return Object.entries(item).some(([key, child]) => forbidden.has(key) || visit(child));
  };
  return visit(value);
}
