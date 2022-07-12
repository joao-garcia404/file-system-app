export default class LineBreakTransformer {
  container: string;
  decoder: TextDecoder;
  constructor() {
    this.container = "";
    this.decoder = new TextDecoder();
  }

  transform(chunk: any, controller: { enqueue: (arg0: string) => void }) {
    this.container += chunk;
    const lines = this.container.split("\r\n");
    while (lines.length > 1) {
      const line = lines.shift()
      line && controller.enqueue(line);
    }
    this.container = lines[0];
  }
  flush(controller: { enqueue: (arg0: string) => void }) {
    controller.enqueue(this.container);
  }
}