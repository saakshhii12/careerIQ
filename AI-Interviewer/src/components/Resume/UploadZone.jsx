import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UploadCloud, FileText, Sparkles } from "lucide-react";

import { extractTextFromPDF } from "../../services/pdfService";
import { generateInterviewQuestions } from "../../services/interviewService";
import { parseResume } from "../../services/resumeService";
import { useResume } from "../../context/ResumeContext";

const UploadZone = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { setResumeText: setContextResumeText } = useResume();

  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const generateQuestions = async (text) => {
    setQuestionError("");
    setLoading(true);

    try {
      const aiQuestions = await generateInterviewQuestions(text);
      setQuestions(aiQuestions);
    } catch (error) {
      console.error("Qwen question generation failed:", error);
      setQuestions([]);
      setQuestionError(
        error.message || "Qwen could not generate personalized questions. Please retry."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF.");
      return;
    }

    setFileName(file.name);
    setQuestions([]);
    setQuestionError("");
    setUploadError("");
    setCandidateInfo(null);
    setLoading(true);

    let extracted;
    try {
      extracted = await extractTextFromPDF(file);
      if (!extracted.trim()) {
        throw new Error(
          "No selectable text was found in this PDF. Upload a text-based resume, not a scanned image."
        );
      }
      setResumeText(extracted);
      // Share resume text with the global context so the chat page can use it
      setContextResumeText(extracted);
    } catch (error) {
      console.error(error);
      setUploadError(
        error.message || "The PDF could not be read. Please choose another resume file."
      );
      setLoading(false);
      return;
    }

    // Candidate details are supplementary. A temporary API failure here must not
    // prevent Qwen from generating questions from the extracted resume text.
    try {
      const candidate = await parseResume(extracted);
      setCandidateInfo(candidate);
    } catch (error) {
      console.warn("Candidate profile parsing failed:", error);
    }

    setLoading(false);
    await generateQuestions(extracted);
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

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                className="rounded-xl bg-teal-400 px-6 py-3 font-semibold text-slate-900 hover:scale-105 transition"
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

              <button
                className="rounded-xl border border-teal-400/50 px-6 py-3 font-semibold text-teal-300 hover:bg-teal-400/10 transition"
                onClick={() => navigate("/chat")}
              >
                💬 AI Career Chat
              </button>
            </div>

          </div>
        )}

        {questionError && (
          <div className="mt-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-6 text-left">
            <p className="font-semibold text-red-200">Personalized question generation failed</p>
            <p className="mt-2 text-sm text-red-100">{questionError}</p>
            <button
              onClick={() => generateQuestions(resumeText)}
              disabled={loading || !resumeText}
              className="mt-4 rounded-xl border border-red-300/50 px-5 py-2 font-semibold text-red-100 transition hover:bg-red-400/10 disabled:opacity-60"
            >
              Retry Qwen
            </button>
          </div>
        )}

        {uploadError && (
          <div className="mt-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-6 text-left">
            <p className="font-semibold text-red-200">Unable to read this resume</p>
            <p className="mt-2 text-sm text-red-100">{uploadError}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 rounded-xl border border-red-300/50 px-5 py-2 font-semibold text-red-100 transition hover:bg-red-400/10"
            >
              Choose another PDF
            </button>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default UploadZone;
