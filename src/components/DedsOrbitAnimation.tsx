import React, { useEffect, useRef, useState } from 'react';

interface DedsOrbitAnimationProps {
  className?: string;
  onExploreCourses?: () => void;
}

export const DedsOrbitAnimation: React.FC<DedsOrbitAnimationProps> = ({
  className = '',
  onExploreCourses,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [earthFastSpin, setEarthFastSpin] = useState(false);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  // Handle interactivity
  const handleRocketClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBoosting(true);
    setActiveTooltip('🚀 Decolando Carreira! +10.000 alunos impulsionados');
    setTimeout(() => setIsBoosting(false), 2500);
    setTimeout(() => setActiveTooltip(null), 4000);
  };

  const handleEarthClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEarthFastSpin(true);
    setActiveTooltip('🌍 Órbita do Conhecimento • Deds Academy');
    setTimeout(() => setEarthFastSpin(false), 3000);
    setTimeout(() => setActiveTooltip(null), 4500);
  };

  const handleIconClick = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTooltip(title);
    setTimeout(() => setActiveTooltip(null), 3500);
  };

  // Parallax tilt on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({ x: x * 8, y: y * 8 });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  // ========================================================
  // REALISTIC 3D ROTATING EARTH (WebGL Shader Engine)
  // ========================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;
    let rotation = 0.58; // Initial rotation angle focusing on the Americas
    const baseSpeed = 0.0028;
    let currentSpeed = baseSpeed;

    // Check WebGL support
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    });

    if (!gl) {
      drawCanvasFallback(canvas);
      return;
    }

    // 1. Generate high-fidelity Equirectangular Earth Texture (Americas in focus)
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 1024;
    texCanvas.height = 512;
    const ctx = texCanvas.getContext('2d');
    if (ctx) {
      renderEquirectangularEarth(ctx, texCanvas.width, texCanvas.height);
    }

    // Create WebGL texture from canvas
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 2. Vertex Shader (Full-quad)
    const vsSource = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // 3. Fragment Shader (Photorealistic Raytraced Sphere with Atmosphere Glow)
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uEarthTexture;
      uniform float uRotation;
      uniform float uTime;

      #define PI 3.14159265359

      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);

        if (r > 1.25) {
          gl_FragColor = vec4(0.0);
          return;
        }

        // Atmosphere Outer Scattering Glow
        if (r > 1.0) {
          float haloFactor = 1.0 - (r - 1.0) / 0.25;
          haloFactor = pow(haloFactor, 2.6);

          float rightSideFactor = smoothstep(-0.3, 0.9, p.x);
          
          vec3 haloCyan = vec3(0.0, 0.92, 1.0);
          vec3 haloBlue = vec3(0.08, 0.5, 0.95);
          vec3 haloColor = mix(haloBlue, haloCyan, rightSideFactor);

          float alpha = haloFactor * (0.35 + rightSideFactor * 0.6);
          gl_FragColor = vec4(haloColor * alpha, alpha);
          return;
        }

        // Inside Earth Sphere
        float z = sqrt(1.0 - r * r);
        vec3 normal = vec3(p.x, p.y, z);

        // Axial tilt (approx 18 degrees)
        float tilt = 0.32;
        mat3 tiltMatrix = mat3(
          cos(tilt), -sin(tilt), 0.0,
          sin(tilt),  cos(tilt), 0.0,
          0.0,        0.0,       1.0
        );
        vec3 tiltedNormal = tiltMatrix * normal;

        float lon = atan(tiltedNormal.x, tiltedNormal.z);
        float lat = asin(clamp(tiltedNormal.y, -1.0, 1.0));

        float u = lon / (2.0 * PI) + uRotation;
        float v = 0.5 - lat / PI;

        vec4 texColor = texture2D(uEarthTexture, vec2(fract(u), v));

        // Atmospheric Light Source: Coming from Upper-Right
        vec3 lightDir = normalize(vec3(0.65, 0.25, 0.72));
        float diff = max(dot(normal, lightDir), 0.0);
        diff = pow(diff, 0.9);

        // Specular highlight on ocean
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 halfDir = normalize(lightDir + viewDir);
        float specFactor = pow(max(dot(normal, halfDir), 0.0), 22.0);
        float isWater = smoothstep(0.4, 0.8, texColor.b - texColor.r);
        vec3 specular = vec3(0.6, 0.92, 1.0) * specFactor * isWater * 0.75;

        // Vibrant Atmosphere Fresnel Rim on the right edge
        float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
        float rimIntensity = pow(fresnel, 3.2);
        float rightBias = smoothstep(-0.2, 0.8, normal.x);
        vec3 rimCyan = vec3(0.0, 0.95, 1.0);
        vec3 rimEmerald = vec3(0.1, 0.9, 0.6);
        vec3 rimColor = mix(rimCyan, rimEmerald, normal.y * 0.4 + 0.5);

        float ambient = 0.16;
        vec3 baseShading = texColor.rgb * (ambient + diff * 0.95);

        vec3 finalColor = baseShading + specular + rimColor * rimIntensity * (0.5 + rightBias * 0.9);
        finalColor = mix(finalColor, rimCyan * 1.1, rimIntensity * 0.35 * rightBias);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTextureLoc = gl.getUniformLocation(program, 'uEarthTexture');
    const uRotationLoc = gl.getUniformLocation(program, 'uRotation');
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');

    gl.uniform1i(uTextureLoc, 0);

    let lastTime = performance.now();
    const render = (time: number) => {
      lastTime = time;

      const targetSpeed = earthFastSpin ? baseSpeed * 3.8 : baseSpeed;
      currentSpeed += (targetSpeed - currentSpeed) * 0.08;
      rotation += currentSpeed;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniform1f(uRotationLoc, rotation);
      gl.uniform1f(uTimeLoc, time * 0.001);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteTexture(texture);
      gl.deleteBuffer(quadBuffer);
    };
  }, [earthFastSpin]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative select-none aspect-square w-full max-w-[500px] mx-auto flex items-center justify-center ${className}`}
      style={{
        background: 'transparent',
        perspective: '1000px',
      }}
      aria-label="Animação interativa Deds Orbit com Terra 3D, Foguete Futurista e Órbitas Neon"
    >
      {/* Interactive Tooltip Toast */}
      {activeTooltip && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#0a101d]/95 border border-[#00f0ff]/60 text-white text-xs font-semibold shadow-[0_0_24px_rgba(0,240,255,0.4)] backdrop-blur-md flex items-center gap-2 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto z-50">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
          <span>{activeTooltip}</span>
        </div>
      )}

      {/* Tilt Wrapper for Subtle 3D Mouse Parallax */}
      <div
        className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${-mouseTilt.y}deg) rotateY(${mouseTilt.x}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ========================================================
            1. ORBITAL PATHS & STARDUST PARTICLES (SVG Vector Layer)
            ======================================================== */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="neonOrbitalGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="rocketThrustGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blurBig" />
              <feGaussianBlur stdDeviation="2.5" result="blurSmall" />
              <feMerge>
                <feMergeNode in="blurBig" />
                <feMergeNode in="blurSmall" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="rocketExhaustGradient" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="15%" stopColor="#73FBB8" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#00FF88" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#059669" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.3" />
              <stop offset="30%" stopColor="#00FF88" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#00F0FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00FF88" stopOpacity="0.25" />
            </linearGradient>

            <linearGradient id="orbitGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.2" />
              <stop offset="40%" stopColor="#00D2FF" stopOpacity="0.85" />
              <stop offset="80%" stopColor="#38BDF8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#00FF88" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="orbitGrad3" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#00FF88" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#00FF88" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* ORBIT 1: Polar / Upper Orbital Trajectory Loop */}
          <ellipse
            cx="255"
            cy="245"
            rx="185"
            ry="92"
            transform="rotate(-26 255 245)"
            stroke="url(#orbitGrad2)"
            strokeWidth="1.6"
            filter="url(#neonOrbitalGlow)"
            className="opacity-80"
          />

          {/* ORBIT 2: Equatorial / Inclined Trajectory (Front & Center) */}
          <ellipse
            cx="250"
            cy="255"
            rx="192"
            ry="75"
            transform="rotate(18 250 255)"
            stroke="url(#orbitGrad1)"
            strokeWidth="2.0"
            filter="url(#neonOrbitalGlow)"
          />

          {/* ORBIT 3: Outer Sweeping Trajectory */}
          <ellipse
            cx="245"
            cy="260"
            rx="210"
            ry="115"
            transform="rotate(-12 245 260)"
            stroke="url(#orbitGrad3)"
            strokeWidth="1.2"
            strokeDasharray="6 8"
            className="opacity-50"
          />

          {/* Glowing Orbital Nodes */}
          <g filter="url(#neonOrbitalGlow)">
            <circle cx="76" cy="220" r="4" fill="#00D2FF" />
            <circle cx="76" cy="220" r="1.8" fill="#FFFFFF" />
            <circle cx="76" cy="220" r="8" fill="#00D2FF" fillOpacity="0.3" />
          </g>

          <g filter="url(#neonOrbitalGlow)">
            <circle cx="246" cy="96" r="3.2" fill="#00F0FF" />
            <circle cx="246" cy="96" r="1.5" fill="#FFFFFF" />
          </g>

          <g filter="url(#neonOrbitalGlow)">
            <circle cx="185" cy="286" r="4.5" fill="#00FF88" />
            <circle cx="185" cy="286" r="2" fill="#FFFFFF" />
            <circle cx="185" cy="286" r="9" fill="#00FF88" fillOpacity="0.35" />
          </g>

          <g filter="url(#neonOrbitalGlow)">
            <circle cx="428" cy="110" r="4.2" fill="#00D2FF" />
            <circle cx="428" cy="110" r="1.8" fill="#FFFFFF" />
            <circle cx="428" cy="110" r="8" fill="#00D2FF" fillOpacity="0.3" />
          </g>

          <g filter="url(#neonOrbitalGlow)">
            <circle cx="424" cy="205" r="4.8" fill="#00FF88" />
            <circle cx="424" cy="205" r="2.2" fill="#FFFFFF" />
            <circle cx="424" cy="205" r="10" fill="#00FF88" fillOpacity="0.4" />
          </g>

          <g filter="url(#neonOrbitalGlow)">
            <circle cx="218" cy="366" r="3.6" fill="#00FF88" />
            <circle cx="218" cy="366" r="1.6" fill="#FFFFFF" />
          </g>

          <g filter="url(#neonOrbitalGlow)">
            <circle cx="408" cy="324" r="2.8" fill="#00F0FF" />
          </g>

          {/* Stardust */}
          <circle cx="145" cy="138" r="1.6" fill="#00F0FF" className="animate-pulse" style={{ animationDuration: '3s' }} />
          <circle cx="112" cy="180" r="1.4" fill="#FFFFFF" className="animate-pulse" style={{ animationDuration: '2.2s' }} />
          <circle cx="370" cy="148" r="1.5" fill="#73FBB8" className="animate-pulse" style={{ animationDuration: '2.8s' }} />
          <circle cx="340" cy="80" r="1.2" fill="#FFFFFF" />
          <circle cx="452" cy="155" r="1.4" fill="#00F0FF" />
          <circle cx="190" cy="380" r="1.5" fill="#00FF88" className="animate-pulse" style={{ animationDuration: '3.4s' }} />
          <circle cx="330" cy="410" r="1.2" fill="#FFAA00" />
          <circle cx="388" cy="360" r="1.8" fill="#00F0FF" className="animate-pulse" style={{ animationDuration: '2.6s' }} />

          {/* Foguete Exhaust Stream / Chama de Propulsão */}
          <path
            d="M 116 304 C 98 322, 78 348, 76 366 C 74 382, 88 392, 106 394 C 122 396, 140 388, 155 372"
            stroke="#00FF88"
            strokeWidth={isBoosting ? '14' : '9'}
            strokeLinecap="round"
            strokeOpacity="0.25"
            filter="url(#rocketThrustGlow)"
          />

          <path
            d="M 116 304 C 98 322, 78 348, 76 366 C 74 382, 88 392, 106 394 C 122 396, 140 388, 155 372"
            stroke="url(#rocketExhaustGradient)"
            strokeWidth={isBoosting ? '8' : '5.5'}
            strokeLinecap="round"
            filter="url(#neonOrbitalGlow)"
          />

          <path
            d="M 116 304 C 102 318, 86 338, 82 355 C 79 368, 88 378, 102 382"
            stroke="#FFFFFF"
            strokeWidth={isBoosting ? '3.5' : '2.2'}
            strokeLinecap="round"
            strokeOpacity="0.9"
          />
        </svg>

        {/* ========================================================
            2. REALISTIC 3D PLANET EARTH (Centerpiece WebGL Canvas)
            ======================================================== */}
        <div
          onClick={handleEarthClick}
          title="Planeta Terra Deds Orbit • Clique para acelerar rotação!"
          className="relative w-[52%] h-[52%] rounded-full cursor-pointer pointer-events-auto flex items-center justify-center z-20 group"
          style={{
            boxShadow: '0 0 50px rgba(0, 240, 255, 0.25), 0 0 100px rgba(0, 150, 255, 0.15)',
          }}
        >
          <div className="absolute inset-[-12px] rounded-full bg-[#00f0ff]/10 blur-xl group-hover:bg-[#00f0ff]/20 transition-all pointer-events-none" />

          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            className="w-full h-full rounded-full object-cover select-none pointer-events-none"
            style={{
              background: 'transparent',
            }}
          />
        </div>

        {/* ========================================================
            3. FUTURISTIC ROCKET SHIP (Foguete Futurista 1:1)
            ======================================================== */}
        <div
          onClick={handleRocketClick}
          title="Foguete Futurista Deds Orbit • Clique para propulsão turbo!"
          className="absolute left-[13%] bottom-[24%] w-[24%] h-[24%] cursor-pointer pointer-events-auto z-30 group transition-transform duration-300"
          style={{
            transform: isBoosting
              ? 'translate(12px, -14px) rotate(-42deg) scale(1.12)'
              : 'translate(0, 0) rotate(-42deg)',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            style={{
              animation: isBoosting ? 'none' : 'rocketFloating 3.6s ease-in-out infinite',
            }}
          >
            <svg
              viewBox="0 0 120 120"
              fill="none"
              className="w-full h-full drop-shadow-[0_8px_20px_rgba(0,255,136,0.55)] group-hover:drop-shadow-[0_8px_28px_rgba(0,255,136,0.9)] transition-all"
            >
              <defs>
                <linearGradient id="rocketFuselageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="45%" stopColor="#F1F5F9" />
                  <stop offset="85%" stopColor="#CBD5E1" />
                  <stop offset="100%" stopColor="#94A3B8" />
                </linearGradient>

                <linearGradient id="neonGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#73FBB8" />
                  <stop offset="60%" stopColor="#00FF88" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                <linearGradient id="metallicCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E0F2FE" />
                  <stop offset="50%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>

                <radialGradient id="portholeGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="60%" stopColor="#0B132B" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>
              </defs>

              {/* Thruster Engine Bell */}
              <path
                d="M 53 90 L 67 90 L 71 100 L 49 100 Z"
                fill="#334155"
                stroke="#64748B"
                strokeWidth="1.5"
              />

              {/* Left Wing */}
              <path
                d="M 45 64 L 20 86 C 20 86 28 92 42 88 L 47 78 Z"
                fill="url(#neonGreenGrad)"
                stroke="#059669"
                strokeWidth="1.5"
              />
              <path
                d="M 45 66 L 25 84 L 38 86 Z"
                fill="#FFFFFF"
                fillOpacity="0.25"
              />

              {/* Right Wing */}
              <path
                d="M 75 64 L 100 86 C 100 86 92 92 78 88 L 73 78 Z"
                fill="url(#neonGreenGrad)"
                stroke="#059669"
                strokeWidth="1.5"
              />
              <path
                d="M 75 66 L 95 84 L 82 86 Z"
                fill="#FFFFFF"
                fillOpacity="0.25"
              />

              {/* Rocket Body */}
              <path
                d="M 60 14 C 44 32 40 68 45 90 L 75 90 C 80 68 76 32 60 14 Z"
                fill="url(#rocketFuselageGrad)"
                stroke="#CBD5E1"
                strokeWidth="1.2"
              />

              {/* Specular Highlight */}
              <path
                d="M 60 16 C 48 34 44 64 48 86 C 46 72 48 38 58 20 Z"
                fill="#FFFFFF"
                fillOpacity="0.75"
              />

              {/* Center Dorsal Neon Green Stripe */}
              <path
                d="M 58 24 C 56 42 56 68 58 88 L 62 88 C 64 68 64 42 62 24 Z"
                fill="url(#neonGreenGrad)"
              />

              {/* Nose Cone Tip */}
              <path
                d="M 60 14 C 54 22 52 28 52 32 L 68 32 C 68 28 66 22 60 14 Z"
                fill="url(#neonGreenGrad)"
              />
              <circle cx="60" cy="15" r="2.5" fill="#FFFFFF" />

              {/* Cockpit Porthole */}
              <circle
                cx="60"
                cy="48"
                r="11"
                fill="url(#portholeGrad)"
                stroke="url(#metallicCyanGrad)"
                strokeWidth="2.5"
              />
              <circle
                cx="60"
                cy="48"
                r="11"
                stroke="#00F0FF"
                strokeWidth="1"
                strokeOpacity="0.75"
              />
              <path
                d="M 53 44 A 8 8 0 0 1 66 41 A 8 8 0 0 0 54 49 Z"
                fill="#FFFFFF"
                fillOpacity="0.75"
              />
              <circle cx="56" cy="45" r="1.5" fill="#FFFFFF" />
            </svg>
          </div>
        </div>

        {/* ========================================================
            4. THREE FLOATING NEON BADGE CIRCLES (1:1 Reference)
            ======================================================== */}

        {/* BADGE 1: CODE ICON ({}) - Top Left */}
        <div
          onClick={(e) => handleIconClick('💻 Tecnologias & Programação de Ponta', e)}
          title="Código & Programação • Clique para detalhes"
          className="absolute left-[36%] top-[14%] w-12 h-12 rounded-full cursor-pointer pointer-events-auto flex items-center justify-center z-30 group/badge hover:scale-115 transition-transform duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(11,24,48,0.92) 0%, rgba(5,12,24,0.96) 100%)',
            border: '2.5px solid #00D2FF',
            boxShadow: '0 0 16px #00D2FF, 0 0 32px rgba(0, 210, 255, 0.6), inset 0 0 10px rgba(0, 210, 255, 0.45)',
            animation: 'badgeFloat 4.2s ease-in-out infinite',
          }}
        >
          <span className="font-mono font-bold text-lg text-white group-hover/badge:text-[#00D2FF] transition-colors drop-shadow-[0_0_8px_#00D2FF]">
            {'{ }'}
          </span>
        </div>

        {/* BADGE 2: ACADEMIC CAP (Capelo) - Lower Left */}
        <div
          onClick={(e) => handleIconClick('🎓 Certificado Próprio Reconhecido (Lei 9.394/96)', e)}
          title="Certificação & Reconhecimento Acadêmico • Clique para detalhes"
          className="absolute left-[26%] bottom-[20%] w-[52px] h-[52px] rounded-full cursor-pointer pointer-events-auto flex items-center justify-center z-30 group/badge hover:scale-115 transition-transform duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(6,32,20,0.92) 0%, rgba(2,16,10,0.96) 100%)',
            border: '2.5px solid #00FF88',
            boxShadow: '0 0 16px #00FF88, 0 0 32px rgba(0, 255, 136, 0.6), inset 0 0 10px rgba(0, 255, 136, 0.45)',
            animation: 'badgeFloat 4.6s ease-in-out infinite 0.8s',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-[#00FF88] group-hover/badge:text-white transition-colors drop-shadow-[0_0_8px_#00FF88]">
            <path
              d="M 12 3 L 1 9 L 12 15 L 23 9 L 12 3 Z"
              fill="#00FF88"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 5 11.5 V 17 C 5 19.5 8.1 21 12 21 C 15.9 21 19 19.5 19 17 V 11.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 23 9 V 15.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* BADGE 3: ACHIEVEMENT STAR - Far Right */}
        <div
          onClick={(e) => handleIconClick('⭐ Conquistas Profissionais & Promoções no Mercado', e)}
          title="Conquista & Excelência • Clique para detalhes"
          className="absolute right-[5%] top-[45%] w-[52px] h-[52px] rounded-full cursor-pointer pointer-events-auto flex items-center justify-center z-30 group/badge hover:scale-115 transition-transform duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(40,24,6,0.92) 0%, rgba(20,10,2,0.96) 100%)',
            border: '2.5px solid #FF9900',
            boxShadow: '0 0 16px #FF9900, 0 0 32px rgba(255, 153, 0, 0.6), inset 0 0 10px rgba(255, 153, 0, 0.45)',
            animation: 'badgeFloat 4.4s ease-in-out infinite 1.4s',
          }}
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 drop-shadow-[0_0_8px_#FFAA00]">
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill="#FFAA00"
              stroke="#FF8800"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>

      {/* Subtle Micro Floating Label in Corner */}
      <div className="absolute right-3 bottom-1 pointer-events-none z-30">
        <span className="text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 text-[#00f0ff]/70 drop-shadow-[0_0_6px_rgba(0,240,255,0.4)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
          Deds Orbit
        </span>
      </div>

      <style>{`
        @keyframes rocketFloating {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-6px) translateX(4px);
          }
        }
        @keyframes badgeFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
};

