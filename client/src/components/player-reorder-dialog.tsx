import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Player } from "@shared/schema";
import { GripVertical, ArrowUp, ArrowDown, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerReorderDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (newOrder: Player[]) => void;
  players: Player[];
}

export function PlayerReorderDialog({
  open,
  onClose,
  onSave,
  players,
}: PlayerReorderDialogProps) {
  const [orderedPlayers, setOrderedPlayers] = useState<Player[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setOrderedPlayers([...players]);
    }
  }, [open, players]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedPlayers];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedPlayers(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === orderedPlayers.length - 1) return;
    const newOrder = [...orderedPlayers];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedPlayers(newOrder);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedPlayers];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setOrderedPlayers(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    onSave(orderedPlayers);
    onClose();
  };

  const handleCancel = () => {
    setOrderedPlayers([...players]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Reorder Players</DialogTitle>
          <DialogDescription>
            Drag players or use arrows to change the seating order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {orderedPlayers.map((player, index) => (
            <div
              key={player.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
                draggedIndex === index && "opacity-50 scale-[0.98]",
                "cursor-grab active:cursor-grabbing"
              )}
              data-testid={`draggable-player-${player.id}`}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {index + 1}
                </span>
                <span className="font-medium truncate">{player.name}</span>
                {player.isDealer && (
                  <CircleDot className="h-4 w-4 text-chart-2 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  data-testid={`button-move-up-${player.id}`}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => moveDown(index)}
                  disabled={index === orderedPlayers.length - 1}
                  data-testid={`button-move-down-${player.id}`}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          The dealer position will follow the reordered players.
        </p>

        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            data-testid="button-reorder-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1"
            data-testid="button-reorder-save"
          >
            Save Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
