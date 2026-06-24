"use client";

import { useState } from "react";
import { createSheet } from "@/app/actions/sheet";

export default function NewSheetButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        + 새 시트
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold text-foreground">새 시트 만들기</h2>
            <form action={createSheet} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-body">이름</span>
                <input
                  name="name"
                  type="text"
                  autoFocus
                  placeholder="제목 없는 시트"
                  className="rounded-lg border border-border-strong bg-surface px-3 py-2 outline-none focus:border-primary"
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  <span className="font-medium text-body">행</span>
                  <input
                    name="rows"
                    type="number"
                    defaultValue={50}
                    min={10}
                    max={500}
                    className="rounded-lg border border-border-strong bg-surface px-3 py-2 outline-none focus:border-primary"
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  <span className="font-medium text-body">열</span>
                  <input
                    name="cols"
                    type="number"
                    defaultValue={12}
                    min={5}
                    max={52}
                    className="rounded-lg border border-border-strong bg-surface px-3 py-2 outline-none focus:border-primary"
                  />
                </label>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-body transition-colors hover:bg-fill"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  만들기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
