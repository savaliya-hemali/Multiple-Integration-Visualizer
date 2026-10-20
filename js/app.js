const $ = id => document.getElementById(id), TAU = Math.PI * 2, PI = Math.PI, sq = Math.sqrt, cos = Math.cos, sin = Math.sin;
const c = $("c"), g = c.getContext("2d"); let W, H;
const S = { mode: "cart", ord: "I", sys: "cart", ax: "x", eq: ["y=x^2/2", "y=2x"], vw: "3", tv: "3", dv: "3", pl: "xy", mt: "mid", fxy: "1", frt: "1", fxyz: "1", lockedView: false, sliderMeta: {}, hiddenEq: {} };
let yaw = -.7, pit = .45, zoom3D = 1, lastPinchDist = 0, drag = null;
const reset3DView = () => { yaw = -.7; pit = .45; zoom3D = 1; };
const is3D = () => (S.mode === "tri" && S.tv === "3") || (S.mode === "rev" && S.vw === "3") || (S.mode === "cart" && S.dv !== "2") || (S.mode === "polar" && S.dv !== "2");
const hint3D = () => S.lockedView ? "🔒 View is locked. Click 'View Locked' to unlock camera rotation and zoom." : "Drag to rotate 3D view. Scroll or pinch to zoom. Double-click or click 'Reset View' to reset view.";
const hint2D = () => S.lockedView ? "🔒 View is locked. Click 'View Locked' to unlock panning and zoom." : "Drag to pan, pinch or scroll to zoom. Double-click or click 'Reset View' to reset view.";
const F = v => { if (!isFinite(v)) return "" + v; const n = +Number(v).toFixed(4); return "" + (Object.is(n, -0) ? 0 : n) }, F6 = v => { if (!isFinite(v)) return "" + v; return Number(v).toFixed(6) }; let GL = ["x", "y"];
const announce = text => {
  const el = $("sr-announcements");
  if (!el) return;
  el.textContent = "";
  setTimeout(() => { el.textContent = text; }, 50);
};
const finalAnsHtml = (label, val) => `<div class="final-ans"><span>${label}</span><span class="final-val">${val}</span></div>`;
const CR = [
  { n: "Parabola & Line", a: 0, b: 1, lo: x => x * x, hi: x => x, I: "0 ≤ x ≤ 1,  x² ≤ y ≤ x", c: 0, d: 1, l: y => y, r: sq, II: "0 ≤ y ≤ 1,  y ≤ x ≤ √y", v: ["0", "1", "x^2", "x"] },
  { n: "Parabola", a: 0, b: 2, lo: x => 0, hi: x => x * x, I: "0 ≤ x ≤ 2,  0 ≤ y ≤ x²", c: 0, d: 4, l: sq, r: y => 2, II: "0 ≤ y ≤ 4,  √y ≤ x ≤ 2", v: ["0", "2", "0", "x^2"] },
  { n: "Quarter Disc", a: 0, b: 1, lo: x => 0, hi: x => sq(1 - x * x), I: "0 ≤ x ≤ 1,  0 ≤ y ≤ √(1 − x²)", c: 0, d: 1, l: y => 0, r: y => sq(1 - y * y), II: "0 ≤ y ≤ 1,  0 ≤ x ≤ √(1 − y²)", v: ["0", "1", "0", "sqrt(1-x^2)"] },
  { n: "Triangle", a: 0, b: 1, lo: x => x, hi: x => 1, I: "0 ≤ x ≤ 1,  x ≤ y ≤ 1", c: 0, d: 1, l: y => 0, r: y => y, II: "0 ≤ y ≤ 1,  0 ≤ x ≤ y", v: ["0", "1", "x", "1"] },
  { n: "Diamond", a: -1, b: 1, lo: x => -(1 - Math.abs(x)), hi: x => 1 - Math.abs(x), I: "−1 ≤ x ≤ 1,  −(1 − |x|) ≤ y ≤ 1 − |x|", c: -1, d: 1, l: y => -(1 - Math.abs(y)), r: y => 1 - Math.abs(y), II: "−1 ≤ y ≤ 1,  −(1 − |y|) ≤ x ≤ 1 − |y|", v: ["-1", "1", "-(1-abs(x))", "1-abs(x)"] }];
const PR = [
  { n: "Disc", a: 0, b: TAU, lo: t => 0, hi: t => 2, T: "0 ≤ θ ≤ 2π,  0 ≤ r ≤ 2", v: ["0", "2pi", "0", "2"] },
  { n: "Cardioid", a: 0, b: TAU, lo: t => 0, hi: t => 1 + cos(t), T: "0 ≤ θ ≤ 2π,  0 ≤ r ≤ 1 + cos θ", v: ["0", "2pi", "0", "1+cos(t)"] },
  { n: "Circle", a: -PI / 2, b: PI / 2, lo: t => 0, hi: t => 2 * cos(t), T: "−π/2 ≤ θ ≤ π/2,  0 ≤ r ≤ 2 cos θ", v: ["-pi/2", "pi/2", "0", "2cos(t)"] },
  { n: "Half Ring", a: 0, b: PI, lo: t => 1, hi: t => 2, T: "0 ≤ θ ≤ π,  1 ≤ r ≤ 2", v: ["0", "pi", "1", "2"] },
  { n: "Inside Cardioid", a: -PI / 2, b: PI / 2, lo: t => 1, hi: t => 1 + cos(t), T: "−π/2 ≤ θ ≤ π/2,  1 ≤ r ≤ 1 + cos θ", v: ["-pi/2", "pi/2", "1", "1+cos(t)"] },
  { n: "Sector", a: 0, b: PI / 4, lo: t => 0, hi: t => 2, T: "0 ≤ θ ≤ π/4,  0 ≤ r ≤ 2", v: ["0", "pi/4", "0", "2"] }];
const CT = {
  cart: [
    { n: "Box 2 × 1 × 1.5", box: [0, 2, 0, 1, 0, 1.5], f: () => true, V: 3, b: "0 ≤ x ≤ 2,  0 ≤ y ≤ 1,  0 ≤ z ≤ 1.5", vs: "3", v: ["0", "2", "0", "1", "0", "1.5"] },
    { n: "Tetrahedron x + y + z ≤ 1", box: [0, 1, 0, 1, 0, 1], f: (x, y, z) => x + y + z <= 1, V: 1 / 6, b: "0 ≤ x ≤ 1,  0 ≤ y ≤ 1 − x,  0 ≤ z ≤ 1 − x − y", vs: "1/6", v: ["0", "1", "0", "1-x", "0", "1-x-y"] },
    { n: "Parabolic cylinder y = x², y + z = 1", box: [-1, 1, 0, 1, 0, 1], f: (x, y, z) => y >= x * x && z <= 1 - y, V: 8 / 15, b: "−1 ≤ x ≤ 1,  x² ≤ y ≤ 1,  0 ≤ z ≤ 1 − y", vs: "8/15", v: ["-1", "1", "x^2", "1", "0", "1-y"] }],
  cyl: [
    { n: "Cylinder r ≤ 2, 0 ≤ z ≤ 3", box: [-2, 2, -2, 2, 0, 3], f: (x, y) => x * x + y * y <= 4, V: 12 * PI, b: "0 ≤ θ ≤ 2π,  0 ≤ r ≤ 2,  0 ≤ z ≤ 3", vs: "12π", v: ["0", "2pi", "0", "2", "0", "3"] },
    { n: "Paraboloid r² ≤ z ≤ 4", box: [-2, 2, -2, 2, 0, 4], f: (x, y, z) => z >= x * x + y * y, V: 8 * PI, b: "0 ≤ θ ≤ 2π,  0 ≤ r ≤ 2,  r² ≤ z ≤ 4", vs: "8π", v: ["0", "2pi", "0", "2", "r^2", "4"] },
    { n: "Cone r ≤ z ≤ 2", box: [-2, 2, -2, 2, 0, 2], f: (x, y, z) => z >= Math.hypot(x, y), V: 8 * PI / 3, b: "0 ≤ θ ≤ 2π,  0 ≤ r ≤ 2,  r ≤ z ≤ 2", vs: "8π/3", v: ["0", "2pi", "0", "2", "r", "2"] }],
  sph: [
    { n: "Sphere ρ ≤ 2", box: [-2, 2, -2, 2, -2, 2], f: (x, y, z) => x * x + y * y + z * z <= 4, V: 32 * PI / 3, b: "0 ≤ θ ≤ 2π,  0 ≤ φ ≤ π,  0 ≤ ρ ≤ 2", vs: "32π/3", v: ["0", "2pi", "0", "pi", "0", "2"] },
    { n: "Upper hemisphere", box: [-2, 2, -2, 2, 0, 2], f: (x, y, z) => x * x + y * y + z * z <= 4, V: 16 * PI / 3, b: "0 ≤ θ ≤ 2π,  0 ≤ φ ≤ π/2,  0 ≤ ρ ≤ 2", vs: "16π/3", v: ["0", "2pi", "0", "pi/2", "0", "2"] },
    { n: "Ice-cream cone φ ≤ π/4, ρ ≤ 2", box: [-1.5, 1.5, -1.5, 1.5, 0, 2], f: (x, y, z) => { const r = sq(x * x + y * y + z * z); return r <= 2 && z >= r * Math.SQRT1_2 }, V: 16 * PI / 3 * (1 - Math.SQRT1_2), b: "0 ≤ θ ≤ 2π,  0 ≤ φ ≤ π/4,  0 ≤ ρ ≤ 2", vs: "(16π/3)(1 − √2/2)", v: ["0", "2pi", "0", "pi/4", "0", "2"] },
    { n: "Shell 1 ≤ ρ ≤ 2", box: [-2, 2, -2, 2, -2, 2], f: (x, y, z) => { const q = x * x + y * y + z * z; return q >= 1 && q <= 4 }, V: 28 * PI / 3, b: "0 ≤ θ ≤ 2π,  0 ≤ φ ≤ π,  1 ≤ ρ ≤ 2", vs: "28π/3", v: ["0", "2pi", "0", "pi", "1", "2"] }]
};
const DV = { cart: ["dV = dx dy dz", "—"], cyl: ["dV = r dz dr dθ", "x = r cos θ,  y = r sin θ,  z = z"], sph: ["dV = ρ² sin φ dρ dφ dθ", "x = ρ sin φ cos θ,  y = ρ sin φ sin θ,  z = ρ cos φ"] };
const FN = ["sin", "cos", "tan", "sec", "csc", "cot", "sinh", "cosh", "tanh", "asin", "acos", "atan", "asec", "acsc", "acot", "asinh", "acosh", "atanh", "sqrt", "cbrt", "abs", "sign", "floor", "ceil", "round", "trunc", "fact", "exp", "log", "ln", "lgten", "lgtwo", "rad", "deg", "max", "min", "mod", "atan2", "hypot", "pow", "root", "logb", "gcd", "lcm", "ncr", "npr", "gamma", "erf", "erfc", "sinc", "frac", "step", "ramp", "sqr", "cube", "recip", "lgonep", "expmone", "exptwo", "sech", "csch", "coth", "asech", "acsch", "acoth", "clamp", "avg", "mean", "median", "stdev", "stdevp", "var", "varp", "cov", "covp", "mad", "corr", "spearman", "stats", "count", "total", "quartile", "quantile", "lerp", "dist"];
const FM = { ln: Math.log, log: Math.log, lgten: Math.log10, lgtwo: Math.log2, sec: x => 1 / Math.cos(x), csc: x => 1 / Math.sin(x), cot: x => 1 / Math.tan(x), asec: x => Math.acos(1 / x), acsc: x => Math.asin(1 / x), acot: x => Math.atan(1 / x), rad: x => x * Math.PI / 180, lgonep: Math.log1p, expmone: Math.expm1, exptwo: x => Math.pow(2, x), erf: x => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + .3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x)) }, erfc: x => 1 - FM.erf(x), sinc: x => x === 0 ? 1 : Math.sin(x) / x, frac: x => x - Math.floor(x), step: x => x >= 0 ? 1 : 0, ramp: x => Math.max(0, x), sqr: x => x * x, cube: x => x * x * x, recip: x => 1 / x, sech: x => 1 / Math.cosh(x), csch: x => 1 / Math.sinh(x), coth: x => 1 / Math.tanh(x), asech: x => Math.acosh(1 / x), acsch: x => Math.asinh(1 / x), acoth: x => Math.atanh(1 / x), clamp: (x, a, b) => Math.min(Math.max(x, a), b), avg: (a, b) => (a + b) / 2, lerp: (a, b, t) => a + (b - a) * t, dist: (a, b, c, d) => Math.hypot(c - a, d - b), mod: (a, b) => ((a % b) + b) % b, root: (x, n) => x < 0 && Math.abs(n % 2) === 1 ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n), logb: (x, b) => Math.log(x) / Math.log(b), gcd: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b] } return a }, lcm: (a, b) => { const g2 = FM.gcd(a, b); return g2 ? Math.abs(a * b) / g2 : 0 }, ncr: (n, r) => FM.fact(n) / (FM.fact(r) * FM.fact(n - r)), npr: (n, r) => FM.fact(n) / FM.fact(n - r), gamma: x => { if (x < .5) return Math.PI / (Math.sin(Math.PI * x) * FM.gamma(1 - x)); x -= 1; const c = [.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; let s = c[0]; const t = x + 7.5; for (let i = 1; i < 9; i++)s += c[i] / (x + i); return Math.sqrt(2 * Math.PI) * Math.pow(t, x + .5) * Math.exp(-t) * s }, deg: x => x * 180 / Math.PI, fact: x => { if (x < 0 || x !== Math.floor(x) || x > 170) return NaN; let r = 1; for (let i = 2; i <= x; i++)r *= i; return r }, mean: (...a) => a.reduce((x, y) => x + y, 0) / (a.length || 1), median: (...a) => { const s = a.slice().sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }, total: (...a) => a.reduce((x, y) => x + y, 0), count: (...a) => a.length, stdev: (...a) => { const avg = a.reduce((x, y) => x + y, 0) / (a.length || 1); return Math.sqrt(a.reduce((s, x) => s + Math.pow(x - avg, 2), 0) / Math.max(1, a.length - 1)) }, stdevp: (...a) => { const avg = a.reduce((x, y) => x + y, 0) / (a.length || 1); return Math.sqrt(a.reduce((s, x) => s + Math.pow(x - avg, 2), 0) / (a.length || 1)) }, var: (...a) => { const avg = a.reduce((x, y) => x + y, 0) / (a.length || 1); return a.reduce((s, x) => s + Math.pow(x - avg, 2), 0) / Math.max(1, a.length - 1) }, varp: (...a) => { const avg = a.reduce((x, y) => x + y, 0) / (a.length || 1); return a.reduce((s, x) => s + Math.pow(x - avg, 2), 0) / (a.length || 1) }, mad: (...a) => { const avg = a.reduce((x, y) => x + y, 0) / (a.length || 1); return a.reduce((s, x) => s + Math.abs(x - avg), 0) / (a.length || 1) }, cov: (x, y) => 0, covp: (x, y) => 0, corr: (x, y) => 1, spearman: (x, y) => 1, quartile: (a, q) => a, quantile: (a, q) => a, stats: (...a) => a[0] || 0 };
const esc = s => String(s).replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
function mk(s, vars) {
  const t = (String(s).toLowerCase().replace(/π/g, "pi").replace(/θ/g, "t").replace(/√/g, "sqrt").replace(/²/g, "^2").replace(/³/g, "^3").replace(/log10/g, "lgten").replace(/log2/g, "lgtwo").replace(/log1p/g, "lgonep").replace(/expm1/g, "expmone").replace(/exp2/g, "exptwo").replace(/\s+/g, "").match(/\d+\.?\d*|\.\d+|[a-z]+|./g)) || [];
  const tk = []; t.forEach(w => { if (/^[a-z]+$/.test(w) && !FN.includes(w) && w !== "pi" && w !== "tau" && w !== "phi") { for (const ch of w) { if (!(vars.includes(ch) || ch === "e")) throw Error("Unknown '" + w + "'"); tk.push(ch) } } else tk.push(w) });
  let i = 0; const pk = () => tk[i], nx = () => tk[i++];
  const isA = w => w !== undefined && (/^[\d.a-z]/.test(w) || w === "(");
  function E() { let a = T(); while (pk() === "+" || pk() === "-") { const o = nx(), b = T(), p = a; a = o === "+" ? v => p(v) + b(v) : v => p(v) - b(v) } return a }
  function T() { let a = U(); for (; ;) { const w = pk(); if (w === "*" || w === "/") { nx(); const b = U(), p = a; a = w === "*" ? v => p(v) * b(v) : v => p(v) / b(v) } else if (isA(w)) { const b = U(), p = a; a = v => p(v) * b(v) } else return a } }
  function U() { if (pk() === "-") { nx(); const a = U(); return v => -a(v) } if (pk() === "+") { nx(); return U() } return P() }
  function P() { const a = A(); if (pk() === "^") { nx(); const b = U(); return v => Math.pow(a(v), b(v)) } return a }
  function A() {
    const w = nx(); if (w === undefined) throw Error("Expression ends too early");
    if (w === "(") { const a = E(); if (nx() !== ")") throw Error("Missing )"); return a }
    if (/^[\d.]/.test(w)) { const n = parseFloat(w); return () => n }
    if (w === "pi") return () => Math.PI; if (w === "tau") return () => TAU; if (w === "phi") return () => (1 + Math.sqrt(5)) / 2;
    if (FN.includes(w)) { if (nx() !== "(") throw Error("Write " + w + "( … )"); const as = [E()]; while (pk() === ",") { nx(); as.push(E()) } if (nx() !== ")") throw Error("Missing )"); const f = FM[w] || Math[w]; return v => f(...as.map(q => q(v))) }
    if (vars.includes(w)) return v => v[w];
    if (w === "e") return () => Math.E;
    throw Error("Unexpected '" + w + "'")
  }
  if (!tk.length) throw Error("A limit is empty");
  const f = E(); if (i < tk.length) throw Error("Unexpected '" + tk[i] + "'");
  return (...a) => { const v = {}; vars.forEach((n, j) => v[n] = a[j]); return f(v) }
}
const num = s => { const v = mk(s, [])(); if (!isFinite(v)) throw Error("'" + s + "' is not a number"); return v };
function getSaved(k) {
  try {
    const list = JSON.parse(localStorage.getItem("cust_reg_" + k) || "[]");
    return list.map((item, idx) => {
      if (!item.n || /[≤≥<>()^]|abs/.test(item.n) || item.n.startsWith("Region")) {
        item.n = "Region " + (idx + 1);
      }
      return item;
    });
  } catch { return [] }
}
function saveCustom(k, it) { const a = getSaved(k); a.push(it); try { localStorage.setItem("cust_reg_" + k, JSON.stringify(a)) } catch { } }
function delCustom(k, i) { const a = getSaved(k); a.splice(i, 1); try { localStorage.setItem("cust_reg_" + k, JSON.stringify(a)) } catch { } }
const getList = () => {
  if (S.mode === "cart") return CR.concat(getSaved("cart"));
  if (S.mode === "polar") return PR.concat(getSaved("polar"));
  if (S.mode === "tri") return (CT[S.sys] || []).concat(getSaved("tri_" + S.sys));
  if (S.mode === "rev") return EX.map(e => ({ n: e[0].split(":")[0], v: [e[1], e[2], e[3], e[4]], ax: e[5] })).concat(getSaved("rev"));
  return [{ n: "Parabola", v: ["0", "2", "x^2", "0"] }, { n: "Sine Wave", v: ["0", "pi", "sin(x)", "0"] }, { n: "Parabola & Line", v: ["0", "1", "x", "x^2"] }, { n: "Square Root", v: ["0", "4", "sqrt(x)", "0"] }, { n: "Reciprocal 1/x", v: ["1", "e", "1/x", "0"] }].concat(getSaved("one"));
};
const pills = (arr, activeIdx = -1) => `<div class="pills">${arr.map((r, i) => `<button type="button" class="pill" data-i="${i}" aria-pressed="${i === activeIdx}">${r.n || (Array.isArray(r) ? r[0] : r)}${r.isCustom ? `<span class="del-pill" data-del="${i}" title="Delete">×</span>` : ""}</button>`).join("")}</div>`;
const opts = a => a.map((r, i) => `<option value="${i}">${r.n}</option>`).join("");
const row = (l, i, a, b) => `<div class="field"><label for="c${i}">${l}</label><div class="two"><input id="c${i}" inputmode="none" value="${a}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${l}: first"><input id="c${i + 1}" inputmode="none" value="${b}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${l}: second"></div></div>`;
const fld = (l, id, a, ph = "") => `<div class="field"><label for="${id}">${l}</label><input id="${id}" inputmode="none" value="${a}" placeholder="${ph}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${l}"></div>`;
const HINT = `<div class="hint">Type like x^2, sqrt(1-x^2), 2x, sin(x), pi. The graph updates as you type.</div>`;
const cfC = () => fld("f(x, y)", "c0", S.fxy !== undefined ? S.fxy : "1", "e.g. 1, x*y, x^2+y^2") + row("x from … to", 1, "0", "4") + row("y from … to (use x)", 3, "x^2/2", "2x") + HINT;
const cfP = () => fld("f(r, θ) [use t for θ]", "c0", S.frt !== undefined ? S.frt : "1", "e.g. 1, r, r*cos(t)") + row("θ from … to (use pi)", 1, "0", "pi") + row("r from … to (use t for θ)", 3, "0", "2sin(t)") + HINT;
const cf3 = () => ({
  cart: row("x from … to", 1, "0", "1") + row("y from … to", 3, "0", "1-x") + row("z from … to", 5, "0", "1-x-y"),
  cyl: row("θ from … to (use pi)", 1, "0", "2pi") + row("r from … to (use t for θ)", 3, "0", "2") + row("z from … to (use r, t)", 5, "r", "2"),
  sph: row("θ from … to (use pi)", 1, "0", "2pi") + row("φ from … to (use pi)", 3, "0", "pi/4") + row("ρ from … to (use t for θ, p for φ)", 5, "0", "2")
}[S.sys]) + HINT;

