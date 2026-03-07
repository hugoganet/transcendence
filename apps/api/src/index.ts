import { app } from "./app.js";
import { registerShutdownHandlers } from "./config/database.js";

registerShutdownHandlers();

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
