import {
  LogIn,
  LogOut,
  ShoppingCart,
  Ban,
  RotateCcw,
  Package,
  ImageIcon,
  PackageX,
  UserPlus,
  UserCog,
  UserX,
} from "lucide-react";
import i18n from "../../i18n";
import type { AuditLog } from "../../types/auditLog";

type Tone = "forest" | "gold" | "destructive" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  forest: "bg-forest/10 text-forest",
  gold: "bg-gold-soft/25 text-gold",
  destructive: "bg-destructive/10 text-destructive",
  neutral: "bg-sage/8 text-ink/65",
};

interface ActionMeta {
  labelKey: string;
  icon: typeof LogIn;
  tone: Tone;
}

export const ACTION_META: Record<string, ActionMeta> = {
  LOGIN_SUCCESS: { labelKey: "audit.actionSignedIn", icon: LogIn, tone: "forest" },
  LOGIN_FAILED: { labelKey: "audit.actionFailedSignIn", icon: LogOut, tone: "destructive" },
  SALE_CREATED: { labelKey: "audit.actionSaleCompleted", icon: ShoppingCart, tone: "forest" },
  SALE_VOIDED: { labelKey: "audit.actionSaleVoided", icon: Ban, tone: "destructive" },
  SALE_REFUNDED: { labelKey: "audit.actionSaleRefunded", icon: RotateCcw, tone: "gold" },
  PRODUCT_CREATED: { labelKey: "audit.actionProductCreated", icon: Package, tone: "forest" },
  PRODUCT_UPDATED: { labelKey: "audit.actionProductUpdated", icon: Package, tone: "neutral" },
  PRODUCT_IMAGE_UPDATED: { labelKey: "audit.actionProductImageUpdated", icon: ImageIcon, tone: "neutral" },
  PRODUCT_DEACTIVATED: { labelKey: "audit.actionProductDeactivated", icon: PackageX, tone: "destructive" },
  USER_CREATED: { labelKey: "audit.actionUserCreated", icon: UserPlus, tone: "forest" },
  USER_UPDATED: { labelKey: "audit.actionUserUpdated", icon: UserCog, tone: "neutral" },
  USER_DEACTIVATED: { labelKey: "audit.actionUserDeactivated", icon: UserX, tone: "destructive" },
  CUSTOMER_CREATED: { labelKey: "audit.actionCustomerCreated", icon: UserPlus, tone: "forest" },
  CUSTOMER_UPDATED: { labelKey: "audit.actionCustomerUpdated", icon: UserCog, tone: "neutral" },
  CUSTOMER_DEACTIVATED: { labelKey: "audit.actionCustomerRemoved", icon: UserX, tone: "destructive" },
};

export function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action];
  const Icon = meta?.icon ?? UserCog;
  const tone = meta?.tone ?? "neutral";
  const label = meta ? i18n.t(meta.labelKey) : action.replace(/_/g, " ").toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

function formatCurrency(value: unknown): string | null {
  const num = Number(value);
  return Number.isFinite(num) ? `$${num.toFixed(2)}` : null;
}

export function metadataSummary(log: AuditLog): string {
  const m = log.metadata ?? {};
  switch (log.action) {
    case "LOGIN_FAILED":
      return typeof m.email === "string" ? m.email : "—";
    case "SALE_CREATED": {
      const parts = [m.reference, formatCurrency(m.grandTotal), m.customerName].filter(
        (v): v is string => typeof v === "string"
      );
      return parts.length ? parts.join(" · ") : "—";
    }
    case "SALE_VOIDED":
    case "SALE_REFUNDED": {
      const parts = [m.reference, formatCurrency(m.grandTotal)].filter(Boolean);
      if (typeof m.reason === "string" && m.reason) parts.push(`"${m.reason}"`);
      return parts.length ? parts.join(" · ") : "—";
    }
    case "PRODUCT_CREATED": {
      const parts: string[] = [];
      if (typeof m.productName === "string") parts.push(m.productName);
      else if (typeof m.sku === "string") parts.push(`SKU ${m.sku}`);
      const variants = Array.isArray(m.variants) ? (m.variants as unknown[]).filter((v): v is string => typeof v === "string") : [];
      const extras = Array.isArray(m.extras) ? (m.extras as unknown[]).filter((v): v is string => typeof v === "string") : [];
      if (variants.length) parts.push(i18n.t("products.sizesCount", { count: variants.length }));
      if (extras.length) parts.push(i18n.t("products.extrasCount", { count: extras.length }));
      return parts.length ? parts.join(" · ") : "—";
    }
    case "PRODUCT_UPDATED": {
      const parts: string[] = [];
      if (typeof m.productName === "string") parts.push(m.productName);

      const describeChange = (label: string, changes: unknown) => {
        if (!changes || typeof changes !== "object") return null;
        const { added, removed } = changes as { added?: unknown; removed?: unknown };
        const bits = [
          ...(Array.isArray(added) ? added.filter((n): n is string => typeof n === "string").map((n) => `+${n}`) : []),
          ...(Array.isArray(removed) ? removed.filter((n): n is string => typeof n === "string").map((n) => `-${n}`) : []),
        ];
        return bits.length ? `${label}: ${bits.join(", ")}` : null;
      };

      const sizesSummary = describeChange(i18n.t("audit.sizesLabel"), m.variantChanges);
      const extrasSummary = describeChange(i18n.t("audit.extrasLabel"), m.extraChanges);
      if (sizesSummary) parts.push(sizesSummary);
      if (extrasSummary) parts.push(extrasSummary);

      if (parts.length) return parts.join(" · ");
      return typeof m.productId === "string"
        ? i18n.t("audit.productFallback", { id: m.productId.slice(0, 8) })
        : "—";
    }
    case "PRODUCT_IMAGE_UPDATED":
    case "PRODUCT_DEACTIVATED":
      if (typeof m.productName === "string") return m.productName;
      return typeof m.productId === "string"
        ? i18n.t("audit.productFallback", { id: m.productId.slice(0, 8) })
        : "—";
    case "USER_CREATED":
      return typeof m.createdUserId === "string"
        ? i18n.t("audit.userFallback", { id: m.createdUserId.slice(0, 8) })
        : "—";
    case "USER_UPDATED":
      return typeof m.updatedUserId === "string"
        ? i18n.t("audit.userFallback", { id: m.updatedUserId.slice(0, 8) })
        : "—";
    case "USER_DEACTIVATED":
      return typeof m.deactivatedUserId === "string"
        ? i18n.t("audit.userFallback", { id: m.deactivatedUserId.slice(0, 8) })
        : "—";
    case "CUSTOMER_CREATED":
    case "CUSTOMER_UPDATED":
    case "CUSTOMER_DEACTIVATED":
      return typeof m.customerName === "string" ? m.customerName : "—";
    default: {
      const entries = Object.entries(m);
      if (entries.length === 0) return "—";
      return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" · ");
    }
  }
}
