import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePlayerProfiles } from "@/lib/playerProfilesContext";
import { ChevronDown, User, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerComboInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export function PlayerComboInput({
  value,
  onChange,
  placeholder = "Player name",
  className,
  "data-testid": testId,
}: PlayerComboInputProps) {
  const { profiles } = usePlayerProfiles();
  const [open, setOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedValue = value.trim().toLowerCase();
  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(normalizedValue)
  );

  const exactMatch = profiles.find(
    p => p.name.toLowerCase() === normalizedValue
  );

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative flex gap-1", className)}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setTimeout(() => setInputFocused(false), 200)}
        placeholder={placeholder}
        className="flex-1"
        data-testid={testId}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="flex-shrink-0"
            data-testid={`${testId}-dropdown`}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="end">
          {profiles.length === 0 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              No saved players yet
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleSelect(profile.name)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover-elevate text-left"
                  data-testid={`select-player-${profile.id}`}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{profile.name}</span>
                  {profile.stats?.gamesPlayed ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {profile.stats.gamesWon}W
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {inputFocused && value && !exactMatch && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-popover border rounded-md shadow-md z-50 text-xs text-muted-foreground flex items-center gap-1">
          <UserPlus className="h-3 w-3" />
          New player will be created
        </div>
      )}
    </div>
  );
}
