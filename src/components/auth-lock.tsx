"use client";

import { useState, useTransition } from "react";
import { Lock, Unlock } from "lucide-react";
import { login, logout } from "@/app/auth/actions";
import { useRouter } from "next/navigation";

export function AuthLock({ isParent }: { isParent: boolean }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleUnlockClick() {
    if (isParent) {
      startTransition(async () => {
        await logout();
        router.refresh();
      });
    } else {
      setOpen(true);
      setPassword("");
      setError("");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await login(password);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error || "密码错误");
      }
    });
  }

  return (
    <>
      <button
        onClick={handleUnlockClick}
        className="text-muted-foreground hover:text-primary transition-colors"
        aria-label={isParent ? "退出管理模式" : "进入管理模式"}
      >
        {isParent ? (
          <Unlock className="size-[18px]" />
        ) : (
          <Lock className="size-[18px]" />
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-background border border-border rounded-lg p-6 w-72 flex flex-col gap-4 shadow-xl"
          >
            <h2 className="text-sm font-medium text-foreground text-center">
              输入管理密码
            </h2>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="密码"
              className="h-9 w-full rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 h-8 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isPending || !password}
                className="flex-1 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/80 transition-colors disabled:opacity-50"
              >
                {isPending ? "验证中..." : "确认"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
