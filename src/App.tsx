import { useEffect, useState } from 'react'

import axios from 'axios';
import LineBreakTransformer from './utils/lineBreakTransformer';

const TEXT_FILE_LINK = 'https://test-plin-condominiums-bucket.s3.sa-east-1.amazonaws.com/dd6759b095b209b58b5eb54f5dc0e366-texto-teste.docx'
const FILE_CLEAR_LINK = 'https://plin-condominios.s3.sa-east-1.amazonaws.com/44f0f06be281c605c7af2ed65cec48e1-RINGFIX_AMOSTRA.gcode'
const FILE_LINK = 'https://test-plin-condominiums-bucket.s3.sa-east-1.amazonaws.com/88f9e85aa462348f42b2a3ef9f3eced5-00c111b282be_RINGFIX_RINGFIX_M.fixit'
const FIXIT_FILE_KEY = '7F24D27FAD171AF2';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// const iv = crypto.getRandomValues(new Uint8Array(16));
const algorithm = 'AES-CTR';
const iv = encoder.encode("1011121314151617");
const key_encoded = await crypto.subtle.importKey(
  "raw", encoder.encode(FIXIT_FILE_KEY), algorithm, false, ["encrypt", "decrypt"]
);

const algo = {
  name: 'AES-GCM',
  length: 256
}

function App() {
  const [masterPassword, setMasterPassword] = useState<CryptoKey>()

  useEffect(() => {
    if (FIXIT_FILE_KEY) {
      crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(FIXIT_FILE_KEY),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      ).then(key => {
        console.log(key)
        setMasterPassword(key)
      })
    }
  }, [FIXIT_FILE_KEY])

  async function getEncryptionKey() {
    if (!masterPassword) {
      throw new Error("No masterpassword")
    }

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(FIXIT_FILE_KEY),
        hash: { name: 'SHA-1'},
        iterations: 1000,
      },
      masterPassword,
      algo,
      false,
      [ 'encrypt', 'decrypt' ]
    )
  }

  async function encryptFile() {
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: true });
      const fileHandle = await dirHandle.getFileHandle('ringClearcrypted.gcode', { create: true });
      const writable = await fileHandle.createWritable({keepExistingData: false});
      const response = await fetch(FILE_CLEAR_LINK);

      if (!masterPassword) {
        return;
      }

      const file = await fileHandle.getFile();
      console.log(file.name)
      console.log(file.arrayBuffer())

      const blob = file.slice(0, 16)

      const encryptedFile = await crypto.subtle.encrypt(
        {...algo, iv: new TextEncoder().encode(file.name)},
        await getEncryptionKey(),
        await blob.arrayBuffer(),
      )

      console.log(new TextDecoder().decode(encryptedFile))
      await writable.write(new TextDecoder().decode(encryptedFile));
      await writable.close()

      const fileEncrypted = await fileHandle.getFile();
      const fileStream = await fileEncrypted
        .stream()
        .pipeThrough(new TextDecoderStream())
        .getReader()
        .read();

      console.log(fileStream.value);

      return;

      const encoderTransform = new TransformStream({
        transform: async (chunk, controller) => {
          const decodedText = new TextDecoder().decode(chunk);
          const cipherText = await crypto.subtle.encrypt(
            {
              name: algorithm,
              length: 64,
              counter: iv,
            },
            key_encoded,
            Buffer.from(decodedText)
          )

          //const base64Data = cipherText.toString('base64'));

          controller.enqueue(cipherText);
        },
        flush: (controller) => {
        }
      });

      const decoderTransform = new TransformStream({
        transform: async (chunk, controller) => {
          // const encodedChunk = encoder.encode(chunk);

          const cipherText = await crypto.subtle.decrypt(
            {
              name: algorithm,
              length: 64,
              counter: iv,
            },
            key_encoded,
            chunk
          )
          
          controller.enqueue(cipherText);
        },
      });


      await response.body
        ?.pipeThrough(encoderTransform)
        // ?.pipeThrough(decoderTransform)
        .pipeTo(writable);
      
    } catch (error) {
      console.log(error);
    }
  }

  async function decryptFile() {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: false });
      const fileHandle = await dirHandle.getFileHandle('ringClearcrypted.gcode', { create: false });
      const file = await fileHandle.getFile();

      // const newDecryptFile = await dirHandle.getFileHandle('ringDecypted.gcode', { create: true });
      // const writable = await newDecryptFile.createWritable();

      console.log(new TextDecoder().decode(await file.arrayBuffer()))

      console.log(file.name)
        crypto.subtle.decrypt(
          {...algo, iv: new TextEncoder().encode(file.name)},
          await getEncryptionKey(),
          await file.arrayBuffer(),
        ).then(decryptedFile => {
          console.log(decryptedFile)
        }).catch(err => {
          console.log(err.code)
          console.error(err)
        })
/*
      return;

      const decoderTransform = new TransformStream({
        transform: async (chunk, controller) => {
          const cipherText = await crypto.subtle.decrypt(
            {
              name: algorithm,
              length: 64,
              counter: iv,
            },
            key_encoded,
            Buffer.from(chunk, 'base64')
          )
          
          controller.enqueue(cipherText);
        },
      });

      await file
        .stream()
        .pipeThrough(decoderTransform)
        .pipeThrough(new TextDecoderStream())
        .pipeTo(writable)
      
      
        const decrypted = await newDecryptFile.getFile();
        const fileStream = await decrypted
          .stream()
          .pipeThrough(new TextDecoderStream())
          .getReader()
          .read();
  
        console.log(fileStream.value);*/
  }

  // async function decryptFile() {
  //   try {
  //     const root = await navigator.storage.getDirectory();
  //     const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: false });
  //     const fileHandle = await dirHandle.getFileHandle('ringClearcrypted.gcode', { create: false });

  //     const file = await fileHandle.getFile();

  //     var aesDecryptor = crypto.algo.AES.createDecryptor(key, { iv: iv });

  //     const wordArray = crypto.lib.WordArray.create();

  //     const decoderTransform = new TransformStream({
  //       transform: (chunk, controller) => {
  //         const ciphertext = aesDecryptor.process(chunk)
  //         controller.enqueue(ciphertext)
  //       },
  //       flush: (controller) => {
  //         const ciphertext = aesDecryptor.finalize()          
  //         controller.enqueue(ciphertext)
  //       }
  //     });

  //     const writableStream = new WritableStream({
  //       write: (chunk) => {
  //         // console.log(chunk)
  //         // console.log(chunk.toString(crypto.enc.Base64));

  //         // wordArray.concat(chunk);
  //       },
  //     });

  //     await file
  //       .stream()
  //       .pipeThrough(new TextDecoderStream("x-user-defined"))
  //       .pipeThrough(decoderTransform)
  //       .pipeTo(writableStream);
      
  //     // console.log(wordArray.toString(crypto.enc.Base64));
  //     // console.log(wordArray.toString(crypto.enc.Utf8));
      
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  return (
    <div className='app_container'>
      <h1>File system</h1>

      <button type="button" className="file_download" onClick={() => {
        // cryptFile()
        encryptFile()
      }}>
        Criptografar arquivo
      </button>

      <button type="button" className="file_download" onClick={() => {
        // decryptFile()
        decryptFile()
      }}>
        Descriptografar arquivo
      </button>
    </div>
  )
}

export default App
