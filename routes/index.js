const express = require('express');
const router = express.Router();
const Task = require('../models/task');

/* GET home page. */
router.get('/', function (req, res, next) {
  const task = new Task({
    taskName: 'test'
  });

  task.save()
    .then(() => {
      console.log(`Added new task ${task}`);
      res.status(200).json(task);
    })
    .catch((err) => {
      console.log(err);
      res.send('Sorry! Something went wrong.');
    });
});

module.exports = router;
