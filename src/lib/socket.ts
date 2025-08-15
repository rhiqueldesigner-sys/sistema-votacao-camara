import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join bill-specific rooms for real-time updates
    socket.on('join-bill', (billId: string) => {
      socket.join(`bill-${billId}`);
      console.log(`Client ${socket.id} joined bill ${billId}`);
    });

    // Leave bill-specific rooms
    socket.on('leave-bill', (billId: string) => {
      socket.leave(`bill-${billId}`);
      console.log(`Client ${socket.id} left bill ${billId}`);
    });

    // Handle new vote event
    socket.on('new-vote', (data: { billId: string; vote: any }) => {
      // Broadcast to all clients in the bill room
      io.to(`bill-${data.billId}`).emit('vote-update', {
        billId: data.billId,
        vote: data.vote,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle bill status update
    socket.on('bill-update', (data: { billId: string; status: string }) => {
      // Broadcast to all clients
      io.emit('bill-status-update', {
        billId: data.billId,
        status: data.status,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Connected to Voting System WebSocket!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};