// ========================================================
// EQUIRECTANGULAR REALISTIC EARTH TEXTURE GENERATOR
// ========================================================
function renderEquirectangularEarth(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Ocean Base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0.0, '#071638');
  oceanGrad.addColorStop(0.25, '#0a2355');
  oceanGrad.addColorStop(0.5, '#0b2b64');
  oceanGrad.addColorStop(0.75, '#0a2355');
  oceanGrad.addColorStop(1.0, '#071638');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Continental Shelf Shallow Waters (Turquoise Glow)
  ctx.fillStyle = '#0f766e';
  ctx.globalAlpha = 0.45;
  drawContinentsSilhouettes(ctx, width, height, 8);
  ctx.globalAlpha = 1.0;

  // Main Continents
  ctx.fillStyle = '#166534';
  drawContinentsSilhouettes(ctx, width, height, 0);

  // Mountains & Topography
  ctx.fillStyle = '#854d0e';
  ctx.globalAlpha = 0.75;
  drawMountainRanges(ctx, width, height);
  ctx.globalAlpha = 1.0;

  // Rainforest Highlights
  ctx.fillStyle = '#22c55e';
  ctx.globalAlpha = 0.6;
  drawRainforestHighlights(ctx, width, height);
  ctx.globalAlpha = 1.0;

  // Polar Ice Caps
  ctx.fillStyle = '#e2e8f0';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(width * 0.38, height * 0.1, width * 0.09, height * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(0, height * 0.92, width, height * 0.08);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Clouds
  renderAtmosphericClouds(ctx, width, height);
}

