const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webpush = require('web-push');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const serviceAccount = require('./FirebaseAdminKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwapractice-177e2.firebaseio.com',
})

exports.storePostData = functions.https.onRequest(async (request, response) => {
  cors(request, response, async() => {
    const { id } = request.body;

    try {
      await admin.database().ref('posts').push(request.body);

      // 新增 post 後，同時也推播通知
      webpush.setVapidDetails( // 設定 VapidKey 設定
        'mailto: mirror46258@gmail.com',
        'BDg0bQCtMT7Bk6gg1SoAyagjW6At4TxAsrvfn4Rhn_RHfFU8cScr1HhXcAsL4nj8wLnmy9STlfa7wWTriAP8oI8', // WebPush PublicKey
        'EFJ4V8BhJ_hhzZ0qfOHKAuVs7IhHl6cRdY0DB6bjroU', // WebPush PrivateKey
      );

      const subscriptions = await admin.database().ref('subscriptions').once('value');

      subscriptions.forEach((sub) => { // 對所有訂閱用戶發送資料
        const { endpoint, keys } = sub.val();
        const pushConfig = { // webPush 設定
          endpoint,
          keys: {
            auth: keys.auth,
            p256dh: keys.p256dh,
          },
        };

        webpush.sendNotification(pushConfig, JSON.stringify({
          title: 'New Post',
          content: 'New Post added!',
          openUrl: '/help',
        }))
          .catch((err) => console.log(err));
      });

      response.status(201).json({ message: 'Data Stored', id });
    } catch (error) {
      response.status(500).json({ error });
    }
  })
});
