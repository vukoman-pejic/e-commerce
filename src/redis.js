import { Queue, Worker } from 'bullmq';

export const connection = {
  host: '127.0.0.1',
  port: 6380
};

export const bonusQueue = new Queue('team-bonus-queue', { connection });