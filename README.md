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
- MongoDB (local or Atlas)
- Raspberry Pi (optional, for ML inference)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "FYP Website"
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/neuromind
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Start MongoDB**

   Ensure MongoDB is running on your system or use MongoDB Atlas.

5. **Run the server**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

6. **Access the application**

   Open your browser and navigate to:
   ```
   http://localhost:5000
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

## Raspberry Pi Setup

1. Connect Raspberry Pi to the same network
2. Configure Pi IP address in the application
3. Upload files are stored at: `/home/neuromind/Neuromind/Codes/uploads`

## License

This project was developed as a Final Year Project (FYP).

## Authors

NeuroMind Development Team
