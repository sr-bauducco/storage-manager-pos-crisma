import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; // 1. Import CORS
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

app.use(cors());

app.use(express.json());


// --- SECURITY MIDDLEWARE ---
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // 1. Let all GET requests pass through freely so the public can view the items
  if (req.method === 'GET') {
    return next();
  }

  // 2. For POST, PUT, and DELETE, check for the secret token
  const expectedToken = process.env.ADMIN_TOKEN;
  const providedToken = req.headers['authorization'];

  // We expect the header to look like: "Bearer my-super-secret-camp-password"
  if (providedToken === `Bearer ${expectedToken}`) {
    return next(); // Password matches, let them through!
  }

  // 3. If the password is wrong or missing, kick them out
  res.status(401).json({ error: 'Unauthorized: Admin access required to modify data.' });
};

// Apply the middleware to all routes below this line
app.use(requireAuth);


//Middleware for starting the routes
app.use(express.json());

// --- ROUTES ---
// 1. CREATE Item(s) - Upgraded with bulletproof null-handling
app.post('/api/items', async (req: Request, res: Response) => {
  try {
    // SCENARIO A: The user sent an array of multiple items
    if (Array.isArray(req.body)) {
      const newItems = await prisma.item.createMany({
        data: req.body.map(item => ({
          name: item.name,
          quantity: item.quantity || 1,
          // Convert empty strings to undefined so Prisma ignores them
          location: item.location === "" ? undefined : item.location,
          assetType: item.assetType === "" ? undefined : item.assetType,
          categoryId: item.categoryId === "" ? undefined : item.categoryId
        }))
      });
      res.status(201).json({ message: `Successfully stored ${newItems.count} items!` });
      return; 
    }

    // SCENARIO B: The user sent a single item
    const { name, quantity, location, assetType, categoryId } = req.body;
    const newItem = await prisma.item.create({
      data: {
        name,
        quantity: quantity || 1,
        // Convert empty strings to undefined so Prisma ignores them
        location: location === "" ? undefined : location,
        assetType: assetType === "" ? undefined : assetType,
        categoryId: categoryId === "" ? undefined : categoryId
      },
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error("🔥 DATABASE ERROR:", error);
    res.status(500).json({ error: 'Failed to create item(s)' });
  }
});

// 2. READ all Items
app.get('/api/items', async (req: Request, res: Response) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' }, // Shows the newest items first
      include: {
        category: true, // Automatically fetches the linked Category
        kits: true,     // Automatically fetches an array of all linked Kits
      },
    });
    
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.put('/api/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Grabs the ID from the URL
    const { name, quantity, location, assetType, categoryId } = req.body;

    const updatedItem = await prisma.item.update({
      where: { id },
      data: { name, quantity, location, assetType, categoryId },
    });

    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// 4. DELETE an Item
app.delete('/api/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.item.delete({
      where: { id },
    });
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// --- CATEGORY ROUTES ---

app.post('/api/categories', async (req: Request, res: Response) => {
  try {
    const newCategory = await prisma.category.create({
      data: { name: req.body.name },
    });
    res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// --- KIT ROUTES ---

app.post('/api/kits', async (req: Request, res: Response) => {
  try {
    const newKit = await prisma.kit.create({
      data: { name: req.body.name },
    });
    res.status(201).json(newKit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create kit' });
  }
});

app.get('/api/kits', async (req: Request, res: Response) => {
  try {
    const kits = await prisma.kit.findMany({
      include: { items: true }, // Prisma magic: This automatically fetches all items inside the kit!
    });
    res.json(kits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch kits' });
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