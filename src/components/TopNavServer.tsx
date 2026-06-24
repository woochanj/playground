import { getCurrentUser } from "@/lib/session";
import { getUnreadNotificationCount } from "@/lib/queries";
import TopNav from "./TopNav";

export default async function TopNavServer() {
  const user = await getCurrentUser();
  const unread = user ? await getUnreadNotificationCount(Number(user.id)) : 0;

  return (
    <TopNav
      user={user ? { name: user.name ?? "사용자", role: user.role } : null}
      unread={unread}
    />
  );
}
