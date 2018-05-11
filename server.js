require('newrelic');
// Modules for basic server functionality
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const cluster = require('cluster');
const cpuCount = require('os').cpus().length;

// Modules for server-side rendering
const React = require('react');
const ReactDOM = require('react-dom/server');
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const fetch = require('node-fetch');

const HtmlTemplate = require('./template.js');
const serviceServers = require('./serviceServers.js');
const clientBundleFolder = './public/services';
const serverBundleFolder = './templates/services';
const services = {};

// Get each service's bundle from component server if you don't have it yet
// Then add server-side bundles as properties on 'services'
(async function getAndReadBundles() {
  ['client', 'server'].forEach(domain => {
    const forServer = domain === 'server';
    const serviceNames = Object.keys(serviceServers[domain]);

    serviceNames.forEach(serviceName => {
      const folder = forServer ? serverBundleFolder : clientBundleFolder;
      const file = folder + '/' + serviceName + '.js';

      try {
        // Throws an error if file doesn't exist, which triggers fetching
        forServer ? services[serviceName] = require(file) : require(file); 
      } catch (nonexistentFileErr) {
        try {
          const bundle = await fetch(serviceServers[domain][serviceName]);
          await fs.writeFileAsync(file, bundle);
          forServer ? services[serviceName] = require(file) : null;
        } catch (err) {
          console.error(err);
        }
      }
    });
  })
  console.log('Done loading services');
})();

const getDataAndSSR = async (serviceName, id) => {
  const data = await fetch(serviceServers.data[serviceName]);
  return ReactDOM.renderToString(React.createElement(services[serviceName], data));
};
const renderComponentStrings = async (components, id = 0) => {
  return Object.keys(components)
    .reduce(name => 
      `<div id=${name}>${await getDataAndSSR(name, props))}</div>`, '');
}

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
  app.get('/', async (req, res) => {
    const body = await renderComponentStrings(services, Object.keys(req.query)[0]);
    res.send(HtmlTemplate(body, Object.keys(services)));
  });
  app.use(express.static(path.join(__dirname, 'public')));

  app.listen(port, () => {
    console.log(`Worker ${process.pid} listening at: http://localhost:${port}`);
  });
}
