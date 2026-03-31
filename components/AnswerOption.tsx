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
    'w-full text-left px-4 py-3 rounded-md border transition-colors cursor-pointer ';

  if (showResult) {
    if (correct) {
      className += 'border-green-500 bg-green-50 text-green-900';
    } else if (selected) {
      className += 'border-red-500 bg-red-50 text-red-900';
    } else {
      className += 'border-gray-300 bg-white text-gray-700';
    }
  } else {
    className += selected
      ? 'border-gray-800 bg-gray-100 text-gray-900'
      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
  }

  return (
    <button className={className} onClick={onClick} disabled={showResult}>
      {label}
    </button>
  );
}
