"use client";

import { useRef, useState, type ReactNode } from "react";

type SwipeableProps = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  leftColor?: string;
  rightColor?: string;
  threshold?: number;
  children: ReactNode;
};

export function Swipeable({
  onSwipeLeft,
  onSwipeRight,
  leftLabel = "Delete",
  rightLabel = "Read",
  leftColor = "bg-red-600",
  rightColor = "bg-green-600",
  threshold = 120,
  children,
}: SwipeableProps) {
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setSwiping(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping) return;

    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Determine direction on first significant movement
    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    // Only handle horizontal swipes
    if (!isHorizontal.current) return;

    // Limit swipe to directions that have handlers
    if (dx < 0 && !onSwipeLeft) return;
    if (dx > 0 && !onSwipeRight) return;

    // Apply elastic resistance past threshold
    const resistance = Math.abs(dx) > threshold ? 0.3 : 1;
    const bounded =
      Math.abs(dx) > threshold
        ? Math.sign(dx) * (threshold + (Math.abs(dx) - threshold) * resistance)
        : dx;

    setOffset(bounded);
  }

  function handleTouchEnd() {
    if (Math.abs(offset) > threshold) {
      if (offset < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (offset > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
    setOffset(0);
    setSwiping(false);
    isHorizontal.current = null;
  }

  const showLeft = offset < -20;
  const showRight = offset > 20;
  const progress = Math.min(Math.abs(offset) / threshold, 1);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background action indicators */}
      {showLeft && (
        <div
          className={`absolute inset-y-0 right-0 flex items-center justify-end px-4 ${leftColor} transition-opacity`}
          style={{ width: `${Math.abs(offset)}px`, opacity: progress }}
        >
          <span className="text-xs font-medium text-white">{leftLabel}</span>
        </div>
      )}
      {showRight && (
        <div
          className={`absolute inset-y-0 left-0 flex items-center px-4 ${rightColor} transition-opacity`}
          style={{ width: `${offset}px`, opacity: progress }}
        >
          <span className="text-xs font-medium text-white">{rightLabel}</span>
        </div>
      )}

      {/* Swipeable content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
