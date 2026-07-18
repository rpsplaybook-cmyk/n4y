/* ── HERO: FLOWING SILK RIBBONS + GOLD PARTICLES ── */
(function () {
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, mouse = { x: 0.5, y: 0.4 }, targetMouse = { x: 0.5, y: 0.4 };

  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    targetMouse.x = (e.clientX - r.left) / W;
    targetMouse.y = (e.clientY - r.top)  / H;
  });

  /* ── RIBBONS ── */
  const RIBBON_COLORS = [
    [200,170,142],  // accent warm gold
    [181,165,150],  // taupe
    [237,230,219],  // linen white
    [217,207,195],  // sand
    [158,142,128],  // warm-taupe deep
    [220,188,158],  // lighter gold
  ];

  class Ribbon {
    constructor(i, total) {
      this.i = i;
      this.total = total;
      this.reset(true);
    }
    reset(initial) {
      this.yBase   = (this.i / this.total) * 1.4 - 0.2; // spread across + beyond edges
      this.speed   = 0.00018 + Math.random() * 0.00022;
      this.amp     = 0.08 + Math.random() * 0.16;       // wave height
      this.freq    = 0.6  + Math.random() * 1.2;        // wave frequency
      this.phase   = Math.random() * Math.PI * 2;
      this.width   = 60 + Math.random() * 120;
      this.color   = RIBBON_COLORS[this.i % RIBBON_COLORS.length];
      this.alpha   = 0.13 + Math.random() * 0.18;
      this.offset  = initial ? Math.random() * Math.PI * 2 : 0;
      this.mouseInfluenceX = (Math.random() - 0.5) * 0.12;
      this.mouseInfluenceY = (Math.random() - 0.5) * 0.08;
    }
    draw(ts) {
      const t = ts * this.speed + this.offset;
      const mx = mouse.x - 0.5;
      const my = mouse.y - 0.5;

      ctx.beginPath();
      const STEPS = 120;
      for (let s = 0; s <= STEPS; s++) {
        const xN = s / STEPS;
        // base sine wave, mouse-warped
        const yN = this.yBase
          + Math.sin(xN * Math.PI * this.freq + t + this.phase) * this.amp
          + Math.sin(xN * Math.PI * this.freq * 0.5 + t * 0.7) * this.amp * 0.4
          + my * this.mouseInfluenceY
          + mx * this.mouseInfluenceX * xN;

        const x = xN * W;
        const y = yN * H;
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }

      const [r, g, b] = this.color;
      ctx.strokeStyle = `rgba(${r},${g},${b},${this.alpha})`;
      ctx.lineWidth   = this.width;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }
  }

  /* ── PARTICLES (floating gold motes) ── */
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x    = Math.random() * W;
      this.y    = H + 10;
      this.size = 1 + Math.random() * 2.5;
      this.vx   = (Math.random() - 0.5) * 0.5;
      this.vy   = -(0.3 + Math.random() * 0.7);
      this.life = 0;
      this.maxLife = 180 + Math.random() * 220;
      this.gold = Math.random() > 0.5;
    }
    update() {
      this.x += this.vx + (mouse.x - 0.5) * 0.08;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife || this.y < -10) this.reset();
    }
    draw() {
      const t = this.life / this.maxLife;
      const alpha = t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1;
      const [r, g, b] = this.gold ? [200, 170, 130] : [220, 210, 198];
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.85})`;
      ctx.fill();
      // soft glow
      if (this.gold) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,170,130,${alpha * 0.15})`;
        ctx.fill();
      }
    }
  }

  let ribbons, particles;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function init() {
    resize();
    ribbons   = Array.from({ length: 12 }, (_, i) => new Ribbon(i, 12));
    particles = Array.from({ length: 55 },  () => {
      const p = new Particle();
      p.y    = Math.random() * H; // scatter on init
      p.life = Math.floor(Math.random() * p.maxLife);
      return p;
    });
  }

  function draw(ts) {
    // Ease mouse
    mouse.x += (targetMouse.x - mouse.x) * 0.04;
    mouse.y += (targetMouse.y - mouse.y) * 0.04;

    // Background — rich animated gradient
    const bg = ctx.createLinearGradient(
      mouse.x * W * 0.4, 0,
      W, H
    );
    bg.addColorStop(0,   '#f0ebe1');
    bg.addColorStop(0.35,'#e8ddd0');
    bg.addColorStop(0.7, '#d9cfc3');
    bg.addColorStop(1,   '#c8bba9');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Draw ribbons back to front
    ctx.save();
    ctx.filter = 'blur(28px)';
    ribbons.forEach(r => r.draw(ts));
    ctx.restore();

    // Sharper thinner ribbons on top for definition
    ctx.save();
    ctx.filter = 'blur(6px)';
    ribbons.forEach((r, i) => {
      if (i % 3 === 0) {
        const orig = r.alpha;
        r.alpha = orig * 0.6;
        r.width = r.width * 0.18;
        r.draw(ts);
        r.alpha = orig;
        r.width = r.width / 0.18;
      }
    });
    ctx.restore();

    // Particles
    particles.forEach(p => { p.update(); p.draw(); });

    requestAnimationFrame(draw);
  }

  init();
  window.addEventListener('resize', init);
  requestAnimationFrame(draw);
})();

function toggleMenu() {
  document.getElementById('mobileNav').classList.toggle('open');
}

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  // close all
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  // open this one if it was closed
  if (!isOpen) item.classList.add('open');
}
