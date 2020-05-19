import React from 'react';

const NoSelect = ({ style, useDiv, className, children }) => {
  if (useDiv) {
    return (
      <div style={style} className={`no-select ${className}`}>
        {children}
      </div>
    );
  }
  return (
    <span style={style} className={`no-select ${className}`}>
      {children}
    </span>
  );
};

export default NoSelect;
