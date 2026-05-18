module.exports = {
  apps: [
    {
      name: 'Ink Muse API',
      script: 'node ./build/bin/server.js',
      error_file: './tmp/err.log',
      out_file: './tmp/out.log',
      log_file: './tmp/combined.log',
      log_date_format: 'YYYY-MM-DD_HH-mm-ss',
      autorestart: true,
      ignore_watch: [
        'node_modules',
        'public',
        'tmp',
        'storage',
        '.git',
        '.history',
        '.idea',
        '.vscode',
        '.cache',
      ],
    },
  ],
}
