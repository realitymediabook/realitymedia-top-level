const fs = require("fs");
const http = require("http");
const https = require("https");
const socketIO = require("socket.io");
const express = require("express");
const cors = require('cors')
const serveStatic = require('serve-static')

const app = express();
app.use(cors())

//app.use(serveStatic("public"));
app.use(serveStatic("realitymediabook.github.io"));

app.get("/.well-known/acme-challenge/-s9cqfvzg5sKtTcGgtDK_N2Ik0QPteustoOBBkgm6CQ",
    (req, res) => {
      res.send(
        "-s9cqfvzg5sKtTcGgtDK_N2Ik0QPteustoOBBkgm6CQ.4PYf5OSgy77khnZCXZk_D8Z3MDSKCQxgaDe4rl_e4G4");
  }
);

app.get("/userData",
    (req, res) => {
        res.json({
            rooms: ["eHcTWhf", "uxSLeGu"],
            cubemaps: ["https://realitymedia-hub-assets.realitymedia-internal.net/files/5d8b749a-0352-401e-8b73-2c59129fa9c2.gif?token=13943ea34871f827a7090704042c88a5", "https://realitymedia-hub-assets.realitymedia-internal.net/files/5d8b749a-0352-401e-8b73-2c59129fa9c2.gif?token=13943ea34871f827a7090704042c88a5"]
        })
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
