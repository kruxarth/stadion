"use client";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Noise grain overlay */}
      <div className="noise-overlay" />

      {/* Harsh grid lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(99,228,224,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,228,224,0.08) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Scanline sweep */}
      <div
        className="absolute inset-x-0 h-[2px] opacity-20"
        style={{
          background: "linear-gradient(90deg, transparent, #63e4e0, transparent)",
          animation: "scanline 4s linear infinite",
        }}
      />

      {/* Aggressive teal glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-15 blur-3xl"
        style={{ background: "#63e4e0" }}
      />

      {/* Secondary glow bottom-right */}
      <div
        className="absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full opacity-8 blur-3xl"
        style={{ background: "#63e4e0" }}
      />

      {/* Radial fade */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, transparent 30%, #000000 100%)",
        }}
      />
    </div>
  );
}
