export const SESSION_TYPES = {
  ATTENDANCE: "attendance",
  VOTING: "voting",
  QUIZ: "quiz",
};

export const SESSION_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  ENDED: "ended",
  CANCELLED: "cancelled",
};

export const SUBMISSION_STATUS = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  LATE: "late",
  INVALID: "invalid",
};

export class Session {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.type = data.type;
    this.title = data.title;
    this.description = data.description || "";
    this.teacherId = data.teacherId;
    this.teacherName = data.teacherName;
    this.location = {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      radius: data.location.radius || 20,
    };
    this.status = data.status || SESSION_STATUS.PENDING;
    this.timeLimit = data.timeLimit || 300;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.startedAt = data.startedAt || null;
    this.endedAt = data.endedAt || null;
    this.settings = data.settings || {};
  }
}

export class AttendanceSession extends Session {
  constructor(data) {
    super(data);
    this.type = SESSION_TYPES.ATTENDANCE;
    this.allowLateMarking = data.allowLateMarking || false;
    this.attendanceList = data.attendanceList || [];
  }
}

export class VotingSession extends Session {
  constructor(data) {
    super(data);
    this.type = SESSION_TYPES.VOTING;
    this.question = data.question;
    this.options = data.options || [];
    this.allowMultipleChoice = data.allowMultipleChoice || false;
    this.showResults = data.showResults || false;
    this.votes = data.votes || [];
  }
}

export class QuizSession extends Session {
  constructor(data) {
    super(data);
    this.type = SESSION_TYPES.QUIZ;
    this.questions = data.questions || [];
    this.totalMarks = data.totalMarks || 0;
    this.passingMarks = data.passingMarks || 0;
    this.allowReview = data.allowReview || false;
    this.monitorAppFocus = data.monitorAppFocus || true;
    this.submissions = data.submissions || [];
  }
}

export class Question {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.question = data.question;
    this.type = data.type;
    this.options = data.options || [];
    this.correctAnswer = data.correctAnswer;
    this.marks = data.marks || 1;
    this.timeLimit = data.timeLimit || 0;
  }
}

export class AttendanceSubmission {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.sessionId = data.sessionId;
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.submittedAt = data.submittedAt || new Date().toISOString();
    this.location = data.location;
    this.status = data.status || SUBMISSION_STATUS.PENDING;
    this.isValid = data.isValid || false;
    this.notes = data.notes || "";
  }
}

export class VoteSubmission {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.sessionId = data.sessionId;
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.selectedOptions = data.selectedOptions || [];
    this.submittedAt = data.submittedAt || new Date().toISOString();
    this.location = data.location;
    this.status = data.status || SUBMISSION_STATUS.PENDING;
    this.isValid = data.isValid || false;
  }
}

export class QuizSubmission {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.sessionId = data.sessionId;
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.answers = data.answers || [];
    this.submittedAt = data.submittedAt || new Date().toISOString();
    this.location = data.location;
    this.status = data.status || SUBMISSION_STATUS.PENDING;
    this.isValid = data.isValid || false;
    this.score = data.score || 0;
    this.totalMarks = data.totalMarks || 0;
    this.percentage = data.percentage || 0;
    this.appFocusEvents = data.appFocusEvents || [];
    this.timeSpent = data.timeSpent || 0;
  }
}

export class AppFocusEvent {
  constructor(data) {
    this.timestamp = data.timestamp || new Date().toISOString();
    this.eventType = data.eventType;
    this.questionId = data.questionId || null;
    this.duration = data.duration || 0;
  }
}

export class Answer {
  constructor(data) {
    this.questionId = data.questionId;
    this.answer = data.answer;
    this.isCorrect = data.isCorrect || false;
    this.marksAwarded = data.marksAwarded || 0;
    this.timeSpent = data.timeSpent || 0;
    this.submittedAt = data.submittedAt || new Date().toISOString();
  }
}

export class SessionReport {
  constructor(data) {
    this.sessionId = data.sessionId;
    this.sessionType = data.sessionType;
    this.title = data.title;
    this.teacherName = data.teacherName;
    this.createdAt = data.createdAt;
    this.startedAt = data.startedAt;
    this.endedAt = data.endedAt;
    this.totalParticipants = data.totalParticipants || 0;
    this.validSubmissions = data.validSubmissions || 0;
    this.invalidSubmissions = data.invalidSubmissions || 0;
    this.attendanceData = data.attendanceData || [];
    this.votingData = data.votingData || [];
    this.quizData = data.quizData || [];
    this.summary = data.summary || {};
  }
}

export class OfflineSubmission {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.type = data.type;
    this.data = data.data;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.synced = data.synced || false;
    this.retryCount = data.retryCount || 0;
  }
}
