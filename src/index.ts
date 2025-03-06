import express from "express";
import cors from "cors";
import dotenv from "dotenv-safe";
import reviewRoutes from "./ports/rest/routes/review";
import { config } from "./config/config";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

dotenv.config({
	allowEmptyValues: true,
	path: `.env.${process.env.NODE_ENV || "local"}`,
	example: ".env.example",
});

const port = config.port || 3008;
app.use("/healthcheck", (req, res) => {
	res.status(200).send("The Review Service is ALIVE!");
});

app.use("/review", reviewRoutes);

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
