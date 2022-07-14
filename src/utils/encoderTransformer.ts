export default class EncoderTransformer {
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
    const encryptedFile = await crypto.subtle.encrypt(
      {...this.algo, counter: new TextEncoder().encode(conuterText).slice(0, 16)},
        this.encryptionKey,
        chunk,
      )

    console.log(encryptedFile)
    //console.log(new TextDecoder().decode(encryptedFile))
      
    controller.enqueue(encryptedFile);
  }
}