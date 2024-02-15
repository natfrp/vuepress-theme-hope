import { useStorage } from "@vueuse/core";
import type { PropType, SlotsType, VNode } from "vue";
import { defineComponent, h, onMounted, ref, shallowRef, watch, nextTick, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import "../styles/tabs.scss";

export interface TabProps extends Record<string, unknown> {
  id: string;
  navId?: string;
}

const tabStore = useStorage<Record<string, string>>("VUEPRESS_TAB_STORE", {});

export default defineComponent({
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Tabs",

  props: {
    /**
     * Active tab index
     *
     * 激活的标签页序号
     */
    active: {
      type: Number,
      default: 0,
    },

    /**
     * Tab data
     *
     * 标签页数据
     */
    data: {
      type: Array as PropType<TabProps[]>,
      required: true,
    },

    /**
     * Tab id
     *
     * 标签页 id
     */
    id: {
      type: String,
      required: true,
    },

    /**
     * Tab id
     *
     * 标签页 id
     */
    tabId: {
      type: String,
      default: "",
    },
  },

  slots: Object as SlotsType<{
    [slot: `title${number}`]: (props: {
      value: string;
      isActive: boolean;
    }) => VNode[];
    [slot: `tab${number}`]: (props: {
      value: string;
      isActive: boolean;
    }) => VNode[];
  }>,

  setup(props, { slots }) {
    // Index of current active item
    // eslint-disable-next-line vue/no-setup-props-destructure
    const activeIndex = ref(props.active);

    // Refs of the tab buttons
    const tabRefs = shallowRef<HTMLUListElement[]>([]);

    // stores anchors for each tab, non-reactive
    const tabContentAnchors: Set<string>[] = [];

    // Update store
    const updateStore = (): void => {
      if (props.tabId)
        tabStore.value[props.tabId] = props.data[activeIndex.value].id;
    };

    // Activate next tab
    const activateNext = (index = activeIndex.value): void => {
      activeIndex.value = index < tabRefs.value.length - 1 ? index + 1 : 0;
      tabRefs.value[activeIndex.value].focus();
    };

    // Activate previous tab
    const activatePrev = (index = activeIndex.value): void => {
      activeIndex.value = index > 0 ? index - 1 : tabRefs.value.length - 1;
      tabRefs.value[activeIndex.value].focus();
    };

    // Handle keyboard event
    const keyboardHandler = (event: KeyboardEvent, index: number): void => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        activeIndex.value = index;
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        activateNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        activatePrev();
      }

      updateStore();
    };

    // find tab index for a URL hash
    const findAnchorIndex = (hash: string): number => {
      hash = hash?.substring(1);

      if (hash) {
        // match navId first
        let index = props.data.findIndex(({ navId }) => hash === navId);

        if (index !== -1) return index;

        // if not found, try to match anchor inside tabs
        index = tabContentAnchors.findIndex((set) => set.has(hash));
        if (index !== -1) return index;
      }

      return -1;
    };

    const getInitialIndex = (): number => {
      if (props.tabId) {
        const valueIndex = props.data.findIndex(
          ({ id }) => tabStore.value[props.tabId] === id,
        );

        if (valueIndex !== -1) return valueIndex;
      }

      const anchorIndex = findAnchorIndex(useRoute()?.hash);
      if (anchorIndex !== -1) return anchorIndex;

      return props.active;
    };

    let rmFunc: (() => void) | undefined;

    onMounted(() => {
      activeIndex.value = getInitialIndex();

      // onBeforeRouteUpdate is broken
      rmFunc = useRouter().beforeEach((to, _, next) => {
        const anchorIndex = findAnchorIndex(to.hash);
        console.info(to);
        console.info(anchorIndex);

        if (anchorIndex !== -1) {
          activeIndex.value = anchorIndex;

          // wait one tick for vue-router to scroll properly
          void nextTick().then(next);
        } else {
          next();
        }
      });

      watch(
        () => tabStore.value[props.tabId],
        (newValue, oldValue) => {
          if (props.tabId && newValue !== oldValue) {
            const index = props.data.findIndex(({ id }) => id === newValue);

            if (index !== -1) activeIndex.value = index;
          }
        },
      );
    });

    onUnmounted(() => {
      rmFunc?.();
      rmFunc = undefined;
    });

    return (): VNode | null =>
      props.data.length
        ? h("div", { class: "vp-tabs" }, [
            h(
              "div",
              { class: "vp-tabs-nav", role: "tablist" },
              props.data.map(({ id, navId }, index) => {
                const isActive = index === activeIndex.value;

                return h(
                  "button",
                  {
                    type: "button",
                    ref: (element) => {
                      if (element)
                        tabRefs.value[index] = <HTMLUListElement>element;
                    },
                    id: navId ?? id, // set id for vue-router to scroll, avoid the warning
                    class: ["vp-tab-nav", { active: isActive }],
                    role: "tab",
                    "aria-controls": `tab-${props.id}-${index}`,
                    "aria-selected": isActive,
                    onClick: () => {
                      activeIndex.value = index;
                      updateStore();
                    },
                    onKeydown: (event: KeyboardEvent) =>
                      keyboardHandler(event, index),
                  },
                  slots[`title${index}`]({ value: id, isActive }),
                );
              }),
            ),
            props.data.map(({ id }, index) => {
              const isActive = index === activeIndex.value;

              return h(
                "div",
                {
                  class: ["vp-tab", { active: isActive }],
                  id: `tab-${props.id}-${index}`,
                  role: "tabpanel",
                  "aria-expanded": isActive,
                  onVnodeMounted(vnode) {
                    const anchors = new Set<string>();

                    // select and cache anchors inside the tab
                    (vnode.el as HTMLUListElement)
                      ?.querySelectorAll("a.header-anchor[href]")
                      .forEach((e) => {
                        const href = e.getAttribute("href");

                        if (href?.startsWith("#"))
                          anchors.add(href.substring(1));
                      });
                    tabContentAnchors[index] = anchors;
                  },
                },
                [
                  h(
                    "div",
                    { class: "vp-tab-title" },
                    slots[`title${index}`]({ value: id, isActive }),
                  ),
                  slots[`tab${index}`]({ value: id, isActive }),
                ],
              );
            }),
          ])
        : null;
  },
});
