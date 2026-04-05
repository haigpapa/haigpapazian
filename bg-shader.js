/* ═══════════════════════════════════════════════════════════
   AMBIENT WEBGL BACKGROUND — bg-shader.js
   Muted, organic textured background replacing flat CSS #000.
   ═══════════════════════════════════════════════════════════ */
(function() {
  'use strict';
  
  // Create wrapper
  const container = document.createElement('div');
  container.id = 'ambient-bg';
  Object.assign(container.style, {
    position: 'fixed',
    top: 0, left: 0, width: '100vw', height: '100vh',
    zIndex: -99, pointerEvents: 'none',
    background: '#0a0a0f' // Fallback color
  });
  document.body.prepend(container);

  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded, bg-shader aborted.');
    return;
  }
  
  initShader();

  function initShader() {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uGrain: { value: 0.045 },
      uColorPalette: { value: 0.0 } // 0 is default navy, 1 is acid/organic
    };
    
    window.bgShaderUniforms = uniforms;

    const geometry = new THREE.PlaneGeometry(2, 2);
    
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uGrain;
      uniform float uColorPalette;
      varying vec2 vUv;

      // SDF / Noise helpers
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865, 0.366025403, -0.577350269, 0.024390243);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291 - 0.85373472 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // Muted organic Quilez palette
      vec3 palette(float t) {
        vec3 a = vec3(0.5, 0.5, 0.5);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(1.0, 0.8, 0.6);
        vec3 d = vec3(0.1, 0.15, 0.20);
        return a + b * cos(6.28318 * (c * t + d));
      }

      void main() {
        vec2 uv = (vUv - 0.5) * (uResolution.x / uResolution.y);
        
        // Gentle warp based on time and mouse
        vec2 p = uv * 2.0;
        p += uMouse * 0.05;
        float n = snoise(p + uTime * 0.03);
        float n2 = snoise(p * 3.0 - uTime * 0.05 + n);
        
        // Base dark color (night navy / deep space) vs Acid organic
        vec3 baseNavy = vec3(0.05, 0.05, 0.06);
        vec3 baseAcid = vec3(0.07, 0.08, 0.04);
        vec3 baseColor = mix(baseNavy, baseAcid, uColorPalette); 
        
        // Organic muted highlights
        float palOffset = n * 0.5 + n2 * 0.25;
        vec3 accentBase = palette(palOffset + uTime * 0.02) * 0.08;
        vec3 accentAcid = palette(palOffset * 2.0 - uTime * 0.05) * vec3(0.12, 0.15, 0.06);
        vec3 accent = mix(accentBase, accentAcid, uColorPalette);
        
        vec3 color = baseColor + accent;
        
        // Edge Vignette to darken edges
        float vignette = smoothstep(1.2, 0.2, length(vUv - 0.5) * 2.0);
        color *= (vignette * 0.8 + 0.2); // Don't go to pure black
        
        // Film grain (animated)
        float grain = fract(sin(dot(vUv + fract(uTime), vec2(12.9898,78.233))) * 43758.5453);
        color += (grain - 0.5) * uGrain;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let targetMouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
      targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      
      uniforms.uMouse.value.x += (targetMouse.x - uniforms.uMouse.value.x) * 0.05;
      uniforms.uMouse.value.y += (targetMouse.y - uniforms.uMouse.value.y) * 0.05;

      renderer.render(scene, camera);
    }
    
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate();
    } else {
      renderer.render(scene, camera);
    }
  }
})();
