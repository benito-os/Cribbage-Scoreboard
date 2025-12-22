import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GameProvider } from "@/lib/gameContext";
import { PlayerProfilesProvider } from "@/lib/playerProfilesContext";
import { GameCompletionHandler } from "@/components/game-completion-handler";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedBackground } from "@/components/themed-background";
import GameSetup from "@/pages/game-setup";
import ActiveGame from "@/pages/active-game";
import ManagePlayers from "@/pages/manage-players";
import GameHistory from "@/pages/game-history";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={GameSetup} />
      <Route path="/game" component={ActiveGame} />
      <Route path="/players" component={ManagePlayers} />
      <Route path="/history" component={GameHistory} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemedBackground>
          <TooltipProvider>
            <PlayerProfilesProvider>
              <GameProvider>
                <GameCompletionHandler />
                <Toaster />
                <Router />
              </GameProvider>
            </PlayerProfilesProvider>
          </TooltipProvider>
        </ThemedBackground>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
