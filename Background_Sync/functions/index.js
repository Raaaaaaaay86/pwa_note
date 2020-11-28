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

exports.storePostData = functions.https.onRequest(async (request, response) => {
  cors(request, response, async() => {
    const { id } = request.body;

    try {
      await admin.database().ref('posts').push(request.body);
      response.status(201).json({ message: 'Data Stored', id });
    } catch (error) {
      response.status(500).json({ error });
    }

  })
});
