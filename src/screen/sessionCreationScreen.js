import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { SESSION_TYPES } from "../types/sessionTypes";
import { useSession } from "../context/sessionContext";
import { useAuth } from "../context/authContext";

const SessionCreationScreen = ({ navigation }) => {
  const { createSession, userLocation } = useSession();
  const { user } = useAuth();
  const [sessionType, setSessionType] = useState(SESSION_TYPES.ATTENDANCE);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(5);
  const [radius, setRadius] = useState(20);

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentOptions, setCurrentOptions] = useState(["", "", "", ""]);
  const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState(0);
  const [currentMarks, setCurrentMarks] = useState(1);

  const [votingQuestion, setVotingQuestion] = useState("");
  const [votingOptions, setVotingOptions] = useState(["", ""]);
  const [allowMultipleChoice, setAllowMultipleChoice] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleCreateSession = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a session title");
      return;
    }

    if (!userLocation) {
      Alert.alert("Error", "Location not available. Please try again.");
      return;
    }

    const finalTimeLimit = timeLimit === "" ? 5 : timeLimit;
    const finalRadius = radius === "" ? 20 : radius;

    if (finalTimeLimit <= 0) {
      Alert.alert("Error", "Time limit must be greater than 0");
      return;
    }

    if (finalRadius <= 0) {
      Alert.alert("Error", "Radius must be greater than 0");
      return;
    }

    let sessionData = {
      type: sessionType,
      title: title.trim(),
      description: description.trim(),
      teacherId: user?.id || "unknown",
      teacherName: user?.name || "Unknown Teacher",
      location: {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: finalRadius,
      },
      timeLimit: finalTimeLimit * 60,
      settings: {},
    };

    if (sessionType === SESSION_TYPES.QUIZ) {
      if (questions.length === 0) {
        Alert.alert("Error", "Please add at least one question for the quiz");
        return;
      }
      sessionData.questions = questions;
      sessionData.totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      sessionData.passingMarks = Math.floor(sessionData.totalMarks * 0.5);
      sessionData.monitorAppFocus = true;
    } else if (sessionType === SESSION_TYPES.VOTING) {
      if (!votingQuestion.trim()) {
        Alert.alert("Error", "Please enter a voting question");
        return;
      }
      const validOptions = votingOptions.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        Alert.alert("Error", "Please enter at least 2 voting options");
        return;
      }
      sessionData.question = votingQuestion.trim();
      sessionData.options = validOptions;
      sessionData.allowMultipleChoice = allowMultipleChoice;
      sessionData.showResults = showResults;
    }

    try {
      const result = await createSession(sessionData);
      if (result.success) {
        Alert.alert(
          "Session Created",
          "Session has been created and started successfully! Students will be notified.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to create session");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create session");
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.trim()) {
      Alert.alert("Error", "Please enter a question");
      return;
    }

    const validOptions = currentOptions.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      Alert.alert("Error", "Please enter at least 2 options");
      return;
    }

    const finalMarks = currentMarks === "" ? 1 : currentMarks;
    if (finalMarks <= 0) {
      Alert.alert("Error", "Marks must be greater than 0");
      return;
    }

    const question = {
      id: Date.now().toString(),
      question: currentQuestion.trim(),
      type: "multiple_choice",
      options: validOptions,
      correctAnswer: validOptions[currentCorrectAnswer],
      marks: finalMarks,
    };

    setQuestions([...questions, question]);
    setCurrentQuestion("");
    setCurrentOptions(["", "", "", ""]);
    setCurrentCorrectAnswer(0);
    setCurrentMarks(1);
  };

  const addVotingOption = () => {
    setVotingOptions([...votingOptions, ""]);
  };

  const removeVotingOption = (index) => {
    if (votingOptions.length > 2) {
      const newOptions = votingOptions.filter((_, i) => i !== index);
      setVotingOptions(newOptions);
    }
  };

  const updateVotingOption = (index, value) => {
    const newOptions = [...votingOptions];
    newOptions[index] = value;
    setVotingOptions(newOptions);
  };

  const renderQuizSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quiz Questions</Text>

      {questions.map((q, index) => (
        <View key={q.id} style={styles.questionCard}>
          <Text style={styles.questionText}>
            {index + 1}. {q.question}
          </Text>
          <Text style={styles.questionMarks}>Marks: {q.marks}</Text>
        </View>
      ))}

      <View style={styles.addQuestionCard}>
        <TextInput
          style={styles.input}
          placeholder="Enter question"
          placeholderTextColor="#999"
          value={currentQuestion}
          onChangeText={setCurrentQuestion}
        />

        <Text style={styles.optionsLabel}>Options:</Text>
        {currentOptions.map((option, index) => (
          <TextInput
            key={index}
            style={styles.input}
            placeholder={`Option ${index + 1}`}
            placeholderTextColor="#999"
            value={option}
            onChangeText={(value) => {
              const newOptions = [...currentOptions];
              newOptions[index] = value;
              setCurrentOptions(newOptions);
            }}
          />
        ))}

        <Text style={styles.optionsLabel}>Correct Answer:</Text>
        <View style={styles.radioGroup}>
          {currentOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.radioOption}
              onPress={() => setCurrentCorrectAnswer(index)}
            >
              <View style={styles.radioCircle}>
                {currentCorrectAnswer === index && (
                  <View style={styles.radioSelected} />
                )}
              </View>
              <Text style={styles.radioText}>
                {option || `Option ${index + 1}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.marksContainer}>
          <Text style={styles.marksLabel}>Marks:</Text>
          <TextInput
            style={styles.marksInput}
            placeholder="1"
            placeholderTextColor="#999"
            value={currentMarks.toString()}
            onChangeText={(value) => {
              if (value === "") {
                setCurrentMarks("");
              } else {
                const num = parseInt(value);
                if (!isNaN(num) && num > 0) {
                  setCurrentMarks(num);
                }
              }
            }}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
          <Text style={styles.addButtonText}>Add Question</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVotingSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Voting Details</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter voting question"
        placeholderTextColor="#999"
        value={votingQuestion}
        onChangeText={setVotingQuestion}
        multiline
      />

      <Text style={styles.optionsLabel}>Options:</Text>
      {votingOptions.map((option, index) => (
        <View key={index} style={styles.optionRow}>
          <TextInput
            style={[styles.input, styles.optionInput]}
            placeholder={`Option ${index + 1}`}
            placeholderTextColor="#999"
            value={option}
            onChangeText={(value) => updateVotingOption(index, value)}
          />
          {votingOptions.length > 2 && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeVotingOption(index)}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity
        style={styles.addOptionButton}
        onPress={addVotingOption}
      >
        <Text style={styles.addOptionButtonText}>+ Add Option</Text>
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Allow Multiple Choice</Text>
        <Switch
          value={allowMultipleChoice}
          onValueChange={setAllowMultipleChoice}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Session</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Type</Text>
          <View style={styles.typeButtons}>
            {Object.values(SESSION_TYPES).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  sessionType === type && styles.typeButtonActive,
                ]}
                onPress={() => setSessionType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    sessionType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Session Title"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (Optional)"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Time Limit (minutes):</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="5"
              placeholderTextColor="#999"
              value={timeLimit.toString()}
              onChangeText={(value) => {
                if (value === "") {
                  setTimeLimit("");
                } else {
                  const num = parseInt(value);
                  if (!isNaN(num) && num > 0) {
                    setTimeLimit(num);
                  }
                }
              }}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Radius (meters):</Text>
            <TextInput
              style={styles.numberInput}
              placeholder="20"
              placeholderTextColor="#999"
              value={radius.toString()}
              onChangeText={(value) => {
                if (value === "") {
                  setRadius("");
                } else {
                  const num = parseInt(value);
                  if (!isNaN(num) && num > 0) {
                    setRadius(num);
                  }
                }
              }}
              keyboardType="numeric"
            />
          </View>
        </View>

        {sessionType === SESSION_TYPES.QUIZ && renderQuizSection()}
        {sessionType === SESSION_TYPES.VOTING && renderVotingSection()}

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateSession}
        >
          <Text style={styles.createButtonText}>Create Session</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SessionCreationScreen;

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
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  typeButtons: {
    flexDirection: "row",
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  typeButtonText: {
    fontSize: 16,
    color: "#666",
  },
  typeButtonTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    width: 80,
    textAlign: "center",
  },
  questionCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  questionText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  questionMarks: {
    fontSize: 14,
    color: "#666",
  },
  addQuestionCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  optionsLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  radioGroup: {
    marginBottom: 15,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#007AFF",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
  },
  radioText: {
    fontSize: 16,
    color: "#333",
  },
  marksContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  marksLabel: {
    fontSize: 16,
    marginRight: 10,
    color: "#333",
  },
  marksInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    width: 60,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  optionInput: {
    flex: 1,
    marginRight: 10,
  },
  removeButton: {
    backgroundColor: "#dc3545",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  addOptionButton: {
    backgroundColor: "#17a2b8",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  addOptionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
  },
  createButton: {
    backgroundColor: "#007AFF",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  createButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
