# Geo-Locked Class - React Native App

A location-based learning platform built with Expo React Native for Android. This app allows teachers to start class sessions and students to join them based on their proximity to the teacher's location.

## Features

### Teacher Features

- **Start Sessions**: Teachers can start class sessions with their current GPS location
- **Location Management**: Set a 20-meter radius for students to join
- **Session Control**: End sessions and monitor session duration
- **Real-time Location**: View current GPS coordinates and accuracy

### Student Features

- **Location-based Joining**: Students can only join sessions when within 20m of teacher
- **Push Notifications**: Receive notifications when sessions start
- **Range Detection**: Automatic checking if student is within required range
- **Session Participation**: Join active sessions when in range

### Technical Features

- **GPS Integration**: High-accuracy location services
- **Push Notifications**: Expo notifications for session alerts
- **Role-based Authentication**: Separate interfaces for teachers and students
- **Real-time Location Tracking**: Continuous location monitoring
- **Distance Calculation**: Haversine formula for accurate distance measurement

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Android device or emulator

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd geo-locked-class
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npx expo start
   ```

4. **Run on Android**
   - Press 'a' in the terminal to open on Android emulator
   - Or scan the QR code with Expo Go app on your Android device

## Usage

### For Teachers

1. **Login**: Select "Teacher" role and enter any email/password
2. **Grant Permissions**: Allow location access when prompted
3. **Start Session**: Tap "Start Session" to begin a class session
4. **Monitor**: View session details, duration, and location
5. **End Session**: Tap "End Session" when class is over

### For Students

1. **Login**: Select "Student" role and enter any email/password
2. **Grant Permissions**: Allow location access when prompted
3. **Wait for Notification**: You'll be notified when a session starts
4. **Check Range**: The app will show if you're within the 20m range
5. **Join Session**: Tap "Join Session" when you're in range

## Project Structure

```
geo-locked-class/
├── App.js
├── src/
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── SessionContext.js
│   └── screens/
│       ├── LoginScreen.js
│       ├── TeacherDashboard.js
│       ├── StudentDashboard.js
│       ├── SessionScreen.js
│       └── NotificationScreen.js
├── package.json
├── app.json
└── README.md
```

## Key Technologies

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **React Navigation**: Navigation between screens
- **Expo Location**: GPS and location services
- **Expo Notifications**: Push notifications
- **AsyncStorage**: Local data persistence
- **Context API**: State management

## Location Services

The app uses high-accuracy GPS positioning with the following features:

- **Permission Handling**: Automatic request for location permissions
- **Real-time Updates**: Continuous location monitoring
- **Distance Calculation**: Haversine formula for accurate distance measurement
- **Range Validation**: 20-meter radius validation for session participation

## Notifications

- **Session Start**: Students receive notifications when sessions begin
- **Range Alerts**: Automatic checking if students are within range
- **Permission Handling**: Proper notification permission requests

## Configuration

### Location Accuracy

The app uses `Location.Accuracy.High` for maximum GPS accuracy. You can modify this in:

- `src/screen/TeacherDashboard.js` (line ~45)
- `src/screens/StudentDashboard.js` (line ~45)

### Session Radius

The default session radius is 20 meters. You can change this in:

- `src/context/SessionContext.js` (line ~15)
- `src/screen/TeacherDashboard.js` (line ~60)

## Troubleshooting

### Location Issues

- Ensure location services are enabled on the device
- Check if the app has location permissions
- Try moving to an area with better GPS signal
- Restart the app if location doesn't update

### Notification Issues

- Ensure notification permissions are granted
- Check if the device is in Do Not Disturb mode
- Restart the app if notifications don't appear

### Build Issues

- Clear Expo cache: `expo r -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Expo CLI version: `expo --version`

## Development Notes

- This is a demo app - authentication is simplified
- Location accuracy may vary based on device and environment
- The app is optimized for Android devices
- Real-time features work best with stable internet connection

## License

This project is for educational purposes. Feel free to use and modify as needed.

## Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.
