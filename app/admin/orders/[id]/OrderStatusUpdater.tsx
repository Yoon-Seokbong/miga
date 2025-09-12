'use client';

import React, { useState } from 'react';

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
}

const OrderStatusUpdater: React.FC<OrderStatusUpdaterProps> = ({ orderId, currentStatus }) => {
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleStatusUpdate = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update status');
      }
      setMessage({ type: 'success', text: '상태가 성공적으로 업데이트되었습니다.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <select 
        value={status} 
        onChange={(e) => setStatus(e.target.value)} 
        className="block w-full p-2 border border-gray-300 rounded-md"
      >
        <option value="PENDING">Pending</option>
        <option value="PAID">Paid</option>
        <option value="SHIPPED">Shipped</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <button 
        onClick={handleStatusUpdate} 
        disabled={isLoading || status === currentStatus}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
      >
        {isLoading ? '업데이트 중...' : '상태 업데이트'}
      </button>
      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};

export default OrderStatusUpdater;
