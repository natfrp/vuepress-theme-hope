import { IconBase } from "@mr-hope/vuepress-shared/lib/client";
import { h } from "vue";
import type { FunctionalComponent } from "vue";

export const FacebookIcon: FunctionalComponent = () =>
  h(IconBase, { name: "facebook" }, () => [
    h("circle", {
      cx: "512",
      cy: "512",
      r: "512",
      fill: "#3C599B",
    }),
    h("path", {
      d: "M372.568 413.895h59.898V355.68c0-25.67.647-65.257 19.294-89.774 19.642-25.965 46.605-43.613 92.983-43.613 75.565 0 107.384 10.778 107.384 10.778l-14.971 88.74s-24.967-7.217-48.254-7.217c-23.302 0-44.16 8.35-44.16 31.635v67.666h95.526l-6.67 86.678h-88.855V801.69H432.466V500.574h-59.898v-86.68z",
      fill: "#fff",
    }),
  ]);

FacebookIcon.displayName = "FacebookIcon";
