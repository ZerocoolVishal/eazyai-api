// models/phi4.js
const { InferenceClient } = require('@huggingface/inference');

// You can set this token via environment variable or hardcode for now (not recommended)
const client = new InferenceClient(process.env.HUGGINGFACE_TOKEN);

// const modelName = 'microsoft/phi-4';
const modelName = 'meta-llama/Llama-3.1-8B-Instruct';

/**
 * Suggest product info using the `conversational` task with microsoft/phi-4
 * @param {string} title
 * @param {string} context
 * @returns {Promise<Object>} Suggested structured info
 */
async function suggestProductInfo(title, context) {

    console.log("--------------------------------------------------");
    console.log("Processing:", title);

    const prompt = `
You are a product classification assistant.

Given this product:

Title: ${title}
Description: ${context}

Please suggest:
- A main category
- A subcategory
- Three relevant tags

Respond only in JSON format like this:
{
  "category": "Books",
  "subcategory": "Fiction",
  "tags": ["novel", "bestseller", "reading"]
}
`;

    try {
        const result = await client.chatCompletion({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            // inputs: {
            //     past_user_inputs: [],
            //     generated_responses: [],
            //     text: prompt.trim(),
            // },
        });
        console.log("Result:", result);
        const text = result.choices[0].message.content.trim();
        const jsonStart = text.indexOf('{');
        if (jsonStart === -1) {
            return { error: 'Could not find JSON in response', raw: text };
        }
        return JSON.parse(text.slice(jsonStart));
    } catch (err) {
        console.log("Error:", err.message);
        return { error: 'Conversational call failed', details: err.message };
    }
}

module.exports = { suggestProductInfo };