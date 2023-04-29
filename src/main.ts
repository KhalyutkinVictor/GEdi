// @ts-ignore
import Editor from "./editor/Editor";

(_ => {
    const app = document.getElementById('app');

    if (!app) {
        console.error('APP IS NOT DEFINED');
        return;
    }

    const editor = new Editor(`export default class Cursor {

    pos: number = 0;

    moveTo(pos: number) {
        this.pos = pos;
    }

    next() {
        this.pos += 1;
    }

}
`);

    app.append(editor.getCanvas());

    editor.run();

})();
