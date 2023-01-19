const createError = require("http-errors");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { format } = require("date-fns");

// 1st party dependencies
const configData = require("./config/connection");
const indexRouter = require("./routes/index");

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

async function getApp() {
  // Database
  const connectionInfo = await configData.getConnectionInfo();
  mongoose.connect(connectionInfo.DATABASE_URL);

  const app = express();

  const port = normalizePort(process.env.PORT || "3000");
  app.set("port", port);

  app.use(logger("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.locals.format = format;

  app.use("/", indexRouter);
  app.use("/users", require("./controllers/user.controller"));
  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    next(createError(404));
  });

  // error handler
  app.use((err, req, res, next) => {
    if (typeof err === "string") {
      // custom application error
      return res.status(400).json({ message: err });
    }

    if (err.name === "UnauthorizedError") {
      // jwt authentication error
      return res.status(401).json({ message: "Invalid Token" });
    }

    // default to 500 server error
    return res.status(500).json({ message: err.message });
  });

  return app;
}

module.exports = {
  getApp,
};
