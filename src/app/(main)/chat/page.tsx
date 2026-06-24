import { requireUser } from "@/lib/session";
import { getRecentChatMessages } from "@/lib/queries";
import type { ChatMessagePayload } from "@/lib/realtime-types";
import ChatRoom from "./ChatRoom";

export default async function ChatPage() {
  const user = await requireUser("/chat");
  const rows = await getRecentChatMessages(100);

  const initial: ChatMessagePayload[] = rows.map((m) => ({
    id: m.id,
    authorId: m.authorId,
    authorName: m.authorName,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return <ChatRoom currentUserId={Number(user.id)} initialMessages={initial} />;
}
