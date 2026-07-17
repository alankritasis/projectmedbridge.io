/* ==========================================================
   Project MedBridge — site script (v2)
   ----------------------------------------------------------
   HOW TO UPDATE PATIENTS:
   - Edit the PATIENTS array below. Each object is one card.
   - "raised" / "goal" are in US dollars; bars, badges, filter
     chips, and the totals panel all compute automatically.
   - "perMonth" = roughly what one month of this patient's
     treatment costs (used for the "$X ≈ Y months" impact line
     in the popup).
   - "donateUrl": paste the campaign's payment link (Donorbox,
     Givebutter, Zeffy, PayPal...). The chosen amount is added
     to the link as ?amount=25 — Donorbox and Givebutter both
     understand that.
   - "photo": e.g. "photos/asha.jpg" (put the file in the site
     folder), or "" for a placeholder box.
   - Only publish stories/photos with the patient's consent
     (via your partner NGO), and use first names only.
   ========================================================== */

const PATIENTS = [
  {
    id: "asha",
    name: "Asha, 58",
    need: "Type 2 diabetes — needs insulin & test strips",
    tag: "Insulin",
    urgent: true,
    raised: 62,
    goal: 120,
    perMonth: 20,
    photo: "",
    partner: "Verified by Partner NGO #1 · Pune, Maharashtra",
    story:
      "Asha is a grandmother of three who sells vegetables at a roadside stand. " +
      "She was diagnosed with type 2 diabetes two years ago, but on days when sales " +
      "are slow, insulin is the first thing she skips. Her funding goal covers six " +
      "months of insulin and glucose test strips, purchased and delivered by our " +
      "partner NGO's community health worker.",
    donateUrl: "#"
  },
  {
    id: "ravi",
    name: "Ravi, 11",
    need: "Asthma — needs inhalers & a spacer",
    tag: "Asthma",
    urgent: false,
    raised: 45,
    goal: 60,
    perMonth: 5,
    photo: "",
    partner: "Verified by Partner NGO #2 · Kanpur, Uttar Pradesh",
    story:
      "Ravi loves cricket, but asthma attacks keep him out of school for days at a " +
      "time. His family shares one rescue inhaler between two asthmatic kids. This " +
      "campaign funds a year of preventive inhalers plus a spacer for each child, so " +
      "an attack never has to mean a missed week of school again.",
    donateUrl: "#"
  },
  {
    id: "meena",
    name: "Meena, 34",
    need: "Hypothyroidism — needs daily medication",
    tag: "Thyroid",
    urgent: false,
    raised: 18,
    goal: 50,
    perMonth: 4,
    photo: "",
    partner: "Verified by Partner NGO #1 · Pune, Maharashtra",
    story:
      "Meena is a tailor and the primary earner for her family of four. Untreated " +
      "hypothyroidism leaves her exhausted, making long days at the sewing machine " +
      "harder every month. Her medication costs less than $5 a month — this campaign " +
      "covers a full year, with checkup labs included.",
    donateUrl: "#"
  },
  {
    id: "sunil",
    name: "Sunil, 67",
    need: "Heart condition — needs blood pressure medication",
    tag: "Cardiac",
    urgent: true,
    raised: 30,
    goal: 95,
    perMonth: 12,
    photo: "",
    partner: "Verified by Partner NGO #3 · Nagpur, Maharashtra",
    story:
      "Sunil worked as a rickshaw driver for forty years. After a minor heart attack " +
      "last winter, doctors prescribed daily blood pressure and cholesterol " +
      "medication — but on a small pension, he takes them every other day to stretch " +
      "the supply. This campaign covers eight months of consistent, full-dose " +
      "treatment.",
    donateUrl: "#"
  },
  {
    id: "priya",
    name: "Priya, 24",
    need: "Anemia in pregnancy — needs iron therapy & supplements",
    tag: "Maternal",
    urgent: false,
    raised: 55,
    goal: 70,
    perMonth: 14,
    photo: "",
    partner: "Verified by Partner NGO #2 · Kanpur, Uttar Pradesh",
    story:
      "Priya is expecting her first child. A community health screening found severe " +
      "anemia, which puts both her and the baby at risk during delivery. Her campaign " +
      "funds iron therapy, prenatal supplements, and follow-up bloodwork through the " +
      "rest of her pregnancy.",
    donateUrl: "#"
  },
  {
    id: "kabir",
    name: "Kabir, 7",
    need: "Epilepsy — needs anti-seizure medication",
    tag: "Neurology",
    urgent: false,
    raised: 12,
    goal: 110,
    perMonth: 9,
    photo: "",
    partner: "Verified by Partner NGO #3 · Nagpur, Maharashtra",
    story:
      "Kabir's seizures started when he was five. With consistent medication he can " +
      "live a completely normal life — but consistency is exactly what his family " +
      "can't afford. This campaign funds a full year of anti-seizure medication and " +
      "two neurologist follow-ups at a partner clinic.",
    donateUrl: "#"
  }
];

