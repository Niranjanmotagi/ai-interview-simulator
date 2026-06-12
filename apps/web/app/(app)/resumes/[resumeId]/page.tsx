'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Lightbulb, ShieldAlert, ThumbsUp } from 'lucide-react';
import type { ResumeDto } from '@ai-interview/types';
import { api } from '@/lib/api';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResumeDetailPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = use(params);
  const resume = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => api<ResumeDto>(`/resumes/${resumeId}`),
  });

  if (resume.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const data = resume.data;
  if (!data) {
    return <p className="text-muted-foreground">Resume not found.</p>;
  }

  const analysis = data.analysis;
  const profile = data.parsedProfile;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{data.fileName}</h1>
          <p className="text-sm text-muted-foreground">Status: {data.status}</p>
        </div>
        <Link href="/interviews/new" className={buttonVariants({})}>
          Practice with this resume <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resume score</CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold">{analysis.overallScore}</span>
              <div className="flex-1">
                <Progress value={analysis.overallScore} />
                <p className="mt-1 text-xs text-muted-foreground">out of 100</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {analysis && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ThumbsUp className="h-4 w-4 text-emerald-600" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                  {analysis.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4 text-amber-600" /> Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                  {analysis.weaknesses.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {analysis && analysis.atsKeywordGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ATS keyword gaps</CardTitle>
            <CardDescription>
              Keywords screeners expect for your target role that are missing from this resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {analysis.atsKeywordGaps.map((kw) => (
              <Badge key={kw} variant="outline">
                {kw}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {analysis && analysis.suggestedRewrites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" /> Suggested rewrites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.suggestedRewrites.map((rw) => (
              <div key={rw.original} className="rounded-md border p-3 text-sm">
                <p className="text-muted-foreground line-through">{rw.original}</p>
                <p className="mt-2 font-medium text-emerald-700">{rw.improved}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extracted profile</CardTitle>
            <CardDescription>This is what the interviewer AI knows about you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="mb-1.5 font-medium">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            {profile.experience.length > 0 && (
              <div>
                <p className="mb-1.5 font-medium">Experience</p>
                <ul className="space-y-2">
                  {profile.experience.map((exp) => (
                    <li key={`${exp.title}-${exp.company}`} className="text-muted-foreground">
                      <span className="font-medium text-foreground">{exp.title}</span> · {exp.company}{' '}
                      · {exp.duration}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {profile.projects.length > 0 && (
              <div>
                <p className="mb-1.5 font-medium">Projects</p>
                <ul className="space-y-1 text-muted-foreground">
                  {profile.projects.map((p) => (
                    <li key={p.name}>
                      <span className="font-medium text-foreground">{p.name}</span> — {p.summary}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
