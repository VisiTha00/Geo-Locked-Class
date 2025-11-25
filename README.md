# 🎓 Geo-Locked Class - Location-Based Learning Platform

A comprehensive React Native mobile application built with Expo that enables location-based classroom sessions. Teachers can create and manage different types of sessions (Attendance, Voting, Quiz) with geo-fencing, while students can participate based on their proximity to the teacher's location.

## 🎯 Features

### Teacher Features

- **Session Management**

  - Create three types of sessions: Attendance, Voting, and Quiz
  - Set custom time limits and geo-fence radius
  - Start, edit, and end sessions
  - Real-time session monitoring with timer

- **Quiz Creation**

  - Create multiple-choice questions
  - Set marks per question
  - Configure correct answers
  - Enable app focus monitoring for integrity

- **Voting Sessions**

  - Create polls with multiple options
  - Allow single or multiple choice
  - Real-time vote tracking

- **Reporting & Analytics**

  - Generate comprehensive session reports
  - Export reports in CSV and PDF formats
  - View attendance records, voting results, and quiz scores
  - Analyze student performance and participation

- **User Management**
  - Create and manage user accounts
  - Assign roles (teacher/student)
  - View all registered users

### Student Features

- **Location-Based Participation**

  - Automatic range detection (configurable radius, default 20m)
  - Real-time distance calculation
  - Join sessions only when within required range

- **Session Types**

  - **Attendance**: Mark attendance with location verification
  - **Voting**: Participate in polls and surveys
  - **Quiz**: Take quizzes with automatic scoring and integrity monitoring

- **Quiz Integrity**

  - App focus monitoring to detect app switching
  - Warning system for suspicious behavior
  - Auto-submit on excessive warnings
  - Integrity reports for teachers

- **Notifications**
  - Push notifications when sessions start
  - Range alerts and session updates

### Technical Features

- **Offline Support**: Submissions saved locally when offline, synced when connection restored
- **Real-time Synchronization**: Firebase Realtime Database for live updates
- **Location Services**: High-accuracy GPS with Haversine distance calculation
- **Role-Based Access**: Separate interfaces for teachers and students
- **Session Timer**: Automatic time limit enforcement
- **Data Persistence**: AsyncStorage for offline data and user sessions

## 📋 Prerequisites

- **Node.js**: v16 or higher
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **EAS CLI** (for building): `npm install -g eas-cli`
- **Firebase Account**: For backend services
- **Android Studio** (for Android development) or **Xcode** (for iOS development)

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Geo-Locked-Class
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Firebase**

   Create a `.env` file in the root directory (optional for local development):

   ```env
   EXPO_PUBLIC_API_KEY=your-api-key
   EXPO_PUBLIC_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_DATABASE_URL=https://your-project.firebaseio.com
   EXPO_PUBLIC_PROJECT_ID=your-project-id
   EXPO_PUBLIC_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_MESSAGING_SENDER_ID=your-sender-id
   EXPO_PUBLIC_APP_ID=your-app-id
   EXPO_PUBLIC_MEASUREMENT_ID=your-measurement-id
   EXPO_PUBLIC_ADMIN_EMAIL=your-admin-e-mail
   EXPO_PUBLIC_ADMN_PASSWORD=password-of-the admin
   ```

   **For Production Builds**: Set these as EAS Secrets:

   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_API_KEY --value "your-value" --type string
   # Repeat for all Firebase environment variables
   ```

4. **Start the development server**

   ```bash
   npx expo start
   ```
   or
     ```bash
   $env:CI = $null; npx expo start
   ```

6. **Run on device**
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## 🏗️ Building for Production

### Android APK

```bash
# Build APK
eas build -p android --profile production

