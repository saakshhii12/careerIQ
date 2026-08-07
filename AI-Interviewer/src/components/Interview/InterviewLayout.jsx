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
}) => {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="min-h-screen bg-[linear-gradient(rgba(100,210,200,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,210,200,0.05)_1px,transparent_1px)] bg-[size:40px_40px]">

        <div className="max-w-[1700px] mx-auto p-6">

          <div className="flex justify-between items-center mb-8">

            <div>
              <h1 className="text-4xl font-bold">
                Interview Studio
              </h1>

              <p className="text-slate-400">
                AI Powered Candidate Assessment
              </p>
            </div>

            <div className="text-green-400 font-semibold">
              LIVE SESSION
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-6">

            <LeftPanel />

            <CenterPanel
              question={question}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              onSubmitAnswer={onSubmitAnswer}
              evaluation={evaluation}
              loading={loading}
              onNextQuestion={onNextQuestion}
            />

            <RightPanel />

          </div>

          <BottomPanel />

        </div>

      </div>
    </div>
  );
};

export default InterviewLayout;