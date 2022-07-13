import { useEffect, useState } from 'react'

import { atob, Buffer } from 'buffer';

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

function App() {
  // var key = crypto.enc.Hex.parse("000102030405060708090a0b0c0d0e0f");
  // var iv = crypto.enc.Hex.parse("101112131415161718191a1b1c1d1e1f");

  async function verifyDiskSpace() {
    if (navigator.storage && navigator.storage.estimate) {
      const quota = await navigator.storage.estimate();

      if (quota?.quota && quota?.usage) {
        const bytesAvailable = quota?.quota - quota?.usage
        const percentageUsed = (quota.usage / quota.quota) * 100;
        // quota.usage -> Number of bytes used.
        // quota.quota -> Maximum number of bytes available.
      }
    }
  }

  async function handleDownloadFile() {
    try {
      const response = await axios.get(FILE_LINK, { responseType: 'blob' });
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));

      // handleSaveFile(response.data)

    } catch (error) {
      console.log(error);
    }
  }

  // async function handleGetFile() {
  //   try {
  //     const root = await navigator.storage.getDirectory();

  //     const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: false });
  //     const fileHandle = await dirHandle.getFileHandle('ringfixcrypto.fixit', { create: false });

  //     const file = await fileHandle.getFile();
  //     const filePath = await dirHandle.resolve(fileHandle);

  //     const secret_key = crypto.PBKDF2(FIXIT_FILE_KEY, 'salt', { keySize: 24 });
  //     const buffer = Buffer.alloc(16, 0);
  //     const iv = crypto.enc.Hex.parse(buffer.toString());
  //     const aesDecryptor = crypto.algo.AES.createDecryptor(secret_key, { iv: iv });

  //     const writableStream = new WritableStream({
  //       write: (chunk) => {
  //         const bytes = aesDecryptor.process(chunk);
  //         console.log(bytes);

  //         const decryptedData = bytes.toString(crypto.enc.Utf8);
  //         console.log(decryptedData); 
  //       },
  //       close: () => {
  //         aesDecryptor.finalize();
  //       },

  //     });

  //     const fileStream = await file
  //       .stream()
  //       .pipeThrough(new TextDecoderStream())
  //       .pipeTo(writableStream);

  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  async function handleSaveFile() {
    try {
      const root = await navigator.storage.getDirectory();

      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: true });
      const fileHandle = await dirHandle.getFileHandle('ringClearcrypted.gcode', { create: true });

      const writable = await fileHandle.createWritable();
      const response = await fetch(FILE_CLEAR_LINK);
     
      await response.body?.pipeTo(writable);
    } catch (error) {
      console.log(error);
    }
  }

  // async function cryptFile() {
  //     const root = await navigator.storage.getDirectory();
  //     const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: true });
  //     const fileHandle = await dirHandle.getFileHandle('ringClearcrypted.gcode', { create: true });
  //     const writable = await fileHandle.createWritable();
  //     const response = await fetch(FILE_CLEAR_LINK);
    
  //     // var aesEncryptor = crypto.algo.AES.createEncryptor(key, { iv: iv });
    
  //     const encoderTransform = new TransformStream({
  //       transform: async (chunk, controller) => {
  //         const ciphertext = await crypto.subtle.encrypt({
  //           name: 'AES-CBC',
  //           iv,
  //         }, key, ec.encode(plaintext));

  //         controller.enqueue(ciphertext.toString(crypto.enc.Base64))
  //         console.log(ciphertext.toString(crypto.enc.Base64))
  //       },
  //       flush: (controller) => {
  //         const ciphertext = aesEncryptor.finalize()          
  //         controller.enqueue(ciphertext.toString(crypto.enc.Base64))
  //       }
  //     });

  //     await response.body
  //       ?.pipeThrough(new TextDecoderStream())
  //       ?.pipeThrough(encoderTransform)
  //       .pipeTo(writable);
  // }

  async function encryptFile() {
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: true });
      const fileHandle = await dirHandle.getFileHandle('ringClearcrypted.gcode', { create: true });
      const writable = await fileHandle.createWritable();
      const response = await fetch(FILE_CLEAR_LINK);

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
      
      const file = await fileHandle.getFile();
      const fileStream = await file
        .stream()
        .pipeThrough(new TextDecoderStream())
        .getReader()
        .read();

      console.log(fileStream.value);
      
    } catch (error) {
      console.log(error);
    }
  }

  async function decryptFile() {
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: false });
      const fileHandle = await dirHandle.getFileHandle('ringClearcrypted.gcode', { create: false });
      const file = await fileHandle.getFile();

      const newDecryptFile = await dirHandle.getFileHandle('ringDecypted.gcode', { create: true });
      const writable = await newDecryptFile.createWritable();

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
  
        console.log(fileStream.value);
    } catch (error) {
      console.log(error);
    }
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

      <button type="button" className="file_download" onClick={handleSaveFile}>
        Fazer dowload do arquivo
      </button>

      <button type="button" className="file_download" onClick={() => {
        // handleGetFile()
      }}>
        Carregar arquivo
      </button>

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
