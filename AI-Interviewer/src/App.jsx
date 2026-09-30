import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ResumePage from "./pages/ResumePage";
import InterviewPage from "./pages/InterviewPage";
import ChatPage from "./pages/ChatPage";
import LaunchPage from "./pages/LaunchPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default → resume upload (standalone mode) */}
        <Route path="/" element={<Navigate to="/resume" replace />} />
        <Route path="/resume" element={<ResumePage />} />

        {/* Entry point when redirected from the main CareerIQ frontend after quiz pass */}
        <Route path="/launch" element={<LaunchPage />} />

        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;