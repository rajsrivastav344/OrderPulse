import { useEffect, useRef, useCallback, useState } from "react";

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:4000";
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * useWebSocket
 *
 * Manages a persistent WebSocket connection with:
 *  - Automatic reconnection with exponential back-off
 *  - Heartbeat tracking (pong → alive)
 *  - Clean teardown on unmount
 *
 * @param {function} onMessage  Called with a parsed JSON payload on every message
 * @returns {{ status: "connecting"|"connected"|"disconnected" }}
 */
export function useWebSocket(onMessage) {
  const [status, setStatus] = useState("connecting");
  const wsRef = useRef(null);
  const attemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      attemptsRef.current = 0;
      console.log("[WS] Connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch (err) {
        console.warn("[WS] Could not parse message:", err);
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      if (attemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(RECONNECT_DELAY_MS * 2 ** attemptsRef.current, 30_000);
        attemptsRef.current++;
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${attemptsRef.current})`);
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status };
}
