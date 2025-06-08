import express from "express";
import { Router } from "express";
import cors from "cors";

import authRouter from "./src/routes/auth.js";
import usersRouter from "./src/routes/users.js";
import pensRouter from "./src/routes/pens.js";
import tagsRouter from "./src/routes/tags.js";
import favoritesRouter from "./src/routes/favorites.js";
import commentsRouter from "./src/routes/comments.js";
import followsRouter from "./src/routes/follows.js";
import searchRouter from "./src/routes/search.js";
import myRouter from "./src/routes/my.js"

const PORT = 3000;

const app = express();
app.use(
	cors({
		origin: "http://localhost:5173",
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/pens", pensRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/follows", followsRouter);
app.use("/api/search", searchRouter);
app.use("/api/my",myRouter)

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
