require('newrelic');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const cluster = require('cluster');
const cpuCount = require('os').cpus().length;

const port = process.env.PORT || 3000;

if (cluster.isMaster && cpuCount > 1) {
  console.log(`Master ${process.pid} started`);
  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code) => {
    if (code) {
      console.log(`Worker ${worker.process.pid} killed by error, code ${code}`);
    } else {
      console.log(`Worker ${worker.process.pid} exited`);
    }
  });
} else {
  const app = express();
  // app.use(morgan('dev'));
  app.use(cors());
  app.use(express.static(path.join(__dirname, 'public')));

  app.listen(port, () => {
    console.log(`Worker ${process.pid} listening at: http://localhost:${port}`);
  });
}
