import 'dotenv/config';
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Set up the native PostgreSQL connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 2. Initialize Prisma Client using the new adapter
const prisma = new PrismaClient({ adapter });

const app = express();
const port = 3000;


// Middleware to parse incoming JSON
app.use(express.json());

// --- ROUTES ---

// 1. CREATE an Item (The "Store Now" approach)
app.post('/api/items', async (req: Request, res: Response) => {
  try {
    const { name, quantity, location, assetType } = req.body;

    const newItem = await prisma.item.create({
      data: {
        name,
        quantity: quantity || 1, // Default to 1 if not provided
        location,
        assetType,
      },
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// 2. READ all Items
app.get('/api/items', async (req: Request, res: Response) => {
  try {
    // findMany() fetches everything. Later we can add search filters here!
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' } // Shows newest items first
    });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'success', message: 'API is connected to the database!' });
});

// --- SERVER START ---
app.listen(port, () => {
  console.log(`[server]: API running at http://localhost:${port}`);
});