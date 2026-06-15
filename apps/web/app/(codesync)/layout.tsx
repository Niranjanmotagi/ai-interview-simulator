/**
 * CodeSync surface — "engineered" dark theme: warm near-black canvas, monospace
 * system voice, hairline schematic modules, a single lime/phosphor accent.
 * Public shell; the /rooms subtree adds its own auth gate.
 */
export default function CodesyncLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] font-sans text-zinc-100 antialiased selection:bg-lime-300 selection:text-black">
      {children}
    </div>
  );
}
