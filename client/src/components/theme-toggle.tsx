import { Moon, Sun, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Theme } from "./theme-provider";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "casino", label: "Casino", icon: Sparkles },
  { value: "badgers", label: "Badgers", icon: Trophy },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const currentIcon = () => {
    switch (theme) {
      case "dark": return <Moon className="h-5 w-5" />;
      case "casino": return <Sparkles className="h-5 w-5" />;
      case "badgers": return <Trophy className="h-5 w-5" />;
      default: return <Sun className="h-5 w-5" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-theme-toggle"
        >
          {currentIcon()}
          <span className="sr-only">Select theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={theme === option.value ? "bg-accent" : ""}
              data-testid={`menu-theme-${option.value}`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
