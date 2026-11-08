import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { CreateAdminDto, LoginDto } from './auth.dto';

const ALLOWED_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER'];

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Authenticate with Supabase Auth
    try {
      const { data, error } = await this.supabase
        .getClient()
        .auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error || !data.user || !data.session) {
        // Dev fallback in non-production only
        if (
          !isProduction &&
          (email === 'admin@barcelonataxitransfer.com' ||
            email === 'bookings.barcelonataxitransfer@gmail.com') &&
          (password === 'admin123456' || password === 'admin')
        ) {
          this.logger.log(`Development mock login successful for: ${email}`);
          return {
            accessToken: 'dev-admin-master-token',
            refreshToken: 'dev-admin-refresh-token',
            expiresIn: 3600,
            expiresAt: Math.floor(Date.now() / 1000) + 3600,
            user: {
              id: '00000000-0000-0000-0000-000000000001',
              email,
              name: 'Executive Administrator',
              role: 'SUPER_ADMIN',
            },
          };
        }

        this.logger.warn(`Supabase sign-in failed for ${email}: ${error?.message}`);
        throw new UnauthorizedException(error?.message || 'Invalid email or password');
      }

      // 2. Strict Role & Authorization Check in admin_users table
      const { data: adminRecord, error: adminError } = await this.supabase
        .getClient()
        .from('admin_users')
        .select('*')
        .or(`email.eq.${data.user.email},user_id.eq.${data.user.id}`)
        .maybeSingle();

      if (adminError || !adminRecord) {
        // Auto-link initial admin if email matches official company domain or seed
        if (email.includes('admin@barcelona') || email.includes('bookings.barcelona')) {
          const { data: newAdmin } = await this.supabase
            .getClient()
            .from('admin_users')
            .upsert(
              {
                user_id: data.user.id,
                email: data.user.email,
                name: 'Administrator',
                role: 'SUPER_ADMIN',
                is_active: true,
              },
              { onConflict: 'email' },
            )
            .select()
            .single();

          return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
            expiresAt: data.session.expires_at,
            user: {
              id: newAdmin?.user_id || data.user.id,
              email: data.user.email,
              name: newAdmin?.name || 'Administrator',
              role: newAdmin?.role || 'SUPER_ADMIN',
            },
          };
        }

        this.logger.warn(`User ${email} authenticated in Supabase but not in admin_users`);
        throw new ForbiddenException('Access denied: You are not authorized for Administrator access');
      }

      if (!adminRecord.is_active) {
        this.logger.warn(`Inactive admin user login attempt: ${email}`);
        throw new ForbiddenException('Access denied: Administrator account has been deactivated');
      }

      if (!ALLOWED_ADMIN_ROLES.includes(adminRecord.role)) {
        this.logger.warn(`Unauthorized role for login attempt: ${adminRecord.role} by ${email}`);
        throw new ForbiddenException('Access denied: Unauthorized administrative role');
      }

      // Link user_id if not previously set
      if (!adminRecord.user_id && data.user.id) {
        await this.supabase
          .getClient()
          .from('admin_users')
          .update({ user_id: data.user.id })
          .eq('id', adminRecord.id);
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        expiresAt: data.session.expires_at,
        user: {
          id: adminRecord.user_id || data.user.id,
          email: adminRecord.email,
          name: adminRecord.name,
          role: adminRecord.role,
        },
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) {
        throw err;
      }
      this.logger.error(`Login error: ${err.message}`);
      throw new UnauthorizedException(err.message || 'Invalid email or password');
    }
  }

  async refreshSession(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction && refreshToken.startsWith('dev-admin-')) {
      return {
        accessToken: 'dev-admin-master-token',
        refreshToken: 'dev-admin-refresh-token',
        expiresIn: 3600,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@barcelonataxitransfer.com',
          name: 'Executive Administrator',
          role: 'SUPER_ADMIN',
        },
      };
    }

    try {
      const { data, error } = await this.supabase
        .getClient()
        .auth.refreshSession({ refresh_token: refreshToken });

      if (error || !data.session || !data.user) {
        this.logger.warn(`Token refresh failed: ${error?.message || 'No session'}`);
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Verify admin authorization
      const { data: adminRecord, error: adminError } = await this.supabase
        .getClient()
        .from('admin_users')
        .select('*')
        .or(`email.eq.${data.user.email},user_id.eq.${data.user.id}`)
        .maybeSingle();

      if (adminError || !adminRecord) {
        throw new ForbiddenException('Access denied: User is not an authorized administrator');
      }

      if (!adminRecord.is_active) {
        throw new ForbiddenException('Access denied: Administrator account has been deactivated');
      }

      if (!ALLOWED_ADMIN_ROLES.includes(adminRecord.role)) {
        throw new ForbiddenException('Access denied: Unauthorized administrative role');
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        expiresAt: data.session.expires_at,
        user: {
          id: adminRecord.user_id || data.user.id,
          email: adminRecord.email,
          name: adminRecord.name,
          role: adminRecord.role,
        },
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) {
        throw err;
      }
      this.logger.error(`Token refresh error: ${err.message}`);
      throw new UnauthorizedException(err.message || 'Session refresh failed');
    }
  }

  async logout(user?: any) {
    try {
      if (user?.id) {
        // Sign out user session in Supabase if supported
        await this.supabase.getClient().auth.admin.signOut(user.id).catch(() => {});
      }
    } catch {
      // ignore
    }
    return { success: true, message: 'Logged out successfully' };
  }

  async getCurrentUser(user: any) {
    if (!user) throw new UnauthorizedException('Not authenticated');

    const { data: adminRecord } = await this.supabase
      .getClient()
      .from('admin_users')
      .select('*')
      .or(`email.eq.${user.email},user_id.eq.${user.id}`)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email,
      name: adminRecord?.name || user.name || 'Administrator',
      role: adminRecord?.role || user.role || 'ADMIN',
      phone: adminRecord?.phone,
      createdAt: adminRecord?.created_at,
    };
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase
        .getClient()
        .auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${process.env.ADMIN_WEB_URL || 'http://localhost:3000/admin'}/reset-password`,
        });

      if (error) throw error;
      return { success: true, message: 'Password reset link sent if account exists' };
    } catch (err: any) {
      this.logger.error(`Reset password error: ${err.message}`);
      return { success: true, message: 'Password reset email requested' };
    }
  }

  async createAdmin(dto: CreateAdminDto, requester: any) {
    if (requester.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only a SUPER_ADMIN can create additional admin accounts');
    }

    try {
      // 1. Create auth user in Supabase
      const { data: authData, error: authError } = await this.supabase
        .getClient()
        .auth.admin.createUser({
          email: dto.email.trim(),
          password: dto.password,
          email_confirm: true,
          user_metadata: { name: dto.name, role: dto.role },
        });

      if (authError) throw new BadRequestException(authError.message);

      // 2. Insert into admin_users table
      const { data: adminData, error: dbError } = await this.supabase
        .getClient()
        .from('admin_users')
        .insert({
          user_id: authData.user?.id,
          email: dto.email.trim(),
          name: dto.name,
          role: dto.role,
          phone: dto.phone || null,
          is_active: true,
        })
        .select()
        .single();

      if (dbError) throw new BadRequestException(dbError.message);
      return adminData;
    } catch (err: any) {
      this.logger.error(`Create admin failed: ${err.message}`);
      throw new BadRequestException(err.message || 'Failed to create administrator account');
    }
  }

  async listAdmins() {
    const { data, error } = await this.supabase
      .getClient()
      .from('admin_users')
      .select('id, user_id, email, name, role, phone, is_active, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

