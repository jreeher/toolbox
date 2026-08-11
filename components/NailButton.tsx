"use client";

import { useState, useTransition } from "react";
import { Hammer } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { toggleNailAction } from "@/lib/actions/engagement";
import { BoardPickerPopover } from "@/components/BoardPickerPopover";

interface Board {
  id: string;
  name: string;
}

interface NailButtonProps {
  postId: string;
  path: string;
  initialNailed: boolean;
  initialCount: number;
  viewerBoards: Board[];
  isLoggedIn: boolean;
  interactive?: boolean;
}

export function NailButton({
  postId,
  path,
  initialNailed,
  initialCount,
  viewerBoards,
  isLoggedIn,
  interactive = true,
}: NailButtonProps) {
  const [nailed, setNailed] = useState(initialNailed);
  const [count, setCount] = useState(initialCount);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function commitNail(boardId: string | null) {
    setPickerOpen(false);
    setNailed(true);
    setCount((c) => c + 1);

    startTransition(async () => {
      const result = await toggleNailAction(postId, boardId, path);
      if (result.error) {
        setNailed(false);
        setCount((c) => c - 1);
        if (result.error.includes("signed in")) {
          router.push("/login?reason=auth");
        } else {
          toast(result.error);
        }
      }
    });
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!interactive || isPending) return;

    if (!isLoggedIn) {
      router.push("/login?reason=auth");
      return;
    }

    if (nailed) {
      setNailed(false);
      setCount((c) => c - 1);
      startTransition(async () => {
        const result = await toggleNailAction(postId, null, path);
        if (result.error) {
          setNailed(true);
          setCount((c) => c + 1);
          if (result.error.includes("signed in")) {
            router.push("/login?reason=auth");
          } else {
            toast(result.error);
          }
        }
      });
      return;
    }

    setPickerOpen((open) => !open);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={nailed}
        aria-label={nailed ? "Remove nail" : "Nail this post"}
        className={`flex items-center gap-1 ${nailed ? "text-toolbox-red" : "text-off-white"}`}
      >
        <Hammer size={14} /> {count}
      </button>
      {pickerOpen && (
        <BoardPickerPopover
          boards={viewerBoards}
          onSelect={commitNail}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
