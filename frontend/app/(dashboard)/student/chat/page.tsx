"use client";

import { Topbar } from "@/components/layout/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import {
  useAssistantConversation,
  useClearAssistantConversation,
  useSendAssistantMessage,
} from "@/lib/hooks/use-assistant";

/**
 * Career Assistant — AI career guidance for the signed-in candidate.
 *
 * This is not the recruiter communication feature. Recruiter messages live at
 * /student/messages and stay locked until the candidate is shortlisted.
 */
export default function CareerAssistantPage() {
  const { data, isLoading, isError, error } = useAssistantConversation();
  const sendMutation = useSendAssistantMessage();
  const clearMutation = useClearAssistantConversation();

  const failure =
    sendMutation.error instanceof Error
      ? sendMutation.error.message
      : isError && error instanceof Error
        ? error.message
        : null;

  return (
    <>
      <Topbar
        title="Career Assistant"
        subtitle="Personalised help with your resume, skills, applications, and interviews"
      />
      <div className="flex min-h-0 flex-1 flex-col p-6">
        <GlassCard className="!p-0 flex min-h-[32rem] flex-1 flex-col overflow-hidden">
          <AssistantChat
            messages={data?.messages ?? []}
            context={data?.context}
            loading={isLoading}
            sending={sendMutation.isPending}
            resetting={clearMutation.isPending}
            errorMessage={failure}
            onSend={(text) => sendMutation.mutate(text)}
            onReset={() => clearMutation.mutate()}
          />
        </GlassCard>
      </div>
    </>
  );
}
