import { motion } from "framer-motion";
import WebcamCard from "./WebcamCard";
import AIAnalysis from "./AIAnalysis";
const RightPanel = ({ evaluation, cameraStatus, onCameraStatusChange, webcamRef }) => <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 lg:sticky lg:top-4 lg:self-start"><WebcamCard webcamRef={webcamRef} cameraStatus={cameraStatus} onStatusChange={onCameraStatusChange} /><AIAnalysis evaluation={evaluation} /></motion.div>;
export default RightPanel;
