const tabs = Array.from(document.querySelectorAll(".studio-tab"));
const panels = Array.from(document.querySelectorAll("[data-panel]"));

function activatePanel(panelId, updateHash = true) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.panelTarget === panelId;
    tab.setAttribute("aria-selected", String(isActive));
  });

  panels.forEach((panel) => {
    const isActive = panel.id === panelId;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  if (updateHash && window.location.hash !== "#" + panelId) {
    history.replaceState(null, "", "#" + panelId);
  }
}

if (tabs.length > 0 && panels.length > 0) {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activatePanel(tab.dataset.panelTarget);
    });
  });

  const availablePanels = new Set(panels.map((panel) => panel.id));
  const initialPanel = window.location.hash.replace("#", "");

  activatePanel(
    availablePanels.has(initialPanel) ? initialPanel : "game-intro",
    false
  );

  window.addEventListener("hashchange", () => {
    const target = window.location.hash.replace("#", "");

    if (availablePanels.has(target)) {
      activatePanel(target, false);
    }
  });
}
