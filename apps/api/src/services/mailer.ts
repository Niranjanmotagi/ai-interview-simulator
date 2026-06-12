import { logger } from '../config/logger';

/**
 * Mail transport abstraction. The console transport is the development/test
 * implementation; production swaps in a Resend/SendGrid transport behind the
 * same interface without touching callers.
 */
export interface Mailer {
  sendPasswordReset(email: string, resetUrl: string): Promise<void>;
}

class ConsoleMailer implements Mailer {
  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    logger.info({ email, resetUrl }, 'Password reset email (console transport)');
  }
}

export const mailer: Mailer = new ConsoleMailer();
