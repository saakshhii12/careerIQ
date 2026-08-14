import React from "react";

import LeftPanel from "./LeftPanel";
import CenterPanel from "./CenterPanel";
import RightPanel from "./RightPanel";
import BottomPanel from "./BottomPanel";

const InterviewLayout = ({
  question,
  questionNumber,
  totalQuestions,
  onSubmitAnswer,
  evaluation,
  loading,
  onNextQuestion,
  metrics = {},
  recommendation = "In Progress",
  overallScore = 0,
  candidateName = "Candidate",
  targetRole = "Technical Role",
}) => {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="min-h-screen bg-[linear-gradient(rgba(100,210,200,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,210,200,0.05)_1px,transparent_1px)] bg-[size:40px_40px]">
        <div className="max-w-[1700px] mx-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold">
                Interview Studio
              </h1>
              <p className="text-slate-400 mt-1">
                AI-Powered Candidate Assessment & Live Analysis
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-emerald-400 font-semibold text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE SESSION</span>
            </div>
          </div>

          {/* 3-Column Studio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-6">
            <LeftPanel
              candidateName={candidateName}
              targetRole={targetRole}
              interviewStage={`Question ${questionNumber}/${totalQuestions}`}
            />

            <CenterPanel
              question={question}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              onSubmitAnswer={onSubmitAnswer}
              evaluation={evaluation}
              loading={loading}
              onNextQuestion={onNextQuestion}
              isLastQuestion={questionNumber === totalQuestions}
            />

            <RightPanel
              metrics={metrics}
              recommendation={recommendation}
            />
          </div>

          {/* Bottom Progress Bar */}
          <BottomPanel
            currentQuestion={questionNumber}
            totalQuestions={totalQuestions}
            overallScore={overallScore}
          />
        </div>
      </div>
    </div>
  );
};

export default InterviewLayout;