const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRouter = require("./routes/userRoutes");
const productRouter = require("./routes/productRoutes");
const feedbackRouter = require("./routes/feedbackRoutes");
const donationRouter = require("./routes/donationRoutes");
const orderRouter = require("./routes/orderRoutes");
const resourceRouter = require("./routes/resourceRoutes");
const requestRouter = require("./routes/requestRoutes");
const commentRouter = require("./routes/commentRoutes");
const articleRouter = require("./routes/articleRoutes");
const exchangeRouter = require("./routes/exchangeRoutes");
const wishlistRouter = require("./routes/wishlistRoutes");
const cartRouter = require("./routes/cartRoutes");
const chatRouter = require("./routes/chatRoutes");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// MIDDLEWARES
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:4200",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
  origin: true,
  credentials: true,
};
app.use(cors(corsOptions));

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
app.get("/success", (req, res) => {
  res.send("Success");
});
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/feedbacks", feedbackRouter);
app.use("/api/v1/donations", donationRouter);
app.use("/api/v1/requests", requestRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/resources", resourceRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/articles", articleRouter);
app.use("/api/v1/exchanges", exchangeRouter);
app.use("/api/v1/wishlists", wishlistRouter);
app.use("/api/v1/carts", cartRouter);
app.use("/api/v1/chat", chatRouter);

app.all("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/uploads/articles")) return next();

  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
module.exports = app;