function size() { const b = c.parentElement, d = window.devicePixelRatio || 1; W = b.clientWidth; H = b.clientHeight; c.width = W * d; c.height = H * d; g.setTransform(d, 0, 0, d, 0, 0) }
function win(x0, x1, y0, y1) { const s = Math.min((W - 50) / (x1 - x0), (H - 50) / (y1 - y0)), ox = W / 2 - s * (x0 + x1) / 2, oy = H / 2 + s * (y0 + y1) / 2; return { X: x => ox + s * x, Y: y => oy - s * y } }
const isDark = () => document.documentElement.getAttribute("data-theme") === "dark" ||
  (!document.documentElement.getAttribute("data-theme") && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
function axes(T, x0, x1, y0, y1) {
  const dark = isDark();
  g.save(); g.strokeStyle = dark ? "#334155" : "#cbd5e1"; g.fillStyle = dark ? "#94a3b8" : "#64748b"; g.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; g.lineWidth = 1;
  const sp = Math.max(x1 - x0, y1 - y0), st = [.25, .5, 1, 2, 5].find(s => sp / s <= 10) || 5;
  g.beginPath(); g.moveTo(T.X(x0), T.Y(0)); g.lineTo(T.X(x1), T.Y(0)); g.moveTo(T.X(0), T.Y(y0)); g.lineTo(T.X(0), T.Y(y1)); g.stroke();
  for (let v = Math.ceil(x0 / st) * st; v <= x1; v += st) { if (Math.abs(v) < 1e-9) continue; g.beginPath(); g.moveTo(T.X(v), T.Y(0) - 3); g.lineTo(T.X(v), T.Y(0) + 3); g.stroke(); g.fillText(+v.toFixed(2), T.X(v) - 6, T.Y(0) + 15) }
  for (let v = Math.ceil(y0 / st) * st; v <= y1; v += st) { if (Math.abs(v) < 1e-9) continue; g.beginPath(); g.moveTo(T.X(0) - 3, T.Y(v)); g.lineTo(T.X(0) + 3, T.Y(v)); g.stroke(); g.fillText(+v.toFixed(2), T.X(0) - 24, T.Y(v) + 4) }
  g.fillText("x", T.X(x1) - 10, T.Y(0) - 6); g.fillText("y", T.X(0) + 6, T.Y(y1) + 10); g.restore()
}
function clear() { g.fillStyle = isDark() ? "#0b0f19" : "#ffffff"; g.fillRect(0, 0, W, H) }
function dot(T, x, y) { }
const ST = i => isDark() ? (i % 2 ? "rgba(59,130,246,.32)" : "rgba(59,130,246,.18)") : (i % 2 ? "rgba(37,99,235,.24)" : "rgba(37,99,235,.12)");

function calc(R, ord, rho) {
  const N = 300, M = 300; let A = 0, m = 0, mx = 0, my = 0;
  const acc = (x, y, w) => { const p = rho(x, y) * w; A += w; m += p; mx += y * p; my += x * p };
  if (ord === "I") { const dx = (R.b - R.a) / N; for (let i = 0; i < N; i++) { const x = R.a + (i + .5) * dx, y0 = R.lo(x), dy = (R.hi(x) - y0) / M; if (!(dy > 0)) continue; for (let j = 0; j < M; j++)acc(x, y0 + (j + .5) * dy, dx * dy) } }
  else { const dy = (R.d - R.c) / N; for (let i = 0; i < N; i++) { const y = R.c + (i + .5) * dy, x0 = R.l(y), dx = (R.r(y) - x0) / M; for (let j = 0; j < M; j++)acc(x0 + (j + .5) * dx, y, dx * dy) } }
  return { A, m, cx: my / m, cy: mx / m }
}
function calcP(P, rho) {
  const N = 600, M = 200, dt = (P.b - P.a) / N; let A = 0, m = 0, mx = 0, my = 0;
  for (let i = 0; i < N; i++) { const t = P.a + (i + .5) * dt, r0 = P.lo(t), dr = (P.hi(t) - r0) / M; if (!(dr > 0)) continue; for (let j = 0; j < M; j++) { const r = r0 + (j + .5) * dr, x = r * cos(t), y = r * sin(t), w = r * dr * dt, p = rho(r, t, x, y) * w; A += w; m += p; mx += y * p; my += x * p } }
  return { A, m, cx: my / m, cy: mx / m }
}
const tail = (k, o) => `<div>Area = <b>${F(k.A)}</b></div>`;

function gridV(T, VX0, VX1, VY0, VY1) {
  const dark = isDark();
  const sp = Math.max(VX1 - VX0, VY1 - VY0), raw = sp / 9, p10 = Math.pow(10, Math.floor(Math.log10(raw))), st = [1, 2, 5, 10].map(m => m * p10).find(v => v >= raw);
  g.save(); g.strokeStyle = dark ? "#172033" : "#f1f5f9"; g.lineWidth = 1;
  for (let v = Math.ceil(VX0 / st) * st; v <= VX1; v += st) { g.beginPath(); g.moveTo(T.X(v), 0); g.lineTo(T.X(v), H); g.stroke() }
  for (let v = Math.ceil(VY0 / st) * st; v <= VY1; v += st) { g.beginPath(); g.moveTo(0, T.Y(v)); g.lineTo(W, T.Y(v)); g.stroke() } g.restore();
  g.save(); g.strokeStyle = dark ? "#334155" : "#cbd5e1"; g.fillStyle = dark ? "#94a3b8" : "#64748b"; g.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, T.Y(0)); g.lineTo(W, T.Y(0)); g.moveTo(T.X(0), 0); g.lineTo(T.X(0), H); g.stroke();
  for (let v = Math.ceil(VX0 / st) * st; v <= VX1; v += st) { if (Math.abs(v) < st / 1e3) continue; g.fillText(+v.toPrecision(6), T.X(v) - 6, Math.min(H - 4, Math.max(12, T.Y(0) + 14))) }
  for (let v = Math.ceil(VY0 / st) * st; v <= VY1; v += st) { if (Math.abs(v) < st / 1e3) continue; g.fillText(+v.toPrecision(6), Math.min(W - 30, Math.max(4, T.X(0) + 5)), T.Y(v) - 3) }
  g.fillText(GL[0], W - 12, Math.max(12, Math.min(H - 4, T.Y(0) - 6))); g.fillText(GL[1], Math.max(4, Math.min(W - 12, T.X(0) + 6)), 12); g.restore()
}
function markPts(T, L) { const dark = isDark(), seen = new Set; g.save(); g.font = "11.5px ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace"; L.forEach(([x, y]) => { if (!isFinite(x) || !isFinite(y)) return; const key = x.toFixed(5) + "|" + y.toFixed(5); if (seen.has(key)) return; seen.add(key); const px = T.X(x), py = T.Y(y); g.fillStyle = "#e11d48"; g.strokeStyle = dark ? "#0b0f19" : "#ffffff"; g.lineWidth = 2; g.beginPath(); g.arc(px, py, 4.5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = dark ? "#f8fafc" : "#0f172a"; g.fillText("(" + (+x.toFixed(3)) + ", " + (+y.toFixed(3)) + ")", px + 8, py - 8) }); g.restore() }
function drawOne() {
  const a = num($("c1").value), b = num($("c2").value), f = mk($("c3").value, ["x"]), h = mk($("c4").value, ["x"]), n = +$("n").value;
  if (!(b > a)) throw Error("x: the first limit must be smaller than the second");
  let y0 = 0, y1 = 0; for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200, u = f(x), l = h(x); if (!isFinite(u) || !isFinite(l)) throw Error("The function is not defined for every x in [a, b]"); y0 = Math.min(y0, u, l); y1 = Math.max(y1, u, l) }
  const x0 = Math.min(0, a), x1 = Math.max(0, b), p = .2 * Math.max(x1 - x0, y1 - y0, 1), key = "o" + [a, b, y0, y1].join();
  if (V.k2 !== key) { V.k2 = key; const q = win(x0 - p, x1 + p, y0 - p, y1 + p); V.s = q.X(1) - q.X(0); V.cx = (x0 + x1) / 2; V.cy = (y0 + y1) / 2 }
  const sv = V.s, T = { X: x => W / 2 + (x - V.cx) * sv, Y: y => H / 2 - (y - V.cy) * sv }, VX0 = V.cx - W / 2 / sv, VX1 = V.cx + W / 2 / sv;
  clear(); gridV(T, VX0, VX1, V.cy - H / 2 / sv, V.cy + H / 2 / sv);
  const d = x => f(x) - h(x), N = 2000, dx = (b - a) / N; let ex = 0, ar = 0;
  for (let i = 0; i <= N; i++) { const w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; ex += w * d(a + i * dx) } ex *= dx / 3;
  for (let i = 0; i < N; i++)ar += Math.abs(d(a + (i + .5) * dx)) * dx;
  g.beginPath(); for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200; g[i ? "lineTo" : "moveTo"](T.X(x), T.Y(f(x))) } for (let i = 200; i >= 0; i--) { const x = a + (b - a) * i / 200; g.lineTo(T.X(x), T.Y(h(x))) } g.closePath(); g.fillStyle = "rgba(15,118,110,.12)"; g.fill();
  const m = S.mt, w2 = (b - a) / n; let rs = 0;
  for (let i = 0; i < n; i++) {
    const xa = a + i * w2, xb = xa + w2, xs = m === "left" ? xa : m === "right" ? xb : (xa + xb) / 2;
    if (m === "trap") { rs += (d(xa) + d(xb)) / 2 * w2; g.beginPath(); g.moveTo(T.X(xa), T.Y(h(xa))); g.lineTo(T.X(xa), T.Y(f(xa))); g.lineTo(T.X(xb), T.Y(f(xb))); g.lineTo(T.X(xb), T.Y(h(xb))); g.closePath() }
    else { const lo = h(xs), hi = f(xs); rs += (hi - lo) * w2; g.beginPath(); g.rect(T.X(xa), T.Y(hi), T.X(xb) - T.X(xa), T.Y(lo) - T.Y(hi)) }
    g.fillStyle = d(xs) >= 0 ? "rgba(15,118,110,.28)" : "rgba(228,87,46,.28)"; g.fill(); g.strokeStyle = "rgba(15,118,110,.8)"; g.lineWidth = 1; g.stroke()
  }
  g.save(); g.strokeStyle = "#6b7f90"; g.lineWidth = 1.5; g.setLineDash([6, 4]);
  [h, f].forEach(fn => { g.beginPath(); let on = 0; for (let i = 0; i <= 400; i++) { const x = VX0 + (VX1 - VX0) * i / 400, y = fn(x); if (!isFinite(y)) { on = 0; continue } g[on ? "lineTo" : "moveTo"](T.X(x), T.Y(y)); on = 1 } g.stroke() }); g.restore();
  g.strokeStyle = "#0f766e"; g.lineWidth = 2.5;[f, h].forEach(fn => { g.beginPath(); for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200; g[i ? "lineTo" : "moveTo"](T.X(x), T.Y(fn(x))) } g.stroke() });
  g.save(); g.strokeStyle = "#e4572e"; g.lineWidth = 1.5; g.setLineDash([4, 4]);[a, b].forEach(x => { g.beginPath(); g.moveTo(T.X(x), T.Y(h(x))); g.lineTo(T.X(x), T.Y(f(x))); g.stroke() }); g.restore();
  markPts(T, [[a, f(a)], [b, f(b)], [a, h(a)], [b, h(b)]]);
  const nm = { left: "Left", mid: "Midpoint", right: "Right", trap: "Trapezoid" }[m];
  $("out").innerHTML = `<div>∫ from ${esc($("c1").value)} to ${esc($("c2").value)} of [ (${esc($("c3").value)}) − (${esc($("c4").value)}) ] dx</div>${finalAnsHtml("Final answer: ∫ f dx", F6(ex))}<div>${nm} sum with ${n} pieces = <b>${F(rs)}</b></div><div class="dim">Error = ${F(Math.abs(rs - ex))}. Teal pieces count as positive, orange as negative.</div>${Math.abs(ar - Math.abs(ex)) > 1e-6 ? `<div>Total area (ignoring sign) = <b>${F(ar)}</b></div>` : ""}`;
}
function getCart() {
  const a = num($("c1").value), b = num($("c2").value), lo = mk($("c3").value, ["x"]), hi = mk($("c4").value, ["x"]);
  if (!(b > a)) throw Error("x: the first limit must be smaller than the second");
  return { a, b, lo: x => lo(x), hi: x => hi(x), custom: 1, I: `${esc($("c1").value)} ≤ x ≤ ${esc($("c2").value)},  ${esc($("c3").value)} ≤ y ≤ ${esc($("c4").value)}` }
}
function runs(R, y) { const o = [], N = 400; let s = null; for (let i = 0; i <= N; i++) { const x = R.a + (R.b - R.a) * i / N, ok = R.lo(x) <= y && y <= R.hi(x); if (ok && s === null) s = x; if (!ok && s !== null) { o.push([s, R.a + (R.b - R.a) * (i - 1) / N]); s = null } } if (s !== null) o.push([s, R.b]); return o }
function getPolar() {
  const a = num($("c1").value), b = num($("c2").value), lo = mk($("c3").value, ["t"]), hi = mk($("c4").value, ["t"]);
  if (!(b > a)) throw Error("θ: the first limit must be smaller than the second");
  return { a, b, lo: t => lo(t), hi: t => hi(t), custom: 1, T: `${esc($("c1").value)} ≤ θ ≤ ${esc($("c2").value)},  ${esc($("c3").value)} ≤ r ≤ ${esc($("c4").value)}` }
}
function getSolid() {
  const v = k => $("c" + k).value, box = [1e9, -1e9, 1e9, -1e9, 1e9, -1e9]; let f, d;
  const add = (x, y, z) => { if (![x, y, z].every(isFinite)) return; box[0] = Math.min(box[0], x); box[1] = Math.max(box[1], x); box[2] = Math.min(box[2], y); box[3] = Math.max(box[3], y); box[4] = Math.min(box[4], z); box[5] = Math.max(box[5], z) };
  if (S.sys === "cart") {
    const x1 = mk(v(1), ["x", "y", "z"]), x2 = mk(v(2), ["x", "y", "z"]),
      y1 = mk(v(3), ["x", "y", "z"]), y2 = mk(v(4), ["x", "y", "z"]),
      z1 = mk(v(5), ["x", "y", "z"]), z2 = mk(v(6), ["x", "y", "z"]);
    const getDeps = s => {
      const st = String(s).toLowerCase(), set = new Set();
      if (/\bx\b/.test(st)) set.add("x");
      if (/\by\b/.test(st)) set.add("y");
      if (/\bz\b/.test(st)) set.add("z");
      return set;
    };
    const deps = {
      x: new Set([...getDeps(v(1)), ...getDeps(v(2))]),
      y: new Set([...getDeps(v(3)), ...getDeps(v(4))]),
      z: new Set([...getDeps(v(5)), ...getDeps(v(6))])
    };
    deps.x.delete("x"); deps.y.delete("y"); deps.z.delete("z");
    const rem = ["x", "y", "z"], ord = [];
    while (rem.length > 0) {
      const idx = rem.findIndex(name => [...deps[name]].every(d => ord.includes(d)));
      if (idx !== -1) ord.push(rem.splice(idx, 1)[0]);
      else ord.push(rem.shift());
    }
    const bounds = {
      x: (x, y, z) => [x1(x, y, z), x2(x, y, z)],
      y: (x, y, z) => [y1(x, y, z), y2(x, y, z)],
      z: (x, y, z) => [z1(x, y, z), z2(x, y, z)]
    };
    const [vA, vB, vC] = ord;
    const cur = { x: 0, y: 0, z: 0 };
    const [aMin, aMax] = bounds[vA](0, 0, 0);
    const nA = 24, nB = 16;
    for (let i = 0; i <= nA; i++) {
      cur[vA] = aMin + (aMax - aMin) * i / nA;
      const [bMin, bMax] = bounds[vB](cur.x, cur.y, cur.z);
      if (!isFinite(bMin) || !isFinite(bMax)) continue;
      for (let j = 0; j <= nB; j++) {
        cur[vB] = bMin + (bMax - bMin) * j / nB;
        const [cMin, cMax] = bounds[vC](cur.x, cur.y, cur.z);
        if (!isFinite(cMin) || !isFinite(cMax)) continue;
        cur[vC] = cMin; add(cur.x, cur.y, cur.z);
        cur[vC] = cMax; add(cur.x, cur.y, cur.z);
      }
    }
    f = (x, y, z) => {
      const lx = x1(x, y, z), ux = x2(x, y, z);
      const ly = y1(x, y, z), uy = y2(x, y, z);
      const lz = z1(x, y, z), uz = z2(x, y, z);
      return x >= Math.min(lx, ux) - 1e-9 && x <= Math.max(lx, ux) + 1e-9 &&
        y >= Math.min(ly, uy) - 1e-9 && y <= Math.max(ly, uy) + 1e-9 &&
        z >= Math.min(lz, uz) - 1e-9 && z <= Math.max(lz, uz) + 1e-9;
    };
    d = `${esc(v(1))} ≤ x ≤ ${esc(v(2))},  ${esc(v(3))} ≤ y ≤ ${esc(v(4))},  ${esc(v(5))} ≤ z ≤ ${esc(v(6))}`;
  }
  else if (S.sys === "cyl") {
    const a = num(v(1)), b = num(v(2));
    if (!(b > a)) throw Error("The first limit must be smaller than the second");
    const nt = t => ((t - a) % TAU + TAU) % TAU + a;
    const r1 = mk(v(3), ["t", "r", "z"]), r2 = mk(v(4), ["t", "r", "z"]), z1 = mk(v(5), ["r", "t", "z"]), z2 = mk(v(6), ["r", "t", "z"]);
    for (let i = 0; i <= 48; i++) { const t = a + (b - a) * i / 48, l = r1(t, 0, 0), u = r2(t, 0, 0); for (let j = 0; j <= 8; j++) { const r = l + (u - l) * j / 8, x = r * cos(t), y = r * sin(t); add(x, y, z1(r, t, 0)); add(x, y, z2(r, t, 0)) } }
    f = (x, y, z) => { const r = Math.hypot(x, y), t = nt(Math.atan2(y, x)); return t <= b && r >= r1(t, r, z) && r <= r2(t, r, z) && z >= z1(r, t, z) && z <= z2(r, t, z) };
    d = `${esc(v(1))} ≤ θ ≤ ${esc(v(2))},  ${esc(v(3))} ≤ r ≤ ${esc(v(4))},  ${esc(v(5))} ≤ z ≤ ${esc(v(6))}`;
  }
  else {
    const a = num(v(1)), b = num(v(2));
    if (!(b > a)) throw Error("The first limit must be smaller than the second");
    const nt = t => ((t - a) % TAU + TAU) % TAU + a;
    const p1 = num(v(3)), p2 = num(v(4)), q1 = mk(v(5), ["t", "p", "phi", "r"]), q2 = mk(v(6), ["t", "p", "phi", "r"]);
    for (let i = 0; i <= 36; i++)for (let j = 0; j <= 18; j++) { const t = a + (b - a) * i / 36, p = p1 + (p2 - p1) * j / 18;[q1(t, p, p, 0), q2(t, p, p, 0)].forEach(q => add(q * sin(p) * cos(t), q * sin(p) * sin(t), q * cos(p))) }
    f = (x, y, z) => { const q = Math.sqrt(x * x + y * y + z * z); if (q < 1e-9) return false; const p = Math.acos(z / q), t = nt(Math.atan2(y, x)); return p >= p1 && p <= p2 && t <= b && q >= q1(t, p, p, q) && q <= q2(t, p, p, q) };
    d = `${esc(v(1))} ≤ θ ≤ ${esc(v(2))},  ${esc(v(3))} ≤ φ ≤ ${esc(v(4))},  ${esc(v(5))} ≤ ρ ≤ ${esc(v(6))}`;
  }
  if (box[0] > box[1]) throw Error("Could not build the solid from these limits");
  for (let k = 0; k < 6; k += 2) { const pd = Math.max(.02 * (box[k + 1] - box[k]), .02); box[k] -= pd; box[k + 1] += pd }
  return { n: "Custom", box, f, custom: 1, b: d }
}
function drawGroundGrid3D(pr, box, dark) {
  g.save();
  g.strokeStyle = dark ? "rgba(30, 41, 59, 0.7)" : "rgba(226, 232, 240, 0.8)";
  g.lineWidth = 1;
  const x0 = box[0], x1 = box[1], y0 = box[2], y1 = box[3];
  const span = Math.max(x1 - x0, y1 - y0);
  const raw = span / 8, p10 = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const st = [1, 2, 5, 10].map(m => m * p10).find(v => v >= raw) || 1;

  g.beginPath();
  for (let x = Math.ceil(x0 / st) * st; x <= x1 + 1e-9; x += st) {
    const pA = pr(x, y0, 0), pB = pr(x, y1, 0);
    g.moveTo(pA[0], pA[1]); g.lineTo(pB[0], pB[1]);
  }
  for (let y = Math.ceil(y0 / st) * st; y <= y1 + 1e-9; y += st) {
    const pA = pr(x0, y, 0), pB = pr(x1, y, 0);
    g.moveTo(pA[0], pA[1]); g.lineTo(pB[0], pB[1]);
  }
  g.stroke();
  g.restore();
}

function drawAxes3D(pr, box, dark) {
  g.save();
  const x1 = pr(box[1], 0, 0), y1 = pr(0, box[3], 0), z1 = pr(0, 0, box[5]);
  const x0 = pr(box[0], 0, 0), y0 = pr(0, box[2], 0), z0 = pr(0, 0, box[4]);

  const axes = [
    { label: "x", p0: x0, p1: x1, color: "#3b82f6" },
    { label: "y", p0: y0, p1: y1, color: "#10b981" },
    { label: "z", p0: z0, p1: z1, color: "#f43f5e" }
  ];

  axes.forEach(ax => {
    g.strokeStyle = ax.color;
    g.lineWidth = 2.0;
    g.beginPath();
    g.moveTo(ax.p0[0], ax.p0[1]);
    g.lineTo(ax.p1[0], ax.p1[1]);
    g.stroke();

    g.fillStyle = ax.color;
    g.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    g.fillText(ax.label, ax.p1[0] + 6, ax.p1[1] - 4);
  });

  g.font = "10px ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace";
  g.fillStyle = dark ? "#94a3b8" : "#64748b";
  g.strokeStyle = dark ? "#475569" : "#94a3b8";
  g.lineWidth = 1;

  ["x", "y", "z"].forEach(axis => {
    const idx = axis === "x" ? 0 : axis === "y" ? 2 : 4;
    const minV = box[idx], maxV = box[idx + 1];
    const span = maxV - minV;
    const raw = span / 5, p10 = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const st = [1, 2, 5, 10].map(m => m * p10).find(v => v >= raw) || 1;

    for (let v = Math.ceil(minV / st) * st; v <= maxV + 1e-9; v += st) {
      if (Math.abs(v) < st * 0.1) continue;
      const pt = axis === "x" ? pr(v, 0, 0) : axis === "y" ? pr(0, v, 0) : pr(0, 0, v);
      g.beginPath();
      g.arc(pt[0], pt[1], 2, 0, TAU);
      g.stroke();
      g.fillText(+v.toPrecision(3), pt[0] + 4, pt[1] + 11);
    }
  });

  g.restore();
}

function drawBaseRegionCart(pr, R, dark) {
  const a = R.a, b = R.b;
  const N = 80;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = a + (b - a) * i / N;
    pts.push(pr(x, R.hi(x), 0));
  }
  for (let i = N; i >= 0; i--) {
    const x = a + (b - a) * i / N;
    pts.push(pr(x, R.lo(x), 0));
  }
  g.save();
  g.beginPath();
  pts.forEach((p, i) => g[i ? "lineTo" : "moveTo"](p[0], p[1]));
  g.closePath();
  g.fillStyle = dark ? "rgba(59, 130, 246, 0.22)" : "rgba(37, 99, 235, 0.14)";
  g.fill();
  g.strokeStyle = dark ? "#60a5fa" : "#2563eb";
  g.lineWidth = 2.0;
  g.stroke();
  g.restore();
}

