import { useState, useEffect, memo, useRef } from "react";

const SPLASH_DURATION = 5400;
const FADE_START = 4.4;
const FADE_END = 5.4;

export const SplashScreen = memo(function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [brandVisible, setBrandVisible] = useState(false);
  const [brandFading, setBrandFading] = useState(false);
  const [exiting, setExiting] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setBrandVisible(true), 3200);
    const t2 = setTimeout(() => setBrandFading(true), FADE_START * 1000);
    const t3 = setTimeout(() => setExiting(true), FADE_END * 1000);
    const t4 = setTimeout(() => onCompleteRef.current(), SPLASH_DURATION + 100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div className={`apple-splash ${exiting ? "apple-splash-fading" : ""}`} style={{ background: "#000000" }}>
      <SplashCanvas />
      <div className={`apple-splash-brand ${brandVisible ? "visible" : ""} ${brandFading ? "fading" : ""}`}>
        <div className="apple-splash-logo-text">AperoSplit</div>
        <div className="apple-splash-tagline">Partagez, équilibrez</div>
      </div>
    </div>
  );
});

SplashScreen.displayName = "SplashScreen";

function SplashCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);

    const cx = W / 2;
    const cy = H / 2 - 10;
    const start = performance.now();
    let alive = true;
    let raf = 0;

    function clamp01(v: number) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function lerp(a: number, b: number, t: number) { return a + (b - a) * clamp01(t); }
    function easeOutCubic(t: number) { const c = 1 - t; return 1 - c * c * c; }
    function easeOutExpo(t: number) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function smoothstep(a: number, b: number, t: number) { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); }

    const rgb = (c: number[]) => `${c[0]},${c[1]},${c[2]}`;
    const R = Math.min(W, H) * 0.13;
    const LOGO_GAP = R * 0.72;

    // ── LEFT — Saturated deep purple ──
    const LEFT = {
      body: [120, 40, 220],
      bodyMid: [130, 55, 230],
      bodyLight: [145, 75, 240],
      edge: [85, 25, 180],
      edgeDark: [55, 15, 130],
      glow: [140, 60, 250],
      glowOuter: [90, 30, 200],
      highlight: [175, 120, 255],
      rim: [190, 145, 255],
    };

    // ── RIGHT — Soft pale lavender ──
    const RIGHT = {
      body: [200, 190, 245],
      bodyMid: [212, 204, 252],
      bodyLight: [220, 214, 255],
      edge: [170, 158, 220],
      edgeDark: [140, 128, 190],
      glow: [210, 200, 255],
      glowOuter: [180, 168, 235],
      highlight: [230, 225, 255],
      rim: [240, 236, 255],
    };

    function drawBg(alpha: number) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    function draw(now: number) {
      if (!alive) return;
      const t = (now - start) / 1000;
      const gFade = t > FADE_START ? clamp01(1 - (t - FADE_START) / (FADE_END - FADE_START)) : 1;

      drawBg(gFade);

      // ── Choreography ──
      const OPEN_IN = 1.1;
      let o1x = cx - LOGO_GAP, o1y = cy, o2x = cx + LOGO_GAP, o2y = cy;
      let o1a = 0, o2a = 0, o1s = 0, o2s = 0;
      let sx = 1, sy = 1;

      if (t < OPEN_IN) {
        const p = easeOutCubic(clamp01(t / OPEN_IN));
        const s = lerp(0.65, 1, p);
        o1a = p; o1s = s; o2a = p; o2s = s;
      } else if (t < FADE_START) {
        const b = 1 + Math.sin((t - OPEN_IN) * 2.0) * 0.008;
        o1a = 1; o1s = b; o2a = 1; o2s = b;
      } else {
        o1a = gFade; o2a = gFade;
      }

      // ══════════════════════════════════════════
      //  SPHERE — Frosted translucent glass
      // ══════════════════════════════════════════
      const drawSphere = (
        ox: number, oy: number, sc: number, alpha: number,
        stretchX: number, stretchY: number,
        pal: typeof LEFT
      ) => {
        if (alpha <= 0.01 || sc <= 0.01) return;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(stretchX * sc, stretchY * sc);

        // ── Soft ambient bloom ──
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.12;
        const bloom = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.8);
        bloom.addColorStop(0, `rgba(${rgb(pal.glow)},0.18)`);
        bloom.addColorStop(0.4, `rgba(${rgb(pal.glowOuter)},0.06)`);
        bloom.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";

        // ── Glass body — translucent, frosted ──
        ctx.globalAlpha = alpha * 0.78;
        const body = ctx.createRadialGradient(-R * 0.08, -R * 0.10, 0, 0, 0, R);
        body.addColorStop(0.00, `rgba(${rgb(pal.bodyLight)},0.85)`);
        body.addColorStop(0.18, `rgba(${rgb(pal.bodyMid)},0.78)`);
        body.addColorStop(0.40, `rgba(${rgb(pal.body)},0.65)`);
        body.addColorStop(0.65, `rgba(${rgb(pal.edge)},0.40)`);
        body.addColorStop(0.85, `rgba(${rgb(pal.edgeDark)},0.18)`);
        body.addColorStop(1.00, `rgba(${rgb(pal.edgeDark)},0.02)`);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();

        // ── Internal glow — subtle core ──
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.20;
        const core = ctx.createRadialGradient(-R * 0.06, -R * 0.08, 0, 0, 0, R * 0.65);
        core.addColorStop(0, `rgba(${rgb(pal.highlight)},0.30)`);
        core.addColorStop(0.4, `rgba(${rgb(pal.glow)},0.10)`);
        core.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // ── Top specular highlight ──
        ctx.globalAlpha = alpha * 0.35;
        const spec = ctx.createRadialGradient(-R * 0.18, -R * 0.28, 0, -R * 0.12, -R * 0.20, R * 0.30);
        spec.addColorStop(0, `rgba(${rgb(pal.rim)},0.40)`);
        spec.addColorStop(0.4, `rgba(${rgb(pal.highlight)},0.12)`);
        spec.addColorStop(1, `rgba(${rgb(pal.glow)},0)`);
        ctx.fillStyle = spec;
        ctx.beginPath();
        ctx.arc(-R * 0.15, -R * 0.22, R * 0.30, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";

        // ── Luminous edge ring — crisp, thin ──
        ctx.globalAlpha = alpha * 0.30;
        ctx.strokeStyle = `rgba(${rgb(pal.rim)},0.50)`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.98, 0, Math.PI * 2);
        ctx.stroke();

        // Outer edge — very subtle
        ctx.globalAlpha = alpha * 0.10;
        ctx.strokeStyle = `rgba(${rgb(pal.rim)},0.20)`;
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      };

      drawSphere(o1x, o1y, o1s, o1a, sx, sy, LEFT);
      drawSphere(o2x, o2y, o2s, o2a, 1, 1, RIGHT);

      // ══════════════════════════════════════════
      //  INTERSECTION — translucent blend
      // ══════════════════════════════════════════
      if (o1a > 0.3 && o2a > 0.3) {
        const halfDist = Math.abs(o2x - o1x) / 2;
        if (halfDist < R) {
          const overlapHalf = R - halfDist;
          const overlapR = overlapHalf / R;
          if (overlapR > 0.04) {
            const intX = (o1x + o2x) / 2;
            const intY = cy;
            const blendA = Math.min(o1a, o2a) * gFade;

            // Merged glow at intersection
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = blendA * overlapR * 0.15;
            const mg = ctx.createRadialGradient(intX, intY, 0, intX, intY, R * 2.5);
            mg.addColorStop(0, "rgba(180,160,240,0.22)");
            mg.addColorStop(0.3, "rgba(150,130,220,0.08)");
            mg.addColorStop(1, "rgba(120,100,200,0)");
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.arc(intX, intY, R * 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Clip and fill intersection zone
            ctx.save();
            const acosVal = Math.acos(clamp01(halfDist / R));
            ctx.beginPath();
            ctx.arc(o1x, o1y, R, -acosVal, acosVal);
            ctx.arc(o2x, o2y, R, Math.PI - acosVal, Math.PI + acosVal);
            ctx.closePath();
            ctx.clip();

            const gw = overlapHalf * 2;
            const ig = ctx.createLinearGradient(intX - gw / 2, intY, intX + gw / 2, intY);
            ig.addColorStop(0.00, "rgba(130,90,210,0.55)");
            ig.addColorStop(0.20, "rgba(155,120,225,0.60)");
            ig.addColorStop(0.40, "rgba(185,165,240,0.62)");
            ig.addColorStop(0.50, "rgba(200,190,248,0.60)");
            ig.addColorStop(0.60, "rgba(195,185,245,0.58)");
            ig.addColorStop(0.80, "rgba(185,175,240,0.52)");
            ig.addColorStop(1.00, "rgba(175,165,232,0.46)");

            ctx.globalAlpha = blendA * 0.72;
            ctx.fillStyle = ig;
            ctx.fillRect(intX - gw / 2 - 5, intY - R, gw + 10, R * 2);

            // Inner soft glow
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = blendA * overlapR * 0.18;
            const il = ctx.createRadialGradient(intX, intY, 0, intX, intY, overlapHalf * 1.2);
            il.addColorStop(0, "rgba(200,190,250,0.25)");
            il.addColorStop(0.4, "rgba(170,150,235,0.08)");
            il.addColorStop(1, "rgba(140,120,215,0)");
            ctx.fillStyle = il;
            ctx.beginPath();
            ctx.arc(intX, intY, overlapHalf * 1.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
      }

      // ══════════════════════════════════════════
      //  DIVIDER — Razor-sharp thin white line
      // ══════════════════════════════════════════
      if (t > 3.0 && t < FADE_START + 0.1) {
        const lineIn = smoothstep(3.0, 3.5, t);
        const lineOut = t > FADE_START ? smoothstep(FADE_END, FADE_START, t) : 1;
        const lineH = R * 2.6 * easeOutExpo(lineIn) * lineOut;
        const lineAlpha = lineIn * lineOut * gFade;

        ctx.save();

        // Very subtle outer glow
        ctx.globalAlpha = lineAlpha * 0.06;
        ctx.shadowColor = "rgba(255,255,255,0.15)";
        ctx.shadowBlur = 4;
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        // Core — razor-sharp white
        ctx.shadowBlur = 0;
        ctx.globalAlpha = lineAlpha * 0.85;
        ctx.strokeStyle = "rgba(255,255,255,0.90)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        ctx.restore();
      }

      // ── Final fade ──
      if (t > FADE_START) {
        ctx.globalAlpha = clamp01((t - FADE_START) / (FADE_END - FADE_START));
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, W, H);
      }

      ctx.globalAlpha = 1;

      if (t >= FADE_END + 0.05) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, W, H);
        return;
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={ref} className="apple-splash-canvas" />;
}
