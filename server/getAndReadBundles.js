const axios = require('axios');
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));

module.exports = async function getAndReadBundles(serviceStore, servers, clientBundleFolder, serverBundleFolder) {
  ['client', 'server'].forEach(async domain => {
    const forServer = domain === 'server';
    const serviceNames = Object.keys(servers[domain]);

    serviceNames.forEach(async serviceName => {
      const folder = forServer ? serverBundleFolder : clientBundleFolder;
      const file = folder + '/' + serviceName + '.js';

      try {
        // Throws an error if file doesn't exist, which triggers fetching
        forServer ? serviceStore[serviceName] = require(file) : require(file); 
      } catch (nonexistentFileErr) {
        try {
          const bundle = (await axios.get(servers[domain][serviceName])).data;
          await fs.writeFileAsync(file, bundle);
          forServer ? serviceStore[serviceName] = require(file) : null;
        } catch (err) {
          console.error(err);
        }
      }
    });
  })
  console.log('Done loading services');
}