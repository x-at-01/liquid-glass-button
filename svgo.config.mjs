// SVGO 配置：图标压缩，默认预设 + multipass。
// 图标全部用 currentColor + CSS mask-image，没有 id/defs，默认插件安全。
export default {
  multipass: true,
  plugins: ["preset-default"],
};
