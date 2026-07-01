# Chat-App
OBJ Chat — Real-time messaging app built with the MERN stack + Socket.io + Cloudinary
Features
Authentication — JWT-based login/register + Google OAuth (GIS)
Real-time messaging — Socket.io for instant send/receive with online status
File sharing — Image & video uploads via Cloudinary (drag-and-drop, preview, inline playback)
Profile management — Avatar upload, profile page, account deletion with confirmation
Security — httpOnly cookies, input validation, auth middleware on all protected routes
Responsive — Mobile-first sidebar, adaptive chat area
Tech Stack
Layer	Tools
Frontend	React 19, Vite, Zustand, react-router-dom v7, Axios, Socket.io-client, react-hot-toast, lucide-react, @react-oauth/google
Backend	Express.js, Mongoose, Socket.io, JWT, bcrypt, google-auth-library, Cloudinary SDK
Database	MongoDB
Storage	Cloudinary (images/videos)
API Endpoints
Method	Path	Auth	Description
POST	/api/auth/register	No	Register with email/password
POST	/api/auth/login	No	Local login
POST	/api/auth/google	No	Google OAuth login
POST	/api/auth/logout	No	Clear session
GET	/api/auth/check	Yes	Verify token & return user
PUT	/api/auth/update-profile	Yes	Upload profile image
DELETE	/api/auth/delete-account	Yes	Remove user + all messages
GET	/api/message/user	Yes	List all users
GET	/api/message/:id	Yes	Get conversation with user
POST	/api/message/send/:id	Yes	Send text/image/video
PUT	/api/message/:id	Yes	Mark message as seen
DELETE	/api/message/:id	Yes	Delete a message
Getting Started
# Backend
cd backend
npm install
# Set up .env with MONGO_URL, JWT_SECRET_KEY, Cloudinary creds, GOOGLE_CLIENT_ID
npm start

# Frontend
cd frontend
npm install
# Set VITE_GOOGLE_CLIENT_ID in .env
npm run dev
