import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { CreateAdminDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Check Supabase Auth
    try {
      const { data, error } = await this.supabase
        .getClient()
        .auth.signInWithPassword({
          email,
          password,
        });

      if (error || !data.user) {
        // Fallback for development if Supabase instance is not yet seeded
        if (
          process.env.NODE_ENV !== 'production' &&
          (email === 'admin@barcelonataxitransfer.com' ||
            email === 'bookings.barcelonataxitransfer@gmail.com') &&
          (password === 'admin123456' || password === 'admin')
        ) {
          return {
            accessToken: 'dev-admin-master-token',
            user: {
              id: '00000000-0000-0000-0000-000000000001',
              email,
              name: 'Executive Administrator',
              role: 'SUPER_ADMIN',
            },
          };
        }
        throw new UnauthorizedException(error?.message || 'Invalid credentials');
      }

      // Check admin_users table for verification
      const { data: adminRecord, error: adminError } = await this.supabase
        .getClient()
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (adminError || !adminRecord) {
        // Auto-seed initial admin for the registered email
        if (email.includes('admin@barcelona') || email.includes('bookings.barcelona')) {
          await this.supabase
            .getClient()
            .from('admin_users')
            .upsert(
              {
                user_id: data.user.id,
                email,
                name: 'Administrator',
                role: 'SUPER_ADMIN',
                is_active: true,
              },
              { onConflict: 'email' },
            );

          return {
            accessToken: data.session?.access_token,
            user: {
              id: data.user.id,
              email: data.user.email,
              name: 'Administrator',
              role: 'SUPER_ADMIN',
            },
          };
        }
        throw new ForbiddenException('User is not authorized for Admin Access');
      }

      return {
        accessToken: data.session?.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: adminRecord.name,
          role: adminRecord.role,
        },
      };
    } catch (err: any) {
      this.logger.error(`Login error: ${err.message}`);
      throw new UnauthorizedException(err.message || 'Invalid email or password');
    }
  }

  async getCurrentUser(user: any) {
    if (!user) throw new UnauthorizedException('Not authenticated');

    const { data: adminRecord } = await this.supabase
      .getClient()
      .from('admin_users')
      .select('*')
      .eq('email', user.email)
      .single();

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
        .auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.ADMIN_WEB_URL || 'http://localhost:3001'}/reset-password`,
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
          email: dto.email,
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
          email: dto.email,
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
