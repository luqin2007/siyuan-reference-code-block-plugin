
# Reference code block

[中文版](./README_zh_CN.md)

Make Siyuan compatible with Obsidian [embed-code-file](https://github.com/almariah/embed-code-file) and [code-styler](https://github.com/mayurankv/Obsidian-Code-Styler) plugin. The plugin facilitates the transfer of Obsidian notes.

Notice:
- Does not support reference block ( code-styler [] )
- Does not support writing the title on the side of \`\`\` , use `title`
- Does not support high-lighting hl attribute
- Does not support relative paths (code-styler paths starting with `.`), only support network addresses and relative paths (starting with `@/` or `vault://`)

Code blocks created in Siyuan need to be reloaded to display the referenced content.

The referenced code blocks are read-only, and you can switch between edit and preview pages through the top-right edit and preview buttons.

![test-embed-code-file](/test-embed-code-file.png)

![test-code-styler](/test-code-styler.png)
