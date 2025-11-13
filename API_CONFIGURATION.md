# API Configuration and Status

## System Architecture

```
Frontend (React)         Backend (Node.js/Express)
Port: 3000      <---->  Port: 5001
localhost:3000          localhost:5001
```

---

## Backend API Endpoints

All backend endpoints respond with JSON and support CORS from `localhost:3000`.

### Data Routes (`/api/data`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/data/session/start` | 開始セッションを作成 | `{difficulty, timestamp, preFatigue}` | `{sessionId}` |
| POST | `/api/data/sensor` | センサーデータを記録 | `{sessionId, data}` | `{success: true}` |
| POST | `/api/data/quiz-response` | クイズ回答を記録 | `{sessionId, quizId, selectedAnswer, isCorrect, timestamp}` | `{success: true}` |
| POST | `/api/data/session/end` | セッション終了、ファイル保存 | `{sessionId, timestamp}` | `{success: true, message}` |
| GET | `/api/data/session/:sessionId` | セッションデータ取得 | なし | Session object |

**File Storage**: Sessions are saved to `backend/data/sessions/{sessionId}.json`

---

### Quiz Routes (`/api/quiz`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/quiz/difficulty/:difficulty` | 難易度別クイズを取得 | なし | `{difficulty, quizzes[], count}` |
| POST | `/api/quiz/verify` | クイズ回答を検証 | `{difficulty, quizId, selectedAnswer}` | `{quizId, isCorrect, correctAnswer}` |

**Available Difficulties**: `easy` (5 questions), `medium` (7 questions), `hard` (20 questions)

---

### Results Routes (`/api/results`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/results/calculate` | メトリクス計算 | `{sessionData}` | `{accuracy, metrics, totalDuration}` |
| GET | `/api/results/metrics/:sessionId` | セッション計測指標取得 | なし | `{message}` (TODO) |

---

### Health Check

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/health` | サーバーヘルスチェック | `{status: "ok"}` |

---

## Frontend Configuration

### Environment Variables

**Development** (`frontend/.env`):
```
REACT_APP_API_BASE_URL=http://localhost:5001
```

**Production** (`frontend/.env.production`):
```
REACT_APP_API_BASE_URL=https://fatigue-detection-web-spp.onrender.com
```

### Frontend API Usage

App.jsx:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

// Session start
fetch(`${API_BASE_URL}/api/data/session/start`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({difficulty, timestamp, preFatigue})
})

// Session end
fetch(`${API_BASE_URL}/api/data/session/end`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({sessionId, timestamp})
})
```

GameScene.jsx:
```javascript
// Fetch quizzes
fetch(`${API_BASE_URL}/api/quiz/difficulty/${difficulty}`)
```

QuizBooth.jsx:
```javascript
// Verify answer
fetch(`${API_BASE_URL}/api/quiz/verify`, {
  method: 'POST',
  body: JSON.stringify({difficulty, quizId, selectedAnswer})
})
```

EndScreen.jsx:
```javascript
// Calculate results
fetch(`${API_BASE_URL}/api/results/calculate`, {
  method: 'POST',
  body: JSON.stringify({sessionData})
})
```

---

## Local Development Testing

### Start Both Servers

Terminal 1 - Backend:
```bash
cd /Users/kubotasumire/Univ./卒論/s-2/fatigue-detection-web-spp/backend
npm start
# Server running on http://localhost:5001
```

Terminal 2 - Frontend:
```bash
cd /Users/kubotasumire/Univ./卒論/s-2/fatigue-detection-web-spp/frontend
npm start
# Server running on http://localhost:3000
```

### Test Endpoints with curl

```bash
# Health check
curl http://localhost:5001/api/health

# Get quizzes
curl http://localhost:5001/api/quiz/difficulty/easy

# Start session
curl -X POST http://localhost:5001/api/data/session/start \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"easy","timestamp":1699000000000}'

# Verify answer
curl -X POST http://localhost:5001/api/quiz/verify \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"easy","quizId":1,"selectedAnswer":1}'
```

---

