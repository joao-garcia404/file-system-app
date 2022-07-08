import { useEffect, useState } from 'react'

import { Buffer } from 'buffer';

import crypto from 'crypto-js';

import axios from 'axios';

const FILE_CLEAR_LINK = 'https://plin-condominios.s3.sa-east-1.amazonaws.com/44f0f06be281c605c7af2ed65cec48e1-RINGFIX_AMOSTRA.gcode'
const FILE_LINK = 'https://test-plin-condominiums-bucket.s3.sa-east-1.amazonaws.com/88f9e85aa462348f42b2a3ef9f3eced5-00c111b282be_RINGFIX_RINGFIX_M.fixit'
const FIXIT_FILE_KEY = '7F24D27FAD171AF2';

function App() {
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
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: true });
      const fileHandle = await dirHandle.getFileHandle('ringClear.fixit', { create: true });
      const writable = await fileHandle.createWritable();
      const response = await fetch(FILE_CLEAR_LINK);
    
      await response.body?.pipeTo(writable);
      const file = await fileHandle.getFile();

      const writableStream = new WritableStream({
        write: (chunk) => {
          const ciphertext = crypto.AES.encrypt(chunk, FIXIT_FILE_KEY).toString();

          // const bytes  = crypto.AES.decrypt(ciphertext, FIXIT_FILE_KEY);
          // const originalText = bytes.toString(crypto.enc.Utf8);

          // console.log(ciphertext);
          // console.log(originalText);
        },
      });

      await file
        .stream()
        .pipeThrough(new TextDecoderStream())
        .pipeTo(writableStream);
      
      console.log(file);
      
    } catch (error) {
      console.log(error);
    }
  }

  async function decryptFile() {
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: false });
      const fileHandle = await dirHandle.getFileHandle('ringClear.fixit', { create: false });

      const file = await fileHandle.getFile();

      const writableStream = new WritableStream({
        write: (chunk) => {
          // const ciphertext = crypto.AES.encrypt(chunk, FIXIT_FILE_KEY).toString();

          console.log(chunk);

          // const bytes  = crypto.AES.decrypt(ciphertext, FIXIT_FILE_KEY);
          // const originalText = bytes.toString(crypto.enc.Utf8);

          // console.log(ciphertext);
          // console.log(originalText);
        },
      });

      await file
        .stream()
        .pipeThrough(new TextDecoderStream())
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
