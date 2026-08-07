import React from "react";
import { motion } from "framer-motion";

import ProgressBar from "./ProgressBar";

const BottomPanel = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-6"
    >
      <ProgressBar />
    </motion.div>
  );
};

export default BottomPanel;