function drawSurfaceAndWallsCart(pr, R, rho, box, dark) {
  const a = R.a, b = R.b;
  const Nx = 36, Ny = 26;
  const quads = [];
  const zmin = box[4], zmax = box[5], zRange = zmax - zmin || 1;

  const V = [];
  for (let i = 0; i <= Nx; i++) {
    V[i] = [];
    const u = i / Nx;
    const x = a + (b - a) * u;
    const l = R.lo(x), h = R.hi(x);
    for (let j = 0; j <= Ny; j++) {
      const v = j / Ny;
      const y = l + (h - l) * v;
      let z = rho(x, y);
      if (!isFinite(z)) z = 0;
      V[i][j] = [x, y, z];
    }
  }

  const getColor = (z, diff = 1) => {
    const t = Math.max(0, Math.min(1, (z - zmin) / zRange));
    const hue = (215 - 190 * t + 360) % 360;
    const sat = 78;
    const lum = Math.round(dark ? 42 + 28 * diff : 48 + 22 * diff);
    const alpha = dark ? 0.88 : 0.82;
    return `hsla(${hue}, ${sat}%, ${lum}%, ${alpha})`;
  };

  for (let i = 0; i < Nx; i++) {
    for (let j = 0; j < Ny; j++) {
      const p00 = V[i][j], p10 = V[i + 1][j], p11 = V[i + 1][j + 1], p01 = V[i][j + 1];
      const ux = p10[0] - p00[0], uy = p10[1] - p00[1], uz = p10[2] - p00[2];
      const vx = p01[0] - p00[0], vy = p01[1] - p00[1], vz = p01[2] - p00[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const nLen = Math.hypot(nx, ny, nz) || 1;
      nx /= nLen; ny /= nLen; nz /= nLen;
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const diff = Math.max(0.2, Math.min(1.0, 0.45 + 0.55 * (0.35 * nx - 0.55 * ny + 0.75 * nz)));

      const q00 = pr(...p00), q10 = pr(...p10), q11 = pr(...p11), q01 = pr(...p01);
      const avgZ = (q00[2] + q10[2] + q11[2] + q01[2]) / 4;
      const avgHeight = (p00[2] + p10[2] + p11[2] + p01[2]) / 4;

      quads.push({
        type: 'surf',
        pts: [q00, q10, q11, q01],
        depth: avgZ,
        fill: getColor(avgHeight, diff),
        stroke: dark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.14)",
        isGrid: (i % 3 === 0 || j % 3 === 0)
      });
    }
  }

  for (let i = 0; i < Nx; i++) {
    const pA = V[i][Ny], pB = V[i + 1][Ny];
    const qA0 = pr(pA[0], pA[1], 0), qB0 = pr(pB[0], pB[1], 0);
    const qB1 = pr(...pB), qA1 = pr(...pA);
    const avgZ = (qA0[2] + qB0[2] + qB1[2] + qA1[2]) / 4;
    quads.push({
      type: 'wall',
      pts: [qA0, qB0, qB1, qA1],
      depth: avgZ,
      fill: dark ? "rgba(59, 130, 246, 0.28)" : "rgba(37, 99, 235, 0.22)",
      stroke: dark ? "rgba(96, 165, 250, 0.5)" : "rgba(37, 99, 235, 0.45)"
    });
  }

  for (let i = 0; i < Nx; i++) {
    const pA = V[i][0], pB = V[i + 1][0];
    const qA0 = pr(pA[0], pA[1], 0), qB0 = pr(pB[0], pB[1], 0);
    const qB1 = pr(...pB), qA1 = pr(...pA);
    const avgZ = (qA0[2] + qB0[2] + qB1[2] + qA1[2]) / 4;
    quads.push({
      type: 'wall',
      pts: [qA0, qB0, qB1, qA1],
      depth: avgZ,
      fill: dark ? "rgba(14, 165, 233, 0.28)" : "rgba(2, 132, 199, 0.22)",
      stroke: dark ? "rgba(56, 189, 248, 0.5)" : "rgba(2, 132, 199, 0.45)"
    });
  }

  for (let j = 0; j < Ny; j++) {
    const pA = V[0][j], pB = V[0][j + 1];
    if (Math.hypot(pA[0] - pB[0], pA[1] - pB[1]) < 1e-5) continue;
    const qA0 = pr(pA[0], pA[1], 0), qB0 = pr(pB[0], pB[1], 0);
    const qB1 = pr(...pB), qA1 = pr(...pA);
    const avgZ = (qA0[2] + qB0[2] + qB1[2] + qA1[2]) / 4;
    quads.push({
      type: 'wall',
      pts: [qA0, qB0, qB1, qA1],
      depth: avgZ,
      fill: dark ? "rgba(99, 102, 241, 0.28)" : "rgba(79, 70, 229, 0.22)",
      stroke: dark ? "rgba(129, 140, 248, 0.5)" : "rgba(79, 70, 229, 0.45)"
    });
  }

  for (let j = 0; j < Ny; j++) {
    const pA = V[Nx][j], pB = V[Nx][j + 1];
    if (Math.hypot(pA[0] - pB[0], pA[1] - pB[1]) < 1e-5) continue;
    const qA0 = pr(pA[0], pA[1], 0), qB0 = pr(pB[0], pB[1], 0);
    const qB1 = pr(...pB), qA1 = pr(...pA);
    const avgZ = (qA0[2] + qB0[2] + qB1[2] + qA1[2]) / 4;
    quads.push({
      type: 'wall',
      pts: [qA0, qB0, qB1, qA1],
      depth: avgZ,
      fill: dark ? "rgba(168, 85, 247, 0.28)" : "rgba(147, 51, 234, 0.22)",
      stroke: dark ? "rgba(192, 132, 252, 0.5)" : "rgba(147, 51, 234, 0.45)"
    });
  }

  quads.sort((A, B) => B.depth - A.depth);

  g.save();
  for (const q of quads) {
    g.beginPath();
    g.moveTo(q.pts[0][0], q.pts[0][1]);
    g.lineTo(q.pts[1][0], q.pts[1][1]);
    g.lineTo(q.pts[2][0], q.pts[2][1]);
    g.lineTo(q.pts[3][0], q.pts[3][1]);
    g.closePath();
    g.fillStyle = q.fill;
    g.fill();
    if (q.stroke && (q.type === 'wall' || q.isGrid)) {
      g.strokeStyle = q.stroke;
      g.lineWidth = q.type === 'wall' ? 1.0 : 0.6;
      g.stroke();
    }
  }
  g.restore();
}

function drawCart3D(R, rho, n) {
  clear();
  const a = R.a, b = R.b;
  let ymin = 0, ymax = 0;
  for (let i = 0; i <= 80; i++) {
    const x = a + (b - a) * i / 80;
    const l = R.lo(x), h = R.hi(x);
    if (!isFinite(l) || !isFinite(h)) throw Error("The y-limits are not defined for every x in [a, b]");
    ymin = Math.min(ymin, l, h);
    ymax = Math.max(ymax, l, h);
  }

  let zmin = 0, zmax = 0;
  for (let i = 0; i <= 24; i++) {
    const x = a + (b - a) * i / 24;
    const l = R.lo(x), h = R.hi(x);
    for (let j = 0; j <= 24; j++) {
      const y = l + (h - l) * j / 24;
      const z = rho(x, y);
      if (isFinite(z)) {
        zmin = Math.min(zmin, z);
        zmax = Math.max(zmax, z);
      }
    }
  }
  if (Math.abs(zmax - zmin) < 1e-4) zmax = zmin + 1;
  const xmin = Math.min(0, a), xmax = Math.max(0, b);
  const box = [xmin, xmax, Math.min(0, ymin), Math.max(0, ymax), zmin, zmax];
  const dx = box[1] - box[0] || 1, dy = box[3] - box[2] || 1, dz = box[5] - box[4] || 1;
  const pBox = [
    box[0] - 0.08 * dx, box[1] + 0.08 * dx,
    box[2] - 0.08 * dy, box[3] + 0.08 * dy,
    box[4] - 0.08 * dz, box[5] + 0.08 * dz
  ];

  const cx = (pBox[0] + pBox[1]) / 2, cy = (pBox[2] + pBox[3]) / 2, cz = (pBox[4] + pBox[5]) / 2;
  const diag = Math.hypot(pBox[1] - pBox[0], pBox[3] - pBox[2], pBox[5] - pBox[4]) || 1;
  const k = 0.82 * Math.min(W, H) / diag * zoom3D;

  const pr = (x, y, z) => {
    const rx = x - cx, ry = y - cy, rz = z - cz;
    const x1 = rx * cos(yaw) - ry * sin(yaw);
    const y1 = rx * sin(yaw) + ry * cos(yaw);
    return [
      W / 2 + x1 * k,
      H / 2 - (rz * cos(pit) + y1 * sin(pit)) * k,
      y1 * cos(pit) - rz * sin(pit)
    ];
  };

  const dark = isDark();
  drawGroundGrid3D(pr, pBox, dark);
  drawAxes3D(pr, pBox, dark);
  drawBaseRegionCart(pr, R, dark);
  drawSurfaceAndWallsCart(pr, R, rho, box, dark);

  const kResult = calc(R, R.custom ? "I" : S.ord, rho);
  const fxyStr = ($("c0") && $("c0").value.trim()) || "1";
  const fDisp = fxyStr === "1" ? "" : `(${esc(fxyStr)}) `;
  const on = o => S.ord === o ? "<b>" : "", off = o => S.ord === o ? "</b>" : "";
  $("out").innerHTML = `<div>${on("I")}∬ ${fDisp}dy dx:${off("I")}  ${R.I}</div><div>Volume under surface <b>z = ${esc(fxyStr)}</b> above region R</div>${finalAnsHtml("Final answer: ∬ f dA (Volume)", F6(kResult.m))}<div>Base region area (z = 0) = <b>${F(kResult.A)}</b></div><div class="dim">${hint3D()}</div>`;
}

function drawCart() {
  const fxyStr = ($("c0") && $("c0").value.trim()) || "1";
  let rho;
  try {
    const fn = mk(fxyStr, ["x", "y"]);
    rho = (x, y) => fn(x, y);
  } catch (err) {
    throw Error("f(x, y): " + err.message);
  }
  const R = getCart(), n = +$("n").value;
  if (S.dv !== "2") {
    drawCart3D(R, rho, n);
    return;
  }
  let y0 = 0, y1 = 0; for (let i = 0; i <= 100; i++) { const x = R.a + (R.b - R.a) * i / 100; const l = R.lo(x), h = R.hi(x); if (!isFinite(l) || !isFinite(h)) throw Error("The y-limits are not defined for every x in [a, b]"); y0 = Math.min(y0, l); y1 = Math.max(y1, h) } const k = calc(R, R.custom ? "I" : S.ord, rho); if (!(k.A > 0)) throw Error("Empty region: the lower limit must be below the upper limit somewhere.");
  const x0 = Math.min(0, R.a), x1 = Math.max(R.b, 0), p = .15 * Math.max(x1 - x0, y1 - y0), FX0 = x0 - p, FX1 = x1 + p, FY0 = y0 - p, FY1 = y1 + p, key = "c" + [R.a, R.b, y0, y1, S.mode].join();
  if (V.k2 !== key) { V.k2 = key; const q = win(FX0, FX1, FY0, FY1); V.s = q.X(1) - q.X(0); V.cx = (FX0 + FX1) / 2; V.cy = (FY0 + FY1) / 2 }
  const sv = V.s, T = { X: x => W / 2 + (x - V.cx) * sv, Y: y => H / 2 - (y - V.cy) * sv }, X0 = V.cx - W / 2 / sv, X1 = V.cx + W / 2 / sv, Y0 = V.cy - H / 2 / sv, Y1 = V.cy + H / 2 / sv;
  clear(); gridV(T, X0, X1, Y0, Y1);
  const full = (f, col) => { g.save(); g.strokeStyle = col; g.lineWidth = 1.5; g.setLineDash([6, 4]); g.beginPath(); let on = 0; for (let i = 0; i <= 300; i++) { const x = X0 + (X1 - X0) * i / 300, y = f(x); if (!isFinite(y)) { on = 0; continue } g[on ? "lineTo" : "moveTo"](T.X(x), T.Y(y)); on = 1 } g.stroke(); g.restore() }; full(R.hi, "#6b7f90"); full(R.lo, "#6b7f90");
  g.beginPath(); for (let i = 0; i <= 100; i++) { const x = R.a + (R.b - R.a) * i / 100; g[i ? "lineTo" : "moveTo"](T.X(x), T.Y(R.hi(x))) }
  for (let i = 100; i >= 0; i--) { const x = R.a + (R.b - R.a) * i / 100; g.lineTo(T.X(x), T.Y(R.lo(x))) }
  g.closePath(); g.fillStyle = isDark() ? "rgba(59,130,246,.2)" : "rgba(37,99,235,.12)"; g.fill(); g.strokeStyle = isDark() ? "#60a5fa" : "#2563eb"; g.lineWidth = 2.5; g.stroke();
  g.strokeStyle = isDark() ? "rgba(96,165,250,.7)" : "rgba(37,99,235,.65)"; g.lineWidth = 1;
  if (S.ord === "I") for (let i = 0; i < n; i++) { const a = R.a + (R.b - R.a) * i / n, b = R.a + (R.b - R.a) * (i + 1) / n, m = (a + b) / 2, lo = R.lo(m), hi = R.hi(m); g.fillStyle = ST(i); g.fillRect(T.X(a), T.Y(hi), T.X(b) - T.X(a), T.Y(lo) - T.Y(hi)); g.strokeRect(T.X(a), T.Y(hi), T.X(b) - T.X(a), T.Y(lo) - T.Y(hi)) }
  else { const c0 = R.custom ? y0 : R.c, d0 = R.custom ? y1 : R.d; for (let i = 0; i < n; i++) { const a = c0 + (d0 - c0) * i / n, b = c0 + (d0 - c0) * (i + 1) / n, m = (a + b) / 2; (R.custom ? runs(R, m) : [[R.l(m), R.r(m)]]).forEach(([l, r]) => { g.fillStyle = ST(i); g.fillRect(T.X(l), T.Y(b), T.X(r) - T.X(l), T.Y(a) - T.Y(b)); g.strokeRect(T.X(l), T.Y(b), T.X(r) - T.X(l), T.Y(a) - T.Y(b)) }) } }
  {
    const L = [[R.a, R.lo(R.a)], [R.a, R.hi(R.a)], [R.b, R.lo(R.b)], [R.b, R.hi(R.b)]]; let pv = R.hi(R.a) - R.lo(R.a);
    for (let i = 1; i <= 600; i++) { const x = R.a + (R.b - R.a) * i / 600, dv = R.hi(x) - R.lo(x); if (isFinite(pv) && isFinite(dv) && pv * dv < 0) { let l = R.a + (R.b - R.a) * (i - 1) / 600, h = x; for (let q = 0; q < 40; q++) { const m = (l + h) / 2; if ((R.hi(m) - R.lo(m)) * pv > 0) l = m; else h = m } const xm = (l + h) / 2; L.push([xm, R.hi(xm)]) } pv = dv }
    markPts(T, L)
  }
  const on = o => S.ord === o ? "<b>" : "", off = o => S.ord === o ? "</b>" : "";
  const fDisp = fxyStr === "1" ? "" : `(${esc(fxyStr)}) `;
  $("out").innerHTML = `<div>${on("I")}∬ ${fDisp}dy dx:${off("I")}  ${R.I}</div><div>${on("II")}∬ ${fDisp}dx dy:${off("II")}  ${R.II || "strips found numerically"}</div>${finalAnsHtml("Final answer: ∬ f dA", F6(k.m))}<div>Area = <b>${F(k.A)}</b></div><div class="dim">${hint2D()}</div>`;
}

function drawPolarGroundGrid(pr, maxR, dark) {
  g.save();
  g.strokeStyle = dark ? "rgba(30, 41, 59, 0.7)" : "rgba(226, 232, 240, 0.8)";
  g.lineWidth = 1;

  const stepR = maxR <= 3 ? 0.5 : maxR <= 6 ? 1 : 2;
  for (let r = stepR; r <= maxR * 1.05; r += stepR) {
    g.beginPath();
    for (let i = 0; i <= 48; i++) {
      const t = i * TAU / 48, p = pr(r * cos(t), r * sin(t), 0);
      g[i ? "lineTo" : "moveTo"](p[0], p[1]);
    }
    g.stroke();
  }

  for (let i = 0; i < 12; i++) {
    const t = i * TAU / 12;
    const pA = pr(0, 0, 0), pB = pr(maxR * 1.05 * cos(t), maxR * 1.05 * sin(t), 0);
    g.beginPath(); g.moveTo(pA[0], pA[1]); g.lineTo(pB[0], pB[1]); g.stroke();
  }
  g.restore();
}

function drawBaseRegionPolar(pr, P, dark) {
  const a = P.a, b = P.b;
  const N = 80;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = a + (b - a) * i / N, r = P.hi(t);
    pts.push(pr(r * cos(t), r * sin(t), 0));
  }
  for (let i = N; i >= 0; i--) {
    const t = a + (b - a) * i / N, r = P.lo(t);
    pts.push(pr(r * cos(t), r * sin(t), 0));
  }
  g.save();
  g.beginPath();
  pts.forEach((p, i) => g[i ? "lineTo" : "moveTo"](p[0], p[1]));
  g.closePath();
  g.fillStyle = dark ? "rgba(59, 130, 246, 0.2)" : "rgba(37, 99, 235, 0.14)";
  g.fill();
  g.strokeStyle = dark ? "#60a5fa" : "#2563eb";
  g.lineWidth = 2.0;
  g.stroke();
  g.restore();
}

function drawSurfaceAndWallsPolar(pr, P, rho, box, dark) {
  const a = P.a, b = P.b;
  const Nt = 40, Nr = 22;
  const quads = [];
  const zmin = box[4], zmax = box[5], zRange = zmax - zmin || 1;

  const V = [];
  for (let i = 0; i <= Nt; i++) {
    V[i] = [];
    const t = a + (b - a) * i / Nt;
    const rlo = P.lo(t), rhi = P.hi(t);
    for (let j = 0; j <= Nr; j++) {
      const r = rlo + (rhi - rlo) * j / Nr;
      const x = r * cos(t), y = r * sin(t);
      let z = rho(r, t, x, y);
      if (!isFinite(z)) z = 0;
      V[i][j] = [x, y, z, r, t];
    }
  }

  const getColor = (z, diff = 1) => {
    const t = Math.max(0, Math.min(1, (z - zmin) / zRange));
    const hue = (215 - 190 * t + 360) % 360;
    const sat = 78;
    const lum = Math.round(dark ? 42 + 28 * diff : 48 + 22 * diff);
    const alpha = dark ? 0.88 : 0.82;
    return `hsla(${hue}, ${sat}%, ${lum}%, ${alpha})`;
  };

  for (let i = 0; i < Nt; i++) {
    for (let j = 0; j < Nr; j++) {
      const p00 = V[i][j], p10 = V[i + 1][j], p11 = V[i + 1][j + 1], p01 = V[i][j + 1];
      const ux = p10[0] - p00[0], uy = p10[1] - p00[1], uz = p10[2] - p00[2];
      const vx = p01[0] - p00[0], vy = p01[1] - p00[1], vz = p01[2] - p00[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const nLen = Math.hypot(nx, ny, nz) || 1;
      nx /= nLen; ny /= nLen; nz /= nLen;
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const diff = Math.max(0.2, Math.min(1.0, 0.45 + 0.55 * (0.35 * nx - 0.55 * ny + 0.75 * nz)));

      const q00 = pr(p00[0], p00[1], p00[2]);
      const q10 = pr(p10[0], p10[1], p10[2]);
      const q11 = pr(p11[0], p11[1], p11[2]);
      const q01 = pr(p01[0], p01[1], p01[2]);
      const avgZ = (q00[2] + q10[2] + q11[2] + q01[2]) / 4;
      const avgHeight = (p00[2] + p10[2] + p11[2] + p01[2]) / 4;

      quads.push({
        type: 'surf',
        pts: [q00, q10, q11, q01],
        depth: avgZ,
        fill: getColor(avgHeight, diff),
        stroke: dark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.14)",
        isGrid: (i % 3 === 0 || j % 3 === 0)
      });
    }
  }

  for (let i = 0; i < Nt; i++) {
    const pA = V[i][Nr], pB = V[i + 1][Nr];
    const qA0 = pr(pA[0], pA[1], 0), qB0 = pr(pB[0], pB[1], 0);
    const qB1 = pr(pB[0], pB[1], pB[2]), qA1 = pr(pA[0], pA[1], pA[2]);
    const avgZ = (qA0[2] + qB0[2] + qB1[2] + qA1[2]) / 4;
    quads.push({
      type: 'wall',
      pts: [qA0, qB0, qB1, qA1],
      depth: avgZ,
      fill: dark ? "rgba(59, 130, 246, 0.28)" : "rgba(37, 99, 235, 0.22)",
      stroke: dark ? "rgba(96, 165, 250, 0.5)" : "rgba(37, 99, 235, 0.45)"
    });
  }

  for (let i = 0; i < Nt; i++) {
    const pA = V[i][0], pB = V[i + 1][0];
    if (Math.hypot(pA[0], pA[1]) < 1e-4 && Math.hypot(pB[0], pB[1]) < 1e-4) continue;
    const qA0 = pr(pA[0], pA[1], 0), qB0 = pr(pB[0], pB[1], 0);
    const qB1 = pr(pB[0], pB[1], pB[2]), qA1 = pr(pA[0], pA[1], pA[2]);
    const avgZ = (qA0[2] + qB0[2] + qB1[2] + qA1[2]) / 4;
    quads.push({
      type: 'wall',
      pts: [qA0, qB0, qB1, qA1],
      depth: avgZ,
      fill: dark ? "rgba(14, 165, 233, 0.28)" : "rgba(2, 132, 199, 0.22)",
      stroke: dark ? "rgba(56, 189, 248, 0.5)" : "rgba(2, 132, 199, 0.45)"
    });
  }

  for (let j = 0; j < Nr; j++) {
    const pA = V[0][j], pB = V[0][j + 1];
    if (Math.hypot(pA[0] - pB[0], pA[1] - pB[1]) < 1e-5) continue;
    const qA0 = pr(pA[0], pA[1], 0), qB0 = pr(pB[0], pB[1], 0);
    const qB1 = pr(pB[0], pB[1], pB[2]), qA1 = pr(pA[0], pA[1], pA[2]);
    const avgZ = (qA0[2] + qB0[2] + qB1[2] + qA1[2]) / 4;
    quads.push({
      type: 'wall',
      pts: [qA0, qB0, qB1, qA1],
      depth: avgZ,
      fill: dark ? "rgba(99, 102, 241, 0.28)" : "rgba(79, 70, 229, 0.22)",
      stroke: dark ? "rgba(129, 140, 248, 0.5)" : "rgba(79, 70, 229, 0.45)"
    });
  }

  for (let j = 0; j < Nr; j++) {
    const pA = V[Nt][j], pB = V[Nt][j + 1];
    if (Math.hypot(pA[0] - pB[0], pA[1] - pB[1]) < 1e-5) continue;
    const qA0 = pr(pA[0], pA[1], 0), qB0 = pr(pB[0], pB[1], 0);
    const qB1 = pr(pB[0], pB[1], pB[2]), qA1 = pr(pA[0], pA[1], pA[2]);
    const avgZ = (qA0[2] + qB0[2] + qB1[2] + qA1[2]) / 4;
    quads.push({
      type: 'wall',
      pts: [qA0, qB0, qB1, qA1],
      depth: avgZ,
      fill: dark ? "rgba(168, 85, 247, 0.28)" : "rgba(147, 51, 234, 0.22)",
      stroke: dark ? "rgba(192, 132, 252, 0.5)" : "rgba(147, 51, 234, 0.45)"
    });
  }

  quads.sort((A, B) => B.depth - A.depth);
  g.save();
  for (const q of quads) {
    g.beginPath();
    g.moveTo(q.pts[0][0], q.pts[0][1]);
    g.lineTo(q.pts[1][0], q.pts[1][1]);
    g.lineTo(q.pts[2][0], q.pts[2][1]);
    g.lineTo(q.pts[3][0], q.pts[3][1]);
    g.closePath();
    g.fillStyle = q.fill;
    g.fill();
    if (q.stroke && (q.type === 'wall' || q.isGrid)) {
      g.strokeStyle = q.stroke;
      g.lineWidth = q.type === 'wall' ? 1.0 : 0.6;
      g.stroke();
    }
  }
  g.restore();
}

function drawPolar3D(P, rho, n) {
  clear();
  const a = P.a, b = P.b;
  let maxR = 0;
  for (let i = 0; i <= 60; i++) {
    const t = a + (b - a) * i / 60;
    maxR = Math.max(maxR, P.hi(t));
  }
  if (!isFinite(maxR) || maxR <= 0) maxR = 2;

  let zmin = 0, zmax = 0;
  for (let i = 0; i <= 24; i++) {
    const t = a + (b - a) * i / 24;
    const r0 = P.lo(t), r1 = P.hi(t);
    for (let j = 0; j <= 20; j++) {
      const r = r0 + (r1 - r0) * j / 20;
      const x = r * cos(t), y = r * sin(t);
      const z = rho(r, t, x, y);
      if (isFinite(z)) {
        zmin = Math.min(zmin, z);
        zmax = Math.max(zmax, z);
      }
    }
  }
  if (Math.abs(zmax - zmin) < 1e-4) zmax = zmin + 1;
  const pBox = [-maxR * 1.1, maxR * 1.1, -maxR * 1.1, maxR * 1.1, zmin - 0.1 * (zmax - zmin), zmax + 0.1 * (zmax - zmin)];
  const box = [-maxR, maxR, -maxR, maxR, zmin, zmax];

  const cx = 0, cy = 0, cz = (pBox[4] + pBox[5]) / 2;
  const diag = Math.hypot(pBox[1] - pBox[0], pBox[3] - pBox[2], pBox[5] - pBox[4]) || 1;
  const k = 0.82 * Math.min(W, H) / diag * zoom3D;

  const pr = (x, y, z) => {
    const rx = x - cx, ry = y - cy, rz = z - cz;
    const x1 = rx * cos(yaw) - ry * sin(yaw);
    const y1 = rx * sin(yaw) + ry * cos(yaw);
    return [
      W / 2 + x1 * k,
      H / 2 - (rz * cos(pit) + y1 * sin(pit)) * k,
      y1 * cos(pit) - rz * sin(pit)
    ];
  };

  const dark = isDark();
  drawPolarGroundGrid(pr, maxR, dark);
  drawAxes3D(pr, pBox, dark);
  drawBaseRegionPolar(pr, P, dark);
  drawSurfaceAndWallsPolar(pr, P, rho, box, dark);

  const kResult = calcP(P, rho);
  const fStr = ($("c0") && $("c0").value.trim()) || "1";
  const fDisp = fStr === "1" ? "r" : `(${esc(fStr)})·r`;
  $("out").innerHTML = `<div>Change of variables: x = r cos θ,  y = r sin θ,  dA = r dr dθ</div><div>∬ f dA = ∬ <b>${fDisp}</b> dr dθ (Volume under surface)</div><div>Limits: ${P.T}</div>${finalAnsHtml("Final answer: ∬ f dA (Volume)", F6(kResult.m))}<div>Base region area (z = 0) = <b>${F(kResult.A)}</b></div><div class="dim">${hint3D()}</div>`;
}

