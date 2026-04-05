/* ═══════════════════════════════════════════════════════════
   HOMEPAGE STORY — homepage-story.js
   Scrollytelling: statement reveal + WebGL image gallery.
   Depends on: scrollama.js (CDN), three.js (CDN), gsap (CDN)
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  window.addEventListener('load', function () {
    setTimeout(init, 200);
  });

  function init() {
    initStatementScroller();
    initWebGLGallery();
  }

  var DOMAIN_DATA = [
    { name: 'Sound',   color: '#b8966a' },
    { name: 'Space',   color: '#7a9a4a' },
    { name: 'Code',    color: '#4a8a9a' },
    { name: 'Text',    color: '#5b8a7a' },
    { name: 'Image',   color: '#9a6b8a' },
    { name: 'Systems', color: '#7a5a9a' },
  ];

  /* ── ACT 1: Statement phrase-by-phrase reveal ─────────────── */
  function initStatementScroller() {
    if (typeof scrollama === 'undefined') return;

    var phrases = document.querySelectorAll('.st-phrase');
    if (!phrases.length) return;

    var wmEl   = document.getElementById('st-domain-wm');
    var barEl  = document.getElementById('st-domain-bar');
    var dotsContainer = document.getElementById('st-dots-statement');

    // Build progress dots
    if (dotsContainer) {
      DOMAIN_DATA.forEach(function (_, i) {
        var dot = document.createElement('div');
        dot.className = 'st-dot' + (i === 0 ? ' active' : '');
        dot.dataset.index = i;
        dotsContainer.appendChild(dot);
      });
    }

    // Reveal first phrase immediately so sticky isn't blank
    if (phrases[0]) phrases[0].classList.add('revealed');

    function updateDomain(index) {
      var d = DOMAIN_DATA[index] || DOMAIN_DATA[0];
      if (wmEl)  wmEl.textContent = d.name;
      if (barEl) barEl.style.background = d.color;
      if (dotsContainer) {
        dotsContainer.querySelectorAll('.st-dot').forEach(function (dot, i) {
          dot.classList.toggle('active', i === index);
        });
      }
    }

    updateDomain(0);

    var scroller = scrollama();
    scroller
      .setup({
        step: '#st-steps-statement .st-step',
        offset: 0.55,
        debug: false,
      })
      .onStepEnter(function (response) {
        var element = response.element;
        var index = response.index;

        document.querySelectorAll('#st-steps-statement .st-step')
          .forEach(function (s) { s.classList.remove('is-active'); });
        element.classList.add('is-active');

        updateDomain(index);

        // Reveal phrases cumulatively
        var revealUpTo = index + 2;
        phrases.forEach(function (ph, i) {
          if (i <= revealUpTo) ph.classList.add('revealed');
        });
      })
      .onStepExit(function (response) {
        var element = response.element;
        var index = response.index;
        var direction = response.direction;

        element.classList.remove('is-active');

        if (direction === 'up' && index > 0) {
          updateDomain(Math.max(0, index - 1));
          var keepUpTo = index + 1;
          phrases.forEach(function (ph, i) {
            if (i > keepUpTo) ph.classList.remove('revealed');
          });
        }
      });

    window.addEventListener('resize', scroller.resize);
  }

  /* ── ACT 2: WebGL noise-displacement image gallery ────────── */

  var VERT = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Simplex 3D noise + displacement crossfade
  var FRAG = /* glsl */ `
    uniform sampler2D uTex0;
    uniform sampler2D uTex1;
    uniform float uProgress;
    uniform float uTime;
    varying vec2 vUv;

    vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
    vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
    vec4 permute(vec4 x){return mod289v4(((x*34.)+1.)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1./6.,1./3.);
      const vec4 D=vec4(0.,.5,1.,2.);
      vec3 i=floor(v+dot(v,C.yyy));
      vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz);
      vec3 l=1.-g;
      vec3 i1=min(g.xyz,l.zxy);
      vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx;
      vec3 x2=x0-i2+C.yyy;
      vec3 x3=x0-D.yyy;
      i=mod289v3(i);
      vec4 p=permute(permute(permute(
        i.z+vec4(0.,i1.z,i2.z,1.))
        +i.y+vec4(0.,i1.y,i2.y,1.))
        +i.x+vec4(0.,i1.x,i2.x,1.));
      float n_=.142857142857;
      vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.*floor(p*ns.z*ns.z);
      vec4 x_=floor(j*ns.z);
      vec4 y_=floor(j-7.*x_);
      vec4 x=x_*ns.x+ns.yyyy;
      vec4 y=y_*ns.x+ns.yyyy;
      vec4 h=1.-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy);
      vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.+1.;
      vec4 s1=floor(b1)*2.+1.;
      vec4 sh=-step(h,vec4(0.));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
      vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x);
      vec3 p1=vec3(a0.zw,h.y);
      vec3 p2=vec3(a1.xy,h.z);
      vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
      vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
      m=m*m;
      return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }

    void main(){
      vec2 uv = vUv;
      // Layered noise: slow large + fast small
      float n1 = snoise(vec3(uv * 3.0, uTime * 0.25)) * 0.5 + 0.5;
      float n2 = snoise(vec3(uv * 7.0, uTime * 0.18 + 5.0)) * 0.3 + 0.3;
      float noise = n1 * 0.65 + n2 * 0.35;
      // Diagonal bias so the wipe comes from the left
      float edge = smoothstep(uProgress - 0.38, uProgress + 0.38, noise + uv.x * 0.12);
      vec4 colA = texture2D(uTex0, uv);
      vec4 colB = texture2D(uTex1, uv);
      gl_FragColor = mix(colA, colB, edge);
    }
  `;

  function initWebGLGallery() {
    if (typeof THREE === 'undefined') return;
    if (typeof scrollama === 'undefined') return;

    var canvas = document.getElementById('webgl-gallery-canvas');
    if (!canvas) return;

    var container = canvas.parentElement;

    function getSize() {
      return { w: container.offsetWidth || window.innerWidth * 0.55, h: container.offsetHeight || window.innerHeight };
    }

    var sz = getSize();
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false });
    renderer.setSize(sz.w, sz.h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x070706, 1);

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    var geo = new THREE.PlaneGeometry(2, 2);
    var uniforms = {
      uTex0:     { value: null },
      uTex1:     { value: null },
      uProgress: { value: 0.0 },
      uTime:     { value: 0.0 },
    };

    var mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: uniforms,
    });

    var mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Collect gallery steps and preload textures
    var steps = Array.from(document.querySelectorAll('#st-steps-gallery .st-step'));
    var textures = new Array(steps.length).fill(null);
    var currentIndex = 0;

    var loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    steps.forEach(function (step, i) {
      var src = step.dataset.img;
      var fallback = step.dataset.fallback;

      function loadTex(url, onDone) {
        var t = loader.load(url, function (tex) {
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          onDone(tex);
        }, undefined, function () {
          if (fallback && url !== fallback) {
            loadTex(fallback, onDone);
          } else {
            // Create a plain dark texture as placeholder
            var data = new Uint8Array([7, 7, 6, 255]);
            var plain = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
            plain.needsUpdate = true;
            onDone(plain);
          }
        });
        return t;
      }

      if (src) {
        loadTex(src, function (tex) {
          textures[i] = tex;
          if (i === 0) {
            uniforms.uTex0.value = tex;
            uniforms.uTex1.value = tex;
          }
        });
      }
    });

    // Animate loop
    var clock = 0;
    var rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      clock += 0.008;
      uniforms.uTime.value = clock;
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', function () {
      var s = getSize();
      renderer.setSize(s.w, s.h);
    }, { passive: true });

    // Scrollama for gallery
    var labelEl = document.getElementById('st-gallery-label');
    var progressEl = document.getElementById('st-gallery-progress');

    var galleryScroller = scrollama();
    galleryScroller
      .setup({
        step: '#st-steps-gallery .st-step',
        offset: 0.5,
        debug: false,
      })
      .onStepEnter(function (response) {
        var element = response.element;
        var index = response.index;

        steps.forEach(function (s) { s.classList.remove('is-active'); });
        element.classList.add('is-active');

        // Update UI labels
        var domain = element.dataset.domain || '';
        if (labelEl) labelEl.textContent = domain.charAt(0).toUpperCase() + domain.slice(1);
        if (progressEl) progressEl.textContent = '0' + (index + 1) + ' / 0' + steps.length;

        // Clean cut — instant texture swap, no transition
        if (index !== currentIndex) {
          var nextTex = textures[index];
          if (nextTex) {
            if (typeof gsap !== 'undefined') gsap.killTweensOf(uniforms.uProgress);
            uniforms.uTex0.value = nextTex;
            uniforms.uTex1.value = nextTex;
            uniforms.uProgress.value = 1;
            currentIndex = index;
          }
        }
      })
      .onStepExit(function (response) {
        response.element.classList.remove('is-active');
      });

    window.addEventListener('resize', galleryScroller.resize);
  }

})();
