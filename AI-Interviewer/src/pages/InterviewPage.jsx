import React, { useState } from "react";
import { useLocation } from "react-router-dom";

import InterviewLayout from "../components/Interview/InterviewLayout";
import { evaluateAnswer } from "../services/evaluationService";

const InterviewPage = () => {
  const location = useLocation();

  const allQuestions = location.state?.questions || [];
  const resumeText = location.state?.resumeText || "";
  const candidateInfo = location.state?.candidateInfo || null;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnswerSubmit = async (answer) => {
    try {
      setLoading(true);

      const result = await evaluateAnswer(
        allQuestions[currentQuestionIndex],
        answer,
        resumeText
      );

      setEvaluation(result);
      setAnswers((prev) => [...prev, answer]);
      setEvaluations((prev) => [...prev, result]);
    } catch (error) {
      console.error("Interview evaluation failed:", error);
      alert(error.message || "Unable to evaluate the answer right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setEvaluation(null);

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      alert("🎉 Interview Completed!");
      console.log("Questions:", allQuestions);
      console.log("Answers:", answers);
    }
  };

  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220] text-white text-2xl">
        No interview questions found.
      </div>
    );
  }

  return (
    <InterviewLayout
      question={allQuestions[currentQuestionIndex]}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={allQuestions.length}
      onSubmitAnswer={handleAnswerSubmit}
      evaluation={evaluation}
      loading={loading}
      onNextQuestion={handleNextQuestion}
      candidateInfo={candidateInfo}
      completedAnswers={answers.length}
      evaluations={evaluations}
    />
  );
};

export default InterviewPage;
