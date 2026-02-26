import { useEffect, useRef, useState, useCallback } from 'react'

interface WSMessage {
  type: string
  data: unknown
  timestamp: string
}

export function useWebSocket(path: string, enabled = true) {
  const [messages, setMessages] = useState<WSMessage[]>([])
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!enabled) return
    const token = localStorage.getItem('token')
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws${path}?token=${token}`
    
    setStatus('connecting')
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setStatus('connected')
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WSMessage
        setMessages((prev) => [...prev.slice(-200), msg])
      } catch {/* ignore */}
    }
    ws.onclose = () => {
      setStatus('disconnected')
      reconnectTimeout.current = setTimeout(connect, 3000)
    }
    ws.onerror = () => ws.close()
  }, [path, enabled])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const clear = useCallback(() => setMessages([]), [])

  return { messages, status, send, clear }
}
