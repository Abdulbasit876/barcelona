import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../services/supabase.service';

@Injectable()
export class DriverGuard implements CanActivate {
  private readonly logger = new Logger(DriverGuard.name);

  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Check for dev bypass or driver phone/id header
    const devDriverId = request.headers['x-driver-id'];
    if (devDriverId) {
      const { data: driver } = await this.supabase
        .getClient()
        .from('drivers')
        .select('*')
        .eq('id', devDriverId)
        .single();

      if (driver) {
        request.driver = driver;
        return true;
      }
    }

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header required for Driver Portal');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // Fast path: direct driver session token
    if (token.startsWith('driver-')) {
      const driverId = token.replace('driver-', '');
      const { data: driver } = await this.supabase
        .getClient()
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (driver) {
        request.driver = driver;
        return true;
      }
      throw new UnauthorizedException('Invalid or expired driver session');
    }

    try {
      const { data: authData, error: authError } = await this.supabase
        .getClient()
        .auth.getUser(token);

      if (authError || !authData?.user) {
        throw new UnauthorizedException('Invalid or expired driver session');
      }

      const user = authData.user;

      // Match driver by user_id or email
      const { data: driverRecord, error: driverError } = await this.supabase
        .getClient()
        .from('drivers')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .eq('is_active', true)
        .single();

      if (driverError || !driverRecord) {
        throw new UnauthorizedException('Access denied: Driver profile not found or inactive');
      }

      request.driver = driverRecord;
      return true;
    } catch (err: any) {
      this.logger.error(`Driver authentication failed: ${err.message}`);
      throw new UnauthorizedException(err.message || 'Driver authentication error');
    }
  }
}

