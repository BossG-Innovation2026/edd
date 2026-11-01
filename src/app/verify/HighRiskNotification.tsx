"use client";

// FR-UX-05: When a verified hazard is in the High band, show immediate notification.

import { useState } from "react";

interface HighRiskNotificationProps {
  hazardId: string;
  hazardType: string;
  zone: string;
  score: number;
  onDismiss: () => void;
}

export function HighRiskNotification({
  hazardId,
  hazardType,
  zone,
  score,
  onDismiss,
}: HighRiskNotificationProps) {
  const [sending, setSending] = useState(false);

  const handleNotifySchoolHead = async () => {
    setSending(true);
    try {
      // In a real app, this would send an email/SMS to the School Head
      // For now, we'll just show a success message
      const response = await fetch("/api/notifications/high-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hazardId }),
      });

      if (response.ok) {
        alert("School Head has been notified");
        onDismiss();
      }
    } catch (err) {
      console.error("Notification error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="high-risk-notification" role="alert">
      <div className="notification-header">
        <span className="notification-icon">⚠️</span>
        <h3 className="notification-title">High Risk Hazard Detected</h3>
        <button className="notification-close" onClick={onDismiss} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="notification-content">
        <p className="notification-message">
          <strong>{hazardType}</strong> in <strong>{zone}</strong> scored <strong>{score.toFixed(2)}</strong> (High Risk).
        </p>
        <p className="notification-detail">
          FR-UX-05: This hazard needs immediate attention. Notify the School Head immediately.
        </p>
      </div>

      <div className="notification-actions">
        <button
          className="notify-button"
          onClick={handleNotifySchoolHead}
          disabled={sending}
        >
          {sending ? "Notifying..." : "Notify School Head Immediately"}
        </button>
        <button className="dismiss-button" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
