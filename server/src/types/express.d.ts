import type { IUser } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      currentUser?: IUser;
      currentSessionId?: string;
    }
  }
}

export {};
