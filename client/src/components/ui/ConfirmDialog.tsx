import { AlertTriangle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./Button";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogPortal>
        <AlertDialogOverlay
          className="bg-forest-deep/70 backdrop-blur-none"
          style={{ animation: "fadeIn var(--duration-fast) var(--ease-standard)" }}
        />
        <AlertDialogContent
          className="top-1/2 left-1/2 max-w-2xl data-[size=default]:max-w-2xl sm:max-w-2xl data-[size=default]:sm:max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-none ring-0"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
            className="rounded-2xl glass-surface shadow-raised"
          >
            <div className="border-b border-ink/10 px-6 py-4">
              <AlertDialogTitle asChild>
                <h2 className="text-lg font-medium text-ink">{title}</h2>
              </AlertDialogTitle>
            </div>

            <div className="px-6 py-5">
              <div className="flex gap-3">
                {danger && (
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
                  </div>
                )}
                <p className="pt-1 text-sm text-ink/70">{message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-ink/10 px-6 py-4">
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={isLoading}>
                {isLoading ? "Please wait..." : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
