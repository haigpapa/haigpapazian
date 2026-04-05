/* ═══════════════════════════════════════════════════════════
   SCROLLYTELLING ORCHESTRATION — scrollytelling.js
   Manages Fake-3D Parallax, GSAP scroll sequences, and DOM slicing.
   ═══════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Make sure GSAP, ScrollTrigger, and THREE are available
  if (typeof gsap === 'undefined' || typeof THREE === 'undefined') {
    console.warn('GSAP or THREE not loaded before scrollytelling.js');
    return;
  }

  // Register ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  /* ── 1. WEBGL HERO FAKE 3D PARALLAX ───────────────────────────── */
  function initHeroDepthParallax() {
    const container = document.getElementById('webgl-hero');
    if (!container) return;

    // Remove fallback image wrap from being visible but keep for a11y
    const fallback = container.querySelector('.hero-image-wrap');
    if (fallback) fallback.style.opacity = '0';

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    // position renderer behind caption
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '1';
    
    container.insertBefore(renderer.domElement, container.firstChild);

    // Ensure caption is above canvas
    const caption = container.querySelector('.hero-caption');
    if (caption) caption.style.zIndex = '2';

    const loader = new THREE.TextureLoader();
    // Load main texture and depth map
    let texLoaded = false, depthLoaded = false;
    
    const tex = loader.load('images/projects/mashrou-leila-baalbeck.jpg', () => {
      texLoaded = true; checkLoad();
    });
    const depthTex = loader.load('images/projects/mashrou-leila-baalbeck-depth.jpg', () => {
      depthLoaded = true; checkLoad();
    });

    const uniforms = {
      uTexture: { value: tex },
      uDepthMap: { value: depthTex },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uStrength: { value: 0.04 },
      uImageAspect: { value: 1.0 },
      uPlaneAspect: { value: container.clientWidth / container.clientHeight }
    };

    function checkLoad() {
      if (texLoaded && depthLoaded) {
        uniforms.uImageAspect.value = tex.image.width / tex.image.height;
      }
    }

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform sampler2D uDepthMap;
        uniform vec2 uMouse;
        uniform float uStrength;
        uniform float uImageAspect;
        uniform float uPlaneAspect;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          
          // Image cover calculation
          vec2 ratio = vec2(
            min(uPlaneAspect / uImageAspect, 1.0),
            min(uImageAspect / uPlaneAspect, 1.0)
          );
          uv = vec2(
            0.5 + (uv.x - 0.5) * ratio.x,
            0.5 + (uv.y - 0.5) * ratio.y
          );

          // Depth offset
          float depth = texture2D(uDepthMap, uv).r;
          vec2 offset = uMouse * depth * uStrength;
          
          vec4 color = texture2D(uTexture, uv + offset);
          
          // Edge vignette to hide dragging tears
          float vignette = smoothstep(0.0, 0.05, uv.x) * smoothstep(0.0, 0.05, 1.0 - uv.x) *
                           smoothstep(0.0, 0.05, uv.y) * smoothstep(0.0, 0.05, 1.0 - uv.y);
                           
          gl_FragColor = vec4(color.rgb, color.a * vignette);
        }
      `
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let targetMouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
      targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        uniforms.uPlaneAspect.value = container.clientWidth / container.clientHeight;
      }
    });

    function animate() {
      requestAnimationFrame(animate);
      // Smooth cursor lerp
      uniforms.uMouse.value.x += (targetMouse.x - uniforms.uMouse.value.x) * 0.1;
      uniforms.uMouse.value.y += (targetMouse.y - uniforms.uMouse.value.y) * 0.1;
      renderer.render(scene, camera);
    }
    
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate();
    } else {
      setTimeout(() => renderer.render(scene, camera), 500); // render static
    }

    // GSAP ScrollTrigger to increase strength on scroll down
    gsap.to(uniforms.uStrength, {
      value: 0.12,
      ease: "none",
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });
  }

  /* ── 2. DOM-BASED 3D DIORAMA FOR SPREAD ────────────────────────── */
  function initSpreadDiorama() {
    gsap.utils.toArray('.ed-spread').forEach(spread => {
      const primary = spread.querySelector('.ed-img--primary');
      const secondary = spread.querySelector('.ed-img--secondary');
      const tertiary = spread.querySelector('.ed-img--tertiary');
      
      // We will pull the components apart in Z-space as they scroll into view
      // Primary stays at Z:0, secondary translates Z forward + Y up, tertiary Z backward + Y down

      if (window.innerWidth > 900) {
        gsap.set(spread, { perspective: 1200, transformStyle: "preserve-3d" });
        
        // Initial shattered state
        gsap.set(secondary, { z: 200, yPercent: 40, rotationX: 10, rotationY: -15, opacity: 0 });
        gsap.set(tertiary, { z: -300, yPercent: -40, rotationX: -10, rotationY: 15, opacity: 0 });
        gsap.set(primary, { scale: 0.9, opacity: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: spread,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1.5 // Smooth assemble scrub
          }
        });

        tl.to(primary, { scale: 1, opacity: 1, duration: 1 }, 0)
          .to(secondary, { z: 50, yPercent: -15, rotationX: 0, rotationY: 0, opacity: 1, duration: 1 }, 0)
          .to(tertiary, { z: -100, yPercent: -30, rotationX: 0, rotationY: 0, opacity: 1, duration: 1 }, 0);
      }
    });
  }

  /* ── 3. STATISTICS KINETIC COUNTING ────────────────────────────── */
  function initStatsCounting() {
    gsap.utils.toArray('.ed-data-num').forEach(num => {
      // Parse current text
      const origText = num.textContent;
      const parsedNum = parseFloat(origText.replace(/[^0-9.]/g, ''));
      if (isNaN(parsedNum)) return;
      
      const suffix = origText.replace(/[0-9.]/g, ''); // keep things like +, M

      gsap.fromTo(num, 
        { innerHTML: 0 },
        {
          innerHTML: parsedNum,
          duration: 2.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: num,
            start: "top 85%",
            once: true
          },
          onUpdate: function() {
            // Keep suffix
            let val = Math.ceil(this.targets()[0].innerHTML);
            this.targets()[0].innerHTML = val + suffix;
          }
        }
      );
    });
  }

  /* ── 4. WORKS LIST HOVER PREVIEW DISPLACEMENT ──────────────────── */
  function initWorksPreviewWarp() {
    const preview = document.getElementById('row-preview');
    if (!preview || typeof THREE === 'undefined') return;

    // Convert preview div into WebGL canvas wrapper
    preview.innerHTML = ''; // clear img
    
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(preview.clientWidth, preview.clientHeight);
    preview.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    const noiseTex = loader.load('images/projects/noise.jpg');
    noiseTex.wrapS = THREE.RepeatWrapping;
    noiseTex.wrapT = THREE.RepeatWrapping;

    let currentTexture = null;
    let nextTexture = null;

    const uniforms = {
      uTex1: { value: null },
      uTex2: { value: null },
      uDisp: { value: noiseTex },
      uProgress: { value: 0.0 }, // 0 = tex1, 1 = tex2
      uTime: { value: 0.0 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform sampler2D uTex1;
        uniform sampler2D uTex2;
        uniform sampler2D uDisp;
        uniform float uProgress;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          vec4 disp = texture2D(uDisp, uv + uTime * 0.05);
          
          float p = uProgress;
          vec2 uv1 = uv + disp.rg * p * 0.1;
          vec2 uv2 = uv + disp.rg * (1.0 - p) * 0.1;

          vec4 color1 = texture2D(uTex1, uv1);
          vec4 color2 = texture2D(uTex2, uv2);

          // Liquid transition
          vec4 color = mix(color1, color2, p);
          gl_FragColor = color;
        }
      `
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // Texture cache
    const cache = {};

    function getTexture(url) {
      if (!cache[url]) cache[url] = loader.load(url);
      return cache[url];
    }

    let progressTween;

    // Attach to rows
    document.querySelectorAll('.work-row').forEach(row => {
      row.addEventListener('mouseenter', () => {
        const url = row.dataset.img;
        if (!url) return;

        const tex = getTexture(url);
        preview.classList.add('visible');

        if (!currentTexture) {
          currentTexture = tex;
          uniforms.uTex1.value = currentTexture;
          uniforms.uTex2.value = currentTexture;
          uniforms.uProgress.value = 0.0;
        } else if (currentTexture !== tex) {
          nextTexture = tex;
          uniforms.uTex2.value = nextTexture;
          if (progressTween) progressTween.kill();
          progressTween = gsap.to(uniforms.uProgress, {
            value: 1.0,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
              currentTexture = nextTexture;
              uniforms.uTex1.value = currentTexture;
              uniforms.uProgress.value = 0.0;
            }
          });
        }
      });

      row.addEventListener('mouseleave', () => {
        // Do not immediately hide, wait for another mouseenter or hide when leaving list
      });
    });

    // Hide when leaving the entire works-list
    const worksList = document.querySelector('.works-list');
    if (worksList) {
      worksList.addEventListener('mouseleave', () => {
        preview.classList.remove('visible');
        currentTexture = null;
        if (progressTween) progressTween.kill();
      });
    }

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime();
      
      // The nav.js already handles preview position updates via previewX / previewY
      // So we just render
      if (preview.classList.contains('visible')) {
        renderer.render(scene, camera);
      }
    }
    animate();
  }

  /* ── 5. GLOBAL BACKGROUND SHADER SYNC ────────────────────────── */
  function initBgShaderSync() {
    if (window.bgShaderUniforms) {
      gsap.to(window.bgShaderUniforms.uColorPalette, {
        value: 1.0,
        ease: "none",
        scrollTrigger: {
          trigger: "body",
          start: "10% top",
          end: "40% top",
          scrub: true
        }
      });
      gsap.to(window.bgShaderUniforms.uGrain, {
        value: 0.08,
        ease: "none",
        scrollTrigger: {
          trigger: "#editorial",
          start: "top center",
          end: "bottom top",
          scrub: true
        }
      });
    }
  }

  /* ── INIT ──────────────────────────────────────────────────────── */
  window.addEventListener('DOMContentLoaded', () => {
    // Slight delay to ensure DOM and other scripts are ready
    setTimeout(() => {
      initHeroDepthParallax();
      initSpreadDiorama();
      initStatsCounting();
      initWorksPreviewWarp();
      initBgShaderSync();
    }, 100);
  });

})();
