import React from 'react';

const Slider = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
  onMouseUp,
  style,
  className,
}) => {
  return (
    <div className="menu-item">
      {label ? (
        <div
          style={{
            marginBottom: '0.5rem',
          }}
        >
          {label}
        </div>
      ) : null}
      <input
        className={className}
        style={{
          width: '100%',
          ...(style || {}),
        }}
        type="range"
        min={min}
        max={max}
        step={step || 0.25}
        value={value}
        onChange={onChange}
        onMouseUp={onMouseUp}
      ></input>
    </div>
  );
};

export default Slider;
