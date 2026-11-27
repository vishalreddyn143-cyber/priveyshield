import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AmbientBackground3DProps {
  reducedMotion?: boolean;
  isScanning?: boolean;
  onContextLost?: () => void;
}

/**
 * Creates dynamic cybersecurity abstract canvas textures:
 * - Holographic Shield with circuit traces
 * - Encrypted Cyber Padlock with binary ring
 * - Cyber Circuit Processor with data nodes
 * - Radar / Targeting Security Reticle
 * - Hexagonal Honeycomb Security Barrier
 */
function createCyberTexture(type: 'shield' | 'lock' | 'circuit' | 'radar' | 'hex'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = 256;
  const cy = 256;
  ctx.clearRect(0, 0, 512, 512);

  if (type === 'shield') {
    // Holographic Cyber Shield
    const grad = ctx.createLinearGradient(128, 64, 384, 448);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(0.5, '#8b5cf6');
    grad.addColorStop(1, '#ec4899');

    // Outer glow shield path
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(cx, 70);
    ctx.lineTo(cx + 140, 120);
    ctx.quadraticCurveTo(cx + 150, 300, cx, 430);
    ctx.quadraticCurveTo(cx - 150, 300, cx - 140, 120);
    ctx.closePath();
    ctx.stroke();

    // Inner shield fill
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fill();

    // Inner shield border
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, 105);
    ctx.lineTo(cx + 105, 145);
    ctx.quadraticCurveTo(cx + 115, 280, cx, 390);
    ctx.quadraticCurveTo(cx - 115, 280, cx - 105, 145);
    ctx.closePath();
    ctx.stroke();

    // Center lock emblem
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 18;
    // Lock body
    ctx.fillRect(cx - 36, cy - 10, 72, 60);
    // Lock shackle
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(cx, cy - 16, 26, Math.PI, 0);
    ctx.stroke();
    // Keyhole
    ctx.fillStyle = '#050816';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx, cy + 12, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 3, cy + 16, 6, 16);

    // Circuit lines emanating
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 105, 200); ctx.lineTo(cx - 160, 200); ctx.lineTo(cx - 180, 170);
    ctx.moveTo(cx + 105, 200); ctx.lineTo(cx + 160, 200); ctx.lineTo(cx + 180, 230);
    ctx.moveTo(cx, 70); ctx.lineTo(cx, 30);
    ctx.stroke();
  } else if (type === 'lock') {
    // Encrypted Cyber Lock with Binary Ring
    const grad = ctx.createLinearGradient(80, 80, 432, 432);
    grad.addColorStop(0, '#a855f7');
    grad.addColorStop(0.5, '#ec4899');
    grad.addColorStop(1, '#f59e0b');

    // Concentric cyber rings
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.stroke();

    // Dotted dashed inner ring
    ctx.setLineDash([12, 16]);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hexagonal boundary
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = cx + Math.cos(angle) * 95;
      const hy = cy + Math.sin(angle) * 95;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    // Glowing keyhole
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.lineTo(cx + 16, cy + 40);
    ctx.lineTo(cx - 16, cy + 40);
    ctx.closePath();
    ctx.fill();

    // Binary code glyphs along edge
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
    ctx.shadowBlur = 8;
    const bits = ['1011', '0101', '1100', '0011', '1001', '1110', '0110', '1010'];
    bits.forEach((b, idx) => {
      const ang = (idx / bits.length) * Math.PI * 2;
      const bx = cx + Math.cos(ang) * 162;
      const by = cy + Math.sin(ang) * 162;
      ctx.fillText(b, bx - 14, by + 5);
    });
  } else if (type === 'circuit') {
    // Cyber Circuit & Data Processor
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#10b981');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(1, '#3b82f6');

    // Central processor chip
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 25;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = grad;
    ctx.lineWidth = 6;
    ctx.strokeRect(cx - 70, cy - 70, 140, 140);
    ctx.fillRect(cx - 70, cy - 70, 140, 140);

    // Inner chip diamond
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 45);
    ctx.lineTo(cx + 45, cy);
    ctx.lineTo(cx, cy + 45);
    ctx.lineTo(cx - 45, cy);
    ctx.closePath();
    ctx.stroke();

    // Branching circuit bus lines
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 4;
    const branches = [
      [[cx - 70, cy - 35], [cx - 160, cy - 35], [cx - 200, cy - 75]],
      [[cx - 70, cy + 35], [cx - 150, cy + 35], [cx - 190, cy + 85]],
      [[cx + 70, cy - 35], [cx + 150, cy - 35], [cx + 190, cy - 80]],
      [[cx + 70, cy + 35], [cx + 160, cy + 35], [cx + 200, cy + 70]],
      [[cx - 35, cy - 70], [cx - 35, cy - 150], [cx - 75, cy - 190]],
      [[cx + 35, cy - 70], [cx + 35, cy - 160], [cx + 80, cy - 200]],
      [[cx - 35, cy + 70], [cx - 35, cy + 150], [cx - 80, cy + 190]],
      [[cx + 35, cy + 70], [cx + 35, cy + 150], [cx + 75, cy + 190]],
    ];
    branches.forEach((b) => {
      ctx.beginPath();
      ctx.moveTo(b[0][0], b[0][1]);
      ctx.lineTo(b[1][0], b[1][1]);
      ctx.lineTo(b[2][0], b[2][1]);
      ctx.stroke();

      // Node dot at end
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(b[2][0], b[2][1], 7, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === 'radar') {
    // Cyber Security Radar Scanner Reticle
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.5, '#ec4899');
    grad.addColorStop(1, '#a855f7');

    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 20;

    // Concentric radar rings
    [60, 115, 170].forEach((r, idx) => {
      ctx.strokeStyle = idx === 1 ? '#fbbf24' : grad;
      ctx.lineWidth = idx === 1 ? 5 : 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 200, cy); ctx.lineTo(cx + 200, cy);
    ctx.moveTo(cx, cy - 200); ctx.lineTo(cx, cy + 200);
    ctx.stroke();

    // Radar sweep wedge
    const sweepGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 170);
    sweepGrad.addColorStop(0, 'rgba(245, 158, 11, 0.6)');
    sweepGrad.addColorStop(0.8, 'rgba(236, 72, 153, 0.2)');
    sweepGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 170, -Math.PI / 4, 0);
    ctx.closePath();
    ctx.fill();

    // Threat detection pips
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx + 85, cy - 50, 8, 0, Math.PI * 2);
    ctx.arc(cx - 65, cy + 90, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'hex') {
    // Hexagonal Honeycomb Security Barrier
    const grad = ctx.createLinearGradient(64, 64, 448, 448);
    grad.addColorStop(0, '#f43f5e');
    grad.addColorStop(0.5, '#a855f7');
    grad.addColorStop(1, '#06b6d4');

    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5;

    // Draw grid of honeycomb hexagons
    const hexRadius = 48;
    const dx = hexRadius * Math.sqrt(3);
    const dy = hexRadius * 1.5;
    const offsets = [
      [cx, cy],
      [cx + dx, cy],
      [cx - dx, cy],
      [cx + dx / 2, cy - dy],
      [cx - dx / 2, cy - dy],
      [cx + dx / 2, cy + dy],
      [cx - dx / 2, cy + dy],
    ];

    offsets.forEach(([ox, oy]) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i + Math.PI / 6;
        const hx = ox + Math.cos(ang) * hexRadius;
        const hy = oy + Math.sin(ang) * hexRadius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    });

    // Central "SECURED" cyber badge
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SECURED', cx, cy);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Full-viewport lazy-loaded Three.js background featuring:
 * - Animated rainbow cyber-wave wireframe plane
 * - Animated 3D cybersecurity holographic images (Shield, Padlock, Circuit, Radar, Hex Barrier)
 * - Multi-colored rotating polyhedra & orbital rings
 * - Rainbow drifting particle field with pointer parallax
 * - Twinkling neon starfield
 * - Spinning torus knots
 */
