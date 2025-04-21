const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const monggose = require('mongoose')
monggose.connect(process.env.db_URL, { useNewUrlParser: true, useUnifiedTopology: true })
const { Schema } = monggose;

const userSchema = new Schema({
  username: String,

});
const User = monggose.model('User', userSchema);

const exerciseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  description: String,
  duration: Number,
  date: Date
});
const Exercise = monggose.model("Exercise", exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users',async (req, res) => {
  console.log(req.body)
  const userObj = new User({
    username: req.body.username
  })
  try {
    const user = await userObj.save()
    console.log(user);
    res.json(user)

  }catch(err){
    console.log(err)
  }


  app.get("/api/users", async (req, res) => {
    try {
      const users = await User.find({}, "_id username");
      res.json(users);
    } catch (err) {
      console.log(err);
      res.status(500).send("Error retrieving users");
    }
  });
  

})

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
const rawDate = req.body.date ? new Date(req.body.date) : new Date();
  const { description, duration } = req.body
  try{
    const user = await User.findById(id)
    if (!user) {
      return res.send( "User not found" );
    }else{
      const exerciseObj = new Exercise ({
        userId:user._id,
        description,
        duration,
        date : rawDate
      })
      const exercise = await exerciseObj.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description, 
         duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  }catch(err){
    console.log(err)
    res.send("There was an error saving the exercise")
  }
})

app.get("/api/users/:_id/logs", async (req, res) => {
const {from ,to,limit } = req.query
const id = req.params._id
 const user = await User.findById(id)
  if (!user) {
    res.send( "User not found" );
    return;
}
let dateObj ={}
  if (from){
    dateObj["$gte"] = new Date(from) 
  }
  if (to){
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    userId:id
  }
  if(from || to){
    filter.date = dateObj;
  }

  const exercises = await Exercise.find(filter).limit(parseInt(limit) ?? 500)

  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: new Date(e.date).toDateString()
  }))
  res.json ({
    username :user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
})
const listener = app.listen(process.env.PORT || 3003, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
