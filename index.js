const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@artstore.tattjrs.mongodb.net/?retryWrites=true&w=majority&appName=ArtStore`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const roomCollection = client.db('roomDB').collection('room');
    const bookingCollection = client.db('roomDB').collection('bookings');

// get api for room data
app.get('/rooms',async(req,res)=> {
  const cursor = roomCollection.find();
  const result = await cursor.toArray();
  res.send(result);
})

// get api for single room details and update data
app.get('/room/:id', async (req,res)=> {
  const id = req.params.id;
  const query = { _id : new ObjectId(id)};
  const result = await roomCollection.findOne(query);
  res.send(result);
})



// get api for filter option 
app.get('/filter/:minPrice/:maxPrice', async (req, res) => {
  const minPrice = parseFloat(req.params.minPrice);
  const maxPrice = parseFloat(req.params.maxPrice);

 
  if (isNaN(minPrice) || isNaN(maxPrice)) {
      return res.status(400).json({ error: 'Invalid price range' });
  }
  const cursor = roomCollection.find({
      price: {
          $gte: minPrice,
          $lte: maxPrice
      }
  })
  const result = await cursor.toArray();
  res.send(result);
});



// post api for adding room booking info
app.post('/bookings', async (req,res)=> {
  const booking = req.body;
  console.log(booking);
  const result = await bookingCollection.insertOne(booking);
  res.send(result)
})


















    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);









app.get('/', (req,res)=> {
    res.send('server running ')
})

app.listen(port, ()=>{
    console.log(`server running from ${port}`);
})