const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.x7kxg5y.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyToken = async (req , res ,next) => {
  try {
    const authHeader = req.headers.authorization
    if(!authHeader){
     return   res.status(401).send({message: "unauthorized access"})
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token , process.env.ACCESS_TOKEN , function(err , decoded){
        if(err){
            res.status(403).send({message: "frohibiden"})
        }
        req.decoded = decoded
        next()
    })
  } catch (error) {
    console.log(error.message);
  }
};

async function dbConnect() {
  try {
    await client.connect();
    console.log("db connected");
  } catch (error) {
    console.log(error.message);
  }
}

const toursCollection = client.db("TravelfyDatabase").collection("services");
const reviewCollection = client.db("TravelfyDatabase").collection("reviews");
const enqueriesCollection = client.db("TravelfyDatabase").collection("enqueries");


app.get("/hometours", async (req, res) => {
  try {
    const tours = toursCollection.find({});
    const data = await tours.toArray();
    const tour = data.slice(-3);

    res.send({ success: true, result: tour });
  } catch (error) {
    console.log(error.message);
  }
});
app.get("/tours", async (req, res) => {
  try {
    const tours = toursCollection.find({});
    const data = await tours.toArray();
    res.send({ success: true, data: data });
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/tours/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const tour = await toursCollection.findOne(query);
    res.send({ success: true, data: tour });
  } catch (error) {console.log(error.message)}
});

app.post("/postreview", async (req, res) => {
 try {
    const CustomerReview = req.body;
    const result = await reviewCollection.insertOne(CustomerReview);
    // console.log(result)
    res.send({ result });
 } catch (error) {
    console.log(error.message);
 }
});

app.get("/reviews", async (req, res) => {
  try {
    
    const tourName = req.query.name;
  const tourSpecificReview = { tourName: tourName };
  const cursor = reviewCollection.find(tourSpecificReview).sort({time: 1});
  const result = await cursor.toArray();
  res.send({ result });
  } catch (error) {
    console.log(error.message);
  }
  // console.log(result);
});

app.get("/userReview",verifyToken ,async (req, res) => {
 try {
    const decoded = req.decoded;
     if(decoded.email !== req.query.email){
      return res.status(401).send({message: "unauthorized access"})
     }
    const userEmail = req.query.email;
    const query = { email: userEmail };
    const cursor = reviewCollection.find(query);
    const result = await cursor.toArray();
    res.send({ success: true, data: result });
 } catch (error) {
    console.log(error.message);
 }
});

app.post("/addtour", async (req, res) => {
  try {
    const adededTour = req.body;
    const result = await toursCollection.insertOne(adededTour);
    res.send({ success: true, data: result });
    // console.log(result);
  } catch (error) {
    console.log(error.message);
  }
});

app.delete("/reviews/:id", async (req, res) => {
 try {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await reviewCollection.deleteOne(query);
    res.send(result);
 } catch (error) {
    console.log(error.message);
 }
});

app.put("/review/:id", async (req, res) => {
 try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const options = { upsert: true };
  
    const updateReview = {
      $set: {
        text: req.body.text,
      },
    };
  
    const result = await reviewCollection.updateOne(
      filter,
      updateReview,
      options
    );
    res.send({ result });
    console.log({ result });
 } catch (error) {
    console.log(error.message);
 }
});

app.post("/jwt", (req, res) => {
 try {
    const user = req.body;
   
    const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "1d" });
    res.send({ token });
 } catch (error) {
    console.log(error.message);
 }
});


app.post('/enquire' , async(req, res)=>{
  const enquery = req.body;
  const result = await enqueriesCollection.insertOne(enquery)
  res.send(result)
  // console.log(result);
})


dbConnect();

app.listen(port, () => {
  console.log("server is running");
});
