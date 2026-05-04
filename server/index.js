const dotenv = require("dotenv");
const http = require("http");

dotenv.config();

const app = require("./src/app");
const connectDb = require("./src/config/db");
const { initSocket } = require("./src/socket/socketHub");

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const server = http.createServer(app);

initSocket(server, CLIENT_URL);

connectDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`SplitChill API listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start SplitChill API", error);
    process.exit(1);
  });
