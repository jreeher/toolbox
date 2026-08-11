"use client";

import { useState } from "react";
import { createBoardAction } from "@/lib/actions/boards";

interface Board {
  id: string;
  name: string;
}

interface BoardPickerPopoverProps {
  boards: Board[];
  onSelect: (boardId: string | null) => void;
  onClose: () => void;
}

export function BoardPickerPopover({ boards, onSelect, onClose }: BoardPickerPopoverProps) {
  const [creating, setCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await createBoardAction(newBoardName, isPublic);
    setSubmitting(false);
    if (result.error || !result.board) {
      setError(result.error ?? "Failed to create board");
      return;
    }
    onSelect(result.board.id);
  }

  return (
    <div
      className="absolute z-10 mt-2 w-56 bg-charcoal border-2 border-toolbox-red rounded p-2 flex flex-col gap-1 text-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="text-left px-2 py-1.5 rounded hover:bg-wood-dark text-off-white"
      >
        Just Nail It
      </button>
      {boards.map((board) => (
        <button
          key={board.id}
          type="button"
          onClick={() => onSelect(board.id)}
          className="text-left px-2 py-1.5 rounded hover:bg-wood-dark text-off-white truncate"
        >
          {board.name}
        </button>
      ))}
      {creating ? (
        <form onSubmit={handleCreateBoard} className="flex flex-col gap-2 px-2 py-1.5">
          <input
            type="text"
            autoFocus
            required
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="Board name"
            className="bg-wood-dark border border-chrome text-off-white px-2 py-1 rounded text-xs"
          />
          <label className="flex items-center gap-1.5 text-xs text-off-white">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public board
          </label>
          {error && <p className="text-toolbox-red text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-toolbox-red text-off-white text-xs px-2 py-1 rounded disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="text-off-white/60 text-xs px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="text-left px-2 py-1.5 rounded hover:bg-wood-dark text-toolbox-red"
        >
          + New Board
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="text-left px-2 py-1.5 rounded hover:bg-wood-dark text-off-white/50 text-xs"
      >
        Cancel
      </button>
    </div>
  );
}
