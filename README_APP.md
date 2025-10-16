# 📱 Article Registry Mobile App

A professional mobile application for managing textile and fabric article registries. Built with Expo/React Native for cross-platform support (iOS, Android, Web).

## ✨ Features

### Core Functionality
- **CSV Import**: Upload article data from CSV files stored on your device
- **Article Search**: Fast search across article codes, names, colors, treatments, and more
- **Article Details**: View comprehensive information for each article
- **PDF Export**: Generate professional PDF reports of article details
- **Share Functionality**: Share article information via email, messaging, or other apps
- **Dual Storage**: Local offline storage + cloud backend sync for data persistence

### Mobile-Optimized
- Native mobile UI with smooth animations
- Pull-to-refresh functionality
- Touch-optimized interactions
- Responsive design for all screen sizes
- Works offline with local storage

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB
- Expo Go app (for mobile testing)

### Installation

1. **Install Frontend Dependencies**
```bash
cd frontend
yarn install
```

2. **Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

3. **Start the Backend Server**
```bash
cd backend
python server.py
# Runs on http://0.0.0.0:8001
```

4. **Start the Expo Development Server**
```bash
cd frontend
expo start
```

5. **Access the App**
- **Web**: Open http://localhost:3000
- **Mobile**: Scan QR code with Expo Go app

## 📊 CSV File Format

Your CSV file should have the following columns:

```csv
Article Code,Article Name,Color Code,Color Name,Treatment Name,Supplier,Section,Season,Composition,Weight GSM,Width CM,Base Price EUR
ART001,Cotton Fabric,COL001,Navy Blue,Dyed,Supplier A,Men,Spring 2024,100% Cotton,200,150,12.50
```

### Required Fields
- `Article Code` - Unique identifier for the article

### Optional Fields
- Article Name, Color Code, Color Name, Treatment Name
- Supplier, Supplier Code, Section, Season
- Composition, Weave, Stretch, Construction
- Weight GSM, Width CM, Dye Type
- Care Label, Barcode/QR, Base Price EUR

## 🔧 API Endpoints

### Health Check
```bash
GET /api/health
```

### Articles
```bash
# Get all articles
GET /api/articles

# Get articles with search
GET /api/articles?search=cotton

# Get single article
GET /api/articles/{id}

# Create article
POST /api/articles

# Update article
PUT /api/articles/{id}

# Delete article
DELETE /api/articles/{id}

# Bulk import
POST /api/articles/bulk
```

## 📱 App Structure

```
frontend/
├── app/
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Home screen (article list)
│   └── article/
│       └── [id].tsx        # Article details screen
├── assets/                 # Images and fonts
└── package.json

backend/
├── server.py               # FastAPI application
└── requirements.txt        # Python dependencies
```

## 🎨 Features in Detail

### 1. CSV Import
- Upload CSV files from device storage
- Choose between "Append" or "Replace" mode
- Automatic field mapping
- Validation and error handling

### 2. Search & Filter
- Real-time search as you type
- Searches across multiple fields:
  - Article Code & Name
  - Color Code & Name
  - Treatment Name
  - Section & Season

### 3. Article Details
- Organized sections:
  - Basic Information
  - Color & Treatment
  - Fabric Specifications
  - Additional Information
- Clean, mobile-friendly layout
- Easy navigation

### 4. PDF Export
- Professional PDF generation
- Includes all article details
- Formatted for readability
- Share via native share sheet

### 5. Cloud Sync
- Sync local data to backend
- Offline-first approach
- Data persists between sessions
- Future-ready for multi-device access

## 🛠️ Technical Stack

### Frontend
- **Framework**: Expo SDK 54 / React Native
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based)
- **Storage**: Expo FileSystem (local)
- **UI Components**: React Native core components
- **Icons**: Expo Vector Icons

### Backend
- **Framework**: FastAPI
- **Database**: MongoDB with Motor (async)
- **Language**: Python 3.11

## 📝 Sample Data

A sample CSV file is included at `/app/sample_articles.csv` for testing.

## 🔒 Data Privacy

- All data is stored locally on your device by default
- Cloud sync is optional and controlled by you
- No data is shared with third parties
- MongoDB database is private to your installation

## 🐛 Known Issues

- None at the moment!

## 🚧 Future Enhancements

Based on user feedback, potential features include:
- Barcode/QR code scanning
- Camera integration for article photos
- Advanced filtering and sorting
- Export to Excel format
- Multi-language support
- Dark mode

## 📄 License

This project is provided as-is for personal and commercial use.

## 🤝 Support

For questions or issues, please contact support or file an issue in the repository.

---

**Built with ❤️ using Expo and FastAPI**
