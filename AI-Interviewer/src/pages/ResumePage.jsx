import React from "react";
import UploadZone from "../components/Resume/UploadZone";

const ResumePage = () => {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">

      {/* Grid Background */}

      <div className="min-h-screen bg-[linear-gradient(rgba(100,210,200,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,210,200,0.05)_1px,transparent_1px)] bg-[size:40px_40px]">

        <div className="max-w-6xl mx-auto px-6 py-20">

          <div className="text-center mb-16">

            <h1 className="text-5xl font-bold">

              AI Interview Studio

            </h1>

            <p className="text-slate-400 mt-4">

              Upload your resume and let AI prepare your personalized interview.

            </p>

          </div>

          <UploadZone />

        </div>

      </div>

    </div>
  );
};

export default ResumePage;