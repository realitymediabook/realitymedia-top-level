const fs = require("fs");
const http = require("http");
const https = require("https");
const socketIO = require("socket.io");
const express = require("express");
const cors = require('cors')
const serveStatic = require('serve-static')

const app = express();
app.use(cors())

// app.get("/.well-known/acme-challenge/GmuaPfjGgwbHRdyEkLWfBob0pWNfeFaP6AOUvjHs458",
//     (req, res) => {
//       res.send(
//         "GmuaPfjGgwbHRdyEkLWfBob0pWNfeFaP6AOUvjHs458.4PYf5OSgy77khnZCXZk_D8Z3MDSKCQxgaDe4rl_e4G4");
//   }
// );

app.get("/userData",
    (req, res) => {
        res.json({
            rooms: ["7QmbqNj", "aSCkfag"],
            cubemaps: [
                //urls = [cubeMapPosX, cubeMapNegX, cubeMapPosY, cubeMapNegY, cubeMapPosZ, cubeMapNegZ];

                ["https://resources.realitymedia.digital/data/roomPanos/portal-test-0-sm/Right.png",
                "https://resources.realitymedia.digital/data/roomPanos/portal-test-0-sm/Left.png",
                "https://resources.realitymedia.digital/data/roomPanos/portal-test-0-sm/Top.png",
                "https://resources.realitymedia.digital/data/roomPanos/portal-test-0-sm/Bottom.png",
                "https://resources.realitymedia.digital/data/roomPanos/portal-test-0-sm/Front.png",
                "https://resources.realitymedia.digital/data/roomPanos/portal-test-0-sm/Back.png"],
                ["https://resources.realitymedia.digital/data/roomPanos/portal-test-1-sm/Right.png",
                "https://resources.realitymedia.digital/data/roomPanos/portal-test-1-sm/Left.png",
                "https://resources.realitymedia.digital/data/roomPanos/portal-test-1-sm/Top.png",
                "https://resources.realitymedia.digital/data/roomPanos/portal-test-1-sm/Bottom.png",
                "https://resources.realitymedia.digital/data/roomPanos/portal-test-1-sm/Front.png",
                "https://resources.realitymedia.digital/data/roomPanos/portal-test-1-sm/Back.png"]
            ]
        })
    }
);

//app.use(serveStatic("public"));
app.use(serveStatic("realitymediabook.github.io"));

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
