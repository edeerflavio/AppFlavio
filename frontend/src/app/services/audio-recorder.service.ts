import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AudioRecorderService {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;

    async startRecording(): Promise<void> {
        if (this.mediaRecorder) {
            return;
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    }

    stopRecording(): Promise<Blob> {
        return new Promise((resolve) => {
            if (!this.mediaRecorder) {
                resolve(new Blob());
                return;
            }

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.stopStream();
                this.mediaRecorder = null;
                resolve(audioBlob);
            };

            this.mediaRecorder.stop();
        });
    }

    private stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}
