// /lib/rbac-middleware.ts
// RBAC Server-Side Enforcement Middleware - CR AudioViz AI
// Ensures every route checks permissions server-side (UI gates are not sufficient)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Permission requirements for routes
export interface RoutePermission {
  permissions?: string[];      // Required permissions (any match)
  allPermissions?: string[];   // Required permissions (all must match)
  roles?: string[];            // Required roles (any match)
  minRoleLevel?: number;       // Minimum role level required
  allowPublic?: boolean;       // Allow unauthenticated access
  allowApiKey?: boolean;       // Allow API key authentication
  apiKeyScopes?: string[];     // Required API key scopes
}

// Standard error responses
const ERRORS = {
  UNAUTHORIZED: {
    status: 401,
    body: { error: 'Authentication required', code: 'UNAUTHORIZED' }
  },
  FORBIDDEN: {
    status: 403,
    body: { error: 'Insufficient permissions', code: 'FORBIDDEN' }
  },
  INVALID_TOKEN: {
    status: 401,
    body: { error: 'Invalid or expired token', code: 'INVALID_TOKEN' }
  },
  INVALID_API_KEY: {
    status: 401,
    body: { error: 'Invalid API key', code: 'INVALID_API_KEY' }
  }
};

/**
 * Extract user from Supabase JWT or API key
 */
async function extractAuth(request: NextRequest): Promise<{
  userId?: string;
  apiKeyId?: string;
  scopes?: string[];
  authenticated: boolean;
}> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return { authenticated: false };
  }

  const [scheme, token] = authHeader.split(' ');

  // Handle Bearer token (Supabase JWT)
  if (scheme === 'Bearer' && token && !token.startsWith('crav_')) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { authenticated: false };
    }

    return {
      userId: user.id,
      authenticated: true
    };
  }

  // Handle API key (crav_xxx_xxx)
  if (token?.startsWith('crav_')) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Hash the key for lookup
    const crypto = await import('crypto');
    const keyHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const { data: apiKey, error } = await supabase
      .from('developer_api_keys')
      .select('id, user_id, scopes, is_active, expires_at')
      .eq('key_hash', keyHash)
      .single();

    if (error || !apiKey || !apiKey.is_active) {
      return { authenticated: false };
    }

    // Check expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return { authenticated: false };
    }

    // Update last used
    await supabase
      .from('developer_api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        last_used_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      })
      .eq('id', apiKey.id);

    return {
      userId: apiKey.user_id,
      apiKeyId: apiKey.id,
      scopes: apiKey.scopes || [],
      authenticated: true
    };
  }

  return { authenticated: false };
}

/**
 * Check if user has required permissions
 */
