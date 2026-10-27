const METRIKA_ID = Number(document.documentElement.dataset.metrikaId);
const CONSENT_KEY = "relaxic-consent";
const GOAL = "landing_link_click";
const consent = document.querySelector("#consent");
const toast = document.querySelector("#toast");
let analyticsAllowed = false;
let toastTimer;

function readConsent() {
  try {
    const value = JSON.parse(localStorage.getItem(CONSENT_KEY));
    return typeof value?.analytics === "boolean" ? value.analytics : null;
  } catch {
    return null;
  }
}

function saveConsent(allowed) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: allowed }));
  analyticsAllowed = allowed;
  consent.hidden = true;
  if (allowed) startMetrika();
}

function startMetrika() {
  if (!METRIKA_ID || document.querySelector("#metrika-counter")) return;
  analyticsAllowed = true;
  window.ym = window.ym || function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = Date.now();
  const script = document.createElement("script");
  script.id = "metrika-counter";
  script.async = true;
  script.src = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
  document.head.append(script);
  window.ym(METRIKA_ID, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false,
  });
}

function showPausedMessage() {
  clearTimeout(toastTimer);
  toast.classList.add("visible");
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

document.querySelectorAll("a.tracked-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const label = link.dataset.linkName || link.textContent.trim().slice(0, 80);
    if (analyticsAllowed && typeof window.ym === "function") {
      window.ym(METRIKA_ID, "reachGoal", GOAL, {
        label,
        page: window.location.pathname,
      });
    }
    showPausedMessage();
  });
});

document.querySelectorAll("[data-consent]").forEach((button) => {
  button.addEventListener("click", () => saveConsent(button.dataset.consent === "accept"));
});

const savedConsent = readConsent();
if (savedConsent === true) startMetrika();
else if (savedConsent === null) consent.hidden = false;
