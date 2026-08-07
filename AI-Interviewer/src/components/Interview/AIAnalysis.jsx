import React from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Code2,
  MessageSquare,
  ShieldCheck,
  Lightbulb,
  BadgeCheck,
} from "lucide-react";

import GlassCard from "../Common/GlassCard";

const Metric = ({ icon: Icon, label, value }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">

        <div className="flex items-center gap-2">
          <Icon size={16} className="text-teal-300" />
          <span className="text-sm text-slate-300">
            {label}
          </span>
        </div>

        <span className="text-white font-semibold">
          {value}%
        </span>

      </div>

      <div className="h-2 rounded-full bg-white/10 overflow-hidden">

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1 }}
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-300"
        />

      </div>
    </div>
  );
};

const AIAnalysis = ({
  technical = 88,
  communication = 82,
  confidence = 91,
  problemSolving = 86,
  recommendation = "Strong Candidate",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 25 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard className="space-y-6">

        {/* Header */}

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-teal-500/20 p-3">

            <BrainCircuit
              className="text-teal-300"
              size={22}
            />

          </div>

          <div>

            <p className="text-xs uppercase tracking-widest text-teal-300">
              AI Evaluation
            </p>

            <h2 className="text-xl font-semibold text-white">
              Live Analysis
            </h2>

          </div>

        </div>

        <Metric
          icon={Code2}
          label="Technical Skills"
          value={technical}
        />

        <Metric
          icon={MessageSquare}
          label="Communication"
          value={communication}
        />

        <Metric
          icon={ShieldCheck}
          label="Confidence"
          value={confidence}
        />

        <Metric
          icon={Lightbulb}
          label="Problem Solving"
          value={problemSolving}
        />

        {/* Recommendation */}

        <div className="rounded-xl border border-teal-400/20 bg-teal-500/10 p-4">

          <div className="flex items-center gap-2 mb-2">

            <BadgeCheck
              className="text-teal-300"
              size={20}
            />

            <span className="text-sm uppercase tracking-wider text-teal-300">
              Recommendation
            </span>

          </div>

          <h3 className="text-lg font-semibold text-white">
            {recommendation}
          </h3>

        </div>

      </GlassCard>
    </motion.div>
  );
};

export default AIAnalysis;