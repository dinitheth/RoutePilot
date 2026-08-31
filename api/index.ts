import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { apiRouter } from '../backend/api/routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Support both /api/* requests and direct serverless invocation
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
