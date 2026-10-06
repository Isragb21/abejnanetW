import React from "react";
import "./PageNotice.css";

export default function PageNotice({ children, type = "error", onRetry, retryLabel }) {
  return (
    <div className={`page-notice page-notice-${type}`} role={type === "error" ? "alert" : "status"}>
      <span>{children}</span>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