/* ---------- Helpers ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pct = (p) => Math.min(100, Math.round((p.raised / p.goal) * 100));

/* ---------- Card rendering ---------- */
function cardHTML(p) {
  const percent = pct(p);
  return `
    <article class="patient-card reveal" tabindex="0" role="button"
             aria-label="Read ${p.name}'s story" data-id="${p.id}">
      <div class="card-photo">
        ${p.photo ? `<img src="${p.photo}" alt="${p.name}">` : "Photo placeholder"}
        <span class="pct-badge ${percent >= 100 ? "full" : ""}">${percent >= 100 ? "Fully funded 🎉" : percent + "% funded"}</span>
      </div>
      <div class="card-body">
        <div class="card-top">
          <h3>${p.name}</h3>
          <span class="tag ${p.urgent ? "urgent" : ""}">${p.urgent ? "Urgent · " : ""}${p.tag}</span>
        </div>
        <p class="card-need">${p.need}</p>
        <div class="fund-bar-wrap">
          <div class="fund-amounts">
            <span class="raised">$${p.raised} raised</span>
            <span class="goal">of $${p.goal}</span>
          </div>
          <div class="fund-bar">
            <div class="fund-fill" data-target="${percent}"></div>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn btn-outline read-btn" data-id="${p.id}">Read story</button>
          <button class="btn btn-primary give-btn" data-id="${p.id}">Donate</button>
        </div>
      </div>
    </article>`;
}

function renderGrid(el, list) {
  el.innerHTML = list.map(cardHTML).join("");
  observeAll(el);
}

/* ---------- Scroll reveal + bar animation + count-up ---------- */
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      io.unobserve(el);

      if (el.classList.contains("reveal")) el.classList.add("in");

      // animate any funding bars inside
      el.querySelectorAll(".fund-fill[data-target], .fund-fill#total-fill").forEach((f) => {
        const t = f.dataset.target;
        if (t !== undefined) requestAnimationFrame(() => (f.style.width = t + "%"));
      });
      if (el.matches(".fund-fill[data-target]")) {
        requestAnimationFrame(() => (el.style.width = el.dataset.target + "%"));
      }

      // count-up numbers inside
      el.querySelectorAll("[data-count]").forEach(countUp);
      if (el.matches("[data-count]")) countUp(el);
    }
  },
  { threshold: 0.25 }
);

function observeAll(root = document) {
  root.querySelectorAll(".reveal, [data-count], .fund-fill[data-target]").forEach((el) => io.observe(el));
}

function countUp(el) {
  if (el.dataset.done) return;
  el.dataset.done = "1";
  const end = parseInt(el.dataset.count, 10);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  if (reduceMotion) { el.textContent = prefix + end + suffix; return; }
  const dur = 1200;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = prefix + Math.round(end * eased) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------- Header shadow on scroll ---------- */
const header = document.getElementById("site-header");
if (header) {
  window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 8), { passive: true });
}