async function checkPermissions(
  userId: string,
  requirements: RoutePermission
): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get user's roles and permissions
  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select(`
      role:roles(
        name,
        level,
        role_permissions(
          permission:permissions(name)
        )
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error || !userRoles?.length) {
    return false;
  }

  // Extract roles and permissions
  const roles: string[] = [];
  const permissions: string[] = [];
  let maxLevel = 0;

  userRoles.forEach(ur => {
    if (ur.role) {
      roles.push(ur.role.name);
      maxLevel = Math.max(maxLevel, ur.role.level || 0);
      
      ur.role.role_permissions?.forEach((rp: any) => {
        if (rp.permission?.name) {
          permissions.push(rp.permission.name);
        }
      });
    }
  });

  // Check role level
  if (requirements.minRoleLevel !== undefined && maxLevel < requirements.minRoleLevel) {
    return false;
  }

  // Check specific roles
  if (requirements.roles?.length) {
    const hasRole = requirements.roles.some(r => roles.includes(r));
    if (!hasRole) return false;
  }

  // Check any permission
  if (requirements.permissions?.length) {
    const hasPermission = requirements.permissions.some(p => {
      // Direct match
      if (permissions.includes(p)) return true;
      
      // Check for manage permission (grants all actions)
      const [resource] = p.split(':');
      if (permissions.includes(`${resource}:manage`)) return true;
      
      // Check for :all scope when :own is required
      const allVersion = p.replace(':own', ':all');
      if (permissions.includes(allVersion)) return true;
      
      return false;
    });
    if (!hasPermission) return false;
  }

  // Check all permissions
  if (requirements.allPermissions?.length) {
    const hasAll = requirements.allPermissions.every(p => {
      if (permissions.includes(p)) return true;
      const [resource] = p.split(':');
      if (permissions.includes(`${resource}:manage`)) return true;
      const allVersion = p.replace(':own', ':all');
      if (permissions.includes(allVersion)) return true;
      return false;
    });
    if (!hasAll) return false;
  }

  return true;
}

/**
 * RBAC Middleware - Protect routes with permission checks
 */
export function withRBAC(requirements: RoutePermission) {
  return function decorator<T extends (...args: any[]) => Promise<Response>>(
    handler: T
  ): T {
    return (async (request: NextRequest, ...args: any[]) => {
      // Allow public routes
      if (requirements.allowPublic) {
        return handler(request, ...args);
      }

      // Extract authentication
      const auth = await extractAuth(request);

      // Check authentication
      if (!auth.authenticated) {
        return NextResponse.json(ERRORS.UNAUTHORIZED.body, {
          status: ERRORS.UNAUTHORIZED.status
        });
      }

      // API key authentication
      if (auth.apiKeyId) {
        if (!requirements.allowApiKey) {
          return NextResponse.json(ERRORS.FORBIDDEN.body, {
            status: ERRORS.FORBIDDEN.status
          });
        }

        // Check API key scopes
        if (requirements.apiKeyScopes?.length) {
          const hasScopes = requirements.apiKeyScopes.every(s => 
            auth.scopes?.includes(s)
          );
          if (!hasScopes) {
            return NextResponse.json({
              error: 'API key missing required scopes',
              code: 'INSUFFICIENT_SCOPES',
              required: requirements.apiKeyScopes
            }, { status: 403 });
          }
        }
      }

      // Check permissions for authenticated users
      if (auth.userId && (requirements.permissions || requirements.allPermissions || requirements.roles || requirements.minRoleLevel !== undefined)) {
        const hasPermission = await checkPermissions(auth.userId, requirements);
        
        if (!hasPermission) {
          return NextResponse.json(ERRORS.FORBIDDEN.body, {
            status: ERRORS.FORBIDDEN.status
          });
        }
      }

      // Inject user info into request for downstream use
      const requestWithAuth = request.clone();
      (requestWithAuth as any).auth = {
        userId: auth.userId,
        apiKeyId: auth.apiKeyId,
        scopes: auth.scopes
      };

      return handler(requestWithAuth, ...args);
    }) as T;
  };
}

/**
 * Pre-defined route protection levels
 */
export const PROTECTION = {
  // Public - no auth required
  PUBLIC: { allowPublic: true },
  
  // Any authenticated user
  AUTHENTICATED: { },
  
  // Subscriber or higher
  SUBSCRIBER: { minRoleLevel: 30 },
  
  // Creator or higher
  CREATOR: { minRoleLevel: 40 },
  
  // Vendor or higher
  VENDOR: { minRoleLevel: 50 },
  
  // Moderator or higher
  MODERATOR: { minRoleLevel: 70 },
  
  // Admin only
  ADMIN: { minRoleLevel: 90 },
  
  // Super admin only
  SUPER_ADMIN: { minRoleLevel: 100 },
  
  // API key with read scope
  API_READ: { allowApiKey: true, apiKeyScopes: ['read'] },
  
  // API key with write scope
  API_WRITE: { allowApiKey: true, apiKeyScopes: ['write'] },
  
  // API key with admin scope
  API_ADMIN: { allowApiKey: true, apiKeyScopes: ['admin'] }
} as const;

/**
 * Helper to check permission in handler (for fine-grained checks)
 */
export async function requirePermission(
  userId: string,
  permission: string
): Promise<boolean> {
  return checkPermissions(userId, { permissions: [permission] });
}

/**
 * Helper to get user's role level
 */
export async function getUserRoleLevel(userId: string): Promise<number> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data } = await supabase
    .from('user_roles')
    .select('role:roles(level)')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!data?.length) return 0;

  return Math.max(...data.map(ur => ur.role?.level || 0));
}

export default withRBAC;
