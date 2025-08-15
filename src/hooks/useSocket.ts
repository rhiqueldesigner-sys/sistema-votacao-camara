"use client"

import { useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
      transports: ["websocket", "polling"],
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const joinBill = (billId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join-bill", billId)
    }
  }

  const leaveBill = (billId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("leave-bill", billId)
    }
  }

  const onVoteUpdate = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on("vote-update", callback)
    }
  }

  const onBillStatusUpdate = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on("bill-status-update", callback)
    }
  }

  const offVoteUpdate = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off("vote-update", callback)
    }
  }

  const offBillStatusUpdate = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off("bill-status-update", callback)
    }
  }

  return {
    socket: socketRef.current,
    joinBill,
    leaveBill,
    onVoteUpdate,
    onBillStatusUpdate,
    offVoteUpdate,
    offBillStatusUpdate,
  }
}