import { betterAuth } from 'better-auth';
import { typeORMAdapter } from './typeorm-adapter';
import dataSource from '../database/data-source';

/**
 * Better Auth Configuration
 *
 * This is the main authentication instance that:
 * - Connects to your database via the custom TypeORM adapter
 * - Configures authentication methods (email/password, OAuth, etc.)
 * - Sets security options (secrets, cookies, sessions)
 */
export const auth = betterAuth({
  /**
   * DATABASE CONNECTION
   * Use your custom TypeORM adapter with existing DataSource
   * This connects Better Auth to your PostgreSQL database through TypeORM
   */
  database: typeORMAdapter({
    dataSource: dataSource, // Your TypeORM connection from data-source.ts
  }),

  /**
   * EMAIL & PASSWORD AUTHENTICATION
   * Enable traditional email/password signup and login
   */
  emailAndPassword: {
    enabled: true, // Turn on email/password auth

    /**
     * Require email verification before users can login
     * Set to false if you want immediate access after signup
     */
    requireEmailVerification: false, // Change to true for production

    /**
     * Auto-signin after successful registration
     * User is automatically logged in after signup
     */
    autoSignIn: true,

    /**
     * Minimum password length requirement
     */
    minPasswordLength: 8,

    /**
     * Maximum password length (prevent DoS attacks)
     */
    maxPasswordLength: 128,

    /**
     * Password must contain uppercase, lowercase, number, special char
     * Uncomment and customize as needed
     */
    // passwordStrength: {
    //   minLength: 8,
    //   requireUppercase: true,
    //   requireLowercase: true,
    //   requireNumbers: true,
    //   requireSpecialChars: true,
    // },
  },

  /**
   * USER CONFIGURATION
   * Customize user model with additional fields for your SaaS
   */
  user: {
    /**
     * Add custom fields to the user table
     * These fields are automatically added to the User entity
     */
    additionalFields: {
      // Multi-tenant field - which tenant/organization this user belongs to
      tenantId: {
        type: 'string',
        required: false, // Optional for users who haven't joined a tenant yet
        defaultValue: null,
      },

      // User role (admin, user, merchant, etc.)
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user', // Default role for new signups
      },

      // User's phone number
      phoneNumber: {
        type: 'string',
        required: false,
        defaultValue: null,
      },

      // Whether user account is active
      isActive: {
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    },
  },

  /**
   * SESSION CONFIGURATION
   * Control how user sessions work
   */
  session: {
    /**
     * How long sessions last before expiring
     * 7 days = 7 * 24 * 60 * 60 seconds
     */
    expiresIn: 60 * 60 * 24 * 7, // 7 days

    /**
     * Automatically refresh session before it expires
     * Keeps users logged in if they're active
     */
    updateAge: 60 * 60 * 24, // Refresh if session older than 1 day

    /**
     * Cookie name for session token
     * Stored in user's browser
     */
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },

  /**
   * SECURITY SETTINGS
   */

  /**
   * Secret key for signing tokens (JWT, cookies, etc.)
   * MUST be set via environment variable
   * Generate with: openssl rand -base64 32
   */
  secret: process.env.BETTER_AUTH_SECRET!,

  /**
   * Base URL of your application
   * Used for redirect URLs, email links, OAuth callbacks
   */
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  /**
   * Trusted origins for CORS
   * Add your frontend URL here
   */
  trustedOrigins: [
    process.env.WEB_FRONTEND_URL || 'http://localhost:3000',
    process.env.WEB_DASHBOARD_URL || 'http://localhost:3001',
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  ],

  /**
   * ADVANCED RATE LIMITING (Optional but recommended for production)
   * Prevent brute force attacks
   */
  rateLimit: {
    enabled: true,
    window: 60, // Time window in seconds
    max: 100, // Max requests per window
  },

  /**
   * OAUTH PROVIDERS (Optional - add as needed)
   * Uncomment and configure when you want to add social login
   */
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   },
  //   github: {
  //     clientId: process.env.GITHUB_CLIENT_ID!,
  //     clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  //   },
  // },

  /**
   * PLUGINS (Optional - Better Auth plugin system)
   * Add extra features like 2FA, admin panel, etc.
   */
  // plugins: [
  //   twoFactor(),
  //   admin(),
  // ],
});

/**
 * Export type-safe auth types
 * Use these in your services/controllers for type safety
 */

// Session type includes both session data and user data
export type AuthSession = typeof auth.$Infer.Session;

// Extract User type from the Session type
// Session.user contains the full user object
export type AuthUser = AuthSession['user'];

// Alternative: Import User entity directly from TypeORM
// This gives you the database schema type
import { User as UserEntity } from './entities';
export type User = UserEntity;

// Export the full auth instance type
export type Auth = typeof auth;
