"use client";

import { authClient } from "@/lib/auth-client";
import { generateApiToken } from "./actions";
import { useState } from "react";

export function SignOutButton() {
  return (
    <button
      onClick={() =>
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => window.location.replace("/login"),
          },
        })
      }
      className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
    >
      Sign out
    </button>
  );
}

export function GenerateTokenSection() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const t = await generateApiToken();
      setToken(t);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">
        iOS Shortcut Setup
      </h2>
      <p className="mb-3 text-xs text-gray-500">
        Generate a token, then create an Apple Shortcut that POSTs to{" "}
        <code className="text-gray-400">/api/save</code> with header{" "}
        <code className="text-gray-400">
          Authorization: Bearer &lt;token&gt;
        </code>
        .
      </p>
      {token ? (
        <div className="rounded-lg border border-yellow-700 bg-yellow-950 p-3">
          <p className="mb-1 text-xs font-medium text-yellow-400">
            Copy this token now — it won&apos;t be shown again:
          </p>
          <code className="block break-all text-sm text-yellow-200">
            {token}
          </code>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate API Token"}
        </button>
      )}
    </section>
  );
}
