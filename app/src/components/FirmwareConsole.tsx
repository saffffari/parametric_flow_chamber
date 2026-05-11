/**
 * FirmwareConsole — live view of the serial line stream + raw command input.
 *
 * Bench diagnostic surface. Subscribes to `serial.onLine` and shows the most
 * recent N lines as the firmware emits them; a text input sends raw commands
 * via `serial.sendRaw` so the operator can issue PING / STATUS? / JOG / etc.
 * directly without dev tools.
 *
 * Lives at the bottom of the AppShell, between ControlPanel and StatusBar,
 * collapsible via a header toggle. Off by default — when something's wrong
 * with the bench, flip it on, see firmware ground truth.
 */

import { useEffect, useRef, useState } from "react";

const MAX_LINES = 200;

interface ConsoleLine {
  id: number;
  direction: "rx" | "tx";
  text: string;
  ts: number;
}

export function FirmwareConsole({ open }: { open: boolean }) {
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [input, setInput] = useState("");
  const counterRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to firmware line stream. Mount-once, persists for the
  // component's lifetime so we don't miss messages while collapsed.
  useEffect(() => {
    const off = window.flowChamber.serial.onLine((line) => {
      counterRef.current += 1;
      const id = counterRef.current;
      setLines((prev) => {
        const next = [...prev, { id, direction: "rx" as const, text: line, ts: Date.now() }];
        return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
      });
    });
    return off;
  }, []);

  // Auto-scroll to newest line on update (only when panel is open and user
  // is already near the bottom, so we don't yank them away if they scrolled up).
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lines, open]);

  const send = async () => {
    const cmd = input.trim();
    if (!cmd) return;
    counterRef.current += 1;
    const id = counterRef.current;
    setLines((prev) => {
      const next = [...prev, { id, direction: "tx" as const, text: cmd, ts: Date.now() }];
      return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
    });
    setInput("");
    try {
      await window.flowChamber.serial.sendRaw(cmd);
    } catch (e) {
      counterRef.current += 1;
      const errId = counterRef.current;
      setLines((prev) => [
        ...prev,
        {
          id: errId,
          direction: "rx" as const,
          text: `ERR send failed: ${e instanceof Error ? e.message : String(e)}`,
          ts: Date.now(),
        },
      ]);
    }
  };

  if (!open) return null;

  return (
    <div className="flex h-56 shrink-0 flex-col border-t border-border bg-surface-raised">
      <header className="flex items-center justify-between border-b border-border px-4 py-1.5">
        <div className="font-mono text-[13px] uppercase tracking-[0.25em] text-muted/70">
          Firmware Console
        </div>
        <button
          type="button"
          onClick={() => setLines([])}
          className="font-mono text-[13px] uppercase tracking-wider text-muted/60 hover:text-foreground"
        >
          clear
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[14px] leading-snug"
      >
        {lines.length === 0 ? (
          <div className="text-muted/40">
            no lines yet — connect to the Teensy then send a command, or wait for telemetry
          </div>
        ) : (
          lines.map((l) => (
            <div key={l.id} className="flex gap-3">
              <span className="shrink-0 text-muted/40">
                {new Date(l.ts).toLocaleTimeString([], { hour12: false })}
              </span>
              <span
                className={
                  l.direction === "tx"
                    ? "shrink-0 text-accent"
                    : "shrink-0 text-muted/50"
                }
              >
                {l.direction === "tx" ? ">" : "<"}
              </span>
              <span
                className={
                  l.direction === "tx"
                    ? "text-accent"
                    : l.text.startsWith("ERR")
                      ? "text-status-fault"
                      : "text-foreground"
                }
              >
                {l.text}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border px-4 py-2">
        <span className="font-mono text-[14px] text-accent">{">"}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
          placeholder="STATUS?  /  PING  /  JOG 500 0  /  RATE 1000  /  STOP"
          className="
            flex-1 border border-border bg-surface px-2 py-1
            font-mono text-[14px] text-foreground placeholder:text-muted/40
            focus:border-accent focus:outline-none
          "
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={!input.trim()}
          className="
            rounded-sm border border-border bg-surface-overlay px-3 py-1
            font-mono text-[13px] uppercase tracking-wider text-foreground
            transition-colors hover:border-accent hover:text-accent
            disabled:cursor-not-allowed disabled:text-muted/40
          "
        >
          send
        </button>
      </div>
    </div>
  );
}