/* ---------- Donate page: totals + filters ---------- */
const fullGrid = document.getElementById("patient-grid");
if (fullGrid) {
  const totalRaised = PATIENTS.reduce((s, p) => s + p.raised, 0);
  const totalGoal = PATIENTS.reduce((s, p) => s + p.goal, 0);
  const tr = document.getElementById("total-raised");
  tr.dataset.count = totalRaised;
  tr.dataset.prefix = "$";
  document.getElementById("total-sub").textContent =
    `raised of $${totalGoal} needed across ${PATIENTS.length} active campaigns`;
  document.getElementById("total-fill").dataset.target = Math.round((totalRaised / totalGoal) * 100);

  // filter chips
  const filterRow = document.getElementById("filter-row");
  const tags = [...new Set(PATIENTS.map((p) => p.tag))];
  filterRow.innerHTML =
    `<button class="chip on" data-f="all">All (${PATIENTS.length})</button>` +
    `<button class="chip urgent-chip" data-f="urgent">🔥 Urgent (${PATIENTS.filter((p) => p.urgent).length})</button>` +
    tags.map((t) => `<button class="chip" data-f="${t}">${t}</button>`).join("");

  function applyFilter(f) {
    const list =
      f === "all" ? PATIENTS :
      f === "urgent" ? PATIENTS.filter((p) => p.urgent) :
      PATIENTS.filter((p) => p.tag === f);
    renderGrid(fullGrid, list);
    document.getElementById("empty-msg").style.display = list.length ? "none" : "block";
  }

  filterRow.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    filterRow.querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
    chip.classList.add("on");
    applyFilter(chip.dataset.f);
  });

  applyFilter("all");
}

/* ---------- Home page: featured grid ---------- */
const featuredGrid = document.getElementById("featured-grid");
if (featuredGrid) renderGrid(featuredGrid, PATIENTS.slice(0, 3));

/* ---------- Home page: rotating quotes ---------- */
const quotesWrap = document.getElementById("quotes");
if (quotesWrap) {
  const quotes = [...quotesWrap.querySelectorAll(".quote")];
  const dotsWrap = document.getElementById("quote-dots");
  let qi = 0, timer;

  dotsWrap.innerHTML = quotes.map((_, i) => `<button class="qdot ${i === 0 ? "on" : ""}" data-i="${i}" aria-label="Quote ${i + 1}"></button>`).join("");

  function showQuote(i) {
    qi = i;
    quotes.forEach((q, j) => q.classList.toggle("on", j === i));
    dotsWrap.querySelectorAll(".qdot").forEach((d, j) => d.classList.toggle("on", j === i));
  }
  function startTimer() {
    if (reduceMotion) return;
    clearInterval(timer);
    timer = setInterval(() => showQuote((qi + 1) % quotes.length), 5000);
  }
  dotsWrap.addEventListener("click", (e) => {
    const d = e.target.closest(".qdot");
    if (!d) return;
    showQuote(+d.dataset.i);
    startTimer();
  });
  startTimer();
}

/* ---------- Modal with amount picker ---------- */
const overlay = document.getElementById("modal-overlay");
let currentPatient = null;
let currentAmount = 10;

function impactText(p, amt) {
  const el = document.getElementById("impact-line");
  const remaining = Math.max(0, p.goal - p.raised);
  if (amt >= remaining && remaining > 0) {
    el.classList.add("complete");
    el.innerHTML = `🎉 <strong>$${amt} would fully fund ${p.name.split(",")[0]}'s medicine!</strong> Anything extra rolls into the general Medicine Fund.`;
  } else {
    el.classList.remove("complete");
    const months = amt / p.perMonth;
    const m = months >= 1 ? Math.round(months * 10) / 10 : null;
    el.innerHTML = m
      ? `💊 <strong>$${amt}</strong> ≈ <strong>${m} month${m === 1 ? "" : "s"}</strong> of ${p.name.split(",")[0]}'s treatment. $${remaining - amt} would remain to reach the goal.`
      : `💙 Every dollar counts — <strong>$${amt}</strong> brings ${p.name.split(",")[0]} closer to the $${p.goal} goal.`;
  }
}