const AmbientBackground3D: React.FC<AmbientBackground3DProps> = ({
  reducedMotion = false,
  isScanning = false,
  onContextLost,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scanningRef = useRef<boolean>(isScanning);

  useEffect(() => {
    scanningRef.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 720;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      onContextLost?.();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#050816', 0.024);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 120);
    camera.position.set(0, 2, 13);

    // ── 1. Rainbow Cyber-Wave Grid ──────────────────────────────────────────
    const waveWidth = 52;
    const waveDepth = 34;
    const segX = 44;
    const segY = 30;
    const waveGeo = new THREE.PlaneGeometry(waveWidth, waveDepth, segX, segY);
    waveGeo.rotateX(-Math.PI / 2.2);
    const basePositions = Float32Array.from(
      (waveGeo.attributes.position as THREE.BufferAttribute).array
    );
    const waveMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#06b6d4'),
      wireframe: true,
      transparent: true,
      opacity: 0.24,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.position.set(0, -5, -6);
    scene.add(waveMesh);

    // Second wave layer (magenta / pink)
    const waveGeo2 = new THREE.PlaneGeometry(waveWidth * 0.8, waveDepth * 0.75, segX - 8, segY - 6);
    waveGeo2.rotateX(-Math.PI / 2.0);
    const basePositions2 = Float32Array.from(
      (waveGeo2.attributes.position as THREE.BufferAttribute).array
    );
    const waveMat2 = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ec4899'),
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    });
    const waveMesh2 = new THREE.Mesh(waveGeo2, waveMat2);
    waveMesh2.position.set(2, -6.5, -10);
    scene.add(waveMesh2);

    // ── 2. Cybersecurity 3D Abstract Holographic Visuals ────────────────────
    const cyberItems: Array<{
      mesh: THREE.Mesh;
      baseY: number;
      speedY: number;
      rotSpeedY: number;
      rotSpeedZ: number;
      tex: THREE.CanvasTexture;
      mat: THREE.MeshBasicMaterial;
      geo: THREE.PlaneGeometry;
    }> = [];

    const createHoloCyberMesh = (
      type: 'shield' | 'lock' | 'circuit' | 'radar' | 'hex',
      size: number,
      x: number,
      y: number,
      z: number,
      speedY: number,
      rotSpeedY: number,
      rotSpeedZ: number
    ) => {
      const tex = createCyberTexture(type);
      const geo = new THREE.PlaneGeometry(size, size);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      cyberItems.push({ mesh, baseY: y, speedY, rotSpeedY, rotSpeedZ, tex, mat, geo });
    };

    // 1. Central floating Cyber Shield hologram (left-center depth)
    createHoloCyberMesh('shield', 3.6, -5.5, 2.8, -5.5, 0.8, 0.22, 0.05);
    // 2. Encrypted Padlock with binary circle (right-center depth)
    createHoloCyberMesh('lock', 3.2, 5.8, 2.0, -4.8, 0.65, -0.25, -0.06);
    // 3. Cyber Circuit processor (lower left)
    createHoloCyberMesh('circuit', 3.4, -6.8, -1.8, -7.5, 0.5, 0.18, 0.12);
    // 4. Security Radar Reticle (upper center-right)
    createHoloCyberMesh('radar', 3.0, 3.8, 4.2, -8.0, 0.7, -0.35, 0.2);
    // 5. Honeycomb Security Barrier (upper center-left)
    createHoloCyberMesh('hex', 3.5, -2.0, 4.8, -9.5, 0.55, 0.15, -0.08);

    // ── 3. Multi-colored Wireframe Polyhedra ───────────────────────────────
    const makePolyhedron = (
      geo: THREE.BufferGeometry,
      color: string,
      x: number,
      y: number,
      z: number,
      opacity = 0.28
    ) => {
      const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return { mesh, mat, geo };
    };

    const p1 = makePolyhedron(new THREE.IcosahedronGeometry(1.8, 1), '#a855f7', -9, 2.5, -7);
    const p2 = makePolyhedron(new THREE.IcosahedronGeometry(1.3, 1), '#22d3ee', 9.5, 1.8, -6);
    const p3 = makePolyhedron(new THREE.OctahedronGeometry(1.4, 0), '#f59e0b', -4.5, -1, -9);
    const p4 = makePolyhedron(new THREE.OctahedronGeometry(1.0, 0), '#10b981', 5.5, 3.2, -8);
    const p5 = makePolyhedron(new THREE.DodecahedronGeometry(1.1, 0), '#f43f5e', 0.5, 4.5, -11);
    const p6 = makePolyhedron(new THREE.TetrahedronGeometry(1.2, 0), '#fb923c', -1, -2.5, -7);

    // ── 4. Color-Cycling Orbital Rings ─────────────────────────────────────
    const makeRing = (radius: number, tube: number, color: string, rx: number, ry: number, x = 0, y = 0, z = -9, opacity = 0.22) => {
      const geo = new THREE.TorusGeometry(radius, tube, 12, 100);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.x = rx;
      mesh.rotation.y = ry;
      scene.add(mesh);
      return { mesh, mat, geo };
    };

    const r1 = makeRing(5.2, 0.035, '#06b6d4',  Math.PI * 0.38,  0.0,  0, 0.5, -9, 0.28);
    const r2 = makeRing(7.2, 0.028, '#a855f7', -Math.PI * 0.3,  Math.PI * 0.2,  0, 0.5, -10, 0.22);
    const r3 = makeRing(3.6, 0.028, '#f43f5e',  Math.PI * 0.6, -Math.PI * 0.15, -3, 1, -7, 0.24);
    const r4 = makeRing(4.4, 0.022,  '#10b981', -Math.PI * 0.45, Math.PI * 0.3,   3, 0, -8, 0.22);
    const r5 = makeRing(8.8, 0.02,   '#f59e0b',  Math.PI * 0.15, Math.PI * 0.1,   0, 1, -13, 0.15);

    // ── 5. Torus Knots ─────────────────────────────────────────────────────
    const knotGeo1 = new THREE.TorusKnotGeometry(1.3, 0.28, 120, 16, 2, 3);
    const knotMat1 = new THREE.MeshBasicMaterial({ color: '#8b5cf6', wireframe: true, transparent: true, opacity: 0.25 });
    const knot1 = new THREE.Mesh(knotGeo1, knotMat1);
    knot1.position.set(-7.5, 0, -8);
    scene.add(knot1);

    const knotGeo2 = new THREE.TorusKnotGeometry(1.1, 0.22, 100, 14, 3, 4);
    const knotMat2 = new THREE.MeshBasicMaterial({ color: '#06b6d4', wireframe: true, transparent: true, opacity: 0.22 });
    const knot2 = new THREE.Mesh(knotGeo2, knotMat2);
    knot2.position.set(7.5, -0.5, -7);
    scene.add(knot2);

    // ── 6. Rainbow Particle Field ───────────────────────────────────────────
    const particleCount = 300;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const palette = [
      new THREE.Color('#06b6d4'),
      new THREE.Color('#3b82f6'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#ec4899'),
      new THREE.Color('#f43f5e'),
      new THREE.Color('#f59e0b'),
      new THREE.Color('#10b981'),
      new THREE.Color('#22d3ee'),
      new THREE.Color('#a855f7'),
      new THREE.Color('#fb923c'),
    ];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3]     = (Math.random() - 0.5) * 38;
      particlePositions[i * 3 + 1] = (Math.random() - 0.4) * 22;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 4;
      const col = palette[i % palette.length];
      particleColors[i * 3]     = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── 7. Neon Starfield ──────────────────────────────────────────────────
    const starCount = 200;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    const starPalette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#bfdbfe'),
      new THREE.Color('#ddd6fe'),
      new THREE.Color('#fce7f3'),
    ];
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 65;
      starPos[i * 3 + 1] = (Math.random() - 0.3) * 32;
      starPos[i * 3 + 2] = -20 - Math.random() * 32;
      const sc = starPalette[i % starPalette.length];
      starCol[i * 3]     = sc.r;
      starCol[i * 3 + 1] = sc.g;
      starCol[i * 3 + 2] = sc.b;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.75 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── Pointer parallax ───────────────────────────────────────────────────
    let targetCamX = 0;
    let targetCamY = 2;
    const handlePointerMove = (e: PointerEvent) => {
      if (reducedMotion) return;
      const nx = e.clientX / (window.innerWidth || 1) - 0.5;
      const ny = e.clientY / (window.innerHeight || 1) - 0.5;
      targetCamX = nx * 1.5;
      targetCamY = 2 - ny * 0.9;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      onContextLost?.();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const handleResize = () => {
      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 720;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const hslColor = (h: number, s = 0.9, l = 0.6) => {
      return new THREE.Color().setHSL(h % 1, s, l);
    };

    // ── Animation Loop ─────────────────────────────────────────────────────
    let rafId = 0;
    let elapsed = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!document.hidden && !reducedMotion) {
        const speedBoost = scanningRef.current ? 2.2 : 1.0;
        elapsed += dt * speedBoost;

        // ─ Wave 1: rainbow color cycle ─
        waveMat.color.copy(hslColor(elapsed * 0.08));
        const posAttr = waveGeo.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < posAttr.count; i++) {
          const ix = i * 3;
          const bx = basePositions[ix];
          const bz = basePositions[ix + 2];
          arr[ix + 1] =
            basePositions[ix + 1] +
            Math.sin(bx * 0.32 + elapsed * 1.25) * 0.65 +
            Math.cos(bz * 0.38 + elapsed * 0.95) * 0.45;
        }
        posAttr.needsUpdate = true;
        waveMat.opacity = scanningRef.current ? 0.38 : 0.24;

        // ─ Wave 2: pink / magenta cycle ─
        waveMat2.color.copy(hslColor(elapsed * 0.06 + 0.75));
        const posAttr2 = waveGeo2.attributes.position as THREE.BufferAttribute;
        const arr2 = posAttr2.array as Float32Array;
        for (let i = 0; i < posAttr2.count; i++) {
          const ix = i * 3;
          const bx = basePositions2[ix];
          const bz = basePositions2[ix + 2];
          arr2[ix + 1] =
            basePositions2[ix + 1] +
            Math.sin(bx * 0.28 + elapsed * 1.0 + 1.5) * 0.55 +
            Math.cos(bz * 0.33 + elapsed * 0.8) * 0.38;
        }
        posAttr2.needsUpdate = true;

        // ─ Animated 3D Cybersecurity Holograms ─
        cyberItems.forEach((item, idx) => {
          // 3D smooth bobbing
          item.mesh.position.y = item.baseY + Math.sin(elapsed * item.speedY + idx) * 0.6;
          // Smooth 3D tilt & rotation
          item.mesh.rotation.y += dt * item.rotSpeedY * speedBoost;
          item.mesh.rotation.z += dt * item.rotSpeedZ * speedBoost;
          item.mesh.rotation.x = Math.sin(elapsed * 0.5 + idx) * 0.15;
          // Pulsing glow opacity
          item.mat.opacity = (0.7 + Math.sin(elapsed * 1.5 + idx * 0.8) * 0.18) * (scanningRef.current ? 1.25 : 1.0);
        });

        // ─ Polyhedra ─
        p1.mat.color.copy(hslColor(elapsed * 0.07));
        p2.mat.color.copy(hslColor(elapsed * 0.07 + 0.3));
        p3.mat.color.copy(hslColor(elapsed * 0.07 + 0.55));
        p4.mat.color.copy(hslColor(elapsed * 0.07 + 0.15));
        p5.mat.color.copy(hslColor(elapsed * 0.07 + 0.8));
        p6.mat.color.copy(hslColor(elapsed * 0.07 + 0.45));

        p1.mesh.rotation.x += dt * 0.2 * speedBoost;
        p1.mesh.rotation.y += dt * 0.28 * speedBoost;
        p1.mesh.position.y = 2.5 + Math.sin(elapsed * 0.75) * 0.45;

        p2.mesh.rotation.x -= dt * 0.22 * speedBoost;
        p2.mesh.rotation.y -= dt * 0.18 * speedBoost;
        p2.mesh.position.y = 1.8 + Math.cos(elapsed * 0.7) * 0.38;

        p3.mesh.rotation.x += dt * 0.3 * speedBoost;
        p3.mesh.rotation.z += dt * 0.2 * speedBoost;
        p3.mesh.position.y = -1 + Math.sin(elapsed * 0.55 + 1) * 0.5;

        p4.mesh.rotation.y += dt * 0.25 * speedBoost;
        p4.mesh.rotation.z -= dt * 0.18 * speedBoost;
        p4.mesh.position.y = 3.2 + Math.cos(elapsed * 0.8 + 2) * 0.4;

        p5.mesh.rotation.x -= dt * 0.15 * speedBoost;
        p5.mesh.rotation.y += dt * 0.22 * speedBoost;
        p5.mesh.position.y = 4.5 + Math.sin(elapsed * 0.6 + 0.5) * 0.55;

        p6.mesh.rotation.x += dt * 0.35 * speedBoost;
        p6.mesh.rotation.y -= dt * 0.3 * speedBoost;
        p6.mesh.position.y = -2.5 + Math.cos(elapsed * 0.9) * 0.42;

        // ─ Rings ─
        r1.mat.color.copy(hslColor(elapsed * 0.05));
        r2.mat.color.copy(hslColor(elapsed * 0.05 + 0.25));
        r3.mat.color.copy(hslColor(elapsed * 0.05 + 0.6));
        r4.mat.color.copy(hslColor(elapsed * 0.05 + 0.42));
        r5.mat.color.copy(hslColor(elapsed * 0.05 + 0.85));

        r1.mesh.rotation.z += dt * 0.14 * speedBoost;
        r2.mesh.rotation.z -= dt * 0.1 * speedBoost;
        r3.mesh.rotation.z += dt * 0.18 * speedBoost;
        r4.mesh.rotation.z -= dt * 0.13 * speedBoost;
        r5.mesh.rotation.z += dt * 0.07 * speedBoost;

        // ─ Torus knots ─
        knotMat1.color.copy(hslColor(elapsed * 0.09 + 0.7));
        knotMat2.color.copy(hslColor(elapsed * 0.09 + 0.5));
        knot1.rotation.x += dt * 0.22 * speedBoost;
        knot1.rotation.y += dt * 0.18 * speedBoost;
        knot1.position.y = Math.sin(elapsed * 0.5) * 1.0;
        knot2.rotation.x -= dt * 0.18 * speedBoost;
        knot2.rotation.z += dt * 0.22 * speedBoost;
        knot2.position.y = Math.cos(elapsed * 0.55 + 1) * 0.9 - 0.5;

        // ─ Particles ─
        const pAttr = particleGeo.attributes.position as THREE.BufferAttribute;
        const pArr = pAttr.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const iy = i * 3 + 1;
          const ix = i * 3;
          pArr[iy] += dt * (0.24 + (i % 5) * 0.06) * speedBoost;
          pArr[ix] += Math.sin(elapsed * 0.3 + i * 0.4) * dt * 0.09;
          if (pArr[iy] > 12) pArr[iy] = -8.5;
        }
        pAttr.needsUpdate = true;
        particles.rotation.y = Math.sin(elapsed * 0.08) * 0.18;

        // ─ Stars ─
        starMat.opacity = 0.6 + Math.sin(elapsed * 1.8) * 0.18;

        // ─ Camera parallax ─
        camera.position.x += (targetCamX - camera.position.x) * 0.035;
        camera.position.y += (targetCamY - camera.position.y) * 0.035;
        camera.lookAt(0, 0, -4);
      }

      renderer.render(scene, camera);
      if (!reducedMotion) {
        rafId = requestAnimationFrame(animate);
      }
    };

    renderer.render(scene, camera);
    if (!reducedMotion) {
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);

      // Dispose cybersecurity items
      cyberItems.forEach((ci) => {
        ci.geo.dispose();
        ci.mat.dispose();
        ci.tex.dispose();
      });

      waveGeo.dispose(); waveMat.dispose();
      waveGeo2.dispose(); waveMat2.dispose();
      p1.geo.dispose(); p1.mat.dispose();
      p2.geo.dispose(); p2.mat.dispose();
      p3.geo.dispose(); p3.mat.dispose();
      p4.geo.dispose(); p4.mat.dispose();
      p5.geo.dispose(); p5.mat.dispose();
      p6.geo.dispose(); p6.mat.dispose();
      r1.geo.dispose(); r1.mat.dispose();
      r2.geo.dispose(); r2.mat.dispose();
      r3.geo.dispose(); r3.mat.dispose();
      r4.geo.dispose(); r4.mat.dispose();
      r5.geo.dispose(); r5.mat.dispose();
      knotGeo1.dispose(); knotMat1.dispose();
      knotGeo2.dispose(); knotMat2.dispose();
      particleGeo.dispose(); particleMat.dispose();
      starGeo.dispose(); starMat.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion, onContextLost]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      aria-hidden="true"
      role="presentation"
    />
  );
};

export default AmbientBackground3D;
