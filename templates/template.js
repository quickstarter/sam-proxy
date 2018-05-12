module.exports = (body, serviceNames) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Quickstarter</title>
    </head>
    <body>
    ${body}
      <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
      ${serviceNames.map(service => `<script src="/services/${service}.js"></script>`).join('\n')}
      <script>
        console.log(Community);
        ${serviceNames.map(service => `
          ReactDOM.hydrate(
            React.createElement(${service}.default),
            document.getElementById('${service}')
          );`).join('\n')}
      </script>
    </body>

  </html>
`;