import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UploadCloud, FileText, Sparkles } from "lucide-react";

import { extractTextFromPDF } from "../../services/pdfService";
import { generateInterviewQuestions } from "../../services/interviewService";
import { parseResume } from "../../services/resumeService";

const UploadZone = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [resumeText, setResumeText] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF.");
      return;
    }

    setFileName(file.name);
    setLoading(true);

    try {
      // Step 1: Extract text from PDF
      const extracted = await extractTextFromPDF(file);
      setResumeText(extracted);

      // Step 2: Parse resume to extract candidate info
      const candidate = await parseResume(extracted);
      setCandidateInfo(candidate);

      // Step 3: Generate personalized questions
      const aiQuestions = await generateInterviewQuestions(extracted);

      console.log("AI Questions:", aiQuestions);
      console.log("Candidate Info:", candidate);

      setQuestions(aiQuestions);
    } catch (error) {
      console.error(error);
      alert(`Unable to process resume: ${error.message}`);
    }

    setLoading(false);
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
          "
        >
          Browse Resume
        </button>

        {loading && (
          <div className="mt-8 text-center">
            <div className="text-teal-300 text-lg font-semibold">
              🤖 AI is analyzing your resume...
            </div>

            <div className="mt-4 h-2 w-full rounded-full bg-slate-700 overflow-hidden">
              <div className="h-full w-full animate-pulse bg-teal-400"></div>
            </div>
          </div>
        )}

        {fileName && (
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

              <span className="text-white">
                {fileName}
              </span>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
              <Sparkles
                size={18}
                className="text-teal-300"
              />

              <span className="text-teal-300">
                Resume Ready for AI Interview
              </span>
            </div>
          </motion.div>
        )}

        {questions.length > 0 && (
          <div className="mt-8 rounded-2xl border border-teal-400/30 bg-slate-900/40 p-6">

            <h3 className="text-xl font-bold text-teal-300 mb-4">
              AI Generated {questions.length} Questions
            </h3>

            <p className="text-white leading-8">
              First Question:
            </p>

            <p className="mt-2 text-teal-300">
              {questions[0]}
            </p>

            <button
              className="mt-6 rounded-xl bg-teal-400 px-6 py-3 font-semibold text-slate-900 hover:scale-105 transition"
              onClick={() =>
                navigate("/interview", {
                  state: {
                    questions,
                    resumeText,
                    candidateInfo,
                  },
                })
              }
            >
              Start AI Interview
            </button>

          </div>
        )}

      </div>
    </motion.div>
  );
};

export default UploadZone;
