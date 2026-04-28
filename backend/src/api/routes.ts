import { Router } from 'express';
import schedulesRouter from './schedules';
import participantsRouter from './participants';
import shareRouter from './share';
import analyticsRouter from './analytics';

export function setupRoutes(): Router {
  const router = Router();

  // API根路径信息
  router.get('/', (req, res) => {
    res.json({
      name: 'EasySchedule API',
      version: '1.0.0',
      endpoints: {
        schedules: '/api/schedules',
        participants: '/api/participants',
        share: '/api/share',
        analytics: '/api/analytics',
      },
      health: '/health',
    });
  });

  // API路由
  router.use('/schedules', schedulesRouter);
  router.use('/participants', participantsRouter);
  router.use('/share', shareRouter);
  router.use('/analytics', analyticsRouter);

  return router;
}
