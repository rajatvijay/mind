"use client";

import { useSyncExternalStore } from "react";

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

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,   // client value
    () => false    // server value
  );
}

export function RelativeTime({ date }: { date: Date | null }) {
  const isClient = useIsClient();

  if (!date) return null;

  if (!isClient) {
    return <time dateTime={date.toISOString()} />;
  }

  return (
    <time dateTime={date.toISOString()} title={date.toLocaleString()}>
      {formatRelativeTime(date)}
    </time>
  );
}
