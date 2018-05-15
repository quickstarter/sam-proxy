require('newrelic');
// Modules for basic server functionality
const express = require('express');
const path = require('path');
const cors = require('cors');
const cluster = require('cluster');
const cpuCount = require('os').cpus().length;

// Modules for server-side rendering
const React = require('react');
const ReactDOM = require('react-dom/server');
const axios = require('axios');

const HTML = require(path.join(__dirname, '../templates/templateDataServerside.js'));
const serviceServers = require(path.join(__dirname, './serviceServers.js'));

const services = {};
const clientBundleFolder = path.join(__dirname, '../public/services');
const serverBundleFolder = path.join(__dirname, '../templates/services');

// Get each service's bundle from component server if you don't have it yet
// Then add server-side bundles as properties on 'services'
require(path.join(__dirname, 'getAndReadBundles.js'))
  (services, serviceServers, clientBundleFolder, serverBundleFolder);

const getData = async id => {
  const data = {};
  const promises = [];
  Object.entries(serviceServers.data).forEach(([serviceName, dataPath]) =>  {
    const dataPromise = axios.get(dataPath + id);
    dataPromise.then(response => data[serviceName] = response.data);
    promises.push(dataPromise);
  });
  await Promise.all(promises);
  return data;
}

const renderComponentStrings = async (servicesData) => {
  return Object.entries(servicesData)
    .reduce(async (body, [serviceName, data]) => 
      `<div id=${serviceName}>
        ${ReactDOM.renderToString(React.createElement(services[serviceName], {data}))}
      </div>`, '');
}

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
  app.get('/', async (req, res) => {
    try {
      const id = Object.keys(req.query)[0]
      const servicesData = await getData(id);
      const body = await renderComponentStrings(servicesData);
      res.send(HTML(body, Object.entries(servicesData)));
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
