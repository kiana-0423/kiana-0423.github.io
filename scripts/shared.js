document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const live2dModelPath = "./live2d/my-model/model.model3.json";
const live2dRuntimeScripts = [
  {
    src: "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js",
    ready: () => window.Live2DCubismCore,
  },
  {
    src: "https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js",
    ready: () => window.PIXI,
  },
  {
    src: "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js",
    ready: () => window.PIXI?.live2d?.Live2DModel,
  },
];

const loadLive2dScript = ({ src, ready }) =>
  new Promise((resolve, reject) => {
    if (ready()) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(`script[src="${src}"]`);
    const script = existingScript || document.createElement("script");

    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
      once: true,
    });

    if (!existingScript) {
      script.src = src;
      script.async = false;
      document.body.append(script);
    }
  });

const createLive2dCanvas = () => {
  const existingCanvas = document.getElementById("live2d-canvas");

  if (existingCanvas) {
    return existingCanvas;
  }

  const canvas = document.createElement("canvas");
  canvas.id = "live2d-canvas";
  canvas.setAttribute("aria-label", "Live2D character");
  document.body.append(canvas);
  return canvas;
};

const initializeLive2d = async () => {
  const live2dCanvas = createLive2dCanvas();

  try {
    for (const runtimeScript of live2dRuntimeScripts) {
      await loadLive2dScript(runtimeScript);
    }

    const app = new PIXI.Application({
      view: live2dCanvas,
      autoStart: true,
      backgroundAlpha: 0,
      antialias: true,
      resizeTo: live2dCanvas,
    });
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
        (width * 0.94) / bounds.width,
        (height * 0.98) / bounds.height
      );

      model.scale.set(scale);
      model.x = width - 8 - (bounds.x + bounds.width) * scale;
      model.y = 8 - bounds.y * scale;
    };

    const triggerMotion = (groupName, motionName) => {
      const motions = motionGroups[groupName];

      if (!motions?.length || typeof model.motion !== "function") {
        return false;
      }

      const motionIndex = motionName
        ? motions.findIndex((motion) => motion.Name === motionName)
        : Math.floor(Math.random() * motions.length);
      model.motion(groupName, motionIndex >= 0 ? motionIndex : 0);
      return true;
    };

    const triggerRandomExpression = () => {
      if (!expressions.length || typeof model.expression !== "function") {
        return false;
      }

      const choice = expressions[Math.floor(Math.random() * expressions.length)];
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
      const areaName = Array.isArray(areas) ? areas[0] : null;
      triggerInteraction(areaName ? motionByHitArea.get(areaName) : null);
    });
    model.on("pointertap", () => triggerInteraction(null));

    layoutModel();
    window.addEventListener("resize", layoutModel);
  } catch (error) {
    console.error("[Live2D] Failed to initialize model:", error);
  }
};

if (document.readyState === "complete") {
  initializeLive2d();
} else {
  window.addEventListener("load", initializeLive2d, { once: true });
}
