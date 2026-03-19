# NeuroMind - Neurological Diagnostic Portal

A web-based medical portal for doctors to manage patient records and perform neurological diagnostics using machine learning models. The system integrates with Raspberry Pi for real-time EEG/MRI data analysis.

## Features

- **Doctor Authentication** - Secure registration and login with JWT-based authentication
- **Patient Management** - Create, view, edit, and manage patient records
- **ML Classification** - Upload EEG/MRI files for seizure type classification using ML models
- **Autoencoder Analysis** - Detect anomalies in brain signals
- **AI Chatbot** - Interactive assistant for navigation and ML model explanations
- **Raspberry Pi Integration** - Connect to Raspberry Pi for on-device data processing

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Font Awesome icons
- Inter font family
- Responsive design with modern UI

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt.js for password hashing

### Hardware Integration
- Raspberry Pi for ML model inference
- Supports EEG (.edf, .csv) and MRI (.nii, .jpg) file formats

## Project Structure

```
FYP Website/
├── backend/
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware
│   ├── models/
│   │   ├── Doctor.js       # Doctor schema
│   │   └── Patient.js      # Patient schema
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── doctors.js      # Doctor management routes
│   │   └── patients.js     # Patient CRUD routes
│   ├── server.js           # Express server entry point
│   └── package.json
├── css/
│   ├── dashboard.css
│   ├── login.css
│   ├── register.css
│   ├── patient-records.css
│   ├── classification.css
│   ├── chatbot.css
│   └── ...
├── html/
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── patient-records.html
│   ├── add-patient.html
│   ├── edit-patient.html
│   ├── classification.html
│   ├── results-classification.html
│   ├── results-autoencoder.html
│   └── chatbot.html
└── js/
    ├── dashboard.js
    ├── recommendation.js
    └── pi-connect.js
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v6.0 or higher) - local installation or MongoDB Atlas account
- Git
- Raspberry Pi 4 (optional, for on-device ML inference)
- Web browser (Chrome, Firefox, or Edge recommended)

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd "FYP Website"
```

### Step 2: Install Backend Dependencies

Navigate to the backend folder and install all required packages:

```bash
cd backend
npm install
```

This will install the following dependencies:
- `express` - Web server framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `express-validator` - Input validation
- `nodemon` - Development auto-reload (dev dependency)

### Step 3: MongoDB Setup

#### Option A: Local MongoDB Installation

1. Download and install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)

2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB

   # macOS/Linux
   sudo systemctl start mongod
   ```

3. Verify MongoDB is running:
   ```bash
   mongosh
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Click "Connect" and select "Connect your application"
4. Copy the connection string


### Step 4: Environment Configuration

**No manual .env setup required!**

The `.env` file is already included in the repository. When you clone the repo, you will get a pre-configured `.env` file in the `backend` directory with the following defaults:

```
MONGODB_URI=mongodb://localhost:27017/neuromind
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=5000
# JWT_EXPIRE=24h
```

- The default MongoDB connection string works for local development. If you want to use MongoDB Atlas, update the `MONGODB_URI` value in `.env`.
- The `JWT_SECRET` is a placeholder. For production, change it to a strong, random value.
- No other changes are needed for local development.

**Summary for new users:**

- MongoDB connection: Already configured for local use. Just ensure MongoDB is running on your machine.
- JWT secret: Provided for testing. Change for production.
- No other configuration needed after cloning. Everything works out of the box!

### Step 5: Run the Application

#### Development Mode (with auto-reload)

```bash
cd backend
npm run dev
```

#### Production Mode

```bash
cd backend
npm start
```

### Step 6: Access the Application

Open your web browser and navigate to:

```
http://localhost:5000
```

You should see the NeuroMind login page.

## Raspberry Pi Setup (Optional)

For on-device ML inference with Raspberry Pi:

### Hardware Requirements
- Raspberry Pi 4 (4GB RAM recommended)
- MicroSD card (32GB or higher)
- Power supply
- Network connection (WiFi or Ethernet)

### Software Setup

1. Install Raspberry Pi OS (64-bit recommended)

2. Update the system:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. Install Python and dependencies:
   ```bash
   sudo apt install python3 python3-pip -y
   pip3 install tensorflow numpy pandas
   ```

4. Create the upload directory:
   ```bash
   mkdir -p /home/neuromind/Neuromind/Codes/uploads
   ```

5. Configure the Pi's IP address in the web application settings

### Connecting to Raspberry Pi

1. Ensure both devices are on the same network
2. Navigate to the Pi Connect page in the application
3. Enter the Raspberry Pi's IP address
4. Test the connection

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Check MongoDB logs
# Windows: Check Event Viewer
# Linux: sudo journalctl -u mongod
```

### Port Already in Use

```bash
# Find and kill process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :5000
kill -9 <PID>
```

### Node Module Issues

```bash
# Clear node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new doctor
- `POST /api/auth/login` - Login and receive JWT token

### Patients
- `GET /api/patients` - Get all patients (requires auth)
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID

## Usage

1. **Register** as a new doctor or login with existing credentials
2. Navigate to **Dashboard** to access ML tools
3. **Add patients** via Patient Records section
4. Use **Classification Tool** to upload EEG/MRI data
5. View **Analysis Results** for seizure classification or anomaly detection
6. Use **AI Chatbot** for assistance

## License

This project was developed as a Final Year Project (FYP).

## Authors

NeuroMind Development Team
