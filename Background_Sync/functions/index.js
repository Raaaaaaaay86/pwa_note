const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const serviceAccount = require('./FirebaseAdminKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwapractice-177e2.firebaseio.com',
})

exports.storePostData = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  cors(request, response, () => {
    const { id, location, title } = request.body;

    admin.database().ref('posts').push({
      id,
      title,
      location,
      image: 'https://firebasestorage.googleapis.com/v0/b/pwapractice-177e2.appspot.com/o/2019-08-20.jpg?alt=media&token=dca0cc16-e6fd-4fa7-a061-a2a38a5945f1',
    })
      .then(() => {
        response.status(201).json({
          message: 'Data Stored',
          id,
        })
      })
      .catch((error) => {
        response.status(500).json({ error });
      })
  })

  response.send("Hello from Firebase!");
});
