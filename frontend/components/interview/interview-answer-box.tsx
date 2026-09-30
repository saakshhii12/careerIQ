"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CommitStrategy, RealtimeEvents, Scribe } from "@elevenlabs/client";
import { LoaderCircle, Mic, MicOff, Send } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { fetchVoiceSessionToken } from "@/lib/api/interview";

const MAX_CHARACTERS = 1000;
const VOICE_STATES = {
  OFF: "OFF",
  CONNECTING: "CONNECTING",
  LISTENING: "LISTENING",
  STOPPING: "STOPPING",
  ERROR: "ERROR",
  PERMISSION_REQUIRED: "PERMISSION_REQUIRED",
  UNAVAILABLE: "UNAVAILABLE",
} as const;

type VoiceState = (typeof VOICE_STATES)[keyof typeof VOICE_STATES];

interface InterviewAnswerBoxProps {
  onSubmitAnswer: (answer: string) => void;
  loading: boolean;
  paused: boolean;
  disabled: boolean;
  onMicStatusChange: (status: string) => void;
  /** Bumps when the active question changes — clears the draft, keeps mic OFF. */
  questionKey: number;
  /** When this value changes, force-submit current draft (may be empty). */
  forceSubmitToken?: number;
  onPermissionActivity?: () => void;
}

