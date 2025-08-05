const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// New function to analyze sustainability based on title and description
async function analyzeSustainabilityByText(title, description) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Analyze this fashion product and determine its sustainability score on a scale of 1-10. 
            
            Product Title: ${title}
            Product Description: ${description || 'No description provided'}
            
            Consider these factors:
            - Material sustainability (organic, recycled, synthetic vs natural)
            - Production methods implied by the description
            - Likely durability and lifespan based on the product type
            - Potential for recycling/upcycling
            - Environmental impact of the product category
            
            Score Guide:
            1-3: Poor sustainability (synthetic materials, fast fashion, single-use)
            4-6: Moderate sustainability (mixed materials, standard production)
            7-9: Good sustainability (organic/recycled materials, durable design)
            10: Excellent sustainability (fully sustainable materials, circular design)
            
            Respond ONLY with a JSON object containing:
            {
                "score": [number between 1-10],
                "analysis": [brief text explanation, max 100 words]
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(cleanText);

        return {
            score: Math.min(10, Math.max(1, jsonResponse.score)),
            analysis: jsonResponse.analysis
        };
    } catch (err) {
        console.error("Gemini API error:", err);
        // Return a default score if API fails
        return {
            score: 5,
            analysis: "Unable to analyze sustainability at this time"
        };
    }
}

// Keep the original image analysis function for backward compatibility
async function analyzeSustainability(imageUrl) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer'
        });
        const base64Image = Buffer.from(imageResponse.data).toString('base64');

        const prompt = `
            Analyze this fashion product image and determine its sustainability score on a scale of 1-10. 
            Consider these factors:
            - Material sustainability (organic, recycled, etc.)
            - Production methods (water usage, carbon footprint)
            - Likely durability and lifespan
            - Potential for recycling/upcycling
            
            Respond ONLY with a JSON object containing:
            {
                "score": [number between 1-10],
                "analysis": [brief text explanation]
            }
        `;

        const imageParts = [{
            inlineData: {
                data: base64Image,
                mimeType: "image/jpeg"
            }
        }];

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(cleanText);

        return {
            score: Math.min(10, Math.max(1, jsonResponse.score)),
            analysis: jsonResponse.analysis
        };
    } catch (err) {
        console.error("Gemini API error:", err);
        throw err;
    }
}

module.exports = { analyzeSustainability, analyzeSustainabilityByText };