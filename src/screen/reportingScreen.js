import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from "react-native";
import { useEnhancedSession } from "../context/EnhancedSessionContext";
import reportingService from "../services/ReportingService";
import enhancedFirebaseService from "../services/EnhancedFirebaseService";

function ReportingScreen({ navigation, route }) {
  const { activeSession } = useEnhancedSession();
  const { sessionId } = route.params || {};

  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  useEffect(() => {
    loadSessionData();
    loadReports();
  }, []);

  async function loadSessionData(){
    setIsLoading(true);
    try {
      const data = await enhancedFirebaseService.getSessionReportData(
        sessionId || activeSession?.id
      );
      if (data && data.session) {
        const sessionData = {
          session: data.session,
          attendance: data.attendance || [],
          voting: data.voting || [],
          quiz: data.quiz || [],
          submissions: [
            ...(data.attendance || []),
            ...(data.voting || []),
            ...(data.quiz || []),
          ],
        };
        setSessionData(sessionData);
      } else {
        setSessionData(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load session data");
    } finally {
      setIsLoading(false);
    }
  };

  async function loadReports () {
    setIsLoadingReports(true);
    try {
      const result = await reportingService.getReportList();
      if (result.success) {
        setReports(result.reports);
      }
    } catch (error) {
    } finally {
      setIsLoadingReports(false);
    }
  };

  async function generateCSVReport() {
    if (!sessionData) {
      Alert.alert("Error", "No session data available");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await reportingService.generateCSVReport(sessionData);
      if (result.success) {
        Alert.alert(
          "Report Generated",
          `CSV report saved as ${result.filename}`,
          [
            {
              text: "Share",
              onPress: () => shareReport(result.filepath, result.filename),
            },
            { text: "OK" },
          ]
        );
        loadReports(); 
      } else {
        Alert.alert("Error", result.error || "Failed to generate report");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  async function generatePDFReport () {
    if (!sessionData) {
      Alert.alert("Error", "No session data available");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await reportingService.generatePDFReport(
        sessionData,
        sessionData.submissions || []
      );
      if (result.success) {
        Alert.alert(
          "Report Generated",
          `PDF report saved as ${result.fileName}`,
          [
            {
              text: "Share",
              onPress: () => shareReport(result.filePath, result.fileName),
            },
            { text: "OK" },
          ]
        );
        loadReports();
      } else {
        Alert.alert("Error", result.error || "Failed to generate PDF report");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while generating the PDF report");
    } finally {
      setIsGenerating(false);
    }
  };

  async function shareReport (filepath, filename) {
    try {
      const result = await reportingService.shareReport(filepath, filename);
      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to share report");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to share report");
    }
  };

  async function deleteReport (filepath) {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await reportingService.deleteReport(filepath);
              if (result.success) {
                loadReports();
              } else {
                Alert.alert("Error", result.error || "Failed to delete report");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete report");
            }
          },
        },
      ]
    );
  };

  async function clearAllReports () {
    Alert.alert(
      "Clear All Reports",
      "Are you sure you want to delete all reports?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await reportingService.clearAllReports();
              if (result.success) {
                setReports([]);
                Alert.alert("Success", "All reports have been deleted");
              } else {
                Alert.alert("Error", result.error || "Failed to clear reports");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to clear reports");
            }
          },
        },
      ]
    );
  };

  function renderSessionSummary () {
    if (!sessionData) return null;

    const { session, attendance, voting, quiz } = sessionData;
    const safeAttendance = Array.isArray(attendance) ? attendance : [];
    const safeVoting = Array.isArray(voting) ? voting : [];
    const safeQuiz = Array.isArray(quiz) ? quiz : [];
    const safeSession = session || {};

    const totalSubmissions =
      safeAttendance.length + safeVoting.length + safeQuiz.length;
    const validSubmissions = [
      ...safeAttendance,
      ...safeVoting,
      ...safeQuiz,
    ].filter((s) => s.isValid).length;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Session Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Session Type:</Text>
          <Text style={styles.summaryValue}>
            {safeSession.type?.toUpperCase() || "Unknown"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Title:</Text>
          <Text style={styles.summaryValue}>
            {safeSession.title || "Untitled"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Teacher:</Text>
          <Text style={styles.summaryValue}>
            {safeSession.teacherName || "Unknown"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Participants:</Text>
          <Text style={styles.summaryValue}>{totalSubmissions}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Valid Submissions:</Text>
          <Text style={styles.summaryValue}>{validSubmissions}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Invalid Submissions:</Text>
          <Text style={styles.summaryValue}>
            {totalSubmissions - validSubmissions}
          </Text>
        </View>

        {safeSession.type === "attendance" && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Attendance Rate:</Text>
            <Text style={styles.summaryValue}>
              {totalSubmissions > 0
                ? ((validSubmissions / totalSubmissions) * 100).toFixed(1)
                : 0}
              %
            </Text>
          </View>
        )}

        {safeSession.type === "quiz" && validSubmissions > 0 && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Average Score:</Text>
              <Text style={styles.summaryValue}>
                {(
                  safeQuiz
                    .filter((q) => q.isValid)
                    .reduce((sum, q) => sum + q.score, 0) / validSubmissions
                ).toFixed(1)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pass Rate:</Text>
              <Text style={styles.summaryValue}>
                {(
                  (safeQuiz.filter((q) => q.isValid && q.percentage >= 50)
                    .length /
                    validSubmissions) *
                  100
                ).toFixed(1)}
                %
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.reportItem}>
      <View style={styles.reportInfo}>
        <Text style={styles.reportName}>{item.filename}</Text>
        <Text style={styles.reportType}>{item.type.toUpperCase()}</Text>
      </View>

      <View style={styles.reportActions}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => shareReport(item.filepath, item.filename)}
        >
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteReport(item.filepath)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading session data...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Session Reports</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderSessionSummary()}

        <View style={styles.generateCard}>
          <Text style={styles.generateTitle}>Generate Reports</Text>

          <TouchableOpacity
            style={[
              styles.generateButton,
              isGenerating && styles.generateButtonDisabled,
            ]}
            onPress={generateCSVReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.generateButtonText}>Generate CSV Report</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.generateButton,
              styles.pdfButton,
              isGenerating && styles.generateButtonDisabled,
            ]}
            onPress={generatePDFReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.generateButtonText}>Generate PDF Report</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.reportsCard}>
          <View style={styles.reportsHeader}>
            <Text style={styles.reportsTitle}>Generated Reports</Text>
            {reports.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAllReports}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoadingReports ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : reports.length === 0 ? (
            <Text style={styles.noReportsText}>No reports generated yet</Text>
          ) : (
            <FlatList
              data={reports}
              renderItem={renderReportItem}
              keyExtractor={(item) => item.filename}
              scrollEnabled={false}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default ReportingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#007AFF",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  summaryCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  generateCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  generateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  generateButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  generateButtonDisabled: {
    backgroundColor: "#ccc",
  },
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  pdfButton: {
    backgroundColor: "#E53E3E",
  },
  reportsCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  reportsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  clearButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  clearButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  reportItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  reportType: {
    fontSize: 12,
    color: "#666",
  },
  reportActions: {
    flexDirection: "row",
    gap: 10,
  },
  shareButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  shareButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  noReportsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  helpCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});