"use client";

import { Topbar } from "@/components/layout/topbar";
import { LearningRoadmap } from "@/components/dashboard/learning-roadmap";

export default function StudentRoadmapPage() {
  return (
    <>
      <Topbar
        title="Roadmap"
        subtitle="Improve your skills based on assessments you didn't pass"
      />
      <div className="flex-1 p-6 md:p-8">
        <LearningRoadmap />
      </div>
    </>
  );
}