function updatePreview(p, amt) {
  // show where the bar would land after this gift
  const previewPct = Math.min(100, Math.round(((p.raised + amt) / p.goal) * 100));
  const fill = document.getElementById("modal-fill");
  fill.style.width = previewPct + "%";
  document.getElementById("modal-raised").textContent = `$${p.raised} raised (+ your $${amt})`;
  document.getElementById("modal-donate").textContent = `Donate $${amt} to ${p.name.split(",")[0]}`;
  const base = p.donateUrl && p.donateUrl !== "#" ? p.donateUrl : "#";
  document.getElementById("modal-donate").href =
    base === "#" ? "#" : base + (base.includes("?") ? "&" : "?") + "amount=" + amt;
  impactText(p, amt);
}

function setAmount(amt) {
  currentAmount = amt;
  document.querySelectorAll("#amount-row .amt").forEach((b) =>
    b.classList.toggle("on", +b.dataset.amt === amt)
  );
  if (currentPatient) updatePreview(currentPatient, amt);
}

function openModal(p) {
  currentPatient = p;
  document.getElementById("modal-name").textContent = p.name;
  document.getElementById("modal-meta").textContent = p.need;
  document.getElementById("modal-story").textContent = p.story;
  document.getElementById("modal-partner").textContent = p.partner;
  document.getElementById("modal-goal").textContent = `of $${p.goal} goal · ${pct(p)}% funded`;

  const photoBox = document.getElementById("modal-photo");
  photoBox.innerHTML = p.photo
    ? `<img src="${p.photo}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`
    : "Photo placeholder";

  document.getElementById("amt-custom").value = "";
  setAmount(10);

  overlay.classList.add("open");
  requestAnimationFrame(() => overlay.classList.add("show"));
  document.body.style.overflow = "hidden";
}

function closeModal() {
  overlay.classList.remove("show");
  setTimeout(() => overlay.classList.remove("open"), 250);
  document.body.style.overflow = "";
}

if (overlay) {
  document.addEventListener("click", (e) => {
    const giveBtn = e.target.closest(".give-btn");
    const readBtn = e.target.closest(".read-btn");
    const card = e.target.closest(".patient-card");

    if (giveBtn || readBtn) {
      const id = (giveBtn || readBtn).dataset.id;
      const p = PATIENTS.find((x) => x.id === id);
      if (p) openModal(p);
      return;
    }
    if (card && !e.target.closest("a, button")) {
      const p = PATIENTS.find((x) => x.id === card.dataset.id);
      if (p) openModal(p);
      return;
    }

    const amt = e.target.closest("#amount-row .amt");
    if (amt) { document.getElementById("amt-custom").value = ""; setAmount(+amt.dataset.amt); return; }

    if (e.target === overlay || e.target.id === "modal-close") closeModal();
  });

  const custom = document.getElementById("amt-custom");
  if (custom) {
    custom.addEventListener("input", () => {
      const v = parseInt(custom.value, 10);
      if (v >= 1) {
        document.querySelectorAll("#amount-row .amt").forEach((b) => b.classList.remove("on"));
        currentAmount = v;
        if (currentPatient) updatePreview(currentPatient, v);
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "Enter" && document.activeElement.classList?.contains("patient-card")) {
      const p = PATIENTS.find((x) => x.id === document.activeElement.dataset.id);
      if (p) openModal(p);
    }
  });
}

/* ---------- Kick off reveal observation for static content ---------- */
observeAll();
