import React from 'react';

const TextInput = ({ label, value, onChange, onBlur, style, className }) => {
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
        type="text"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      ></input>
    </div>
  );
};

export default TextInput;
