"use client"

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { gatewayAPI, transformGatewayRealm } from './api'

interface Realm {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'degraded'
  capabilities: string[]
  servicesCount: number
  agentsCount: number
  activeLoops: number
  eventsPerMinute: number
  lastHeartbeat: string
  latency: number
}

interface LoopExecution {
  id: string
  name: string
  type: 'aggregation' | 'voting' | 'bidding' | 'consensus' | 'workflow'
  status: 'recruiting' | 'executing' | 'aggregating' | 'completed' | 'failed'
  initiator: string
  participants: string[]
  startTime: string
  progress: number
}

interface WebSocketContextType {
  realms: Realm[]
  loops: LoopExecution[]
  loading: boolean
  error: string | null
  refreshRealms: () => Promise<void>
  isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [realms, setRealms] = useState<Realm[]>([])
  const [loops, setLoops] = useState<LoopExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const mountedRef = useRef(true)
  const connectionIdRef = useRef(Math.random().toString(36).substr(2, 9))

  console.log(`🔧 [WebSocketProvider] Provider initialized with ID: ${connectionIdRef.current}`)

  const refreshRealms = async () => {
    console.log(`🔧 [${connectionIdRef.current}] refreshRealms called, mounted: ${mountedRef.current}`)
    try {
      setLoading(true)
      setError(null)

      const gatewayRealms = await gatewayAPI.getRealms()

      if (!mountedRef.current) {
        console.log(`🔧 [${connectionIdRef.current}] refreshRealms aborted - component unmounted`)
        return
      }

      const transformedRealms = gatewayRealms.map(transformGatewayRealm)
      setRealms(transformedRealms)
      console.log(`🔧 [${connectionIdRef.current}] refreshRealms completed, ${transformedRealms.length} realms`)
    } catch (err) {
      if (!mountedRef.current) return

      console.error(`🔧 [${connectionIdRef.current}] Failed to fetch realms:`, err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
      setRealms([])
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const setupWebSocket = () => {
    const wsId = Math.random().toString(36).substr(2, 9)
    console.log(`🔧 [${connectionIdRef.current}] setupWebSocket called, wsId: ${wsId}`)

    try {
      // Close existing connection if any
      if (wsRef.current) {
        console.log(`🔧 [${connectionIdRef.current}] Closing existing WebSocket connection`)
        wsRef.current.close()
      }

      console.log(`🔧 [${connectionIdRef.current}] Creating new WebSocket connection`)
      wsRef.current = gatewayAPI.createWebSocket()

      wsRef.current.onopen = () => {
        console.log(`🔌 [${connectionIdRef.current}] Connected to gateway WebSocket (wsId: ${wsId})`)
        setIsConnected(true)
        setError(null)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          switch (message.type) {
            case 'initial-state':
              console.log(`🔧 [${connectionIdRef.current}] Received initial-state message`)
              if (mountedRef.current && message.payload.realms) {
                const transformedRealms = message.payload.realms.map(transformGatewayRealm)
                setRealms(transformedRealms)
                setLoading(false)
                console.log(`🔧 [${connectionIdRef.current}] Set initial realms: ${transformedRealms.length}`)
              }
              break

            case 'realm-connected':
              console.log(`🔧 [${connectionIdRef.current}] Received realm-connected: ${message.payload.realmId}`)
              if (mountedRef.current) {
                setRealms(prev => {
                  const updated = [...prev]
                  const existingIndex = updated.findIndex(r => r.id === message.payload.realmId)
                  const newRealm = transformGatewayRealm({
                    id: message.payload.realmId,
                    status: 'connected',
                    services: message.payload.services || [],
                    capabilities: message.payload.capabilities || [],
                    connectedAt: message.payload.connectedAt
                  })

                  if (existingIndex >= 0) {
                    updated[existingIndex] = newRealm
                  } else {
                    updated.push(newRealm)
                  }
                  console.log(`🔧 [${connectionIdRef.current}] Updated realms, total: ${updated.length}`)
                  return updated
                })
              }
              break

            case 'realm-disconnected':
              console.log(`🔧 [${connectionIdRef.current}] Received realm-disconnected: ${message.payload.realmId}`)
              if (mountedRef.current) {
                setRealms(prev => prev.filter(r => r.id !== message.payload.realmId))
              }
              break

            case 'loop-started':
              console.log(`🔧 [${connectionIdRef.current}] Loop started:`, message.payload)
              if (mountedRef.current) {
                const newLoop: LoopExecution = {
                  id: message.payload.loopId,
                  name: message.payload.loopName,
                  type: message.payload.type || 'aggregation',
                  status: 'recruiting',
                  initiator: message.payload.initiator,
                  participants: [],
                  startTime: new Date().toISOString(),
                  progress: 10
                }
                setLoops(prev => [...prev, newLoop])
              }
              break

            case 'loop-recruitment-complete':
              console.log(`🔧 [${connectionIdRef.current}] Loop recruitment complete:`, message.payload)
              if (mountedRef.current) {
                setLoops(prev => prev.map(loop =>
                  loop.id === message.payload.loopId
                    ? { ...loop, status: 'executing', participants: message.payload.participants || [], progress: 50 }
                    : loop
                ))
              }
              break

            case 'loop-complete':
              console.log(`🔧 [${connectionIdRef.current}] Loop complete:`, message.payload)
              if (mountedRef.current) {
                setLoops(prev => prev.map(loop =>
                  loop.id === message.payload.loopId
                    ? { ...loop, status: 'completed', progress: 100 }
                    : loop
                ))

                // Remove completed loops after 10 seconds
                setTimeout(() => {
                  if (mountedRef.current) {
                    setLoops(prev => prev.filter(loop => loop.id !== message.payload.loopId))
                  }
                }, 10000)
              }
              break
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error(`🔧 [${connectionIdRef.current}] WebSocket error (wsId: ${wsId}):`, error)
        setError('WebSocket connection error')
        setIsConnected(false)
      }

      wsRef.current.onclose = (event) => {
        console.log(`🔌 [${connectionIdRef.current}] WebSocket connection closed (wsId: ${wsId})`, {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          mounted: mountedRef.current
        })
        setIsConnected(false)

        // Reconnect after 5 seconds if still mounted
        if (mountedRef.current) {
          console.log(`🔧 [${connectionIdRef.current}] Scheduling reconnection in 5 seconds`)
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log(`🔄 [${connectionIdRef.current}] Attempting to reconnect WebSocket...`)
              setupWebSocket()
            } else {
              console.log(`🔧 [${connectionIdRef.current}] Skipping reconnect - component unmounted`)
            }
          }, 5000)
        } else {
          console.log(`🔧 [${connectionIdRef.current}] Not scheduling reconnect - component unmounted`)
        }
      }
    } catch (err) {
      console.error('Failed to setup WebSocket:', err)
      setError('Failed to connect to gateway')
      setIsConnected(false)

      // Fall back to polling
      const interval = setInterval(() => {
        if (mountedRef.current) {
          refreshRealms()
        } else {
          clearInterval(interval)
        }
      }, 10000)
    }
  }

  useEffect(() => {
    console.log(`🔧 [${connectionIdRef.current}] useEffect mounting, setting mounted=true`)
    mountedRef.current = true

    // Initial fetch
    refreshRealms().then(() => {
      if (mountedRef.current) {
        console.log(`🔧 [${connectionIdRef.current}] Initial fetch complete, setting up WebSocket`)
        setupWebSocket()
      } else {
        console.log(`🔧 [${connectionIdRef.current}] Component unmounted before WebSocket setup`)
      }
    })

    return () => {
      console.log(`🔧 [${connectionIdRef.current}] useEffect cleanup called, setting mounted=false`)
      mountedRef.current = false

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        console.log(`🔧 [${connectionIdRef.current}] Clearing reconnect timeout`)
        clearTimeout(reconnectTimeoutRef.current)
      }

      // Close WebSocket connection
      if (wsRef.current) {
        console.log(`🔧 [${connectionIdRef.current}] Closing WebSocket in cleanup`)
        wsRef.current.close()
      }
    }
  }, [])

  const value: WebSocketContextType = {
    realms,
    loops,
    loading,
    error,
    refreshRealms,
    isConnected
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}