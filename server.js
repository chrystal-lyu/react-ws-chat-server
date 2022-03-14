// const WebSocket = require("ws");

// const wss = new WebSocket.Server({ port: 3030 });

// wss.on("connection", function connection(ws) {
//   ws.on("message", function incoming(data) {
//     wss.clients.forEach(function each(client) {
//       if (client !== wss && client.readyState === WebSocket.OPEN) {
//         client.send(data);
//       }
//     });
//   });
// });

const webSocketsServerPort = 3030;
const webSocketServer = require("websocket").server;
const http = require("http");
const server = http.createServer();
server.listen(webSocketsServerPort);
const wsServer = new webSocketServer({
  httpServer: server,
});

const getUniqueID = () => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return s4() + s4() + "-" + s4();
};

const clients = {};
let clientMessage = {};

const typesDef = {
  USER_EVENT: "userevent",
  NEW_MESSAGE: "newmessage",
};

const sendMessage = (json) => {
  Object.keys(clients).map((client) => {
    clients[client].sendUTF(json);
  });
};

wsServer.on("request", (request) => {
  var userID = getUniqueID();
  console.log(
    new Date() +
      " Recieved a new connection from origin " +
      request.origin +
      "."
  );
  const connection = request.accept(null, request.origin);
  clients[userID] = connection;
  console.log(
    "connected: " + userID + " in " + Object.getOwnPropertyNames(clients)
  );

  connection.on("message", (message) => {
    if (message.type === "utf8") {
      const dataFromClient = JSON.parse(message.utf8Data);
      const json = { type: dataFromClient.type };
      if (dataFromClient.type === typesDef.NEW_MESSAGE) {
        console.log("new message request");
        clientMessage = dataFromClient.content;
        json.data = { clientMessage };
      }
      sendMessage(JSON.stringify(json));
    }
  });

  connection.on("close", () => {
    console.log(new Date() + " User " + userID + " disconnected.");
    delete clients[userID];
  });
});
