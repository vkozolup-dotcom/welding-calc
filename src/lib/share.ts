/** Share to system sheet / WhatsApp, with clipboard fallback. */

export type ShareOutcome = "shared" | "opened" | "copied" | "cancelled" | "failed";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export async function shareOrSendText(
  text: string,
  title?: string,
): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: title || "Quote", text });
      return "shared";
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") return "cancelled";
      // Fall through to WhatsApp / clipboard
    }
  }

  try {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) return "opened";
  } catch {
    /* ignore */
  }

  const ok = await copyText(text);
  return ok ? "copied" : "failed";
}
