import { useEffect, useState } from 'react'

import { Buffer } from 'buffer';

import crypto from 'crypto-js';

import axios from 'axios';

// const FILE_LINK = 'https://plin-condominios.s3.sa-east-1.amazonaws.com/44f0f06be281c605c7af2ed65cec48e1-RINGFIX_AMOSTRA.gcode'
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

      const decoder = new TextDecoder();
      const queuingStrategy = new CountQueuingStrategy({ highWaterMark: 1 });
      const iv = Buffer.alloc(16, 0);
      
      const writableStream = new WritableStream({
        write: (chunk) => {
          const bytes  = crypto.AES.decrypt(chunk, FIXIT_FILE_KEY);
          const decryptedData = bytes.toString(crypto.enc.Utf8);
          console.log(decryptedData); 
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

  return (
    <div className='app_container'>
      <h1>File system</h1>

      <button type="button" className="file_download" onClick={handleSaveFile}>
        Fazer dowload do arquivo
      </button>

      <button type="button" className="file_download" onClick={handleGetFile}>
        Carregar arquivo
      </button>
    </div>
  )
}

export default App
