import { Router } from 'express';
import SR from "./SR.js"

const routes = Router();

routes.use('/api/update/', SR)

routes.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' });
});

export default routes;