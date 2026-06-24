import Link from "next/link";

export default function Pagination({
  basePath,
  page,
  total,
  pageSize,
}: {
  basePath: string;
  page: number;
  total: number;
  pageSize: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  // 현재 페이지 주변 최대 5개만 노출
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const href = (p: number) => `${basePath}?page=${p}`;

  return (
    <nav className="mt-6 flex items-center justify-center gap-1 text-sm">
      <PageLink href={href(Math.max(1, page - 1))} disabled={page <= 1}>
        이전
      </PageLink>
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={
            p === page
              ? "rounded-md bg-primary px-3 py-1.5 font-medium text-white"
              : "rounded-md px-3 py-1.5 text-muted hover:bg-border/50 hover:text-foreground"
          }
        >
          {p}
        </Link>
      ))}
      <PageLink href={href(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
        다음
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-md px-3 py-1.5 text-border">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-muted hover:bg-border/50 hover:text-foreground"
    >
      {children}
    </Link>
  );
}
