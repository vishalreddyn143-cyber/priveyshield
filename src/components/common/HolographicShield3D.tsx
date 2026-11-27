import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HolographicShield3DProps {
  variant?: 'hero' | 'proof';
  accentColor?: string;
  reducedMotion?: boolean;
  onContextLost?: () => void;
}

/**
 * High-fidelity 3D Holographic Cyber Defense Shield featuring:
 * 1. Extruded multi-layer shield with dark glass core & dual glowing neon wireframes
 * 2. Rotating inner Quantum Core (faceted crystal with spectral neon glow)
 * 3. Triple gyroscope orbital rings with independent multi-axis counter-rotations
 * 4. Four orbiting cyber satellite defense nodes with glowing light trails
 * 5. Holographic radar scanner base grid with rotating degree ticks
 * 6. Dual-helix glowing particle stream (cyan & purple data swarm)
 * 7. Interactive 3D mouse parallax with dynamic specular glints
 */
const HolographicShield3D: React.FC<HolographicShield3DProps> = ({
  variant = 'hero',
  accentColor = '#06b6d4',
  reducedMotion = false,
  onContextLost,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      onContextLost?.();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, variant === 'hero' ? 6.5 : 5.6);

    const parsedAccent = new THREE.Color(accentColor);
    const cyanColor = new THREE.Color('#22d3ee');
    const purpleColor = new THREE.Color('#c084fc');
    const pinkColor = new THREE.Color('#f472b6');
    const emeraldColor = new THREE.Color('#34d399');

    // ── 1. Shield Silhouette & Extrusion ────────────────────────────────────
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 1.6);
    shieldShape.lineTo(1.2, 1.15);
    shieldShape.lineTo(1.12, -0.05);
    shieldShape.quadraticCurveTo(0.98, -1.1, 0, -1.65);
    shieldShape.quadraticCurveTo(-0.98, -1.1, -1.12, -0.05);
    shieldShape.lineTo(-1.2, 1.15);
    shieldShape.closePath();

    const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 3,
    });
    shieldGeo.center();

    // Dark cyber-glass core
    const coreMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#0a1026'),
      emissive: parsedAccent,
      emissiveIntensity: 0.35,
      specular: new THREE.Color('#ffffff'),
      shininess: 120,
      transparent: true,
      opacity: 0.78,
    });

    // Outer bright neon wireframe
    const wireMatOuter = new THREE.MeshBasicMaterial({
      color: cyanColor,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });

    // Inner purple wireframe accent
    const wireMatInner = new THREE.MeshBasicMaterial({
      color: purpleColor,
      wireframe: true,
      transparent: true,
      opacity: 0.38,
    });

    const shieldGroup = new THREE.Group();
    const shieldCore = new THREE.Mesh(shieldGeo, coreMat);
    const shieldWireOuter = new THREE.Mesh(shieldGeo, wireMatOuter);
    shieldWireOuter.scale.setScalar(1.03);
    const shieldWireInner = new THREE.Mesh(shieldGeo, wireMatInner);
    shieldWireInner.scale.setScalar(0.96);

    shieldGroup.add(shieldCore, shieldWireOuter, shieldWireInner);

    // ── 2. Quantum Crystal Core (floating energy diamond) ───────────────────
    const crystalGeo = new THREE.OctahedronGeometry(0.48, 0);
    const crystalMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#22d3ee'),
      emissive: purpleColor,
      emissiveIntensity: 0.7,
      shininess: 150,
      transparent: true,
      opacity: 0.9,
      wireframe: false,
    });
    const crystalWireMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    const crystalWire = new THREE.Mesh(crystalGeo, crystalWireMat);
    crystalWire.scale.setScalar(1.1);
    crystal.add(crystalWire);
    crystal.position.set(0, 0, 0.12);
    shieldGroup.add(crystal);

    scene.add(shieldGroup);

    // ── 3. Triple Gyroscope Orbital Security Rings ──────────────────────────
    const makeGyroRing = (radius: number, tube: number, color: THREE.Color, rx: number, ry: number) => {
      const geo = new THREE.TorusGeometry(radius, tube, 12, 80);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.65,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = rx;
      mesh.rotation.y = ry;
      scene.add(mesh);
      return { mesh, geo, mat };
    };

    const ring1 = makeGyroRing(2.1, 0.026, cyanColor, Math.PI * 0.32, 0);
    const ring2 = makeGyroRing(2.45, 0.022, purpleColor, -Math.PI * 0.28, Math.PI * 0.25);
    const ring3 = makeGyroRing(2.8, 0.018, emeraldColor, Math.PI * 0.6, -Math.PI * 0.2);

    // ── 4. Four Orbiting Cyber Defense Satellite Nodes ──────────────────────
    const satCount = 4;
    const satellites: Array<{ mesh: THREE.Mesh; geo: THREE.SphereGeometry; mat: THREE.MeshBasicMaterial; radius: number; speed: number; phase: number }> = [];
    const satColors = [cyanColor, purpleColor, pinkColor, emeraldColor];

    for (let i = 0; i < satCount; i++) {
      const satGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const satMat = new THREE.MeshBasicMaterial({
        color: satColors[i % satColors.length],
        transparent: true,
        opacity: 0.95,
      });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      scene.add(satMesh);
      satellites.push({
        mesh: satMesh,
        geo: satGeo,
        mat: satMat,
        radius: 2.15 + i * 0.2,
        speed: 0.6 + i * 0.15,
        phase: (i / satCount) * Math.PI * 2,
      });
    }

    // ── 5. Holographic Scanner Base Grid (disc beneath shield) ──────────────
    const baseGridGeo = new THREE.RingGeometry(0.8, 2.7, 36, 4);
    const baseGridMat = new THREE.MeshBasicMaterial({
      color: cyanColor,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const baseGrid = new THREE.Mesh(baseGridGeo, baseGridMat);
    baseGrid.rotation.x = -Math.PI / 2.2;
    baseGrid.position.set(0, -2.1, -0.5);
    scene.add(baseGrid);

    // ── 6. Dual-Helix Swarm of Particles ───────────────────────────────────
    const pCount = variant === 'hero' ? 84 : 44;
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      const strand = i % 2;
      const angle = (i / pCount) * Math.PI * 6;
      const r = 1.9 + Math.sin(angle * 2) * 0.35;
      const y = ((i / pCount) - 0.5) * 3.6;
      pPos[i * 3] = Math.cos(angle + (strand ? Math.PI : 0)) * r;
      pPos[i * 3 + 1] = y;
      pPos[i * 3 + 2] = Math.sin(angle + (strand ? Math.PI : 0)) * r;

      const c = strand ? cyanColor : purpleColor;
      pCol[i * 3] = c.r;
      pCol[i * 3 + 1] = c.g;
      pCol[i * 3 + 2] = c.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const particleSwarm = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSwarm);

    // ── 7. Dynamic Lighting ────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight('#1e293b', 1.0);
    const keyLight = new THREE.PointLight('#22d3ee', 3.5, 25);
    keyLight.position.set(4, 4, 6);
    const fillLight = new THREE.PointLight('#c084fc', 3.0, 25);
    fillLight.position.set(-4, -3, 5);
    const rimLight = new THREE.PointLight('#f472b6', 2.2, 20);
    rimLight.position.set(0, 5, -2);
    scene.add(ambientLight, keyLight, fillLight, rimLight);

    // ── Mouse Interactivity ────────────────────────────────────────────────
    let targetRotX = 0;
    let targetRotY = 0;
    const handlePointerMove = (e: PointerEvent) => {
      if (reducedMotion) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = nx * 0.42;
      targetRotX = -ny * 0.28;
      // Move keylight with cursor for glints
      keyLight.position.x = 4 + nx * 3;
      keyLight.position.y = 4 - ny * 3;
    };
    container.addEventListener('pointermove', handlePointerMove, { passive: true });

    const handleContextLostEvent = (e: Event) => {
      e.preventDefault();
      onContextLost?.();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLostEvent);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || width;
      const h = container.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ── Animation Loop ─────────────────────────────────────────────────────
    let rafId = 0;
    let elapsed = 0;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!document.hidden && !reducedMotion) {
        elapsed += dt;

        // Smooth floating & rotation of the shield
        shieldGroup.rotation.y = Math.sin(elapsed * 0.75) * 0.32 + targetRotY;
        shieldGroup.rotation.x += (targetRotX - shieldGroup.rotation.x) * 0.08;
        shieldGroup.position.y = Math.sin(elapsed * 1.5) * 0.12;

        // Crystal core spins fast with pulsing emissive glow
        crystal.rotation.x += dt * 1.2;
        crystal.rotation.y += dt * 1.6;
        crystalMat.emissiveIntensity = 0.6 + Math.sin(elapsed * 3.5) * 0.35;

        // Gyroscope rings counter-rotate on 3 axes
        ring1.mesh.rotation.z += dt * 0.45;
        ring1.mesh.rotation.x += dt * 0.12;
        ring2.mesh.rotation.z -= dt * 0.38;
        ring2.mesh.rotation.y += dt * 0.15;
        ring3.mesh.rotation.z += dt * 0.28;

        // Satellites revolve along orbits
        satellites.forEach((sat) => {
          const a = elapsed * sat.speed + sat.phase;
          sat.mesh.position.x = Math.cos(a) * sat.radius;
          sat.mesh.position.y = Math.sin(a * 1.5) * 0.7;
          sat.mesh.position.z = Math.sin(a) * sat.radius * 0.75;
        });

        // Base grid rotates
        baseGrid.rotation.z += dt * 0.15;

        // Particle swarm rotates & ascends gently
        particleSwarm.rotation.y += dt * 0.22;
        const pArr = (particleGeo.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < pCount; i++) {
          const iy = i * 3 + 1;
          pArr[iy] += dt * 0.35;
          if (pArr[iy] > 1.8) {
            pArr[iy] = -1.8;
          }
        }
        (particleGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }

      renderer.render(scene, camera);
      if (!reducedMotion) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    renderer.render(scene, camera);
    if (!reducedMotion) {
      rafId = requestAnimationFrame(renderFrame);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLostEvent);

      shieldGeo.dispose();
      coreMat.dispose();
      wireMatOuter.dispose();
      wireMatInner.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      crystalWireMat.dispose();
      ring1.geo.dispose(); ring1.mat.dispose();
      ring2.geo.dispose(); ring2.mat.dispose();
      ring3.geo.dispose(); ring3.mat.dispose();
      satellites.forEach((s) => { s.geo.dispose(); s.mat.dispose(); });
      baseGridGeo.dispose(); baseGridMat.dispose();
      particleGeo.dispose(); particleMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [variant, accentColor, reducedMotion, onContextLost]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full select-none"
      aria-hidden="true"
      role="presentation"
    />
  );
};

export default HolographicShield3D;
