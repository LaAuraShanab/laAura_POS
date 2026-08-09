import { useState } from "react";
import { FileDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { reportsApi } from "../../api/reportsApi";
import type { DashboardRange } from "../../types/dashboard";

export function ExportPdfButton({ range, offset = 0 }: { range: DashboardRange; offset?: number }) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await reportsApi.exportPdf(range, offset);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `la-aura-report-${range}${offset ? `-${offset}` : ""}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleExport} disabled={isExporting}>
      <FileDown className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
      {isExporting ? t("reporting.preparingExport") : t("reporting.exportPdf")}
    </Button>
  );
}
