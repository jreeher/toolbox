"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface ToolboxDrawerProps {
  label: string;
  slug: string;
  reducedMotion: boolean;
}

const drawerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export function ToolboxDrawer({ label, slug, reducedMotion }: ToolboxDrawerProps) {
  return (
    <motion.div
      variants={reducedMotion ? undefined : drawerVariants}
      initial={reducedMotion ? false : "hidden"}
      animate={reducedMotion ? false : "visible"}
      whileHover={{ y: 8, boxShadow: "0 12px 24px rgba(0,0,0,0.4)" }}
      className="relative"
    >
      <Link
        href={`/feed?category=${slug}`}
        className="flex flex-col items-center justify-center gap-2 bg-toolbox-red border-2 border-chrome rounded h-24 px-4 shadow-md"
      >
        <span className="w-12 h-1.5 bg-chrome rounded" aria-hidden="true" />
        <span className="font-heading text-lg text-off-white tracking-wide text-center">
          {label}
        </span>
      </Link>
    </motion.div>
  );
}
