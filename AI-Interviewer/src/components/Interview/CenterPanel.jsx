import React, { useState } from "react";
import { motion } from "framer-motion";

import QuestionCard from "./QuestionCard";
import WebcamCard from "./WebcamCard";
import AnswerBox from "./AnswerBox";

const CenterPanel = ({
  question,
  questionNumber,
  totalQuestions,
  onSubmitAnswer,
  evaluation,
  loading,
  onNextQuestion,
  isLastQuestion = false,
}) => {
  const [autoRecord, setAutoRecord] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6"
    >
      <QuestionCard
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        onSpeechEnd={() => setAutoRecord(true)}
      />

      <WebcamCard />

      <AnswerBox
        onSubmitAnswer={onSubmitAnswer}
        evaluation={evaluation}
        loading={loading}
        onNextQuestion={onNextQuestion}
        autoRecord={autoRecord}
        onAutoRecordComplete={() => setAutoRecord(false)}
        isLastQuestion={isLastQuestion}
      />
    </motion.div>
  );
};

export default CenterPanel;