function drawPolar() {
  const fStr = ($("c0") && $("c0").value.trim()) || "1";
  let rho;
  try {
    const fn = mk(fStr, ["r", "t", "x", "y"]);
    rho = (r, t, x, y) => fn(r, t, x, y);
  } catch (err) {
    throw Error("f(r, θ): " + err.message);
  }
  const P = getPolar(), n = +$("n").value;
  if (S.dv !== "2") {
    drawPolar3D(P, rho, n);
    return;
  }
  let R = 0; for (let i = 0; i <= 200; i++)R = Math.max(R, P.hi(P.a + (P.b - P.a) * i / 200)); R *= 1.2; if (!isFinite(R) || R <= 0) throw Error("The upper r-limit must be positive somewhere."); const k = calcP(P, rho); if (!(k.A > 0)) throw Error("Empty region: the lower r-limit must be below the upper one somewhere.");
  const key = "p" + R.toFixed(5);
  if (V.k2 !== key) { V.k2 = key; const q = win(-R, R, -R, R); V.s = q.X(1) - q.X(0); V.cx = 0; V.cy = 0 }
  const sv = V.s, T = { X: x => W / 2 + (x - V.cx) * sv, Y: y => H / 2 - (y - V.cy) * sv }; clear(); gridV(T, V.cx - W / 2 / sv, V.cx + W / 2 / sv, V.cy - H / 2 / sv, V.cy + H / 2 / sv);
  g.strokeStyle = "#e3eaef"; for (let r = 1; r < R; r++) { g.beginPath(); g.arc(T.X(0), T.Y(0), T.X(r) - T.X(0), 0, TAU); g.stroke() }
  const pt = (r, t) => [T.X(r * cos(t)), T.Y(r * sin(t))];
  [P.hi, P.lo].forEach(f => { g.save(); g.strokeStyle = "#6b7f90"; g.lineWidth = 1.5; g.setLineDash([6, 4]); g.beginPath(); let on = 0; for (let i = 0; i <= 400; i++) { const t = TAU * i / 400, r = f(t); if (!isFinite(r)) { on = 0; continue } const q = pt(r, t); g[on ? "lineTo" : "moveTo"](q[0], q[1]); on = 1 } g.stroke(); g.restore() });
  g.beginPath(); for (let i = 0; i <= 200; i++) { const t = P.a + (P.b - P.a) * i / 200, q = pt(P.hi(t), t); g[i ? "lineTo" : "moveTo"](q[0], q[1]) }
  for (let i = 200; i >= 0; i--) { const t = P.a + (P.b - P.a) * i / 200, q = pt(P.lo(t), t); g.lineTo(q[0], q[1]) }
  g.closePath(); g.fillStyle = isDark() ? "rgba(59,130,246,.15)" : "rgba(37,99,235,.08)"; g.fill();
  g.strokeStyle = isDark() ? "rgba(96,165,250,.7)" : "rgba(37,99,235,.65)"; g.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const t0 = P.a + (P.b - P.a) * i / n, t1 = P.a + (P.b - P.a) * (i + 1) / n, tm = (t0 + t1) / 2, r1 = P.lo(tm), r2 = P.hi(tm); if (r2 <= r1) continue;
    g.beginPath(); for (let k = 0; k <= 6; k++) { const q = pt(r2, t0 + (t1 - t0) * k / 6); g[k ? "lineTo" : "moveTo"](q[0], q[1]) }
    for (let k = 6; k >= 0; k--) { const q = pt(r1, t0 + (t1 - t0) * k / 6); g.lineTo(q[0], q[1]) }
    g.closePath(); g.fillStyle = ST(i); g.fill(); g.stroke()
  }
  {
    const pp = t => [P.hi(t) * cos(t), P.hi(t) * sin(t)], qq = t => [P.lo(t) * cos(t), P.lo(t) * sin(t)], L = [pp(P.a), qq(P.a), pp(P.b), qq(P.b)]; let pv = P.hi(P.a) - P.lo(P.a);
    for (let i = 1; i <= 600; i++) { const t = P.a + (P.b - P.a) * i / 600, dv = P.hi(t) - P.lo(t); if (Math.abs(P.hi(t)) < 2e-3 && P.lo(t) === 0) L.push([0, 0]); if (isFinite(pv) && isFinite(dv) && pv * dv < 0) { let l = P.a + (P.b - P.a) * (i - 1) / 600, h = t; for (let q = 0; q < 40; q++) { const m = (l + h) / 2; if ((P.hi(m) - P.lo(m)) * pv > 0) l = m; else h = m } L.push(pp((l + h) / 2)) } pv = dv }
    markPts(T, L)
  }
  const fDisp = fStr === "1" ? "r" : `(${esc(fStr)})·r`;
  $("out").innerHTML = `<div>Change of variables: x = r cos θ,  y = r sin θ,  dA = r dr dθ</div><div>∬ f dA = ∬ <b>${fDisp}</b> dr dθ</div><div>Limits: ${P.T}</div>${finalAnsHtml("Final answer: ∬ f dA", F6(k.m))}<div>Area = <b>${F(k.A)}</b></div><div class="dim">${hint2D()}</div>`;
}

let pts = [], p2 = [], info = {};
function gen() {
  const o = getSolid(), b = o.box; pts = []; p2 = []; let tries = 80000, hit = 0, sx = 0, sy = 0, sz = 0, sf = 0;
  const fxyzStr = ($("c0") && $("c0").value.trim()) || "1";
  let fn;
  try {
    fn = mk(fxyzStr, ["x", "y", "z", "r", "t", "p"]);
  } catch (e) {
    fn = () => 1;
  }
  for (let i = 0; i < tries; i++) {
    const x = b[0] + Math.random() * (b[1] - b[0]), y = b[2] + Math.random() * (b[3] - b[2]), z = b[4] + Math.random() * (b[5] - b[4]);
    if (o.f(x, y, z)) {
      hit++; sx += x; sy += y; sz += z;
      const r = Math.hypot(x, y), t = Math.atan2(y, x), rho = Math.hypot(r, z);
      sf += fn(x, y, z, r, t, rho);
      if (pts.length < 7500) pts.push([x, y, z]);
      if (p2.length < 12000) p2.push([x, y, z]);
    }
  }
  if (!hit) throw Error("No points inside. Check that each lower limit is below its upper limit.");
  const bv = (b[1] - b[0]) * (b[3] - b[2]) * (b[5] - b[4]);
  info = { o, V: hit / tries * bv, intVal: (sf / tries) * bv, cx: sx / hit, cy: sy / hit, cz: sz / hit, fxyzStr };
}

function drawSolidGuide3D(pr, o, dark) {
  g.save();
  g.strokeStyle = dark ? "rgba(96, 165, 250, 0.45)" : "rgba(37, 99, 235, 0.4)";
  g.lineWidth = 1.3;
  const name = o.n || "";

  if (name.startsWith("Cylinder")) {
    const r = 2, z0 = 0, z1 = 3;
    const ring = z => {
      g.beginPath();
      for (let i = 0; i <= 48; i++) {
        const t = i * TAU / 48, p = pr(r * cos(t), r * sin(t), z);
        g[i ? "lineTo" : "moveTo"](p[0], p[1]);
      }
      g.stroke();
    };
    ring(z0); ring(z1);
    for (let i = 0; i < 8; i++) {
      const t = i * TAU / 8, pA = pr(r * cos(t), r * sin(t), z0), pB = pr(r * cos(t), r * sin(t), z1);
      g.beginPath(); g.moveTo(pA[0], pA[1]); g.lineTo(pB[0], pB[1]); g.stroke();
    }
  } else if (name.startsWith("Paraboloid")) {
    for (let z = 1; z <= 4; z++) {
      const r = Math.sqrt(z);
      g.beginPath();
      for (let i = 0; i <= 48; i++) {
        const t = i * TAU / 48, p = pr(r * cos(t), r * sin(t), z);
        g[i ? "lineTo" : "moveTo"](p[0], p[1]);
      }
      g.stroke();
    }
    [-1, 1].forEach(sgn => {
      g.beginPath();
      for (let i = 0; i <= 24; i++) {
        const x = sgn * 2 * i / 24, z = x * x, p = pr(x, 0, z);
        g[i ? "lineTo" : "moveTo"](p[0], p[1]);
      }
      g.stroke();
    });
  } else if (name.startsWith("Cone")) {
    const r = 2, z1 = 2;
    g.beginPath();
    for (let i = 0; i <= 48; i++) {
      const t = i * TAU / 48, p = pr(r * cos(t), r * sin(t), z1);
      g[i ? "lineTo" : "moveTo"](p[0], p[1]);
    }
    g.stroke();
    const apex = pr(0, 0, 0);
    for (let i = 0; i < 8; i++) {
      const t = i * TAU / 8, p = pr(r * cos(t), r * sin(t), z1);
      g.beginPath(); g.moveTo(apex[0], apex[1]); g.lineTo(p[0], p[1]); g.stroke();
    }
  } else if (name.startsWith("Sphere") || name.startsWith("Upper") || name.startsWith("Shell")) {
    const isShell = name.startsWith("Shell");
    const radii = isShell ? [1, 2] : [2];
    radii.forEach(r => {
      g.beginPath();
      for (let i = 0; i <= 48; i++) {
        const t = i * TAU / 48, p = pr(r * cos(t), r * sin(t), 0);
        g[i ? "lineTo" : "moveTo"](p[0], p[1]);
      }
      g.stroke();
      g.beginPath();
      const numSteps = name.startsWith("Upper") ? 24 : 48;
      for (let i = 0; i <= numSteps; i++) {
        const phi = (name.startsWith("Upper") ? PI / 2 : PI) * i / numSteps;
        const p = pr(r * sin(phi), 0, r * cos(phi));
        g[i ? "lineTo" : "moveTo"](p[0], p[1]);
      }
      g.stroke();
      if (!name.startsWith("Upper")) {
        [-0.5, 0.5].forEach(k => {
          const z = r * k, r2 = Math.sqrt(Math.max(0, r * r - z * z));
          g.beginPath();
          for (let i = 0; i <= 36; i++) {
            const t = i * TAU / 36, p = pr(r2 * cos(t), r2 * sin(t), z);
            g[i ? "lineTo" : "moveTo"](p[0], p[1]);
          }
          g.stroke();
        });
      } else {
        const z = r * 0.5, r2 = Math.sqrt(Math.max(0, r * r - z * z));
        g.beginPath();
        for (let i = 0; i <= 36; i++) {
          const t = i * TAU / 36, p = pr(r2 * cos(t), r2 * sin(t), z);
          g[i ? "lineTo" : "moveTo"](p[0], p[1]);
        }
        g.stroke();
      }
    });
  } else if (name.startsWith("Tetrahedron")) {
    const px = pr(1, 0, 0), py = pr(0, 1, 0), pz = pr(0, 0, 1);
    g.fillStyle = dark ? "rgba(59, 130, 246, 0.15)" : "rgba(37, 99, 235, 0.12)";
    g.beginPath(); g.moveTo(px[0], px[1]); g.lineTo(py[0], py[1]); g.lineTo(pz[0], pz[1]); g.closePath();
    g.fill(); g.stroke();
  }
  g.restore();
}

function drawTri() {
  const currentKey = S.sys + "|" + [0, 1, 2, 3, 4, 5, 6].map(k => $("c" + k) ? $("c" + k).value : "").join("|");
  if (!info.o || info.key !== currentKey) {
    gen();
    info.key = currentKey;
  }
  const o = info.o, b = o.box;
  const d = DV[S.sys];
  $("out").innerHTML = `<div>${d[0]}</div>${S.sys === "cart" ? "" : `<div>${d[1]}</div>`}<div>Limits: ${o.b}</div>${finalAnsHtml("Final answer: ∭ f dV", F6(info.intVal))}<div>Volume = ∭ dV = <b>${o.custom ? "≈ " + F(info.V) : o.vs + " ≈ " + F(info.V)}</b></div>${o.custom ? "" : `<div class="dim">Numerical volume: ${F(info.V)}</div>`}<div class="dim">${S.tv === "2" ? (S.lockedView ? "🔒 View is locked. Click 'View Locked' to unlock pan and zoom." : "Drag to pan, pinch or scroll to zoom. Dots show the solid projected onto the " + S.pl + " plane, coloured by the third coordinate.") : hint3D()}</div>`;
  if (S.tv === "2") {
    tri2();
    return;
  }
  clear();
  const dark = isDark();
  const cx = (b[0] + b[1]) / 2, cy = (b[2] + b[3]) / 2, cz = (b[4] + b[5]) / 2;
  const diag = Math.hypot(b[1] - b[0], b[3] - b[2], b[5] - b[4]) || 1;
  const k = .8 * Math.min(W, H) / diag * zoom3D;
  const pr = (x, y, z) => {
    x -= cx; y -= cy; z -= cz;
    const x1 = x * cos(yaw) - y * sin(yaw), y1 = x * sin(yaw) + y * cos(yaw);
    return [W / 2 + x1 * k, H / 2 - (z * cos(pit) + y1 * sin(pit)) * k, y1 * cos(pit) - z * sin(pit)];
  };

  g.strokeStyle = dark ? "rgba(30, 41, 59, 0.7)" : "rgba(203, 213, 225, 0.7)";
  g.lineWidth = 1;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) {
    if (i & (1 << j)) continue;
    const a = pr(b[i & 1 ? 1 : 0], b[i & 2 ? 3 : 2], b[i & 4 ? 5 : 4]), c2 = i | (1 << j), d2 = pr(b[c2 & 1 ? 1 : 0], b[c2 & 2 ? 3 : 2], b[c2 & 4 ? 5 : 4]);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(d2[0], d2[1]); g.stroke();
  }

  const O = [b[0], b[2], b[4]];
  g.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  [["x", [b[1], b[2], b[4]], "#3b82f6"], ["y", [b[0], b[3], b[4]], "#10b981"], ["z", [b[0], b[2], b[5]], "#f43f5e"]].forEach(([l, e, col]) => {
    const a = pr(...O), d2 = pr(...e);
    g.strokeStyle = col; g.lineWidth = 2.0;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(d2[0], d2[1]); g.stroke();
    g.fillStyle = col; g.fillText(l, d2[0] + 6, d2[1] - 4);
  });

  {
    const nice = s => { const p = Math.pow(10, Math.floor(Math.log10(s))); return [1, 2, 5, 10].map(m => m * p).find(v => v >= s) };
    const sp3 = [[b[0], b[1]], [b[2], b[3]], [b[4], b[5]]].map(r => nice((r[1] - r[0]) / 4 || 1));
    g.save(); g.lineWidth = 1; g.font = "10px ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace";
    g.strokeStyle = dark ? "#172033" : "#f1f5f9"; g.beginPath();
    for (let v = Math.ceil(b[0] / sp3[0]) * sp3[0]; v <= b[1] + 1e-9; v += sp3[0]) { const A1 = pr(v, b[2], b[4]), A2 = pr(v, b[3], b[4]); g.moveTo(A1[0], A1[1]); g.lineTo(A2[0], A2[1]) }
    for (let v = Math.ceil(b[2] / sp3[1]) * sp3[1]; v <= b[3] + 1e-9; v += sp3[1]) { const A1 = pr(b[0], v, b[4]), A2 = pr(b[1], v, b[4]); g.moveTo(A1[0], A1[1]); g.lineTo(A2[0], A2[1]) }
    g.stroke(); g.fillStyle = dark ? "#94a3b8" : "#64748b";
    for (let v = Math.ceil(b[0] / sp3[0]) * sp3[0]; v <= b[1] + 1e-9; v += sp3[0]) { const q2 = pr(v, b[2], b[4]); g.fillText(+v.toPrecision(3), q2[0] - 6, q2[1] + 13) }
    for (let v = Math.ceil(b[2] / sp3[1]) * sp3[1]; v <= b[3] + 1e-9; v += sp3[1]) { const q2 = pr(b[0], v, b[4]); g.fillText(+v.toPrecision(3), q2[0] - 22, q2[1] + 4) }
    for (let v = Math.ceil(b[4] / sp3[2]) * sp3[2]; v <= b[5] + 1e-9; v += sp3[2]) { const q2 = pr(b[0], b[2], v); g.fillText(+v.toPrecision(3), q2[0] - 24, q2[1] + 4) }
    g.restore();
  }

  drawSolidGuide3D(pr, o, dark);

  const q = pts.map(p => {
    const proj = pr(...p);
    return [proj[0], proj[1], proj[2], (p[2] - b[4]) / ((b[5] - b[4]) || 1)];
  }).sort((u, v) => v[2] - u[2]);

  q.forEach(p => {
    const normH = Math.max(0, Math.min(1, p[3]));
    const hue = (215 - 190 * normH + 360) % 360;
    const lum = dark ? 52 : 46;
    const ptRad = Math.max(1.6, Math.min(4.2, 2.4 * (1 + 0.3 * p[2] / (diag * k || 1))));
    g.fillStyle = `hsla(${hue}, 80%, ${lum}%, 0.72)`;
    g.beginPath();
    g.arc(p[0], p[1], ptRad, 0, TAU);
    g.fill();
  });
}

function tri2() {
  const b = info.o.box, pl = S.pl, [ia, ib, ic] = { xy: [0, 1, 2], xz: [0, 2, 1], yz: [1, 2, 0] }[pl];
  const r = [b[2 * ia], b[2 * ia + 1], b[2 * ib], b[2 * ib + 1]], key = "t" + pl + b.join();
  const fx0 = Math.min(0, r[0]), fx1 = Math.max(0, r[1]), fy0 = Math.min(0, r[2]), fy1 = Math.max(0, r[3]), p = .2 * Math.max(fx1 - fx0, fy1 - fy0, 1);
  if (V.k2 !== key) { V.k2 = key; const q = win(fx0 - p, fx1 + p, fy0 - p, fy1 + p); V.s = q.X(1) - q.X(0); V.cx = (fx0 + fx1) / 2; V.cy = (fy0 + fy1) / 2 }
  const sv = V.s, T = { X: x => W / 2 + (x - V.cx) * sv, Y: y => H / 2 - (y - V.cy) * sv };
  clear(); GL = [pl[0], pl[1]]; gridV(T, V.cx - W / 2 / sv, V.cx + W / 2 / sv, V.cy - H / 2 / sv, V.cy + H / 2 / sv); GL = ["x", "y"];
  const c0 = b[2 * ic], span = (b[2 * ic + 1] - c0) || 1;
  p2.forEach(q => { g.fillStyle = `hsla(${185 - 150 * (q[ic] - c0) / span},65%,42%,.5)`; g.fillRect(T.X(q[ia]) - 1.5, T.Y(q[ib]) - 1.5, 3, 3) });
  g.save(); g.setLineDash([6, 4]); g.strokeStyle = "#6b7f90"; g.lineWidth = 1.5; g.strokeRect(T.X(r[0]), T.Y(r[3]), T.X(r[1]) - T.X(r[0]), T.Y(r[2]) - T.Y(r[3])); g.restore()
}

