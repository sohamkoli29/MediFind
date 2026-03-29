import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = (onStockUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL);

    socketRef.current.on('stock_updated', (data) => {
      if (onStockUpdate) onStockUpdate(data);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return socketRef.current;
};

export default useSocket;