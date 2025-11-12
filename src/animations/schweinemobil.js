import { gsap, ScrollTrigger } from '../gsapSetup.js';

/**
 * Schweinemobil sticky showcase
 * - Pins the section while animating
 * - Fades in base technical drawing first
 * - Then reveals photos one by one at various screen positions
 * - For each photo, draws a line to a feature point on the base drawing
 */
export function initSchweinemobil() {
	const section = document.getElementById('schweinemobil');
	if (!section) return;

	const stage = section.querySelector('.schweinemobil-stage');
	const baseImg = section.querySelector('.smobil-base');
	const svg = section.querySelector('.smobil-lines');
	const photosHost = section.querySelector('.smobil-photos');
	if (!stage || !baseImg || !svg || !photosHost) return;

	// Load all images from folder and split base vs. detail photos
	const modules = import.meta.glob('../../assets/img/schweinemobil/*.{webp,jpg,jpeg,png}', { eager: true, import: 'default' });
	const entries = Object.entries(modules).map(([k, url]) => ({ key: k, url }));
	const base = entries.find(e => /seite-hinten\.(webp|jpe?g|png)$/i.test(e.key))?.url;
	const detailPhotos = entries
		.filter(e => !/seite-hinten\.(webp|jpe?g|png)$/i.test(e.key))
		.map(e => e.url);

	if (base) baseImg.src = base;

	const state = {
		items: [], // {imgEl, pathEl, start, end}
		anchors: [],
		positions: [],
	};

	function waitImage(img) {
		return new Promise((resolve) => {
			if (img.complete && img.naturalWidth) return resolve();
			img.addEventListener('load', () => resolve(), { once: true });
			img.addEventListener('error', () => resolve(), { once: true });
		});
	}

	// Generate anchor points on the base image in normalized coordinates
	function generateAnchors(n) {
		const fixed = [
			{ x: 0.18, y: 0.42 },
			{ x: 0.62, y: 0.30 },
			{ x: 0.78, y: 0.56 },
			{ x: 0.48, y: 0.70 },
			{ x: 0.32, y: 0.26 },
			{ x: 0.12, y: 0.58 },
			{ x: 0.66, y: 0.70 },
			{ x: 0.86, y: 0.40 },
		];
		if (n <= fixed.length) return fixed.slice(0, n);
		// For extras, place around a ring near the perimeter
		const out = fixed.slice();
		const extras = n - fixed.length;
		for (let i = 0; i < extras; i++) {
			const t = (i / extras) * Math.PI * 2;
			out.push({ x: 0.5 + 0.34 * Math.cos(t), y: 0.5 + 0.30 * Math.sin(t) });
		}
		return out;
	}

	// Generate on-stage absolute positions (as normalized stage coords)
	function generatePositions(n) {
		const spots = [
			{ x: 0.14, y: 0.18 },
			{ x: 0.86, y: 0.24 },
			{ x: 0.14, y: 0.74 },
			{ x: 0.86, y: 0.76 },
			{ x: 0.50, y: 0.12 },
			{ x: 0.50, y: 0.88 },
			{ x: 0.26, y: 0.46 },
			{ x: 0.74, y: 0.52 },
		];
		if (n <= spots.length) return spots.slice(0, n);
		const out = spots.slice();
		const extras = n - spots.length;
		for (let i = 0; i < extras; i++) {
			const angle = (i / extras) * Math.PI * 2;
			out.push({ x: 0.5 + 0.40 * Math.cos(angle), y: 0.5 + 0.40 * Math.sin(angle) });
		}
		return out;
	}

	// Ensure SVG uses stage pixel coordinates
	function setSvgViewBox() {
		const r = stage.getBoundingClientRect();
		svg.setAttribute('viewBox', `0 0 ${Math.max(100, Math.round(r.width))} ${Math.max(100, Math.round(r.height))}`);
		svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
	}

	function toStagePoint(clientX, clientY) {
		const r = stage.getBoundingClientRect();
		return { x: clientX - r.left, y: clientY - r.top };
	}

	function anchorToStage(anchor) {
		const baseR = baseImg.getBoundingClientRect();
		const p = { x: baseR.left + baseR.width * anchor.x, y: baseR.top + baseR.height * anchor.y };
		return toStagePoint(p.x, p.y);
	}

	function imgCenterToStage(imgEl) {
		const ir = imgEl.getBoundingClientRect();
		return toStagePoint(ir.left + ir.width / 2, ir.top + ir.height / 2);
	}

	function buildPath(start, end, bend = 0.18) {
		// Quadratic curve with slight outward bend
		const mx = (start.x + end.x) / 2;
		const my = (start.y + end.y) / 2;
		const dx = end.x - start.x;
		const dy = end.y - start.y;
		const len = Math.hypot(dx, dy) || 1;
		const nx = -dy / len;
		const ny = dx / len;
		const cpx = mx + nx * len * bend;
		const cpy = my + ny * len * bend;
		return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
	}

	function pathLength(el) {
		try { return el.getTotalLength(); } catch { return 0; }
	}

	function brandColor() {
		// Try to read CSS var --color-brand; fallback to a sensible default
		const root = getComputedStyle(document.documentElement);
		return root.getPropertyValue('--color-brand')?.trim() || '#222750';
	}

	async function setup() {
		setSvgViewBox();
		await waitImage(baseImg);
		setSvgViewBox();

		const n = detailPhotos.length;
		state.anchors = generateAnchors(n);
		state.positions = generatePositions(n);

		// Create elements for each detail photo
		const items = [];
		for (let i = 0; i < n; i++) {
			const url = detailPhotos[i];
			const pos = state.positions[i];
			const anchor = state.anchors[i];

			const imgEl = document.createElement('img');
			imgEl.src = url;
			imgEl.alt = 'Detail';
			imgEl.className = 'absolute rounded-xl border-8 border-white shadow-2xl shadow-black/30 object-cover opacity-0 will-change-transform';
			imgEl.style.width = 'clamp(160px, 22vw, 420px)';
			imgEl.style.height = 'auto';
			imgEl.style.left = `${pos.x * 100}%`;
			imgEl.style.top = `${pos.y * 100}%`;
			imgEl.style.transform = 'translate(-50%, -50%)';
			imgEl.decoding = 'async';
			photosHost.appendChild(imgEl);

			// Create SVG group: shadowed line (white) + colored line
			const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
			const lineShadow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			lineShadow.setAttribute('fill', 'none');
			lineShadow.setAttribute('stroke', 'white');
			lineShadow.setAttribute('stroke-width', '6');
			lineShadow.setAttribute('stroke-linecap', 'round');
			lineShadow.setAttribute('stroke-linejoin', 'round');

			const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			line.setAttribute('fill', 'none');
			line.setAttribute('stroke', brandColor());
			line.setAttribute('stroke-width', '3');
			line.setAttribute('stroke-linecap', 'round');
			line.setAttribute('stroke-linejoin', 'round');

			g.appendChild(lineShadow);
			g.appendChild(line);
			svg.appendChild(g);

			items.push({ imgEl, line, lineShadow, anchor });
		}
		state.items = items;

		// Initial path layout
		layoutPaths();

		// Build timeline
		const totalSteps = Math.max(1, state.items.length);
		const endPerc = 100 + totalSteps * 50; // dynamic length based on items
		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: section,
				start: 'top top',
				end: `+=${endPerc}%`,
				scrub: true,
				pin: true,
				anticipatePin: 1,
				onRefresh: layoutPaths,
			},
			defaults: { ease: 'power2.out' },
		});

		// Base image slow fade-in
		tl.to(baseImg, { opacity: 1, duration: 0.8 }, 0);

		// Stagger details
		const step = 0.5; // timeline units for each photo sequence
		state.items.forEach((it, i) => {
			const t = 0.8 + i * step; // start after base fade
			const L = pathLength(it.line);
			const Ls = pathLength(it.lineShadow);
			// Prepare dashes
			gsap.set([it.line, it.lineShadow], { strokeDasharray: L, strokeDashoffset: L });
			if (Ls && Ls !== L) gsap.set(it.lineShadow, { strokeDasharray: Ls, strokeDashoffset: Ls });

			tl.to(
				it.imgEl,
				{ opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
				t
			).fromTo(
				[it.lineShadow, it.line],
				{ strokeDashoffset: (idx) => (idx === 0 ? Ls : L) },
				{ strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' },
				t + 0.1
			);
		});

		// Keep references for potential external debugging
		return tl;
	}

	function layoutPaths() {
		setSvgViewBox();
		// Recompute all path geometries
		for (const it of state.items) {
			const start = imgCenterToStage(it.imgEl);
			const end = anchorToStage(it.anchor);
			const d = buildPath(start, end, 0.16);
			it.line.setAttribute('d', d);
			it.lineShadow.setAttribute('d', d);
		}
	}

	// Keep geometry correct on resize
	const ro = new ResizeObserver(() => layoutPaths());
	ro.observe(stage);
	window.addEventListener('resize', layoutPaths, { passive: true });

	setup().catch((e) => console.error('Schweinemobil setup failed', e));
}

	// Note: initialization is handled from main.js to avoid double inits
