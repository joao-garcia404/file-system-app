export default class DecoderTransformer {
  count: number;
  file_name: string;
  algo: any;
  encryptionKey: CryptoKey;
  constructor(file_name: string, algo: any, encryptionKey: CryptoKey) {
    this.count = 0;
    this.file_name = file_name;
    this.algo = algo;
    this.encryptionKey = encryptionKey;
  }

  async transform(chunk: Uint8Array, controller: { enqueue: (arg0: Uint8Array) => void }) {
    const conuterText = this.count + this.file_name;
    this.count++;

    const decryptedFile = await crypto.subtle.decrypt(
        {...this.algo, counter: new TextEncoder().encode(conuterText).slice(0, 16)},
        this.encryptionKey,
        chunk,
      )

    console.log(new TextDecoder().decode(decryptedFile))
      
    controller.enqueue(decryptedFile);
  }
}