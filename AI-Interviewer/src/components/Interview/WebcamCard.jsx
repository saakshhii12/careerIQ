import { useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { Camera } from "lucide-react";
import GlassCard from "../Common/GlassCard";
const videoConstraints = { width: 640, height: 360, facingMode: "user" };
const WebcamCard = ({ cameraStatus, onStatusChange, webcamRef }) => {
  const streamRef = useRef(null);
  useEffect(() => () => { streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);
  const handleUserMedia = (stream) => {
    streamRef.current = stream;
    onStatusChange("Connected");
    stream.getVideoTracks().forEach((track) => track.addEventListener("ended", () => onStatusChange("Disconnected", { type: "CAMERA_DISCONNECTED", message: "Camera disconnected." })));
  };
  const handleError = (error) => {
    const denied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
    onStatusChange(denied ? "Permission denied" : "Error", { type: denied ? "CAMERA_PERMISSION_DENIED" : "CAMERA_DISCONNECTED", message: denied ? "Camera permission was denied." : "Camera could not be accessed." });
  };
  return <GlassCard className="space-y-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-teal-500/20 p-2"><Camera className="text-teal-300" size={20} /></div><div><p className="text-xs uppercase tracking-widest text-teal-300">Live Camera</p><h2 className="text-lg font-semibold text-white">Candidate Preview</h2></div></div><div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950"><Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} className="aspect-video w-full object-cover" onUserMedia={handleUserMedia} onUserMediaError={handleError} /></div><p className="text-sm text-slate-400">Camera: <span className="text-white">{cameraStatus}</span>. Integrity checks sample this existing camera stream.</p></GlassCard>;
};
export default WebcamCard;
