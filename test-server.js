import express from 'express';

const app = express();
const PORT = 3002;

app.use(express.json());

// Simple test routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

app.get('/api/templates/:id/configuration', (req, res) => {
  res.json({ message: `Configuration route for template ${req.params.id}` });
});

app.put('/api/templates/:id/configuration', (req, res) => {
  res.json({ message: `PUT configuration route for template ${req.params.id}`, body: req.body });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log('Routes registered:');
  console.log('GET /api/test');
  console.log('GET /api/templates/:id/configuration');
  console.log('PUT /api/templates/:id/configuration');
});