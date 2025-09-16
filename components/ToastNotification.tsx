// components/ToastNotification.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 3000); // Hide after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-md shadow-lg text-white flex items-center space-x-2 ${bgColor} transition-opacity duration-300`}>
      <Icon className="h-5 w-5" />
      <span>{message}</span>
      <button onClick={() => { setIsVisible(false); onClose(); }} className="ml-2 text-white opacity-75 hover:opacity-100">
        &times;
      </button>
    </div>
  );
};

export default ToastNotification;
