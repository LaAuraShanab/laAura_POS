import { useCallback, useEffect, useState } from "react";
import type { CartLine } from "../pages/pos/Cart";
import type { Customer } from "../types/customer";
import type { PaymentMethod } from "../types/sale";

export interface HeldSale {
  id: string;
  heldAt: string;
  lines: CartLine[];
  discount: number;
  tax: number;
  note: string;
  paymentMethod: PaymentMethod;
  customer: Customer | null;
}

const STORAGE_KEY = "la-aura-held-sales";

function readStored(): HeldSale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HeldSale[]) : [];
  } catch {
    return [];
  }
}

export function useHeldSales() {
  const [heldSales, setHeldSales] = useState<HeldSale[]>(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(heldSales));
  }, [heldSales]);

  const holdSale = useCallback((sale: Omit<HeldSale, "id" | "heldAt">) => {
    const held: HeldSale = { ...sale, id: crypto.randomUUID(), heldAt: new Date().toISOString() };
    setHeldSales((prev) => [held, ...prev]);
  }, []);

  const discardSale = useCallback((id: string) => {
    setHeldSales((prev) => prev.filter((sale) => sale.id !== id));
  }, []);

  const takeSale = useCallback((id: string): HeldSale | undefined => {
    let taken: HeldSale | undefined;
    setHeldSales((prev) => {
      taken = prev.find((sale) => sale.id === id);
      return prev.filter((sale) => sale.id !== id);
    });
    return taken;
  }, []);

  return { heldSales, holdSale, discardSale, takeSale };
}
