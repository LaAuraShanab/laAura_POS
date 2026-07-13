import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "../ui/dialog";
import { Dialog as DialogPrimitive } from "radix-ui";
import { SidebarContent } from "./Sidebar";

export function MobileNav() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-border glass-surface px-4 py-3 text-ink md:hidden print:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full p-1.5 text-ink/80 hover:bg-sage/10 hover:text-ink"
          aria-label={t("common.openMenu")}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="La Aura" className="h-7 w-7 rounded-full object-cover" />
          <span className="font-serif text-base italic text-forest">La Aura</span>
        </div>
        <div className="h-5 w-5" aria-hidden="true" />
      </header>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-forest-deep/70 backdrop-blur-none" />
          <DialogPrimitive.Content
            data-slot="dialog-content"
            className="fixed inset-y-0 start-0 z-50 flex h-full w-72 flex-col glass-surface-strong px-3.5 py-5 text-ink shadow-raised outline-none duration-200 data-closed:animate-out data-closed:slide-out-to-left rtl:data-closed:slide-out-to-right data-open:animate-in data-open:slide-in-from-left rtl:data-open:slide-in-from-right"
          >
            <DialogTitle className="sr-only">{t("common.navigationMenu")}</DialogTitle>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
