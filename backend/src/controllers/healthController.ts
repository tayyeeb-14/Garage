import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';

export const getHealth = (_req: Request, res: Response) => {
  sendSuccess(res, { status: 'ok', service: 'SpeedX Garage API' });
};
