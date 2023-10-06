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
        audioWriter.enqueue(m.data);
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
