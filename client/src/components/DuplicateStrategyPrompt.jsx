import "./DuplicateStrategyPrompt.css";

export default function DuplicateStrategyPrompt({ count, onChoose }) {
  return (
    <div className="dup-prompt">
      <p className="dup-prompt-text">
        Trovati <strong>{count}</strong> libri con ISBN già presenti nel catalogo. Come procedere?
      </p>
      <div className="dup-prompt-actions">
        <button className="dup-prompt-btn dup-prompt-btn--skip" onClick={() => onChoose("skip")}>
          Salta duplicati
        </button>
        <button className="dup-prompt-btn dup-prompt-btn--update" onClick={() => onChoose("update")}>
          Aggiorna esistenti
        </button>
      </div>
    </div>
  );
}
