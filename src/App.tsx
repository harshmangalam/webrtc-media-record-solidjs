import { Component, Show, createSignal, onMount, onCleanup } from "solid-js";

import styles from "./App.module.css";

const App: Component = () => {
  let mediaRecorder: MediaRecorder;
  let recordedBlobs: Blob[] = [];
  let stream: MediaStream;

  let previewVideo: HTMLVideoElement;

  const [hasStream, setHasStream] = createSignal(false);
  const [allowPlay, setAllowPlay] = createSignal(false);
  const [allowDownload, setAllowDownload] = createSignal(false);
  const [recordingStarted, setRecordingStarted] = createSignal(false);
  const [play, setPlay] = createSignal(false);
  const [previewVideoUrl, setPreviewVideoUrl] = createSignal("");

  onMount(() => {
    init();
  });

  onCleanup(() => {
    URL.revokeObjectURL(previewVideoUrl());
    mediaRecorder.removeEventListener("dataavailable", onDataAvailable);
  });

  async function init() {
    const constraints = {
      audio: {
        echoCancellation: { exact: true },
      },
      video: {
        width: 1280,
        height: 720,
      },
    };
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasStream(true);
    } catch (error) {
      console.error(error);
    }
  }

  function handleRecording() {
    recordingStarted() ? stopRecording() : startRecording();
  }

  function startRecording() {
    console.log("start recording...");
    setRecordingStarted(true);
    setPlay(false);
    setAllowPlay(false);
    setAllowDownload(false);
    try {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.addEventListener("dataavailable", onDataAvailable);
      mediaRecorder.start();
    } catch (error) {
      console.log(error);
    }
  }

  function onDataAvailable(event: BlobEvent) {
    if (event.data && event.data.size > 0) {
      console.log("available data", event.data);
      recordedBlobs.push(event.data);
    }
  }

  function stopRecording() {
    console.log("stop recoding");
    mediaRecorder.stop();
    setRecordingStarted(false);
    setPlay(false);
    setAllowPlay(true);
    setAllowDownload(true);
  }

  function handleVideo(el, accessor) {
    const mediaStream = accessor();
    if ("srcObject" in el) {
      el.srcObject = mediaStream;
    } else {
      el.src = URL.createObjectURL(mediaStream);
    }
  }

  function handlePlay() {
    const superBuffer = new Blob(recordedBlobs);
    const url = window.URL.createObjectURL(superBuffer);
    previewVideo.src = url;
    previewVideo.controls = true;
    previewVideo.play();
    setPlay(true);
    setPreviewVideoUrl(url);
  }

  function downloadRecord() {
    const blob = new Blob(recordedBlobs, { type: "video/webm" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `${crypto.randomUUID()}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
  return (
    <div class={styles.App}>
      <Show when={hasStream()}>
        <div style={{ display: "flex", "justify-content": "center" }}>
          <video
            width={600}
            height={400}
            use:handleVideo={stream}
            playsinline
            muted
            autoplay
          />
          <video
            hidden={!play()}
            width={600}
            height={400}
            ref={previewVideo}
            playsinline
          />
        </div>
      </Show>
      <div>
        <button disabled={!hasStream()} onClick={handleRecording}>
          <Show when={recordingStarted()} fallback="Start Recording">
            Stop Recording
          </Show>
        </button>
        <button disabled={!allowPlay()} onClick={handlePlay}>
          Play
        </button>
        <button onClick={downloadRecord} disabled={!allowDownload()}>
          Download
        </button>
      </div>
    </div>
  );
};

export default App;
