import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'success', 
    message: 'Camp Storage API is running and ready for data!' 
  });
});

app.listen(port, () => {
  console.log(`[server]: API running at http://localhost:${port}`);
});