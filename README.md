# Text Analyzer with YouTube Comments Analysis

AI-powered content screening with TensorFlow.js that detects potentially toxic content in text and YouTube comments.

## Demo

Try this web site-https://project-2-git-main-sohams-projects-cfc602d1.vercel.app/

https://dev0-soham.netlify.app/

## Features

- Text analysis: Enter any text to analyze its toxicity level using a TensorFlow.js model
- YouTube comments analysis: Enter a YouTube URL to analyze all comments for toxic content
- Real-time toxicity scoring with visual indicators
- Filter options to view only toxic comments
- Responsive and modern UI with animations

## Setup Instructions

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`

## How It Works

The application uses a trained TensorFlow.js model to analyze text for toxic content. It provides a toxicity score from 0-100%. For YouTube comments, it extracts the video ID from the URL and fetches comments for analysis.

## Technical Details

- React with TypeScript
- TensorFlow.js for ML model inference
- Framer Motion for animations
- Lucide React for icons

## Note About YouTube API

In a production environment, you would need to:
1. Create a YouTube Data API key
2. Implement proper authentication
3. Handle API request quotas and pagination

The current implementation uses mock data for demonstration purposes.

## Credits

This project uses a custom TensorFlow.js model for toxicity detection.
