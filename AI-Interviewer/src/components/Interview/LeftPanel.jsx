import React from "react";
import { motion } from "framer-motion";
import Sidebar from "../Sidebar/Sidebar";

const LeftPanel = ({
  candidateName = "Candidate",
  targetRole = "Software Engineer",
  interviewStage = "Technical Round",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -25 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full lg:w-[280px]"
    >
      <Sidebar
        candidateName={candidateName}
        targetRole={targetRole}
        interviewStage={interviewStage}
      />
    </motion.div>
  );
};

export default LeftPanel;