const EX = [["Paraboloid: y = √x about the x-axis", "0", "4", "0", "sqrt(x)", "x"],
["Cone: y = x/2 about the x-axis", "0", "4", "0", "x/2", "x"],
["Sphere: y = √(4 − x²) about the x-axis", "-2", "2", "0", "sqrt(4-x^2)", "x"],
["Washer: between y = x² and y = x", "0", "1", "x^2", "x", "x"],
["Bowl: y = x² about the y-axis", "0", "2", "0", "x^2", "y"],
["Torus: circle (x−3)² + y² = 1 about the y-axis", "2", "4", "-sqrt(1-(x-3)^2)", "sqrt(1-(x-3)^2)", "y"]];
const cfR = () => row("x from … to", 1, "0", "4") + row("y from … to (use x)", 3, "0", "sqrt(x)") + HINT;
let raf = 0;
function play() {
  cancelAnimationFrame(raf);
  if (S.vw !== "3") {
    S.vw = "3";
    V.k2 = "";
    panel.querySelectorAll("#vw button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === "3"));
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if ($("ang")) $("ang").value = 360;
    update();
    return;
  }
  const t0 = performance.now(), step = t => {
    const q = Math.min(1, (t - t0) / 3000);
    if ($("ang")) $("ang").value = Math.round(360 * q);
    try { drawRev() } catch (e) { return }
    if (q < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}
function drawRev() {
  const v = k => $("c" + k).value, a = num(v(1)), b = num(v(2)), g0 = mk(v(3), ["x"]), f0 = mk(v(4), ["x"]), X = S.ax === "x";
  if (!(b > a)) throw Error("x: the first limit must be smaller than the second");
  if (!X && a < 0) throw Error("To revolve about the y-axis, use x ≥ 0.");
  const ang = +$("ang").value * PI / 180; $("angv").textContent = Math.round(ang * 180 / PI) + "°";
  const NX = 60, xs = [], lo = [], hi = []; let ymin = 0, ymax = 0, R = 0;
  for (let i = 0; i <= NX; i++) { const x = a + (b - a) * i / NX, p = f0(x), q = g0(x); if (!isFinite(p) || !isFinite(q)) throw Error("The y-limits are not defined for every x in [a, b]"); xs.push(x); lo.push(Math.min(p, q)); hi.push(Math.max(p, q)); ymin = Math.min(ymin, lo[i]); ymax = Math.max(ymax, hi[i]); R = Math.max(R, Math.abs(p), Math.abs(q)) }
  let A = 0, V = 0; const N = 3000, dx = (b - a) / N;
  for (let i = 0; i < N; i++) {
    const x = a + (i + .5) * dx, p = f0(x), q = g0(x), u = Math.max(p, q), l = Math.min(p, q); A += (u - l) * dx;
    if (X) { const o = Math.max(Math.abs(u), Math.abs(l)), n = u * l < 0 ? 0 : Math.min(Math.abs(u), Math.abs(l)); V += PI * (o * o - n * n) * dx } else V += TAU * x * (u - l) * dx
  }
  if (!isFinite(V)) throw Error("The y-limits are not defined for every x in [a, b]");
  if (!(A > 0)) throw Error("Empty region: the two curves coincide.");
  const bm = Math.max(Math.abs(a), Math.abs(b)), bx = X ? [a, b, -R, R, -R, R] : [-bm, bm, -bm, bm, ymin, ymax];
  const cx = (bx[0] + bx[1]) / 2, cy = (bx[2] + bx[3]) / 2, cz = (bx[4] + bx[5]) / 2, k = .85 * Math.min(W, H) / Math.hypot(bx[1] - bx[0], bx[3] - bx[2], bx[5] - bx[4]);
  const pr = (x, y, z) => { x -= cx; y -= cy; z -= cz; const x1 = x * cos(yaw) - y * sin(yaw), y1 = x * sin(yaw) + y * cos(yaw); return [W / 2 + x1 * k, H / 2 - (z * cos(pit) + y1 * sin(pit)) * k] };
  const w = (x, r, t) => X ? pr(x, r * cos(t), r * sin(t)) : pr(x * cos(t), x * sin(t), r);
  const line = ps => { g.beginPath(); ps.forEach((p, i) => g[i ? "lineTo" : "moveTo"](p[0], p[1])); g.stroke() };
  const full = ang >= TAU - 1e-6, ns = Math.max(8, Math.round(64 * ang / TAU));
  clear();
  {
    const GE = Math.max(...bx.map(Math.abs)) * 1.05, rw = GE / 3, p10 = Math.pow(10, Math.floor(Math.log10(rw))), gs = [1, 2, 5, 10].map(m => m * p10).find(v => v >= rw), nn = Math.floor(GE / gs), ge = nn * gs;
    g.save(); g.lineWidth = 1; g.strokeStyle = "#dbe5ec"; g.beginPath();
    for (let n = -nn; n <= nn; n++) { const v = n * gs, P1 = pr(v, -ge, 0), P2 = pr(v, ge, 0), P3 = pr(-ge, v, 0), P4 = pr(ge, v, 0); g.moveTo(P1[0], P1[1]); g.lineTo(P2[0], P2[1]); g.moveTo(P3[0], P3[1]); g.lineTo(P4[0], P4[1]) }
    g.stroke(); g.restore()
  }
  if (ang > 1e-4) {
    g.lineWidth = 1; g.strokeStyle = "rgba(15,118,110,.5)";
    for (let j = 0; j <= 16; j++) { const i = Math.round(j * NX / 16);[lo[i], hi[i]].forEach(r => { if (X ? Math.abs(r) < 1e-9 : xs[i] < 1e-9) return; const ps = []; for (let q = 0; q <= ns; q++)ps.push(w(xs[i], r, ang * q / ns)); line(ps) }) }
    g.strokeStyle = "rgba(15,118,110,.3)";
    const numRibs = 18;
    for (let m = 1; m <= numRibs; m++) {
      const t = m * TAU / numRibs;
      if (t > ang + 1e-4) break;
      if (full && m === numRibs) continue;
      [lo, hi].forEach(arr => line(xs.map((x, i) => w(x, arr[i], t))))
    }
    if (!full) {
      [lo, hi].forEach(arr => line(xs.map((x, i) => w(x, arr[i], ang))))
    }
  }
  const pad = .15 * (X ? b - a : ymax - ymin), A1 = X ? pr(a - pad, 0, 0) : pr(0, 0, ymin - pad), A2 = X ? pr(b + pad, 0, 0) : pr(0, 0, ymax + pad);
  g.strokeStyle = "#16293b"; g.lineWidth = 2; line([A1, A2]); g.fillStyle = "#16293b"; g.font = "13px Inter,sans-serif"; g.fillText(X ? "x-axis" : "y-axis", A2[0] + 6, A2[1] - 6);
  const reg = t => { const ps = xs.map((x, i) => w(x, hi[i], t)).concat(xs.map((x, i) => w(x, lo[i], t)).reverse()); g.beginPath(); ps.forEach((p, i) => g[i ? "lineTo" : "moveTo"](p[0], p[1])); g.closePath() };
  g.fillStyle = "rgba(228,87,46,.4)"; g.strokeStyle = "#e4572e"; reg(0); g.fill(); g.stroke();
  if (ang > 1e-3 && !full) { g.fillStyle = "rgba(228,87,46,.15)"; g.setLineDash([5, 4]); reg(ang); g.fill(); g.stroke(); g.setLineDash([]) }
  g.save(); g.lineWidth = 1; g.strokeStyle = "#9fb3c2"; g.fillStyle = "#5d7285"; g.font = "11px Inter,sans-serif";
  const E = Math.max(...bx.map(Math.abs)) * 1.05, nm = X ? ["x", "y", "z"] : ["x", "z", "y"];
  [[E, 0, 0], [0, E, 0], [0, 0, E]].forEach((p, i) => { const u = pr(...p), q = pr(-p[0], -p[1], -p[2]); g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(u[0], u[1]); g.stroke(); g.fillText(nm[i], u[0] + 4, u[1] - 4) });
  const nice = s => { const p = Math.pow(10, Math.floor(Math.log10(s))); return [1, 2, 5, 10].map(m => m * p).find(v => v >= s) }, ts = nice(E / 3), nt2 = Math.floor(E / ts);
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(u => { for (let n = -nt2; n <= nt2; n++) { if (!n) continue; const v = n * ts, q = pr(u[0] * v, u[1] * v, u[2] * v); g.fillStyle = "#9fb3c2"; g.beginPath(); g.arc(q[0], q[1], 2, 0, TAU); g.fill(); g.fillStyle = "#16293b"; g.fillText(+v.toPrecision(3), q[0] + 4, q[1] + 12) } }); g.restore();
  const iw = Math.min(150, W * .42), ih = iw * .72, ix = 8, iy = 8, gx0 = Math.min(0, a), gx1 = Math.max(0, b), gy0 = Math.min(0, ymin), gy1 = Math.max(0, ymax), sc = Math.min((iw - 26) / ((gx1 - gx0) || 1), (ih - 22) / ((gy1 - gy0) || 1)), ox = ix + 14 - sc * gx0, oy = iy + ih - 12 + sc * gy0, Ix = x => ox + sc * x, Iy = y => oy - sc * y;
  g.save(); g.fillStyle = "rgba(255,255,255,.94)"; g.strokeStyle = "#cfdbe3"; g.lineWidth = 1; g.fillRect(ix, iy, iw, ih); g.strokeRect(ix, iy, iw, ih); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
  g.strokeStyle = "#16293b"; g.beginPath(); g.moveTo(Ix(gx0) - 4, Iy(0)); g.lineTo(Ix(gx1) + 8, Iy(0)); g.moveTo(Ix(0), Iy(gy0) + 4); g.lineTo(Ix(0), Iy(gy1) - 8); g.stroke();
  g.fillStyle = "rgba(228,87,46,.4)"; g.strokeStyle = "#e4572e"; g.lineWidth = 1.5; g.beginPath(); xs.forEach((x, i) => g[i ? "lineTo" : "moveTo"](Ix(x), Iy(hi[i]))); for (let i = NX; i >= 0; i--)g.lineTo(Ix(xs[i]), Iy(lo[i])); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#5d7285"; g.font = "10px Inter,sans-serif"; g.fillText("x", Ix(gx1) + 1, Iy(0) - 3); g.fillText("y", Ix(0) + 3, Iy(gy1) + 9);
  const tx = nice((gx1 - gx0) / 3 || 1), ty = nice((gy1 - gy0) / 3 || 1); g.fillStyle = "#16293b"; g.font = "9px Inter,sans-serif";
  for (let v = Math.ceil(gx0 / tx) * tx; v <= gx1 + 1e-9; v += tx) { if (Math.abs(v) < tx / 2) continue; g.fillText(+v.toPrecision(3), Ix(v) - 5, Iy(0) + 10) }
  for (let v = Math.ceil(gy0 / ty) * ty; v <= gy1 + 1e-9; v += ty) { if (Math.abs(v) < ty / 2) continue; g.fillText(+v.toPrecision(3), Ix(0) + 3, Iy(v) + 3) }
  g.restore();
  const part = V * ang / TAU, deg = Math.round(ang * 180 / PI);
  $("out").innerHTML = `<div>Region: ${esc(v(1))} ≤ x ≤ ${esc(v(2))},  ${esc(v(3))} ≤ y ≤ ${esc(v(4))}, revolved about the ${S.ax}-axis</div><div>${X ? "Washer method: V = π ∫ (R² − r²) dx" : "Shell method: V = 2π ∫ x (f − g) dx"}</div><div>Volume (${deg}°) = <b>${F(part)}</b></div>${full ? "" : `<div>Volume (full 360°) = <b>${F(V)}</b></div>`}`; if (S.vw === "2") gr2(a, b, g0, f0)
}
function gr2(a, b, gl, fu) {
  const N = 200; let y0 = 0, y1 = 0;
  for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N;[gl(x), fu(x)].forEach(y => { if (isFinite(y)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y) } }) }
  const x0 = Math.min(0, a), x1 = Math.max(0, b), p = .2 * Math.max(x1 - x0, y1 - y0, 1), X0 = x0 - p, X1 = x1 + p, Y0 = y0 - p, Y1 = y1 + p, key = [a, b, y0, y1, S.ax].join();
  if (V.k2 !== key) { V.k2 = key; const q = win(X0, X1, Y0, Y1); V.s = q.X(1) - q.X(0); V.cx = (X0 + X1) / 2; V.cy = (Y0 + Y1) / 2 }
  const sv = V.s, T = { X: x => W / 2 + (x - V.cx) * sv, Y: y => H / 2 - (y - V.cy) * sv }, VX0 = V.cx - W / 2 / sv, VX1 = V.cx + W / 2 / sv, VY0 = V.cy - H / 2 / sv, VY1 = V.cy + H / 2 / sv;
  clear();
  const sp = Math.max(VX1 - VX0, VY1 - VY0), raw = sp / 9, p10 = Math.pow(10, Math.floor(Math.log10(raw))), st = [1, 2, 5, 10].map(m => m * p10).find(v => v >= raw);
  g.save(); g.strokeStyle = "#e3eaef"; g.lineWidth = 1;
  for (let v = Math.ceil(VX0 / st) * st; v <= VX1; v += st) { g.beginPath(); g.moveTo(T.X(v), 0); g.lineTo(T.X(v), H); g.stroke() }
  for (let v = Math.ceil(VY0 / st) * st; v <= VY1; v += st) { g.beginPath(); g.moveTo(0, T.Y(v)); g.lineTo(W, T.Y(v)); g.stroke() } g.restore();
  g.save(); g.strokeStyle = "#16293b"; g.fillStyle = "#5d7285"; g.font = "11px Inter,sans-serif"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, T.Y(0)); g.lineTo(W, T.Y(0)); g.moveTo(T.X(0), 0); g.lineTo(T.X(0), H); g.stroke();
  for (let v = Math.ceil(VX0 / st) * st; v <= VX1; v += st) { if (Math.abs(v) < st / 1e3) continue; g.fillText(+v.toPrecision(6), T.X(v) - 6, Math.min(H - 4, Math.max(12, T.Y(0) + 14))) }
  for (let v = Math.ceil(VY0 / st) * st; v <= VY1; v += st) { if (Math.abs(v) < st / 1e3) continue; g.fillText(+v.toPrecision(6), Math.min(W - 30, Math.max(4, T.X(0) + 5)), T.Y(v) - 3) } g.restore();
  g.save(); g.strokeStyle = "#6b7f90"; g.lineWidth = 1.5; g.setLineDash([6, 4]);
  [gl, fu].forEach(f => { g.beginPath(); let on = 0; for (let i = 0; i <= 300; i++) { const x = X0 + (X1 - X0) * i / 300, y = f(x); if (!isFinite(y)) { on = 0; continue } g[on ? "lineTo" : "moveTo"](T.X(x), T.Y(y)); on = 1 } g.stroke() }); g.restore();
  {
    const mx = S.ax === "x", P = (x, y) => mx ? [T.X(x), T.Y(-y)] : [T.X(-x), T.Y(y)];
    g.beginPath(); for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N, q = P(x, fu(x)); g[i ? "lineTo" : "moveTo"](q[0], q[1]) } for (let i = N; i >= 0; i--) { const x = a + (b - a) * i / N, q = P(x, gl(x)); g.lineTo(q[0], q[1]) }
    g.closePath(); g.fillStyle = "rgba(15,118,110,.28)"; g.fill(); g.strokeStyle = "#0f766e"; g.lineWidth = 2; g.stroke();
    g.save(); g.strokeStyle = "rgba(15,118,110,.45)"; g.lineWidth = 1; g.beginPath();
    for (let i = 0; i <= 24; i++) { const x = a + (b - a) * i / 24, u = fu(x), l = gl(x); if (!isFinite(u) || !isFinite(l)) continue; const A1 = P(x, u), A2 = P(x, l); g.moveTo(A1[0], A1[1]); g.lineTo(A2[0], A2[1]); g.moveTo(T.X(x), T.Y(u)); g.lineTo(T.X(x), T.Y(l)) }
    g.stroke(); g.restore();
    const m0 = P(b, fu(b)); g.fillStyle = "#0f766e"; g.font = "12px Inter,sans-serif"; g.fillText("revolved copy", m0[0] + 6, m0[1] + 14)
  }
  g.beginPath(); for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N; g[i ? "lineTo" : "moveTo"](T.X(x), T.Y(fu(x))) } for (let i = N; i >= 0; i--) { const x = a + (b - a) * i / N; g.lineTo(T.X(x), T.Y(gl(x))) }
  g.closePath(); g.fillStyle = "rgba(228,87,46,.35)"; g.fill(); g.strokeStyle = "#e4572e"; g.lineWidth = 2.5; g.stroke();
  g.save(); g.strokeStyle = "#16293b"; g.lineWidth = 3; g.setLineDash([10, 5]); g.beginPath();
  if (S.ax === "x") { g.moveTo(T.X(X0), T.Y(0)); g.lineTo(T.X(X1), T.Y(0)) } else { g.moveTo(T.X(0), T.Y(Y0)); g.lineTo(T.X(0), T.Y(Y1)) } g.stroke(); g.restore();
  g.fillStyle = "#16293b"; g.font = "12px Inter,sans-serif";
  if (S.ax === "x") g.fillText("axis of revolution (x-axis)", T.X(X0) + 8, T.Y(0) - 8); else g.fillText("axis of revolution (y-axis)", T.X(0) + 8, T.Y(Y1) + 16);
  const seen = new Set;[a, b].forEach(x => [gl(x), fu(x)].forEach(y => { if (!isFinite(y)) return; const key = x + "|" + y.toFixed(6); if (seen.has(key)) return; seen.add(key); const px = T.X(x), py = T.Y(y); g.fillStyle = "#e4572e"; g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath(); g.arc(px, py, 5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#16293b"; g.fillText("(" + (+x.toFixed(2)) + ", " + (+y.toFixed(2)) + ")", px + 8, py - 8) }))
}
const panel = $("ctl");
const PAL = ["#2563eb", "#e11d48", "#059669", "#7c3aed", "#d97706", "#0284c7"], V = { cx: 2, cy: 3, s: 30 }, PT = new Map;
function resetV() { V.cx = 2; V.cy = 3; V.s = Math.min(W, H) / 14 }

function getDefinedVars() {
  const vars = {};
  if (!S.sliderMeta) S.sliderMeta = {};
  S.eq.forEach(src => {
    const m = src.match(/^\s*([a-zA-Z])\s*=\s*(-?\d*\.?\d+(?:e[+-]?\d+)?)\s*$/i);
    if (m) {
      const v = m[1].toLowerCase();
      if (v !== "x" && v !== "y") {
        vars[v] = parseFloat(m[2]);
        if (!S.sliderMeta[v]) {
          S.sliderMeta[v] = { min: -10, max: 10, step: 0.1, playing: false, dir: 1, loop: "bounce", val: vars[v] };
        } else {
          S.sliderMeta[v].val = vars[v];
        }
      }
    }
  });
  return vars;
}

function getUndefinedParams(src, definedVars) {
  if (!src || /^\s*(∬|∫|int\b)/i.test(src)) return [];
  if (/^\s*[a-zA-Z]\s*=\s*-?\d*\.?\d+\s*$/.test(src)) return [];
  const clean = String(src).toLowerCase().replace(/π/g, "pi").replace(/\s+/g, "");
  const tokens = clean.match(/\d+\.?\d*|\.\d+|[a-z]+|./g) || [];
  const found = new Set();
  tokens.forEach(w => {
    if (/^[a-z]+$/.test(w) && !FN.includes(w) && w !== "pi" && w !== "tau" && w !== "phi" && w !== "e") {
      for (const ch of w) {
        if (ch !== "x" && ch !== "y") {
          if (!definedVars.hasOwnProperty(ch)) {
            found.add(ch);
          }
        }
      }
    }
  });
  return Array.from(found);
}

let sliderAnimId = null;
function cancelSliderAnim() {
  if (sliderAnimId) {
    cancelAnimationFrame(sliderAnimId);
    sliderAnimId = null;
  }
}

function tickSliders() {
  let anyPlaying = false;
  for (const [vName, meta] of Object.entries(S.sliderMeta || {})) {
    if (!meta.playing) continue;
    anyPlaying = true;
    const span = (meta.max - meta.min) || 1;
    const step = span / 240 * (meta.dir || 1);
    let next = meta.val + step;
    if (next >= meta.max) {
      if (meta.loop === "loop") {
        next = meta.min;
      } else {
        next = meta.max;
        meta.dir = -1;
      }
    } else if (next <= meta.min) {
      if (meta.loop === "loop") {
        next = meta.min;
      } else {
        next = meta.min;
        meta.dir = 1;
      }
    }
    meta.val = +Number(next).toFixed(3);

    const eqIdx = S.eq.findIndex(e => new RegExp(`^\\s*${vName}\\s*=`, "i").test(e));
    if (eqIdx !== -1) {
      S.eq[eqIdx] = `${vName} = ${meta.val}`;
      const input = panel.querySelector(`.slider-num-val[data-var="${vName}"]`);
      if (input && document.activeElement !== input) input.value = meta.val;
      const track = panel.querySelector(`.desmos-slider-range[data-var="${vName}"]`);
      if (track) track.value = meta.val;
    }
  }
  if (anyPlaying) {
    try { drawGr(); } catch (_) { }
    sliderAnimId = requestAnimationFrame(tickSliders);
  } else {
    sliderAnimId = null;
  }
}

function eqRows() {
  const definedVars = getDefinedVars();
  let colorIdx = 0;
  $("eqs").innerHTML = S.eq.map((q, i) => {
    const isSlider = /^\s*([a-zA-Z])\s*=\s*(-?\d*\.?\d+(?:e[+-]?\d+)?)\s*$/i.exec(q);
    if (isSlider && isSlider[1].toLowerCase() !== "x" && isSlider[1].toLowerCase() !== "y") {
      const vName = isSlider[1].toLowerCase();
      const val = parseFloat(isSlider[2]);
      if (!S.sliderMeta[vName]) {
        S.sliderMeta[vName] = { min: -10, max: 10, step: 0.1, playing: false, dir: 1, loop: "bounce", val };
      } else {
        S.sliderMeta[vName].val = val;
      }
      const meta = S.sliderMeta[vName];
      return `<div class="desmos-card desmos-slider-card" data-i="${i}" data-var="${vName}">
        <div class="desmos-row-main">
          <span class="desmos-row-idx">${i + 1}</span>
          <button type="button" class="slider-play-btn ${meta.playing ? "playing" : ""}" data-var="${vName}" data-i="${i}" title="${meta.playing ? "Pause animation" : "Play animation"}" aria-label="Play or pause slider ${vName}">
            ${meta.playing ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4.5" height="16" rx="1.5"/><rect x="14.5" y="4" width="4.5" height="16" rx="1.5"/></svg>` : `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>`}
          </button>
          <button type="button" class="slider-loop-btn" data-var="${vName}" title="Animation loop mode: ${meta.loop || "bounce"}" aria-label="Toggle loop mode">
            ${meta.loop === "loop" ? "→" : "⇄"}
          </button>
          <div class="slider-expr-wrap">
            <span class="slider-var-lbl"><i>${vName}</i> =</span>
            <input type="text" class="slider-num-val" data-var="${vName}" data-i="${i}" value="${val}" inputmode="none" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Value for ${vName}">
          </div>
          <button type="button" class="desmos-btn-delete seg-x" data-i="${i}" aria-label="Remove slider ${vName}" title="Remove slider">×</button>
        </div>
        <div class="slider-track-row">
          <input type="number" class="slider-bound-input slider-min" data-var="${vName}" value="${meta.min}" title="Slider minimum" aria-label="Minimum value for ${vName}">
          <input type="range" class="desmos-slider-range" data-var="${vName}" data-i="${i}" min="${meta.min}" max="${meta.max}" step="${meta.step || 0.1}" value="${val}" aria-label="Slider for ${vName}">
          <input type="number" class="slider-bound-input slider-max" data-var="${vName}" value="${meta.max}" title="Slider maximum" aria-label="Maximum value for ${vName}">
        </div>
      </div>`;
    }

    const unparams = getUndefinedParams(q, definedVars);
    const col = PAL[i % PAL.length];
    const isHidden = !!(S.hiddenEq && S.hiddenEq[i]);

    let evalBadge = "";
    if (unparams.length === 0 && q.trim()) {
      try {
        const rObj = rel(q, definedVars);
        if (rObj && rObj.evalConst !== null && rObj.evalConst !== undefined) {
          evalBadge = `<span class="desmos-eval-badge" title="Calculated value">= ${rObj.evalConst}</span>`;
        }
      } catch (_) { }
    }

    return `<div class="desmos-card desmos-eq-card ${unparams.length > 0 ? "has-warning" : ""} ${isHidden ? "is-hidden" : ""}" data-i="${i}">
      <div class="desmos-row-main">
        <span class="desmos-row-idx">${i + 1}</span>
        ${unparams.length > 0
          ? `<span class="desmos-icon-badge warning" title="Undefined parameters: ${unparams.join(", ")}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>`
          : `<button type="button" class="desmos-icon-badge curve ${isHidden ? "hidden-curve" : ""}" data-i="${i}" style="${isHidden ? `border:2.5px solid ${col};background:transparent;` : `background:${col};`}" title="${isHidden ? "Click to show graph" : "Click to hide graph"}" aria-label="${isHidden ? "Show" : "Hide"} graph for equation ${i + 1}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isHidden ? col : "#ffffff"}" stroke-width="2.8" stroke-linecap="round" style="${isHidden ? "opacity:0.45;" : ""}"><path d="M4 14c3-6 5-6 8 0s5 6 8 0"/></svg>
            </button>`}
        <input class="eq desmos-eq-input" id="e${i}" data-i="${i}" value="${esc(q).replace(/"/g, "&quot;")}" inputmode="none" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. y = mx + b" aria-label="Equation ${i + 1}">
        ${evalBadge}
        <button type="button" class="desmos-btn-delete seg-x" data-i="${i}" aria-label="Remove equation ${i + 1}" title="Remove equation">×</button>
      </div>
      ${unparams.length > 0 ? `<div class="add-slider-box" data-i="${i}">
        <span class="add-slider-label">add slider:</span>
        ${unparams.map(p => `<button type="button" class="btn-add-slider" data-var="${p}"><i>${p}</i></button>`).join(" ")}
        ${unparams.length > 1 ? `<button type="button" class="btn-add-slider-all" data-vars="${unparams.join(",")}">all</button>` : ""}
      </div>` : ""}
    </div>`;
  }).join("");
}

const eqNow = () => {
  panel.querySelectorAll(".desmos-eq-input, .eq").forEach(inp => {
    const i = +inp.dataset.i;
    if (!isNaN(i) && i < S.eq.length) S.eq[i] = inp.value;
  });
  return S.eq;
};

function rel(src, definedVars = {}) {
  let t = String(src).replace(/≤/g, "<=").replace(/≥/g, ">=").trim(); if (!t) return null;
  for (let n = 0; n < 5 && /\|/.test(t); n++) t = t.replace(/\|([^|]*)\|/g, "abs($1)");
  const m = t.match(/<=|>=|<|>|=/); let l = "y", r = t, op = "="; if (m) { op = m[0]; l = t.slice(0, m.index); r = t.slice(m.index + op.length) }
  if (!l.trim() || !r.trim()) return null;
  if (l.trim().toLowerCase() === r.trim().toLowerCase()) return null;

  const vKeys = Object.keys(definedVars);
  const allVars = ["x", "y", ...vKeys];
  const vVals = vKeys.map(k => definedVars[k]);

  const f = mk(l + "-(" + r + ")", allVars);
  const sr = r.toLowerCase().replace(/sinh|cosh|tanh|csch|sech|coth|asin|acos|atan|asinh|acosh|atanh|sec|csc|cot|asec|acsc|acot|exp|sqrt|cbrt|abs|sign|floor|ceil|round|log|ln|mean|avg|min|max|mod/g, "");
  const lt = l.trim().toLowerCase(); let ex = null, gg = null;
  if (op === "=" && lt === "y" && !/y/.test(sr)) {
    ex = "y";
    const gFn = mk(r, allVars);
    gg = u => gFn(u, 0, ...vVals);
  } else if (op === "=" && lt === "x" && !/x/.test(sr)) {
    ex = "x";
    const gFn = mk(r, allVars);
    gg = u => gFn(0, u, ...vVals);
  }

  let evalConst = null;
  try {
    const rParams = getUndefinedParams(r, definedVars);
    const hasX = /\bx\b/.test(r.toLowerCase());
    const hasY = /\by\b/.test(r.toLowerCase());
    if (!hasX && !hasY && rParams.length === 0) {
      const cFn = mk(r, allVars);
      const cv = cFn(0, 0, ...vVals);
      if (isFinite(cv)) evalConst = +Number(cv).toFixed(4);
    }
  } catch (_) { }

  return { f: (x, y) => f(x, y, ...vVals), op, ex, g: gg, evalConst };
}

function drawGr() {
  eqNow(); const { cx, cy, s } = V, X = p => (p - W / 2) / s + cx, Y = p => cy - (p - H / 2) / s, PX = x => W / 2 + (x - cx) * s, PY = y => H / 2 - (y - cy) * s;
  clear();
  const raw = 60 / s, p10 = Math.pow(10, Math.floor(Math.log10(raw))), st = [1, 2, 5, 10].map(m => m * p10).find(v => v >= raw), z = st / 1e3;
  g.save(); g.lineWidth = 1; g.font = "11px Inter,sans-serif";
  for (let v = Math.ceil(X(0) / st) * st; v <= X(W); v += st) { const p = Math.round(PX(v)) + .5, ax = Math.abs(v) < z; g.strokeStyle = ax ? "#16293b" : "#e3eaef"; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, H); g.stroke(); if (!ax) { g.fillStyle = "#5d7285"; g.fillText(+v.toPrecision(6), p + 3, Math.min(H - 4, Math.max(12, PY(0) + 13))) } }
  for (let v = Math.ceil(Y(H) / st) * st; v <= Y(0); v += st) { const p = Math.round(PY(v)) + .5, ax = Math.abs(v) < z; g.strokeStyle = ax ? "#16293b" : "#e3eaef"; g.beginPath(); g.moveTo(0, p); g.lineTo(W, p); g.stroke(); if (!ax) { g.fillStyle = "#5d7285"; g.fillText(+v.toPrecision(6), Math.min(W - 30, Math.max(4, PX(0) + 5)), p - 3) } }
  g.restore();

  const definedVars = getDefinedVars();
  const vKeys = Object.keys(definedVars), allVarsX = ["x", ...vKeys], vValsX = vKeys.map(k => definedVars[k]);
  const allVarsXY = ["x", "y", ...vKeys];

  const h = W < 520 ? 4 : 3, nx = Math.ceil(W / h), ny = Math.ceil(H / h), N = nx + 1, out = [], EY = [], IR = [], SI = [], CURVES = [];
  S.eq.forEach((src, k) => {
    if (!src.trim()) return;
    const isSlider = /^\s*([a-zA-Z])\s*=\s*(-?\d*\.?\d+(?:e[+-]?\d+)?)\s*$/i.exec(src);
    if (isSlider && isSlider[1].toLowerCase() !== "x" && isSlider[1].toLowerCase() !== "y") {
      out.push(`<div><b>Slider:</b> <i>${isSlider[1].toLowerCase()}</i> = ${isSlider[2]}</div>`);
      return;
    }
    const col = PAL[k % PAL.length];
    const isHidden = !!(S.hiddenEq && S.hiddenEq[k]);
    if (isHidden) {
      out.push(`<div style="opacity:0.45;color:var(--muted);"><span style="color:${col}">○</span> <span style="text-decoration:line-through">${esc(src)}</span> <i style="font-size:11px">(hidden)</i></div>`);
      return;
    }
    let R;
    if (/^\s*(∬|∫|int\b)/i.test(src)) {
      if (/^\s*(∬|∫\s*∫)/.test(src) || /d[xy]\s*d[xy]\s*$/i.test(src)) IR.push(src);
      else SI.push(src);
      return;
    }
    try {
      R = rel(src, definedVars);
    } catch (e) {
      out.push(`<div style="color:#b42318">${esc(src)}: ${esc(e.message)}</div>`);
      return;
    }
    if (!R) return;
    const C = { src, k, col, R, segs: [] };
    CURVES.push(C);
    if (R.ex) {
      if (R.ex === "y") EY.push(R.g);
      g.strokeStyle = col; g.lineWidth = 2.2; g.beginPath(); let on = 0, px = 0, py = 0; const n = R.ex === "y" ? W : H;
      for (let i = 0; i <= n; i++) {
        const w = R.g(R.ex === "y" ? X(i) : Y(i)); if (!isFinite(w)) { on = 0; continue } const sx = R.ex === "y" ? i : PX(w), sy = R.ex === "y" ? PY(w) : i;
        if (Math.abs(sx) > 1e5 || Math.abs(sy) > 1e5) { on = 0; continue } if (on && Math.hypot(sx - px, sy - py) > 2 * Math.max(W, H)) on = 0; g[on ? "lineTo" : "moveTo"](sx, sy); on = 1; px = sx; py = sy
      }
      g.stroke();
      out.push(`<div><span style="color:${col}">●</span> ${esc(src)}${R.evalConst !== null ? ` = <b>${R.evalConst}</b>` : ""}</div>`);
      return;
    }
    const v = new Float32Array(N * (ny + 1));
    for (let j = 0; j <= ny; j++) { const y = Y(j * h); for (let i = 0; i <= nx; i++) v[j * N + i] = R.f(X(i * h), y) }
    if (R.op !== "=") {
      const ge = R.op[0] === ">"; g.fillStyle = col + "33";
      for (let j = 0; j < ny; j++) {
        let s0 = -1; for (let i = 0; i <= nx; i++) {
          let q = false; if (i < nx) { const m = (v[j * N + i] + v[j * N + i + 1] + v[(j + 1) * N + i] + v[(j + 1) * N + i + 1]) / 4; q = ge ? m >= 0 : m <= 0 }
          if (q && s0 < 0) s0 = i; if (!q && s0 >= 0) { g.fillRect(s0 * h, j * h, (i - s0) * h, h + .5); s0 = -1 }
        }
      }
    }
    g.strokeStyle = col; g.lineWidth = 2.2; g.setLineDash(R.op.length === 1 && R.op !== "=" ? [6, 4] : []); g.beginPath();
    const L = (a, b) => a / (a - b);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = v[j * N + i], b = v[j * N + i + 1], c2 = v[(j + 1) * N + i + 1], d = v[(j + 1) * N + i];
      if (!(isFinite(a) && isFinite(b) && isFinite(c2) && isFinite(d))) continue; const x = i * h, y = j * h, q = [];
      if ((a < 0) !== (b < 0)) q.push([x + h * L(a, b), y]); if ((b < 0) !== (c2 < 0)) q.push([x + h, y + h * L(b, c2)]); if ((d < 0) !== (c2 < 0)) q.push([x + h * L(d, c2), y + h]); if ((a < 0) !== (d < 0)) q.push([x, y + h * L(a, d)]);
      if (q.length >= 2) { g.moveTo(q[0][0], q[0][1]); g.lineTo(q[1][0], q[1][1]); C.segs.push([[X(q[0][0]), Y(q[0][1])], [X(q[1][0]), Y(q[1][1])]]); if (q.length === 4) { g.moveTo(q[2][0], q[2][1]); g.lineTo(q[3][0], q[3][1]); C.segs.push([[X(q[2][0]), Y(q[2][1])], [X(q[3][0]), Y(q[3][1])]]) } }
    }
    g.stroke(); g.setLineDash([]); out.push(`<div><span style="color:${col}">●</span> ${esc(src)}</div>`)
  });

  SI.forEach(src => {
    try {
      const t = src.replace(/^\s*(∫|int)/i, ""), m = t.match(/^\s*[\[(]\s*([^,\])]+?)\s*,\s*([^\])]+?)\s*[\])]\s*(.*)$/); if (!m) throw Error("Write limits like ∫[0,2] x^2 dx");
      const a = num(m[1]), b = num(m[2]), body = m[3].replace(/\s*d[xy]\s*$/i, ""), fx = mk(body, allVarsX); if (!(b > a)) throw Error("The first limit must be smaller than the second");
      const N2 = 2000, dx = (b - a) / N2; let s = 0; for (let i = 0; i <= N2; i++) s += (i === 0 || i === N2 ? 1 : i % 2 ? 4 : 2) * fx(a + i * dx, ...vValsX); s *= dx / 3; if (!isFinite(s)) throw Error("The function is not defined on [a, b]");
      g.save(); g.beginPath(); g.moveTo(PX(a), PY(0)); for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200; g.lineTo(PX(x), PY(fx(x, ...vValsX))) } g.lineTo(PX(b), PY(0)); g.closePath(); g.fillStyle = "rgba(228,87,46,.25)"; g.fill();
      g.strokeStyle = "#e4572e"; g.lineWidth = 2.2; g.beginPath(); for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200; g[i ? "lineTo" : "moveTo"](PX(x), PY(fx(x, ...vValsX))) } g.stroke(); g.restore();
      out.push(`<div>∫ from ${a} to ${b} of ${esc(body.trim())} dx = <b>${F(s)}</b></div>`)
    } catch (e) { out.push(`<div style="color:#b42318">${esc(src)}: ${esc(e.message)}</div>`) }
  });

  if (EY.length >= 2) {
    const f1 = EY[0], f2 = EY[1], dd = x => f1(x) - f2(x), rt = []; let pa = X(-20), pv = dd(pa);
    const Smp = W * 2 + 40;
    for (let i = 1; i <= Smp; i++) { const x = X((i - 20) / 2), vv = dd(x); if (isFinite(pv) && isFinite(vv) && (pv < 0) !== (vv < 0)) { let lo = pa, hi = x; for (let q = 0; q < 50; q++) { const m = (lo + hi) / 2; if ((dd(m) < 0) === (pv < 0)) lo = m; else hi = m } rt.push((lo + hi) / 2) } pa = x; pv = vv }
    g.save(); let area = 0;
    for (let i = 0; i + 1 < rt.length; i++) {
      const r0 = rt[i], r1 = rt[i + 1], n = 80;
      g.fillStyle = "rgba(45,212,191,.42)";
      g.beginPath();
      for (let j = 0; j <= n; j++) { const x = r0 + (r1 - r0) * j / n; g[j ? "lineTo" : "moveTo"](PX(x), PY(f1(x))) }
      for (let j = n; j >= 0; j--) { const x = r0 + (r1 - r0) * j / n; g.lineTo(PX(x), PY(f2(x))) }
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(15,118,110,.85)";
      g.lineWidth = 1.8;
      g.stroke();
      const M = 2000; for (let j = 0; j < M; j++) { const x = r0 + (r1 - r0) * (j + .5) / M; area += Math.abs(dd(x)) * (r1 - r0) / M }
    }
    g.restore(); if (rt.length > 1) out.push(`<div>Bounded region area = <b>${F(area)}</b></div>`);
    if (IR.length && rt.length < 2) out.push(`<div style="color:#b42318">Region not closed: the two curves must cross at 2 or more points in view.</div>`);
    else IR.forEach(src => {
      try {
        const t = src.replace(/^\s*(∬|∫∫|∫|int)/i, "").replace(/\s*(d[xy]\s*d[xy]|d[xy]|dA)\s*$/i, ""), fx = mk(t, allVarsXY); let tot = 0;
        for (let i = 0; i + 1 < rt.length; i++) { const r0 = rt[i], r1 = rt[i + 1], M = 600, dx = (r1 - r0) / M; for (let j = 0; j < M; j++) { const x = r0 + (j + .5) * dx, u = f1(x), w = f2(x), lo = Math.min(u, w), hi = Math.max(u, w), K = 150, dy = (hi - lo) / K; let s2 = 0; for (let m = 0; m < K; m++) s2 += fx(x, lo + (m + .5) * dy, ...vValsX); tot += s2 * dy * dx } }
        out.push(`<div>∬ (${esc(t.trim())}) dA over the region = <b>${F(tot)}</b></div>`)
      } catch (e) { out.push(`<div style="color:#b42318">${esc(src)}: ${esc(e.message)}</div>`) }
    });
  }
  if (IR.length && EY.length < 2) out.push(`<div style="color:#b42318">Add two y= curves (like y=x and y=x^3) to define the region for the integral.</div>`);
  const allPts = [], x0 = X(0), x1 = X(W), y0 = Y(H), y1 = Y(0);

  // Find X and Y intercepts for explicit curves (Desmos key points)
  CURVES.forEach(C => {
    if (C.R.ex === "y" && C.R.g) {
      const y0v = C.R.g(0);
      if (isFinite(y0v)) allPts.push([0, y0v]);
      const Smp = Math.max(Math.round(W * 1.5), 600), dx = (x1 - x0) / Smp;
      let px = x0, py = C.R.g(px);
      for (let s = 1; s <= Smp; s++) {
        const cx = x0 + s * dx, cy = C.R.g(cx);
        if (isFinite(py) && isFinite(cy) && ((py < 0 && cy >= 0) || (py > 0 && cy <= 0) || Math.abs(cy) < 1e-11)) {
          let lo = px, hi = cx, dlo = py, dhi = cy;
          for (let it = 0; it < 32; it++) {
            const m = (lo + hi) / 2, my = C.R.g(m);
            if (!isFinite(my)) break;
            if (Math.abs(my) < 1e-10) { lo = hi = m; break; }
            if ((dlo < 0 && my > 0) || (dlo > 0 && my < 0)) { hi = m; dhi = my; } else { lo = m; dlo = my; }
          }
          const rx = (lo + hi) / 2;
          if (isFinite(rx) && Math.abs(C.R.g(rx)) < 0.05) allPts.push([rx, 0]);
        }
        px = cx; py = cy;
      }
    } else if (C.R.ex === "x" && C.R.g) {
      const x0v = C.R.g(0);
      if (isFinite(x0v)) allPts.push([x0v, 0]);
      const Smp = Math.max(Math.round(H * 1.5), 600), dy = (y1 - y0) / Smp;
      let py = y0, px = C.R.g(py);
      for (let s = 1; s <= Smp; s++) {
        const cy = y0 + s * dy, cx = C.R.g(cy);
        if (isFinite(px) && isFinite(cx) && ((px < 0 && cx >= 0) || (px > 0 && cx <= 0) || Math.abs(cx) < 1e-11)) {
          let lo = py, hi = cy, dlo = px, dhi = cx;
          for (let it = 0; it < 32; it++) {
            const m = (lo + hi) / 2, mx = C.R.g(m);
            if (!isFinite(mx)) break;
            if (Math.abs(mx) < 1e-10) { lo = hi = m; break; }
            if ((dlo < 0 && mx > 0) || (dlo > 0 && mx < 0)) { hi = m; dhi = mx; } else { lo = m; dlo = mx; }
          }
          const ry = (lo + hi) / 2;
          if (isFinite(ry) && Math.abs(C.R.g(ry)) < 0.05) allPts.push([0, ry]);
        }
        py = cy; px = cx;
      }
    }
  });

  for (let i = 0; i < CURVES.length; i++) for (let j = i + 1; j < CURVES.length; j++) {
    const C1 = CURVES[i], C2 = CURVES[j], R1 = C1.R, R2 = C2.R;
    if (R1.ex === "y" && R2.ex === "y") {
      const f1 = R1.g, f2 = R2.g, Smp = Math.max(Math.round(W * 1.5), 600), dx = (x1 - x0) / Smp; let px = x0, pd = f1(px) - f2(px);
      for (let s = 1; s <= Smp; s++) {
        const cx = x0 + s * dx, yA = f1(cx), yB = f2(cx); if (!isFinite(yA) || !isFinite(yB)) { px = cx; pd = NaN; continue } const cd = yA - yB;
        if (isFinite(pd) && ((pd < 0 && cd >= 0) || (pd > 0 && cd <= 0) || Math.abs(cd) < 1e-11)) {
          let lo = px, hi = cx, dlo = pd, dhi = cd;
          for (let it = 0; it < 36; it++) { const m = (lo + hi) / 2, m1 = f1(m), m2 = f2(m); if (!isFinite(m1) || !isFinite(m2)) break; const dm = m1 - m2; if (Math.abs(dm) < 1e-10) { lo = hi = m; break } if ((dlo < 0 && dm > 0) || (dlo > 0 && dm < 0)) { hi = m; dhi = dm } else { lo = m; dlo = dm } }
          const root = (lo + hi) / 2, yr = f1(root); if (isFinite(yr) && isFinite(f2(root)) && Math.abs(yr - f2(root)) < .05) allPts.push([root, yr])
        } px = cx; pd = cd
      }
    } else if (R1.ex === "x" && R2.ex === "x") {
      const g1 = R1.g, g2 = R2.g, Smp = Math.max(Math.round(H * 1.5), 600), dy = (y1 - y0) / Smp; let py = y0, pd = g1(py) - g2(py);
      for (let s = 1; s <= Smp; s++) {
        const cy = y0 + s * dy, xA = g1(cy), xB = g2(cy); if (!isFinite(xA) || !isFinite(xB)) { py = cy; pd = NaN; continue } const cd = xA - xB;
        if (isFinite(pd) && ((pd < 0 && cd >= 0) || (pd > 0 && cd <= 0) || Math.abs(cd) < 1e-11)) {
          let lo = py, hi = cy, dlo = pd, dhi = cd;
          for (let it = 0; it < 36; it++) { const m = (lo + hi) / 2, m1 = g1(m), m2 = g2(m); if (!isFinite(m1) || !isFinite(m2)) break; const dm = m1 - m2; if (Math.abs(dm) < 1e-10) { lo = hi = m; break } if ((dlo < 0 && dm > 0) || (dlo > 0 && dm < 0)) { hi = m; dhi = dm } else { lo = m; dlo = dm } }
          const root = (lo + hi) / 2, xr = g1(root); if (isFinite(xr) && isFinite(g2(root)) && Math.abs(xr - g2(root)) < .05) allPts.push([xr, root])
        } py = cy; pd = cd
      }
    } else if ((R1.ex === "y" && R2.ex === "x") || (R1.ex === "x" && R2.ex === "y")) {
      const Cy = R1.ex === "y" ? R1 : R2, Cx = R1.ex === "x" ? R1 : R2, fy = Cy.g, gx = Cx.g, Smp = Math.max(Math.round(W * 1.5), 600), dx = (x1 - x0) / Smp; let px = x0, pd = px - gx(fy(px));
      for (let s = 1; s <= Smp; s++) {
        const cx = x0 + s * dx, cy = fy(cx); if (!isFinite(cy)) { px = cx; pd = NaN; continue } const cd = cx - gx(cy);
        if (isFinite(pd) && isFinite(cd) && ((pd < 0 && cd >= 0) || (pd > 0 && cd <= 0) || Math.abs(cd) < 1e-11)) {
          let lo = px, hi = cx, dlo = pd, dhi = cd;
          for (let it = 0; it < 36; it++) { const m = (lo + hi) / 2, my = fy(m); if (!isFinite(my)) break; const dm = m - gx(my); if (Math.abs(dm) < 1e-10) { lo = hi = m; break } if ((dlo < 0 && dm > 0) || (dlo > 0 && dm < 0)) { hi = m; dhi = dm } else { lo = m; dlo = dm } }
          const root = (lo + hi) / 2, yr = fy(root); if (isFinite(yr) && isFinite(gx(yr)) && Math.abs(root - gx(yr)) < .05) allPts.push([root, yr])
        } px = cx; pd = cd
      }
      const Ny = Math.max(Math.round(H * 1.5), 600), dy = (y1 - y0) / Ny; let py = y0, pdy = py - fy(gx(py));
      for (let s = 1; s <= Ny; s++) {
        const cy = y0 + s * dy, cx = gx(cy); if (!isFinite(cx)) { py = cy; pdy = NaN; continue } const cdy = cy - fy(cx);
        if (isFinite(pdy) && isFinite(cdy) && ((pdy < 0 && cdy >= 0) || (pdy > 0 && cdy <= 0) || Math.abs(cdy) < 1e-11)) {
          let lo = py, hi = cy, dlo = pdy, dhi = cdy;
          for (let it = 0; it < 36; it++) { const m = (lo + hi) / 2, mx = gx(m); if (!isFinite(mx)) break; const dm = m - fy(mx); if (Math.abs(dm) < 1e-10) { lo = hi = m; break } if ((dlo < 0 && dm > 0) || (dlo > 0 && dm < 0)) { hi = m; dhi = dm } else { lo = m; dlo = dm } }
          const root = (lo + hi) / 2, xr = gx(root); if (isFinite(xr) && isFinite(fy(xr)) && Math.abs(root - fy(xr)) < .05) allPts.push([xr, root])
        } py = cy; pdy = cdy
      }
    } else if (R1.ex === "y" || R2.ex === "y") {
      const Ce = R1.ex === "y" ? R1 : R2, Ci = R1.ex === "y" ? R2 : R1, fe = Ce.g, fi = Ci.f, Smp = Math.max(Math.round(W * 1.5), 600), dx = (x1 - x0) / Smp; let px = x0, pd = fi(px, fe(px));
      for (let s = 1; s <= Smp; s++) {
        const cx = x0 + s * dx, cy = fe(cx); if (!isFinite(cy)) { px = cx; pd = NaN; continue } const cd = fi(cx, cy);
        if (isFinite(pd) && isFinite(cd) && ((pd < 0 && cd >= 0) || (pd > 0 && cd <= 0) || Math.abs(cd) < 1e-11)) {
          let lo = px, hi = cx, dlo = pd, dhi = cd;
          for (let it = 0; it < 36; it++) { const m = (lo + hi) / 2, my = fe(m); if (!isFinite(my)) break; const dm = fi(m, my); if (Math.abs(dm) < 1e-10) { lo = hi = m; break } if ((dlo < 0 && dm > 0) || (dlo > 0 && dm < 0)) { hi = m; dhi = dm } else { lo = m; dlo = dm } }
          const root = (lo + hi) / 2, yr = fe(root); if (isFinite(yr) && Math.abs(fi(root, yr)) < .1) allPts.push([root, yr])
        } px = cx; pd = cd
      }
    } else if (R1.ex === "x" || R2.ex === "x") {
      const Ce = R1.ex === "x" ? R1 : R2, Ci = R1.ex === "x" ? R2 : R1, ge = Ce.g, fi = Ci.f, Smp = Math.max(Math.round(H * 1.5), 600), dy = (y1 - y0) / Smp; let py = y0, pd = fi(ge(py), py);
      for (let s = 1; s <= Smp; s++) {
        const cy = y0 + s * dy, cx = ge(cy); if (!isFinite(cx)) { py = cy; pd = NaN; continue } const cd = fi(cx, cy);
        if (isFinite(pd) && isFinite(cd) && ((pd < 0 && cd >= 0) || (pd > 0 && cd <= 0) || Math.abs(cd) < 1e-11)) {
          let lo = py, hi = cy, dlo = pd, dhi = cd;
          for (let it = 0; it < 36; it++) { const m = (lo + hi) / 2, mx = ge(m); if (!isFinite(mx)) break; const dm = fi(mx, m); if (Math.abs(dm) < 1e-10) { lo = hi = m; break } if ((dlo < 0 && dm > 0) || (dlo > 0 && dm < 0)) { hi = m; dhi = dm } else { lo = m; dlo = dm } }
          const root = (lo + hi) / 2, xr = ge(root); if (isFinite(xr) && Math.abs(fi(xr, root)) < .1) allPts.push([xr, root])
        } py = cy; pd = cd
      }
    } else if (C1.segs.length && C2.segs.length) {
      for (const [p1, p2] of C1.segs) for (const [p3, p4] of C2.segs) {
        const denom = (p4[1] - p3[1]) * (p2[0] - p1[0]) - (p4[0] - p3[0]) * (p2[1] - p1[1]);
        if (Math.abs(denom) > 1e-10) {
          const ua = ((p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])) / denom, ub = ((p2[0] - p1[0]) * (p1[1] - p3[1]) - (p2[1] - p1[1]) * (p1[0] - p3[0])) / denom;
          if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) allPts.push([p1[0] + ua * (p2[0] - p1[0]), p1[1] + ua * (p2[1] - p1[1])])
        }
      }
    }
  }
  const uniq = []; allPts.forEach(([x, y]) => { if (!isFinite(x) || !isFinite(y)) return; const sx = PX(x), sy = PY(y); if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return; if (!uniq.some(([ux, uy]) => Math.hypot(PX(ux) - sx, PY(uy) - sy) < 8)) uniq.push([x, y]) });
  uniq.forEach(([x, y]) => {
    const px = PX(x), py = PY(y);
    const isYaxis = Math.abs(x) < 1e-4;
    const isXaxis = Math.abs(y) < 1e-4;
    const dotCol = isYaxis ? "#ef4444" : isXaxis ? "#2563eb" : "#e4572e";
    const haloCol = isYaxis ? "rgba(239, 68, 68, 0.28)" : isXaxis ? "rgba(37, 99, 235, 0.28)" : "rgba(228, 87, 46, 0.22)";
    g.save();
    g.fillStyle = haloCol;
    g.beginPath();
    g.arc(px, py, 11, 0, TAU);
    g.fill();
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(px, py, 5.5, 0, TAU);
    g.fill();
    g.fillStyle = dotCol;
    g.strokeStyle = "#fff";
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(px, py, 4, 0, TAU);
    g.fill();
    g.stroke();
    if (uniq.length <= 15) {
      const txt = "(" + F(x) + ", " + F(y) + ")"; g.font = "bold 12px Inter,sans-serif"; const tw = g.measureText(txt).width, bx = px + 8, by = py - 8;
      g.fillStyle = "rgba(255,255,255,.94)"; g.strokeStyle = "rgba(22,41,59,.18)"; g.lineWidth = 1; g.beginPath();
      if (g.roundRect) g.roundRect(bx - 4, by - 12, tw + 8, 17, 4); else g.rect(bx - 4, by - 12, tw + 8, 17); g.fill(); g.stroke();
      g.fillStyle = "#16293b"; g.fillText(txt, bx, by);
    }
    g.restore()
  });
  if (uniq.length) out.push(`<div><b>Intersections &amp; Intercepts:</b> ${uniq.map(([x, y]) => "(" + F(x) + ", " + F(y) + ")").join(", ")}</div>`);
  $("out").innerHTML = out.join("") + `<div class="dim">Shaded = inequality holds. Dashed edge = strict (&lt; or &gt;). Halos = intercepts &amp; intersections.</div>`
}
const G2 = () => S.mode === "gr" || S.mode === "one" || (S.mode === "cart" && S.dv === "2") || (S.mode === "polar" && S.dv === "2") || (S.mode === "rev" && S.vw === "2") || (S.mode === "tri" && S.tv === "2");
let gq = 0; const qd = () => { if (!gq) gq = requestAnimationFrame(() => { gq = 0; try { S.mode === "gr" ? drawGr() : S.mode === "cart" ? drawCart() : S.mode === "polar" ? drawPolar() : S.mode === "tri" ? drawTri() : S.mode === "one" ? drawOne() : drawRev() } catch (_) { } }) };

function updateLockUI() {
  const isLocked = !!S.lockedView;
  if (c) {
    c.classList.toggle("view-locked", isLocked);
    c.style.touchAction = isLocked ? "pan-y" : "none";
  }
  const btnStage = $("btn-lock-view");
  if (btnStage) {
    btnStage.setAttribute("aria-pressed", isLocked ? "true" : "false");
    btnStage.classList.toggle("locked", isLocked);
    btnStage.title = isLocked ? "Unlock camera view (enable rotation and zoom)" : "Lock camera view (freeze rotation and zoom)";
    const shackle = btnStage.querySelector(".lock-shackle");
    if (shackle) {
      shackle.setAttribute("d", isLocked ? "M8 11V7a4 4 0 0 1 8 0v4" : "M8 11V7a4 4 0 0 1 8 0v1");
    }
  }
}

function toggleLockView() {
  S.lockedView = !S.lockedView;
  updateLockUI();
  update();
}

c.addEventListener("pointerdown", e => {
  if (S.lockedView) return;
  if (is3D()) {
    PT.set(e.pointerId, [e.clientX, e.clientY]);
    drag = [e.clientX, e.clientY];
    c.setPointerCapture(e.pointerId);
    c.classList.add("grabbing");
    return;
  }
  if (!G2()) return;
  PT.set(e.pointerId, [e.clientX, e.clientY]);
  c.setPointerCapture(e.pointerId);
  c.classList.add("grabbing");
});

c.addEventListener("pointermove", e => {
  if (S.lockedView) return;
  if (is3D()) {
    if (PT.has(e.pointerId)) PT.set(e.pointerId, [e.clientX, e.clientY]);
    if (PT.size >= 2) {
      const arr = [...PT.values()];
      const dist = Math.hypot(arr[0][0] - arr[1][0], arr[0][1] - arr[1][1]);
      if (lastPinchDist > 0 && dist > 0) {
        zoom3D = Math.max(0.25, Math.min(6, zoom3D * (dist / lastPinchDist)));
        qd();
      }
      lastPinchDist = dist;
      return;
    }
    if (!drag) return;
    yaw += (e.clientX - drag[0]) * 0.009;
    pit = Math.max(0.04, Math.min(1.53, pit + (e.clientY - drag[1]) * 0.009));
    drag = [e.clientX, e.clientY];
    qd();
    return;
  }
  if (!G2() || !PT.has(e.pointerId)) return;
  const o = PT.get(e.pointerId), n = [e.clientX, e.clientY];
  if (PT.size === 1) { V.cx -= (n[0] - o[0]) / V.s; V.cy -= (n[1] - o[1]) / V.s }
  else if (PT.size === 2) { const q = [...PT].find(([id]) => id !== e.pointerId)[1], d0 = Math.hypot(o[0] - q[0], o[1] - q[1]), d1 = Math.hypot(n[0] - q[0], n[1] - q[1]); if (d0 > 0) V.s = Math.min(1e4, Math.max(1, V.s * d1 / d0)) }
  PT.set(e.pointerId, n); qd()
});

["pointerup", "pointercancel"].forEach(t => c.addEventListener(t, e => {
  c.classList.remove("grabbing");
  PT.delete(e.pointerId);
  if (PT.size < 2) lastPinchDist = 0;
  if (PT.size === 0) drag = null;
}));

c.addEventListener("wheel", e => {
  if (S.lockedView) return;
  if (is3D()) {
    e.preventDefault();
    zoom3D = Math.max(0.25, Math.min(6, zoom3D * Math.exp(-e.deltaY * 0.0015)));
    qd();
    return;
  }
  if (!G2()) return;
  e.preventDefault();
  const r = c.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, wx = (mx - W / 2) / V.s + V.cx, wy = V.cy - (my - H / 2) / V.s;
  V.s = Math.min(1e4, Math.max(1, V.s * Math.exp(-e.deltaY * .0015)));
  V.cx = wx - (mx - W / 2) / V.s;
  V.cy = wy + (my - H / 2) / V.s;
  qd();
}, { passive: false });

c.addEventListener("dblclick", () => {
  if (S.lockedView) return;
  if (is3D()) {
    reset3DView();
    qd();
  } else if (G2()) {
    resetV();
    qd();
  }
});

panel.addEventListener("click", e => {
  if (S.mode !== "gr") return;
  const t = e.target;
  const curveDotBtn = t.closest(".desmos-icon-badge.curve");
  if (curveDotBtn) {
    const idx = +curveDotBtn.dataset.i;
    if (!isNaN(idx) && idx >= 0 && idx < S.eq.length) {
      if (!S.hiddenEq) S.hiddenEq = {};
      const isHidden = !S.hiddenEq[idx];
      S.hiddenEq[idx] = isHidden;
      const col = PAL[idx % PAL.length];
      curveDotBtn.classList.toggle("hidden-curve", isHidden);
      curveDotBtn.title = isHidden ? "Click to show graph" : "Click to hide graph";
      curveDotBtn.setAttribute("aria-label", (isHidden ? "Show" : "Hide") + " graph for equation " + (idx + 1));
      const card = curveDotBtn.closest(".desmos-card");
      if (card) card.classList.toggle("is-hidden", isHidden);
      if (isHidden) {
        curveDotBtn.style.background = "transparent";
        curveDotBtn.style.border = `2.5px solid ${col}`;
        const path = curveDotBtn.querySelector("svg path");
        if (path) path.setAttribute("stroke", col);
        const svg = curveDotBtn.querySelector("svg");
        if (svg) svg.style.opacity = "0.45";
      } else {
        curveDotBtn.style.background = col;
        curveDotBtn.style.border = "none";
        const path = curveDotBtn.querySelector("svg path");
        if (path) path.setAttribute("stroke", "#ffffff");
        const svg = curveDotBtn.querySelector("svg");
        if (svg) svg.style.opacity = "1";
      }
      drawGr();
    }
    return;
  }
  const addSliderBtn = t.closest(".btn-add-slider");
  if (addSliderBtn) {
    const v = addSliderBtn.dataset.var;
    if (v && !S.eq.some(q => new RegExp(`^\\s*${v}\\s*=`, "i").test(q))) {
      S.eq.push(`${v} = 1`);
    }
    eqRows();
    update();
    return;
  }
  const addAllBtn = t.closest(".btn-add-slider-all");
  if (addAllBtn) {
    const vars = (addAllBtn.dataset.vars || "").split(",");
    vars.forEach(v => {
      v = v.trim();
      if (v && !S.eq.some(q => new RegExp(`^\\s*${v}\\s*=`, "i").test(q))) {
        S.eq.push(`${v} = 1`);
      }
    });
    eqRows();
    update();
    return;
  }
  const playBtn = t.closest(".slider-play-btn");
  if (playBtn) {
    const v = playBtn.dataset.var;
    if (v && S.sliderMeta && S.sliderMeta[v]) {
      const meta = S.sliderMeta[v];
      meta.playing = !meta.playing;
      playBtn.classList.toggle("playing", meta.playing);
      playBtn.innerHTML = meta.playing
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4.5" height="16" rx="1.5"/><rect x="14.5" y="4" width="4.5" height="16" rx="1.5"/></svg>`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>`;
      if (meta.playing && !sliderAnimId) {
        sliderAnimId = requestAnimationFrame(tickSliders);
      }
    }
    return;
  }
  const loopBtn = t.closest(".slider-loop-btn");
  if (loopBtn) {
    const v = loopBtn.dataset.var;
    if (v && S.sliderMeta && S.sliderMeta[v]) {
      const meta = S.sliderMeta[v];
      meta.loop = meta.loop === "loop" ? "bounce" : "loop";
      loopBtn.textContent = meta.loop === "loop" ? "→" : "⇄";
      loopBtn.title = "Animation loop mode: " + meta.loop;
    }
    return;
  }
  if (t.id === "addeq") {
    eqNow();
    S.eq.push("");
    eqRows();
    const lastInp = $("e" + (S.eq.length - 1));
    if (lastInp) lastInp.focus();
    return;
  }
  if (t.id === "rst") {
    resetV();
    update();
    return;
  }
  const delBtn = t.closest(".desmos-btn-delete") || (t.classList.contains("seg-x") ? t : null);
  if (delBtn) {
    const idx = +delBtn.dataset.i;
    S.eq.splice(idx, 1);
    if (S.hiddenEq) {
      delete S.hiddenEq[idx];
      const newHidden = {};
      Object.keys(S.hiddenEq).forEach(k => {
        const ki = +k;
        if (ki > idx) newHidden[ki - 1] = S.hiddenEq[ki];
        else if (ki < idx) newHidden[ki] = S.hiddenEq[ki];
      });
      S.hiddenEq = newHidden;
    }
    eqRows();
    update();
    return;
  }
});
const viewField = (id, b1, b2, l1 = "3D solid", l2 = "2D region") => `<div class="field"><label>View</label><div class="seg" id="${id}"><button type="button" data-v="${b1}">${l1}</button><button type="button" data-v="${b2}">${l2}</button></div></div>`;

function build(activeIdx = 0) {
  cancelAnimationFrame(raf);
  cancelSliderAnim();
  V.k2 = "";
  document.querySelectorAll("#tabs button").forEach(b => {
    const isAct = b.dataset.v === S.mode;
    b.setAttribute("aria-pressed", isAct ? "true" : "false");
    b.setAttribute("aria-selected", isAct ? "true" : "false");
  });
  if (S.mode === "gr") {
    c.style.touchAction = "none";
    resetV();
    panel.innerHTML = `<div id="eqs"></div><div class="two" style="grid-template-columns:1fr 1fr;gap:8px"><button type="button" class="btn" id="addeq">+ Equation</button><button type="button" class="btn" id="rst" style="background:var(--bg);color:var(--ink);border-color:var(--line)">Reset view</button></div><div class="hint" style="margin-top:10px">Type any equation or relation (e.g. y=mx+b, x=2ab). Undefined parameters will prompt slider creation automatically. Drag to pan, pinch or scroll to zoom.</div>`;
    eqRows();
    update();
    return;
  }
  c.style.touchAction = "none";
  const list0 = getList();
  const selItem = list0[activeIdx] || list0[0];
  if (S.mode === "one") { panel.innerHTML = `<div class="field"><label>Quick examples</label>${pills(list0, activeIdx)}</div>${row("x from … to  (a, b)", 1, "0", "2")}${row("Top f(x)  and  bottom g(x)", 3, "x^2", "0")}<div class="field"><label>Sum type</label><div class="seg" id="mt"><button type="button" data-v="left">Left</button><button type="button" data-v="mid">Mid</button><button type="button" data-v="right">Right</button><button type="button" data-v="trap">Trap</button></div></div><div class="field"><div class="slider-header"><label for="n">Pieces</label><span class="slider-val" id="nv">10</span></div><input type="range" id="n" min="1" max="60" value="10"></div><div class="hint">Type f(x) as the top curve and g(x) as the bottom curve (use 0 for the x-axis). Drag to pan, pinch or scroll to zoom.</div>`; update(); return }
  const sl = t => `<div class="field"><div class="slider-header"><label for="n">${t}</label><span class="slider-val" id="nv">14</span></div><input type="range" id="n" min="3" max="40" value="14"></div>`;
  panel.innerHTML = S.mode === "polar" ? `<div class="field"><label>Quick examples</label>${pills(list0, activeIdx)}</div><div id="cf">${cfP()}</div>${viewField("dv", "3", "2")}${sl("Wedges")}`
    : S.mode === "tri" ? `<div class="field"><label>Coordinate system</label><div class="seg" id="sys"><button type="button" data-v="cart">Cartesian</button><button type="button" data-v="cyl">Cylindrical</button><button type="button" data-v="sph">Spherical</button></div></div><div class="field"><label>Quick examples</label>${pills(list0, activeIdx)}</div><div id="cf">${fld(S.sys === "cyl" ? "f(r, θ, z) [use t for θ]" : S.sys === "sph" ? "f(ρ, θ, φ) [use p for ρ, t for θ, phi for φ]" : "f(x, y, z)", "c0", S.fxyz || "1", "e.g. 1, x+y+z, x^2+y^2+z^2") + cf3()}</div>${viewField("tv", "3", "2", "3D solid", "2D projection")}<div class="field" id="pl-field"${S.tv === "2" ? "" : ' style="display:none"'}><label>Projection plane</label><div class="seg" id="pl"><button type="button" data-v="xy">xy</button><button type="button" data-v="xz">xz</button><button type="button" data-v="yz">yz</button></div></div>`
      : S.mode === "rev" ? `<div class="field"><label>Quick examples</label>${pills(list0, activeIdx)}</div><div id="cf">${cfR()}</div><div class="field"><label>Revolve about</label><div class="seg" id="ax"><button type="button" data-v="x">x-axis</button><button type="button" data-v="y">y-axis</button></div></div><div class="field"><div class="slider-header"><label for="ang">Sweep angle</label><span class="slider-val" id="angv">0°</span></div><input type="range" id="ang" min="0" max="360" value="0"></div>${viewField("vw", "3", "2", "3D solid", "2D graph")}<button type="button" class="btn" id="play">Play revolution</button>`
        : `<div class="field"><label>Quick examples</label>${pills(list0, activeIdx)}</div><div id="cf">${cfC()}</div>${viewField("dv", "3", "2")}<div class="field"><label>Order of integration</label><div class="seg" id="ord"><button type="button" data-v="I">dy dx</button><button type="button" data-v="II">dx dy</button></div></div>${sl("Strips")}`;
  if (selItem && selItem.v) selItem.v.forEach((v, i) => { const el = $("c" + (i + 1)); if (el) el.value = v });
  if ($("c0")) $("c0").value = S.mode === "cart" ? (S.fxy !== undefined ? S.fxy : "1") : S.mode === "polar" ? (S.frt !== undefined ? S.frt : "1") : (S.fxyz !== undefined ? S.fxyz : "1");
  if (selItem && selItem.ax) S.ax = selItem.ax;
  update()
}
function update() {
  if ($("nv") && $("n")) $("nv").textContent = $("n").value;
  panel.querySelectorAll(".seg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === (b.parentElement.id === "ord" ? S.ord : b.parentElement.id === "ax" ? S.ax : b.parentElement.id === "vw" ? S.vw : b.parentElement.id === "dv" ? S.dv : b.parentElement.id === "mt" ? S.mt : b.parentElement.id === "sys" ? S.sys : b.parentElement.id === "tv" ? S.tv : b.parentElement.id === "pl" ? S.pl : S.mode)));
  const ov = $("stage-overlay");
  if (ov) ov.hidden = false;
  const badge = $("stage-mode-badge");
  if (badge) {
    if (S.mode === "cart") badge.textContent = S.dv === "2" ? "2D Region" : "3D Surface";
    else if (S.mode === "polar") badge.textContent = S.dv === "2" ? "2D Polar" : "3D Polar";
    else if (S.mode === "tri") badge.textContent = S.tv === "2" ? `${S.pl.toUpperCase()} Proj` : "3D Solid";
    else if (S.mode === "rev") badge.textContent = S.vw === "2" ? "2D Slice" : "Revolve 3D";
    else if (S.mode === "gr") badge.textContent = "2D Curves";
    else badge.textContent = "Visualizer";
  }
  updateLockUI();
  try { if (S.mode === "cart") drawCart(); else if (S.mode === "polar") drawPolar(); else if (S.mode === "tri") drawTri(); else if (S.mode === "rev") drawRev(); else if (S.mode === "gr") drawGr(); else if (S.mode === "one") drawOne(); } catch (e) { $("out").innerHTML = `<div style="color:#b42318">${esc(e.message)}</div>` }
}
panel.addEventListener("click", e => {
  if (e.target.id === "play") { play(); return }
  if (e.target.classList.contains("del-pill")) {
    e.stopPropagation();
    const delIdx = +e.target.dataset.del;
    const baseLen = S.mode === "cart" ? CR.length : S.mode === "polar" ? PR.length : S.mode === "tri" ? (CT[S.sys] || []).length : S.mode === "rev" ? EX.length : 5;
    delCustom(S.mode, delIdx - baseLen);
    build(0);
    return;
  }
  const pill = e.target.closest(".pill");
  if (pill) {
    const idx = +pill.dataset.i;
    pill.parentElement.querySelectorAll(".pill").forEach(p => p.setAttribute("aria-pressed", p === pill));
    const item = getList()[idx];
    if (item && item.v) {
      item.v.forEach((v, i) => { const el = $("c" + (i + 1)); if (el) el.value = v });
      if (item.ax) S.ax = item.ax;
    }
    if (S.mode === "rev" && $("ang")) {
      $("ang").value = 0;
      if ($("angv")) $("angv").textContent = "0°";
    }
    update();
    return;
  }
  const b = e.target.closest(".seg button"); if (!b) return;
  if (b.parentElement.id === "ord") S.ord = b.dataset.v;
  else if (b.parentElement.id === "ax") S.ax = b.dataset.v;
  else if (b.parentElement.id === "mt") S.mt = b.dataset.v;
  else if (b.parentElement.id === "vw") { S.vw = b.dataset.v; V.k2 = "" }
  else if (b.parentElement.id === "dv") { S.dv = b.dataset.v; V.k2 = "" }
  else if (b.parentElement.id === "sys") { S.sys = b.dataset.v; info = {}; build(0); return }
  else if (b.parentElement.id === "tv") {
    S.tv = b.dataset.v;
    V.k2 = "";
    const plField = $("pl-field");
    if (plField) plField.style.display = S.tv === "2" ? "" : "none";
  }
  else if (b.parentElement.id === "pl") {
    S.pl = b.dataset.v;
    V.k2 = "";
  }
  update()
});
panel.addEventListener("input", e => {
  if (e.target.id === "c0") {
    if (S.mode === "cart") S.fxy = e.target.value;
    else if (S.mode === "polar") S.frt = e.target.value;
    else if (S.mode === "tri") S.fxyz = e.target.value;
  }
  if (/^c[0-6]$/.test(e.target.id)) {
    panel.querySelectorAll(".pill").forEach(p => p.setAttribute("aria-pressed", "false"));
  }
  if (S.mode === "gr") {
    if (e.target.classList.contains("desmos-slider-range")) {
      const v = e.target.dataset.var;
      const idx = +e.target.dataset.i;
      const val = parseFloat(e.target.value);
      if (v && S.sliderMeta && S.sliderMeta[v]) {
        S.sliderMeta[v].val = val;
        S.eq[idx] = `${v} = ${val}`;
        const valInput = panel.querySelector(`.slider-num-val[data-var="${v}"]`);
        if (valInput) valInput.value = val;
        drawGr();
      }
      return;
    }
    if (e.target.classList.contains("slider-num-val")) {
      const v = e.target.dataset.var;
      const idx = +e.target.dataset.i;
      const val = parseFloat(e.target.value);
      if (v && isFinite(val) && S.sliderMeta && S.sliderMeta[v]) {
        S.sliderMeta[v].val = val;
        S.eq[idx] = `${v} = ${val}`;
        const range = panel.querySelector(`.desmos-slider-range[data-var="${v}"]`);
        if (range) range.value = val;
        drawGr();
      }
      return;
    }
    if (e.target.classList.contains("slider-min")) {
      const v = e.target.dataset.var;
      const val = parseFloat(e.target.value);
      if (v && isFinite(val) && S.sliderMeta && S.sliderMeta[v]) {
        S.sliderMeta[v].min = val;
        const range = panel.querySelector(`.desmos-slider-range[data-var="${v}"]`);
        if (range) range.min = val;
      }
      return;
    }
    if (e.target.classList.contains("slider-max")) {
      const v = e.target.dataset.var;
      const val = parseFloat(e.target.value);
      if (v && isFinite(val) && S.sliderMeta && S.sliderMeta[v]) {
        S.sliderMeta[v].max = val;
        const range = panel.querySelector(`.desmos-slider-range[data-var="${v}"]`);
        if (range) range.max = val;
      }
      return;
    }
    if (e.target.classList.contains("desmos-eq-input") || e.target.classList.contains("eq")) {
      const idx = +e.target.dataset.i;
      S.eq[idx] = e.target.value;
      const card = e.target.closest(".desmos-card");
      if (card) {
        const definedVars = getDefinedVars();
        const unparams = getUndefinedParams(e.target.value, definedVars);
        card.classList.toggle("has-warning", unparams.length > 0);
        const iconBadge = card.querySelector(".desmos-icon-badge");
        let sliderBox = card.querySelector(".add-slider-box");
        let evalBadge = card.querySelector(".desmos-eval-badge");
        if (unparams.length > 0) {
          if (evalBadge) evalBadge.remove();
          if (iconBadge) {
            iconBadge.className = "desmos-icon-badge warning";
            iconBadge.title = "Undefined parameters: " + unparams.join(", ");
            iconBadge.style.background = "";
            iconBadge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
          }
          const boxHtml = `<span class="add-slider-label">add slider:</span>${unparams.map(p => `<button type="button" class="btn-add-slider" data-var="${p}"><i>${p}</i></button>`).join(" ")}${unparams.length > 1 ? `<button type="button" class="btn-add-slider-all" data-vars="${unparams.join(",")}">all</button>` : ""}`;
          if (!sliderBox) {
            sliderBox = document.createElement("div");
            sliderBox.className = "add-slider-box";
            sliderBox.dataset.i = idx;
            card.appendChild(sliderBox);
          }
          sliderBox.innerHTML = boxHtml;
        } else {
          if (sliderBox) sliderBox.remove();
          if (iconBadge) {
            const col = PAL[idx % PAL.length];
            const isHidden = !!(S.hiddenEq && S.hiddenEq[idx]);
            iconBadge.className = "desmos-icon-badge curve" + (isHidden ? " hidden-curve" : "");
            iconBadge.dataset.i = idx;
            iconBadge.title = isHidden ? "Click to show graph" : "Click to hide graph";
            iconBadge.setAttribute("aria-label", (isHidden ? "Show" : "Hide") + " graph for equation " + (idx + 1));
            if (isHidden) {
              iconBadge.style.background = "transparent";
              iconBadge.style.border = `2.5px solid ${col}`;
              iconBadge.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="2.8" stroke-linecap="round" style="opacity:0.45;"><path d="M4 14c3-6 5-6 8 0s5 6 8 0"/></svg>`;
            } else {
              iconBadge.style.background = col;
              iconBadge.style.border = "none";
              iconBadge.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"><path d="M4 14c3-6 5-6 8 0s5 6 8 0"/></svg>`;
            }
          }
          try {
            const rObj = rel(e.target.value, definedVars);
            if (rObj && rObj.evalConst !== null && rObj.evalConst !== undefined) {
              if (!evalBadge) {
                evalBadge = document.createElement("span");
                evalBadge.className = "desmos-eval-badge";
                e.target.insertAdjacentElement("afterend", evalBadge);
              }
              evalBadge.textContent = `= ${rObj.evalConst}`;
              evalBadge.title = "Calculated value";
            } else if (evalBadge) {
              evalBadge.remove();
            }
          } catch (_) {
            if (evalBadge) evalBadge.remove();
          }
        }
      }
      drawGr();
      return;
    }
  }
});
panel.addEventListener("input", update);
const VALID_MODES = ["cart", "polar", "tri", "rev", "gr", "one"];
function switchTab(mode, push = true) {
  if (!VALID_MODES.includes(mode)) mode = "cart";
  if (S.mode === mode) return;
  cancelSliderAnim();
  S.mode = mode;
  if (S.mode === "rev") S.vw = "3";
  if (push) {
    try { history.pushState({ mode: S.mode }, "", "#" + S.mode); } catch (_) { }
  }
  build();
}
$("tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (b && b.dataset.v) switchTab(b.dataset.v, true) });
let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { size(); update() }, 80) });
const KP = { mode: "math", shift: false, funcsOpen: false, sound: false, native: false };
const kp = $("kp");
let lastIn = null;
let audioCtx = null;

