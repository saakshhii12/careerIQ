import { useCallback, useEffect, useRef, useState } from "react";
import { CommitStrategy, RealtimeEvents, Scribe } from "@elevenlabs/client";
import { LoaderCircle, Mic, MicOff, RotateCcw, Send, SquarePen } from "lucide-react";
import GlassCard from "../Common/GlassCard";

const MAX_CHARACTERS = 1000;
const API_URL = "http://localhost:5000";
const VOICE_STATES = { OFF: "OFF", CONNECTING: "CONNECTING", LISTENING: "LISTENING", STOPPING: "STOPPING", ERROR: "ERROR" };

const AnswerBox = ({ onSubmitAnswer, loading, paused, disabled, onMicStatusChange }) => {
  const [answer, setAnswer] = useState("");
  const [voiceState, setVoiceState] = useState(VOICE_STATES.OFF);
  const [voiceError, setVoiceError] = useState("");
  const connectionRef = useRef(null);
  const voiceStateRef = useRef(VOICE_STATES.OFF);
  const transcriptPrefixRef = useRef("");
  const committedTranscriptRef = useRef("");
  const sessionIdRef = useRef(0);

  const setVoiceStatus = useCallback((status) => {
    voiceStateRef.current = status;
    setVoiceState(status);
    onMicStatusChange(status);
  }, [onMicStatusChange]);

  const renderTranscript = useCallback((partial = "") => {
    const prefix = transcriptPrefixRef.current;
    const text = `${committedTranscriptRef.current}${partial}`.trim();
    const separator = prefix && text && !/\s$/.test(prefix) ? " " : "";
    setAnswer(`${prefix}${separator}${text}`.slice(0, MAX_CHARACTERS));
  }, []);

  const closeConnection = useCallback(() => {
    sessionIdRef.current += 1;
    connectionRef.current?.close();
    connectionRef.current = null;
  }, []);

  const stopVoice = useCallback(() => {
    if (voiceStateRef.current === VOICE_STATES.OFF) return;
    setVoiceStatus(VOICE_STATES.STOPPING);
    closeConnection();
    setVoiceStatus(VOICE_STATES.OFF);
  }, [closeConnection, setVoiceStatus]);

  const failVoice = useCallback((message) => {
    closeConnection();
    setVoiceError(message);
    setVoiceStatus(VOICE_STATES.ERROR);
  }, [closeConnection, setVoiceStatus]);

  useEffect(() => () => stopVoice(), [stopVoice]);
  useEffect(() => { if (paused || disabled) stopVoice(); }, [disabled, paused, stopVoice]);

  const startVoice = async () => {
    if (voiceStateRef.current !== VOICE_STATES.OFF && voiceStateRef.current !== VOICE_STATES.ERROR) return;
    setVoiceError("");
    closeConnection();
    transcriptPrefixRef.current = answer;
    committedTranscriptRef.current = "";
    const sessionId = sessionIdRef.current;
    setVoiceStatus(VOICE_STATES.CONNECTING);

    try {
      const tokenResponse = await fetch(`${API_URL}/api/voice/session`, { method: "POST" });
      const tokenBody = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok || !tokenBody.token) throw new Error(tokenBody.error || "Unable to connect to voice service.");
      if (sessionId !== sessionIdRef.current) return;

      const connection = Scribe.connect({
        token: tokenBody.token,
        modelId: "scribe_v2_realtime",
        commitStrategy: CommitStrategy.VAD,
        vadSilenceThresholdSecs: 1,
        microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      connectionRef.current = connection;
      connection.on(RealtimeEvents.SESSION_STARTED, () => {
        if (sessionId === sessionIdRef.current) setVoiceStatus(VOICE_STATES.LISTENING);
      });
      connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data) => {
        if (sessionId === sessionIdRef.current) renderTranscript(data.text || "");
      });
      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data) => {
        if (sessionId !== sessionIdRef.current || !data.text) return;
        const separator = committedTranscriptRef.current && !/\s$/.test(committedTranscriptRef.current) ? " " : "";
        committedTranscriptRef.current += `${separator}${data.text}`;
        renderTranscript();
      });
      connection.on(RealtimeEvents.ERROR, (error) => {
        if (sessionId === sessionIdRef.current) failVoice(error?.message || "Transcription failed.");
      });
    } catch (error) {
      const permissionDenied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
      const deviceMissing = error?.name === "NotFoundError";
      if (sessionId === sessionIdRef.current) failVoice(permissionDenied ? "Microphone permission denied." : deviceMissing ? "No microphone device is available." : error.message || "Unable to connect to voice service.");
    }
  };

  const handleTextChange = (event) => {
    const next = event.target.value.slice(0, MAX_CHARACTERS);
    setAnswer(next);
    if (voiceStateRef.current === VOICE_STATES.LISTENING) {
      transcriptPrefixRef.current = next;
      committedTranscriptRef.current = "";
    }
  };
  const submit = () => {
    if (!answer.trim() || loading || paused || disabled) return;
    const submittedAnswer = answer.trim();
    stopVoice();
    setAnswer("");
    onSubmitAnswer(submittedAnswer);
  };
  const unavailable = loading || paused || disabled;
  const active = [VOICE_STATES.CONNECTING, VOICE_STATES.LISTENING, VOICE_STATES.STOPPING].includes(voiceState);
  const buttonLabel = voiceState === VOICE_STATES.CONNECTING ? "Connecting..." : voiceState === VOICE_STATES.LISTENING ? "Stop Microphone" : voiceState === VOICE_STATES.ERROR ? "Microphone Error" : "Microphone Start";

  return <GlassCard className="space-y-4">
    <div className="flex items-center gap-3"><div className="rounded-xl bg-teal-500/20 p-2"><SquarePen className="text-teal-300" size={20} /></div><div><p className="text-xs uppercase tracking-widest text-teal-300">Candidate Response</p><h2 className="text-lg font-semibold text-white">Your Answer</h2></div></div>
    <textarea value={answer} onChange={handleTextChange} disabled={unavailable} placeholder={paused ? "Interview paused. Resume to continue." : "Type your answer here or use the microphone..."} maxLength={MAX_CHARACTERS} className="h-36 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-slate-500 outline-none focus:border-teal-400 disabled:opacity-60" />
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-400">{answer.length}/{MAX_CHARACTERS} characters · Microphone {voiceState}</p><div className="flex gap-2">{active ? <button onClick={stopVoice} className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm text-white"><MicOff size={16} />{buttonLabel}</button> : <button onClick={startVoice} disabled={unavailable} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-60"><Mic size={16} />{buttonLabel}</button>}{voiceState === VOICE_STATES.ERROR && <button onClick={startVoice} disabled={unavailable} title="Retry voice service" className="rounded-xl border border-amber-300/50 px-3 py-2 text-sm text-amber-100"><RotateCcw size={16} /></button>}<button onClick={submit} disabled={unavailable || !answer.trim()} className="flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60">{loading ? <><LoaderCircle size={16} className="animate-spin" />Submitting</> : <><Send size={16} />Submit Answer</>}</button></div></div>
    {voiceError && <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">{voiceError} You can still type your answer.</p>}
  </GlassCard>;
};
export default AnswerBox;
