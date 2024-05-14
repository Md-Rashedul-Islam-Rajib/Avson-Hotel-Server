const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;



app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://assignment-11-fb88e.web.app",
      "https://assignment-11-fb88e.firebaseapp.com",
    ],
    credentials: true,
  })
);

const logger = async(req,res,next)=>{
  console.log('called', req.host,req.originalUrl)
  next();
}
const verifyToken = async (req,res,next)=>{
  const token = req.cookies?.token;
  console.log(token);
  if(!token){
    return res.status(401).send({message: 'Not Authorized'})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      console.log(err);
      return res.status(401).send({message: 'Unauthorized'})
    }
    console.log(decoded);
    req.user = decoded;
    next()
  })
  
}


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


// auth related api
app.post('/jwt', logger, async(req,res)=>{
  const user =req.body;
  console.log(user);
  const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'5h'})
  
  res
  .cookie('token',token,{
    httpOnly: true,
    secure: true,
    sameSite: 'none'
    //  secure: process.env.NODE_ENV === 'production', 
    //  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
  })
  .send({success: true})
})

app.post('/logout', async(req,res)=>{
  const user = req.body;
  console.log('log out',  user);
  res.clearCookie('token', {maxAge:0}).send({success:true})
})






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
  const query2  = { id:id};
  const result = await roomCollection.findOne(query);
  const result2 = await bookingCollection.findOne(query2);
if(id===result2?.id){
  res.send({data: result, found: true})
}else{
  res.send({data: result, found: false})
}


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
  console.log('token',req.cookies.token);
  const result = await bookingCollection.insertOne(booking);
  res.send(result)
})

// get api for booking data
app.get('/bookings',logger,verifyToken, async(req,res)=> {
  const cursor = bookingCollection.find();
  const result = await cursor.toArray();
  res.send(result);
})


               // patch api for add review data 
 app.patch('/room/:id',async (req,res)=>{
  const id = req.params.id;
  const item = req.body;
  console.log(item);
  const filter = {_id : new ObjectId(id)};
  const options = {upsert : true};
  const updatedData = {
    $set: {
 totalReview: item
 

    }
  }
  const result = await roomCollection.updateOne(filter,updatedData,options);
  res.send(result);
})





// get api for single booking item by id

app.get('/bookings/:id', async (req,res)=> {
  const id = req.params.id;
  console.log(id);
  const query = { id : id};
  const result = await bookingCollection.findOne(query);
  res.send(result);
})



// put api for update date value
app.put('/bookings/:id',async (req,res)=>{
  const id = req.params.id;
  const item = req.body.date;
  console.log(id, item);
  const filter = {_id : new ObjectId(id)};
  const options = {upsert : true};
  const updatedData = {
    $set: {
 date: item
 

    }
  };
  const result = await bookingCollection.updateOne(filter,updatedData,options);
  res.send(result);
})



// delete api for cancel booking
app.delete("/bookings/:id", async (req,res)=>{
  const id = req.params.id;
  console.log(id);
  const query = {_id : new ObjectId(id)};
  const result = await bookingCollection.deleteOne(query);
  res.send(result);
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



// secure: process.env.NODE_ENV === 'production', 
// sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
// .clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true })