"use client";

import { useState, useEffect } from "react";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const DIVISIONS: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, name: "seconds" },
  { amount: 60, name: "minutes" },
  { amount: 24, name: "hours" },
  { amount: 7, name: "days" },
  { amount: 4.34524, name: "weeks" },
  { amount: 12, name: "months" },
  { amount: Number.POSITIVE_INFINITY, name: "years" },
];

function formatRelativeTime(date: Date): string {
  let duration = (date.getTime() - Date.now()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.name);
    }
    duration /= division.amount;
  }
  return rtf.format(Math.round(duration), "years");
}

export function RelativeTime({ date }: { date: Date | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!date) return null;

  // Avoid hydration mismatch: render nothing on server,
  // then show relative time after client mount
  if (!mounted) {
    return <time dateTime={date.toISOString()} />;
  }

  return (
    <time dateTime={date.toISOString()} title={date.toLocaleString()}>
      {formatRelativeTime(date)}
    </time>
  );
}
