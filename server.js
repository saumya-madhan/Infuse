import express from "express";
import fetch from "node-fetch";

const app = express();



app.set("views", "./views");
app.set("view engine", "pug");
//app.set("view engine", "html");
app.use(express.static("public"));


const redirect_uri = "http://localhost:3000/callback";
const client_id = "022f1b89408c445784a6366ca1e28a16";
const client_secret = "cf6062eddf494a1aabbc98a126491f97";

global.access_token;

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/authorize", (req, res) => {
  var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: "022f1b89408c445784a6366ca1e28a16",
    scope: ["user-library-read", "user-library-modify","playlist-modify-private","playlist-modify-public","playlist-read-private","user-top-read"],
    redirect_uri: "http://localhost:3000/callback",
  });

  res.redirect(
    "https://accounts.spotify.com/authorize?" + auth_query_parameters.toString()
  );
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  var body = new URLSearchParams({
    code: code,
    redirect_uri: redirect_uri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "post",
    body: body,
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
  });

  const data = await response.json();
  global.access_token = data.access_token;

  res.redirect("/dashboard");
});

async function getData(endpoint) {
  const response = await fetch("https://api.spotify.com/v1" + endpoint, {
    method: "get",
    headers: {
      Authorization: "Bearer " + global.access_token,
    },
  });

  const data = await response.json();
  return data;
}

async function getDataPost(endpoint, name) {
  const response = await fetch("	https://api.spotify.com/v1/users/"+endpoint+"/playlists", {
    method: "post",
    headers: {
      Authorization: "Bearer " + global.access_token,
    },
    body: JSON.stringify({
      "name": name,
      "description": "New playlist description",
      "public": true
    })
  });

  const data = await response.json();
  return data;
}
async function addTracks(endpoint, track_uris) {
  const response = await fetch("https://api.spotify.com/v1/playlists/"+endpoint+"/tracks?uris="+track_uris, {
    method: "post",
    headers: {
      Authorization: "Bearer " + global.access_token,
    },
    body: JSON.stringify({
      "uris": track_uris,
      "position": 0,
    })
  });

  const data = await response.json();
  return data;
}


app.get("/dashboard", async (req, res) => {
  const userInfo = await getData("/me");
  const access_token = global.access_token;
  res.render("dashboard", {user: userInfo});
});

app.get("/results", async (req, res) => { 
 var albumName = req.query.name;
 const searchResults = await getData("/search?q="+albumName+"&type=album&limit=3");
 const userInfo = await getData("/me");
res.render("results", {search: false, results: searchResults.albums.items});
  
});

app.get("/playlist", async (req, res) => { ;
  const userInfo = await getData("/me");
  var albumId = req.query.name;
  console.log(albumId);
  res.render("playlist", {user: userInfo, album: albumId});  
 });


 app.get("/congratulations", async (req, res) => { ;
  var playlistName = req.query.name;
  var albumId = req.query.album;
  var user_tracks = await getData("/me/top/tracks?limit=10");
  console.log(albumId);
  var tracks = await getData("/albums/"+albumId+"/tracks?market=ES&limit=10&offset=5");
  var track_arr = [];
  var j = 0
  for (var i = 0; i < tracks.items.length; i++) {
      track_arr.push(tracks.items[i].uri);
      if (j < user_tracks.items.length) {
        track_arr.push(user_tracks.items[j].uri);
        j+=1;
      }
  }
  const userInfo = await getData("/me");
  const data = await getDataPost(userInfo.id, playlistName);
  const addTrack = await addTracks(data.id, track_arr);
  console.log(data.href);
  res.render("congratulations", {user: userInfo, url: data.id});
 });


let listener = app.listen(3000, function () {
  console.log(
    "Your app is listening on http://localhost:" + listener.address().port
  );
});
