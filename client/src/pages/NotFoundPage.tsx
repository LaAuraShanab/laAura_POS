import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-cream text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage/10">
        <Compass className="h-6 w-6 text-forest" aria-hidden="true" />
      </div>
      <p className="text-2xl font-medium text-ink">404</p>
      <p className="text-sm text-ink/55">{t("notFound.pageNotFound")}</p>
      <Link to="/" className="text-sm text-forest hover:underline">
        {t("notFound.goHome")}
      </Link>
    </div>
  );
}
