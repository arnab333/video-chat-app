const socket = io('/');
const videoGrid = document.getElementById('videoGrid');

const peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443',
});

const videoEl = document.createElement('video');
videoEl.muted = true;

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then(function (stream) {
    myVideoStream = stream;
    addVideoStream(videoEl, stream);

    // answering media calls
    peer.on('call', (callObj) => {
      callObj.answer(stream);
      const videoElement = document.createElement('video');
      callObj.on('stream', (remoteStream) => {
        addVideoStream(videoElement, remoteStream);
      });
    });

    socket.on('user-connected', function (userId) {
      connectToNewUser(userId, stream);
    });
  });

peer.on('open', function (userId) {
  socket.emit('join-room', ROOM_ID, userId);
});

// media calls
function connectToNewUser(userId, stream) {
  const call = peer.call(userId, stream);
  const newVideoEl = document.createElement('video');
  call.on('stream', function (remoteStream) {
    addVideoStream(newVideoEl, remoteStream);
  });
  call.on('close', function () {
    newVideoEl.remove();
  });
  // peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });

  videoGrid.append(video);
}

const text = document.querySelector('#chat_message');
const html = document.querySelector('html');
html.onkeydown = function (e) {
  if (e.which == 13 && text.value.length !== 0) {
    socket.emit('message', text.value);
    text.value = '';
  }
};

socket.on('createMessage', (message) => {
  const ul = document.querySelector('.messages');
  ul.insertAdjacentHTML(
    'beforeend',
    `<li class="message"><b>user</b><br/>${message}</li>`
  );
  scrollToBottom();
});

function scrollToBottom() {
  const d = $('.main__chat_window');
  d.scrollTop(d.prop('scrollHeight'));
}

function muteUnmute() {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

function playStop() {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

function setMuteButton() {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  document.querySelector('.main__mute_button').innerHTML = html;
}

function setUnmuteButton() {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  document.querySelector('.main__mute_button').innerHTML = html;
}

function setStopVideo() {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector('.main__video_button').innerHTML = html;
}

function setPlayVideo() {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector('.main__video_button').innerHTML = html;
}
