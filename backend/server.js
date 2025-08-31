const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

app.post('/generate-code', async (req, res) => {
  const { components } = req.body;

  const prompt = `
    You are a web developer. Your task is to generate a simple React component based on a JSON description.
    Here is the JSON:
    ${JSON.stringify(components)}

    Generate a single-file React component that displays a heading with the text from the JSON.
    Do not include extra explanations or comments. Just the code.
  `;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3',
        prompt: prompt,
        stream: false,
      }),
    });

    const data = await response.json();

    // The generated code is in the 'response' key of the JSON
    const generatedCode = data.response;

    console.log('AI-Generated Code:\n\n', generatedCode);
    res.json({ code: generatedCode });
  } catch (error) {
    console.error('Error calling Ollama API:', error.message);
    res.status(500).json({ error: 'Failed to generate code.' });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});