import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Mock SDK for demo purposes
class MockSolaceSDK {
  async initialize() {
    console.log('Mock SDK initialized');
  }
  
  async encrypt(data) {
    return {
      iv: btoa('mock-iv'),
      ciphertext: btoa('mock-ciphertext'),
      tag: btoa('mock-tag')
    };
  }
  
  async generateKey() {
    return new ArrayBuffer(32);
  }
  
  async uploadBlob(blob) {
    return 'mock-blob-key-' + Date.now();
  }
  
  async downloadAndDecrypt(blobKey, key) {
    return 'Decrypted: This is a mock decrypted message from the demo!';
  }
}

function App() {
  const [sdk, setSdk] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [recordingStats, setRecordingStats] = useState({
    duration: 0,
    framesCaptured: 0,
    voiceFrames: 0
  });
  
  const startTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const encryptionKeyRef = useRef(null);
  const uploadedBlobKeyRef = useRef('');

  // Initialize SDK on component mount
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const sdkInstance = new MockSolaceSDK();
        await sdkInstance.initialize();
        setSdk(sdkInstance);
        
        // Generate encryption key
        encryptionKeyRef.current = await sdkInstance.generateKey();
        
        console.log('Mock SDK initialized successfully');
      } catch (err) {
        setError(`Failed to initialize SDK: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    initializeSDK();
  }, []);

  // Update recording duration
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingStats(prev => ({
          ...prev,
          duration: Date.now() - startTimeRef.current,
          framesCaptured: prev.framesCaptured + 1,
          voiceFrames: prev.voiceFrames + (Math.random() > 0.5 ? 1 : 0)
        }));
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRecording]);

  const startRecording = async () => {
    if (!sdk) {
      setError('SDK not initialized');
      return;
    }

    try {
      setError('');
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Reset stats
      setRecordingStats({
        duration: 0,
        framesCaptured: 0,
        voiceFrames: 0
      });

      setResult('Recording started! Speak into your microphone...');
    } catch (err) {
      setError(`Recording failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsRecording(false);
    }
  };

  const stopAndUpload = async () => {
    if (!sdk) {
      setError('SDK not initialized');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Stop recording
      setIsRecording(false);

      // Create a sample encrypted blob
      const sampleData = `Recorded audio data captured at ${new Date().toISOString()}`;
      const encryptedBlob = await sdk.encrypt(sampleData);

      // Convert encrypted blob to ArrayBuffer for upload
      const blobData = new TextEncoder().encode(JSON.stringify(encryptedBlob));
      
      // Upload to Task A endpoint (mocked)
      const blobKey = await sdk.uploadBlob(blobData);
      uploadedBlobKeyRef.current = blobKey;

      setResult(`Audio uploaded successfully! Blob Key: ${blobKey}`);
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchAndDecrypt = async () => {
    if (!sdk || !uploadedBlobKeyRef.current || !encryptionKeyRef.current) {
      setError('No uploaded blob or encryption key available');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Download and decrypt the blob
      const decryptedData = await sdk.downloadAndDecrypt(
        uploadedBlobKeyRef.current,
        encryptionKeyRef.current
      );

      setResult(decryptedData);
    } catch (err) {
      setError(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Solace Client SDK Demo</h1>
        <p>Voice Activity Detection & Secure Encryption (Mock Version)</p>
      </header>

      <main className="App-main">
        <div className="controls">
          <button
            onClick={startRecording}
            disabled={isRecording || !sdk}
            className="btn btn-primary"
          >
            {isRecording ? 'Recording...' : 'Start Recording'}
          </button>

          <button
            onClick={stopAndUpload}
            disabled={!isRecording || isProcessing}
            className="btn btn-secondary"
          >
            {isProcessing ? 'Processing...' : 'Stop & Upload'}
          </button>

          <button
            onClick={fetchAndDecrypt}
            disabled={!uploadedBlobKeyRef.current || isProcessing}
            className="btn btn-success"
          >
            {isProcessing ? 'Processing...' : 'Fetch & Decrypt'}
          </button>
        </div>

        {isRecording && (
          <div className="recording-stats">
            <h3>Recording Statistics</h3>
            <p>Duration: {formatDuration(recordingStats.duration)}</p>
            <p>Frames Captured: {recordingStats.framesCaptured}</p>
            <p>Voice Frames: {recordingStats.voiceFrames}</p>
            <div className="recording-indicator">
              <div className="pulse"></div>
              Recording...
            </div>
          </div>
        )}

        {error && (
          <div className="error">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result">
            <h3>Result</h3>
            <pre>{result}</pre>
          </div>
        )}

        <div className="info">
          <h3>How it works</h3>
          <ol>
            <li>Click "Start Recording" to begin voice activity detection</li>
            <li>Speak into your microphone - only frames with voice will be captured</li>
            <li>Click "Stop & Upload" to encrypt and upload the audio data</li>
            <li>Click "Fetch & Decrypt" to retrieve and decrypt the data</li>
          </ol>
          <p><strong>Note:</strong> This is a mock demo. Real functionality requires Task A to be deployed.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
