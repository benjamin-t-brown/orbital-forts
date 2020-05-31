import React from 'react';

const Checkbox = ({ label, value, onChange, style, className }) => {
  return (
    <div className="menu-item">
      <div
        style={{
          display: 'flex',
          justifyContent: 'left',
          alignItems: 'center',
        }}
      >
        <input
          className={className}
          style={{
            ...(style || {}),
          }}
          type="checkbox"
          checked={value}
          onChange={onChange}
        ></input>
        <label
          onClick={onChange}
          style={{
            marginLeft: '0.5rem',
            cursor: 'default',
          }}
        >
          {label}
        </label>
      </div>
    </div>
  );
};

export default Checkbox;
