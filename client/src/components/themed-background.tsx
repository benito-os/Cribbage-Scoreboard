import { type ReactNode } from "react";
import { useTheme } from "./theme-provider";
import casinoBg from "@assets/generated_images/luxury_casino_felt_texture.png";
import badgersLogo from "@assets/image_1766417176045.png";

export function ThemedBackground({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  const showCasinoBg = theme === "casino";
  const showBadgersBg = theme === "badgers";

  return (
    <div className="relative min-h-screen">
      {showCasinoBg && (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ 
            backgroundImage: `url(${casinoBg})`,
            opacity: 0.4,
          }}
          aria-hidden="true"
        />
      )}
      
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
