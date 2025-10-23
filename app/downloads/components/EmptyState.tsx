'use client';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
}

export default function EmptyState({
  title = 'No Downloads Available',
  description = 'There are currently no downloads available for this category.',
  actionText = 'Refresh',
  onAction,
  icon = '📁',
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <div className="text-gray-400 text-6xl mb-4">{icon}</div>
          <h3 className="text-gray-600 font-semibold mb-2 text-lg">{title}</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{description}</p>
          {onAction && (
            <button
              onClick={onAction}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {actionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
