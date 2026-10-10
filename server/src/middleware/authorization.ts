import type { Request, RequestHandler } from 'express';
import mongoose, { Types } from 'mongoose';
import type { IUser } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export function getAuthenticatedUser(request: Request): IUser {
  if (!request.currentUser) {
    throw new ApiError(401, 'Authentication required');
  }
  return request.currentUser;
}

export const requireAuthenticatedUser: RequestHandler = (request, _response, next) => {
  getAuthenticatedUser(request);
  next();
};

export const requireAdmin: RequestHandler = (request, _response, next) => {
  if (getAuthenticatedUser(request).role !== 'admin') {
    throw new ApiError(403, 'Administrator access required');
  }
  next();
};

export function assertResourceOwnership(
  resourceOwnerId: Types.ObjectId | string,
  authenticatedUser: IUser,
): void {
  if (resourceOwnerId.toString() !== authenticatedUser._id.toString()) {
    throw new ApiError(403, 'You are not authorized to access this resource');
  }
}

export function getOwnedResourceFilter(resourceId: string, ownerId: Types.ObjectId) {
  if (!/^[a-f\d]{24}$/i.test(resourceId) || !mongoose.isValidObjectId(resourceId)) {
    throw new ApiError(400, 'Invalid resource identifier');
  }

  return { _id: new Types.ObjectId(resourceId), userId: ownerId };
}
