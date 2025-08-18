import { verifyToken } from './get_me';
import type { TokenPayload } from './get_me';

export interface AuthContext {
  user: {
    id: number;
    role: string;
  };
}

export function requireAuth(token?: string): AuthContext {
  if (!token) {
    throw new Error('Authentication token required');
  }

  try {
    const payload = verifyToken(token);
    return {
      user: {
        id: payload.userId,
        role: payload.role
      }
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function requireRole(authContext: AuthContext, allowedRoles: string[]): void {
  if (!allowedRoles.includes(authContext.user.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }
}

export function requireAdminRole(authContext: AuthContext): void {
  requireRole(authContext, ['SYSTEM_ADMIN', 'APP_ADMIN']);
}

export function requireManagerOrAbove(authContext: AuthContext): void {
  requireRole(authContext, ['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER']);
}

// Test utility functions
export function createTestToken(userId: number, role: string): string {
  const payload = {
    userId,
    role,
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function createTestUser() {
  return {
    username: 'testuser',
    email: 'test@example.com',
    password_hash: Buffer.from('password123').toString('base64'), // Simple hash for tests
    full_name: 'Test User',
    role: 'MANAGER' as const,
    is_active: true,
    commission_rate: null
  };
}