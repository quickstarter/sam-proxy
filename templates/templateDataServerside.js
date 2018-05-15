module.exports = (body, servicesData) => `
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
      ${servicesData.map(([serviceName]) => `<script src="/services/${serviceName}.js"></script>`).join('\n')}
      <script>
        ${servicesData.map(([serviceName, data])=> `
          const props = JSON.parse(\`${JSON.stringify(data)}\`);
          ReactDOM.hydrate(
            React.createElement(${serviceName}, props),
            document.getElementById('${serviceName}')
          );`).join('\n')}
      </script>
    </body>

  </html>
`;