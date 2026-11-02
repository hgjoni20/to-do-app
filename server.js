import express from 'express';
import 'dotenv/config';
import { errorHandler } from "./middleware/errorHandler.js";
import path from 'path';
import { fileURLToPath } from 'url';
import router from "./routes/db.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(errorHandler);
app.use(express.static(path.join(__dirname, 'public')));

app.use("/tasks", router);

app.listen(port, ()=>{
    console.log(`app listening port ${port}`)
})
