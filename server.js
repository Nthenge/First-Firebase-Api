require('dotenv').config();
const express = require('express')
const app = express();
const port = 3000;
const admin = require('firebase-admin');
const {body, validationResult} = require('express-validator');
const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const UC = db.collection('users');//UC = users collection

app.use(express.json())

app.get('/users', async(req, res) => {
    const snapshot = await UC.get();
    const users = snapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data()
    }))
    res.json(users);
})

app.get('/users/:id', async(req, res) => {
    const doc = await UC.doc(req.params.id).get();
    if(!doc.exists) return res.status(404).send('User not found');
    res.json({id: doc.id, ...doc.data()});
})

app.post('/users',
    [
        body('name')
            .notEmpty().withMessage('Name is required')
            .isString().withMessage('Name must be a string')
            .isLength({min: 3}).withMessage('Name must be at least 3 characters long')
    ],
        async(req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()});
            }

            const userRef = await UC.add({name: req.body.name});
            const newUser = await userRef.get();
            res.status(201).json({id: newUser.id, ...newUser.data()});
})

app.put('/users/:id',
    [
        body('name')
            .notEmpty().withMessage('Name is required')
            .isString().withMessage('Name must be a string')
            .isLength({min: 3}).withMessage('Name must be at least 3 characters long')
    ],
    async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        await UC.doc(req.params.id).update({name: req.body.name});
        const updated = await UC.doc(req.params.id).get();
        res.json({id: updated.id, ...updated.data()});
})

app.delete('/users/:id', async(req, res)=> {
    await UC.doc(req.params.id).delete();
    res.status(204).send('User deleted');
})

app.listen(port, ()=> {
    console.log('My first api is running')
})