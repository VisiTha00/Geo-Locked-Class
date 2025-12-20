import { SessionReport } from "../types/sessionTypes";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { printToFileAsync } from "expo-print";
import UserService from "./userService";

class ReportingService {
  constructor() {
    this.reportsDir = `${FileSystem.documentDirectory}reports/`;
  }

  generateReportFilename(sessionData, format) {
    const session = sessionData.session || sessionData;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const cleanTitle = (session.title || "Untitled")
      .replace(/[^a-zA-Z0-9\s-_]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);

    const sessionType = session.type || "session";

    const teacherName = (session.teacherName || "Unknown")
      .replace(/[^a-zA-Z0-9\s-_]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 20);
    return `${sessionType}_${cleanTitle}_${teacherName}_${timestamp}.${format}`;
  }

  async ensureReportsDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.reportsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.reportsDir, {
          intermediates: true,
        });
      }
      return { success: true };
    } catch (error) {
      console.error("Error creating reports directory:", error);
      return { success: false, error: error.message };
    }
  }

  async generateCSVReport(sessionData) {
    try {
      await this.ensureReportsDirectory();

      const filename = this.generateReportFilename(sessionData, "csv");
      const filepath = `${this.reportsDir}${filename}`;

      let csvContent = await this.buildCSVContent(sessionData);

      const csvWithBOM = "\uFEFF" + csvContent;

      await FileSystem.writeAsStringAsync(filepath, csvWithBOM);

      return { success: true, filepath, filename };
    } catch (error) {
      console.error("Error generating CSV report:", error);
      return { success: false, error: error.message };
    }
  }

  convertVotingOptionsToText(selectedOptions, sessionOptions) {
    if (!selectedOptions || !Array.isArray(selectedOptions)) {
      return selectedOptions;
    }

    if (!sessionOptions || !Array.isArray(sessionOptions)) {
      return selectedOptions;
    }

    const firstOption = selectedOptions[0];
    if (firstOption === undefined) {
      return selectedOptions;
    }

    if (typeof firstOption === "string" && isNaN(firstOption)) {
      return selectedOptions;
    }

    return selectedOptions.map((option) => {
      const idx = typeof option === "string" ? parseInt(option, 10) : option;
      if (!isNaN(idx) && idx >= 0 && idx < sessionOptions.length) {
        return sessionOptions[idx];
      }
      return option;
    });
  }

  async buildCSVContent(sessionData) {
    const session = sessionData.session || sessionData;

    const attendance = await this.enrichSubmissionsWithUniversityIds(
      sessionData.attendance || []
    );
    const voting = await this.enrichSubmissionsWithUniversityIds(
      sessionData.voting || []
    );
    const quiz = await this.enrichSubmissionsWithUniversityIds(
      sessionData.quiz || []
    );

    let csv = "";

    csv += `Session Report: ${session.title}\n`;
    csv += `Session Type: ${session.type}\n`;
    csv += `Teacher: ${session.teacherName}\n`;
    csv += `Created: ${new Date(session.createdAt).toLocaleString()}\n`;
    csv += `Started: ${
      session.startedAt ? new Date(session.startedAt).toLocaleString() : "N/A"
    }\n`;
    csv += `Ended: ${
      session.endedAt ? new Date(session.endedAt).toLocaleString() : "N/A"
    }\n`;
    csv += `Location: ${session.location.latitude}, ${session.location.longitude} (${session.location.radius}m radius)\n\n`;

    if (session.type === "attendance" && attendance.length > 0) {
      csv += "ATTENDANCE RECORDS\n";
      csv += "Student ID,Student Name,Submitted At,Valid,Status,Notes\n";

      attendance.forEach((record) => {
        csv += `${record.universityId || record.studentId},${
          record.studentName
        },${new Date(record.submittedAt).toLocaleString()},${
          record.isValid ? "Yes" : "No"
        },${record.status},${record.notes || ""}\n`;
      });
      csv += "\n";
    }

    if (session.type === "voting" && voting.length > 0) {
      csv += "VOTING RECORDS\n";
      csv +=
        "Student ID,Student Name,Selected Options,Submitted At,Valid,Status\n";

      voting.forEach((vote) => {
        // Convert indices to option text if needed
        const optionTexts = this.convertVotingOptionsToText(
          vote.selectedOptions,
          session.options
        );
        const options = optionTexts.join("; ");
        csv += `${vote.universityId || vote.studentId},${
          vote.studentName
        },"${options}",${new Date(vote.submittedAt).toLocaleString()},${
          vote.isValid ? "Yes" : "No"
        },${vote.status}\n`;
      });
      csv += "\n";

      csv += "VOTING SUMMARY\n";
      const optionCounts = {};
      voting.forEach((vote) => {
        if (vote.isValid) {
          // Convert indices to option text if needed
          const optionTexts = this.convertVotingOptionsToText(
            vote.selectedOptions,
            session.options
          );
          optionTexts.forEach((option) => {
            optionCounts[option] = (optionCounts[option] || 0) + 1;
          });
        }
      });

      Object.entries(optionCounts).forEach(([option, count]) => {
        csv += `${option},${count}\n`;
      });
      csv += "\n";
    }

    if (session.type === "quiz" && quiz.length > 0) {
      csv += "QUIZ RECORDS\n";
      csv +=
        "Student ID,Student Name,Score,Total Marks,Percentage,Submitted At,Valid,Status,Time Spent (s),Suspicious Events\n";

      quiz.forEach((submission) => {
        const suspiciousEvents = submission.appFocusEvents
          ? submission.appFocusEvents.length
          : 0;
        csv += `${submission.universityId || submission.studentId},${
          submission.studentName
        },${submission.score},${submission.totalMarks},${
          submission.percentage
        }%,${new Date(submission.submittedAt).toLocaleString()},${
          submission.isValid ? "Yes" : "No"
        },${submission.status},${
          submission.timeSpent || 0
        },${suspiciousEvents}\n`;
      });
      csv += "\n";

      csv += "QUIZ STATISTICS\n";
      const validSubmissions = quiz.filter((s) => s.isValid);
      const totalStudents = validSubmissions.length;
      const averageScore =
        totalStudents > 0
          ? validSubmissions.reduce((sum, s) => sum + s.score, 0) /
            totalStudents
          : 0;
      const highestScore =
        totalStudents > 0
          ? Math.max(...validSubmissions.map((s) => s.score))
          : 0;
      const lowestScore =
        totalStudents > 0
          ? Math.min(...validSubmissions.map((s) => s.score))
          : 0;

      csv += `Total Students,${totalStudents}\n`;
      csv += `Average Score,${averageScore.toFixed(2)}\n`;
      csv += `Highest Score,${highestScore}\n`;
      csv += `Lowest Score,${lowestScore}\n`;
      csv += `Pass Rate,${
        totalStudents > 0
          ? (
              (validSubmissions.filter((s) => s.percentage >= 50).length /
                totalStudents) *
              100
            ).toFixed(2)
          : 0
      }%\n\n`;
    }

    csv += "SESSION SUMMARY\n";
    csv += `Total Participants,${
      attendance.length + voting.length + quiz.length
    }\n`;
    csv += `Valid Submissions,${
      [...attendance, ...voting, ...quiz].filter((s) => s.isValid).length
    }\n`;
    csv += `Invalid Submissions,${
      [...attendance, ...voting, ...quiz].filter((s) => !s.isValid).length
    }\n`;

    return csv;
  }

  async enrichSubmissionsWithUniversityIds(submissions) {
    try {
      const enrichedSubmissions = [];

      for (const submission of submissions) {
        if (submission.universityId) {
          enrichedSubmissions.push(submission);
          continue;
        }

        try {
          const user = await UserService.getUserById(submission.studentId);
          if (user && user.universityId) {
            enrichedSubmissions.push({
              ...submission,
              universityId: user.universityId,
            });
          } else {
            enrichedSubmissions.push(submission);
          }
        } catch (error) {
          enrichedSubmissions.push(submission);
        }
      }

      return enrichedSubmissions;
    } catch (error) {
      console.error("Error enriching submissions with university IDs:", error);
      return submissions;
    }
  }

  generateSummary(sessionData) {
    const { session, attendance, voting, quiz } = sessionData;

    const summary = {
      sessionType: session.type,
      totalParticipants: attendance.length + voting.length + quiz.length,
      validSubmissions: [...attendance, ...voting, ...quiz].filter(
        (s) => s.isValid
      ).length,
      invalidSubmissions: [...attendance, ...voting, ...quiz].filter(
        (s) => !s.isValid
      ).length,
      sessionDuration:
        session.endedAt && session.startedAt
          ? new Date(session.endedAt) - new Date(session.startedAt)
          : null,
    };

    if (session.type === "attendance") {
      summary.attendanceRate =
        attendance.length > 0
          ? (attendance.filter((a) => a.isValid).length / attendance.length) *
            100
          : 0;
    }

    if (session.type === "voting") {
      summary.votingRate =
        voting.length > 0
          ? (voting.filter((v) => v.isValid).length / voting.length) * 100
          : 0;
    }

    if (session.type === "quiz") {
      const validQuizSubmissions = quiz.filter((q) => q.isValid);
      summary.averageScore =
        validQuizSubmissions.length > 0
          ? validQuizSubmissions.reduce((sum, q) => sum + q.score, 0) /
            validQuizSubmissions.length
          : 0;
      summary.passRate =
        validQuizSubmissions.length > 0
          ? (validQuizSubmissions.filter((q) => q.percentage >= 50).length /
              validQuizSubmissions.length) *
            100
          : 0;
    }

    return summary;
  }

  async shareReport(filepath, filename) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: "Sharing is not available on this device",
        };
      }

      await Sharing.shareAsync(filepath, {
        mimeType: "text/csv",
        dialogTitle: `Share ${filename}`,
      });

      return { success: true };
    } catch (error) {
      console.error("Error sharing report:", error);
      return { success: false, error: error.message };
    }
  }

  async getReportList() {
    try {
      await this.ensureReportsDirectory();

      const files = await FileSystem.readDirectoryAsync(this.reportsDir);

      const reportFiles = files
        .filter((file) => file.endsWith(".csv") || file.endsWith(".pdf"))
        .map((file) => ({
          filename: file,
          filepath: `${this.reportsDir}${file}`,
          type: file.endsWith(".csv") ? "csv" : "pdf",
          size: 0,
        }));

      return { success: true, reports: reportFiles };
    } catch (error) {
      console.error("Error getting report list:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteReport(filepath) {
    try {
      await FileSystem.deleteAsync(filepath);
      return { success: true };
    } catch (error) {
      console.error("Error deleting report:", error);
      return { success: false, error: error.message };
    }
  }

  async clearAllReports() {
    try {
      await this.ensureReportsDirectory();
      const files = await FileSystem.readDirectoryAsync(this.reportsDir);

      for (const file of files) {
        await FileSystem.deleteAsync(`${this.reportsDir}${file}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error clearing all reports:", error);
      return { success: false, error: error.message };
    }
  }

  async generatePDFReport(sessionData, submissions) {
    try {
      await this.ensureReportsDirectory();

      const fileName = this.generateReportFilename(sessionData, "pdf");
      const filePath = `${this.reportsDir}${fileName}`;

      const enrichedSubmissions = await this.enrichSubmissionsWithUniversityIds(
        submissions || []
      );
      const htmlContent = this.buildPDFContent(
        sessionData,
        enrichedSubmissions
      );

      const { uri } = await printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      console.log("PDF generated at temporary location:", uri);
      console.log("Attempting to copy to:", filePath);

      await FileSystem.copyAsync({
        from: uri,
        to: filePath,
      });

      const fileInfo = await FileSystem.getInfoAsync(filePath);
      console.log("PDF file info after copy:", fileInfo);

      return { success: true, filePath, fileName };
    } catch (error) {
      console.error("Error generating PDF report:", error);
      return { success: false, error: error.message };
    }
  }

  buildPDFContent(sessionData, submissions) {
    const safeSubmissions = Array.isArray(submissions) ? submissions : [];
    const session = sessionData.session || sessionData;

    const sessionType = session.type
      ? session.type.charAt(0).toUpperCase() + session.type.slice(1)
      : "Unknown";
    const startTime = session.startedAt
      ? new Date(session.startedAt).toLocaleString()
      : "Unknown";
    const endTime = session.endedAt
      ? new Date(session.endedAt).toLocaleString()
      : "Still Active";

    let submissionsHtml = "";
    if (safeSubmissions && safeSubmissions.length > 0) {
      submissionsHtml = safeSubmissions
        .map((submission) => {
          let submissionDetails = "";
          if (session.type === "attendance") {
            submissionDetails = `<td>${
              submission.submittedAt
                ? new Date(submission.submittedAt).toLocaleString()
                : "N/A"
            }</td><td>${submission.location ? "Yes" : "No"}</td>`;
          } else if (session.type === "voting") {
            const optionTexts = this.convertVotingOptionsToText(
              submission.selectedOptions || [],
              session.options || []
            );
            submissionDetails = `<td>${
              submission.submittedAt
                ? new Date(submission.submittedAt).toLocaleString()
                : "N/A"
            }</td><td>${optionTexts.join(", ")}</td>`;
          } else if (session.type === "quiz") {
            submissionDetails = `<td>${
              submission.submittedAt
                ? new Date(submission.submittedAt).toLocaleString()
                : "N/A"
            }</td><td>${submission.score || 0}/${
              submission.totalMarks || 0
            } (${(submission.percentage || 0).toFixed(1)}%)</td>`;
          }

          return `
          <tr>
            <td>${submission.studentName || "Unknown"}</td>
            <td>${submission.universityId || submission.studentId || "N/A"}</td>
            ${submissionDetails}
          </tr>
        `;
        })
        .join("");
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Session Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .session-info { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .info-label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${sessionType} Session Report</h1>
          <h2>${session.title || "Untitled Session"}</h2>
        </div>
        
        <div class="session-info">
          <div class="info-row">
            <span class="info-label">Session Type:</span>
            <span>${sessionType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Started:</span>
            <span>${startTime}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ended:</span>
            <span>${endTime}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Duration:</span>
            <span>${
              session.timeLimit ? Math.floor(session.timeLimit / 60) : "N/A"
            } minutes</span>
          </div>
            <div class="info-row">
              <span class="info-label">Location:</span>
              <span>${session.location?.latitude?.toFixed(6) || "N/A"}, ${
      session.location?.longitude?.toFixed(6) || "N/A"
    }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Radius:</span>
              <span>${session.location?.radius || "N/A"} meters</span>
            </div>
        </div>

        <h3>Submissions (${safeSubmissions.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Student ID</th>
              ${
                session.type === "attendance"
                  ? "<th>Timestamp</th><th>Location Verified</th>"
                  : ""
              }
              ${
                session.type === "voting"
                  ? "<th>Timestamp</th><th>Selected Options</th>"
                  : ""
              }
              ${
                session.type === "quiz"
                  ? "<th>Timestamp</th><th>Score</th>"
                  : ""
              }
            </tr>
          </thead>
          <tbody>
            ${
              submissionsHtml ||
              "<tr><td colspan='4'>No submissions yet</td></tr>"
            }
          </tbody>
        </table>

        <div class="summary">
          <h3>Summary</h3>
          <p><strong>Total Submissions:</strong> ${safeSubmissions.length}</p>
          ${
            session.type === "quiz"
              ? `
            <p><strong>Average Score:</strong> ${
              safeSubmissions.length > 0
                ? (
                    safeSubmissions.reduce(
                      (sum, s) => sum + (s.percentage || 0),
                      0
                    ) / safeSubmissions.length
                  ).toFixed(1)
                : 0
            }%</p>
            <p><strong>Pass Rate:</strong> ${
              safeSubmissions.length > 0
                ? (
                    (safeSubmissions.filter((s) => (s.percentage || 0) >= 50)
                      .length /
                      safeSubmissions.length) *
                    100
                  ).toFixed(1)
                : 0
            }%</p>
          `
              : ""
          }
        </div>
      </body>
      </html>
    `;
  }
}

const reportingService = new ReportingService();

export default reportingService;
