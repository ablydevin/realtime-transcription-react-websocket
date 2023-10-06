const exports = {};
import { AudioReader, RingBuffer, ParameterReader, deinterleave } from "ringbuf";

class Processor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [];
  }

  constructor(options) {
    super(options);
    this.interleaved = new Float32Array(128);
    this.deinterleaved = new Float32Array(1024);
    this.amp = 1.0;
    this.o = { index: 0, value: 0 };
    const { audioQueue, paramQueue } = options.processorOptions;
    this._audio_reader = new AudioReader(
      new RingBuffer(audioQueue, Float32Array)
    );
    this._param_reader = new ParameterReader(
      new RingBuffer(paramQueue, Uint8Array)
    );
  }

  process(inputs, outputs, parameters) {
    // Get any param changes
    if (this._param_reader.dequeue_change(this.o)) {
      this.amp = this.o.value;
    }

    // read 128 frames from the queue, deinterleave, and write to output
    // buffers.
    
    // This qqueuedata should be in the forma of an interleaved Float32Array

    this._audio_reader.dequeue(this.interleaved);
    //deinterleave(this.interleaved, this.deinterleaved);
    //do I have to deinterleave?
    //console.log(`dequeing ${this.interleaved.length}`)

    let logstring = ""
    for (let i = 0; i < 128; i++) {      
      //logstring = logstring + `,${this.interleaved[i]}`
      outputs[0][0][i] = this.amp * this.interleaved[i];      
    }
    console.log(logstring)


    return true;
  }
}

registerProcessor("processor", Processor);