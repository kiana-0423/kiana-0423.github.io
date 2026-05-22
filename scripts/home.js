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

const live2dCanvas = document.getElementById("live2d-canvas");

if (live2dCanvas) {
  const live2dModelPath = "./live2d/my-model/model.model3.json";

  window.addEventListener("load", async () => {
    if (!window.Live2DCubismCore) {
      console.warn(
        "[Live2D] Cubism Core failed to load."
      );
      return;
    }

    if (!window.PIXI?.live2d?.Live2DModel) {
      console.warn(
        "[Live2D] PIXI or pixi-live2d-display failed to load from CDN."
      );
      return;
    }

    const app = new PIXI.Application({
      view: live2dCanvas,
      autoStart: true,
      backgroundAlpha: 0,
      antialias: true,
      resizeTo: live2dCanvas,
    });

    try {
      const [{ Live2DModel }, modelConfig] = await Promise.all([
        Promise.resolve(window.PIXI.live2d),
        fetch(live2dModelPath).then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load model config: ${response.status}`);
          }

          return response.json();
        }),
      ]);

      const model = await Live2DModel.from(live2dModelPath);
      const motionGroups = modelConfig.FileReferences?.Motions || {};
      const expressions = modelConfig.FileReferences?.Expressions || [];
      const hitAreas = modelConfig.HitAreas || [];
      const motionByHitArea = new Map(
        hitAreas
          .filter((area) => area.Name && area.Motion)
          .map((area) => [area.Name, area.Motion])
      );

      app.stage.addChild(model);
      model.interactive = true;
      model.buttonMode = true;

      const layoutModel = () => {
        const width = live2dCanvas.clientWidth || 320;
        const height = live2dCanvas.clientHeight || 520;
        app.renderer.resize(width, height);

        const bounds = model.getLocalBounds();
        const scale = Math.min(
          (width * 0.82) / bounds.width,
          (height * 0.92) / bounds.height
        );

        model.scale.set(scale);
        model.x = width - 6 - (bounds.x + bounds.width) * scale;
        model.y = height - (bounds.y + bounds.height) * scale;
      };

      const triggerMotion = (groupName, motionName) => {
        const motions = motionGroups[groupName];

        if (!motions?.length || typeof model.motion !== "function") {
          return false;
        }

        const motionIndex = motionName
          ? motions.findIndex((motion) => motion.Name === motionName)
          : Math.floor(Math.random() * motions.length);

        const safeIndex = motionIndex >= 0 ? motionIndex : 0;
        model.motion(groupName, safeIndex);
        return true;
      };

      const triggerRandomExpression = () => {
        if (!expressions.length || typeof model.expression !== "function") {
          return false;
        }

        const choice =
          expressions[Math.floor(Math.random() * expressions.length)];
        model.expression(choice.Name);
        return true;
      };

      const triggerInteraction = (motionLabel) => {
        if (motionLabel) {
          const [groupName, motionName] = motionLabel.split(":");
          if (triggerMotion(groupName, motionName)) {
            return;
          }
        }

        const motionGroupNames = Object.keys(motionGroups);
        if (motionGroupNames.length) {
          const randomGroup =
            motionGroupNames[Math.floor(Math.random() * motionGroupNames.length)];
          if (triggerMotion(randomGroup)) {
            return;
          }
        }

        triggerRandomExpression();
      };

      model.on("hit", (areas) => {
        console.log("[Live2D] hitAreas:", areas);

        const areaName = Array.isArray(areas) ? areas[0] : null;
        triggerInteraction(areaName ? motionByHitArea.get(areaName) : null);
      });

      model.on("pointertap", () => {
        triggerInteraction(null);
      });

      layoutModel();
      window.addEventListener("resize", layoutModel);
    } catch (error) {
      console.error("[Live2D] Failed to initialize model:", error);
    }
  });
}
