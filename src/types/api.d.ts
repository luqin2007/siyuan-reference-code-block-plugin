interface IResGetNotebookConf {
    box: string;
    conf: NotebookConf;
    name: string;
}

interface IReslsNotebooks {
    notebooks: Notebook[];
}

interface IResUpload {
    errFiles: string[];
    succMap: { [key: string]: string };
}

interface IResdoOperations {
    doOperations: doOperation[];
    undoOperations: doOperation[] | null;
}

interface IResGetBlockKramdown {
    id: BlockId;
    kramdown: string;
}

interface IResGetChildBlock {
    id: BlockId;
    type: BlockType;
    subtype?: BlockSubType;
}

interface IResGetTemplates {
    content: string;
    path: string;
}

interface IResReadDir {
    isDir: boolean;
    isSymlink: boolean;
    name: string;
}

interface IResExportMdContent {
    hPath: string;
    content: string;
}

interface IResBootProgress {
    progress: number;
    details: string;
}

interface IResForwardProxy {
    body: string;
    contentType: string;
    elapsed: number;
    headers: { [key: string]: string };
    status: number;
    url: string;
}

interface IResExportResources {
    path: string;
}

/**
 * Gets the document information where the block in
 */
interface IResBlockInfo {
    code: number;
    data: {
        /**
         * Notebook ID
         */
        readonly box: string;
        /**
         * Document path, which needs to start with / and separate levels with /
         * path here corresponds to the database path field
         */
        readonly path: string;
        /**
         * Block ID without parent block
         */
        readonly rootChildID: string;
        /**
         * Document icon
         */
        readonly rootIcon: string;
        /**
         * Document block ID
         */
        readonly rootID: string;
        /**
         * Document title
         */
        readonly rootTitle: string;
    };
    msg: string;
}