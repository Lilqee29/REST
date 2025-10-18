import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import promoRouter from "./routes/promoCodeRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import newsletterRoutes from './routes/newsletterRoute.js'

const app = express();
const port = process.env.PORT || 5000;

// ✅ 1. Connect to MongoDB
connectDB();

// ✅ 2. Enable CORS **BEFORE any routes**
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:2000","https://overpolemical-paulette-lymphangiomatous.ngrok-free.dev","http://192.168.1.20:2000","https://rest-silk.vercel.app"], // frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ 3. Stripe webhook must use raw body (this route defined inside orderRouter)
app.post(
  "/api/order/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    // Let orderRouter handle it
    next();
  }
);

// ✅ 4. Now apply JSON parser for all other routes
app.use(express.json());

// ✅ 5. Mount routers AFTER middlewares
app.use("/api/order", orderRouter);
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/review", reviewRouter);
app.use("/api/promo", promoRouter);
app.use("/api/newsletter", newsletterRoutes);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => {
  console.log(`✅ Server started on port: ${port}`);
});
