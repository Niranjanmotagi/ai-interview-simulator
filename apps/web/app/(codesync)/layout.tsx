/**
 * CodeSync surface — light, editorial theme (indigo accent, Space Grotesk
 * display type). Public shell; the /rooms subtree adds its own auth gate.
 */
export default function CodesyncLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white font-sans text-zinc-900">{children}</div>;
}
