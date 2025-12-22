import { type ReactNode } from "react";
import { useTheme } from "./theme-provider";
import badgersLogo from "@assets/image_1766417176045.png";

export function ThemedBackground({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  const showBadgersBg = theme === "badgers";

  return (
    <div className="relative min-h-screen">
      {showBadgersBg && (
        <div
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <img 
            src={badgersLogo} 
            alt="" 
            className="w-72 h-auto opacity-20"
          />
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
