import { useEffect, useState } from 'react'

import axios from 'axios';
import LineBreakTransformer from './utils/lineBreakTransformer';
import ByteSliceTransformer from './utils/byteSliceTransformer';
import EncoderTransformer from './utils/encoderTransformer';
import DecoderTransformer from './utils/decoderTransformer';

const TEXT_FILE_LINK = 'https://test-plin-condominiums-bucket.s3.sa-east-1.amazonaws.com/dd6759b095b209b58b5eb54f5dc0e366-texto-teste.docx'
const FILE_CLEAR_LINK = 'https://plin-condominios.s3.sa-east-1.amazonaws.com/44f0f06be281c605c7af2ed65cec48e1-RINGFIX_AMOSTRA.gcode'
const FILE_LINK = 'https://test-plin-condominiums-bucket.s3.sa-east-1.amazonaws.com/88f9e85aa462348f42b2a3ef9f3eced5-00c111b282be_RINGFIX_RINGFIX_M.fixit'
const FIXIT_FILE_KEY = '7F24D27FAD171AF2';
const CHUNK_SIZE = 1024;

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


const algoCTR = {
  name: 'AES-CTR',
  length: 128
}

function App() {

  useEffect(() => {
    if (FIXIT_FILE_KEY) {
      
    }
  }, [FIXIT_FILE_KEY])

  async function getEncryptionKey() {
     const masterPassword = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(FIXIT_FILE_KEY),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(FIXIT_FILE_KEY.length + ""),
        hash: { name: 'SHA-1'},
        iterations: 1000,
      },
      masterPassword,
      algoCTR,
      false,
      [ 'encrypt', 'decrypt' ]
    )
  }

  async function encryptFileInteiro() {
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: true });
      const fileHandle = await dirHandle.getFileHandle('ringClearcrypted.gcode', { create: true });
      const writable = await fileHandle.createWritable({keepExistingData: false});
      const response = await fetch(FILE_CLEAR_LINK);

      const file = await fileHandle.getFile();
      console.log(file.name)
      // console.log(await file.arrayBuffer())


      const dataArray = await response.arrayBuffer()
      // const blob = dataArray.slice(0, 4096)
      console.log(new TextDecoder().decode(dataArray))

      const encryptedFile = await crypto.subtle.encrypt(
        {...algoCTR, counter: new TextEncoder().encode(file.name).slice(0, 16)},
        await getEncryptionKey(),
        dataArray,
      )

      console.log(new TextDecoder().decode(encryptedFile))
      await writable.write(encryptedFile);
      await writable.close()

      const fileEncrypted = await fileHandle.getFile();
      const fileStream = await fileEncrypted
        .stream()
        .pipeThrough(new TextDecoderStream())
        .getReader()
        .read();

      console.log(fileStream.value);
      
    } catch (error) {
      console.log(error);
    }
  }



  async function decryptFileInteiro() {
    const root = await navigator.storage.getDirectory();
    const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: false });
    const fileHandle = await dirHandle.getFileHandle('ringClearcrypted.gcode', { create: false });
    const file = await fileHandle.getFile();

    // const newDecryptFile = await dirHandle.getFileHandle('ringDecypted.gcode', { create: true });
    // const writable = await newDecryptFile.createWritable();

    console.log(new TextDecoder().decode(await file.arrayBuffer()))

    console.log(file.name)
    const decryptedFile = await crypto.subtle.decrypt(
        {...algoCTR, counter: new TextEncoder().encode(file.name).slice(0, 16)},
        await getEncryptionKey(),
        await file.arrayBuffer(),
      )

    console.log(new TextDecoder().decode(decryptedFile))
  }


  async function encryptFile() {
    try {
      const root = await navigator.storage.getDirectory();
      const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: true });
      const fileHandle = await dirHandle.getFileHandle('ringClearcrypted.gcode', { create: true });
      const writable = await fileHandle.createWritable({keepExistingData: false});
      const response = await fetch(FILE_CLEAR_LINK);

      const file = await fileHandle.getFile();
      console.log(file.name)
      // console.log(await file.arrayBuffer())


      //const dataArray = await response.arrayBuffer()
      // const blob = dataArray.slice(0, 4096)
      //console.log(new TextDecoder().decode(dataArray))

      // await writable.write(encryptedFile);
      // await writable.close()


      const encoderTransform = new TransformStream({
        transform: async (chunk, controller) => {
          const encryptedFile = await crypto.subtle.encrypt(
            {...algoCTR, counter: new TextEncoder().encode(file.name).slice(0, 16)},
              await getEncryptionKey(),
              chunk,
            )
      
          console.log(new TextDecoder().decode(encryptedFile))
            

          //const base64Data = cipherText.toString('base64'));

          controller.enqueue(encryptedFile);
        },
        flush: (controller) => {
        }
      });

      await response.body
        ?.pipeThrough(new TransformStream(new ByteSliceTransformer(CHUNK_SIZE)))
        ?.pipeThrough(new TransformStream(new EncoderTransformer(file.name, algoCTR, await getEncryptionKey())))
        // ?.pipeThrough(encoderTransform)
        .pipeTo(writable);
      
      const fileEncrypted = await fileHandle.getFile();
      const fileStream = await fileEncrypted
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
    const root = await navigator.storage.getDirectory();
    const dirHandle = await root.getDirectoryHandle('tmpFixitFolder', { create: false });
    const fileHandle = await dirHandle.getFileHandle('ringClearcrypted.gcode', { create: false });
    const file = await fileHandle.getFile();
    const writable = await fileHandle.createWritable();


    await file
      .stream()
      ?.pipeThrough(new TransformStream(new ByteSliceTransformer(CHUNK_SIZE)))
      ?.pipeThrough(new TransformStream(new DecoderTransformer(file.name, algoCTR, await getEncryptionKey())))
      .pipeThrough(new TextDecoderStream())
      .pipeTo(writable)
  }

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
