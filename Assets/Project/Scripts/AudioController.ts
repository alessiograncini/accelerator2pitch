/**
 * AudioController.ts
 * 
 * Direct TypeScript conversion of DJ Specs AudioController.js
 */

import { FloatArrayWrapper } from "./FloatArrayWrapper";

@component
export class AudioController extends BaseScriptComponent {
    @input
    @hint("Input audio tracks")
    inputTrack: AudioTrackAsset[] = [];

    @input
    @hint("Output audio track for processed audio")
    outputAudio: AudioTrackAsset;

    @input
    @hint("Audio component that plays the output")
    audio: AudioComponent;

    @input
    @hint("Sample rate")
    sampleRate: number = 44100;

    // Public properties (like JS version)
    @input
    @hint("Playback rate/pitch")
    @widget(new SliderWidget(0.0, 3.0, 1.0))
    public rate: number = 1.0;

    @input
    @hint("Volume")
    @widget(new SliderWidget(0.0, 2.0, 1.0))
    public volume: number = 1.0;

    // Module variables (exactly like JS)
    private audioData: FloatArrayWrapper | null = null;
    private audioSource: any = null;
    private audioFrame: Float32Array | null = null;
    private resultFrame: Float32Array | null = null;
    private audioOutput: any = null;
    private phase: number = 0.0;
    private trackOnDeck: boolean = false;
    private audioArrays: FloatArrayWrapper[] = [];

    onAwake(): void {
        // Set up audio output (like JS)
        this.audioOutput = this.outputAudio.control;
        this.audioOutput.sampleRate = this.sampleRate;
        this.audioOutput.loops = -1;

        // Load tracks immediately (like JS)
        this.loadTracks();

        // Auto-start first track if available
        if (this.inputTrack.length > 0) {
            this.setTrack(this.inputTrack[0]);
        }

        // Start audio playback (like JS)
        this.audio.play(-1);

        // Bind play function (like JS)
        this.createEvent("LateUpdateEvent").bind(() => {
            this.play();
        });

        print("AudioController ready - adjust Rate slider to test pitch shifting");
    }

    // Exact copy of JS loadTracks() function
    private loadTracks(): void {
        for (let i = 0; i < this.inputTrack.length; i++) {
            const audioSource = this.inputTrack[i].control as any;
            const audioData = new FloatArrayWrapper();
            const audioFrame = new Float32Array(audioSource.maxFrameSize);
            let audioFrameShape = audioSource.getAudioBuffer(audioFrame, 4096);
            while (audioFrameShape.x !== 0) {
                audioData.push(audioFrame, audioFrameShape.x);
                audioFrameShape = audioSource.getAudioBuffer(audioFrame, 4096);
            }
            this.audioArrays[i] = audioData;
        }
        print("Loaded " + this.inputTrack.length + " tracks");
    }

    // Simplified setTrack - just loads first track
    public setTrack(audioTrack: AudioTrackAsset): void {
        print("SET TRACK");
        this.phase = 0.0;
        this.audioData = this.audioArrays[0]; // Always use first track

        this.audioSource = audioTrack.control;
        this.audioSource.sampleRate = this.sampleRate;
        this.audioSource.loops = 1;

        this.audioFrame = new Float32Array(this.audioSource.maxFrameSize);
        this.resultFrame = new Float32Array(this.audioSource.maxFrameSize);
        this.trackOnDeck = true;
        print("Track on deck - adjust Rate slider!");
    }

    // Simplified play() function - just one track
    private play(): void {
        const size = this.audioOutput.getPreferredFrameSize();

        if (!this.resultFrame || !this.trackOnDeck || !this.audioData) return;

        for (let i = 0; i < size; i++) {
            this.phase += this.rate;
            const audioSourceUpdateData = this.audioData.getElement(Math.round(this.phase)) * this.volume;
            this.resultFrame[i] = audioSourceUpdateData;
        }

        // Handle looping
        if (this.phase >= this.audioData.getSize() || this.rate === 0) {
            this.phase = 0;
        }
        
        this.audioOutput.enqueueAudioFrame(this.resultFrame, new vec3(size, 1, 1));
    }
}