export function InterviewAnswerBox({
  onSubmitAnswer,
  loading,
  paused,
  disabled,
  onMicStatusChange,
  questionKey,
  forceSubmitToken = 0,
  onPermissionActivity,
}: InterviewAnswerBoxProps) {
  const [answer, setAnswer] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>(VOICE_STATES.OFF);
  const [voiceError, setVoiceError] = useState("");
  const connectionRef = useRef<{ close: () => void } | null>(null);
  const voiceStateRef = useRef<VoiceState>(VOICE_STATES.OFF);
  const transcriptPrefixRef = useRef("");
  const committedTranscriptRef = useRef("");
  const sessionIdRef = useRef(0);
  const answerRef = useRef("");
  const lastForceTokenRef = useRef(forceSubmitToken);
  const submittingRef = useRef(false);

  const setVoiceStatus = useCallback(
    (status: VoiceState) => {
      voiceStateRef.current = status;
      setVoiceState(status);
      onMicStatusChange(status === VOICE_STATES.LISTENING || status === VOICE_STATES.CONNECTING ? status : "OFF");
    },
    [onMicStatusChange]
  );

  const renderTranscript = useCallback((partial = "") => {
    const prefix = transcriptPrefixRef.current;
    const text = `${committedTranscriptRef.current}${partial}`.trim();
    const separator = prefix && text && !/\s$/.test(prefix) ? " " : "";
    const next = `${prefix}${separator}${text}`.slice(0, MAX_CHARACTERS);
    answerRef.current = next;
    setAnswer(next);
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

  const failVoice = useCallback(
    (message: string, status: VoiceState = VOICE_STATES.ERROR) => {
      closeConnection();
      setVoiceError(message);
      setVoiceStatus(status);
    },
    [closeConnection, setVoiceStatus]
  );

  // New question → clear draft and ensure mic stays OFF (do not auto-restart).
  useEffect(() => {
    stopVoice();
    answerRef.current = "";
    setAnswer("");
    transcriptPrefixRef.current = "";
    committedTranscriptRef.current = "";
    setVoiceError("");
    submittingRef.current = false;
  }, [questionKey, stopVoice]);

  useEffect(() => () => stopVoice(), [stopVoice]);
  useEffect(() => {
    if (paused || disabled) stopVoice();
  }, [disabled, paused, stopVoice]);

  const submit = useCallback(
    (forced = false) => {
      if (submittingRef.current) return;
      if (!forced && (loading || paused || disabled)) return;
      if (!forced && !answerRef.current.trim()) return;
      submittingRef.current = true;
      const submittedAnswer = answerRef.current.trim();
      stopVoice();
      answerRef.current = "";
      setAnswer("");
      onSubmitAnswer(submittedAnswer);
    },
    [disabled, loading, onSubmitAnswer, paused, stopVoice]
  );

  // 30s timeout (or parent-forced) auto-submit — empty answers allowed.
  useEffect(() => {
    if (forceSubmitToken === lastForceTokenRef.current) return;
    lastForceTokenRef.current = forceSubmitToken;
    if (forceSubmitToken > 0) submit(true);
  }, [forceSubmitToken, submit]);

  const startVoice = async () => {
    if (voiceStateRef.current !== VOICE_STATES.OFF && voiceStateRef.current !== VOICE_STATES.ERROR) {
      return;
    }
    setVoiceError("");
    onPermissionActivity?.();
    closeConnection();
    transcriptPrefixRef.current = answerRef.current;
    committedTranscriptRef.current = "";
    const sessionId = sessionIdRef.current;
    setVoiceStatus(VOICE_STATES.CONNECTING);

    try {
      const token = await fetchVoiceSessionToken();
      if (sessionId !== sessionIdRef.current) return;
      onPermissionActivity?.();

      const connection = Scribe.connect({
        token,
        modelId: "scribe_v2_realtime",
        commitStrategy: CommitStrategy.VAD,
        vadSilenceThresholdSecs: 1,
        microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      connectionRef.current = connection;
      connection.on(RealtimeEvents.SESSION_STARTED, () => {
        if (sessionId === sessionIdRef.current) setVoiceStatus(VOICE_STATES.LISTENING);
      });
      connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data: { text?: string }) => {
        if (sessionId === sessionIdRef.current) renderTranscript(data.text || "");
      });
      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data: { text?: string }) => {
        if (sessionId !== sessionIdRef.current || !data.text) return;
        const separator =
          committedTranscriptRef.current && !/\s$/.test(committedTranscriptRef.current) ? " " : "";
        committedTranscriptRef.current += `${separator}${data.text}`;
        renderTranscript();
      });
      connection.on(RealtimeEvents.ERROR, (error: unknown) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : "Transcription failed.";
        if (sessionId === sessionIdRef.current) failVoice(message);
      });
    } catch (error) {
      const err = error as { name?: string; message?: string };
      const permissionDenied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      const deviceMissing = err?.name === "NotFoundError";
      onPermissionActivity?.();
      if (sessionId === sessionIdRef.current) {
        failVoice(
          permissionDenied
            ? "Microphone permission denied."
            : deviceMissing
              ? "No microphone device is available."
              : err.message || "Unable to connect to voice service.",
          permissionDenied
            ? VOICE_STATES.PERMISSION_REQUIRED
            : deviceMissing
              ? VOICE_STATES.UNAVAILABLE
              : VOICE_STATES.ERROR
        );
      }
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value.slice(0, MAX_CHARACTERS);
    answerRef.current = next;
    setAnswer(next);
    if (voiceStateRef.current === VOICE_STATES.LISTENING) {
      transcriptPrefixRef.current = next;
      committedTranscriptRef.current = "";
    }
  };

  const unavailable = loading || paused || disabled;
  const listening = voiceState === VOICE_STATES.LISTENING || voiceState === VOICE_STATES.CONNECTING;

  return (
    <GlassCard className="space-y-3 !p-4">
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">Your answer</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Type your response or use the microphone. Mic stays off until you turn it on.
        </p>
      </div>
      <textarea
        value={answer}
        onChange={handleTextChange}
        disabled={unavailable}
        placeholder={paused ? "Interview paused. Resume to continue." : "Enter your answer here…"}
        maxLength={MAX_CHARACTERS}
        className="min-h-[120px] w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] disabled:opacity-60"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          {answer.length}/{MAX_CHARACTERS} · Microphone {voiceState.toLowerCase().replaceAll("_", " ")}
        </p>
        <div className="flex gap-2">
          {listening ? (
            <Button type="button" variant="secondary" size="sm" onClick={stopVoice}>
              <MicOff size={14} /> Stop
            </Button>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={startVoice} disabled={unavailable}>
              <Mic size={14} /> Microphone
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={() => submit(false)}
            disabled={unavailable || !answer.trim()}
          >
            {loading ? (
              <>
                <LoaderCircle size={14} className="animate-spin" /> Submitting
              </>
            ) : (
              <>
                <Send size={14} /> Submit answer
              </>
            )}
          </Button>
        </div>
      </div>
      {voiceError && (
        <p className="rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-2 text-xs text-[var(--color-warning)]">
          {voiceError} You can continue with typed answers.
        </p>
      )}
    </GlassCard>
  );
}
