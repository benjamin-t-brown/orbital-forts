import React from 'react';
import { getColorStyles } from 'theme';

const Button = ({
  style,
  onClick,
  children,
  margin,
  type,
  disabled,
  className,
}) => {
  let colorStyles = {};
  if (type === 'primary') {
    colorStyles = {};
  } else if (type === 'secondary') {
    colorStyles = getColorStyles('blue');
  }
  return (
    <button
      className={
        'button' +
        (type ? ' button-' + type : '') +
        (className ? ' ' + className : '')
      }
      disabled={disabled ? true : undefined}
      style={{ display: 'inline-block', margin, ...colorStyles, ...style }}
      onMouseDown={ev => {
        ev.stopPropagation();
        ev.preventDefault();
      }}
      onClick={ev => {
        ev.stopPropagation();
        ev.preventDefault();
        if (onClick) {
          onClick(ev);
        }
      }}
    >
      <span className="no-select">{children}</span>
    </button>
  );
};

export default Button;
