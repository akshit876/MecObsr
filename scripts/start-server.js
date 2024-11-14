const { exec } = require('child_process');
const isWindows = process.platform === 'win32';

// Command to kill process based on OS
const killCommand = isWindows
  ? 'taskkill /F /IM node.exe' // Windows
  : 'kill -9 $(lsof -t -i:3000)'; // Mac/Linux

// Function to start Next.js server
const startNextServer = () => {
  const nextServer = exec('next start', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });

  nextServer.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  nextServer.stderr.on('data', (data) => {
    console.error(data.toString());
  });
};

// Kill existing process and start server
console.log('Checking for existing processes on port 3000...');
exec(killCommand, (error) => {
  if (error) {
    console.log('No existing process found on port 3000');
  } else {
    console.log('Killed existing process on port 3000');
  }

  console.log('Starting Next.js server...');
  startNextServer();
});
