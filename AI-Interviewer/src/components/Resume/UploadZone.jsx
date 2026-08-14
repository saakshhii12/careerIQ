import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UploadCloud, FileText, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

import { extractTextFromPDF } from "../../services/pdfService";
import { generateInterviewQuestions } from "../../services/interviewService";

const UploadZone = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setErrorMessage("Please upload a valid PDF document.");
      return;
    }

    setErrorMessage("");
    setFileName(file.name);
    setLoading(true);
    setQuestions([]);

    try {
      const resumeText = await extractTextFromPDF(file);

      if (!resumeText || resumeText.trim().length < 15) {
        throw new Error("Could not extract readable text from this PDF. Please try a text-based resume PDF.");
      }

      const aiQuestions = await generateInterviewQuestions(resumeText);

      console.log("AI Generated Questions:", aiQuestions);
      setQuestions(aiQuestions);
    } catch (error) {
      console.error("Resume Processing Error:", error);
      setErrorMessage(error.message || "Unable to process resume. Please ensure your Gemini API key is configured.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      <div
        className="
          rounded-3xl
          border-2
          border-dashed
          border-teal-400/30
          bg-white/5
          backdrop-blur-xl
          p-12
          text-center
          transition-all
          hover:border-teal-400
          hover:bg-white/10
        "
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
        >
          <UploadCloud
            size={70}
            className="mx-auto text-teal-300"
          />
        </motion.div>

        <h2 className="mt-8 text-3xl font-bold text-white">
          Upload Resume
        </h2>

        <p className="mt-4 text-slate-400">
          Upload your PDF resume to begin your personalized AI interview.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileInputRef.current.click()}
          disabled={loading}
          className="
            mt-10
            rounded-xl
            bg-teal-400
            px-8
            py-4
            font-semibold
            text-slate-900
            transition
            hover:scale-105
            disabled:opacity-50
            cursor-pointer
          "
        >
          {loading ? "Analyzing Resume..." : "Browse Resume"}
        </button>

        {loading && (
          <div className="mt-8 text-center">
            <div className="text-teal-300 text-lg font-semibold flex items-center justify-center gap-2">
              <Sparkles className="animate-spin text-teal-300" size={20} />
              AI is analyzing your resume & crafting personalized questions...
            </div>

            <div className="mt-4 h-2 w-full rounded-full bg-slate-700 overflow-hidden">
              <div className="h-full w-full animate-pulse bg-teal-400"></div>
            </div>
          </div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-left text-red-200"
          >
            <AlertCircle className="text-red-400 shrink-0" size={24} />
            <div>
              <p className="font-semibold text-red-300">Resume Analysis Notice</p>
              <p className="text-sm text-red-200/90 mt-1">{errorMessage}</p>
            </div>
          </motion.div>
        )}

        {fileName && !errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="
              mt-10
              rounded-2xl
              border
              border-teal-400/20
              bg-teal-500/10
              p-5
            "
          >
            <div className="flex items-center justify-center gap-3">
              <FileText className="text-teal-300" />
              <span className="text-white font-medium">
                {fileName}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <Sparkles
                size={18}
                className="text-teal-300"
              />
              <span className="text-teal-300 font-medium">
                Resume Analyzed for AI Interview
              </span>
            </div>
          </motion.div>
        )}

        {questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl border border-teal-400/30 bg-slate-900/60 p-6 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-teal-300 flex items-center gap-2">
                <Sparkles size={20} />
                AI Generated {questions.length} Personalized Questions
              </h3>
              <span className="text-xs bg-teal-400/20 text-teal-300 px-3 py-1 rounded-full font-medium">
                Tailored to Resume
              </span>
            </div>

            <div className="rounded-xl bg-white/5 p-4 border border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                First Question Preview:
              </p>
              <p className="mt-2 text-white font-medium leading-relaxed">
                {questions[0]}
              </p>
            </div>

            <button
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-6 py-4 font-semibold text-slate-900 hover:scale-[1.02] transition cursor-pointer"
              onClick={() =>
                navigate("/interview", {
                  state: {
                    questions,
                    fileName,
                  },
                })
              }
            >
              <span>Start AI Interview Session</span>
              <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default UploadZone;