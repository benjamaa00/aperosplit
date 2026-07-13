import { ReactNode } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemeContext } from "../contexts/ThemeContext";
import ErrorBoundary from "./ErrorBoundary";

function AppShell({ children }: { children: ReactNode }) {
  const { theme } = useThemeContext();
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster position="top-center" richColors theme={theme} />
        {children}
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export { AppShell };
