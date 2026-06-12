'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { UsageSummaryDto, UserDto } from '@ai-interview/types';
import { api, ApiClientError, setAccessToken, setSessionHint } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const profileSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(120),
  targetRoles: z.string().max(600),
  experienceLevel: z.enum(['student', 'grad', 'mid', 'switcher']).or(z.literal('')),
});
type ProfileValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const usage = useQuery({
    queryKey: ['usage'],
    queryFn: () => api<UsageSummaryDto>('/account/usage'),
  });

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? '',
      targetRoles: user?.targetRoles.join(', ') ?? '',
      experienceLevel: (user?.experienceLevel ?? '') as ProfileValues['experienceLevel'],
    },
  });

  const updateProfile = useMutation({
    mutationFn: (values: ProfileValues) =>
      api<UserDto>('/account/profile', {
        method: 'PATCH',
        body: {
          name: values.name,
          targetRoles: values.targetRoles
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean)
            .slice(0, 10),
          ...(values.experienceLevel ? { experienceLevel: values.experienceLevel } : {}),
        },
      }),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success('Profile updated');
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : 'Could not update profile'),
  });

  const deleteAccount = useMutation({
    mutationFn: () => api('/account', { method: 'DELETE' }),
    onSuccess: () => {
      setAccessToken(null);
      setSessionHint(false);
      toast.success('Your account and all data have been deleted.');
      router.push('/');
    },
    onError: () => {
      setDeleting(false);
      toast.error('Could not delete the account');
    },
  });

  const quota = usage.data?.quota;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile, usage, and account management.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            Target roles personalize resume analysis and question generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((v) => updateProfile.mutate(v))}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetRoles">Target roles (comma-separated)</Label>
              <Input
                id="targetRoles"
                placeholder="Frontend Engineer, Full-Stack Developer"
                {...form.register('targetRoles')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience level</Label>
              <Select id="experienceLevel" {...form.register('experienceLevel')}>
                <option value="">Prefer not to say</option>
                <option value="student">Student</option>
                <option value="grad">Fresh graduate</option>
                <option value="mid">Mid-level professional</option>
                <option value="switcher">Career switcher</option>
              </Select>
            </div>
            <Button type="submit" loading={updateProfile.isPending}>
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan & usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quota && (
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Interviews this month ({quota.plan} plan)
                </span>
                <span className="font-medium">
                  {quota.used} / {quota.limit ?? '∞'}
                </span>
              </div>
              {quota.limit !== null && <Progress value={(quota.used / quota.limit) * 100} />}
              <p className="mt-1 text-xs text-muted-foreground">
                Resets {new Date(quota.periodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
          {(usage.data?.events.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">AI usage breakdown</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {usage.data!.events.map((e) => (
                  <li key={e.type} className="flex justify-between">
                    <span>{e.type.replace(/_/g, ' ')}</span>
                    <span>{e.count}×</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete your account, resumes, interviews, and all feedback. This cannot be
            undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            loading={deleting}
            onClick={() => {
              if (
                window.confirm(
                  'Delete your account and ALL data permanently? This cannot be undone.',
                )
              ) {
                setDeleting(true);
                deleteAccount.mutate();
              }
            }}
          >
            Delete my account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
