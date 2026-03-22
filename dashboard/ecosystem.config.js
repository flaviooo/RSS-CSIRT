module.exports = {
  apps: [
    {
      name: 'RSS-CSIRT', // Nome dell'app
      script: 'node_modules/next/dist/bin/next', // Percorso al binario di Next.js
      args: 'start', // Comando per avviare Next.js in produzione
      env: {
        PORT: 3006, // Porta su cui l'app sarà in ascolto
        NODE_ENV: 'production' // Ambiente di produzione
      },
      out_file: 'log/out.log', // Log di output
      error_file: 'log/err.log', // Log di errori
      log_date_format: 'YYYY-MM-DD HH:mm Z', // Formato data nei log
      time: true // Includi la durata nei log
    }
  ]
};