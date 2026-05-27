import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON payload parsing (especially for base64 images)
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini SDK lazily to ensure no startup crashes on missing key
let geminiClient: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY" && API_KEY.trim() !== "") {
      try {
        geminiClient = new GoogleGenAI({
          apiKey: API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (e) {
        console.error("Error creating Gemini Client:", e);
      }
    }
  }
  return geminiClient;
}

// ShikhoAI Educational Multimodal Endpoint
app.post("/api/analyze", async (req, res) => {
  const { prompt, image, imageType } = req.body;

  if (!prompt && !image) {
    return res.status(400).json({ error: "No prompt or image provided." });
  }

  const client = getGeminiClient();

  // If no Gemini client or API key is set, return a high-fidelity educational response simulator
  // so the hackathon prototype works under all environments and showcases amazing Bangla/English features!
  if (!client) {
    console.warn("No GEMINI_API_KEY detected. Running ShikhoAI simulation mode.");
    
    // Custom simulated learning responses based on typical student topics
    const query = (prompt || "").toLowerCase();
    let simulatedResponse = "";
    
    if (image) {
      simulatedResponse = `### 📚 [সিমুলেটর মোড] টেক্সটবুক ইমেজ বিশ্লেষণ (OCR active)
আমরা আপনার আপলোড করা বইটি স্ক্যান করেছি। 

**পাওয়া গেছে:** "মহাকর্ষ বল সম্পর্কিত কিছু সমীকরণ F = G*(m1*m2)/r^2."

**তাত্ত্বিক ব্যাখ্যা (Gravitational Force):**
মহাকর্ষ হলো এই মহাবিশ্বের যেকোনো দুটি বস্তুর মধ্যকার পারস্পরিক আকর্ষণ বল। স্যার আইজ্যাক নিউটন ১৬৮৭ সালে এই সূত্রটি প্রকাশ করেন।
* **সমীকরণ:** F = G * (m1 * m2) / r^2
* **ব্যাখ্যা:** বস্তুকণাদ্বয়ের ভরের গুণফলের সমানুপাতিক এবং তাদের মধ্যকার দূরত্বের বর্গের ব্যস্তানুপাতিক।

*অনুরোধ:* এই উত্তরটি একটি সিমুলেটেড টিউটোরিয়াল। আসল এআই মডেলের সাথে সরাসরি সংযোগের জন্য অনুগ্রহ করে **Settings > Secrets** প্যানেলে আপনার **GEMINI_API_KEY** যোগ করুন।`;
    } else if (query.includes("সালোকসংশ্লেষণ") || query.includes("photosynthesis")) {
      simulatedResponse = `### 🌿 সালোকসংশ্লেষণ (Photosynthesis) কী?

**সালোকসংশ্লেষণ** হলো এমন এক শারীরিক-রাসায়নিক প্রক্রিয়া যার মাধ্যমে সবুজ উদ্ভিদ, শৈবাল এবং কিছু ব্যাকটেরিয়া সূর্যালোকের শক্তি ব্যবহার করে কার্বন ডাই অক্সাইড ($CO_2$) এবং জল ($H_2O$) থেকে শর্করা (গ্লুকোজ) তৈরি করে।

#### 🧪 রাসায়নিক বিক্রিয়া (Chemical Equation)
6CO_2 + 12H_2O = C_6H_{12}O_6 + 6O_2 + 6H_2O (সূর্যালোক ও ক্লোরোফিলের উপস্থিতিতে)

#### 🔑 মূল পয়েন্টসমূহ:
1. **স্থান:** পাতার মেসোফিল কলার ক্লোরোপ্লাস্টে এটি ঘটে।
2. **প্রয়োজনীয় উপাদান:** সূর্যালোক, ক্লোরোফিল, কার্বন ডাই অক্সাইড এবং পানি।
3. **গুরুত্ব:** এই প্রক্রিয়াই পৃথিবীর সকল শক্তির উৎস এবং বায়ুমণ্ডলে অক্সিজেনের ভারসাম্য রক্ষা ও কার্বন হ্রাস করার মূল মাধ্যম।

*দ্রষ্টব্য: এটি চমৎকার বাংলায় ব্যাখ্যা করা হয়েছে।*`;
    } else if (query.includes("মহাকর্ষ") || query.includes("gravity")) {
      simulatedResponse = `### 🌌 মহাকর্ষ ও অভিকর্ষ (Gravity & Gravitation)

মহাবিশ্বের যেকোনো দুটি বস্তুর মধ্যকার পারস্পরিক আকর্ষণ বলকে **মহাকর্ষ** বলে। আর পৃথিবী যখন কোনো বস্তুকে আকর্ষণ করে, তখন তাকে **অভিকর্ষ** বলে।

#### 📐 নিউটনের মহাকর্ষ সূত্র (Newton's Gravitational Law)
সূত্র অনুসারে আকর্ষণ বল F হলো:
F = G * (m1 * m2) / d^2

* G = মহাকর্ষীয় ধ্রুবক (6.674e-11 N m^2/kg^2)
* m1, m2 = বস্তুদ্বয়ের ভর
* d = বস্তুদ্বয়ের মধ্যবর্তী দূরত্ব

#### 💡 আপনি কি জানেন?
আপনার ওজন চাঁদে পৃথিবীর ওজনের মাত্র **১/৬ ভাগ** হবে, কারণ চাঁদের মহাকর্ষ বল পৃথিবীর চেয়ে অনেক কম!`;
    } else {
      simulatedResponse = `### 🎓 ShikhoAI শিক্ষামূলক অ্যাসিস্ট্যান্ট
আপনার প্রশ্ন: **"${prompt || "ইমেজ বিশ্লেষণ"}"**

আমি আপনার লার্নিং ড্যাশবোর্ডে সংযুক্ত আছি। জটিল শিক্ষামূলক সমস্যার বিস্তারিত সমাধান প্রদানের জন্য আমি সর্বদা প্রস্তুত।

**আজকের বিষয়সমূহ:**
* 🎯 **সহজ ও সরল ভাষা:** বাংলা ও ইংরেজি উভয় ভাষায় পারদর্শী।
* 🔬 **সমীকরণ ও লজিক:** গাণিতিক ও বৈজ্ঞানিক সূত্রের নিখুঁত বিশ্লেষণ।

*(বাস্তব এআই প্রতিক্রিয়ার জন্য অনুগ্রহ করে Settings-এ GEMINI_API_KEY কনফিগার করুন)*`;
    }

    return res.json({
      text: simulatedResponse,
      isSimulated: true,
      ocrText: image ? "মহাকর্ষ বল সম্পর্কিত সমাধান: F = G * m1 * m2 / r^2" : null
    });
  }

  try {
    const systemInstruction = 
      "You are ShikhoAI (শিখো এআই), a highly capable educational tutor who creates step-by-step guidance " +
      "for students. Encourage critical thinking. Support both English and Bengali (Bangla). " +
      "Always output your answers in beautifully structured markdown, using lists, bold texts, and LaTeX blocks where relevant. " +
      "If the student writes in Bangla or sends a Bangla voice prompt, respond in warm, natural Bangla language. " +
      "Keep answers clean, encouraging, easy to read, and academically robust.";

    let response;
    
    if (image) {
      // Multimodal processing (Image + Text prompt)
      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");
      
      const imagePart = {
        inlineData: {
          mimeType: imageType || "image/jpeg",
          data: cleanBase64,
        },
      };

      const textPart = {
        text: prompt && prompt.trim() !== "" 
          ? `Please perform visual OCR on this educational textbook page/diagram, read everything inside, and reply to this follow-up query: "${prompt}"`
          : "Please read this whiteboard/notebook/textbook image, detect the main content or academic problems, list down key translated captions, and provide a clear, step-by-step mathematical or conceptual explanation in Bangla.",
      };

      response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
    } else {
      // Text-only QA processing
      response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
    }

    return res.json({
      text: response.text,
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("Gemini model execution crash:", error);
    return res.status(500).json({ 
      error: "Error generating response from Gemini model.",
      details: error.message 
    });
  }
});

// App initialization
async function startServer() {
  // Vite integration based on guidelines
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ShikhoAI server running on http://0.0.0.0:${PORT}`);
    if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY") {
      console.log("提示: GEMINI_API_KEY environment variable is not configured. Running mock simulation.");
    }
  });
}

startServer();
