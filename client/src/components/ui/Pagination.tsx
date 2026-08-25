import { useTranslation } from "react-i18next";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ELLIPSIS = "ellipsis" as const;
type PageItem = number | typeof ELLIPSIS;

// Windowed page list with ellipses, e.g. "1 … 5 6 7 … 59" — keeps the control a
// fixed, small width no matter how many pages there are (unlike rendering every
// page number, which overflows/wraps badly once a list has dozens of pages).
function getPageWindow(current: number, total: number, siblings = 1): PageItem[] {
  const totalVisible = siblings * 2 + 5; // first + last + current + 2*siblings + 2 ellipsis slots
  if (total <= totalVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const count = 3 + siblings * 2;
    return [...Array.from({ length: count }, (_, i) => i + 1), ELLIPSIS, total];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    const count = 3 + siblings * 2;
    return [1, ELLIPSIS, ...Array.from({ length: count }, (_, i) => total - count + i + 1)];
  }
  return [1, ELLIPSIS, ...Array.from({ length: right - left + 1 }, (_, i) => left + i), ELLIPSIS, total];
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  const items = getPageWindow(page, totalPages);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-full px-2 py-1 hover:bg-sage/10 disabled:opacity-30"
      >
        {t("common.previous")}
      </button>
      {items.map((item, i) =>
        item === ELLIPSIS ? (
          <span key={`ellipsis-${i}`} className="px-1 text-ink/35" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={`h-6 w-6 rounded-full ${item === page ? "bg-gold text-forest-deep" : "hover:bg-sage/10"}`}
          >
            {item}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="rounded-full px-2 py-1 hover:bg-sage/10 disabled:opacity-30"
      >
        {t("common.next")}
      </button>
    </div>
  );
}
