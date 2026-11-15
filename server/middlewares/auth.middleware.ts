// ==============================================================================
// Middleware Xác thực Người dùng qua JWT (Auth Middleware)
// Hệ thống: ThuTra TNCN
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import type { UserRole } from '../types/auth.types';

/**
 * Middleware bắt buộc xác thực:
 * - Kiểm tra header Authorization (Bearer <token>)
 * - Giải mã và xác minh tính hợp lệ của token
 * - Gán thông tin người dùng vào `req.user`
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError(
        'Không tìm thấy thông tin xác thực. Vui lòng cung cấp Authorization header theo định dạng Bearer <token>.',
        'MISSING_AUTH_HEADER'
      );
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      throw new UnauthorizedError(
        'Định dạng Authorization header không hợp lệ. Phải có tiền tố Bearer kèm khoảng trắng.',
        'MALFORMED_AUTH_HEADER'
      );
    }

    const cleanToken = match[1].trim().replace(/^Bearer\s+/i, '').trim();
    const payload = tokenService.verifyAccessToken(cleanToken);

    const userId = (payload as any).userId || (payload as any).sub || (payload as any).id;
    if (!userId) {
      throw new UnauthorizedError('Token không chứa định danh người dùng hợp lệ.', 'INVALID_TOKEN_PAYLOAD');
    }

    // Gán ngữ cảnh người dùng vào request để các tầng xử lý tiếp theo sử dụng
    req.user = {
      id: String(userId),
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware xác thực tùy chọn (Optional Auth Middleware)
 * Nếu có Token hợp lệ -> gán req.user.
 * Nếu không có Token hoặc token không hợp lệ -> tiếp tục xử lý ở chế độ Guest.
 */
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const cleanToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!cleanToken) {
      return next();
    }

    const payload = tokenService.verifyAccessToken(cleanToken);
    const userId = (payload as any).userId || (payload as any).sub || (payload as any).id;
    if (userId) {
      req.user = {
        id: String(userId),
        email: payload.email,
        role: payload.role,
      };
    }
  } catch (err) {
    // Bỏ qua lỗi token trong chế độ xác thực tùy chọn
  }
  next();
}

/**
 * Middleware kiểm tra quyền hạn (Role-Based Access Control Guard)
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Yêu cầu xác thực tài khoản trước khi kiểm tra quyền.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Bạn không có quyền thực hiện hành động này. Vai trò yêu cầu: [${allowedRoles.join(', ')}], vai trò hiện tại: [${req.user.role}].`,
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }

    next();
  };
}
