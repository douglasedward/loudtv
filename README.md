# LoudTV - Live Streaming Platform

A scalable, full-stack live streaming platform built with modern microservices architecture, featuring real-time video transcoding, adaptive bitrate streaming, and comprehensive user management.

## 🎯 Features

### 🎥 Video Streaming & Processing

- **Real-time RTMP Stream Ingestion** - Accept live streams from OBS, FFmpeg, and other broadcasting software
- **Multi-Resolution Transcoding** - Automatic FFmpeg-based transcoding to 5 quality variants (240p to 1080p)
- **Adaptive Bitrate Streaming** - HLS delivery with automatic quality switching based on network conditions
- **Stream Quality Validation** - Real-time analysis of bitrate, resolution, and codec compliance
- **Live Stream Analytics** - Comprehensive metrics tracking and performance monitoring

### 🏗️ Architecture

- **Microservices Architecture** - Event-driven design with 3 core services
- **Apache Kafka Integration** - Reliable inter-service communication and event streaming
- **Containerized Deployment** - Docker and Docker Compose for development and production
- **Health Monitoring** - Comprehensive health checks and Prometheus metrics
- **Horizontal Scalability** - Redis clustering and load balancer ready

### 👥 User Experience

- **Real-time Chat System** - Socket.io powered live chat during streams
- **Advanced Video Player** - Custom HLS.js player with quality controls
- **Stream Discovery** - Channel browsing, search, and categorization
- **User Management** - Authentication, profiles, and follower system
- **Analytics Dashboard** - Stream performance and audience insights

## 🛠️ Tech Stack

### Backend Services

- **NestJS** - Scalable Node.js framework with TypeScript
- **FFmpeg** - Video processing and transcoding engine
- **Apache Kafka** - Event streaming and microservices communication
- **Redis** - Caching, session management, and rate limiting
- **PostgreSQL** - Primary database with TypeORM
- **Node Media Server** - RTMP server for stream ingestion

### Frontend

- **Next.js 15** - React-based full-stack framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **HLS.js** - HTTP Live Streaming player
- **Socket.io** - Real-time bidirectional communication
- **Zustand** - Lightweight state management

### Infrastructure

- **Docker & Docker Compose** - Containerization and orchestration
- **Prometheus** - Metrics collection and monitoring
- **Swagger/OpenAPI** - API documentation
- **JWT** - Secure authentication and authorization

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22+ and **pnpm**
- **Docker** and **Docker Compose**
- **FFmpeg** (for local development)

### 1. Clone the Repository

```bash
git clone https://github.com/douglasedward/loudtv.git
cd loudtv
```

### 2. Environment Setup

```bash
# Install dependencies for all services
pnpm install
```

### 3. Start Docker Services

```bash
# Terminal 1 - Message Streaming
docker-compose -f infrastructure/message-streaming/docker-compose.yml up -d

# Terminal 2 - User Service
docker-compose -f services/user-service/docker-compose.yml up -d

# Terminal 3 - Channel Service
docker-compose -f services/channel-service/docker-compose.yml up -d

# Terminal 4 - Stream Service
docker-compose -f services/stream-service/docker-compose.yml up -d
```

### 4. Start Application Services

```bash
# Terminal 1 - User Service
cd services/user-service
pnpm run dev

# Terminal 2 - Channel Service
cd services/channel-service
pnpm run dev

# Terminal 3 - Stream Service
cd services/stream-service
pnpm run dev

# Terminal 4 - Frontend
cd frontend
pnpm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **User Service API**: http://localhost:3001/api/v1/docs
- **Channel Service API**: http://localhost:3002/api/v1/docs
- **Stream Service API**: http://localhost:3003/api/docs
- **Kafka UI**: http://localhost:8080

## 📡 Streaming Setup

### RTMP Stream Configuration

- **RTMP URL**: `rtmp://localhost:1935/live`
- **Stream Key**: Your unique stream key from the dashboard

### OBS Studio Configuration

1. Go to Settings → Stream
2. Service: Custom
3. Server: `rtmp://localhost:1935/live`
4. Stream Key: `your-stream-key`

### FFmpeg Command Example

```bash
ffmpeg -f lavfi -i testsrc2=size=1280x720:rate=30 -f lavfi -i sine=frequency=1000 \
  -c:v libx264 -preset veryfast -b:v 2500k -c:a aac -b:a 128k \
  -f flv rtmp://localhost:1935/live/your-stream-key
```

## 📊 Monitoring & Observability

### Health Endpoints

- User Service: `GET /health`
- Channel Service: `GET /health`
- Stream Service: `GET /health`

### Metrics

- Prometheus metrics: `GET /metrics` on each service
- Custom stream metrics: viewer count, bitrate, dropped frames
- System metrics: CPU, memory, disk usage

### Logging

- Structured JSON logs with correlation IDs
- Log levels: error, warn, info, debug
- Request/response logging with sanitization

## 📄 API Documentation

Each service provides comprehensive OpenAPI/Swagger documentation:

- **User Service**: Authentication, user management, followers
- **Channel Service**: Channel creation, categories, search
- **Stream Service**: Stream ingestion, transcoding, analytics

Access interactive API docs at `/api/docs` endpoint for each service.

## 🔒 Security

- JWT-based authentication with refresh tokens
- Rate limiting and request throttling
- Input validation and sanitization
- CORS configuration for cross-origin requests
- Helmet.js security headers
- Environment-based configuration

## 📈 Performance

- **Horizontal Scaling**: Stateless services with load balancer support
- **Caching Strategy**: Redis for sessions, metadata, and rate limiting
- **Database Optimization**: Indexed queries and connection pooling
- **CDN Ready**: HLS segments optimized for CDN distribution
- **Monitoring**: Real-time metrics and alerting

## 👨‍💻 Author

**Douglas Eduardo**

- GitHub: [@douglasedward](https://github.com/douglasedward)
- Email: devdouglaseduardo@gmail.com
- Portfolio: [douglaseduardo.onrender.com](https://douglaseduardo.onrender.com)

---

⭐ If you found this project helpful, please give it a star!
