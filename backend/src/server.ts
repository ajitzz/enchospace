import http from 'node:http';

const PORT = Number(process.env.PORT || 8080);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'encho-api' }));
    return;
  }

  if (req.url === '/api/meta/policies' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        bookingModes: ['request_to_book', 'instant_book', 'manual_approval'],
        paymentModes: ['full_upfront', 'deposit_plus_balance', 'pay_later'],
        stayModes: ['long_stay_only', 'short_stay_only', 'both']
      })
    );
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`ENCHO API listening on :${PORT}`);
});
