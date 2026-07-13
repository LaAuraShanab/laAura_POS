import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

export function Toaster(props: ToasterProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  return (
    <Sonner
      theme={theme}
      dir={language === "ar" ? "rtl" : "ltr"}
      position={language === "ar" ? "top-left" : "top-right"}
      closeButton
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--success)",
          "--success-border": "var(--success)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--destructive)",
          "--error-border": "var(--destructive)",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!shadow-raised font-sans",
        },
      }}
      {...props}
    />
  );
}
