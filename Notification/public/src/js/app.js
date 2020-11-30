
var deferredPrompt;
const enableNotificationsBtn = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

const displayConfirmNotification = async () => {
  const options = {
    body: 'You successfully subscribe to our notification service',
    icon: '/src/images/icons/app-icon-96x96.png',
    image: '/src/images/sf-boat.jpg',
    dir: 'ltr',
    lang: 'en-US', //BCP 47 code
    vibrate: [100, 50, 200], // vibrate for 100ms, pause for 50ms, vibrate again for 200ms
    bage: '/src/images/icons/app-icon-96x96.png', // 安卓工具列小圖示，手機系統會自動製作黑白小圖示
    tag: 'confirm-notification', // 如果有相同的 tag 被推播，新通知則會覆蓋相同 tag 的舊通知
    renotify: true, // 如果有相同的 tag 被推播，renotify 為 true，則會重新震動，false 則相反
    actions: [ // 只在Service Worker 作用，在推播通知上顯示操作選項，但要注意不是每個裝置都支援
      { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
      { action: 'cancel', title: 'cancel', icon: '/src/images/icons/app-icon-96x96.png' },
    ],
  };

  if ('serviceWorker' in navigator) {
    (await navigator.serviceWorker.ready).showNotification('Successfully Subscribed (From SW)!', options);
  } else {
    new Notification('Successfully Subscribed!', options);
  }
}

const confirgurePushSub = async() => {
  if (!('serviceWorker' in navigator)) return;
  const swRegistration = await navigator.serviceWorker.ready;
  const subscription = await swRegistration.pushManager.getSubscription(); // 返回一個 Promise，嘗試獲取已有個推播訂閱
  const vapidPublicKey = 'BDg0bQCtMT7Bk6gg1SoAyagjW6At4TxAsrvfn4Rhn_RHfFU8cScr1HhXcAsL4nj8wLnmy9STlfa7wWTriAP8oI8'; // 由 web-push 產生的 PublicKey
  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey); // urlBase64ToUint8Array() 為 web-push 所提供的轉換函式

  if (subscription === null) { // 若不存在已有的推播訂閱，則返回 null
    const newSub = await swRegistration.pushManager.subscribe({ // 建立推播訂閱
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    try { // 將訂閱資訊上傳至 server，方便日後 server 推播時可以查看有哪些訂閱用戶
      const fetchResponse = await fetch('https://pwapractice-177e2.firebaseio.com/subscriptions.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(newSub),
      })
  
      if (fetchResponse.ok) {
        displayConfirmNotification();
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    // Already have subscription
  }
};

const askForNotificationPermission = () => { // 第一次到此網站，若要推播通知給用戶，必須要做詢問動作。
  Notification.requestPermission((result) => {
    console.log('User Choice', result);
    if (result !== 'granted') return console.log('No notification permission granted!');

    confirgurePushSub();
    // displayConfirmNotification();

    //如果接受，則隱藏按鈕 (操控畫面)
    enableNotificationsBtn.forEach((btn) => {
      btn.style.display = 'none';
      btn.removeEventListener('click', askForNotificationPermission);
    });
  })
}

// 操控畫面
if ('Notification' in window && 'serviceWorker' in navigator) {
  enableNotificationsBtn.forEach((btn) => {
    if (Notification.permission !== 'granted') {
      btn.style.display = 'inline-block';
      btn.addEventListener('click', askForNotificationPermission);
    }
  });
}