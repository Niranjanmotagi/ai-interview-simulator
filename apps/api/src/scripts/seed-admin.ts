/**
 * Seeds (or promotes) an admin account. Idempotent — safe to re-run.
 *
 *   npm run seed:admin -w apps/api
 *
 * Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD env vars when set,
 * otherwise development defaults are used and printed. Never run with the
 * defaults against a production database.
 */
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../config/db';
import { User } from '../models';

const DEFAULT_EMAIL = 'admin@local.dev';
const DEFAULT_PASSWORD = 'Admin123!dev';

async function main(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? DEFAULT_EMAIL).toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
  const usingDefaults = !process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD;

  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error('ADMIN_PASSWORD must be 8+ chars and contain a letter and a number');
  }

  await connectDb();

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email }).select('+passwordHash');

  if (existing) {
    existing.role = 'admin';
    existing.plan = 'pro_plus';
    existing.emailVerified = true;
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`✔ Existing user ${email} promoted to admin (password reset).`);
  } else {
    await User.create({
      name: 'Admin',
      email,
      passwordHash,
      role: 'admin',
      plan: 'pro_plus',
      emailVerified: true,
    });
    console.log(`✔ Admin account created.`);
  }

  console.log(`  email:    ${email}`);
  console.log(`  password: ${usingDefaults ? password : '(from ADMIN_PASSWORD env)'}`);
  if (usingDefaults) {
    console.log('  ⚠ Development defaults — do NOT use against a production database.');
  }

  await disconnectDb();
}

main().catch((err) => {
  console.error('Seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
