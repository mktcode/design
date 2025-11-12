import { gsap } from '../gsapSetup.js';

export function initHeroParallax() {
  initHeroVideoCrossfade();

  const heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  })
    .to('header h1', { y: -50, opacity: 0, ease: 'none' }, 0)
    .fromTo(
      '.hero-media',
      { scale: 1, filter: 'blur(0px)' },
      { scale: 1.35, filter: 'blur(50px)', ease: 'none' },
      0
    )
    .to('.hero-overlay', { opacity: 1, duration: 0.2, ease: 'none' }, 0)

  // Subtle upward motion for hero fades
  try {
    const heroFadeNodeList = document.querySelectorAll('#hero .fade-in');
    for (let i = 0; i < heroFadeNodeList.length; i++) {
      const el = heroFadeNodeList[i];
      gsap.to(el, {
        y: -20,
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
        ease: 'none',
      });
    }
  } catch (e) {
    console.warn('Hero fade setup skipped', e);
  }

  return heroTl;
}

function initHeroVideoCrossfade() {
  const parallaxContainer = document.querySelector('[data-parallax-container]');
  if (!parallaxContainer) return;

  const overlay = parallaxContainer.querySelector('.hero-overlay');
  const baseVideo = parallaxContainer.querySelector('video.hero-bg');
  if (!overlay || !baseVideo) return;

  // Create a wrapper that will receive the parallax transform/blur
  let mediaWrapper = parallaxContainer.querySelector('.hero-media');
  if (!mediaWrapper) {
    mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'hero-media absolute inset-0 h-full w-full pointer-events-none will-change-transform';
    parallaxContainer.insertBefore(mediaWrapper, overlay);
  }

  // Ensure videos stack on top of each other under the overlay
  function ensureStacking(videoEl) {
    videoEl.classList.add('absolute');
    videoEl.classList.add('inset-0');
    videoEl.classList.add('h-full');
    videoEl.classList.add('w-full');
    videoEl.classList.add('object-cover');
    videoEl.classList.add('will-change-transform');
    videoEl.classList.add('pointer-events-none');
    videoEl.style.opacity = videoEl === baseVideo ? '1' : '0';
  }

  // Move the existing base video into the wrapper so transforms apply to all children
  ensureStacking(baseVideo);
  mediaWrapper.appendChild(baseVideo);

  // Define sources to rotate
  const sources = [
    './assets/video/hero1.webm',
    './assets/video/hero2.webm',
    './assets/video/hero3.webm',
  ];

  // If base video has no src attribute but <source>, keep as-is; otherwise ensure it's first source
  const baseSrc = baseVideo.currentSrc || baseVideo.getAttribute('src') || (baseVideo.querySelector('source')?.getAttribute('src') ?? '');
  // Keep order starting with the current one to avoid sudden jump on first switch
  let startIndex = Math.max(0, sources.findIndex((s) => baseSrc.endsWith(s.replace('./', '')) || baseSrc.includes(s)));
  if (startIndex < 0) startIndex = 0;

  // Build video elements list, reusing base for sources[startIndex]
  const videos = [baseVideo];

  // Helper to create a new video element
  function createVideo(src) {
    const v = document.createElement('video');
    v.className = baseVideo.className; // inherit classes like 'hero-bg'
    v.muted = true;
    v.loop = true;
    v.autoplay = true;
    v.playsInline = true;
    v.setAttribute('preload', 'auto');
    v.src = src;
    ensureStacking(v);
    // Insert inside the wrapper (under overlay via wrapper placement)
    mediaWrapper.appendChild(v);
    // Ensure videos start from 0 so their visible time equals their own duration
    v.addEventListener('loadedmetadata', () => {
      try { v.currentTime = 0; } catch {}
    });
    // Best-effort autoplay; ignore errors
    v.play().catch(() => {});
    return v;
  }

  // Create remaining videos in a rotated order so "next" follows current
  const rotated = sources.slice(startIndex + 1).concat(sources.slice(0, startIndex));
  for (const src of rotated) {
    videos.push(createVideo(src));
  }

  // Only keep the first video playing initially to save CPU; pause others
  for (let i = 1; i < videos.length; i++) {
    try { videos[i].pause(); } catch {}
  }

  let active = 0;
  const defaultFade = 2.0; // seconds

  let timerId = null;
  let visible = true;

  function effectiveFadeFor(video) {
    const d = video?.duration;
    if (!(d > 0) || !isFinite(d)) return defaultFade;
    // If the video is very short, shorten the fade proportionally
    if (d <= defaultFade + 0.1) return Math.max(0.3, d * 0.45);
    return defaultFade;
  }

  function scheduleForActive() {
    clearTimeout(timerId);
    if (!visible) return;
    const v = videos[active];
    const schedule = () => {
      const fade = effectiveFadeFor(v);
      const d = v.duration;
      if (!(d > 0) || !isFinite(d)) return; // wait until metadata is available
      const remaining = Math.max(0, d - v.currentTime - fade);
      timerId = setTimeout(() => {
        crossfadeTo((active + 1) % videos.length, fade);
      }, remaining * 1000);
    };
    if (!(v.duration > 0) || !isFinite(v.duration)) {
      v.addEventListener('loadedmetadata', schedule, { once: true });
    } else {
      schedule();
    }
  }

  function crossfadeTo(nextIndex, fadeOverride) {
    if (nextIndex === active) return scheduleForActive();
    const current = videos[active];
    const next = videos[nextIndex];

    // Ensure next is the uppermost within wrapper (last child wins in our absolute stack)
    mediaWrapper.appendChild(next);

    // Prepare/prime next
    try {
      next.currentTime = 0;
      // Start playing next a moment before the fade
      next.play().catch(() => {});
    } catch {}

    gsap.killTweensOf([current, next]);
    const fadeDuration = fadeOverride ?? effectiveFadeFor(current);
    gsap.to(next, { opacity: 1, duration: fadeDuration, ease: 'power2.inOut' });
    gsap.to(current, {
      opacity: 0,
      duration: fadeDuration,
      ease: 'power2.inOut',
      onComplete: () => {
        // Pause the one that faded out to save CPU
        try { current.pause(); } catch {}
        active = nextIndex;
        scheduleForActive();
      },
    });
  }

  // Pause/resume crossfade when hero not visible to save resources
  try {
    const hero = document.querySelector('#hero');
    if (hero && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            visible = entry.isIntersecting && entry.intersectionRatio > 0.05;
            if (visible) {
              // resume active video and schedule next based on remaining time
              try { videos[active].play().catch(() => {}); } catch {}
              scheduleForActive();
            } else {
              clearTimeout(timerId);
              // pause all to save resources while offscreen
              for (let i = 0; i < videos.length; i++) {
                try { videos[i].pause(); } catch {}
              }
            }
          }
        },
        { threshold: [0, 0.05, 0.1] }
      );
      io.observe(hero);
    }
  } catch {}

  // Start scheduling after a small delay to allow initial load
  scheduleForActive();
}
