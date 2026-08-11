"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";
import { ToolboxDrawer } from "@/components/ToolboxDrawer";

type Stage = "closed" | "open";

const DRAWERS = [
  { label: "PROJECTS", slug: "projects" },
  { label: "TIPS & TECHNIQUES", slug: "tips-techniques" },
  { label: "TOOL TALK", slug: "tool-talk" },
  { label: "PLANS & BLUEPRINTS", slug: "plans-blueprints" },
];

const drawersContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export function ToolboxHero() {
  const reducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<Stage>("closed");

  useEffect(() => {
    if (reducedMotion) {
      setStage("open");
    }
  }, [reducedMotion]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 px-4">
      <div className="text-center">
        <h1 className="font-heading text-6xl text-toolbox-red">THE TOOLBOX</h1>
        <p className="font-body text-lg text-off-white mt-2">
          Build Something Worth Nailing
        </p>
      </div>

      <div style={{ perspective: 1000 }} className="relative w-full max-w-md h-64">
        {stage === "closed" && (
          <motion.div
            initial={{ rotateX: 0, opacity: 1 }}
            animate={{ rotateX: -40, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            onAnimationComplete={() => setStage("open")}
            style={{ transformOrigin: "top center" }}
            className="absolute inset-0 rounded overflow-hidden"
          >
            <Image
              src="https://images.unsplash.com/photo-1581244277943-fe4a9c777540"
              alt="A closed red toolbox"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        )}

        {stage === "open" && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-toolbox-red border-2 border-chrome rounded p-6 h-full flex flex-col justify-end"
          >
            <motion.div
              variants={reducedMotion ? undefined : drawersContainerVariants}
              initial={reducedMotion ? false : "hidden"}
              animate={reducedMotion ? false : "visible"}
              className="grid grid-cols-2 gap-4"
            >
              {DRAWERS.map((drawer) => (
                <ToolboxDrawer
                  key={drawer.slug}
                  label={drawer.label}
                  slug={drawer.slug}
                  reducedMotion={reducedMotion}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
