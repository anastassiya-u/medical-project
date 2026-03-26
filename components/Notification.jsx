/**
 * Styled Notification Component
 * Replaces browser alert() with elegant notifications
 */

'use client';

import { useState, useEffect } from 'react';

export default function Notification({ message, type = 'info', duration = 4000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for fade out
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    info: 'bg-blue-50 border-blue-500 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
    error: 'bg-red-50 border-red-500 text-red-900',
    success: 'bg-green-50 border-green-500 text-green-900',
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div
        className={`${styles[type]} border-l-4 rounded-lg shadow-lg p-4 max-w-md flex items-start gap-3`}
      >
        <span className="text-2xl">{icons[type]}</span>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="text-gray-500 hover:text-gray-700 text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Hook for easy notification management
export function useNotification() {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info', duration = 4000) => {
    setNotification({ message, type, duration });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showNotification,
    clearNotification,
    NotificationComponent: notification ? (
      <Notification
        message={notification.message}
        type={notification.type}
        duration={notification.duration}
        onClose={clearNotification}
      />
    ) : null,
  };
}
