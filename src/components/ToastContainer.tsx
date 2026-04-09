import type { Toast } from '../hooks/useToast';

const icons: Record<Toast['type'], string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};

const colors: Record<Toast['type'], string> = {
  success: 'border-green-500/40 bg-green-950/80',
  error: 'border-red-500/40 bg-red-950/80',
  info: 'border-yellow-500/40 bg-yellow-950/80',
};

const iconColors: Record<Toast['type'], string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-yellow-400',
};

export default function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 left-0 right-0 flex flex-col items-center gap-2 px-4 pointer-events-none" style={{ zIndex: 100 }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl max-w-sm w-full cursor-pointer ${colors[toast.type]}`}
          style={{ animation: 'slideDown 0.3s ease-out' }}
        >
          <span
            className={`material-symbols-outlined ${iconColors[toast.type]}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icons[toast.type]}
          </span>
          <span className="text-white text-sm font-bold flex-1">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
