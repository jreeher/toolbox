"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-8 max-w-md mx-auto flex flex-col items-center text-center gap-4 mt-24">
      <h1 className="font-heading text-3xl text-toolbox-red">Something Broke</h1>
      <p className="text-off-white text-sm">
        Something went wrong loading this page. It&apos;s not you — try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded"
      >
        Try again
      </button>
    </div>
  );
}
