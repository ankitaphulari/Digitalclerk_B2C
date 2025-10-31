# DigitalClerk - AI-Powered Form Filling Platform

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/digitalclerk/deploys)

## 🚀 About DigitalClerk

DigitalClerk is an AI-powered platform that automates form filling for Indian businesses, CA firms, and professionals. Upload any document, and our AI instantly extracts data to auto-fill any form in 15 seconds instead of 30 minutes.

**Key Features:**
- ⚡ Fill forms 120x faster
- 🔒 Secure & encrypted data storage
- 🎯 99.9% accuracy rate
- 📄 Support for all Indian government forms (GST, Income Tax, PAN, etc.)
- 🌐 Chrome extension for seamless integration
- 🤖 Advanced OCR and AI extraction

## 🛠️ Tech Stack

This project is built with:

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **UI Components:** shadcn-ui
- **Styling:** Tailwind CSS
- **Backend:** Node.js/Express (in `/backend` folder)
- **Routing:** React Router
- **State Management:** React Query (TanStack Query)
- **Form Handling:** React Hook Form
- **Charts:** Recharts

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- Git

Install Node.js using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (recommended):
```sh
nvm install 18
nvm use 18
```

## 🚀 Getting Started

### Frontend Setup

1. **Clone the repository**
```sh
git clone https://github.com/ankitaphulari/Digitalclerk_B2C.git
cd Digitalclerk_B2C
```

2. **Install dependencies**
```sh
npm install
```

3. **Set up environment variables**
```sh
cp .env.example .env
```
Edit `.env` and add your API keys and configuration.

4. **Start the development server**
```sh
npm run dev
```

The app will be available at `http://localhost:5173`

### Backend Setup

1. **Navigate to backend directory**
```sh
cd backend
```

2. **Install backend dependencies**
```sh
npm install
```

3. **Set up backend environment variables**
```sh
cp .env.example .env
```

4. **Start the backend server**
```sh
npm run dev
```

The API will be available at `http://localhost:3000`

## 📦 Build for Production

### Frontend
```sh
npm run build
```

The build output will be in the `dist/` directory.

### Backend
```sh
cd backend
npm run build
```

## 🚢 Deployment

### Frontend Deployment (Netlify)

**Option 1: Automatic Deployment**
- Push to `main` branch
- Netlify automatically builds and deploys
- Live at: https://digitalclerk.netlify.app

**Option 2: Manual Deployment**
```sh
npm run build
npx netlify deploy --prod
```

### Backend Deployment (Render)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Deploy!

## 🗂️ Project Structure

```
Digitalclerk_B2C/
├── backend/              # Backend API server
│   ├── src/             # Backend source code
│   └── package.json     # Backend dependencies
├── src/                 # Frontend source code
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API services
│   ├── lib/            # Utility functions
│   └── api/            # API integrations
├── public/             # Static assets
├── chrome-extension/   # Chrome extension code
└── package.json        # Frontend dependencies
```

## 🔑 Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_VISION_API_KEY=your_key_here
```

### Backend (backend/.env)
```
PORT=3000
NODE_ENV=development
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

## 🧪 Testing

```sh
# Run frontend tests
npm test

# Run backend tests
cd backend && npm test
```

## 📝 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start backend in development mode
- `npm run build` - Build TypeScript
- `npm start` - Start production server

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📧 Contact

**DigitalClerk Team**
- Website: https://digitalclerk.netlify.app
- Email: support@digitalclerk.app
- Phone: +91 ***** *****

## 🙏 Acknowledgments

- Built with React and modern web technologies
- Icons from Lucide React
- UI components from shadcn/ui

---

Made with ❤️ in India 🇮🇳
