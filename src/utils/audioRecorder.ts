/**
 * Audio Recorder Utility
 * Handles browser-based audio recording using MediaRecorder API
 */

export interface AudioRecorderConfig {
  mimeType?: string;
  audioBitsPerSecond?: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private timerInterval: number | null = null;
  private recordingTime: number = 0;
  private onTimeUpdate?: (seconds: number) => void;

  constructor(private config: AudioRecorderConfig = {}) {
    this.config = {
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000,
      ...config,
    };
  }

  async start(onTimeUpdate?: (seconds: number) => void): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder
      const options: MediaRecorderOptions = {};
      if (this.config.mimeType && MediaRecorder.isTypeSupported(this.config.mimeType)) {
        options.mimeType = this.config.mimeType;
      }
      if (this.config.audioBitsPerSecond) {
        options.audioBitsPerSecond = this.config.audioBitsPerSecond;
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];
      this.recordingTime = 0;
      this.onTimeUpdate = onTimeUpdate;

      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();

      // Start timer
      this.timerInterval = window.setInterval(() => {
        this.recordingTime += 1;
        if (this.onTimeUpdate) {
          this.onTimeUpdate(this.recordingTime);
        }
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Microphone access denied or not available');
    }
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: this.config.mimeType || 'audio/webm',
        });
        
        // Clean up
        this.cleanup();
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private cleanup(): void {
    // Stop timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.recordingTime = 0;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  getRecordingTime(): number {
    return this.recordingTime;
  }

  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  static async checkMicrophonePermission(): Promise<PermissionState | null> {
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return result.state;
      }
      return null;
    } catch (error) {
      console.warn('Permission API not supported:', error);
      return null;
    }
  }
}

// Utility function to format recording time
export const formatRecordingTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Utility function to play audio blob
export const playAudioBlob = (blob: Blob): HTMLAudioElement => {
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  
  // Clean up URL when audio finishes or is unloaded
  audio.onended = () => URL.revokeObjectURL(audioUrl);
  audio.onerror = () => URL.revokeObjectURL(audioUrl);
  
  audio.play();
  return audio;
};
