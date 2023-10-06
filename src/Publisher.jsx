import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Ably from "ably";
import { RingBuffer } from "ringbuf.js";

import "./App.css";

function Publisher() {

  // set initial state of application variables
  let isRecording = false;
  let socket;
  let recorder;

  // runs real-time transcription and handles global variables
  async function run(e) {
    if (isRecording) {
      if (socket) {
        socket.send(JSON.stringify({ terminate_session: true }));
        socket.close();
        socket = null;
      }

      if (recorder) {
        recorder.pauseRecording();
        recorder = null;
      }
    } else {

      const audioContext = new AudioContext();

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(async (stream) => {
          await audioContext.audioWorklet
            .addModule(new URL('./export-processor', import.meta.url))
            .then((e) => {
              var sab = RingBuffer.getStorageForCapacity(
                audioContext.sampleRate * 2,
                Float32Array
              );

              const worker = new Worker(
                new URL('./worker', import.meta.url),
                {type: 'module'}
              );
              worker.postMessage({
                command: "init",
                sab: sab,
                channelCount: 2,
                sampleRate: audioContext.sampleRate,
              });
              // worker.onmessage = function(e) {}

              const processor = new AudioWorkletNode(
                audioContext,
                "recorder-worklet",
                { processorOptions: sab }
              );

              const microphone = audioContext.createMediaStreamSource(stream);
              microphone.connect(processor).connect(audioContext.destination);

              // Only 10% of event loop relief
              let mainThreadLoad = setInterval(function () {
                var start = Date.now();
                while (Date.now() - start < 90) {}
              }, 100);
            });
        })
        .catch((err) => console.error(err));
    }

    isRecording = !isRecording;
  };

  return (
    <>
      <header>
        <p>Try AssemblyAI's new real-time transcription endpoint!</p>
      </header>
      <div>
        <p id="real-time-title">Click start to begin recording!</p>
        <p id="button" onClick={run}>Start</p>
        <p id="message"></p>
      </div>
    </>
  );
}

export default Publisher;
