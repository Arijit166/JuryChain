'use client';

import { useEffect, useRef, useState } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulsePhase: number;
  type: 'hex' | 'circle';
}

export function BackgroundEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const nodesRef = useRef<Node[]>([]);
  const animFrameRef = useRef<number>(0);
  const [isHovering, setIsHovering] = useState(false);
  const isHoveringRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    };

    const initNodes = () => {
      const count = Math.floor((canvas.width * canvas.height) / 18000);
      nodesRef.current = Array.from({ length: Math.min(count, 60) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.5 + 1.5,
        opacity: Math.random() * 0.5 + 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
        type: Math.random() > 0.5 ? 'hex' : 'circle',
      }));
    };

    const drawHex = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number
    ) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const CONNECTION_DIST = 140;
    const MOUSE_INFLUENCE = 180;

    let time = 0;

    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.012;

      const mouse = mouseRef.current;
      const nodes = nodesRef.current;

      // Move nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -20) node.x = canvas.width + 20;
        if (node.x > canvas.width + 20) node.x = -20;
        if (node.y < -20) node.y = canvas.height + 20;
        if (node.y > canvas.height + 20) node.y = -20;

        // Mouse repulsion
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_INFLUENCE) {
          const force = (MOUSE_INFLUENCE - dist) / MOUSE_INFLUENCE;
          node.vx += (dx / dist) * force * 0.06;
          node.vy += (dy / dist) * force * 0.06;
          // dampen
          node.vx *= 0.97;
          node.vy *= 0.97;
        }
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.45;

            // Mouse proximity boosts edge brightness
            const mx1 = (nodes[i].x - mouse.x);
            const my1 = (nodes[i].y - mouse.y);
            const mouseDist = Math.sqrt(mx1 * mx1 + my1 * my1);
            const boost = mouseDist < 200 ? (1 - mouseDist / 200) * 0.5 : 0;

            const lgrad = ctx.createLinearGradient(
              nodes[i].x, nodes[i].y,
              nodes[j].x, nodes[j].y
            );
            lgrad.addColorStop(0, `rgba(0,217,255,${Math.min(alpha + boost, 0.7)})`);
            lgrad.addColorStop(1, `rgba(157,78,221,${Math.min(alpha + boost, 0.7)})`);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = lgrad;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const pulse = Math.sin(time * 1.5 + node.pulsePhase) * 0.3 + 0.7;
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseBoost = dist < 200 ? (1 - dist / 200) * 1.5 : 0;
        const finalOpacity = Math.min(node.opacity * pulse + mouseBoost * 0.4, 1);

        // Glow
        const grd = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.radius * 6
        );
        grd.addColorStop(0, `rgba(0,217,255,${finalOpacity * 0.4})`);
        grd.addColorStop(1, 'rgba(0,217,255,0)');
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 6, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Node shape
        if (node.type === 'hex') {
          drawHex(ctx, node.x, node.y, node.radius * 2.2);
          ctx.strokeStyle = `rgba(0,217,255,${finalOpacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(157,78,221,${finalOpacity})`;
          ctx.fill();
        }
      }

      // Mouse spotlight radial gradient overlay
      if (isHoveringRef.current) {
        const spotlight = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, 380
        );
        spotlight.addColorStop(0, 'rgba(0,217,255,0.07)');
        spotlight.addColorStop(0.4, 'rgba(157,78,221,0.04)');
        spotlight.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = spotlight;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      isHoveringRef.current = true;
      setIsHovering(true);
    };
    const handleMouseLeave = () => {
      isHoveringRef.current = false;
      setIsHovering(false);
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: isHovering ? 1 : 0.75, transition: 'opacity 0.4s ease' }}
    />
  );
}
