import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../services/supabase.service';

const ALLOWED_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER'];

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Check for dev bypass in development ONLY (Strictly disabled in production)
    const devToken = request.headers['x-admin-dev-key'];
    const expectedDevKey = process.env.ADMIN_DEV_KEY || 'btt-admin-super-secret-dev';
    if (!isProduction && devToken && devToken === expectedDevKey) {
      request.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@barcelonataxitransfer.com',
        role: 'SUPER_ADMIN',
        name: 'Master Administrator',
      };
      return true;
    }

    // 2. Validate Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Bearer token missing');
    }

    // Dev token fallback ONLY in non-production
    if (!isProduction && token.startsWith('dev-admin-')) {
      request.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@barcelonataxitransfer.com',
        role: 'SUPER_ADMIN',
        name: 'Master Administrator',
      };
      return true;
    }

    // 3. Strict Supabase Token Verification
    try {
      const { data: authData, error: authError } = await this.supabase
        .getClient()
        .auth.getUser(token);

      if (authError || !authData?.user) {
        this.logger.warn(`Invalid or expired token received: ${authError?.message || 'No user'}`);
        throw new UnauthorizedException('Invalid or expired authentication session');
      }

      const user = authData.user;

      // 4. Strict Role & Authorization Check in admin_users table
      const { data: adminRecord, error: adminError } = await this.supabase
        .getClient()
        .from('admin_users')
        .select('*')
        .or(`email.eq.${user.email},user_id.eq.${user.id}`)
        .maybeSingle();

      if (adminError || !adminRecord) {
        this.logger.warn(`User ${user.email} not found in admin_users`);
        throw new ForbiddenException('Access denied: User is not an authorized administrator');
      }

      if (!adminRecord.is_active) {
        this.logger.warn(`Inactive admin user tried to access API: ${user.email}`);
        throw new ForbiddenException('Access denied: Administrator account has been deactivated');
      }

      if (!ALLOWED_ADMIN_ROLES.includes(adminRecord.role)) {
        this.logger.warn(`Unauthorized role ${adminRecord.role} for user: ${user.email}`);
        throw new ForbiddenException('Access denied: Unauthorized administrative role');
      }

      // Attach authorized admin details to request
      request.user = {
        id: adminRecord.user_id || user.id,
        email: adminRecord.email || user.email,
        role: adminRecord.role,
        name: adminRecord.name,
      };

      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) {
        throw err;
      }
      this.logger.error(`Admin authentication error: ${err.message}`);
      throw new UnauthorizedException(err.message || 'Authentication error');
    }
  }
}
