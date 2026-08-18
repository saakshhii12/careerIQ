"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative z-10 mx-auto max-w-3xl px-6 pb-10 pt-16 text-center sm:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.08] px-3.5 py-1.5 text-[11.5px] text-accent"
      >
        <Sparkles size={13} />
        Website help assistant · online now
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="text-3xl font-semibold leading-tight text-white sm:text-4xl"
      >
        Ask the <span className="text-accent text-glow">CareerIQ Assistant</span> anything
        about the platform
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted"
      >
        It can walk you through uploading a resume, finding your analysis, navigating
        recruiter search, and everything else about using the site — not analyzing your
        resume itself.
      </motion.p>
    </section>
  );
}

export default Hero;