## Port Configuration

### Development Ports
- **Frontend**: Port 3000 (React dev server)
- **Backend**: Port 5001 (Node.js Express server)

### Current Running Status
```
Port 3000: LISTENING - React Frontend
Port 5001: LISTENING - Node.js Backend
```

**Important**: Verify both ports are in use:
```bash
lsof -i -P -n | grep LISTEN | grep -E "(3000|5001)"
```

---

## CORS Configuration

Backend has CORS enabled for all routes. Backend server.js:
```javascript
const cors = require('cors');
app.use(cors());
```

This allows requests from the frontend on `localhost:3000` to communicate with backend on `localhost:5001`.

---

## Data Persistence

### Session Data Storage

Sessions are saved as JSON files in `backend/data/sessions/` directory:

```
backend/
  └── data/
      └── sessions/
          ├── session_1699000000000_abc123.json
          ├── session_1699000001000_def456.json
          └── ...
```

Each session file contains:
```json
{
  "id": "session_1699000000000_abc123",
  "difficulty": "easy",
  "startTime": 1699000000000,
  "endTime": 1699000060000,
  "sensorData": [],
  "quizResponses": [
    {
      "quizId": 1,
      "selectedAnswer": 1,
      "isCorrect": true,
      "timestamp": 1699000010000
    }
  ],
  "preFatigue": 3,
  "postFatigue": 4
}
```

**Date Format**: All timestamps are automatically converted to JST (Japan Standard Time) format in files using `formatSessionDataToJST()` utility.

---

## Deployment (Render)

### Backend Deployment
- **Service Type**: Web Service
- **URL**: https://fatigue-detection-web-spp.onrender.com
- **Port**: 5001 (from environment variable `PORT`)
- **Configuration**: `backend/render.yaml`

### Frontend Deployment
- **Service Type**: Static Site
- **Build Command**: `npm run build`
- **Build Output**: `frontend/build`
- **Environment Variable**: `REACT_APP_API_BASE_URL=https://fatigue-detection-web-spp.onrender.com`

See `RENDER_DEPLOYMENT.md` for detailed deployment steps.

---

## Troubleshooting

### 404 Errors from Frontend

**Cause**: Frontend API_BASE_URL not correctly pointing to backend.

**Check**:
1. Verify backend is running on port 5001:
   ```bash
   curl http://localhost:5001/api/health
   ```

2. Verify frontend .env contains correct URL:
   ```bash
   cat frontend/.env
   # Should show: REACT_APP_API_BASE_URL=http://localhost:5001
   ```

3. Check browser Console (DevTools) for actual request URL being made

4. If env changed, restart frontend server:
   ```bash
   pkill -f "react-scripts start"
   npm start
   ```

### Port Already in Use

**Backend**:
```bash
lsof -ti:5001 | xargs kill -9
```

**Frontend**:
```bash
lsof -ti:3000 | xargs kill -9
```

### Session Data Not Saving

**Check**:
1. `backend/data/sessions/` directory exists:
   ```bash
   mkdir -p backend/data/sessions
   ```

2. Backend can write to directory:
   ```bash
   touch backend/data/sessions/test.json && rm backend/data/sessions/test.json
   ```

3. Session end endpoint returns success:
   ```bash
   curl -X POST http://localhost:5001/api/data/session/end \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"test_123","timestamp":'$(date +%s)'000}'
   ```

---

## API Verification Checklist

- [x] Backend health endpoint responds: `/api/health`
- [x] Quiz fetch works: `/api/quiz/difficulty/{difficulty}`
- [x] Quiz verify works: `/api/quiz/verify` (POST)
- [x] Session start works: `/api/data/session/start` (POST)
- [x] Session end works: `/api/data/session/end` (POST)
- [x] Results calculation works: `/api/results/calculate` (POST)
- [x] CORS enabled for frontend cross-origin requests
- [x] Frontend .env correctly configured
- [x] Both ports (3000, 5001) in use and listening
- [x] Session data directory exists: `backend/data/sessions/`

---

Last Updated: November 13, 2025
