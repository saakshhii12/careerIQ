import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, CheckCircle, RotateCcw, Sparkles, Star, BrainCircuit, ArrowLeft } from "lucide-react";

import InterviewLayout from "../components/Interview/InterviewLayout";
import GlassCard from "../components/Common/GlassCard";
import { evaluateAnswer } from "../services/evaluationService";

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const allQuestions = location.state?.questions || [];
  const fileName = location.state?.fileName || "Resume.pdf";

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Dynamic live metrics derived from evaluations
  const [liveMetrics, setLiveMetrics] = useState({
    technical: 85,
    communication: 80,
    confidence: 85,
    problemSolving: 75,
  });
  const [recommendation, setRecommendation] = useState("Live Assessment");

  const handleAnswerSubmit = async (answer) => {
    setLoading(true);

    const result = await evaluateAnswer(
      allQuestions[currentQuestionIndex],
      answer
    );

    setLoading(false);
    setCurrentEvaluation(result);

    setAnswers((prev) => [...prev, answer]);
    setEvaluations((prev) => [...prev, result]);

    // Update live metrics
    if (result.metrics) {
      setLiveMetrics(result.metrics);
    }
    if (result.recommendation) {
      setRecommendation(result.recommendation);
    }
  };

  const handleNextQuestion = () => {
    setCurrentEvaluation(null);

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Calculate overall score percentage
  const calculateOverallScore = () => {
    if (evaluations.length === 0) return 85;
    const totalScore = evaluations.reduce((sum, ev) => sum + (ev.score || 0), 0);
    const avgScore = totalScore / evaluations.length; // 0-10
    return Math.round(avgScore * 10); // convert to 0-100%
  };

  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full text-center space-y-6">
          <GlassCard className="p-8 space-y-6">
            <div className="rounded-full bg-teal-500/20 p-4 w-16 h-16 mx-auto flex items-center justify-center">
              <BrainCircuit className="text-teal-300" size={32} />
            </div>
            <h2 className="text-2xl font-bold">No Active Interview Session</h2>
            <p className="text-slate-400 text-sm">
              Please upload your resume to generate customized AI technical questions before starting an interview.
            </p>
            <button
              onClick={() => navigate("/resume")}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-6 py-3.5 font-semibold text-slate-900 hover:scale-105 transition cursor-pointer"
            >
              <ArrowLeft size={18} />
              <span>Upload Resume</span>
            </button>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Interview Completed Summary View
  if (isCompleted) {
    const finalScore = calculateOverallScore();
    return (
      <div className="min-h-screen bg-[#0B1220] text-white p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard className="p-8 md:p-12 text-center space-y-6">
              <div className="inline-flex rounded-full bg-teal-500/20 p-5 mb-2">
                <Trophy className="text-yellow-300" size={48} />
              </div>

              <h1 className="text-4xl font-bold">
                🎉 Interview Completed!
              </h1>

              <p className="text-slate-300 text-lg max-w-xl mx-auto">
                Great job! You have completed all {allQuestions.length} interview questions. Here is your AI assessment summary.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm text-slate-400 uppercase tracking-wider">Overall Score</p>
                  <p className="text-4xl font-bold text-teal-300 mt-2">{finalScore}%</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm text-slate-400 uppercase tracking-wider">Questions Answered</p>
                  <p className="text-4xl font-bold text-white mt-2">{evaluations.length}/{allQuestions.length}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-sm text-slate-400 uppercase tracking-wider">Recommendation</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-2">{recommendation}</p>
                </div>
              </div>

              {/* Question Breakdown List */}
              <div className="text-left space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-xl font-bold text-teal-300 flex items-center gap-2">
                  <Sparkles size={20} />
                  Question & Feedback Breakdown
                </h3>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {allQuestions.map((q, idx) => {
                    const ev = evaluations[idx];
                    const ans = answers[idx];
                    return (
                      <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-teal-300 text-sm">Question {idx + 1}</span>
                          {ev && (
                            <span className="text-xs bg-teal-400/20 text-teal-300 px-2.5 py-1 rounded-full font-semibold">
                              ⭐ {ev.score}/10
                            </span>
                          )}
                        </div>
                        <p className="text-white text-sm font-medium">{q}</p>
                        {ans && (
                          <p className="text-slate-400 text-xs italic">
                            Your answer: "{ans}"
                          </p>
                        )}
                        {ev && (
                          <p className="text-slate-300 text-xs">
                            <strong className="text-slate-200">Feedback:</strong> {ev.feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => navigate("/resume")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-8 py-4 font-semibold text-slate-900 hover:scale-105 transition mx-auto cursor-pointer"
                >
                  <RotateCcw size={18} />
                  <span>Start New AI Interview</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <InterviewLayout
      question={allQuestions[currentQuestionIndex]}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={allQuestions.length}
      onSubmitAnswer={handleAnswerSubmit}
      evaluation={currentEvaluation}
      loading={loading}
      onNextQuestion={handleNextQuestion}
      metrics={liveMetrics}
      recommendation={recommendation}
      overallScore={calculateOverallScore()}
      candidateName="Candidate"
      targetRole="Technical Candidate"
    />
  );
};

export default InterviewPage;