import { useEffect, useState } from 'react'

import { Buffer } from 'buffer';

import crypto from 'crypto-js';

import axios from 'axios';

const FILE_CLEAR_LINK = 'https://plin-condominios.s3.sa-east-1.amazonaws.com/44f0f06be281c605c7af2ed65cec48e1-RINGFIX_AMOSTRA.gcode'
const FILE_LINK = 'https://test-plin-condominiums-bucket.s3.sa-east-1.amazonaws.com/88f9e85aa462348f42b2a3ef9f3eced5-00c111b282be_RINGFIX_RINGFIX_M.fixit'
const FIXIT_FILE_KEY = '7F24D27FAD171AF2';

function App() {
  var key = crypto.enc.Hex.parse("000102030405060708090a0b0c0d0e0f");
  var iv = crypto.enc.Hex.parse("101112131415161718191a1b1c1d1e1f");

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

  async function handleGetFile() {
    try {
      const root = await navigator.storage.getDirectory();

      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: false });
      const fileHandle = await dirHandle.getFileHandle('ringfixcrypto.fixit', { create: false });

      const file = await fileHandle.getFile();
      const filePath = await dirHandle.resolve(fileHandle);

      const secret_key = crypto.PBKDF2(FIXIT_FILE_KEY, 'salt', { keySize: 24 });
      const buffer = Buffer.alloc(16, 0);
      const iv = crypto.enc.Hex.parse(buffer.toString());
      const aesDecryptor = crypto.algo.AES.createDecryptor(secret_key, { iv: iv });

      const writableStream = new WritableStream({
        write: (chunk) => {
          const bytes = aesDecryptor.process(chunk);
          console.log(bytes);

          const decryptedData = bytes.toString(crypto.enc.Utf8);
          console.log(decryptedData); 
        },
        close: () => {
          aesDecryptor.finalize();
        },

      });

      const fileStream = await file
        .stream()
        .pipeThrough(new TextDecoderStream())
        .pipeTo(writableStream);

    } catch (error) {
      console.log(error)
    }
  }

  async function handleSaveFile() {
    try {
      const root = await navigator.storage.getDirectory();

      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: true });
      const fileHandle = await dirHandle.getFileHandle('ringfixcrypto.fixit', { create: true });

      const writable = await fileHandle.createWritable();
      const response = await fetch(FILE_LINK);
     
      await response.body?.pipeTo(writable);
    } catch (error) {
      console.log(error);
    }
  }

  async function cryptFile() {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: true });
      const fileHandle = await dirHandle.getFileHandle('ringClear.fixit', { create: true });
      const writable = await fileHandle.createWritable();
      const response = await fetch(FILE_CLEAR_LINK);

      var aesEncryptor = crypto.algo.AES.createEncryptor(key, { iv: iv });

      const encoderTransform = new TransformStream({
        transform: (chunk, controller) => {
          const ciphertext = aesEncryptor.process(chunk)
          controller.enqueue(ciphertext.toString(crypto.enc.Base64))
          console.log(ciphertext.toString(crypto.enc.Base64))
        },
        flush: (controller) => {
          const ciphertext = aesEncryptor.finalize()          
          controller.enqueue(ciphertext.toString(crypto.enc.Base64))
        }
      });

      await response.body
        ?.pipeThrough(new TextDecoderStream())
        ?.pipeThrough(encoderTransform)
        .pipeTo(writable);
  }

  async function decryptFile() {
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: false });
      const fileHandle = await dirHandle.getFileHandle('ringClear.fixit', { create: false });

      const file = await fileHandle.getFile();

      var aesDecryptor = crypto.algo.AES.createDecryptor(key, { iv: iv });

      const decoderTransform = new TransformStream({
        transform: (chunk, controller) => {
          const ciphertext = aesDecryptor.process(chunk)
          controller.enqueue(ciphertext)
        },
        flush: (controller) => {
          const ciphertext = aesDecryptor.finalize()          
          controller.enqueue(ciphertext)
        }
      });

      const writableStream = new WritableStream({
        write: (chunk) => {
          console.log(chunk)
          console.log(chunk.toString(crypto.enc.Utf8)); 
        },
      });

      await file
        .stream()
        .pipeThrough(new TextDecoderStream("x-user-defined"))
        .pipeThrough(decoderTransform)
        .pipeTo(writableStream);

    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className='app_container'>
      <h1>File system</h1>

      <button type="button" className="file_download" onClick={handleSaveFile}>
        Fazer dowload do arquivo
      </button>

      <button type="button" className="file_download" onClick={handleGetFile}>
        Carregar arquivo
      </button>

      <button type="button" className="file_download" onClick={cryptFile}>
        Encriptogravar arquivo
      </button>

      <button type="button" className="file_download" onClick={decryptFile}>
        Descriptografar arquivo
      </button>
    </div>
  )
}

export default App
