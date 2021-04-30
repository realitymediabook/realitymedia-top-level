const fs = require("fs");
const http = require("http");
const https = require("https");
const socketIO = require("socket.io");
const express = require("express");

const app = express();

app.use(express.static("public"));

app.get("/.well-known/acme-challenge/OzgyUDzGILp761UW7gkB3xyuUNSomDcJNpGCQQui4uE",
    (req, res) => {
      res.send(
        "OzgyUDzGILp761UW7gkB3xyuUNSomDcJNpGCQQui4uE.VeFbm-Pcx9jG1LNNYKt1-ssk8U1QMse-QJsLzcWPGiI");
  }
);

/////////
const privKeyFileName = "/etc/letsencrypt/live/realitymedia.digital/privkey.pem";
const certFileName = "/etc/letsencrypt/live/realitymedia.digital/cert.pem";
const chainFileName = "/etc/letsencrypt/live/realitymedia.digital/chain.pem";

// this will either be an http or https server
var httpServer;

if (
  fs.existsSync(privKeyFileName) &&
  fs.existsSync(certFileName) &&
  fs.existsSync(chainFileName)
) {
  const privateKey = fs.readFileSync(privKeyFileName, "utf8");
  const certificate = fs.readFileSync(certFileName, "utf8");
  const ca = fs.readFileSync(chainFileName, "utf8");

  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
  };

  httpServer = https.createServer(credentials, app);
  httpServer.listen(3001, () =>
    console.log("HTTPS Server running on port 3001")
  );
} else {
  console.log("https certs are not available, not starting https server");
  httpServer = http.createServer(app);

  httpServer.listen(3000, () => 
    console.log("HTTP Server running on port 3000")
  );
}

// Starting for either the http or https servers
const io = socketIO.listen(httpServer);

io.sockets.on("connection", (socket) => {
  console.log("a user connected");
});
