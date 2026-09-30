import { motion } from "framer-motion";

import QuestionCard from "./QuestionCard";
import AnswerBox from "./AnswerBox";

const CenterPanel = ({
  question,
  questionNumber,
  totalQuestions,
  questionSecondsRemaining,
  jobTitle,
  onSubmitAnswer,
  loading,
  paused,
  sessionStatus,
  onMicStatusChange,
  forceSubmitToken,
  onPermissionActivity,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      key={questionNumber}
      className="flex flex-col gap-4"
    >
      <QuestionCard
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        secondsRemaining={questionSecondsRemaining}
        jobTitle={jobTitle}
      />

      <AnswerBox
        key={questionNumber}
        questionKey={questionNumber}
        forceSubmitToken={forceSubmitToken}
        onSubmitAnswer={onSubmitAnswer}
        loading={loading}
        paused={paused}
        disabled={sessionStatus !== "RUNNING"}
        onMicStatusChange={onMicStatusChange}
        onPermissionActivity={onPermissionActivity}
      />
    </motion.div>
  );
};

export default CenterPanel;
