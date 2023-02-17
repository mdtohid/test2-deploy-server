const express = require('express');
var cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT||5000;

// middleware
app.use(cors());
app.use(express.json());


// 
// 

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    // console.log('inside verify jwt', authHeader);
    if (!authHeader) {
        res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    // console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            res.status(403).send({ message: 'Forbidden access' })
            
        }
        // console.log('decoded', decoded)
        req.decoded = decoded;
        next()
    })

}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uiwbado.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("geniusCar").collection("service");
        const orderCollection = client.db("geniusCar").collection("order");

        // AUTH
        app.post('/login', async (req, res) => {
            const user = req.body;
            console.log(user);
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ accessToken });
        })


        // service
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const service = await cursor.toArray(console.dir);
            res.send(service);
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: new ObjectId(id) };
            // console.log(query)
            const result = await serviceCollection.findOne(query);
            res.send(result);
        })

        app.post('/service', async (req, res) => {
            const service = req.body;
            const doc = {
                name: service.name,
                description: service.description,
                price: service.price,
                img: service.img
            }
            const result = await serviceCollection.insertOne(doc);
            res.send(result);
        })

        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        })

        // order collection API
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })

        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail);
            const email = req.query.email;
            // console.log(email);
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray(console.dir);
                // console.log(orders)
                res.send(orders);
            }
            else{
                res.status(403).send('Forbidden access')
            }
        })
    }
    finally {
        // client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello !')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})


// mongodb+srv://vercel-admin-user:3ZXmqoIaOCh6xdW4@cluster0.uiwbado.mongodb.net/myFirstDatabase?retryWrites=true&w=majority