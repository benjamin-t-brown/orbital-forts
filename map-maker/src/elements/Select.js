import React from 'react';

const Select = ({ onChange, value, items, label }) => {
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
      <select
        style={{
          width: '100%',
        }}
        onChange={onChange}
        value={value}
      >
        {items.map(({ name, value }, i) => {
          return (
            <option value={value} key={i}>
              {name}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default Select;
