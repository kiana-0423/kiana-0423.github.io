const typewriterEl = document.getElementById("typewriter");

if (typewriterEl) {
  const text = typewriterEl.dataset.text || typewriterEl.textContent.trim();
  let idx = 0;

  function type() {
    typewriterEl.textContent = text.slice(0, idx);
    idx = idx === text.length ? 0 : idx + 1;
  }

  setInterval(type, 80);
}

const clockEl = document.getElementById("clock");

if (clockEl) {
  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString("zh-CN", {
      hour12: false,
    });
  }

  tick();
  setInterval(tick, 1000);
}

const quotes = [
  "我会把这个不完美的故事，变成我们期望的样子。 ——琪亚娜·卡斯兰娜",
  "世界是不美好，所以美好才是人们心中的渴望。 ——琪亚娜·卡斯兰娜",
  "我们不需要救世主，我们自己来拯救自己。 ——琪亚娜·卡斯兰娜",
  "它会烧尽漆黑的天空，让光照向更远的地方！这就是我和大家的回家的路！ ——琪亚娜·卡斯兰娜",
  "鸟为什么会飞？因为它们必须飞向天际。 ——凯文·卡斯兰娜",
];

const quoteEl = document.getElementById("quote");

if (quoteEl) {
  quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

const galleryModal = document.getElementById("galleryModal");
const galleryModalImage = document.getElementById("galleryModalImage");
const galleryModalClose = document.getElementById("galleryModalClose");

if (galleryModal && galleryModalImage && galleryModalClose) {
  const toggleGalleryModal = (isOpen) => {
    galleryModal.classList.toggle("open", isOpen);
    galleryModal.setAttribute("aria-hidden", String(!isOpen));

    if (!isOpen) {
      galleryModalImage.removeAttribute("src");
      galleryModalImage.removeAttribute("alt");
    }
  };

  document.querySelectorAll(".gallery-grid img").forEach((img) => {
    img.addEventListener("click", () => {
      galleryModalImage.src = img.src;
      galleryModalImage.alt = img.alt || "Gallery photo";
      toggleGalleryModal(true);
    });
  });

  galleryModalClose.addEventListener("click", () => toggleGalleryModal(false));

  galleryModal.addEventListener("click", (event) => {
    if (event.target === galleryModal) {
      toggleGalleryModal(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && galleryModal.classList.contains("open")) {
      toggleGalleryModal(false);
    }
  });
}

const visitorCountEl = document.getElementById("visitorCount");

if (visitorCountEl && window.fetch) {
  const counterEndpoint = "https://api.countapi.xyz/hit/kiana-homepage/visits";

  fetch(counterEndpoint)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to retrieve visitor count");
      }

      return response.json();
    })
    .then((data) => {
      const value = Number(data.value ?? data.count);
      visitorCountEl.textContent = Number.isFinite(value)
        ? value.toLocaleString("zh-CN")
        : "—";
    })
    .catch(() => {
      visitorCountEl.textContent = "—";
    });
}
