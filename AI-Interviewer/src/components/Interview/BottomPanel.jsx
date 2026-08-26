import { motion } from "framer-motion";

import ProgressBar from "./ProgressBar";

const BottomPanel = ({ currentQuestion, totalQuestions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-4"
    >
      <ProgressBar
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
      />
    </motion.div>
  );
};

export default BottomPanel;
