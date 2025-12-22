import { useTheme } from "./theme-provider";
import casinoBg from "@assets/generated_images/luxury_casino_felt_texture.png";
import badgersBg from "@assets/generated_images/wisconsin_badgers_red_background.png";

export function ThemedBackground() {
  const { theme } = useTheme();

  if (theme !== "casino" && theme !== "badgers") {
    return null;
  }

  const bgImage = theme === "casino" ? casinoBg : badgersBg;

  return (
    <div
      className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-30"
      style={{ backgroundImage: `url(${bgImage})` }}
      aria-hidden="true"
    />
  );
}
