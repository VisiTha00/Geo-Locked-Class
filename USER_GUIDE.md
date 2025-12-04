# 📚 Geo-Locked Class - User Guide

Welcome to the Geo-Locked Class application! This comprehensive guide will help teachers and students navigate and use all features of the location-based learning platform.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Teacher Guide](#teacher-guide)
3. [Student Guide](#student-guide)
4. [Session Types](#session-types)
5. [Troubleshooting](#troubleshooting)
6. [Frequently Asked Questions](#frequently-asked-questions)

---

## 🚀 Getting Started

### First-Time Login

1. **Open the App**: Launch the Geo-Locked Class application on your device
2. **Enter Credentials**: 
   - Use the email and password provided by your administrator
   - If you're an admin, you can create accounts via User Management
3. **Grant Permissions**: 
   - **Location Permission**: Required for all features. Select "Allow" when prompted
   - **Notification Permission**: Recommended to receive session alerts
4. **Dashboard Access**: After login, you'll be directed to your role-specific dashboard

### Important Notes

- **Location Services**: Must be enabled on your device for the app to function
- **Internet Connection**: Required for session creation and participation
- **Offline Mode**: Submissions are saved locally when offline and synced automatically when connection is restored

---

## 👨‍🏫 Teacher Guide

### Dashboard Overview

The Teacher Dashboard is your central hub for managing classroom sessions. Here's what you'll see:

- **Session Status**: Shows if a session is currently active
- **Time Remaining**: Countdown timer for active sessions
- **Location Status**: Your current GPS coordinates and accuracy
- **Action Buttons**: Create, edit, end sessions, and generate reports

### Creating a Session

#### Step-by-Step Process

1. **Navigate to Create Session**
   - Tap the **"Create Session"** button on your dashboard
   - Ensure your location is available (refresh if needed)

2. **Select Session Type**
   - **Attendance**: For taking student attendance
   - **Voting**: For polls and surveys
   - **Quiz**: For assessments and tests

3. **Configure Basic Details**
   - **Session Title**: Enter a descriptive name (e.g., "Math Class - Chapter 5")
   - **Description**: Optional details about the session
   - **Time Limit**: Set duration in minutes (default: 5 minutes)
   - **Radius**: Set geo-fence radius in meters (default: 20m)

4. **Session-Specific Setup**

   **For Attendance Sessions:**
   - No additional configuration needed
   - Students simply mark their attendance when in range

   **For Voting Sessions:**
   - Enter the voting question
   - Add at least 2 options (tap "+ Add Option" for more)
   - Toggle "Allow Multiple Choice" if students can select multiple options
   - Optionally enable "Show Results" to display results to students

   **For Quiz Sessions:**
   - Add questions one at a time:
     - Enter the question text
     - Add 2-4 answer options
     - Select the correct answer
     - Set marks for the question
   - Tap **"Add Question"** after each question
   - Add as many questions as needed

5. **Start Session**
   - Tap **"Create Session"** at the bottom
   - The session starts automatically
   - All students receive a notification
   - You'll see a confirmation message

### Managing Active Sessions

#### Viewing Session Details

- **Session Status Card**: Shows active/inactive status and time remaining
- **Location Card**: Displays your current coordinates and accuracy
- **Timer**: Real-time countdown showing remaining time

#### Editing a Session

1. Tap **"Edit Session"** button
2. Modify:
   - **Time Limit**: Adjust remaining time (1-120 minutes)
   - **Radius**: Change geo-fence radius (5-1000 meters)
3. Tap **"Update Session"** to save changes

**Note**: You can only edit active sessions. Changes take effect immediately.

#### Ending a Session

1. Tap **"End Session"** button
2. Confirm the action
3. Session stops immediately
4. Students can no longer submit responses
5. You can generate reports after ending

### Generating Reports

#### Accessing Reports

1. **From Active Session**: Tap **"Generate Report"** on dashboard
2. **From Session Screen**: Navigate to session details and tap report button

#### Report Features

- **Multiple Formats**: 
  - CSV (for Excel/spreadsheets)
  - JSON (for data analysis)
  - PDF (for printing/sharing)

- **Report Contents**:
  - Session details (type, duration, location)
  - Participant list with university IDs
  - Submission data (attendance/votes/quiz answers)
  - Performance metrics (scores, pass rates)
  - Integrity reports (for quizzes)
  - Validation status (location and time verification)

#### Exporting Reports

1. Select desired format (CSV/JSON/PDF)
2. Tap **"Generate Report"**
3. Report is created and ready to share
4. Use device sharing options to save or send

### User Management (Admin Only)

If you're the system administrator (configured email), you'll see a **"Manage Users"** button.

#### Creating New Users

1. Tap **"Manage Users"**
2. Fill in the form:
   - **Name**: Full name of the user
   - **Email**: Valid email address
   - **Password**: Secure password
   - **University ID**: Student/teacher identifier
   - **Role**: Select Teacher, Student, or Admin
3. Tap **"Add User"**
4. User account is created immediately

#### Managing Existing Users

- View all registered users in a scrollable list
- See user details: name, email, university ID, role
- **Delete Users**: Tap "Delete" button (with confirmation)

### Best Practices for Teachers

✅ **Before Starting a Session:**
- Ensure you're in the correct location
- Verify your GPS accuracy is good (< 10m)
- Set appropriate time limits based on session type
- For quizzes, prepare questions in advance

✅ **During a Session:**
- Monitor the timer and session status
- Keep the app open to maintain location tracking
- Check student participation through reports

✅ **After a Session:**
- Generate reports immediately while data is fresh
- Review integrity reports for quiz sessions
- Export reports for record-keeping

---

## 👨‍🎓 Student Guide

### Dashboard Overview

The Student Dashboard shows:
- **Session Status**: Whether an active session is available
- **Location Status**: Your current range status (In Range/Out of Range)
- **Distance Information**: How far you are from the session location
- **Join Button**: Access to active sessions

### Joining a Session

#### Prerequisites

- ✅ Active session must be running
- ✅ You must be within the required radius
- ✅ Session time limit must not be exceeded
- ✅ You must not have already submitted

#### Step-by-Step Process

1. **Wait for Notification**
   - You'll receive a push notification when a session starts
   - Notification shows: "A class session has started. Check if you're in range to join."

2. **Check Your Location**
   - Open the app
   - View your location status on the dashboard
   - Tap **"Check Location"** to refresh your position
   - Ensure you're within the required radius

3. **Join the Session**
   - When "In Range" is displayed, tap **"Join [Session Type] Session"**
   - The appropriate screen opens based on session type

### Attendance Sessions

#### Marking Attendance

1. **Join Session**: Tap "Join Attendance Session" when in range
2. **View Details**:
   - Session title and description
   - Time remaining
   - Your location coordinates
   - Distance to session location
3. **Submit Attendance**:
   - Tap **"Mark Attendance"** button
   - Your attendance is recorded with:
     - Location verification
     - Timestamp
     - Validation status
4. **Confirmation**: You'll see a success message
5. **Status**: Button changes to "Already Submitted"

**Important**: 
- You can only submit once per session
- Location is verified automatically
- Submission must be within time limit

### Voting Sessions

#### Participating in Polls

1. **Join Session**: Tap "Join Voting Session" when in range
2. **View Question**: Read the voting question carefully
3. **Select Options**:
   - **Single Choice**: Tap one option (radio buttons)
   - **Multiple Choice**: Tap multiple options (checkboxes) if enabled
4. **Submit Vote**:
   - Tap **"Submit Vote"** button
   - Your vote is recorded
5. **View Results** (if enabled):
   - See real-time vote counts
   - View percentage distribution

**Note**: 
- You can change your selection before submitting
- Once submitted, you cannot modify your vote
- Results may be visible to all participants (teacher's choice)

### Quiz Sessions

#### Taking a Quiz

1. **Join Session**: Tap "Join Quiz Session" when in range
2. **Quiz Overview**:
   - Total number of questions
   - Time remaining
   - Your location status
3. **Answering Questions**:
   - Navigate through questions using "Next" and "Previous"
   - Select your answer by tapping an option
   - Selected answer is highlighted
   - You can change answers before submitting
4. **Question Navigation**:
   - See current question number (e.g., "Question 2 of 5")
   - View marks allocated per question
5. **Submit Quiz**:
   - Review all answers before submitting
   - Tap **"Submit Quiz"** button
   - Quiz is automatically scored
   - You'll see your score and percentage

#### Quiz Integrity Monitoring

⚠️ **Important**: The app monitors your behavior during quizzes:

- **App Switching Detection**: If you switch to another app, it's detected
- **Warnings**: You'll receive warnings for suspicious activity
- **Auto-Submit**: Quiz may auto-submit after maximum warnings (default: 3)
- **Integrity Reports**: Your behavior is logged for teacher review

**Best Practices**:
- ✅ Stay focused on the quiz
- ✅ Don't switch to other apps
- ✅ Keep the app in foreground
- ✅ Answer questions within time limit

#### Quiz Results

After submission, you'll see:
- **Score**: Points earned
- **Total Marks**: Maximum possible points
- **Percentage**: Your score percentage
- **Status**: Valid/Invalid based on location and time

### Location Management

#### Understanding Range Status

- **In Range** (Green): You're within the required radius ✅
- **Out of Range** (Red): You need to move closer ❌

#### Improving Location Accuracy

1. **Move to Open Area**: Better GPS signal outdoors
2. **Check Device Settings**: Ensure location services are enabled
3. **Refresh Location**: Tap "Check Location" button
4. **Wait for Update**: Location updates every few seconds

#### Location Information Displayed

- **Your Location**: Current GPS coordinates
- **Distance to Session**: How far you are from teacher
- **Required Range**: Maximum distance allowed
- **Accuracy**: GPS accuracy in meters

### Notifications

#### Types of Notifications

1. **Session Started**: Alert when teacher starts a session
2. **Location Updates**: Range status changes
3. **Quiz Warnings**: Integrity warnings during quizzes
4. **Session Ended**: Notification when session closes

#### Managing Notifications

- Ensure notification permissions are granted
- Check device "Do Not Disturb" settings
- Notifications appear even when app is closed

### Offline Mode

#### How It Works

- If you lose internet connection:
  - Your submissions are saved locally
  - App continues to function
  - Data syncs automatically when connection returns

#### Offline Indicators

- Check your internet connection status
- Submissions show "Pending Sync" status
- Sync happens automatically in background

---

## 📊 Session Types

### 1. Attendance Session

**Purpose**: Track student presence in class

**Teacher Actions**:
- Create session with title and radius
- Start session (auto-starts on creation)
- Monitor participation
- End session when complete
- Generate attendance report

**Student Actions**:
- Receive notification when session starts
- Check if within range
- Mark attendance when in range
- View confirmation

**Features**:
- Location verification
- Timestamp recording
- One submission per student
- Time limit enforcement

### 2. Voting Session

**Purpose**: Conduct polls and surveys

**Teacher Actions**:
- Create session with question
- Add multiple options (minimum 2)
- Enable/disable multiple choice
- Optionally show results to students
- View real-time vote counts
- Generate voting report

**Student Actions**:
- Join session when in range
- View question and options
- Select one or multiple options
- Submit vote
- View results (if enabled)

**Features**:
- Single or multiple choice
- Real-time vote tracking
- Anonymous voting
- Results visualization

### 3. Quiz Session

**Purpose**: Conduct assessments and tests

**Teacher Actions**:
- Create multiple-choice questions
- Set marks per question
- Configure correct answers
- Monitor student progress
- View integrity reports
- Generate detailed quiz reports

**Student Actions**:
- Join session when in range
- Answer questions sequentially
- Navigate between questions
- Submit quiz
- View score and percentage

**Features**:
- Automatic scoring
- Integrity monitoring
- Time limit enforcement
- Performance analytics
- Detailed reports

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Location Not Working

**Problem**: App shows "Location not available" or "Out of Range" when you're nearby

**Solutions**:
1. **Check Permissions**: 
   - Go to device Settings → Apps → Geo-Locked Class → Permissions
   - Ensure "Location" permission is granted

2. **Enable Location Services**:
   - Open device Settings → Location
   - Turn on location services
   - Set to "High Accuracy" mode

3. **Move to Better Area**:
   - Go outdoors or near a window
   - Avoid buildings with poor GPS signal
   - Wait 10-15 seconds for GPS to update

4. **Refresh Location**:
   - Tap "Check Location" or "Refresh Location" button
   - Wait for coordinates to update

5. **Restart App**:
   - Close the app completely
   - Reopen and check location again

#### Cannot Join Session

**Problem**: "Join Session" button is disabled or shows error

**Possible Causes**:
- ❌ Not within required radius
- ❌ Session time limit exceeded
- ❌ Already submitted
- ❌ No active session

**Solutions**:
1. Check range status on dashboard
2. Move closer to teacher's location
3. Verify session is still active
4. Check if you've already submitted
5. Contact teacher if issues persist

#### Notifications Not Appearing

**Problem**: Not receiving session start notifications

**Solutions**:
1. **Check App Permissions**:
   - Device Settings → Apps → Geo-Locked Class → Notifications
   - Enable all notification types

2. **Check Device Settings**:
   - Disable "Do Not Disturb" mode
   - Check notification sound settings
   - Ensure app is not in battery saver mode

3. **Restart App**:
   - Close and reopen the app
   - Notifications should work after restart

#### Quiz Integrity Warnings

**Problem**: Receiving warnings during quiz even when not switching apps

**Possible Causes**:
- Phone call received
- System notification appeared
- App briefly went to background
- Device screen locked

**Solutions**:
1. **Stay Focused**: Keep app in foreground
2. **Disable Interruptions**: Enable "Do Not Disturb" during quiz
3. **Keep Screen On**: Prevent screen from locking
4. **Contact Teacher**: If warnings seem incorrect

#### Offline Sync Issues

**Problem**: Submissions not syncing after connection restored

**Solutions**:
1. **Check Internet**: Ensure stable connection
2. **Wait for Sync**: Sync happens automatically (may take a few minutes)
3. **Restart App**: Close and reopen to trigger sync
4. **Contact Support**: If data doesn't sync after 24 hours

#### App Crashes or Freezes

**Problem**: App stops responding or closes unexpectedly

**Solutions**:
1. **Update App**: Install latest version
2. **Clear Cache**: Device Settings → Apps → Clear Cache
3. **Restart Device**: Power off and on
4. **Reinstall App**: Uninstall and reinstall (data will be preserved if synced)

#### Report Generation Fails

**Problem**: Cannot generate or export reports

**Solutions**:
1. **Check Storage**: Ensure device has enough storage space
2. **Check Permissions**: Grant file access permissions
3. **Try Different Format**: Switch between CSV, JSON, or PDF
4. **Restart App**: Close and reopen before generating

---

## ❓ Frequently Asked Questions

### General Questions

**Q: Do I need internet connection to use the app?**
A: Internet is required for session creation and joining. However, submissions are saved offline and sync automatically when connection is restored.

**Q: How accurate is the location tracking?**
A: GPS accuracy typically ranges from 3-10 meters depending on your environment. Outdoor locations provide better accuracy.

**Q: Can I use the app on multiple devices?**
A: Yes, you can log in from multiple devices with the same account. However, only one active session per account is supported.

**Q: What happens if I lose internet during a quiz?**
A: Your answers are saved locally. When connection is restored, your submission will sync automatically.

### Teacher Questions

**Q: Can I edit a session after it's started?**
A: Yes, you can edit time limit and radius for active sessions. However, you cannot modify quiz questions or voting options after starting.

**Q: How do I know if students are participating?**
A: Check the session status on your dashboard. Generate reports to see detailed participation data.

**Q: Can I extend a session that's about to expire?**
A: Yes, use the "Edit Session" feature to increase the time limit (up to 120 minutes).

**Q: What's the maximum radius I can set?**
A: Radius can be set from 5 to 1000 meters. Choose based on your classroom size and requirements.

**Q: How do I delete a user account?**
A: Go to User Management (admin only), find the user, and tap "Delete" button. This action cannot be undone.

### Student Questions

**Q: What happens if I'm outside the range when session starts?**
A: You'll receive a notification. Move within range and tap "Join Session" to participate. You have until the time limit expires.

**Q: Can I change my quiz answers after selecting?**
A: Yes, you can change answers before submitting. Navigate between questions and select different options.

**Q: What happens if I switch apps during a quiz?**
A: The app detects app switching. You'll receive warnings, and after maximum warnings (usually 3), the quiz may auto-submit.

**Q: Can I see my quiz score immediately?**
A: Yes, after submitting a quiz, you'll see your score, total marks, and percentage immediately.

**Q: What if I accidentally submit attendance twice?**
A: The app prevents duplicate submissions. Once submitted, the button is disabled and shows "Already Submitted".

**Q: Do I need to keep the app open during a session?**
A: For quizzes, yes - keep the app in foreground to avoid integrity warnings. For attendance and voting, you can briefly switch apps, but stay within range.

### Technical Questions

**Q: Why does my location show "NaN" for distance?**
A: This usually means location data isn't available. Refresh your location or move to an area with better GPS signal.

**Q: Can I use the app without location services?**
A: No, location services are required for all features as the app is location-based.

**Q: What Android version is required?**
A: Android 6.0 (Marshmallow) or higher is recommended for full functionality.

**Q: Does the app work on iOS?**
A: Yes, the app supports iOS devices. However, you may need an Apple Developer account for building.

---

## 📞 Support

### Getting Help

If you encounter issues not covered in this guide:

1. **Check Troubleshooting Section**: Review common issues above
2. **Contact Your Administrator**: For account or access issues
3. **Check App Updates**: Ensure you're using the latest version
4. **Review Device Settings**: Verify all permissions are granted

### Reporting Issues

When reporting problems, please include:
- Your role (Teacher/Student)
- Device type and OS version
- Steps to reproduce the issue
- Screenshots if possible
- Error messages (if any)

---

## 📝 Version Information

- **App Version**: 1.0.0
- **Last Updated**: 2024
- **Platform**: Android (Primary), iOS (Supported)

---

## 🎓 Tips for Success

### For Teachers

- ✅ Test location accuracy before starting sessions
- ✅ Set realistic time limits based on session type
- ✅ Generate reports immediately after sessions
- ✅ Keep app open during active sessions
- ✅ Use appropriate radius based on classroom size

### For Students

- ✅ Enable all app permissions
- ✅ Keep location services enabled
- ✅ Stay within range during sessions
- ✅ Don't switch apps during quizzes
- ✅ Submit responses before time expires
- ✅ Check notifications regularly

---

**Thank you for using Geo-Locked Class! We hope this guide helps you make the most of the application.**

*For technical support or feature requests, please contact your system administrator.*

