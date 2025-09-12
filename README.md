# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# 🪄 PeelForge Web - AI Background Remover

A powerful, privacy-focused background removal tool that runs entirely in your browser. No servers, no uploads, no compromises.

![PeelForge Demo](https://img.shields.io/badge/Demo-Live-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)

## ✨ Features

- 🖼️ **Universal Image Support** - PNG, JPG, JPEG, WebP formats
- 🪄 **AI-Powered Removal** - Uses RMBG-1.4 model via Transformers.js
- 👀 **Real-time Preview** - Side-by-side comparison of original vs. cutout
- 📥 **Instant Download** - Get transparent PNG results immediately
- ⚡ **WebGPU Acceleration** - Automatic GPU acceleration when available
- 🔒 **100% Private** - Images never leave your browser
- 📱 **Fully Responsive** - Works perfectly on desktop and mobile
- 🎨 **Drag & Drop Interface** - Intuitive file upload experience

## 🚀 Quick Start

### Development

```bash
# Clone the repository
git clone https://github.com/yourusername/peelforge-web.git
cd peelforge-web

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the app.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite 7+
- **AI Model**: RMBG-1.4 via Transformers.js
- **Acceleration**: WebGPU (with WebAssembly fallback)
- **Styling**: Modern CSS with responsive design

## 🎯 How It Works

1. **Model Loading**: Downloads RMBG-1.4 model on first visit (cached afterwards)
2. **Image Processing**: Runs AI inference entirely in the browser
3. **Background Removal**: Generates precise alpha mask for transparency
4. **Result Generation**: Creates downloadable PNG with transparent background

## 🌟 Key Benefits

- **Privacy First**: No data ever leaves your device
- **Lightning Fast**: WebGPU acceleration for optimal performance
- **Zero Setup**: No API keys, accounts, or configuration needed
- **Offline Ready**: Works without internet after initial model download
- **Professional Quality**: State-of-the-art RMBG-1.4 model results

## 📱 Supported Browsers

- ✅ Chrome 94+ (WebGPU supported)
- ✅ Edge 94+ (WebGPU supported)
- ✅ Firefox 91+ (WebAssembly fallback)
- ✅ Safari 15+ (WebAssembly fallback)

## 🔧 Configuration

The app automatically detects and uses the best available acceleration:

- **WebGPU**: For maximum performance on supported browsers
- **WebAssembly**: Reliable fallback for universal compatibility

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- [Transformers.js](https://huggingface.co/docs/transformers.js) - For making AI models accessible in browsers
- [RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4) - The powerful background removal model
- [Vite](https://vitejs.dev/) - For the amazing build tooling
- [React](https://reactjs.org/) - For the component framework

---

<div align="center">
  <strong>🪄 Remove backgrounds like magic, right in your browser!</strong>
</div>

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
