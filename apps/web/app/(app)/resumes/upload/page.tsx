'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ResumeDto } from '@ai-interview/types';
import { api, ApiClientError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ACCEPTED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_MB = 5;

export default function ResumeUploadPage() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'analyzing'>('idle');

  const upload = useMutation({
    mutationFn: async (file: File) => {
      setPhase('uploading');
      const formData = new FormData();
      formData.append('file', file);
      const resume = await api<ResumeDto>('/resumes', { method: 'POST', formData });
      setPhase('analyzing');
      return api<ResumeDto>(`/resumes/${resume.id}/analyze`, { method: 'POST' });
    },
    onSuccess: (resume) => {
      toast.success('Resume analyzed!');
      router.push(`/resumes/${resume.id}`);
    },
    onError: (err) => {
      setPhase('idle');
      toast.error(err instanceof ApiClientError ? err.message : 'Upload failed');
    },
  });

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) {
        return;
      }
      if (!ACCEPTED.includes(file.type)) {
        toast.error('Only PDF and DOCX files are accepted');
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`File must be under ${MAX_MB} MB`);
        return;
      }
      upload.mutate(file);
    },
    [upload],
  );

  const busy = phase !== 'idle';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Upload resume</h1>
        <p className="text-sm text-muted-foreground">
          PDF or DOCX, up to {MAX_MB} MB. Text-based files only (no scans).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What happens next</CardTitle>
          <CardDescription>
            We extract the text, build a structured profile (skills, experience, projects), then
            run an AI analysis: strengths, weaknesses, ATS keyword gaps, and bullet rewrites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!busy) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            className={cn(
              'flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
              busy && 'pointer-events-none opacity-70',
            )}
          >
            {busy ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-medium">
                  {phase === 'uploading' ? 'Uploading & parsing…' : 'Running AI analysis…'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {phase === 'analyzing' && 'This usually takes 10–30 seconds.'}
                </p>
              </>
            ) : (
              <>
                <FileUp className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">Drag & drop your resume here</p>
                <p className="text-sm text-muted-foreground">or click to browse files</p>
              </>
            )}
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              disabled={busy}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
