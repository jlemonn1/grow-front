import './ShortcutButtons.css';

interface ShortcutButtonsProps {
  shortcuts: number[];
  onShortcutClick: (value: number) => void;
  formatValue?: (value: number) => string;
  isDisabled?: (value: number) => boolean;
  getTitle?: (value: number) => string;
  activeValue?: number;
}

export function ShortcutButtons({
  shortcuts,
  onShortcutClick,
  formatValue = (v) => v.toString(),
  isDisabled,
  getTitle,
  activeValue,
}: ShortcutButtonsProps) {
  return (
    <div className="shortcut-buttons">
      {shortcuts.map((shortcut) => {
        const isActive = activeValue !== undefined && Math.abs(activeValue - shortcut) < 0.01;
        return (
          <button
            key={shortcut}
            type="button"
            className={`shortcut-button ${isActive ? 'shortcut-button-active' : ''}`}
            onClick={() => onShortcutClick(shortcut)}
            disabled={isDisabled ? isDisabled(shortcut) : false}
            title={getTitle ? getTitle(shortcut) : formatValue(shortcut)}
          >
            {formatValue(shortcut)}
          </button>
        );
      })}
    </div>
  );
}
