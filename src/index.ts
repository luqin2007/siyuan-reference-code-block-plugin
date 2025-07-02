import {
    Plugin,
    Lute,
    IProtyle,
    getFrontend,
    showMessage
} from "siyuan";
import { getBlockKramdown, getFile } from "./api";
import "@/index.scss";
import { ICodeReference } from "./types";

export default class PluginSample extends Plugin {

    private lute: Lute | undefined;

    async onload() {
        this.eventBus.on('loaded-protyle-static', this.onProtyleLoaded.bind(this))
        this.eventBus.on('loaded-protyle-dynamic', this.onProtyleLoaded.bind(this))
    }

    onunload() {
        this.eventBus.off('loaded-protyle-static', this.onProtyleLoaded)
        this.eventBus.off('loaded-protyle-dynamic', this.onProtyleLoaded)
    }

    onLayoutReady() {
    }

    uninstall() {
    }

    onProtyleLoaded(event: CustomEvent<{ protyle: IProtyle }>) {
        const lute = event.detail.protyle.lute || this.lute || (this.lute = window.Lute.New());
        event.detail.protyle.element.querySelectorAll("div[data-type='NodeCodeBlock']")
            .forEach(async (codeBlock: HTMLElement) => {
                const typeElement = codeBlock.querySelector('.protyle-action__language') as HTMLElement;
                const type = typeElement?.innerHTML.trim();
                if (type !== 'reference' && !type.startsWith('embed-')) {
                    return;
                }
                await this.renderCodeReferenceBlock(codeBlock, lute);
            });
    }

    async renderCodeReferenceBlock(codeBlock: HTMLElement, lute: Lute) {
        const typeElement = codeBlock.querySelector('.protyle-action__language') as HTMLElement;
        const titleElement = typeElement.nextElementSibling as HTMLElement;
        titleElement.classList.add("protyle-action--first");
        titleElement.classList.add("protyle-action__title__lq");

        const type = typeElement.innerHTML.trim();
        const id = codeBlock.dataset.nodeId;
        const content = await this.getCodeReferenceContent(id);
        const reference = this.parseCodeReference(content, type);

        titleElement.innerHTML = '加载中...';
        let newCode: Element;
        try {
            const mdBlock = await this.createCodeReferenceMd(lute, reference);
            newCode = await this.createCodeReference(mdBlock, reference);
        } catch (e) {
            titleElement.innerHTML = `加载失败: ${e.message}`;
            titleElement.style.color = 'red';
            const errorBlock = codeBlock.querySelector('.hljs > div');
            errorBlock.classList = '';
            errorBlock.innerHTML = `<span style="color: var(--b3-theme-error);">Error: ${e.message}</span>`;
            return;
        }

        const originCode = codeBlock.querySelector('.hljs');
        codeBlock.replaceChild(newCode, originCode);
        codeBlock.querySelector('.protyle-action__language').innerHTML = reference.lang;

        typeElement.innerHTML = reference.lang;
        titleElement.innerHTML = reference.title || titleElement.innerHTML;
        titleElement.title = reference.file.path;
        titleElement.addEventListener('click', () => {
            const isHttp = reference.file.path.startsWith("http");
            const path = isHttp ? reference.file.path : `${window.siyuan.config.system.workspaceDir}/data/${reference.file.path}`;
            console.log(path, getFrontend());
            switch (getFrontend()) {
                case 'desktop':
                case 'desktop-window': {
                    const cp = require('child_process');
                    cp.exec(`start ${path}`);
                    break;
                }
                default: {
                    window.navigator.clipboard.writeText(path);
                    showMessage(`已复制 ${path}`);
                }
            }
        });
        const copyElement = titleElement.nextElementSibling;
        const editElement = document.createElement('span');
        const viewElement = document.createElement('span');

        editElement.innerHTML = copyElement.innerHTML;
        editElement.ariaLabel = this.i18nFmt("actionEdit");
        editElement.className = 'b3-tooltips__nw b3-tooltips protyle-icon rotyle-action__edit';
        editElement.querySelector('use').setAttribute("xlink:href", "#iconEdit");
        editElement.addEventListener('click', () => {
            editElement.parentElement.replaceChild(viewElement, editElement);
            typeElement.innerHTML = type;
            codeBlock.replaceChild(originCode, codeBlock.querySelector('.hljs'));
        });
        copyElement.parentElement.insertBefore(editElement, copyElement.nextElementSibling);

        viewElement.innerHTML = editElement.innerHTML;
        viewElement.ariaLabel = this.i18nFmt("actionView");
        viewElement.className = 'b3-tooltips__nw b3-tooltips protyle-icon rotyle-action__edit';
        viewElement.querySelector('use').setAttribute("xlink:href", "#iconPreview");
        viewElement.addEventListener('click', async () => {
            viewElement.parentElement.replaceChild(editElement, viewElement);
            const content = await this.getCodeReferenceContent(id);
            const reference = this.parseCodeReference(content, type);
            const mdBlock = await this.createCodeReferenceMd(lute, reference);
            const newCode = await this.createCodeReference(mdBlock, reference);
            typeElement.innerHTML = reference.lang;
            titleElement.innerHTML = reference.title || titleElement.innerHTML;
            codeBlock.replaceChild(newCode, codeBlock.querySelector('.hljs'));
        });
    }

