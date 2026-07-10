import { useEffect, useRef } from "react";

/**
 * Lightweight 3D-ish starfield rendered on a 2D canvas.
 * Stars orbit toward the viewer creating a warp/universe feel.
 */
export function StarfieldBackground({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Star = { x: number; y: number; z: number; pz: number };
    const STAR_COUNT = 220;
    const stars: Star[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const reset = (s: Star) => {
      s.x = (Math.random() - 0.5) * width;
      s.y = (Math.random() - 0.5) * height;
      s.z = Math.random() * width;
      s.pz = s.z;
    };

    for (let i = 0; i < STAR_COUNT; i++) {
      const s: Star = { x: 0, y: 0, z: 0, pz: 0 };
      reset(s);
      stars.push(s);
    }

    resize();
    window.addEventListener("resize", resize);

    const isDark = () => document.documentElement.classList.contains("dark");

    const render = () => {
      const dark = isDark();
      ctx.clearRect(0, 0, width, height);

      // background gradient tint
      const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 1.2);
      if (dark) {
        grad.addColorStop(0, "rgba(79,70,229,0.28)");
        grad.addColorStop(0.5, "rgba(15,23,42,0.6)");
        grad.addColorStop(1, "rgba(2,6,23,1)");
      } else {
        grad.addColorStop(0, "rgba(37,99,235,0.18)");
        grad.addColorStop(0.5, "rgba(79,70,229,0.12)");
        grad.addColorStop(1, "rgba(226,232,240,0.9)");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const speed = 3.5;
      ctx.lineCap = "round";

      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;
        if (s.z <= 1) {
          reset(s);
          s.z = width;
          s.pz = s.z;
        }
        const k = 128 / s.z;
        const px = s.x * k + cx;
        const py = s.y * k + cy;
        const pk = 128 / s.pz;
        const ppx = s.x * pk + cx;
        const ppy = s.y * pk + cy;

        if (px < 0 || px > width || py < 0 || py > height) continue;
        const alpha = Math.min(1, (1 - s.z / width) * 1.3);
        const size = Math.max(0.4, (1 - s.z / width) * 2.2);
        ctx.strokeStyle = dark
          ? `rgba(226, 232, 255, ${alpha})`
          : `rgba(37, 99, 235, ${alpha * 0.7})`;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(ppx, ppy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={`h-full w-full ${className}`} />;
}
