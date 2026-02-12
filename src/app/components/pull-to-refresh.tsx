"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 80;
const MAX_PULL = 150;

export function PullToRefresh() {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const isStandalone =
    typeof window !== "undefined" &&
    ((navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (refreshing) return;
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    },
    [refreshing]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || refreshing) return;
      if (window.scrollY > 0) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }

      const distance = Math.min(
        Math.max(0, e.touches[0].clientY - startY.current),
        MAX_PULL
      );

      if (distance > 0) {
        e.preventDefault();
        setPullDistance(distance);
      }
    },
    [refreshing]
  );

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      router.refresh();
      // Give the server component time to revalidate
      await new Promise((r) => setTimeout(r, 800));
      setRefreshing(false);
    }

    setPullDistance(0);
  }, [pullDistance, router]);

  useEffect(() => {
    if (!isStandalone) return;

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isStandalone, onTouchStart, onTouchMove, onTouchEnd]);

  if (!isStandalone) return null;

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const visible = pullDistance > 0 || refreshing;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex justify-center"
      style={{
        transform: `translateY(${pullDistance - 40}px)`,
        opacity: visible ? progress : 0,
        transition: pulling.current ? "none" : "transform 0.3s, opacity 0.3s",
      }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 shadow-lg">
        <svg
          className="h-5 w-5 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          style={{
            transform: refreshing
              ? "none"
              : `rotate(${progress * 360}deg)`,
            transition: pulling.current ? "none" : "transform 0.3s",
            animation: refreshing ? "spin 0.8s linear infinite" : "none",
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
          />
        </svg>
      </div>
    </div>
  );
}
