import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  BarChart3,
  Trophy,
} from "lucide-react";

import GlassCard from "../Common/GlassCard";

const ProgressBar = ({
  currentQuestion = 3,
  totalQuestions = 10,
  overallScore = 86,
}) => {
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <GlassCard>

        {/* Header */}

        <div className="flex justify-between items-center mb-6">

          <div>

            <p className="text-xs uppercase tracking-widest text-teal-300">

              Interview Progress

            </p>

            <h2 className="text-xl font-semibold text-white">

              Session Overview

            </h2>

          </div>

          <BarChart3
            className="text-teal-300"
            size={24}
          />

        </div>

        {/* Progress */}

        <div className="mb-6">

          <div className="flex justify-between text-sm mb-2">

            <span className="text-slate-400">

              Progress

            </span>

            <span className="text-white">

              {Math.round(progress)}%

            </span>

          </div>

          <div className="h-3 rounded-full bg-white/10 overflow-hidden">

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-300"
            />

          </div>

        </div>

        {/* Statistics */}

        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">

            <div className="flex items-center gap-2 mb-2">

              <CheckCircle2
                className="text-teal-300"
                size={18}
              />

              <span className="text-sm text-slate-400">

                Questions

              </span>

            </div>

            <h3 className="text-2xl font-bold text-white">

              {currentQuestion}/{totalQuestions}

            </h3>

          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">

            <div className="flex items-center gap-2 mb-2">

              <Trophy
                className="text-yellow-300"
                size={18}
              />

              <span className="text-sm text-slate-400">

                Overall Score

              </span>

            </div>

            <h3 className="text-2xl font-bold text-white">

              {overallScore}%

            </h3>

          </div>

        </div>

      </GlassCard>
    </motion.div>
  );
};

export default ProgressBar;