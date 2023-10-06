import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Ably from "ably";
import { RingBuffer, AudioWriter, ParameterWriter } from "ringbuf.js";

import "./App.css";

function Subscriber() {

  // set initial state of application variables
  let isRecording = false;
  let socket;
  let recorder;
  let audioWriter = null;
  let paramWriter = null


  // This is passed in an unsigned 16-bit integer array. It is converted to a 32-bit float array.
  // The first startIndex items are skipped, and only 'length' number of items is converted.
  function int16ToFloat32(inputArray, startIndex, length) {
    var output = new Float32Array(inputArray.length-startIndex);
    let o="";
    let z="";
    for (var i = startIndex; i < length; i++) {
        z = z + `,${inputArray[i]}`
        var int = inputArray[i];
        // If the high bit is on, then it is a negative number, and actually counts backwards.
        var float = (int >= 0x8000) ? -(0x10000 - int) / 0x8000 : int / 0x7FFF;
        o = o + `,${float}`
        output[i] = float;
    }
    console.log(z)
    return output;
  }

  function convertBlock(buffer) { // incoming data is an ArrayBuffer
    var incomingData = new Uint8Array(buffer); // create a uint8 view on the ArrayBuffer
    var i, l = incomingData.length; // length, we need this for the loop
    var outputData = new Float32Array(incomingData.length); // create the Float32Array for output
    for (i = 0; i < l; i++) {
        outputData[i] = (incomingData[i] - 128) / 128.0; // convert audio to float
    }
    return outputData; // return the Float32Array
}

  // runs real-time transcription and handles global variables
  async function run(e) {
    const client = new Ably.Realtime.Promise({
      authUrl: "/api",
    });
    await client.connection.once("connected");
    console.log("Connected to Ably!");
    const channel = client.channels.get("audio-segments");

    const audioContext = new AudioContext();
    audioContext.suspend();

    audioContext.audioWorklet.addModule(new URL('./import-processor', import.meta.url)).then(() => {

      // 50ms of buffer, increase in case of glitches
      const sab = RingBuffer.getStorageForCapacity(
        audioContext.sampleRate / 20,
        Float32Array
      );
      const rb = new RingBuffer(sab, Float32Array);
      audioWriter = new AudioWriter(rb);

      const sab2 = RingBuffer.getStorageForCapacity(31, Uint8Array);
      const rb2 = new RingBuffer(sab2, Uint8Array);
      paramWriter = new ParameterWriter(rb2);

      const n = new AudioWorkletNode(audioContext, "processor", {
        processorOptions: {
          audioQueue: sab,
          paramQueue: sab2,
        },
      });
      n.connect(audioContext.destination);

      channel.subscribe('audio-segment', (m) => {
        if (audioContext.state === "suspended") {
          audioContext.resume();
        }
        console.log(`received ${m.data.byteLength}`)

        //does the export worker interleave before sending through the socket?
        // We should be getting PCM16 data in the subscribers
        //I think it needs to be converted to float16 before putting in the queue
        //m.data is an arrayBuffer

        // Lets try converting the received data to Float32 so that the processor is only dealing with Float32
        //let convertedData = int16ToFloat32(m.data, 0, m.data.byteLength)
        let convertedData = convertBlock(m.data)
        console.log(`${typeof(convertedData)}, ${convertedData.length}`)
        //console.log(convertedData.length);
        //console.log(JSON.stringify(convertedData));
        audioWriter.enqueue(convertedData);
      })
  
    });



    
  };

  return (
    <>
      <header>
        <p>Try AssemblyAI's new real-time transcription endpoint!</p>
      </header>
      <div>
        <p id="real-time-title">Click start to begin listening!</p>
        <p id="button" onClick={run}>Listen</p>
        <p id="message"></p>
      </div>
    </>
  );
}

export default Subscriber;
