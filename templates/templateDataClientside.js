const React = require('react');
const ReactDOM = require('react-dom/server');

module.exports = (services, id) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Quickstarter</title>
    </head>
    <body>
    ${services.map(([name, component]) => 
      `<div id=${name}>
        ${ReactDOM.renderToString(React.createElement(component, {projectId: id}))}
      </div>`, '')
      }
      <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
      ${services.map(([name]) => `<script src="/services/${name}.js"></script>`).join('\n')}
      <script>
        ${services.map(([name])=> `
          ReactDOM.hydrate(
            React.createElement(${name}, {projectId: ${id}}),
            document.getElementById('${name}')
          );`).join('\n')}
      </script>
    </body>

  </html>
`;