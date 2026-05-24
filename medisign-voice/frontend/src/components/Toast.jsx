export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`} onClick={() => onDismiss(toast.id)}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
