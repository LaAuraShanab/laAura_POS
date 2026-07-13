import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  ShoppingCart,
  BarChart3,
  Receipt,
  LayoutGrid,
  Package,
  Users,
  UserCog,
  ScrollText,
  Sun,
  Moon,
  Leaf,
  Languages,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { Button } from "../ui/Button";
import type { Role } from "../../types/user";

interface NavItem {
  labelKey: string;
  to?: string;
  icon: typeof Home;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.home", to: "/home", icon: Home, roles: ["ADMIN", "MANAGER", "REPORTER"] },
  { labelKey: "nav.sell", to: "/pos", icon: ShoppingCart, roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { labelKey: "nav.reporting", to: "/reporting", icon: BarChart3, roles: ["ADMIN", "MANAGER", "REPORTER"] },
  {
    labelKey: "nav.transactions",
    to: "/transactions",
    icon: Receipt,
    roles: ["ADMIN", "MANAGER", "REPORTER", "CASHIER"],
  },
  { labelKey: "nav.catalog", to: "/products", icon: LayoutGrid, roles: ["ADMIN", "MANAGER"] },
  { labelKey: "nav.inventory", icon: Package, roles: ["ADMIN", "MANAGER"] },
  { labelKey: "nav.customers", to: "/customers", icon: Users, roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { labelKey: "nav.users", to: "/users", icon: UserCog, roles: ["ADMIN"] },
  { labelKey: "nav.auditLog", to: "/audit-log", icon: ScrollText, roles: ["ADMIN"] },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const items = NAV_ITEMS.filter((item) => !!user && item.roles.includes(user.role));
  const initials = (user?.name ?? "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="mb-4 flex items-center gap-2 border-b border-border px-1.5 pb-4">
        <img src="/logo.png" alt="La Aura" className="h-8 w-8 rounded-full object-cover shadow-glow-primary" />
        <span className="font-serif text-base italic text-forest">La Aura</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const label = t(item.labelKey);
          if (!item.to) {
            return (
              <span
                key={item.labelKey}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink/30"
                aria-disabled="true"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </span>
            );
          }
          return (
            <NavLink
              key={item.labelKey}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors duration-150 ${
                  isActive
                    ? "border-s-2 border-forest bg-gradient-to-r from-forest/15 to-transparent rtl:bg-gradient-to-l text-forest"
                    : "text-ink/65 hover:bg-sage/5 hover:text-ink"
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <Leaf
                className="h-3.5 w-3.5 -translate-x-1.5 -rotate-45 text-gold opacity-0 transition-all duration-200 ease-[var(--ease-standard)] group-hover:translate-x-0 group-hover:rotate-0 group-hover:opacity-100 rtl:translate-x-1.5 rtl:group-hover:translate-x-0"
                aria-hidden="true"
              />
            </NavLink>
          );
        })}
      </nav>

      <div className="mb-2 flex items-center justify-between rounded-full bg-sage/6 p-1">
        <button
          onClick={() => setLanguage("en")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-colors ${
            language === "en" ? "bg-forest text-primary-foreground shadow-resting" : "text-ink/50 hover:text-ink"
          }`}
          aria-label="Use English"
          aria-pressed={language === "en"}
        >
          <Languages className="h-3.5 w-3.5" aria-hidden="true" />
          EN
        </button>
        <button
          onClick={() => setLanguage("ar")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-colors ${
            language === "ar" ? "bg-forest text-primary-foreground shadow-resting" : "text-ink/50 hover:text-ink"
          }`}
          aria-label="استخدام العربية"
          aria-pressed={language === "ar"}
        >
          <Languages className="h-3.5 w-3.5" aria-hidden="true" />
          عربي
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between rounded-full bg-sage/6 p-1">
        <button
          onClick={() => theme !== "light" && toggleTheme()}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-colors ${
            theme === "light" ? "bg-forest text-primary-foreground shadow-resting" : "text-ink/50 hover:text-ink"
          }`}
          aria-label="Use light theme"
          aria-pressed={theme === "light"}
        >
          <Sun className="h-3.5 w-3.5" aria-hidden="true" />
          {t("nav.light")}
        </button>
        <button
          onClick={() => theme !== "dark" && toggleTheme()}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-colors ${
            theme === "dark" ? "bg-forest text-primary-foreground shadow-resting" : "text-ink/50 hover:text-ink"
          }`}
          aria-label="Use dark theme"
          aria-pressed={theme === "dark"}
        >
          <Moon className="h-3.5 w-3.5" aria-hidden="true" />
          {t("nav.dark")}
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-2xl glass-surface-strong border border-forest/20 p-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-forest text-[11px] font-medium text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">{user?.name}</p>
          <p className="text-[10px] font-medium tracking-wide text-forest capitalize">
            {user?.role.toLowerCase()}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        onClick={() => logout()}
        className="mt-2 w-full !justify-center !text-ink/50 text-xs hover:!bg-destructive/10 hover:!text-destructive"
      >
        {t("nav.logout")}
      </Button>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-56 flex-shrink-0 flex-col glass-surface border-e border-border px-3.5 py-5 text-ink md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto print:hidden">
      <SidebarContent />
    </aside>
  );
}
