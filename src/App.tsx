import { useEffect, useState } from 'react'

import axios from 'axios';

const FILE_LINK = 'https://plin-condominios.s3.sa-east-1.amazonaws.com/44f0f06be281c605c7af2ed65cec48e1-RINGFIX_AMOSTRA.gcode'

function App() {
  // async function downloadWritableFile(blob) {
  //   try {
  //     const handle = await window.showSaveFilePicker({
  //       types: [{
  //         accept: {
  //           // Omitted
  //         },
  //       }],
  //     });

  //     const writable = await handle.createWritable();
  //     await writable.write(blob);
  //     await writable.close();
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

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

      handleSaveFile(response.data)

    } catch (error) {
      console.log(error);
    }
  }

  async function handleSaveFile(fileBlob: Blob) {
    try {
      // // create a new handle
      // const newHandle = await window.showSaveFilePicker();
    
      // // create a FileSystemWritableFileStream to write to
      // const writableStream = await newHandle.createWritable();
    
      // // write our file
      // await writableStream.write(fileBlob);
    
      // // close the file and write the contents to disk.
      // await writableStream.close();

      const root = await navigator.storage.getDirectory();

      const tmpFolder = await root.getDirectoryHandle('tmpFixitFolder', { create: true });
      const tmpFile = await tmpFolder.getFileHandle('tmpFixitFile.txt', { create: true });


      const file = await tmpFile.getFile();

      console.log(file);
      console.log(root)
      console.log(tmpFolder)
      console.log(tmpFile);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className='app_container'>
      <h1>File system</h1>

      <button type="button" className="file_download" onClick={handleDownloadFile}>
        Fazer dowload do arquivo
      </button>
    </div>
  )
}

export default App
