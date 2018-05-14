require('newrelic');
// Modules for basic server functionality
const express = require('express');
const path = require('path');
const cors = require('cors');
const cluster = require('cluster');
const cpuCount = require('os').cpus().length;

const HTML = require(path.join(__dirname, '../templates/templateDataClientside.js'));
const serviceServers = require(path.join(__dirname, './serviceServers.js'));

const services = {};
const clientBundleFolder = path.join(__dirname, '../public/services');
const serverBundleFolder = path.join(__dirname, '../templates/services');

// Get each service's bundle from component server if you don't have it yet
// Then add server-side bundles as properties on 'services'
require(path.join(__dirname, 'getAndReadBundles.js'))
  (services, serviceServers, clientBundleFolder, serverBundleFolder);

const port = process.env.PORT || 3000;

if (cluster.isMaster && cpuCount > 1) {
  console.log(`Master ${process.pid} started`);

  for (let i = 0; i < cpuCount; i++) { cluster.fork(); }

  cluster.on('exit', (worker, code) => code ? 
      console.log(`Worker ${worker.process.pid} killed by error, code ${code}`) :
      console.log(`Worker ${worker.process.pid} exited`)
  );
} else {
  const app = express();
  app.use(cors());
  app.get('/', (req, res) => {
    try {
      // The query string is just ?<id>, not ?id=<id>, so this gets the id
      const id = Object.keys(req.query)[0];
      res.send(HTML(Object.entries(services), id));
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.listen(port, () => {
    console.log(`Worker ${process.pid} listening at: http://localhost:${port}`);
  });
}
