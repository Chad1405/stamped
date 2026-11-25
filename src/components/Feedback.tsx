"use client";
// The footer's feedback link: a small form in a native dialog. What the player was looking at goes along with it, so a bug report can be found.
import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import { getTheme } from "@/lib/client/theme";

export function Feedback({ context }: { context: Record<string, string | number> }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState(""), [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle"), [error, setError] = useState("");
  const open = () => { setState("idle"); setError(""); dlg.current?.showModal(); };
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending"); setError("");
    try {
      await api.feedback(message, email, { ...context, look: getTheme(), size: `${innerWidth}x${innerHeight}` });
      setState("sent"); setMessage(""); setEmail("");
    } catch (err) { setState("idle"); setError(err instanceof ApiError ? err.message : "That didn't send. Try again in a moment."); }
  };
  return (
    <>
      <button className="linkish" type="button" onClick={open}>Feedback</button>
      <dialog ref={dlg} className="card feedback" aria-labelledby="fb-title" onClick={e => { if (e.target === dlg.current) dlg.current.close(); }}>
        {state === "sent" ? (
          <div className="fb-body">
            <h2 id="fb-title">Thanks, it’s with us</h2>
            <p>We read every message. If you left your email, we may write back.</p>
            <button className="btn btn--gold" type="button" onClick={() => dlg.current?.close()}>Close</button>
          </div>
        ) : (
          <form className="fb-body" onSubmit={send}>
            <h2 id="fb-title">Send us feedback</h2>
            <label htmlFor="fb-msg">A bug, an idea, a stop you thought was unfair: anything.</label>
            <textarea id="fb-msg" className="input" rows={5} maxLength={1000} required minLength={3} value={message} onChange={e => setMessage(e.target.value)} />
            <label htmlFor="fb-email">Your email, only if you’d like a reply</label>
            <input id="fb-email" className="input" type="email" autoComplete="email" maxLength={200} value={email} onChange={e => setEmail(e.target.value)} />
            <p className="small">We also note which flight and screen you were on, and your browser, so we can find a bug. <a href="/privacy">Privacy</a></p>
            {error && <p className="help is-error" role="alert">{error}</p>}
            <div className="fb-actions">
              <button className="btn btn--gold" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send"}</button>
              <button className="btn" type="button" onClick={() => dlg.current?.close()}>Cancel</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
