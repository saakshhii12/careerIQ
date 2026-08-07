import React from "react";
import { motion } from "framer-motion";

import AIAnalysis from "./AIAnalysis";

const RightPanel = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 25 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full lg:w-[360px]"
    >
      <AIAnalysis />
    </motion.div>
  );
};

export default RightPanel;