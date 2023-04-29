import Editor from "./Editor";

export default class Cursor {

    editor: Editor;
    pos: number = 41;
    memorizedCol: number|null = null;

    constructor(editor: Editor) {
        this.editor = editor;
    }

    moveTo(pos: number) {
        this.pos = pos;
    }

    next() {
        if (this.editor.getText().length > this.pos + 1) {
            this.memorizedCol = null;
            this.pos += 1;
        }
    }

    prev() {
        if (this.pos - 1 >= 0) {
            this.memorizedCol = null;
            this.pos -= 1;
        }
    }

    up() {
        const ls = this.editor.lineStarts;
        const pos = this.getCursorPos();
        if (this.memorizedCol === null) {
            this.memorizedCol = pos.col;
        }
        if (pos.line === 0) {
            return;
        }
        const s = ls[pos.line - 1];
        const col = (this.memorizedCol !== null) ? this.memorizedCol : pos.col;
        this.pos = s + Math.min(col, ls[pos.line] - s - 1);
    }

    down() {
        const ls = this.editor.lineStarts;
        const pos = this.getCursorPos();
        if (this.memorizedCol === null) {
            this.memorizedCol = pos.col;
        }
        if (pos.line === ls.length - 1) {
            return;
        }
        const s = ls[pos.line + 1];
        const col = (this.memorizedCol !== null) ? this.memorizedCol : pos.col;
        const t = (ls.length > pos.line + 2) ? ls[pos.line + 2] : this.editor.getText().length - 1;
        this.pos = s + Math.min(col, t - s - 1);
    }

    getCurrentChar(): string {
        return this.editor.getText()[this.pos];
    }

    getCursorPos(): { line: number, col: number } {
        const lineStarts = this.editor.lineStarts;
        let prevLine = 0;
        for (let [i, start] of lineStarts.entries()) {
            if (this.pos < start) {
                break;
            }
            prevLine = i;
        }
        return { line: prevLine, col: this.pos - lineStarts[prevLine] };
    }

}