
// next-server.js
import next from 'next';
import http from 'http';

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((req, res) => {
      handle(req, res);
    })
    .listen(3000, (err) => {
      if (err) throw err;
      console.log('Next.js app with API routes is running on http://localhost:3000');
    });
});
