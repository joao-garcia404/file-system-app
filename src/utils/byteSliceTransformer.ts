export default class ByteSliceTransformer {
  chunkSize: number;
  container: Uint8Array;
  constructor(chunkSize: number) {
    this.chunkSize = chunkSize;
    this.container = new TextEncoder().encode('')
  }

  transform(chunk: Uint8Array, controller: { enqueue: (arg0: Uint8Array) => void }) {
    this.container = new Uint8Array([ ...this.container,  ...chunk]);

    while(this.container.length > this.chunkSize) {
      const passForwardChunk = this.container.slice(0, this.chunkSize);
      controller.enqueue(passForwardChunk);
      this.container = this.container.slice(this.chunkSize)
    }
  }
  flush(controller: { enqueue: (arg0: Uint8Array) => void }) {
    controller.enqueue(this.container);
  }
}