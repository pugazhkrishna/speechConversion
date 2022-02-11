if ("webkitSpeechRecognition" in window) {
    let speechRecognition = new webkitSpeechRecognition();
    let final_transcript = "";

    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = document.querySelector("#select_dialect").value;
  
    speechRecognition.onstart = () => {
      document.querySelector("#status").style.display = "block";
    };
    speechRecognition.onerror = () => {
      document.querySelector("#status").style.display = "none";
      console.log("Speech Recognition Error");
    };
    speechRecognition.onend = () => {
      document.querySelector("#status").style.display = "none";
      console.log("Speech Recognition Ended");
    };
  
    speechRecognition.onresult = (event) => {
      let interim_transcript = "";
  
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }
      document.querySelector("#final").innerHTML = final_transcript;
      document.querySelector("#interim").innerHTML = interim_transcript;
    };
  
    document.querySelector("#record").onclick = () => {
      speechRecognition.start();
    };
    document.querySelector("#stop").onclick = () => {
      speechRecognition.stop();
    };
  } else {
    console.log("Speech Recognition Not Available");
  }


  //Audio - listening
  const recordAudio = () =>
  new Promise(async resolve => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    let audioChunks = [];

    mediaRecorder.addEventListener('dataavailable', event => {
      audioChunks.push(event.data);
    });

    const start = () => {
      audioChunks = [];
      mediaRecorder.start();
    };

    const stop = () =>
      new Promise(resolve => {
        mediaRecorder.addEventListener('stop', () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          const play = () => audio.play();
          resolve({ audioChunks, audioBlob, audioUrl, play });
        });

        mediaRecorder.stop();
      });

    resolve({ start, stop });
  });

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const recordButton = document.querySelector('#record');
const stopButton = document.querySelector('#stop');
const playButton = document.querySelector('#play');
const saveButton = document.querySelector('#save');
const savedAudioMessagesContainer = document.querySelector('#saved-audio-messages');

let recorder;
let audio;

recordButton.addEventListener('click', async () => {
  recordButton.setAttribute('disabled', true);
  stopButton.removeAttribute('disabled');
  playButton.setAttribute('disabled', true);
  saveButton.setAttribute('disabled', true);
  if (!recorder) {
    recorder = await recordAudio();
  }
  recorder.start();
});

stopButton.addEventListener('click', async () => {
  recordButton.removeAttribute('disabled');
  stopButton.setAttribute('disabled', true);
  playButton.removeAttribute('disabled');
  saveButton.removeAttribute('disabled');
  audio = await recorder.stop();
});

playButton.addEventListener('click', () => {
  audio.play();
});

saveButton.addEventListener('click', () => {
  const reader = new FileReader();
  reader.readAsDataURL(audio.audioBlob);
  reader.onload = () => {
    const base64AudioMessage = reader.result.split(',')[1];

    fetch('http://localhost:3545/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: base64AudioMessage })
    }).then(res => {
      if (res.status === 201) {
        return populateAudioMessages();
      }
      console.log('Invalid status saving audio message: ' + res.status);
    });
  };
});

const populateAudioMessages = () => {
  return fetch('http://localhost:3545/messages',{
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
  }).then(res => {
    if (res.status === 200) {
      return res.json().then(json => {
        json.messageFilenames.forEach(filename => {
          let audioElement = document.querySelector(`[data-audio-filename="${filename}"]`);
          if (!audioElement) {
            audioElement = document.createElement('audio');
            audioElement.src = `/messages/${filename}`;
            audioElement.setAttribute('data-audio-filename', filename);
            audioElement.setAttribute('controls', true);
            savedAudioMessagesContainer.appendChild(audioElement);
          }
        });
      });
    }
    console.log('Invalid status getting messages: ' + res.status);
  });
};
// populateAudioMessages();