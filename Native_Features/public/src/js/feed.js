var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');

const videoPlayer = document.getElementById('player');
const canvasElement = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');
const imagePicker = document.getElementById('image-picker');
const imagePickerArea = document.getElementById('pick-image');
const locationBtn = document.getElementById('location-btn');
const locationLoader = document.getElementById('location-loader');
let fetchedLocation = {lat: 0, lng: 0};
let picture = null;

locationBtn.addEventListener('click', (event) => {
  if (!('geolocation' in navigator)) return;
  let sawAlert = false;

  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locationBtn.style.display = 'inline';
      locationLoader.style.display = 'none';
      fetchedLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
      locationInput.value = 'In Taiwan';
      document.getElementById('manual-location').classList.add('is-focused');
    },
    (err) => {
      console.log(err);
      locationBtn.style.display = 'inline';
      locationLoader.style.display = 'none';
      if (!sawAlert) {
        alert("Couldn't fetch location please enter manually.");
        sawAlert = true;
      }
      fetchLocation = {lat: 0, lng: 0};
    },
    {
      timeout: 7000
    }
  );
});

const initializeMedia = async() => { // 啟用視訊功能
  if (!('mediaDevices' in navigator)) { // ployfill
    navigator.mediaDevices = {};
  }

  if (!('getUserMedia' in navigator.mediaDevices)) { // ployfill，但現在支援度已經比以前高了
    navigator.mediaDevices.getUserMedia = function(constraints) { // constraint 指定使用音訊或是視訊裝置
      const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented!'))
      }

      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      })
    }
  }

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch((err) => {
      imagePickerArea.style.display = 'block';
    });
};

const initializeLocation = () => {
  if (!('geolocation' in navigator)) {
    locationBtn.style.display = 'none';
  }
};

captureBtn.addEventListener('click', (event) => {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureBtn.style.display = 'none';

  const context = canvasElement.getContext('2d'); // 先定義 canvas context type
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
  videoPlayer.srcObject.getVideoTracks().forEach((track) => track.stop());

  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change', (event) => {
  picture = event.target.file[0];
})

function openCreatePostModal() {
  // createPostArea.style.display = 'block';
  // setTimeout(function() {
    createPostArea.style.transform = 'translateY(0)'; // 彈出 modal
    initializeMedia(); // 啟用視訊功能
    initializeLocation(); // 啟用定位功能
  // }, 1);
  // if (deferredPrompt) {
  //   deferredPrompt.prompt();

  //   deferredPrompt.userChoice.then(function(choiceResult) {
  //     console.log(choiceResult.outcome);

  //     if (choiceResult.outcome === 'dismissed') {
  //       console.log('User cancelled installation');
  //     } else {
  //       console.log('User added to home screen');
  //     }
  //   });

  //   deferredPrompt = null;
  // }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(function(registrations) {
  //       for (var i = 0; i < registrations.length; i++) {
  //         registrations[i].unregister();
  //       }
  //     })
  // }
}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
  videoPlayer.style.display = 'none';
  imagePickerArea.style.display = 'none';
  canvasElement.style.display = 'none';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  captureBtn.style.display = 'inline';
  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach((track) => track.stop());
  }
  // createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// Currently not in use, allows to save assets in cache on demand otherwise
function onSaveButtonClicked(event) {
  console.log('clicked');
  if ('caches' in window) {
    caches.open('user-requested')
      .then(function(cache) {
        cache.add('https://httpbin.org/get');
        cache.add('/src/images/sf-boat.jpg');
      });
  }
}

function clearCards() {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

var url = 'https://pwapractice-177e2.firebaseio.com/posts.json';
var networkDataReceived = false;

fetch(url)
  .then(function(res) {
    console.log('rrrrrr', res);
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    console.log('From web', data);
    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

if ('indexedDB' in window) {
  readAllData('posts')
    .then(function(data) {
      if (!networkDataReceived) {
        console.log('From cache', data);
        updateUI(data);
      }
    });
}

function sendData() {
  const postData = new FormData(dt);
  const id = new Date().toISOString();
  postData.append('id', id);
  postData.append('title', title.input.value);
  postData.append('location', location.input.value);
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lng);
  postData.append('file', picture, `${id}.png`);

  fetch('https://us-central1-pwagram-99adf.cloudfunctions.net/storePostData', {
    method: 'POST',
    body: postData,
  })
    .then(function(res) {
      console.log('Sent data', res);
      updateUI();
    })
}

form.addEventListener('submit', function(event) {
  event.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data!');
    return;
  }

  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(function(sw) {
        var post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          picture: picture,
          rawLocation: fetchedLocation,
        };
        writeData('sync-posts', post)
          .then(function() {
            return sw.sync.register('sync-new-posts');
          })
          .then(function() {
            var snackbarContainer = document.querySelector('#confirmation-toast');
            var data = {message: 'Your Post was saved for syncing!'};
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function(err) {
            console.log(err);
          });
      });
  } else {
    sendData();
  }
});