// This is MongoDb
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// This is Express
const express = require('express');
// This is Core
const cors = require('cors');
// This is Jwt
const jwt = require('jsonwebtoken');
// This is App 
const app = express();
app.use(cors())
// This is Dotenv
require('dotenv').config();
// This is Port
const port = process.env.PORT || 5000;
// This is Express Json
app.use(express.json());
// This is MongoDb URL
const uri = `mongodb+srv://${process.env.DB_LAWYER_USER}:${process.env.DB_LAWYER_PASS}@lawyerservices.xcbpfac.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const userVerifyJWT = (req, res, next) => {
  const userAuthHeader = req.headers.authorization;
  if (!userAuthHeader) {
    res.status(401).send({ message: 'unauthorized access' })
  }
  const userToken = userAuthHeader.split(' ')[1];
  jwt.verify(userToken, process.env.USER_TOKEN_ACCESS, function (err, UserDecoded) {
    if (err) {
      res.status(404).send({ message: 'Not Found' })
    }
    req.UserDecoded = UserDecoded;
    next();
  })  
}


async function run() {
  try {
    const servicesData = client.db('lawyerService').collection('services')
    const usersReview = client.db('lawyerService').collection('review');


    // This is home page

    app.get('/services', async (req, res) => {
      const query = {}
      const cursor = servicesData.find(query);
      const service = await cursor.toArray();
      const updateServices = service.reverse().slice(0, 3)
      res.send(updateServices)
    })

    // This is All Services

    app.get('/services/all', async (req, res) => {
      const query = {}
      const cursor = servicesData.find(query);
      const service = await cursor.toArray();
      res.send(service)
    })
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const services = await servicesData.findOne(query);
      res.send(services)
    })

    // this is add service
    app.post('/addservice', async (req, res) => {
      const services = req.body;
      const servicesResult = servicesData.insertOne(services);
      res.send(servicesResult);
    })


    // this is review add 

    app.get('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { services: id };
      const cursor = await usersReview.find(query).sort({
        date: -1
      }).toArray()
      res.send(cursor)
    })

    app.get('/myreview', userVerifyJWT, async (req, res) => {

      const UserDecoded = req.UserDecoded;
      console.log('inside orders api', UserDecoded)

      if (UserDecoded.email !== req.query.email) {
        res.status(404).send({ message: 'Not Found' })
      }

      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email
        }
      }
      const cursor = usersReview.find(query);
      const myReview = await cursor.toArray();
      res.send(myReview)
    })

    app.post('/jwt', async (req, res) => {
      const users = req.body;
      const Userstoken = jwt.sign(users, process.env.USER_TOKEN_ACCESS, { expiresIn: '1d' })
      res.send({ Userstoken })
    })

    app.get('/myreview/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const reviewUpdate = await usersReview.findOne(query);
      res.send(reviewUpdate)
    })

    app.post('/review', async (req, res) => {
      const review = req.body;
      const date = new Date().getTime()
      review.date = date;
      const reviewResult = usersReview.insertOne(review);
      res.send(reviewResult);
    })


    // This is Delete Review

    app.delete('/myreview/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const reviewdelete = await usersReview.deleteOne(query)
      res.send(reviewdelete)
    })

    // This is Update Review

    app.patch('/myreview/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const update = req.body;
      const option = { upsert: true };
      const updatedUser = {
        $set: {
          message: update.message
        }
      }
      const result = await usersReview.updateOne(filter, updatedUser, option);
      res.send(result);
    })

  }
  finally {

  }
}

run().catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})