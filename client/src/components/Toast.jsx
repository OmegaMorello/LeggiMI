import { useState, useEffect, useCallback } from "react";
import "./Toast.css";

export default function Toast({ message, type = "success", onClose }) {
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(dismiss, 3500);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <div className={`toast toast--${type} ${exiting ? "toast--exit" : ""}`}>
      <span className="toast-icon">{type === "success" ? "✓" : "✕"}</span>
      <span className="toast-msg">{message}</span>
      <button className="toast-close" onClick={dismiss} aria-label="Chiudi">×</button>
    </div>
  );
}
