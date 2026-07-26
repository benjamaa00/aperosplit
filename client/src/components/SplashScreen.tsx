import { useState, useEffect, memo, useRef } from "react";

const SPLASH_DURATION = 5400;
const FADE_START = 4.4;
const FADE_END = 5.4;

export const SplashScreen = memo(function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [brandVisible, setBrandVisible] = useState(false);
  const [brandFading, setBrandFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setBrandVisible(true), 3200);
    const t2 = setTimeout(() => setBrandFading(true), FADE_START * 1000);
    const t3 = setTimeout(() => onCompleteRef.current(), SPLASH_DURATION + 100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="apple-splash" style={{ background: "#0C0C0E" }}>
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
    const cy = H / 2 - 20;
    const start = performance.now();
    let alive = true;
    let raf = 0;

    // ── Math helpers ──
    function clamp01(v: number) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function lerp(a: number, b: number, t: number) { return a + (b - a) * clamp01(t); }
    function easeOutCubic(t: number) { const c = 1 - t; return 1 - c * c * c; }
    function easeOutExpo(t: number) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function smoothstep(a: number, b: number, t: number) { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); }
    function springClamp(t: number, damping: number, freq: number) {
      if (t <= 0) return 0; if (t >= 1) return 1;
      return 1 - Math.exp(-damping * t * 8) * Math.cos(freq * t * Math.PI * 2.5);
    }

    const rgb = (c: number[]) => `${c[0]},${c[1]},${c[2]}`;

    // ── Sphere radius: ~50% viewport width ──
    const R = Math.min(W, H) * 0.12;
    const LOGO_GAP = R * 0.76; // ~24% overlap

    // ── LEFT SPHERE — Vivid electric violet ──
    const LEFT = {
      c0: [114, 64, 252],    // center: #7240FC
      c1: [122, 82, 255],    // main mid: #7A52FF
      c2: [134, 90, 254],    // between mid
      c3: [145, 101, 251],   // upper light: #9165FB
      c4: [109, 58, 252],    // lower dense: #6D3AFC
      c5: [106, 68, 214],    // outer edge: #6A44D6
      edge: [96, 52, 200],   // dark rim
      glowInner: [110, 71, 247],  // #6E47F7
      glowMid: [139, 108, 251],   // #8B6CFB
      glowOuter: [96, 52, 230],
      highlight: [166, 139, 250],  // near intersection: #A68BFA
      subsurface: [140, 105, 252],
    };

    // ── RIGHT SPHERE — Pale frosted lavender-white glass ──
    const RIGHT = {
      c0: [195, 179, 250],   // center: #C3B3FA
      c1: [209, 198, 255],   // main mid: #D1C6FF
      c2: [213, 198, 252],   // upper light: #D5C6FC
      c3: [205, 192, 252],   // between
      c4: [194, 177, 252],   // lower soft: #C2B1FC
      c5: [180, 167, 226],   // outer edge: #B4A7E2
      edge: [168, 155, 215], // darker rim
      glowInner: [207, 194, 250],  // #CFC2FA
      glowMid: [226, 218, 255],    // #E2DAFF
      glowOuter: [195, 180, 240],
      highlight: [220, 212, 252],
      subsurface: [200, 188, 250],
    };

    // ── Background — #0C0C0E, dark minimal with violet depth ──
    function drawBackground(alpha: number) {
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = "source-over";
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.72);
      bg.addColorStop(0, "#0C0C0E");
      bg.addColorStop(0.30, "#0B0B0D");
      bg.addColorStop(0.60, "#080809");
      bg.addColorStop(1, "#060607");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // ══════════════════════════════════════════════════════════════
    //  CHOREOGRAPHY (5.4s)
    // ══════════════════════════════════════════════════════════════

    function draw(now: number) {
      if (!alive) return;
      const t = (now - start) / 1000;
      const globalFade = t > FADE_START ? clamp01(1 - (t - FADE_START) / (FADE_END - FADE_START)) : 1;

      drawBackground(globalFade);

      // ── Compute positions ──
      let o1x = cx, o1y = cy, o2x = cx, o2y = cy;
      let o1a = 0, o2a = 0, o1s = 0, o2s = 0;
      let stretchXS = 1, stretchYS = 1;

      if (t < 0.70) {
        const p = easeOutCubic(clamp01(t / 0.65));
        o1a = p; o1s = p; o2a = 0; o2s = 0;
      } else if (t < 1.20) {
        const bp = (t - 0.70) / 0.50;
        const breath = Math.sin(bp * Math.PI * 2.5) * 0.04;
        o1a = 1; o1s = 1 + breath; o2a = 0; o2s = 0;
      } else if (t < 1.65) {
        const sp = easeInOutCubic(clamp01((t - 1.20) / 0.45));
        o1a = 1; o1s = 1; o2a = 0; o2s = 0;
        stretchXS = 1 + sp * 0.45;
        stretchYS = 1 - sp * 0.12;
      } else if (t < 2.10) {
        const mp = clamp01((t - 1.65) / 0.40);
        const dist = easeOutCubic(mp) * R * 2.1;
        o1a = 1; o1s = 1;
        o2a = easeOutCubic(clamp01((t - 1.65) / 0.30));
        o2s = o2a;
        o1x = cx - dist; o1y = cy;
        o2x = cx + dist; o2y = cy;
      } else if (t < 2.60) {
        const dp = clamp01((t - 2.10) / 0.50);
        const drift = lerp(R * 2.1, R * 2.2, easeOutCubic(dp));
        o1a = 1; o1s = 1; o2a = 1; o2s = 1;
        o1x = cx - drift; o1y = cy;
        o2x = cx + drift; o2y = cy;
      } else if (t < 3.30) {
        const rp = clamp01((t - 2.60) / 0.65);
        const rEase = springClamp(rp, 0.6, 2);
        const gap = lerp(R * 2.2, LOGO_GAP, rEase);
        o1a = 1; o1s = 1; o2a = 1; o2s = 1;
        o1x = cx - gap; o1y = cy;
        o2x = cx + gap; o2y = cy;
      } else if (t < 3.80) {
        const hold = t - 3.30;
        const sp = 1 + Math.sin(hold * 2.2) * 0.012;
        o1a = 1; o1s = sp; o2a = 1; o2s = sp;
        o1x = cx - LOGO_GAP; o1y = cy;
        o2x = cx + LOGO_GAP; o2y = cy;
      } else if (t < FADE_START) {
        o1a = 1; o1s = 1; o2a = 1; o2s = 1;
        o1x = cx - LOGO_GAP; o1y = cy;
        o2x = cx + LOGO_GAP; o2y = cy;
      } else {
        o1a = globalFade; o1s = 1; o2a = globalFade; o2s = 1;
        o1x = cx - LOGO_GAP; o1y = cy;
        o2x = cx + LOGO_GAP; o2y = cy;
      }

      // ══════════════════════════════════════════════════════════════
      //  SPHERE RENDERING — Premium frosted optical glass
      //
      //  8-stop body gradient, broad diffused highlight,
      //  controlled 3-zone glow, minimal rim.
      // ══════════════════════════════════════════════════════════════

      const drawSphere = (
        ox: number, oy: number, scale: number, alpha: number,
        sx: number, sy: number,
        pal: typeof LEFT
      ) => {
        if (alpha <= 0.01 || scale <= 0.01) return;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(sx * scale, sy * scale);

        // ── GLOW ZONE C: Ambient glow (wide, very soft) ──
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.06;
        const ambGlow = ctx.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 2.8);
        ambGlow.addColorStop(0, `rgba(${rgb(pal.glowInner)},0.10)`);
        ambGlow.addColorStop(0.5, `rgba(${rgb(pal.glowOuter)},0.03)`);
        ambGlow.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = ambGlow;
        ctx.beginPath();
        ctx.arc(0, 0, R * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // ── GLOW ZONE B: Medium glow ──
        ctx.globalAlpha = alpha * 0.14;
        const midGlow = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, R * 1.5);
        midGlow.addColorStop(0, `rgba(${rgb(pal.glowMid)},0.20)`);
        midGlow.addColorStop(0.5, `rgba(${rgb(pal.glowOuter)},0.07)`);
        midGlow.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = midGlow;
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // ── GLOW ZONE A: Close glow (tight, luminous) ──
        ctx.globalAlpha = alpha * 0.22;
        const closeGlow = ctx.createRadialGradient(0, 0, R * 0.35, 0, 0, R * 1.10);
        closeGlow.addColorStop(0, `rgba(${rgb(pal.glowInner)},0.32)`);
        closeGlow.addColorStop(0.5, `rgba(${rgb(pal.glowMid)},0.12)`);
        closeGlow.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = closeGlow;
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.10, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";

        // ── GLASS BODY — 8-stop radial, smooth & full ──
        ctx.globalAlpha = alpha;
        const body = ctx.createRadialGradient(-R * 0.05, -R * 0.05, 0, 0, 0, R);
        body.addColorStop(0.00, `rgba(${rgb(pal.c0)},0.98)`);
        body.addColorStop(0.15, `rgba(${rgb(pal.c1)},0.97)`);
        body.addColorStop(0.30, `rgba(${rgb(pal.c2)},0.95)`);
        body.addColorStop(0.48, `rgba(${rgb(pal.c3)},0.93)`);
        body.addColorStop(0.65, `rgba(${rgb(pal.c4)},0.88)`);
        body.addColorStop(0.80, `rgba(${rgb(pal.c5)},0.70)`);
        body.addColorStop(0.92, `rgba(${rgb(pal.edge)},0.35)`);
        body.addColorStop(1.00, `rgba(${rgb(pal.edge)},0.06)`);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();

        // ── BROAD DIFFUSED HIGHLIGHT — upper-left, warm violet ──
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.30;
        const hl = ctx.createRadialGradient(-R * 0.22, -R * 0.25, 0, -R * 0.10, -R * 0.12, R * 0.42);
        hl.addColorStop(0.00, `rgba(${rgb(pal.highlight)},0.35)`);
        hl.addColorStop(0.25, `rgba(${rgb(pal.highlight)},0.18)`);
        hl.addColorStop(0.55, `rgba(${rgb(pal.glowInner)},0.06)`);
        hl.addColorStop(0.85, `rgba(${rgb(pal.glowOuter)},0.02)`);
        hl.addColorStop(1.00, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = hl;
        ctx.beginPath();
        ctx.arc(-R * 0.14, -R * 0.16, R * 0.42, 0, Math.PI * 2);
        ctx.fill();

        // ── TOP SHADOW — clean dark crescent at top ──
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = alpha * 0.60;
        const topShadow = ctx.createRadialGradient(0, -R * 0.92, R * 0.08, 0, -R * 0.20, R * 0.85);
        topShadow.addColorStop(0, `rgba(${rgb(pal.edge)},0.65)`);
        topShadow.addColorStop(0.30, `rgba(${rgb(pal.glowOuter)},0.30)`);
        topShadow.addColorStop(0.60, `rgba(${rgb(pal.glowOuter)},0.06)`);
        topShadow.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = topShadow;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();

        // ── BOTTOM LUMINOSITY — bright glow from below ──
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.22;
        const bottomGlow = ctx.createRadialGradient(0, R * 0.82, R * 0.06, 0, R * 0.40, R * 0.60);
        bottomGlow.addColorStop(0, `rgba(${rgb(pal.highlight)},0.38)`);
        bottomGlow.addColorStop(0.25, `rgba(${rgb(pal.subsurface)},0.18)`);
        bottomGlow.addColorStop(0.55, `rgba(${rgb(pal.glowInner)},0.06)`);
        bottomGlow.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = bottomGlow;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();

        // ── RIM — very thin edge definition ──
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = alpha * 0.05;
        ctx.strokeStyle = `rgba(${rgb(pal.highlight)},0.18)`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.97, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      };

      // Draw both spheres
      drawSphere(o1x, o1y, o1s, o1a, stretchXS, stretchYS, LEFT);
      drawSphere(o2x, o2y, o2s, o2a, 1, 1, RIGHT);

      // ══════════════════════════════════════════════════════════════
      //  AMBIENT ATMOSPHERE — subtle violet wash behind composition
      // ══════════════════════════════════════════════════════════════
      if (o1a > 0.3 && o2a > 0.3) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.min(o1a, o2a) * 0.10 * globalFade;
        const atmo = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 4.0);
        atmo.addColorStop(0, "rgba(114,64,252,0.12)");  // #7240FC
        atmo.addColorStop(0.35, "rgba(110,71,247,0.05)"); // #6E47F7
        atmo.addColorStop(0.7, "rgba(96,52,230,0.02)");
        atmo.addColorStop(1, "rgba(80,40,200,0)");
        ctx.fillStyle = atmo;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 4.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ══════════════════════════════════════════════════════════════
      //  INTERSECTION — vesica piscis, violet-dominant
      // ══════════════════════════════════════════════════════════════
      if (o1a > 0.4 && o2a > 0.4) {
        const halfDist = Math.abs(o2x - o1x) / 2;
        if (halfDist < R) {
          const overlapHalf = R - halfDist;
          const overlapRatio = overlapHalf / R;
          if (overlapRatio > 0.05) {
            const intX = (o1x + o2x) / 2;
            const intY = cy;
            const blendA = Math.min(o1a, o2a) * globalFade;

            // ── Merged glow — #C6B8FF atmosphere ──
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = blendA * overlapRatio * 0.18;
            const mg = ctx.createRadialGradient(intX, intY, 0, intX, intY, R * 3.2);
            mg.addColorStop(0, "rgba(198,184,255,0.28)");  // #C6B8FF
            mg.addColorStop(0.20, "rgba(180,165,252,0.14)");
            mg.addColorStop(0.45, "rgba(140,115,245,0.06)");
            mg.addColorStop(0.70, `rgba(${rgb(LEFT.glowOuter)},0.02)`);
            mg.addColorStop(1, `rgba(${rgb(LEFT.glowOuter)},0)`);
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.arc(intX, intY, R * 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ── Intersection body — vesica piscis clip ──
            ctx.save();
            const acosVal = Math.acos(clamp01(halfDist / R));
            ctx.beginPath();
            ctx.arc(o1x, o1y, R, -acosVal, acosVal);
            ctx.arc(o2x, o2y, R, Math.PI - acosVal, Math.PI + acosVal);
            ctx.closePath();
            ctx.clip();

            // Optical glass fusion — mauve dominant, NOT white
            const gw = overlapHalf * 2;
            const ig = ctx.createLinearGradient(intX - gw / 2, intY, intX + gw / 2, intY);
            ig.addColorStop(0.00, "rgba(160,136,249,0.80)");  // #A088F9 left
            ig.addColorStop(0.15, "rgba(166,139,250,0.84)");  // #A68BFA
            ig.addColorStop(0.35, "rgba(190,175,254,0.88)");
            ig.addColorStop(0.50, "rgba(230,222,254,0.86)");  // #E6DEFE center
            ig.addColorStop(0.65, "rgba(210,198,254,0.84)");
            ig.addColorStop(0.85, "rgba(195,178,250,0.80)");  // #C3B2FA right
            ig.addColorStop(1.00, "rgba(195,178,250,0.76)");  // #C3B2FA

            ctx.globalAlpha = blendA * 0.88;
            ctx.fillStyle = ig;
            ctx.fillRect(intX - gw / 2 - 5, intY - R, gw + 10, R * 2);

            // ── Inner luminosity — soft mauve core ──
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = blendA * overlapRatio * 0.32;
            const il = ctx.createRadialGradient(intX, intY, 0, intX, intY, overlapHalf * 1.3);
            il.addColorStop(0.00, "rgba(230,222,254,0.38)");  // #E6DEFE
            il.addColorStop(0.30, "rgba(198,184,255,0.18)");  // #C6B8FF
            il.addColorStop(0.65, `rgba(${rgb(LEFT.glowMid)},0.05)`);
            il.addColorStop(1.00, `rgba(${rgb(LEFT.glowOuter)},0)`);
            ctx.fillStyle = il;
            ctx.beginPath();
            ctx.arc(intX, intY, overlapHalf * 1.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
      }

      // ── Split flash (1.55–2.0s) ──
      if (t > 1.55 && t < 2.05) {
        const ft = clamp01((t - 1.55) / 0.50);
        const fa = ft < 0.1 ? ft / 0.1 : Math.pow(1 - (ft - 0.1) / 0.9, 3);
        const intensity = 0.55 * fa * globalFade;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        ctx.globalAlpha = intensity;
        const fc1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
        fc1.addColorStop(0, "rgba(230,222,254,0.50)");   // #E6DEFE
        fc1.addColorStop(0.25, "rgba(198,184,255,0.28)"); // #C6B8FF
        fc1.addColorStop(0.60, `rgba(${rgb(LEFT.glowMid)},0.10)`);
        fc1.addColorStop(1, `rgba(${rgb(LEFT.glowOuter)},0)`);
        ctx.fillStyle = fc1;
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2); ctx.fill();

        ctx.globalAlpha = intensity * 0.22;
        const fc2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 4.0);
        fc2.addColorStop(0, "rgba(198,184,255,0.15)");
        fc2.addColorStop(0.35, `rgba(${rgb(LEFT.glowMid)},0.04)`);
        fc2.addColorStop(1, `rgba(${rgb(LEFT.glowOuter)},0)`);
        ctx.fillStyle = fc2;
        ctx.beginPath(); ctx.arc(cx, cy, R * 4.0, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
      }

      // ══════════════════════════════════════════════════════════════
      //  DIVIDER — very thin, elegant, secondary
      // ══════════════════════════════════════════════════════════════
      if (t > 3.0 && t < FADE_START + 0.1) {
        const lineIn = smoothstep(3.0, 3.5, t);
        const lineOut = t > FADE_START ? smoothstep(FADE_END, FADE_START, t) : 1;
        const lineH = R * 2.5 * easeOutExpo(lineIn) * lineOut;
        const lineAlpha = lineIn * lineOut * globalFade;

        ctx.save();

        // Outer glow — 2px, soft
        ctx.globalAlpha = lineAlpha * 0.12;
        ctx.shadowColor = "rgba(198,184,255,0.30)";
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        const gl = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        gl.addColorStop(0, "rgba(251,249,254,0)");
        gl.addColorStop(0.12, "rgba(228,224,241,0.25)");
        gl.addColorStop(0.5, "rgba(197,193,213,0.35)");
        gl.addColorStop(0.88, "rgba(228,224,241,0.25)");
        gl.addColorStop(1, "rgba(251,249,254,0)");
        ctx.strokeStyle = gl;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        // Core — 1px, #FBF9FE
        ctx.shadowBlur = 0;
        ctx.globalAlpha = lineAlpha * 0.65;
        ctx.lineWidth = 1;
        const cl = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        cl.addColorStop(0, "rgba(251,249,254,0)");
        cl.addColorStop(0.08, "rgba(228,224,241,0.50)");
        cl.addColorStop(0.20, "rgba(251,249,254,0.72)");
        cl.addColorStop(0.50, "rgba(251,249,254,0.72)");
        cl.addColorStop(0.80, "rgba(251,249,254,0.72)");
        cl.addColorStop(0.92, "rgba(228,224,241,0.50)");
        cl.addColorStop(1, "rgba(251,249,254,0)");
        ctx.strokeStyle = cl;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        ctx.restore();
      }

      // ── Vignette ──
      if (t > 0.15) {
        const va = Math.min(0.30, (t - 0.15) * 0.18) * (t < FADE_START ? 1 : globalFade);
        ctx.globalAlpha = va;
        const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.14, cx, cy, Math.max(W, H) * 0.68);
        vg.addColorStop(0, "rgba(12,12,14,0)");
        vg.addColorStop(0.5, "rgba(12,12,14,0.08)");
        vg.addColorStop(1, "rgba(12,12,14,0.45)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Final fade ──
      if (t > FADE_START) {
        ctx.globalAlpha = clamp01((t - FADE_START) / (FADE_END - FADE_START));
        ctx.fillStyle = "#0C0C0E";
        ctx.fillRect(0, 0, W, H);
      }

      ctx.globalAlpha = 1;

      if (t >= FADE_END + 0.05) {
        ctx.fillStyle = "#0C0C0E";
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
