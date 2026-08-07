// src/components/Common/GlassCard.jsx

import React from 'react';
import { motion } from 'framer-motion';

/**
 * GlassCard
 *
 * A reusable glassmorphic container for enterprise SaaS / cyber-dashboard UIs.
 * Dark navy translucent background, soft blur, thin glowing teal border,
 * and an optional subtle glow-on-hover effect.
 *
 * Props:
 * @param {React.ReactNode} children - Content rendered inside the card.
 * @param {string} className - Additional classNames to merge/override styles.
 * @param {boolean} hover - Enables hover glow/lift interaction. Default: true.
 * @param {boolean} animate - Enables entrance animation (fade/slide + scale). Default: true.
 * @param {string} padding - Tailwind padding classes. Default: 'p-6'.
 * @param {string} rounded - Tailwind rounding classes. Default: 'rounded-2xl'.
 */
const GlassCard = ({
  children,
  className = '',
  hover = true,
  animate = true,
  padding = 'p-6',
  rounded = 'rounded-2xl',
  ...rest
}) => {
  const baseStyles = `
    relative
    ${rounded}
    ${padding}
    border border-teal-400/20
    bg-slate-900/40
    backdrop-blur-xl
    backdrop-saturate-150
    shadow-[0_8px_32px_rgba(0,0,0,0.35)]
    overflow-hidden
  `;

  const hoverStyles = hover
    ? `
      transition-all duration-300 ease-out
      hover:border-teal-300/50
      hover:shadow-[0_0_24px_rgba(100,210,200,0.35),0_8px_32px_rgba(0,0,0,0.4)]
      hover:-translate-y-0.5
    `
    : '';

  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 12, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
        whileHover: hover ? { scale: 1.01 } : undefined,
      }
    : {};

  return (
    <motion.div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      {...motionProps}
      {...rest}
    >
      {/* Inner highlight layer for subtle glass sheen */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.04] via-transparent to-transparent"
        aria-hidden="true"
      />

      {/* Top edge glow accent */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default GlassCard;