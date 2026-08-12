import React, { useRef } from "react";
import Webcam from "react-webcam";
import { Camera } from "lucide-react";
import GlassCard from "../Common/GlassCard";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

const WebcamCard = () => {
  const webcamRef = useRef(null);

  return (
    <GlassCard>
      <div className="flex items-center gap-4 mb-5">
        <div className="rounded-xl bg-teal-500/20 p-3">
          <Camera className="text-teal-300" size={24} />
        </div>

        <div>
          <p className="text-sm uppercase tracking-widest text-teal-300">
            Live Camera
          </p>

          <h2 className="text-2xl font-bold text-white">
            Candidate Preview
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Camera preview is enabled here. Video-based confidence scoring is not wired up yet.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
              <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="w-full"
        onUserMedia={() => {
          console.log("✅ Camera started");
        }}
        onUserMediaError={(err) => {
          console.error("❌ Camera Error:", err);
        }}
      />
      </div>
    </GlassCard>
  );
};

export default WebcamCard;
