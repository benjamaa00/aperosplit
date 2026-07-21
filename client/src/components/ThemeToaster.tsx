import { memo } from "react";
import { Toaster } from "sonner";
import { useThemeContext } from "../contexts/ThemeContext";

export const ThemeToaster = memo(() => {
 const { theme } = useThemeContext();
 return <Toaster position="top-center" richColors theme={theme} />;
});
ThemeToaster.displayName = "ThemeToaster";
