import React from "react";
import { motion } from "framer-motion";
import {
  User,
  Briefcase,
  FileText,
  Camera,
  Mic,
  TimerReset,
  CheckCircle2,
} from "lucide-react";

import GlassCard from "../Common/GlassCard";

const Sidebar = ({
  candidateInfo = null,
  interviewStage = "Technical Round",
  cameraStatus = "Connected",
  micStatus = "Connected",
  interviewTime = "18:45",
}) => {
  const candidateName = candidateInfo?.candidateName || "Not available";
  const targetRole = candidateInfo?.targetRole || "Not available";
  const resumeScore = "N/A";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      {/* Candidate */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <User className="text-teal-300" />
          <div>
            <p className="text-xs uppercase tracking-widest text-teal-300">
              Candidate
            </p>
            <h2 className="text-lg font-semibold text-white">
              {candidateName}
            </h2>
          </div>
        </div>

        <div className="space-y-4">

          <div className="flex justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Briefcase size={17} />
              Target Role
            </div>

            <span className="font-medium text-white">
              {targetRole}
            </span>
          </div>

          <div className="flex justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <FileText size={17} />
              Resume Score
            </div>

            <span className="text-teal-300 font-semibold">
              {resumeScore}
            </span>
          </div>

        </div>
      </GlassCard>

      {/* Live Status */}
      <GlassCard>

        <h3 className="mb-5 text-sm uppercase tracking-widest text-teal-300">
          Live Status
        </h3>

        <div className="space-y-4">

          <div className="flex justify-between">

            <div className="flex items-center gap-2">
              <Camera size={18} />
              Camera
            </div>

            <span className="text-green-400">
              {cameraStatus}
            </span>

          </div>

          <div className="flex justify-between">

            <div className="flex items-center gap-2">
              <Mic size={18} />
              Microphone
            </div>

            <span className="text-green-400">
              {micStatus}
            </span>

          </div>

          <div className="flex justify-between">

            <div className="flex items-center gap-2">
              <TimerReset size={18} />
              Timer
            </div>

            <span className="text-white">
              {interviewTime}
            </span>

          </div>

        </div>

      </GlassCard>

      {/* Interview Stage */}

      <GlassCard>

        <h3 className="mb-5 text-sm uppercase tracking-widest text-teal-300">
          Current Stage
        </h3>

        <div className="flex items-center gap-3">

          <CheckCircle2
            className="text-teal-300"
            size={20}
          />

          <p className="text-white font-medium">
            {interviewStage}
          </p>

        </div>

      </GlassCard>

    </motion.div>
  );
};

export default Sidebar;