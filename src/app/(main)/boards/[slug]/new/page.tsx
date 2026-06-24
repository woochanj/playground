import { notFound } from "next/navigation";
import { getBoardBySlug } from "@/lib/queries";
import { requireUser, getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import PostForm from "./PostForm";

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);
  if (!board) notFound();

  await requireUser(`/boards/${slug}/new`);
  const user = await getCurrentUser();

  // 공지 게시판은 관리자만
  if (board.adminOnly && user?.role !== "admin") {
    redirect(`/boards/${slug}`);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-foreground">
        <span className="text-muted">#</span> {board.name}에 글쓰기
      </h1>
      <PostForm
        mode="create"
        boardId={board.id}
        cancelHref={`/boards/${slug}`}
      />
    </div>
  );
}
