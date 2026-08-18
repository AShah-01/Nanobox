import { useEffect, useRef, useState } from "react";
import "./TimePickerWheel.css";

interface TimePickerWheelProps {
  label: string;
  value: number;
  onChange: (minutes: number) => void;
  min?: number;
  max?: number;
}

export function TimePickerWheel({ label, value, onChange, min = 1, max = 120 }: TimePickerWheelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startValueRef = useRef(value);

  const handleWheelChange = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const newValue = Math.max(min, Math.min(max, value + delta));
    onChange(newValue);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
  };

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      const delta = Math.round((startYRef.current - e.clientY) / 10);
      const newValue = Math.max(min, Math.min(max, startValueRef.current + delta));
      onChange(newValue);
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, min, max, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed)) {
      const newValue = Math.max(min, Math.min(max, parsed));
      onChange(newValue);
      setInputValue(newValue.toString());
    } else {
      setInputValue(value.toString());
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
    } else if (e.key === "Escape") {
      setInputValue(value.toString());
      setIsEditing(false);
    }
  };

  return (
    <div className="time-picker-wheel">
      <span className="time-picker-wheel__label">{label}</span>
      <div
        className={`time-picker-wheel__dial ${isDragging ? "is-dragging" : ""}`}
        ref={wheelRef}
        onWheel={handleWheelChange}
        onMouseDown={handleMouseDown}
      >
        <span className="time-picker-wheel__tick" />
        <div className="time-picker-wheel__value">
          {isEditing ? (
            <input
              type="number"
              className="time-picker-wheel__input"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              autoFocus
              min={min}
              max={max}
            />
          ) : (
            <span onClick={() => setIsEditing(true)} className="time-picker-wheel__display">
              {value}
            </span>
          )}
          <span className="time-picker-wheel__unit">min</span>
        </div>
      </div>
    </div>
  );
}
