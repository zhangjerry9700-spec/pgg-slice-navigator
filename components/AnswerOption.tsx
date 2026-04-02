interface AnswerOptionProps {
  label: string;
  selected: boolean;
  correct: boolean;
  showResult: boolean;
  onClick: () => void;
}

export default function AnswerOption({
  label,
  selected,
  correct,
  showResult,
  onClick,
}: AnswerOptionProps) {
  let className =
    'w-full text-left px-4 py-3 sm:py-4 rounded-md border transition-colors cursor-pointer touch-manipulation min-h-[48px] flex items-center ';

  if (showResult) {
    if (correct) {
      className += 'border-[var(--success-text)] bg-[var(--success-bg)] text-[var(--success-text)]';
    } else if (selected) {
      className += 'border-[var(--error-text)] bg-[var(--error-bg)] text-[var(--error-text)]';
    } else {
      className += 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)]';
    }
  } else {
    className += selected
      ? 'border-[var(--text-primary)] bg-[var(--background)] text-[var(--text-primary)]'
      : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--background)]';
  }

  return (
    <button className={className} onClick={onClick} disabled={showResult}>
      {label}
    </button>
  );
}
