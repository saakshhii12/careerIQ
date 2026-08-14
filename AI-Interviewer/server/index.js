import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import interviewRoutes from './routes/interviewRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Body parsing middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', interviewRoutes);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.url}` });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Interviewer Backend Server is running on http://localhost:${PORT}`);
});
