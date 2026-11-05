const root = document.documentElement;
const motionOn = () => root.dataset.motion === "on";
if (matchMedia("(prefers-reduced-motion: reduce)").matches) root.dataset.motion = "off";

const toggle = document.getElementById("mode-toggle");
const modePicks = document.querySelectorAll("[data-mode-pick]");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const syncMode = () => {
  const dark = root.dataset.mode === "dark";
  toggle.textContent = dark ? "Light" : "Dark";
  toggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  themeMeta.content = dark ? "#121516" : "#eceff0";
  modePicks.forEach(b => b.setAttribute("aria-pressed", b.dataset.modePick === root.dataset.mode));
};
const setMode = m => { root.dataset.mode = m; localStorage.setItem("jd-mode", m); syncMode(); };
syncMode();
toggle.addEventListener("click", () => setMode(root.dataset.mode === "dark" ? "light" : "dark"));
modePicks.forEach(b => b.addEventListener("click", () => setMode(b.dataset.modePick)));

// Mobile menu
const menu = document.getElementById("site-menu");
const menuBtn = document.getElementById("menu-btn");
const mainEl = document.querySelector("main");
const setMenu = open => {
  menu.classList.toggle("open", open);
  menu.inert = !open;
  mainEl.inert = open;
  root.classList.toggle("menu-open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
menuBtn.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", e => { if (e.key === "Escape" && menu.classList.contains("open")) { setMenu(false); menuBtn.focus(); } });
matchMedia("(min-width: 901px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

document.querySelectorAll(".track-inner").forEach(t => {
  const html = t.dataset.items.split("|").map(s => `<span>${s}</span><span class="dot">✺</span>`).join("");
  t.innerHTML = html + html + html + html;
});

setTimeout(() => document.getElementById("hero-title").classList.add("in"), motionOn() ? 450 : 0);
(() => {
  const g = document.querySelector(".gallery"); if (!g) return;
  const slides = [...g.querySelectorAll(".slide")], dots = [...g.querySelectorAll(".g-dots button")];
  const name = g.querySelector(".g-name"), cap = g.querySelector(".g-cap");
  let i = 0, paused = false, timer;
  const show = n => {
    i = (n + slides.length) % slides.length;
    slides.forEach((x, k) => x.classList.toggle("on", k === i));
    dots.forEach((d, k) => k === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current"));
    name.textContent = slides[i].dataset.name; cap.textContent = slides[i].dataset.cap;
  };
  const tick = () => { if (!paused && motionOn() && !document.hidden) show(i + 1); };
  const start = () => { clearInterval(timer); timer = setInterval(tick, 6000); };
  dots.forEach((d, k) => d.addEventListener("click", () => { show(k); start(); }));
  g.addEventListener("mouseenter", () => paused = true); g.addEventListener("mouseleave", () => paused = false);
  g.addEventListener("focusin", () => paused = true); g.addEventListener("focusout", () => paused = false);
  start();
})();

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

// Career: vertical scroll drives a horizontal track; the active era sets the palette and adds its skills.
const career = document.getElementById("career");
const tl = career.querySelector(".tl");
const track = career.querySelector(".tl-track");
const eras = [...career.querySelectorAll(".era")];
const chips = [...career.querySelectorAll(".chips span")];
const narrow = matchMedia("(max-width: 900px)");
let active = -1;
function setActive(i) {
  if (i === active) return;
  active = i;
  career.dataset.chapter = String(Math.max(i, 0) + 1);
  eras.forEach((e, j) => e.classList.toggle("on", j === i));
  chips.forEach(c => { const n = +c.dataset.era; c.classList.toggle("on", n <= i); c.classList.toggle("fresh", n === i); });
}
function updateTimeline() {
  if (narrow.matches) {
    let i = 0; eras.forEach((e, j) => { if (e.getBoundingClientRect().top < innerHeight * .55) i = j; });
    setActive(i); return;
  }
  const r = tl.getBoundingClientRect();
  const run = tl.offsetHeight - (innerHeight - 64);
  const p = Math.min(1, Math.max(0, (64 - r.top) / run));
  const last = eras[eras.length - 1];
  const max = Math.max(0, last.offsetLeft - innerWidth * .32);
  const x = Math.min(1, p / .85) * max;
  track.style.transform = `translateX(${-x}px)`;
  let best = -1, bestD = Infinity;
  eras.forEach((e, j) => { const c = e.offsetLeft - x + e.offsetWidth * .3; const d = Math.abs(c - innerWidth * .45); if (d < bestD) { bestD = d; best = j; } });
  setActive(p < .04 ? -1 : p > .8 ? eras.length - 1 : best);
}
let ticking = false;
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { updateTimeline(); ticking = false; }); } }, { passive: true });
addEventListener("resize", updateTimeline);
updateTimeline();

const blobs = [...document.querySelectorAll(".blob-wrap")];
let tx = 0, ty = 0, cx = 0, cy = 0;
addEventListener("pointermove", e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; });
(function loop() {
  cx += (tx - cx) * .06; cy += (ty - cy) * .06;
  const s = motionOn() ? 1 : 0;
  blobs.forEach(b => { const d = +b.dataset.depth * s; b.style.transform = `translate(${cx * d}px, ${cy * d + scrollY * d / 400}px)`; });
  requestAnimationFrame(loop);
})();