function drawContinentsSilhouettes(ctx: CanvasRenderingContext2D, w: number, h: number, expand: number) {
  // SOUTH AMERICA (Focus area - Brazil, Amazon, Argentina, Chile)
  ctx.beginPath();
  const saX = w * 0.33;
  const saY = h * 0.54;
  ctx.moveTo(saX - 25 - expand, saY - 30 - expand);
  ctx.bezierCurveTo(saX + 20, saY - 35, saX + 65 + expand, saY - 15 - expand, saX + 75 + expand, saY + 25);
  ctx.bezierCurveTo(saX + 60, saY + 60, saX + 35, saY + 110, saX + 15, saY + 140 + expand);
  ctx.bezierCurveTo(saX - 10 - expand, saY + 110, saX - 28 - expand, saY + 50, saX - 35 - expand, saY + 10);
  ctx.bezierCurveTo(saX - 32, saY - 10, saX - 30, saY - 25, saX - 25 - expand, saY - 30 - expand);
  ctx.closePath();
  ctx.fill();

  // NORTH AMERICA (USA, Canada, Mexico, Alaska)
  ctx.beginPath();
  const naX = w * 0.26;
  const naY = h * 0.28;
  ctx.moveTo(naX - 70 - expand, naY - 45 - expand);
  ctx.bezierCurveTo(naX - 30, naY - 55, naX + 35 + expand, naY - 40, naX + 50 + expand, naY - 10);
  ctx.bezierCurveTo(naX + 55, naY + 20, naX + 45 + expand, naY + 45, naX + 35 + expand, naY + 58);
  ctx.bezierCurveTo(naX + 15, naY + 70, naX - 5, naY + 80, naX + 12 + expand, naY + 95 + expand);
  ctx.bezierCurveTo(naX - 15, naY + 90, naX - 30, naY + 65, naX - 50 - expand, naY + 35);
  ctx.bezierCurveTo(naX - 75 - expand, naY + 10, naX - 85 - expand, naY - 25, naX - 70 - expand, naY - 45 - expand);
  ctx.closePath();
  ctx.fill();

  // EUROPE
  ctx.beginPath();
  const euX = w * 0.52;
  const euY = h * 0.32;
  ctx.moveTo(euX - 15, euY - 20);
  ctx.bezierCurveTo(euX + 30, euY - 30, euX + 60, euY - 10, euX + 55, euY + 20);
  ctx.bezierCurveTo(euX + 35, euY + 40, euX + 15, euY + 30, euX - 5, euY + 25);
  ctx.closePath();
  ctx.fill();

  // AFRICA
  ctx.beginPath();
  const afX = w * 0.54;
  const afY = h * 0.55;
  ctx.moveTo(afX - 35 - expand, afY - 45);
  ctx.bezierCurveTo(afX + 25, afY - 45, afX + 50 + expand, afY - 20, afX + 45, afY + 20);
  ctx.bezierCurveTo(afX + 30, afY + 75, afX + 5, afY + 115 + expand, afX - 15, afY + 105);
  ctx.bezierCurveTo(afX - 45 - expand, afY + 60, afX - 55 - expand, afY + 10, afX - 35 - expand, afY - 45);
  ctx.closePath();
  ctx.fill();

  // ASIA
  ctx.beginPath();
  const asX = w * 0.76;
  const asY = h * 0.35;
  ctx.ellipse(asX, asY, w * 0.14 + expand, h * 0.18 + expand, 0, 0, Math.PI * 2);
  ctx.fill();

  // AUSTRALIA
  ctx.beginPath();
  const auX = w * 0.86;
  const auY = h * 0.72;
  ctx.ellipse(auX, auY, w * 0.05 + expand, h * 0.06 + expand, 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawMountainRanges(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Andes Spine
  ctx.beginPath();
  const saX = w * 0.33;
  const saY = h * 0.54;
  ctx.moveTo(saX - 25, saY - 20);
  ctx.lineTo(saX - 28, saY + 20);
  ctx.lineTo(saX - 22, saY + 70);
  ctx.lineTo(saX + 5, saY + 130);
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#a16207';
  ctx.stroke();

  // Rockies
  ctx.beginPath();
  const naX = w * 0.26;
  const naY = h * 0.28;
  ctx.moveTo(naX - 45, naY - 25);
  ctx.lineTo(naX - 30, naY + 15);
  ctx.lineTo(naX - 15, naY + 50);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#92400e';
  ctx.stroke();

  // Sahara
  ctx.beginPath();
  ctx.ellipse(w * 0.52, h * 0.44, w * 0.07, h * 0.045, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ca8a04';
  ctx.fill();
}

function drawRainforestHighlights(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath();
  const saX = w * 0.33;
  const saY = h * 0.54;
  ctx.ellipse(saX + 15, saY + 10, w * 0.045, h * 0.065, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

function renderAtmosphericClouds(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#FFFFFF';

  for (let i = 0; i < 9; i++) {
    const x = (w * i) / 8 + (Math.sin(i * 1.5) * 20);
    const y = h * 0.46 + Math.sin(i * 1.2) * 18;
    ctx.globalAlpha = 0.4 + (i % 3) * 0.15;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.08, h * 0.035, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  const cyX = w * 0.38;
  const cyY = h * 0.32;
  ctx.arc(cyX, cyY, 32, 0, Math.PI * 1.6);
  ctx.lineWidth = 14;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.stroke();

  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(w * 0.22, h * 0.74, w * 0.12, h * 0.04, -0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(w * 0.46, h * 0.78, w * 0.14, h * 0.045, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1.0;
}

function drawCanvasFallback(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = w * 0.46;

  ctx.clearRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.25);
  glow.addColorStop(0, 'rgba(0, 240, 255, 0.6)');
  glow.addColorStop(1, 'rgba(0, 240, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  const ocean = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
  ocean.addColorStop(0, '#0f766e');
  ocean.addColorStop(0.5, '#0b2b64');
  ocean.addColorStop(1, '#05142f');
  ctx.fillStyle = ocean;
  ctx.fill();

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(cx + 10, cy + 20, r * 0.35, r * 0.55, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
