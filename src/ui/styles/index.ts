/**
 * 巨大娘计算器 - 样式导出
 * 
 * 注意：这些 CSS 文件应该在组件中通过 @import 或直接在 Vue 组件中引入
 * 
 * 样式文件说明：
 * - variables.css: CSS 变量定义（颜色、间距、字体等）
 * - components.css: 基础组件样式（按钮、输入框、开关等）
 * - panels.css: 面板和覆盖层样式
 * 
 * 使用方式（在 Vue 组件中）：
 * ```vue
 * <style>
 * @import './styles/variables.css';
 * @import './styles/components.css';
 * </style>
 * ```
 * 
 * 或者在主入口文件中：
 * ```ts
 * import './ui/styles/variables.css';
 * import './ui/styles/components.css';
 * import './ui/styles/panels.css';
 * ```
 */

// 样式文件路径常量（用于动态加载）
export const STYLE_PATHS = {
  variables: './styles/variables.css',
  components: './styles/components.css',
  panels: './styles/panels.css',
} as const;
