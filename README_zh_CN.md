
# 引用代码块

[English](./README.md)

使思源兼容 Obsidian [embed-code-file](https://github.com/almariah/embed-code-file) 与 [code-styler](https://github.com/mayurankv/Obsidian-Code-Styler) 引用代码块的写法，方便 Obsidian 笔记转移。

注意：
- 暂不支持 reference 块引用方式
- 暂不支持写在 \`\`\` 旁的标题，只能使用 `title`
- 暂不支持高亮 hl 属性
- 暂不支持相对路径（code-styler 以 `.` 开头的路径），只支持网络地址、相对笔记的路径（以 `@/` 或  `vault://` 开头）

在思源中创建的 `reference` 或 `embed-` 块，需要重新加载才能显示引用内容。

引用的代码块是只读的，通过右上角的编辑和预览按钮切换编辑和预览页。

![test-embed-code-file](/test-embed-code-file.png)

![test-code-styler](/test-code-styler.png)

# 更新记录

## 20250703 v1.0.2

- 鼠标悬停标题时显示路径
- 鼠标点击标题时复制（浏览器、手机等端）或打开（桌面端）代码文件
- 加载失败时显示错误信息