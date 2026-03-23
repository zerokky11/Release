const searchInput = document.getElementById("feature-search");
const filterButtons = Array.from(document.querySelectorAll(".filter-chip"));
const featureEntries = Array.from(document.querySelectorAll(".feature-entry"));
const anchorLinks = Array.from(document.querySelectorAll(".manual-anchor-nav a"));

let currentFilter = "all";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesFilter(entry) {
  if (currentFilter === "all") {
    return true;
  }

  const groups = normalizeText(entry.dataset.group).split(/\s+/).filter(Boolean);
  return groups.includes(currentFilter);
}

function matchesSearch(entry, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    entry.textContent,
    entry.dataset.keywords || "",
    entry.dataset.group || ""
  ].join(" ").toLowerCase();

  return haystack.includes(query);
}

function updateFeatureVisibility() {
  const query = normalizeText(searchInput ? searchInput.value : "");

  featureEntries.forEach((entry) => {
    const visible = matchesFilter(entry) && matchesSearch(entry, query);
    entry.classList.toggle("is-hidden", !visible);
  });
}

function setFilter(value) {
  currentFilter = value;
  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === value);
  });
  updateFeatureVisibility();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setFilter(button.dataset.filter || "all");
  });
});

if (searchInput) {
  searchInput.addEventListener("input", updateFeatureVisibility);
}

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!visible) {
    return;
  }

  const id = visible.target.getAttribute("id");
  anchorLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("is-active", active);
  });
}, {
  rootMargin: "-20% 0px -60% 0px",
  threshold: [0.1, 0.25, 0.5]
});

document.querySelectorAll("main section[id]").forEach((section) => {
  sectionObserver.observe(section);
});

setFilter("all");
