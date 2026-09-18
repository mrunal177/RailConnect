import React from 'react';
import { Train, SearchX } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = SearchX,
  title = 'No results found',
  description = 'We could not find any records matching your search criteria.',
  actionText,
  onAction
}) => {
  return (
    <div className="glass-panel rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6 border border-white/10">
      <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4 border border-cyan-500/20">
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-xs mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
