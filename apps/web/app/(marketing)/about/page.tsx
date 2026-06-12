export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="font-display text-6xl font-bold tracking-tight sm:text-7xl">About</h1>
      <div className="prose mt-8 space-y-5 text-muted-foreground">
        <p>
          Most interview preparation is generic: static question banks that ignore your actual
          resume, your target role, and your specific weak spots. Human coaching works, but it is
          expensive and does not scale to everyone who needs it.
        </p>
        <p>
          AI Interview Simulator turns your resume and a target role into a realistic practice
          loop: <strong className="text-foreground">analyze → generate → simulate → evaluate →
          improve</strong>. Every session is personalized, every answer is scored against a
          four-dimension rubric, and every summary feeds an improvement plan you can actually
          execute.
        </p>
        <p>
          The platform is built with Next.js 15, Express, MongoDB Atlas, and Google Gemini, with a
          provider-agnostic AI layer, structured-output validation, and security designed around
          OWASP Top 10 from day one.
        </p>
        <h2 className="text-2xl font-semibold text-foreground">Frequently asked</h2>
        <p>
          <strong className="text-foreground">Is my resume private?</strong> Yes. Resumes are
          stored encrypted at rest, used only to personalize your sessions, and you can delete your
          account and all data at any time.
        </p>
        <p>
          <strong className="text-foreground">Does the free plan expire?</strong> No — you get 3
          mock interviews every month, forever.
        </p>
      </div>
    </div>
  );
}
