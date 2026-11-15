// ==============================================================================
// Tầng Điều khiển Người dùng & Cài đặt Tài khoản (User Controller)
// Hệ thống: ThuTra TNCN - Giai đoạn 4
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import type { ApiResponse } from '../types/api.types';
import { UnauthorizedError } from '../errors/app-error';

export class UserController {
  /**
   * Endpoint: PUT /api/users/profile
   * Cập nhật thông tin cá nhân (họ tên, địa chỉ, cơ quan thuế, SĐT)
   * Trả về: HTTP 200 OK
   */
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || (req.user as any)?.userId;
      if (!req.user || !userId) {
        throw new UnauthorizedError('Phiên xác thực không tồn tại hoặc thiếu định danh người dùng.');
      }
      if (!req.dbClient) throw new Error('Database Session Client không được khởi tạo.');

      const userContext = {
        ...req.user,
        id: String(userId),
      };

      const {
        fullName,
        phone,
        address,
        cccd,
        idNumber,
        idCard,
        mst,
        taxCode,
        dateOfBirth,
        dob,
        taxDepartmentName,
        taxDepartmentCode,
      } = req.body;

      const cleanCccd = cccd || idNumber || idCard;
      const cleanMst = mst || taxCode;
      const cleanDob = dateOfBirth || dob;

      // Chuẩn hóa định dạng ngày sinh YYYY-MM-DD nếu có
      let formattedDob: string | undefined = undefined;
      if (cleanDob) {
        const str = String(cleanDob).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          formattedDob = str;
        } else {
          const d = new Date(str);
          if (!isNaN(d.getTime())) {
            formattedDob = d.toISOString().slice(0, 10);
          }
        }
      }

      const normalizedDto = {
        fullName: fullName !== undefined ? String(fullName).trim() : undefined,
        phone: phone !== undefined ? String(phone).trim() : undefined,
        address: address !== undefined ? String(address).trim() : undefined,
        cccd: cleanCccd !== undefined ? String(cleanCccd).trim() : undefined,
        idNumber: cleanCccd !== undefined ? String(cleanCccd).trim() : undefined,
        mst: cleanMst !== undefined ? String(cleanMst).trim() : undefined,
        taxCode: cleanMst !== undefined ? String(cleanMst).trim() : undefined,
        dateOfBirth: formattedDob,
        dob: formattedDob,
        taxDepartmentName: taxDepartmentName !== undefined ? String(taxDepartmentName).trim() : undefined,
        taxDepartmentCode: taxDepartmentCode !== undefined ? String(taxDepartmentCode).trim() : undefined,
      };

      const updatedUser = await authService.updateProfile(userContext, normalizedDto, req.dbClient);

      const response: ApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Cập nhật thông tin cá nhân thành công.',
        data: updatedUser,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint: PUT /api/users/change-password
   * Đổi mật khẩu tài khoản
   * Trả về: HTTP 200 OK
   */
  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Phiên xác thực không tồn tại.');
      if (!req.dbClient) throw new Error('Database Session Client không được khởi tạo.');

      await authService.changePassword(req.user, req.body, req.dbClient);

      const response: ApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Đổi mật khẩu thành công. Vui lòng sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo.',
        data: null,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
