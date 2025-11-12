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
			// Tuned to hit prominent features on the side view (door/ramp/body)
			const fixed = [
				// Top-left photo -> upper body/front area
				{ x: 0.58, y: 0.34 },
				// Right photo -> door area
				{ x: 0.66, y: 0.33 },
				// Bottom-left photo -> ramp hinge / lower body
				{ x: 0.60, y: 0.60 },
				// Fallback anchors follow
				{ x: 0.44, y: 0.68 },
				{ x: 0.36, y: 0.30 },
				{ x: 0.20, y: 0.56 },
				{ x: 0.72, y: 0.70 },
				{ x: 0.82, y: 0.42 },
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
			// Arranged to match the reference composition: TL, R-mid, BL
			const spots = [
				{ x: 0.38, y: 0.2 }, // top-left
				{ x: 0.76, y: 0.32 }, // right mid-high
				{ x: 0.50, y: 0.76 }, // bottom-left
				{ x: 0.84, y: 0.76 }, // extra bottom-right
				{ x: 0.50, y: 0.14 },
				{ x: 0.50, y: 0.86 },
				{ x: 0.28, y: 0.46 },
				{ x: 0.72, y: 0.52 },
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

		function buildWavyPath(start, end, amplitudeFactor = 0.08) {
			// Multi-segment quadratic with gentle wave
			const dx = end.x - start.x;
			const dy = end.y - start.y;
			const len = Math.hypot(dx, dy) || 1;
			const ux = dx / len;
			const uy = dy / len;
			const px = -uy; // unit perpendicular
			const py = ux;

			const amp = Math.min(60, len * amplitudeFactor);

			// Segment points along the line
			const p1 = { x: start.x + dx * 0.33, y: start.y + dy * 0.33 };
			const p2 = { x: start.x + dx * 0.66, y: start.y + dy * 0.66 };

			const c1 = { x: start.x + dx * 0.16 + px * amp, y: start.y + dy * 0.16 + py * amp };
			const c2 = { x: start.x + dx * 0.50 - px * amp, y: start.y + dy * 0.50 - py * amp };
			const c3 = { x: start.x + dx * 0.84 + px * amp * 0.7, y: start.y + dy * 0.84 + py * amp * 0.7 };

			return [
				`M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`,
				`Q ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
				`Q ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
				`Q ${c3.x.toFixed(1)} ${c3.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
			].join(' ');
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
					// Slight size variations for nicer composition
					if (i === 1) {
            imgEl.style.width = 'clamp(160px, 22vw, 440px)';
					} else {
						imgEl.style.width = 'clamp(200px, 28vw, 560px)';
					}
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

					// Start fully hidden to avoid pre-animation dots
					line.style.opacity = '0';
					lineShadow.style.opacity = '0';

					items.push({ imgEl, line, lineShadow, anchor, index: i });
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
			const step = 0.55; // timeline units for each photo sequence
		state.items.forEach((it, i) => {
			const t = 0.8 + i * step; // start after base fade
				const L = pathLength(it.line);
				const Ls = pathLength(it.lineShadow);
			// Prepare dashes
				gsap.set([it.line, it.lineShadow], { strokeDasharray: L, strokeDashoffset: L + 2 });
				if (Ls && Ls !== L) gsap.set(it.lineShadow, { strokeDasharray: Ls, strokeDashoffset: Ls + 2 });

			tl.to(
				it.imgEl,
				{ opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
				t
				).to(
					[it.lineShadow, it.line],
					{ opacity: 1, duration: 0.2, ease: 'none' },
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
					const d = buildWavyPath(start, end, 0.09);
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
