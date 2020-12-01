const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webpush = require('web-push');
const UUID = require('uuid-v4');

// 解析 POST 請求的 form data
const os = require('os');
const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');
//

const gcconfig = {
  projectId: "pwapractice-177e2",
  keyFilename: "FirebaseAdminKey.json"
};
const googleStorage = require('@google-cloud/storage')(gcconfig);
const serviceAccount = require('./FirebaseAdminKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwapractice-177e2.firebaseio.com',
})

exports.storePostData = functions.https.onRequest(async (request, response) => {
  cors(request, response, async() => {
    const { id } = request.body;
    const busboy = new Busboy({ headers: request.headers });
    const uuid = UUID();
    const fields = {};
    let upload;

    // 監聽文件解析事件
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log(`File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`);
      const filePath = path.join(os.tmpdir(), filename);
      upload = { file: filename, type: mimetype };
      file.pipe(fs.createWriteStream(filePath));
    })

    // 監聽請求中的字段
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      fields[fieldname] = val;
    });

    // 監聽結束事件
    busboy.on('finish', () => {
      const bucket = googleStorage.bucket('pwapractice-177e2.appspot.com');
      bucket.upload(
        `/tmp/${upload.file}`,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid
            }
          }
        },
        async (err, uploadedFile) => {
          if (!err) {
            try {
              await admin.database().ref('posts').push(
                {
                  id: fields.id,
                  title: fields.title,
                  location: fields.location,
                  image: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uploadedFile.name)}?alt=media&token=${uuid}`
                }
              );
        
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
        
              response.status(201).json({ message: 'Data Stored', id: fields.id });
            } catch (error) {
              response.status(500).json({ error });
            }
          }
        }
      )
    })

    busboy.end(request.rawBody);
  })
});

//https://firebasestorage.googleapis.com/v0/b/pwapractice-177e2.appspot.com/o/2020-11-30T10%3A23%3A50.054Z.png/?alt=media&token=014ea0c3-0785-4558-86db-a3526009c350
//https://firebasestorage.googleapis.com/v0/b/pwapractice-177e2.appspot.com/o/2020-11-30T10%3A23%3A50.054Z.png?alt=media&token=014ea0c3-0785-4558-86db-a3526009c350