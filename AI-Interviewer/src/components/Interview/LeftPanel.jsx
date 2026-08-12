import React from "react";
import { motion } from "framer-motion";
import Sidebar from "../Sidebar/Sidebar";

const LeftPanel = ({ candidateInfo }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -25 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full lg:w-[280px]"
    >
      <Sidebar candidateInfo={candidateInfo} />
    </motion.div>
  );
};

export default LeftPanel;