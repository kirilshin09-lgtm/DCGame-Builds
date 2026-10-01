(function () {
  "use strict";
  var detach = null;
  var overlay = null;
  var beforeSleep = null;
  var samples = [];
  var diagnostics = new URLSearchParams(window.location.search).get("perf") === "1";

  window.dcBrowserLifecycle = {
    attach: function (unity) {
      if (detach) detach();
      var lastVisible;
      function setVisible(visible) {
        if (visible === lastVisible) return;
        lastVisible = visible;
        unity.SendMessage("WebGameLifecycle", "SetPageVisible", visible ? 1 : 0);
      }
      function onVisibility() { setVisible(!document.hidden); }
      function onPageHide() { setVisible(false); }
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pagehide", onPageHide);
      window.addEventListener("pageshow", onVisibility);
      detach = function () {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", onPageHide);
        window.removeEventListener("pageshow", onVisibility);
      };
      unity.SendMessage("WebGameLifecycle", "EnableDiagnostics", diagnostics ? 1 : 0);
      onVisibility();
    },
    report: function (sample) {
      if (!diagnostics) return;
      samples.push(sample);
      if (samples.length > 8) samples.shift();
      if (sample.phase === "before sleep") beforeSleep = sample;
      if (!overlay) {
        overlay = document.createElement("pre");
        overlay.id = "dc-performance";
        overlay.style.cssText = "position:fixed;left:4px;top:4px;z-index:20;margin:0;padding:6px;background:#000b;color:#fff;font:11px monospace;pointer-events:none";
        document.body.appendChild(overlay);
      }
      overlay.textContent = "FPS: " + sample.fps.toFixed(1) +
        (beforeSleep ? " | до сна: " + beforeSleep.fps.toFixed(1) : "") +
        "\n" + sample.width + "×" + sample.height + " | лимит: " + sample.targetFps +
        "\nNPC: " + sample.animatedCrowd + "/" + sample.activeCrowd + " | C# MB: " + sample.managedMiB;
    },
    samples: samples
  };
})();
