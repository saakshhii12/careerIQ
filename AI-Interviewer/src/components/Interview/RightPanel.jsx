import React from "react";
import { motion } from "framer-motion";

import AIAnalysis from "./AIAnalysis";

const RightPanel = ({ metrics = {}, recommendation }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 25 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full lg:w-[360px]"
    >
      <AIAnalysis
        technical={metrics.technical ?? 85}
        communication={metrics.communication ?? 80}
        confidence={metrics.confidence ?? 85}
        problemSolving={metrics.problemSolving ?? 75}
        recommendation={recommendation ?? "Evaluating..."}
      />
    </motion.div>
  );
};

export default RightPanel;