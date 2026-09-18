import React from 'react';

const Card = ({ children, title, subtitle, action, className = '', headerClass = '', ...props }) => {
  return (
    <div className={`glass-panel rounded-2xl p-5 shadow-xl ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div className={`flex items-center justify-between mb-4 border-b border-white/5 pb-3 ${headerClass}`}>
          <div>
            {title && <h3 className="text-lg font-bold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
