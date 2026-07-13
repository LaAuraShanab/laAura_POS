import type { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "./dialog";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay
          className="bg-forest-deep/70 backdrop-blur-none"
          style={{ animation: "fadeIn var(--duration-fast) var(--ease-standard)" }}
        />
        <DialogContent
          showCloseButton={false}
          className="top-1/2 left-1/2 max-h-[90vh] w-full max-w-2xl sm:max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-none ring-0"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
            className="max-h-[90vh] overflow-y-auto rounded-2xl glass-surface shadow-raised"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
              <DialogTitle asChild>
                <h2 className="text-lg font-medium text-ink">{title}</h2>
              </DialogTitle>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-ink/40 hover:bg-sage/10 hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
