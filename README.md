# 🤖 AI Support Ticket Classifier Webhook

A production-ready webhook built with **TypeScript** and **Express.js** that uses AI (DeepSeek) to automatically triage, classify, and route incoming support tickets.

Built with a strict **Technical Support Engineer mindset**: focusing on data validation, fail-fast architecture, and deterministic AI outputs.

## 🚀 Business Value
Customer support teams spend countless hours manually reading and triaging tickets. This webhook automates the process in milliseconds by:
1. **Categorizing** the issue (Billing, Technical, Integration, etc.).
2. **Assigning priority** (Low, Medium, High, Critical).
3. **Generating contextual auto-replies** or escalating to a human agent immediately if needed.

## 🧠 Key Architecture Highlights
* **Fail-Fast Configuration (`config.ts`):** The server crashes intentionally on startup if critical environment variables (like API keys) are missing, preventing silent failures in production.
* **Strict Type Contracts (`types.ts`):** Ensures unpredictable client data doesn't break the application by defining clear interfaces for incoming and outgoing data.
* **LLM Output Validation (`classifier.ts`):** AI models can hallucinate. This app includes a strong validation layer that intercepts the AI response and verifies it against allowed strict types before passing it to the rest of the system.
* **Global Error Handling (`server.ts`):** A safety net that catches any unhandled promise rejections, ensuring the client receives a clean `500 Internal Error` JSON response instead of a hanging request.

## 🛠️ Tech Stack
* **Language:** TypeScript (Strict mode)
* **Framework:** Express.js (v5.0)
* **Runtime:** Node.js with `tsx` for seamless TypeScript execution.
* **AI Provider:** DeepSeek API (`deepseek-chat` model).

## 💻 Try it out

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Configuration
Create a `.env` file in the root directory and add your credentials:
```env
DEEPSEEK_API_KEY=your_api_key_here
PORT=3000
DEEPSEEK_MODEL=deepseek-chat
```

### 3. Running the App
Start the development server:
```bash
npm run dev
```

### 4. Testing
Test a critical technical issue using CMD or Terminal:
```bash
curl -X POST http://localhost:3000/webhook/ticket \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"user_001\", \"message\": \"My bot crashed completely, all my users are affected right now\", \"channel\": \"slack\"}"
```

## 📄 License
This project is licensed under the MIT License.