// SVGO 配置：默认预设 + 关掉会破坏「运行时模板」的插件。
// assets/glass-filters.svg 是给 backdrop-filter 用的滤镜模板：它被 CSS 在运行时引用，
// 文件内部没有引用关系，默认的 removeUselessDefs / removeHiddenElems 会把整份 defs 删掉；
// cleanupIds / removeUnknownsAndDefaults 会改掉 #glass-template 与 .g-map / .g-disp，运行时定位失效。
export default {
  multipass: true,
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          removeUselessDefs: false,
          removeHiddenElems: false,
          cleanupIds: false,
          removeUnknownsAndDefaults: false,
          removeComments: false,
        },
      },
    },
  ],
};
