import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins once
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  autoRaf: true,
  lerp: 0.3,
});

export { gsap, ScrollTrigger, lenis };