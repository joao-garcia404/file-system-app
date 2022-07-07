import { useEffect, useState } from 'react'

import axios from 'axios';

const FILE_LINK = 'https://plin-condominios.s3.sa-east-1.amazonaws.com/44f0f06be281c605c7af2ed65cec48e1-RINGFIX_AMOSTRA.gcode'

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
      const fileHandle = await dirHandle.getFileHandle('fixitgcode.gcode', { create: false });

      const file = await fileHandle.getFile();
      const filePath = await dirHandle.resolve(fileHandle);

      const decoder = new TextDecoder();
      const queuingStrategy = new CountQueuingStrategy({ highWaterMark: 1 });
      const writableStream = new WritableStream({
        write: (chunk) => {
          console.log(chunk);
        },
      });

      const fileStream = file.stream().pipeThrough(new TextDecoderStream()).pipeTo(writableStream);

      console.log(fileStream);
    } catch (error) {
      console.log(error)
    }
  }

  async function handleSaveFile() {
    try {
      const root = await navigator.storage.getDirectory();

      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: true });
      const fileHandle = await dirHandle.getFileHandle('fixitgcode.gcode', { create: true });

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
