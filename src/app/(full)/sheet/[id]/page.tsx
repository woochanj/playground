import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getSheetById } from "@/lib/queries";
import SheetGrid from "../SheetGrid";

export default async function SheetEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sheetId = Number(id);
  if (!Number.isInteger(sheetId)) notFound();

  const user = await requireUser(`/sheet/${id}`);
  const sheet = await getSheetById(sheetId);
  if (!sheet) notFound();

  return (
    <div className="flex h-[calc(100vh-52px)] flex-col px-6 py-5">
      <div className="mb-3">
        <Link
          href="/sheet"
          className="text-sm font-medium text-muted transition-colors hover:text-primary"
        >
          ← 시트 목록
        </Link>
      </div>
      <SheetGrid
        sheetId={sheet.id}
        sheetName={sheet.name}
        rows={sheet.rows}
        cols={sheet.cols}
        currentUserId={Number(user.id)}
      />
    </div>
  );
}
