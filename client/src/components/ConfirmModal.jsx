import "./ConfirmModal.css";

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn--cancel" onClick={onCancel}>Annulla</button>
          <button className="confirm-btn confirm-btn--ok" onClick={onConfirm}>Conferma</button>
        </div>
      </div>
    </div>
  );
}
