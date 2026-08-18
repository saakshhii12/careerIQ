interface ChatErrorProps {
  message: string;
}

export function ChatError({ message }: ChatErrorProps) {
  return <div className="relative z-10 px-4 pb-2 text-[11px] text-red-300">{message}</div>;
}

export default ChatError;