function playClick(freq = 600) {
  if (!KP.sound) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + 0.035);
    g.gain.setValueAtTime(0.04, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.035);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.035);
  } catch (_) {}
}

const ICON_BS = '<svg width="22" height="15" viewBox="0 0 24 16" fill="currentColor"><path d="M7 1h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-1.41-.59L.29 9.12a1.6 1.6 0 0 1 0-2.24l5.3-5.29A2 2 0 0 1 7 1zm7 3.59L11.59 7 14 9.41 12.59 10.82 10.18 8.41 7.77 10.82 6.36 9.41 8.77 7 6.36 4.59 7.77 3.18l2.41 2.41 2.41-2.41L14 4.59z"/></svg>';
const ICON_ENTER = '<svg width="20" height="16" viewBox="0 0 24 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 3v7a4 4 0 0 1-4 4H4"/><polyline points="9 9 4 14 9 19"/></svg>';
const ICON_LEFT = '<svg width="18" height="14" viewBox="0 0 24 16" fill="currentColor"><path d="M22 7H5.41l4.3-4.29L8.29 1.29.59 9l7.7 7.71 1.42-1.42-4.3-4.29H22V7z"/></svg>';
const ICON_RIGHT = '<svg width="18" height="14" viewBox="0 0 24 16" fill="currentColor"><path d="M2 9h16.59l-4.3 4.29 1.42 1.42 7.7-7.71-7.7-7.71-1.42 1.42 4.3 4.29H2V9z"/></svg>';
const ICON_AUDIO = '<svg width="18" height="16" viewBox="0 0 24 20" fill="currentColor"><path d="M3 8v8h4l5 4V4L7 8H3zm13.5 4c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 2.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
const ICON_SHIFT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l8 9h-5v9h-6v-9H4z"/></svg>';

