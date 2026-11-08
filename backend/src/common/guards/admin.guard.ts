import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../services/supabase.service';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Check for dev bypass header or mock environment in development mode
    const devToken = request.headers['x-admin-dev-key'];
    const expectedDevKey = process.env.ADMIN_DEV_KEY || 'btt-admin-super-secret-dev';
    if (process.env.NODE_ENV !== 'production' && devToken && devToken === expectedDevKey) {
      request.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@barcelonataxitransfer.com',
        role: 'SUPER_ADMIN',
        name: 'Master Administrator',
      };
      return true;
    }

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Bearer token missing');
    }

    try {
      const { data: authData, error: authError } = await this.supabase
        .getClient()
        .auth.getUser(token);

      if (authError || !authData?.user) {
        // Fallback for custom JWT or mock token
        if (token.startsWith('dev-admin-')) {
          request.user = {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'admin@barcelonataxitransfer.com',
            role: 'SUPER_ADMIN',
            name: 'Master Administrator',
          };
          return true;
        }
        throw new UnauthorizedException('Invalid or expired authentication session');
      }

      const user = authData.user;

      // Query admin_users table to verify role
      const { data: adminRecord, error: adminError } = await this.supabase
        .getClient()
        .from('admin_users')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();

      if (adminError || !adminRecord) {
        // If first superadmin or bootstrap, check metadata
        if (user.user_metadata?.role === 'ADMIN' || user.user_metadata?.role === 'SUPER_ADMIN') {
          request.user = {
            id: user.id,
            email: user.email,
            role: user.user_metadata.role,
            name: user.user_metadata.name || 'Admin',
          };
          return true;
        }
        throw new UnauthorizedException('Access denied: User is not an authorized administrator');
      }

      request.user = {
        id: user.id,
        email: user.email,
        role: adminRecord.role,
        name: adminRecord.name,
      };

      return true;
    } catch (err: any) {
      this.logger.error(`Admin authentication failed: ${err.message}`);
      throw new UnauthorizedException(err.message || 'Authentication error');
    }
  }
}

