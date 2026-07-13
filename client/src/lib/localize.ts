import type { Language } from "../i18n";

interface Localizable {
  name: string;
  nameAr?: string | null;
}

export function localizedName(item: Localizable, language: Language): string {
  if (language === "ar" && item.nameAr) return item.nameAr;
  return item.name;
}
