import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createMongoClient, createMongoRepositories } from '@forreal/infrastructure-mongodb';
import { InitiateTransferUseCase } from '@forreal/application/transactions/usecases/InitiateTransferUseCase';

async function bootstrap() {
  const app = express();
  const port = Number(process.env.PORT || 4000);
  const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

  app.use(cors({ origin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const mongoDb = process.env.MONGO_DB || 'forreal';

  const mongoClient = await createMongoClient(mongoUri);
  const db = mongoClient.db(mongoDb);
  const { accountRepo, brokerageRepo, transactionRepo } = createMongoRepositories(db);
  const transferUseCase = new InitiateTransferUseCase(accountRepo, brokerageRepo, transactionRepo);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', framework: 'express', db: 'mongodb' });
  });

  app.post('/api/transfers', async (req: Request, res: Response) => {
    try {
      const { userId, sourceType, sourceAccountId, destinationAccountId, destinationIban, amount, description } = req.body || {};

      const result = await transferUseCase.execute({
        userId: typeof userId === 'string' ? userId : '',
        sourceType,
        sourceAccountId,
        destinationAccountId,
        destinationIban,
        amount: Number(amount),
        description,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Transfer route error', error);
      return res.status(500).json({ message: 'Unexpected error' });
    }
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error', err);
    res.status(500).json({ message: 'Internal server error' });
  });

  const server = app.listen(port, () => {
    console.log(`Express API listening on http://localhost:${port}/api`);
  });

  const shutdown = async () => {
    await mongoClient.close();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Express bootstrap failed', error);
  process.exit(1);
});
