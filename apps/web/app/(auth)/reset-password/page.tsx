'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api, ApiClientError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[a-zA-Z]/, 'Must contain a letter')
    .regex(/\d/, 'Must contain a number'),
});
type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: { email, token, password: values.password },
      });
      toast.success('Password updated. Log in with your new password.');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token || !email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid reset link</CardTitle>
          <CardDescription>
            This link is missing required information. Request a new one from the forgot-password
            page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>For {email}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" loading={submitting}>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
