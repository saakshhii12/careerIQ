import { createContext, useCallback, useContext, useState } from "react";

const SESSION_KEY = "careeriq_resume_text";

const ResumeContext = createContext({
  resumeText: "",
  setResumeText: () => {},
  clearResumeText: () => {},
});

export function ResumeProvider({ children }) {
  const [resumeText, setResumeTextState] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) || "";
    } catch {
      return "";
    }
  });

  const setResumeText = useCallback((text) => {
    setResumeTextState(text);
    try {
      if (text) {
        sessionStorage.setItem(SESSION_KEY, text);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // sessionStorage unavailable (private browsing, quota exceeded) — silently ignore
    }
  }, []);

  const clearResumeText = useCallback(() => {
    setResumeText("");
  }, [setResumeText]);

  return (
    <ResumeContext.Provider value={{ resumeText, setResumeText, clearResumeText }}>
      {children}
    </ResumeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useResume() {
  return useContext(ResumeContext);
}

export default ResumeContext;
