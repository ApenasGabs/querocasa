import express from "express";
import geoLocations from "./routes/geoLocations.js";
import pingRoute from "./routes/ping.js";
import resultsRoute from "./routes/results.js";

const app = express();

app.use("/api", geoLocations);
app.use("/api", pingRoute);
app.use("/api", resultsRoute);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