function getMathRows() {
  return [
    [
      { h: "<i>x</i>", v: "x", c: "k-math" },
      { h: "<i>y</i>", v: "y", c: "k-math" },
      { h: "<i>a</i><sup>2</sup>", v: "^2", c: "k-math" },
      { h: "<i>a</i><sup><i>b</i></sup>", v: "^", c: "k-math" },
      { h: "7", v: "7", c: "k-num" },
      { h: "8", v: "8", c: "k-num" },
      { h: "9", v: "9", c: "k-num" },
      { h: "÷", v: "/", c: "k-tool" },
      { h: "funcs", c: "k-funcs k-span2" + (KP.funcsOpen ? " active" : ""), act: "funcs" }
    ],
    [
      { h: "(", v: "(", c: "k-tool" },
      { h: ")", v: ")", c: "k-tool" },
      { h: "&lt;", v: "<", c: "k-tool" },
      { h: "&gt;", v: ">", c: "k-tool" },
      { h: "4", v: "4", c: "k-num" },
      { h: "5", v: "5", c: "k-num" },
      { h: "6", v: "6", c: "k-num" },
      { h: "×", v: "*", c: "k-tool" },
      { h: ICON_LEFT, c: "k-nav", act: "L" },
      { h: ICON_RIGHT, c: "k-nav", act: "R" }
    ],
    [
      { h: "|<i>a</i>|", v: "abs()", o: 1, c: "k-math" },
      { h: ",", v: ",", c: "k-tool" },
      { h: "≤", v: "<=", c: "k-tool" },
      { h: "≥", v: ">=", c: "k-tool" },
      { h: "1", v: "1", c: "k-num" },
      { h: "2", v: "2", c: "k-num" },
      { h: "3", v: "3", c: "k-num" },
      { h: "−", v: "-", c: "k-tool" },
      { h: ICON_BS, c: "k-bs k-span2", act: "bs" }
    ],
    [
      { h: "ABC", c: "k-mode", act: "abc" },
      { h: "<i>e</i>", v: "e", c: "k-math" },
      { h: "√", v: "sqrt()", o: 1, c: "k-tool" },
      { h: "<i>π</i>", v: "pi", c: "k-math" },
      { h: "0", v: "0", c: "k-num" },
      { h: ".", v: ".", c: "k-num" },
      { h: "=", v: "=", c: "k-tool" },
      { h: "+", v: "+", c: "k-tool" },
      { h: ICON_ENTER, c: "k-enter k-span2", act: "enter" }
    ]
  ];
}

