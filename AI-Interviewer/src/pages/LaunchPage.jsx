import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchInterviewSession } from "../services/interviewService";

/**
 * LaunchPage — bridge between the Next.js main app and the AI-Interviewer.
 *
 * When the student clicks "Start AI Interview" in the main frontend:
 *  1. The main frontend creates a session via POST /api/interviews/sessions
 *  2. Stores { careeriq_token, careeriq_session_id } in localStorage
 *  3. Redirects here (http://localhost:5173/launch)
 *
 * This page picks up those values, fetches the full session from the backend,
 * and navigates to /interview with all required state.
 */
export default function LaunchPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Loading your interview session…");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function launch() {
      const sessionId = window.localStorage.getItem("careeriq_session_id");
      const token = window.localStorage.getItem("careeriq_token");

      if (!sessionId || !token) {
        // No session context — fall back to standalone resume upload
        navigate("/resume", { replace: true });
        return;
      }

      try {
        setStatus("Fetching your personalised interview questions…");
        const data = await fetchInterviewSession(sessionId);

        // Pass questions as objects so InterviewPage can use questionId for the DB complete call.
        // InterviewPage reads question text via q.question (or q itself if string — handled below).
        const questions = data.questions.map((q) => ({
          questionId: q.questionId ?? q.question_id,
          question: q.question,
        }));

        navigate("/interview", {
          replace: true,
          state: {
            sessionId: Number(sessionId),
            questions,
            resumeText: data.resumeText ?? "",
            candidateInfo: data.candidateInfo ?? null,
            job: data.job ?? null,
            jobTitle: data.job?.jobTitle ?? data.job?.job_title ?? "",
            companyName: data.job?.companyName ?? data.job?.company_name ?? "",
          },
        });
      } catch (err) {
        setError(err.message ?? "Could not load the interview session.");
      }
    }

    launch();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center gap-6 text-white">
      <div className="text-center">
        {/* Animated logo / spinner */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-400/30 bg-teal-500/10">
          <svg
            className="h-8 w-8 animate-spin text-teal-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>

        {!error ? (
          <>
            <h1 className="text-2xl font-bold text-white">CareerIQ AI Interview</h1>
            <p className="mt-2 text-slate-400 text-sm">{status}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-red-400">Failed to load interview</h1>
            <p className="mt-2 text-slate-400 text-sm max-w-sm">{error}</p>
            <button
              onClick={() => navigate("/resume", { replace: true })}
              className="mt-6 rounded-xl border border-teal-400/40 bg-teal-500/10 px-5 py-2.5 text-sm font-semibold text-teal-300 hover:bg-teal-400/20 transition"
            >
              Go to Resume Upload
            </button>
          </>
        )}
      </div>
    </div>
  );
}