    async createCodeReference(md: string, reference: ICodeReference) {
        let block: HTMLElement = document.createElement('div');
        block.innerHTML = md;
        block = block.firstChild as HTMLElement;
        const codeBlock = block.querySelector('.hljs');

        // copy from siyuan src/protyle/render/highlightRender.ts
        const hljsElement = codeBlock.lastElementChild ? codeBlock.lastElementChild : codeBlock;
        if (!window.hljs) {
            await this.addScript('/stage/protyle/js/highlight.js/highlight.min.js', 'protyleHljsScript');
            await this.addScript('/stage/protyle/js/highlight.js/third-languages.js', 'protyleHljsThirdScript');
        }
        const codeText = hljsElement.textContent;
        hljsElement.innerHTML = window.hljs.highlight(
            codeText + (codeText.endsWith("\n") ? "" : "\n"), // https://github.com/siyuan-note/siyuan/issues/4609
            { language: reference.lang, ignoreIllegals: true }
        ).value;

        // 只读
        codeBlock.querySelectorAll("[contenteditable='true']").forEach((e: HTMLElement) => {
            e.contentEditable = "false";
        });

        return codeBlock;
    }

    async createCodeReferenceMd(lute: Lute, reference: ICodeReference) {
        let fullCode = '';
        if (reference.file.path.startsWith("http")) {
            // 网站
            const res = await fetch(reference.file.path);
            if (!res.ok)
                throw new Error(`HTTP error! status: ${res.status}`);
            fullCode = await res.text();
        } else {
            fullCode = await getFile(`/data/${reference.file.path}`);
        }

        // 处理片段
        const codes = []
        const codeLines = fullCode.split('\n');
        reference.lines.forEach(line => {
            if (line.end === -1) {
                codes.push(codeLines.slice(line.start - 1).join('\n'));
            } else {
                codes.push(codeLines.slice(line.start - 1, Math.min(line.end, codeLines.length)).join('\n'));
            }
        });

        // 转换为 Markdown 渲染
        const code = codes.join('\n...\n');
        const markdown = '```' + `${reference.lang}\n${code}` + '\n```';
        return lute.Md2BlockDOM(markdown);
    }

    async getCodeReferenceContent(id: string) {
        const content = (await getBlockKramdown(id)).kramdown.trim();
        return content.substring(content.indexOf('\n'), content.lastIndexOf("```"));
    }

    parseKeyValue(content: string): any {
        const lines = content.split('\n');
        const result = {};
        for (const line of lines) {
            const sp = line.indexOf(':');
            if (sp === -1) continue;
            const key = line.substring(0, sp).trim().toLowerCase();
            const value = line.substring(sp + 1).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
            result[key] = value;
        }
        return result;
    };

    parseCodeReference(content: string, langType: string): ICodeReference {
        let references = {} as ICodeReference;
        const result = this.parseKeyValue(content);
        // 代码路径
        let path: string =
            result.file || result.link || result.filelink || // reference
            result.path;                                     // embed code
        if (!path)
            throw new Error(this.i18nFmt("errorNoFile"));
        if (path.startsWith("@/")) {                        // reference
            path = path.substring(1);
        } else if (path.startsWith("vault://")) {    // embed code
            path = path.substring(7);
        } else if (path.startsWith("[")) {                  // reference
            throw new Error(this.i18nFmt("errorUnsupportedWikilinkReferencePath"));
        }
        references.file = { path };
        // 代码类型
        if (langType.startsWith("embed-")) {
            references.lang = langType.substring(6);
        } else {
            references.lang = result.lang || result.language || references.file.path.split('.').pop();
        }
        // 引用片段
        if (langType === 'reference') {
            // reference: start, end
            const start = result.start || 1;
            const end = result.end || -1;
            references.lines = [{ start, end }];
        } else if (result.lines) {
            // embed code: lines=1-2,3,4-5,6-
            references.lines = [];
            result.lines.split(',').forEach((part: string) => {
                const range = part.split('-');
                if (range.length == 1) {
                    const lineNumber = parseInt(range[0].trim(), 10);
                    if (!lineNumber || lineNumber < 0)
                        throw new Error(this.i18nFmt('errorInvalidInteger', [range[0]]));
                    references.lines.push({
                        start: lineNumber,
                        end: lineNumber,
                    });
                } else if (range.length == 2) {
                    const start = parseInt(range[0].trim(), 10);
                    if (!start || start < 0)
                        throw new Error(this.i18nFmt('errorInvalidInteger', [range[0]]));
                    const end = parseInt(range[1].trim(), 10) || -1;
                    if (end < -1)
                        throw new Error(this.i18nFmt('errorInvalidInteger', [range[1]]));
                    references.lines.push({
                        start: start,
                        end: end,
                    });
                } else {
                    throw new Error(this.i18nFmt('errorInvalidLineRange', [part]));
                }
            })
        } else {
            // reference / embed code
            references.lines = [{
                start: 1,
                end: -1,
            }];
        }
        // 代码标题
        references.title = result.title || references.file.path.split('/').pop();
        return references;
    }

    i18nFmt = (translateKey: string, params: any[] | undefined = undefined) => params ? this.formatString(this.i18n[translateKey], params) : this.i18n[translateKey];

    formatString(str: string, params: string[]) {
        for (let i = 0; i < params.length; i++) {
            str = str.replace(`{${i}}`, params[i]);
        }
        return str;
    };

    // copy from siyuan src/protyle/util/addScript.ts
    async addScript(path: string, id: string) {
        if (document.getElementById(id)) {
            // 脚本加载后再次调用直接返回
            return false;
        }
        const scriptElement = document.createElement("script");
        scriptElement.src = path;
        scriptElement.async = true;
        // 循环调用时 Chrome 不会重复请求 js
        document.head.appendChild(scriptElement);
        scriptElement.onload = () => {
            if (document.getElementById(id)) {
                // 循环调用需清除 DOM 中的 script 标签
                scriptElement.remove();
                return false;
            }
            scriptElement.id = id;
            return true;
        };
    };
}