function getAbcRows() {
  const letters1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
  const letters2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l", "θ"];
  const letters3 = ["z", "x", "c", "v", "b", "n", "m"];
  return [
    letters1.map(ch => {
      const l = KP.shift ? ch.toUpperCase() : ch;
      return { h: "<i>" + l + "</i>", v: l, c: "k-letter" };
    }),
    letters2.map(ch => {
      if (ch === "θ") return { h: "<i>θ</i>", v: "θ", c: "k-letter" };
      const l = KP.shift ? ch.toUpperCase() : ch;
      return { h: "<i>" + l + "</i>", v: l, c: "k-letter" };
    }),
    [
      { h: ICON_SHIFT, c: "k-shift k-span1-5" + (KP.shift ? " active" : ""), act: "shift" },
      ...letters3.map(ch => {
        const l = KP.shift ? ch.toUpperCase() : ch;
        return { h: "<i>" + l + "</i>", v: l, c: "k-letter" };
      }),
      { h: ICON_BS, c: "k-bs k-span1-5", act: "bs" }
    ],
    [
      { h: "1 2 3", c: "k-mode k-span1-5", act: "123" },
      { h: "<i>a</i><sub><i>b</i></sub>", v: "_", c: "k-tool" },
      { h: "! <sup>%</sup>", v: "!", c: "k-tool" },
      { h: "[ ]", v: "[]", o: 1, c: "k-tool" },
      { h: "{ }", v: "{}", o: 1, c: "k-tool" },
      { h: "~ <sup>:</sup>", v: ":", c: "k-tool" },
      { h: ", <sup>'</sup>", v: ",", c: "k-tool" },
      { h: ICON_ENTER, c: "k-enter k-span1-5", act: "enter" }
    ]
  ];
}

function renderKp() {
  let popHtml = "";
  if (KP.funcsOpen) {
    popHtml = `
      <div class="kp-popover" role="dialog" aria-label="Functions menu">
        <div class="kp-popover-arrow"></div>
        <div class="kp-pop-sec">
          <div class="kp-pop-title">TRIG FUNCTIONS</div>
          <div class="kp-pop-grid">
            <button type="button" data-fn="sin">sin</button>
            <button type="button" data-fn="cos">cos</button>
            <button type="button" data-fn="tan">tan</button>
            <button type="button" data-fn="csc">csc</button>
            <button type="button" data-fn="sec">sec</button>
            <button type="button" data-fn="cot">cot</button>
          </div>
        </div>
        <div class="kp-pop-sec">
          <div class="kp-pop-title">HYPERBOLIC FUNCTIONS</div>
          <div class="kp-pop-grid">
            <button type="button" data-fn="sinh">sinh</button>
            <button type="button" data-fn="cosh">cosh</button>
            <button type="button" data-fn="tanh">tanh</button>
            <button type="button" data-fn="csch">csch</button>
            <button type="button" data-fn="sech">sech</button>
            <button type="button" data-fn="coth">coth</button>
          </div>
        </div>
        <div class="kp-pop-sec">
          <div class="kp-pop-title">INVERSE TRIG FUNCTIONS</div>
          <div class="kp-pop-grid">
            <button type="button" data-fn="asin">sin<sup>-1</sup></button>
            <button type="button" data-fn="acos">cos<sup>-1</sup></button>
            <button type="button" data-fn="atan">tan<sup>-1</sup></button>
            <button type="button" data-fn="acsc">csc<sup>-1</sup></button>
            <button type="button" data-fn="asec">sec<sup>-1</sup></button>
            <button type="button" data-fn="acot">cot<sup>-1</sup></button>
          </div>
        </div>
        <div class="kp-pop-sec">
          <div class="kp-pop-title">CALCULUS</div>
          <div class="kp-pop-grid">
            <button type="button" data-fn="exp">exp</button>
            <button type="button" data-fn="ln">ln</button>
            <button type="button" data-fn="log10">log</button>
            <button type="button" data-fn="logb" data-args="(,)" data-off="2">log<sub><i>a</i></sub></button>
            <button type="button" data-ins="d/dx "><span style="display:inline-flex;flex-direction:column;align-items:center;line-height:1;font-size:12px;font-style:italic"><span style="border-bottom:1px solid currentColor;padding-bottom:1px">d</span><span style="padding-top:1px">dx</span></span></button>
            <button type="button" data-ins="'" data-off="0"><i>f '</i></button>
            <button type="button" data-ins="∫">∫</button>
            <button type="button" data-ins="sum(" data-off="0">∑</button>
            <button type="button" data-ins="prod(" data-off="0">∏</button>
            <button type="button" data-ins="∬ ">∬</button>
            <button type="button" data-ins="^2"><i>x</i>²</button>
            <button type="button" data-ins="1/(" data-off="0">1/<i>x</i></button>
          </div>
        </div>
        <div class="kp-pop-sec">
          <div class="kp-pop-title">STATISTICS</div>
          <div class="kp-pop-grid">
            <button type="button" data-fn="mean">mean</button>
            <button type="button" data-fn="median">median</button>
            <button type="button" data-fn="min" data-args="(,)" data-off="2">min</button>
            <button type="button" data-fn="max" data-args="(,)" data-off="2">max</button>
            <button type="button" data-fn="quartile" data-args="(,)" data-off="2">quartile</button>
            <button type="button" data-fn="quantile" data-args="(,)" data-off="2">quantile</button>
            <button type="button" data-fn="stdev">stdev</button>
            <button type="button" data-fn="stdevp">stdevp</button>
            <button type="button" data-fn="var">var</button>
            <button type="button" data-fn="varp">varp</button>
            <button type="button" data-fn="cov" data-args="(,)" data-off="2">cov</button>
            <button type="button" data-fn="covp" data-args="(,)" data-off="2">covp</button>
            <button type="button" data-fn="mad">mad</button>
            <button type="button" data-fn="corr" data-args="(,)" data-off="2">corr</button>
            <button type="button" data-fn="spearman" data-args="(,)" data-off="2">spearman</button>
            <button type="button" data-fn="stats">stats</button>
            <button type="button" data-fn="count">count</button>
            <button type="button" data-fn="total">total</button>
          </div>
        </div>
        <div class="kp-pop-sec">
          <div class="kp-pop-title">GRAPHING &amp; HYPERBOLIC</div>
          <div class="kp-pop-grid">
            <button type="button" data-fn="sinh">sinh</button>
            <button type="button" data-fn="cosh">cosh</button>
            <button type="button" data-fn="tanh">tanh</button>
            <button type="button" data-fn="abs">abs</button>
            <button type="button" data-fn="cbrt">∛</button>
            <button type="button" data-fn="sign">sign</button>
            <button type="button" data-fn="floor">floor</button>
            <button type="button" data-fn="ceil">ceil</button>
            <button type="button" data-fn="round">round</button>
          </div>
        </div>
      </div>
    `;
  }

  const rows = KP.mode === "abc" ? getAbcRows() : getMathRows();
  let rowsHtml = '<div class="kp-rows">';
  rows.forEach(row => {
    rowsHtml += '<div class="kp-row">';
    row.forEach(k => {
      const cls = k.c || "";
      const act = k.act ? ` data-act="${k.act}"` : "";
      const val = k.v ? ` data-val="${esc(k.v)}"` : "";
      const off = k.o ? ` data-off="${k.o}"` : "";
      rowsHtml += `<button type="button" class="${cls}"${act}${val}${off}>${k.h}</button>`;
    });
    rowsHtml += '</div>';
  });
  rowsHtml += '</div>';

  kp.innerHTML = popHtml + rowsHtml;
  if (!kp.hidden) document.body.style.paddingBottom = kp.offsetHeight + "px";
}

let kpActive = false;
function showKp() {
  if (kp.hidden) {
    kp.hidden = false;
    document.body.style.paddingBottom = kp.offsetHeight + "px";
    if (!kpActive) {
      kpActive = true;
      try { history.pushState({ mode: S.mode, kp: true }, ""); } catch (_) { }
    }
  }
}
function hideKp() {
  if (!kp.hidden) {
    kp.hidden = true;
    KP.funcsOpen = false;
    document.body.style.paddingBottom = "";
    if (kpActive) {
      kpActive = false;
      try { history.back(); } catch (_) { }
    }
  }
}

function kpInsert(text, offset = 0) {
  const i = lastIn;
  if (!i) return;
  const s = i.selectionStart == null ? i.value.length : i.selectionStart;
  const e = i.selectionEnd == null ? s : i.selectionEnd;
  i.setRangeText(text, s, e, "end");
  if (offset > 0) {
    const p = Math.max(0, i.selectionStart - offset);
    i.setSelectionRange(p, p);
  }
  i.dispatchEvent(new Event("input", { bubbles: true }));
  playClick(620);
}

function kpHandleButton(b) {
  const act = b.dataset.act;
  const val = b.dataset.val;
  const off = b.dataset.off ? +b.dataset.off : 0;
  const fn = b.dataset.fn;
  const ins = b.dataset.ins;

  if (fn) {
    const fnOff = b.dataset.off ? +b.dataset.off : 1;
    const args = b.dataset.args || "()";
    kpInsert(fn + args, fnOff);
    KP.funcsOpen = false;
    renderKp();
    return;
  }
  if (ins) {
    const insOff = b.dataset.off ? +b.dataset.off : 0;
    kpInsert(ins, insOff);
    KP.funcsOpen = false;
    renderKp();
  }
  if (act) {
    if (act === "funcs") {
      KP.funcsOpen = !KP.funcsOpen;
      playClick(500);
      renderKp();
      return;
    }
    if (act === "abc") {
      KP.mode = "abc";
      KP.funcsOpen = false;
      playClick(500);
      renderKp();
      return;
    }
    if (act === "123") {
      KP.mode = "math";
      KP.funcsOpen = false;
      playClick(500);
      renderKp();
      return;
    }
    if (act === "shift") {
      KP.shift = !KP.shift;
      playClick(550);
      renderKp();
      return;
    }
    if (act === "audio") {
      KP.sound = !KP.sound;
      playClick(KP.sound ? 880 : 300);
      if (KP.sound && lastIn && lastIn.value && "speechSynthesis" in window) {
        try {
          const u = new SpeechSynthesisUtterance(lastIn.value);
          u.rate = 1.1;
          window.speechSynthesis.speak(u);
        } catch (_) {}
      }
      renderKp();
      return;
    }
    if (act === "bs") {
      const i = lastIn;
      if (!i) return;
      let s = i.selectionStart == null ? i.value.length : i.selectionStart;
      let e = i.selectionEnd == null ? s : i.selectionEnd;
      if (s !== e) {
        i.setRangeText("", s, e, "end");
      } else if (s > 0) {
        i.setRangeText("", s - 1, s, "end");
      }
      i.dispatchEvent(new Event("input", { bubbles: true }));
      playClick(380);
      return;
    }
    if (act === "L") {
      const i = lastIn;
      if (!i) return;
      const p = Math.max(0, (i.selectionStart ?? i.value.length) - 1);
      i.setSelectionRange(p, p);
      playClick(450);
      return;
    }
    if (act === "R") {
      const i = lastIn;
      if (!i) return;
      const p = Math.min(i.value.length, (i.selectionEnd ?? i.value.length) + 1);
      i.setSelectionRange(p, p);
      playClick(450);
      return;
    }
    if (act === "enter") {
      playClick(800);
      const inputs = Array.from(panel.querySelectorAll("input[type='text'], input:not([type])"));
      const idx = inputs.indexOf(lastIn);
      if (idx !== -1 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      } else {
        if (lastIn) {
          lastIn.dispatchEvent(new Event("change", { bubbles: true }));
          lastIn.blur();
        }
        hideKp();
      }
      return;
    }
  }

  if (val != null) {
    kpInsert(val, off);
    if (KP.shift && KP.mode === "abc" && /^[A-Z]$/.test(val)) {
      KP.shift = false;
      renderKp();
    }
  }
}

const kb = document.createElement("button");
kb.type = "button";
kb.textContent = "⌨ Keypad";
kb.hidden = true;
kb.style.cssText = "position:fixed;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:50;padding:10px 14px;border-radius:20px;border:1px solid var(--accent);background:var(--accent);color:var(--accent-ink);font:500 14px Inter,system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25)";
document.body.appendChild(kb);

function setAllIm(m) {
  panel.querySelectorAll("input").forEach(x => {
    if (x.type === "text") x.setAttribute("inputmode", m);
  });
}

kb.addEventListener("pointerdown", e => {
  e.preventDefault();
  KP.native = false;
  setAllIm("none");
  kb.hidden = true;
  showKp();
  if (lastIn) {
    lastIn.blur();
    lastIn.focus();
  }
});

document.addEventListener("focusin", e => {
  const t = e.target;
  if (t.tagName === "INPUT" && t.type === "text" && panel.contains(t)) {
    lastIn = t;
    t.setAttribute("inputmode", KP.native ? "text" : "none");
    if (KP.native) {
      kb.hidden = false;
      hideKp();
    } else {
      showKp();
    }
  }
});

document.addEventListener("focusout", () => {
  setTimeout(() => {
    const active = document.activeElement;
    if (kp.contains(active)) return;
    if (!panel.contains(active)) {
      hideKp();
      kb.hidden = true;
    }
  }, 100);
});

kp.addEventListener("pointerdown", e => {
  const b = e.target.closest("button");
  if (!b) return;
  e.preventDefault();
  kpHandleButton(b);
});

document.addEventListener("pointerdown", e => {
  if (KP.funcsOpen && !e.target.closest(".kp-popover") && !e.target.closest("[data-act='funcs']")) {
    KP.funcsOpen = false;
    renderKp();
  }
});

renderKp();
panel.addEventListener("change", e => { if (e.target.id !== "exo" || e.target.value === "") return; const x = [["0", "2", "x^2", "0"], ["0", "pi", "sin(x)", "0"], ["0", "1", "x", "x^2"], ["0", "4", "sqrt(x)", "0"], ["1", "e", "1/x", "0"]][+e.target.value];["c1", "c2", "c3", "c4"].forEach((id, i) => $(id).value = x[i]); update() });
window.addEventListener("popstate", e => {
  if (kpActive) {
    kpActive = false;
    kp.hidden = true;
    document.body.style.paddingBottom = "";
    if (lastIn) lastIn.blur();
    return;
  }
  const mode = (e.state && e.state.mode) || location.hash.replace(/^#/, "") || "cart";
  if (VALID_MODES.includes(mode) && S.mode !== mode) {
    switchTab(mode, false);
  }
});
window.addEventListener("hashchange", () => {
  const mode = location.hash.replace(/^#/, "");
  if (VALID_MODES.includes(mode) && S.mode !== mode) {
    switchTab(mode, false);
  }
});
const initHash = location.hash.replace(/^#/, "");
if (VALID_MODES.includes(initHash)) {
  S.mode = initHash;
  if (S.mode === "rev") S.vw = "3";
}
try {
  history.replaceState({ mode: S.mode }, "", "#" + S.mode);
} catch (_) { }
size(); build();
const btnReset3D = $("btn-reset-3d");
if (btnReset3D) {
  btnReset3D.addEventListener("click", () => {
    if (is3D()) reset3DView();
    else resetV();
    update();
    announce("View reset");
  });
}

const btnLockView = $("btn-lock-view");
if (btnLockView) {
  btnLockView.addEventListener("click", () => {
    toggleLockView();
    announce(S.lockedView ? "Camera view locked" : "Camera view unlocked");
  });
}

function zoomIn() {
  if (is3D()) {
    zoom3D = Math.min(zoom3D * 1.25, 8);
    announce("Zoomed in 3D");
  } else if (G2()) {
    V.s = Math.min(1e4, V.s * 1.25);
    announce("Zoomed in 2D");
  }
  qd();
}

function zoomOut() {
  if (is3D()) {
    zoom3D = Math.max(zoom3D / 1.25, 0.2);
    announce("Zoomed out 3D");
  } else if (G2()) {
    V.s = Math.max(1, V.s / 1.25);
    announce("Zoomed out 2D");
  }
  qd();
}

const btnZoomIn = $("btn-zoom-in");
if (btnZoomIn) btnZoomIn.addEventListener("click", zoomIn);
const btnZoomOut = $("btn-zoom-out");
if (btnZoomOut) btnZoomOut.addEventListener("click", zoomOut);

const btnFullscreen = $("btn-fullscreen");
const appWrap = $("app-wrap") || document.body;

function togglePresentationFullscreen() {
  const isFs = document.fullscreenElement || document.webkitFullscreenElement || (appWrap && appWrap.classList.contains("is-fullscreen"));
  if (!isFs) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        if (appWrap) appWrap.classList.toggle("is-fullscreen");
        updateFullscreenUI();
      });
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else {
      if (appWrap) appWrap.classList.toggle("is-fullscreen");
      updateFullscreenUI();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
    if (appWrap) appWrap.classList.remove("is-fullscreen");
    updateFullscreenUI();
  }
}

function updateFullscreenUI() {
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || (appWrap && appWrap.classList.contains("is-fullscreen")));
  if (appWrap) appWrap.classList.toggle("is-fullscreen", isFs);
  document.body.classList.toggle("is-presenting", isFs);
  if (btnFullscreen) {
    btnFullscreen.setAttribute("aria-pressed", isFs ? "true" : "false");
    btnFullscreen.setAttribute("title", isFs ? "Exit presentation mode (F / Esc)" : "Presentation / Fullscreen mode (F)");
    const enterIcon = btnFullscreen.querySelector(".fs-enter-icon");
    const exitIcon = btnFullscreen.querySelector(".fs-exit-icon");
    if (enterIcon) enterIcon.style.display = isFs ? "none" : "block";
    if (exitIcon) exitIcon.style.display = isFs ? "block" : "none";
  }
  size();
  update();
}

if (btnFullscreen) {
  btnFullscreen.addEventListener("click", togglePresentationFullscreen);
}
document.addEventListener("fullscreenchange", updateFullscreenUI);
document.addEventListener("webkitfullscreenchange", updateFullscreenUI);

const shortcutsDialog = $("shortcuts-dialog");
const btnShortcuts = $("btn-shortcuts");
const btnCloseDialog = $("btn-close-dialog");
const btnDialogDone = $("btn-dialog-done");

function openShortcutsDialog() {
  if (!shortcutsDialog) return;
  if (typeof shortcutsDialog.showModal === "function") {
    try { shortcutsDialog.showModal(); } catch (_) { shortcutsDialog.setAttribute("open", ""); }
  } else {
    shortcutsDialog.setAttribute("open", "");
  }
  announce("Opened keyboard and touch shortcuts dialog");
}

function closeShortcutsDialog() {
  if (!shortcutsDialog) return;
  if (typeof shortcutsDialog.close === "function") {
    try { shortcutsDialog.close(); } catch (_) { shortcutsDialog.removeAttribute("open"); }
  } else {
    shortcutsDialog.removeAttribute("open");
  }
  if (btnShortcuts) btnShortcuts.focus();
}

if (btnShortcuts) btnShortcuts.addEventListener("click", openShortcutsDialog);
if (btnCloseDialog) btnCloseDialog.addEventListener("click", closeShortcutsDialog);
if (btnDialogDone) btnDialogDone.addEventListener("click", closeShortcutsDialog);
if (shortcutsDialog) {
  shortcutsDialog.addEventListener("click", e => {
    if (e.target === shortcutsDialog) closeShortcutsDialog();
  });
}


window.addEventListener("keydown", e => {
  const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
  const isInput = tag === "input" || tag === "textarea" || (document.activeElement && document.activeElement.isContentEditable);

  if (e.key === "Escape") {
    if (shortcutsDialog && (shortcutsDialog.open || shortcutsDialog.hasAttribute("open"))) {
      closeShortcutsDialog();
      return;
    }
    if (!kp.hidden) {
      hideKp();
      return;
    }
    if (appWrap && appWrap.classList.contains("is-fullscreen")) {
      togglePresentationFullscreen();
      return;
    }
  }

  if (isInput) return;

  if (e.key === "l" || e.key === "L") {
    e.preventDefault();
    toggleLockView();
    announce(S.lockedView ? "Camera view locked" : "Camera view unlocked");
  } else if (e.key === "f" || e.key === "F") {
    e.preventDefault();
    togglePresentationFullscreen();
  } else if (e.key === "t" || e.key === "T") {
    e.preventDefault();
    if (themeToggle) themeToggle.click();
  } else if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    if (btnReset3D) btnReset3D.click();
  } else if (e.key === "k" || e.key === "K") {
    e.preventDefault();
    if (kp.hidden) showKp();
    else hideKp();
  } else if (e.key === "?" || e.key === "/") {
    e.preventDefault();
    openShortcutsDialog();
  } else if (e.key === "+" || e.key === "=") {
    e.preventDefault();
    zoomIn();
  } else if (e.key === "-" || e.key === "_") {
    e.preventDefault();
    zoomOut();
  } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
    const modes = ["cart", "polar", "tri", "rev", "gr"];
    const targetMode = modes[+e.key - 1];
    if (targetMode && S.mode !== targetMode) {
      e.preventDefault();
      switchTab(targetMode, true);
      announce("Switched to " + targetMode + " mode");
    }
  }
});

const themeToggle = $("theme-toggle");
if (themeToggle) {
  const getSavedTheme = () => localStorage.getItem("theme") || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const applyTheme = t => {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
    themeToggle.setAttribute("aria-label", "Switch to " + (t === "dark" ? "light" : "dark") + " mode");
  };
  applyTheme(getSavedTheme());
  themeToggle.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    applyTheme(next);
    announce("Theme set to " + next + " mode");
    update();
  });
}
