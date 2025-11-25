import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { setupDatabase, closeDatabase } from './config/database';
import { cleanupExpiredSessions } from './services/auth.service';

// Routes
import authRoutes from './routes/auth.routes';
import serverRoutes from './routes/server.routes';
import channelRoutes from './routes/channel.routes';
import messageRoutes from './routes/message.routes';
import aiRoutes from './routes/ai.routes';
import sseRoutes from './routes/sse.routes';
import discoveryRoutes from './routes/discovery.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:4321',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Quorum API',
    version: '0.1.0',
    status: 'running',
    endpoints: {
      auth: '/auth',
      servers: '/servers',
      discovery: '/discovery',
      channels: '/channels',
      messages: '/messages',
      ai: '/ai-members',
    },
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/servers', serverRoutes);
app.use('/discovery', discoveryRoutes);
app.use('/', channelRoutes); // Includes /servers/:serverId/channels and /channels/:id
app.use('/', messageRoutes); // Includes /channels/:channelId/messages and /messages/:id
app.use('/', aiRoutes); // Includes /channels/:channelId/ai-members and /ai-members/:id
app.use('/', sseRoutes); // SSE real-time endpoints

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Initialize database and start server
async function start() {
  try {
    // Setup database
    const pool = await setupDatabase();
    
    // Store pool in app.locals for route access
    app.locals.pool = pool;

    // Clean up expired sessions on startup
    await cleanupExpiredSessions();

    // Clean up expired sessions every hour
    setInterval(() => {
      cleanupExpiredSessions();
    }, 60 * 60 * 1000);

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Quorum API server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

// Start the server
start();

export default app;

