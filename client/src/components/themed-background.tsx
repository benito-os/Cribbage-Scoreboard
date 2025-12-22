import { useTheme } from "./theme-provider";
import casinoBg from "@assets/generated_images/luxury_casino_felt_texture.png";
import badgersLogo from "@assets/image_1766417176045.png";

export function ThemedBackground() {
  const { theme } = useTheme();

  if (theme !== "casino" && theme !== "badgers") {
    return null;
  }

  if (theme === "casino") {
    return (
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${casinoBg})`,
          zIndex: -1,
        }}
        aria-hidden="true"
      />
    );
  }

  if (theme === "badgers") {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: -1 }}
        aria-hidden="true"
      >
        <img 
          src={badgersLogo} 
          alt="" 
          className="w-72 h-auto opacity-15"
        />
      </div>
    );
  }

  return null;
}
