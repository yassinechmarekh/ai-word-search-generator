# AI Word Search Puzzle Generator

A complete web application that generates word search puzzles using AI-powered word generation through OpenRouter API. Users can create themed puzzles and download them as professional PDFs.

## Features

- 🤖 **AI-Powered Word Generation** using OpenRouter API (Claude 3 Haiku)
- 🧩 **Professional Puzzle Layout** that looks like real word search puzzles
- 📄 **PDF Export** with puzzles and answer keys
- 🎨 **Responsive Design** works on all devices
- 🔄 **Multiple Puzzle Generation** create up to 10 puzzles at once
- 🎯 **Theme-Based Words** contextually relevant words for any topic

## Setup Instructions

### 1. Get OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Go to your API Keys section
4. Create a new API key
5. Copy the API key

### 2. Environment Variables

Create a `.env.local` file in your project root:

\`\`\`env
OPENROUTER_API_KEY=your_openrouter_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### 3. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 4. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to use the application.

## How to Use

1. **Enter a Theme**: Type any topic (e.g., "Animals", "Space", "Food")
2. **Set Parameters**: Choose number of puzzles and words per puzzle
3. **Generate**: Click "Generate Puzzles with AI" 
4. **View Puzzles**: Interactive puzzles appear with collapsible answer keys
5. **Download PDF**: Get a professional PDF with all puzzles and answers

## Supported AI Models

The app uses OpenRouter API which supports multiple models:
- `anthropic/claude-3-haiku` (default - fast and cost-effective)
- `openai/gpt-4o-mini` (alternative option)
- Many other models available through OpenRouter

**Important Note on Word Generation:**
This application relies solely on the AI model to generate words. While the prompt asks for an exact number of words, AI models may sometimes return fewer words than requested, especially for very large quantities or niche themes. In such cases, the application will generate as many complete puzzles as possible with the words provided by the AI, and will inform you if fewer puzzles are generated than initially requested.

## Theme Suggestions

Try these popular themes:
- **Animals**: cat, dog, elephant, tiger, etc.
- **Sports**: soccer, basketball, tennis, etc.
- **Food**: pizza, burger, pasta, etc.
- **Science**: atom, molecule, gravity, etc.
- **Space**: star, planet, galaxy, etc.
- **Ocean**: whale, dolphin, coral, etc.
- **Nature**: tree, flower, mountain, etc.
- **Transportation**: car, plane, train, etc.

## Technical Details

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **AI Integration**: OpenRouter API for word generation
- **PDF Generation**: jsPDF for creating downloadable puzzles
- **Word Search Algorithm**: Custom implementation with 8-directional word placement

## API Costs

OpenRouter pricing varies by model:
- Claude 3 Haiku: ~$0.25 per 1M input tokens
- GPT-4o Mini: ~$0.15 per 1M input tokens

Each puzzle generation uses approximately 100-200 tokens, making it very cost-effective.

## Deployment

Deploy easily on Vercel:

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add your `OPENROUTER_API_KEY` in Vercel environment variables
4. Deploy!

## License

MIT License - feel free to use and modify for your projects.
