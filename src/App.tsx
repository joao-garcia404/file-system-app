import { useEffect, useState } from 'react'

import axios from 'axios';

const FILE_LINK = 'https://plin-condominios.s3.sa-east-1.amazonaws.com/44f0f06be281c605c7af2ed65cec48e1-RINGFIX_AMOSTRA.gcode'

function App() {
  const [gCode, setGCode] = useState<ReadableStreamDefaultReader<string>>();

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
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      const response = await axios.get(FILE_LINK, { responseType: 'blob' });
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));

      getFileStream(response.data, fileUrl);

      console.log(permission)
    } catch (error) {
      console.log(error);
    }
  }

  async function readGCode() {
    try {
      const { value } = await gCode?.read()!;

      const gCodeLines = value?.split(';');

      console.log(value)

      if (gCodeLines) {
        gCodeLines.map((instruction) => console.log(instruction));
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getFileStream(fileBlob: Blob, fileUrl: string) {
    try {
      const streamObject = fileBlob
        .stream()
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(
          new TransformStream()
        )
        .getReader()
      
      setGCode(streamObject);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (gCode) readGCode();
  }, [gCode]);

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
