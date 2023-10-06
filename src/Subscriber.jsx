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

  // function convertBlock(buffer) { // incoming data is an ArrayBuffer
  //   var incomingData = new Uint8Array(buffer); // create a uint8 view on the ArrayBuffer
  //   var i, l = incomingData.length; // length, we need this for the loop
  //   var outputData = new Float32Array(incomingData.length); // create the Float32Array for output
  //   for (i = 0; i < l; i++) {
  //       outputData[i] = (incomingData[i] - 128) / 128.0; // convert audio to float
  //   }
  //   return outputData; // return the Float32Array
  // }

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
        //console.log(`received ${m.data.byteLength}`)

        //does the export worker interleave before sending through the socket?
        // We should be getting PCM16 data in the subscribers
        //I think it needs to be converted to float16 before putting in the queue
        //m.data is an arrayBuffer

        //INcoming data is an arraybuffer that I think contans Int16Array data (thats what the publisher converts to before pusblishing
        var int16Array = new Int16Array(m.data, 0, Math.floor(m.data.byteLength / 2));

        //Converting from arraybuffer to Float32Array gets us noise but not the mic sound
        //The publisher interleaves the audio before sending it over the socket, do I need to deinterleave?
        //let convertedBuffer = convertBlock(m.data)
        let convertedBuffer = new Float32Array(int16Array.buffer);
        console.log(`${convertedBuffer.toString()}, ${convertedBuffer.length}`)



        audioWriter.enqueue(convertedBuffer);
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
