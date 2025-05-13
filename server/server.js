const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:;"
  );
  next();
});


app.use(express.json({ limit: "20mb" }));

app.use(express.static(path.join(__dirname, "../public")));



// Gemini API route
app.post("/api/gemini", async (req, res) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: req.body.contents },
      { headers: { "Content-Type": "application/json" } }
    );
    res.json(response.data);
  } catch (err) {
    console.error("Gemini API error:", err.message);
    res.status(500).json({ error: "Failed to connect to Gemini API." });
  }
});

//  Catch-all 404 handler 
app.use((req, res) => {
  res.status(404).send("404 - Not Found");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
