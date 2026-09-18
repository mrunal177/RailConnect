import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

const ErrorState = ({
  title = 'Something went wrong',
  message = 'An error occurred while communicating with the RailConnect servers.',
  onRetry
}) => {
  return (
    <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6 border border-rose-500/20 bg-rose-950/20">
      <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/20">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-rose-200/80 max-w-xs mb-5">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
