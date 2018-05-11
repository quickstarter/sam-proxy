module.exports = (body, serviceNames) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Quickstarter</title>
    </head>
    <body>
    ${body}
    </body>
      <script src="/lib/react.development.js"></script>
      <script src="/lib/react-dom.development.js"></script>
      ${serviceNames.map(service => `<script src="/services/${service}.js"></script>`).join('\n')}
  <script>
    ${serviceNames.map(service => `
      ReactDOM.hydrate(
        React.createElement(${service}),
        document.getElementById('${service}')
      );`).join('\n')}
  </script>
  </html>
`;