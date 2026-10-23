import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import gsap from 'gsap';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { selectToasts, removeToast } from '../store/uiSlice';

function ToastItem({ toast, onDismiss }) {
  const toastRef = useRef(null);

  useEffect(() => {
    if (toastRef.current) {
      gsap.fromTo(
        toastRef.current,
        { x: 60, opacity: 0, scale: 0.9 },
        { x: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.7)' }
      );
    }

    const timer = setTimeout(() => {
      handleClose();
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (toastRef.current) {
      gsap.to(toastRef.current, {
        x: 60,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => onDismiss(toast.id),
      });
    } else {
      onDismiss(toast.id);
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-green" />;
      case 'error':
        return <AlertCircle size={18} className="text-red" />;
      default:
        return <Info size={18} className="text-cyan" />;
    }
  };

  return (
    <div
      ref={toastRef}
      className={`toast-item toast-${toast.type} glass-panel`}
    >
      <div className="toast-icon-wrap">{getIcon()}</div>
      <div className="toast-body">
        <h4 className="toast-title">{toast.title}</h4>
        {toast.message && <p className="toast-message">{toast.message}</p>}
      </div>
      <button className="toast-close-btn" onClick={handleClose}>
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const dispatch = useDispatch();
  const toasts = useSelector(selectToasts);

  const handleDismiss = (id) => {
    dispatch(removeToast(id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}
