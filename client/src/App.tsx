import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameProvider } from "@/lib/gameContext";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedBackground } from "@/components/themed-background";
import GameSetup from "@/pages/game-setup";
import ActiveGame from "@/pages/active-game";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={GameSetup} />
      <Route path="/game" component={ActiveGame} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemedBackground />
        <TooltipProvider>
          <GameProvider>
            <Toaster />
            <Router />
          </GameProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
