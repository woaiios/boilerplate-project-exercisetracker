const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser");
const Client = require("@replit/database");
const client = new Client();

// var userTable = await client.get("userTable");
// var execTable = await client.get("execTable");
// if (!userTable) {
//   await client.set(userTable, {});
//   userTable = await client.get("userTable");
// }
// if (!execTable) {
//   await client.set(execTable, {});
//   execTable = await client.get("execTable");
// }

require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.post('/api/exercise/new-user', async function (req, res) {
  if (req.body.username) {
    let key = req.body.username;
    let _key = await client.get(key);
    if (_key) {
      res.send("Username already taken");
      return;
    }
    function makeid(length) {
      var result = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }

    let value = makeid("6013e0260aa40e05f2b8995c".length);
    console.log(value);
    await client.set(key, value);
    await client.set(value, { "name": key, "data": [] });

    var users = await client.get("users6013e9")
    var u = { "_id": value, "username": key };
    if (!users) {
      users = [u]
    } else {
      users.push(u)
    }
    await client.set("users6013e9", users)
    //db.prefix
    res.send(`{"username":"${key}","_id":"${value}"}`)

    return
  } else {
    res.send("Path `username` is required.");
  }
})

//Cast to date failed for value "dfvdf" at path "date"

//Cast to ObjectId failed for value "6013ba030aa40e05f2b899" at path "_id" for model "Users"
//{"_id":"6013e9ea0aa40e05f2b89962","username":"oooujnj","date":"Tue Sep 01 1992","duration":12,"description":"d2"}
app.post('/api/exercise/add', async function (req, res) {
  let userId = req.body.userId;
  let _key = await client.get(userId);
  if (!_key) {
    res.send(`Cast to ObjectId failed for value "${userId}" at path "_id" for model "Users"`);
    return;
  }
  var data = _key.data;
  let description = req.body.description;
  let duration = req.body.duration;
  var dateStr = ""
  var date = new Date()
  // console.log(`DD: ${req.body.date}`)
  if (!req.body.date) {
    date = new Date()
    // console.log(`FF: ${req.body.date}`)
  } else {
    date = new Date(req.body.date)
    // console.log(`GG: ${Date("2020-01-04")} ${req.body.date} ${Date(req.body.date)} ${date.toDateString()}`)
    dateStr = date.toDateString()
    if (!dateStr) {
      res.send(`Cast to date failed for value "${req.body.date}" at path "date"`)
      return
    }
  }
  dateStr = date.toDateString()
  if (!description) {
    res.send(`Cast to description failed for value "${req.body.description}" at path "description"`)
    return
  }
  if (!duration) {
    res.send(`Cast to duration failed for value "${req.body.duration}" at path "duration"`)
    return
  }
  // console.log(date);

  data.push({ "description": description, "duration": duration, "date": dateStr });
  _key.data = data
  await client.set(userId, _key)
  //Tue Sep 01 1992
  res.send(`{"_id":"${userId}","username":"${_key.name}","date":"${dateStr}","duration":${duration},"description":"${description}"}`)
})

///api/exercise/log?{userId}[&from][&to][&limit]
//{"_id":"6013e9ea0aa40e05f2b89962","username":"oooujnj","count":2,"log":[{"description":"d2","duration":12,"date":"Tue Sep 01 1992"},{"description":"d2","duration":12,"date":"Tue Sep 01 1992"}]}
//{"_id":"6013e9ea0aa40e05f2b89962","username":"oooujnj","from":"Sat Jan 01 2000","count":0,"log":[]}
//https://exercise-tracker.freecodecamp.rocks/api/exercise/log?userId=6013e9ea0aa40e05f2b89962&limit=1&from=0
//Cast to ObjectId failed for value "60139ea0aa40e05f2b89962" at path "_id" for model "Users"
app.get('/api/exercise/log', async function (req, res) {
  console.log(req.query)
  var userId = req.query.userId;
  var from_ = req.query.from;
  var to = req.query.to;
  var limit = req.query.limit;
  if (!userId) {
    res.send(`Cast to ObjectId failed for value "${userId}" at path "_id" for model "Users"`)
    return
  }
  var dateFrom = new Date("1970-01-01")
  if (from_) {
    dateFrom = new Date(from_)
    if (!dateFrom) {
      res.send(`Cast to date failed for value "${from_}" at path "from"`)
      return
    }
  }

  var dateTo = new Date()
  if (to) {
    dateTo = new Date(to)
    if (!dateTo) {
      res.send(`Cast to date failed for value "${to}" at path "to"`)
      return
    }
  }
  if (!limit) {
    limit = "99999"
  }

  function roughScale(x, base) {
    const parsed = parseInt(x, base);
    if (isNaN(parsed)) { return 0; }
    return parsed;
  }

  console.log(limit)
  limit = roughScale(limit, 10)
  
  console.log(limit)

  let _key = await client.get(userId);
  if (!_key) {
    res.send(`Cast to ObjectId failed for value "${userId}" at path "_id" for model "Users"`);
    return;
  }

  var name = _key.name
  var data = _key.data
  function compare(a, b) {
    let aDate = new Date(a.date)
    let bDate = new Date(b.date)
    if (aDate < bDate) {
      return -1;
    }
    if (aDate > bDate) {
      return 1;
    }
    return 0;
  }

  data.sort(compare);
  function ft(a) {
    let aDate = new Date(a)
    if (aDate < from_) {
      return false
    }
    if (aDate > to) {
      return false
    }
    return true
  }
  data = data.filter(ft)
  data = data.slice(0, limit)
  var count = Math.min(data.length, limit)
  var log = `{"_id":"${userId}","username":"${name}","count":${count},"log":[`
  console.log(log)
  for (var i = 0; i < count; i++) {
    var o = data[i]
    var tp = `{"description":"${o.description}","duration":${o.duration},"date":"${o.date}"}`
    if (i != count - 1) {
      tp += ","
    }
    log += tp
  }
  log += "]}"
  res.setHeader("Content-Type", "application/json");
  res.send(log)
});

//api/exercise/users
app.get('/api/exercise/users', async function (req, res) {
  let k = "users6013e9";
  var data = await client.get(k);
   res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(data))
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