# Or build preview version
eas build -p android --profile preview
```

### Download Builds

After build completes, download from:

- EAS Dashboard: https://expo.dev/accounts/[your-account]/projects/geo-locked-class/builds
- Or use the link provided in terminal

### Pre-built APK

Download the latest APK directly:

- **APK Download**: [Download APK](https://expo.dev/artifacts/eas/t1MCz3adJvGW6Ytjhp42ML.apk)

### Test Accounts

For testing purposes, you can use the following pre-configured accounts:

**Teacher Account:**

- Email: `testteacher@gmail.com`
- Password: `testteacher`

**Student Account:**

- Email: `teststudent@gmail.com`
- Password: `teststudent`

## 📱 Usage

### For Teachers

1. **Login**: Enter email and password (must be created via User Management)
2. **Create Session**:
   - Tap "Create Session" on dashboard
   - Select session type (Attendance/Voting/Quiz)
   - Configure settings (time limit, radius, questions/options)
   - Session starts automatically and students are notified
3. **Monitor Session**: View active session details, timer, and location
4. **Generate Reports**: Access reports from active session or dashboard
5. **Manage Users**: Create and manage user accounts (admin only)

### For Students

1. **Login**: Enter your email and password
2. **Wait for Notification**: You'll be notified when a session starts
3. **Check Range**: App automatically checks if you're within required radius
4. **Join Session**: Tap "Join Session" when in range
5. **Participate**:
   - **Attendance**: Submit attendance (location verified)
   - **Voting**: Select options and submit vote
   - **Quiz**: Answer questions, submit quiz (integrity monitored)

## 📁 Project Structure

```
Geo-Locked-Class/
├── App.js                          # Main app entry point
├── app.json                        # Expo configuration
├── eas.json                        # EAS Build configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel configuration
├── assets/
│   ├── icon.png                    # App icon (1024x1024)
│   └── splash.png                  # Splash screen image
├── src/
│   ├── config/
│   │   └── firebase.js             # Firebase configuration
│   ├── context/
│   │   ├── authContext.js         # Authentication context
│   │   └── sessionContext.js       # Session management context
│   ├── helper/
│   │   └── helperFunctions.js     # Utility functions
│   ├── screen/
│   │   ├── splashScreen.js        # App splash screen
│   │   ├── loginScreen.js         # Login screen
│   │   ├── teacherDashboard.js    # Teacher main screen
│   │   ├── studentDashboard.js    # Student main screen
│   │   ├── sessionCreationScreen.js # Create new sessions
│   │   ├── sessionEditScreen.js   # Edit active sessions
│   │   ├── sessionScreen.js       # Session details view
│   │   ├── attendanceScreen.js    # Attendance submission
│   │   ├── votingScreen.js        # Voting interface
│   │   ├── quizScreen.js          # Quiz interface
│   │   ├── reportingScreen.js     # Report generation
│   │   └── userManagementScreen.js # User management (admin)
│   ├── service/
│   │   ├── firebaseService.js     # Firebase Realtime Database operations
│   │   ├── userService.js         # Firestore user management
│   │   ├── offlineStorageService.js # Offline data storage
│   │   ├── appFocusService.js     # Quiz integrity monitoring
│   │   └── reportingService.js    # Report generation (CSV/JSON/PDF)
│   └── types/
│       └── sessionTypes.js        # Type definitions and classes
└── README.md
```

## 🛠️ Key Technologies

- **React Native**: 0.81.4 - Cross-platform mobile framework
- **Expo SDK**: 54.0.12 - Development platform
- **React**: 19.1.0 - UI library
- **Firebase**: 12.3.0
  - Realtime Database - Session and submission data
  - Firestore - User management
- **React Navigation**: 6.x - Screen navigation
- **Expo Modules**:
  - `expo-location` - GPS and location services
  - `expo-notifications` - Push notifications
  - `expo-splash-screen` - Splash screen management
  - `expo-file-system` - File operations
  - `expo-print` - PDF generation
  - `expo-sharing` - File sharing
- **AsyncStorage**: Local data persistence
- **React Context API**: State management

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable **Realtime Database** and **Firestore**
3. Get your Firebase configuration from Project Settings
4. Set environment variables (see Installation section)

### Session Radius

Default radius is 20 meters. Can be customized when creating sessions.

### Location Accuracy

The app uses `Location.Accuracy.High` for maximum GPS precision. Configured in:

- `src/context/sessionContext.js`

### Quiz Integrity Settings

Configured in `src/service/appFocusService.js`:

- `suspiciousThreshold`: Number of app switches before flagging (default: 2)
- `maxWarnings`: Maximum warnings before auto-submit (default: 3)
- `maxSwitchTime`: Maximum time away from app (default: 3000ms)

## 📊 Session Types

### 1. Attendance Session

- Students mark attendance within geo-fence
- Location and time validated
- Late marking support (optional)

### 2. Voting Session

- Single or multiple choice polls
- Real-time vote counting
- Results can be shown to students (optional)

### 3. Quiz Session

- Multiple-choice questions
- Automatic scoring
- App focus monitoring for integrity
- Time limit enforcement
- Detailed performance reports

## 🔐 Authentication

- **User Management**: Admin can create users via User Management screen
- **Authentication**: Email/password stored in Firestore
- **Roles**: Teacher or Student
- **Fallback Login**: `admin@setup.com` / `setup123` for initial setup

## 📈 Reporting

### Report Formats

1. **CSV**: Spreadsheet-compatible format with all session data
2. **JSON**: Structured data format for programmatic access
3. **PDF**: Formatted reports with tables and summaries

### Report Contents

- Session details (type, duration, location)
- Participant list with university IDs
- Submission data (attendance/votes/quiz answers)
- Performance metrics (scores, pass rates)
- Integrity reports (for quizzes)
- Validation status (location and time)

## 🌐 Offline Support

- Submissions saved locally when offline
- Automatic sync when connection restored
- Session data cached for offline access
- Storage statistics available

## 🔔 Notifications

- **Session Start**: Students notified when sessions begin
- **Quiz Warnings**: Integrity warnings for app switching
- **Permission Handling**: Automatic permission requests

## 🐛 Troubleshooting

### Build Errors

**Image/Icon Errors**:

- Ensure `assets/icon.png` is 1024x1024 pixels and valid PNG
- Check that all image files are not corrupted

**Firebase Errors**:

- Verify all environment variables are set in EAS Secrets
- Check Firebase project configuration
- Ensure Realtime Database and Firestore are enabled

**Android Build Errors**:

- Clear build cache: `eas build -p android --clear-cache`
- Check `eas.json` configuration

### Runtime Issues

**App Crashes on Startup**:

- Check Firebase environment variables are set
- Verify Firebase project is active
- Check device logs: `adb logcat | findstr ReactNativeJS`

**Location Not Working**:

- Ensure location permissions are granted
- Check device location services are enabled
- Try moving to area with better GPS signal

**Notifications Not Appearing**:

- Check notification permissions
- Verify device is not in Do Not Disturb mode
- Check notification settings in device

**Offline Sync Issues**:

- Check internet connection
- Verify Firebase credentials
- Check AsyncStorage permissions

## 🧪 Development

### Running Locally

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### Testing

- Use Expo Go for quick testing
- Build development client for full feature testing
- Use EAS Build for production testing

## 📝 Environment Variables

Required for production builds (set via EAS Secrets):

- `EXPO_PUBLIC_API_KEY`
- `EXPO_PUBLIC_AUTH_DOMAIN`
- `EXPO_PUBLIC_DATABASE_URL`
- `EXPO_PUBLIC_PROJECT_ID`
- `EXPO_PUBLIC_STORAGE_BUCKET`
- `EXPO_PUBLIC_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_APP_ID`
- `EXPO_PUBLIC_MEASUREMENT_ID` (optional)

## 🔒 Security Notes

- Passwords are currently stored in plaintext (consider implementing hashing)
- Firebase security rules should be configured
- Location data is stored with submissions
- App focus events are logged for quiz integrity

## 📄 License

This project is for educational purposes. Feel free to use and modify as needed.

## 🤝 Support

For issues or questions:

1. Check the troubleshooting section
2. Review Firebase console for backend issues
3. Check EAS Build logs for build problems
4. Create an issue in the repository

## 🎓 Features in Detail

### Quiz Integrity Monitoring

The app monitors student behavior during quizzes:

- Tracks app focus events (when app goes to background)
- Warns students after app switching
- Auto-submits quiz after maximum warnings exceeded
- Generates integrity reports for teachers
- Configurable thresholds and settings

### Offline Capabilities

- All submissions saved locally when offline
- Automatic sync when connection restored
- Session data cached for offline viewing
- Storage management and statistics

### Real-time Updates

- Firebase Realtime Database for live session updates
- Automatic session state synchronization
- Real-time location tracking
- Live submission tracking

## 📱 Platform Support

- **Android**: Fully supported (primary platform)
- **iOS**: Supported (requires Apple Developer account for builds)
- **Web**: Limited support (Expo web)

## 🔄 Version Information

- **App Version**: 1.0.0
- **Expo SDK**: 54.0.12
- **React Native**: 0.81.4
- **Node**: Requires v16+

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
