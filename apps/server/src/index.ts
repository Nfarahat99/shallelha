import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { healthRouter } from './routes/health'
import { adminRouter } from './routes/admin'
import { aiPackRouter } from './routes/ai-pack'
import { packsRouter } from './routes/packs'
import { setupSocketHandlers } from './socket'

const FRONTEND_URL = process.env.FRONTEND_URL
if (!FRONTEND_URL) {
  // In development, allow localhost. In production this must be set.
  console.warn('[WARN] FRONTEND_URL is not set — CORS will reject non-localhost requests')
}

const app = express()
const httpServer = createServer(app)

const io = new SocketServer(httpServer, {
  cors: {
    origin: FRONTEND_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'], // Force WebSocket — Railway has no sticky sessions
  connectionStateRecovery: {
    // Allow clients to reconnect and recover missed events within 10s
    maxDisconnectionDuration: 10_000,
    skipMiddlewares: true,
  },
})

// Security + parsing middleware
app.use(helmet())
app.use(cors({
  origin: FRONTEND_URL ?? 'http://localhost:3000',
}))
app.use(cookieParser())
app.use(express.json())

// Routes
app.use('/health', healthRouter)
app.use('/admin', adminRouter)
app.use('/ai', aiPackRouter)
app.use('/packs', packsRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Global error handler — never expose stack traces in production
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR] Express:', err.message)
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  res.status(500).json({ error: message })
})

// Socket.io handlers
setupSocketHandlers(io)

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err)
  process.exit(1)
})
process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] Unhandled promise rejection:', reason)
})

const PORT = Number(process.env.PORT) || 4000
httpServer.listen(PORT, () => {
  console.log(`[INFO] Server listening on port ${PORT}`)
})

export { httpServer }
