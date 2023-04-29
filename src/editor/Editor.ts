import Cursor from "./Cursor";

export default class Editor {

    canvas: null|HTMLCanvasElement = null;
    w: number = 100;
    h: number = 100;
    private text: string = '';
    cursor = new Cursor(this);
    fontSize: number = 32;
    debug: boolean = false;
    lineStarts: Array<number> = [0];
    lineEnding = "\n";

    private ctx: CanvasRenderingContext2D|undefined = undefined;

    gapBetweenLines = 1;
    lineGapCoef = 0.2;
    gapBetweenChars = 1;
    charGapCoef = 0.025;

    charWidth: number = 0;
    font = '16px monospace';

    cursorBlinkingDurationMs = 1000;

    fillStyle = 'rgb(0, 0, 0)';
    strokeStyle = 'rgb(0, 0, 0)';

    private colorScheme = {
        text: 'rgb(0, 0, 0)',
        cursor: 'rgb(0, 0, 0)',
        textUnderCursor: 'rgb(255, 255, 255)'
    };

    public isRunnig = false;

    constructor(text: string, w = 1904, h = 984) {
        this.initCanvas();
        this.setText(text);
        this.setCanvasSize({w, h});
        this.setFont(`${this.fontSize}px monospace`);
    }

    public setFont(font: string) {
        this.font = font;
        const ctx = this.getContext();
        ctx.font = this.font;
        const m = ctx.measureText('a');
        this.charWidth = m.width;
        ctx.restore();
    }

    private write(char: string) {
        const pos = this.cursor.pos;
        const text = this.getText();
        this.setText(text.slice(0, pos) + char + text.slice(pos));
        this.cursor.next();
    }

    private remove() {
        const pos = this.cursor.pos;
        if (pos - 1 < 0) {
            return;
        }
        const text = this.getText();
        this.setText(text.slice(0, pos - 1) + text.slice(pos));
        this.cursor.prev();
    }

    private delete() {
        const pos = this.cursor.pos;
        const text = this.getText();
        if (pos + 1 >= text.length) {
            return;
        }
        this.setText(text.slice(0, pos) + text.slice(pos + 1));
    }

    private initCanvas() {
        this.canvas = document.createElement('canvas');
        window.addEventListener('keydown', (e) => {
            e.preventDefault();
            if (e.key.length === 1 && !e.altKey && !e.ctrlKey) {
                this.write(e.key);
            }

            switch (e.code) {
                case 'ArrowUp':
                    this.cursor.up();
                    break;
                case 'ArrowDown':
                    this.cursor.down();
                    break;
                case 'ArrowRight':
                    this.cursor.next();
                    break;
                case 'ArrowLeft':
                    this.cursor.prev();
                    break;
                case 'Backspace':
                    this.remove();
                    break;
                case 'Enter':
                    this.write("\n");
                    break;
                case 'Delete':
                    this.delete();
                    break;
            }
        });
    }

    private setText(text: string) {
        this.text = text;
        this.reindexText();
    }

    public getText(): string {
        return this.text;
    }

    private reindexText() {
        this.lineStarts = [0];
        let lePos = this.text.indexOf(this.lineEnding);
        while (lePos !== -1) {
            this.lineStarts.push(lePos + 1);
            lePos = this.text.indexOf(`\n`, lePos + 1);
        }
        if (this.lineStarts[this.lineStarts.length - 1] >= this.text.length && this.text.length > 0) {
            this.lineStarts.pop();
        }
    }

    private setCanvasSize(size: {w: number, h: number}) {
        if (!this.canvas) {
            throw new Error('Canvas is not defined');
        }
        this.canvas.width = size.w;
        this.canvas.height = size.h;
    }

    public getCanvas(): HTMLCanvasElement {
        return <HTMLCanvasElement>this.canvas;
    }

    private getContext(): CanvasRenderingContext2D {
        if (!this.ctx) {
            const ctx = this.canvas?.getContext('2d');
            if (!ctx) {
                throw new Error('Context is not defined');
            }
            this.ctx = ctx;
        }
        return this.ctx;
    }

    // @ts-ignore Не используемый метод
    private drawLine(x1: number, y1: number, x2: number, y2: number) {
        const ctx = this.getContext();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.moveTo(0, 0);
    }

    private drawText(col: number, line: number, text: string) {
        const ctx = this.getContext();
        ctx.font = this.font;
        ctx.fillStyle = this.fillStyle;
        const offset = (this.fontSize - this.charWidth) / 2;

        const x = col * this.charWidth + col * this.fontSize * this.charGapCoef * this.gapBetweenChars;
        const y = line * this.fontSize + line * this.fontSize * this.lineGapCoef * this.gapBetweenLines;
        ctx.fillText(text, x + offset, y + this.fontSize);
    }

    private renderText() {
        const drawPosition = { line: 0, col: 0 };

        this.fillStyle = this.colorScheme.text;
        for (let char of this.text.split('')) {
            if (char === this.lineEnding) {
                drawPosition.col = 0;
                drawPosition.line++;
                continue;
            }
            this.drawText(drawPosition.col, drawPosition.line, char);
            drawPosition.col++;
        }
    }

    private renderCursor() {
        const ctx = this.getContext();

        ctx.font = `${this.fontSize}px monospace`;
        ctx.strokeStyle = this.colorScheme.cursor;
        ctx.fillStyle = this.colorScheme.cursor;
        const m = ctx.measureText('a');
        const offset= (this.fontSize - m.width) / 2;
        const pos = this.cursor.getCursorPos();

        const nowTime = Date.now();
        const x = pos.col * this.charWidth + pos.col * this.fontSize * this.charGapCoef * this.gapBetweenChars + offset - 1;
        const y = pos.line * this.fontSize + pos.line * this.fontSize * this.lineGapCoef * this.gapBetweenLines;
        const w = m.width + 1;
        const h = this.fontSize + this.lineGapCoef * this.fontSize + 0.5 * this.fontSize * this.lineGapCoef * this.gapBetweenLines;

        if ((nowTime % this.cursorBlinkingDurationMs) > this.cursorBlinkingDurationMs / 2) {
            ctx.strokeRect(x, y, w, h);
        } else {
            ctx.fillRect(x, y, w, h);
            this.fillStyle = this.colorScheme.textUnderCursor;
            this.drawText(pos.col, pos.line, this.cursor.getCurrentChar());
        }
    }

    private render() {
        const ctx = this.getContext();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.renderText();
        this.renderCursor();
    }

    public run() {
        if (this.isRunnig) {
            throw new Error('Editor is already running');
        }
        const callback = () => {
            this.render();
            if (this.isRunnig) {
                window.requestAnimationFrame(callback);
            }
        }
        window.requestAnimationFrame(callback);
        this.isRunnig = true;
    }

}