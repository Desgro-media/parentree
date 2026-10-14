/* ==========================================================================
   Momira Organic — size chart
   One shared chart, shown in a full-screen dialog from the product page.
   Numbers are the brand's published measurements (no units are printed on the
   source chart, so none are shown here either).
   Public API: window.SizeChart.open(trigger?) / .close()
   ========================================================================== */
(function () {
  "use strict";

  const MONTHS = ["0-3", "3-6", "6-12", "12-18", "18-24"];

  /* one entry per garment — `sizes` index into MONTHS, `rows` line up with `sizes` */
  const CHARTS = [
    { name: "Jabla", note: "(Sleeveless)", art: "jabla", sizes: [0, 1, 2],
      rows: [["Chest", [24, 25.5, 27]], ["Length", [29, 30.5, 33]]] },
    { name: "Knot Jabla", note: "", art: "knot", sizes: [0, 1, 2],
      rows: [["Chest", [24, 28, 33]], ["Length", [30, 36, 41]]] },
    { name: "Romper", note: "(Full Sleeve)", art: "romperLong", sizes: [0, 1, 2, 3, 4],
      rows: [["Chest", [46, 48, 50, 53, 56]], ["Length", [56, 58, 61, 63, 67]]] },
    { name: "Romper", note: "(Short Sleeve)", art: "romperShort", sizes: [0, 1, 2, 3, 4],
      rows: [["Chest", [46, 48, 50, 54, 56]], ["Length", [52, 54, 56, 58, 60]]] },
    { name: "Hoodies", note: "", art: "hoodie", sizes: [0, 1, 2, 3, 4],
      rows: [["Chest", [47, 49, 51, 53, 55]], ["Length", [30, 32, 34, 37, 40]]] },
    { name: "Leggings", note: "", art: "leggings", sizes: [0, 1, 2, 3, 4],
      rows: [["Length", [37, 39, 42.5, 45.5, 47.5]], ["Waist", [37, 39, 41, 43, 45]]] },
  ];

  /* simple outline drawings of each garment (64×64, drawn with currentColor) */
  const ART = {
    jabla: '<path d="M22 6 32 20 42 6l5 2q-1 10-4 14l10 34q-21 5-42 0l10-34q-3-4-4-14Z"/>'
      + '<path d="M32 20v36"/><circle cx="32" cy="27" r="1.2" fill="currentColor"/><circle cx="32" cy="35" r="1.2" fill="currentColor"/><circle cx="32" cy="43" r="1.2" fill="currentColor"/>',
    knot: '<path d="m18 12 4 10-10 34q20 5 40 0L42 22l4-10"/><path d="M22 22q10 6 20 0"/>'
      + '<path d="M18 12q-7-7-8-1 1 5 8 1Zm0 0q5-8 7-2-1 4-7 2ZM46 12q7-7 8-1-1 5-8 1Zm0 0q-5-8-7-2 1 4 7 2Z"/>',
    romperLong: '<path d="M24 6q8 7 16 0l14 14-2 18h-5l-2-14v30l-5 4-6-4h-4l-6 4-5-4V24L17 38h-5l-2-18L24 6Z"/><path d="M32 12v42"/>',
    romperShort: '<path d="M22 6q10 8 20 0l12 8-4 10-6-2v22q6 6 2 12l-6-4-8 4-8-4-6 4q-4-6 2-12V22l-6 2-4-10 12-8Z"/><circle cx="29" cy="52" r="1.2" fill="currentColor"/><circle cx="35" cy="52" r="1.2" fill="currentColor"/>',
    hoodie: '<path d="M22 10q10-12 20 0l12 12-2 24h-6l-1-18v28H19V28l-1 18h-6l-2-24L22 10Z"/><path d="M24 12q8 12 16 0"/><path d="M24 44h16l2 10H22l2-10Z"/>',
    leggings: '<path d="M18 8h28l2 48H36l-4-32-4 32H16L18 8Z"/><path d="M18 14h28"/>',
  };
  const art = (k) => `<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ART[k]}</svg>`;

  function table(c) {
    const head = c.sizes.map((i) => `<th scope="col">${MONTHS[i]}<small> Month</small></th>`).join("");
    const body = c.rows.map(([label, vals]) =>
      `<tr><th scope="row">${label}</th>${vals.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("");
    return `<div class="sz-scroll"><table class="sz-table">
      <caption class="sr-only">${c.name} ${c.note} measurements by age</caption>
      <tbody>
        <tr>
          <th class="sz-table__who" rowspan="${c.rows.length + 1}" scope="rowgroup"><span>${c.name}${c.note ? `<br>${c.note}` : ""}</span>${art(c.art)}</th>
          <th scope="row">Size</th>${head}
        </tr>
        ${body}
      </tbody>
    </table></div>`;
  }

  let modal, lastFocus;

  function build() {
    modal = document.createElement("div");
    modal.className = "sz-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "szTitle");
    modal.innerHTML = `
      <div class="sz-modal__box" tabindex="-1">
        <button class="sz-modal__close" type="button" aria-label="Close size chart">${window.icon("close")}</button>
        <div class="sz-modal__scroll">
          <h2 class="sz-modal__title" id="szTitle">Size Chart</h2>
          ${CHARTS.map(table).join("")}
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.closest(".sz-modal__close")) close();
    });
  }

  function onKey(e) {
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab") return;
    /* keep Tab inside the dialog */
    const f = [...modal.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])")];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open(trigger) {
    if (!modal) build();
    lastFocus = trigger || document.activeElement;
    document.body.classList.add("no-scroll");
    modal.classList.add("open");
    modal.querySelector(".sz-modal__scroll").scrollTop = 0;
    modal.querySelector(".sz-modal__close").focus();
    document.addEventListener("keydown", onKey);
  }

  function close() {
    if (!modal || !modal.classList.contains("open")) return;
    modal.classList.remove("open");
    document.body.classList.remove("no-scroll");
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  window.SizeChart = { open, close };
})();
