'use client';

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
}

export default function ErrorState({
  title = 'Failed to Load Downloads',
  message = 'There was an error loading the downloads. Please try again.',
  actionText = 'Try Again',
  onAction,
  icon = '⚠️',
}: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <div className="text-red-600 text-6xl mb-4">{icon}</div>
          <h3 className="text-red-800 font-semibold mb-2 text-lg">{title}</h3>
          <p className="text-red-700 text-sm mb-6 leading-relaxed">{message}</p>
          {onAction && (
            <button
              onClick={onAction}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {actionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
