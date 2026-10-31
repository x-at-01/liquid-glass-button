// SVGO 配置：默认预设，但保留 id / 自定义属性 / 注释
// assets/glass-filters.svg 是运行时模板（靠 #glass-template 与 .g-map / .g-disp 定位），
// 默认的 cleanupIds / removeUnknownsAndDefaults 会破坏它。
export default {
  multipass: true,
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false,
          removeUnknownsAndDefaults: false,
          removeComments: false,
        },
      },
    },
  ],
};
