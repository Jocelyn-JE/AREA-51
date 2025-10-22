# AREA-51 🚀

A powerful automation platform inspired by IFTTT (If This Then That), enabling users to create custom workflows by connecting various services through actions and reactions.

## 📖 Project Purpose

AREA-51 is an automation platform that allows users to create "Areas" - custom workflows that connect different services and automate tasks. Similar to IFTTT, users can set up triggers (actions) from one service that automatically execute responses (reactions) in another service.

**Key Features:**

- 🔗 Connect multiple services (Google, GitHub, weather APIs, etc.)
- ⚡ Create custom automation workflows
- 🌐 Multi-platform support (Web, Mobile, API)
- 🔐 Secure OAuth authentication
- 📊 Real-time monitoring and execution

## 🏗️ Architecture Overview

The project follows a microservices architecture with multiple client applications:

```text
AREA-51/
├── server/                # Node.js/TypeScript backend API
│   ├── src/
│   │   ├── app.ts         # Main application entry point
│   │   ├── routes/        # API route definitions
│   │   ├── services/      # Service integrations (Google, etc.)
│   │   └── utils/         # Utility functions
│   └── Dockerfile
├── web_client/            # React/TypeScript web application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   └── pages/         # Application pages
│   └── Dockerfile
├── mobile_client/         # Flutter mobile application
│   ├── lib/
│   │   ├── screens/       # Mobile screens
│   │   ├── services/      # Service integrations
│   │   └── widgets/       # UI widgets
│   ├── android/           # Android platform-specific code
│   │   └── ...
│   └── ios/               # iOS platform-specific code
│       └── ...
├── docs/                  # Documentation
│   ├── services.md        # Service implementation guide
│   └── swagger.yaml       # API documentation
└── docker-compose.yml     # Multi-container setup
```

## 🚀 Quick Start with Docker Compose

### Prerequisites

- *Docker* and *Docker Compose* installed
- *Git* for cloning the repository

### Setup Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Jocelyn-JE/AREA-51.git
   cd AREA-51
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. **Start all services:**

   ```bash
   docker compose up -d --build
   ```

4. **Access the applications:**
   - **Web Client:** <http://localhost:8081>
   - **API Server:** <http://localhost:8080>
   - **MongoDB Express:** <http://localhost:8082> (database management)

5. **Stop services:**

   ```bash
   docker compose down
   ```

## 📚 API Documentation (Swagger)

The project includes comprehensive API documentation using Swagger / OpenAPI.

### Accessing Swagger Documentation

1. **Start the server** (using Docker Compose as described above)

2. **Access Swagger UI:**
   - URL: `http://localhost:${BACKEND_PORT}/api-docs` (default: <http://localhost:3000/api-docs>)
   - Interactive documentation with live API testing capabilities

3. **API Endpoints Include:**
   - 🔐 User Authentication (register, login, OAuth)
   - 📊 System Information (`/about.json`)
   - 🔧 AREA Management (create, update, delete automations)
   - 🧪 Testing & Development endpoints

### Using the API

- All endpoints are documented with request/response schemas
- Use the "Try it out" feature to test endpoints directly
- Authentication required for most endpoints (Bearer token)

## 🛠️ Development Setup

### Development Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **Flutter SDK** (for mobile development)
- **MongoDB** (local or remote instance)
- **Git**

### Backend Development (Server)

1. **Clone and navigate:**

   ```bash
   git clone https://github.com/Jocelyn-JE/AREA-51.git
   cd AREA-51/server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   # Configure your MongoDB connection and OAuth credentials
   ```

4. **Start development server:**

   ```bash
   npm run start
   ```

### Frontend Development (Web Client)

1. **Navigate to web client:**

   ```bash
   cd web_client
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

### Mobile Development (Flutter)

1. **Navigate to mobile client:**

   ```bash
   cd mobile_client
   ```

2. **Install Flutter dependencies:**

   ```bash
   flutter pub get
   ```

3. **Run on device/emulator:**

   ```bash
   flutter run
   ```

### Environment Variables

Copy the example environment file and configure:

```bash
cp .env.example .env
# Edit .env with your MongoDB URI, OAuth credentials, and ports
```

## 📋 Available Scripts

### Server

- `npm run start` - Start the development server
- `npm run build` - Build for production

### Web Client

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Mobile Client

- `flutter run` - Run on connected device
- `flutter build apk` - Build Android APK
- `flutter build ios` - Build iOS app

## 📖 Service Implementation

For detailed information about implementing new services, actions, and reactions in the AREA platform, see [Service Implementation Guide](./docs/services.md). This comprehensive guide covers the service architecture, step-by-step implementation instructions, parameter systems, and best practices for extending the platform with new integrations.

## 👥 Contributors

- **Jocelyn JEAN-ELIE** - Project Lead / Backend Developer
- **Tom FELDKAMP** - Mobile Developer
- **Kyllian CHANDELIER** - Web Developer

## 📄 License

This project is licensed under the ISC License.

## 🔗 Links

- [GitHub Repository](https://github.com/Jocelyn-JE/AREA-51)
- [Issue Tracker](https://github.com/Jocelyn-JE/AREA-51/issues)
- [Service Documentation](./docs/services.md)

---

Built with pain and caffeine at Epitech
