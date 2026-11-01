"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/header";
import { EmailComposer, FileUploader } from "../../components";
import EmailStatusDisplay from "../../components/EmailStatusDisplay";
import TestQueueStats from "../../components/TestQueueStats";
import SimpleBatchStatus from "../../components/SimpleBatchStatus";
import { useEmailBatch, useFileUpload } from "../../hooks";
import { isAuthenticated, getUser } from "../../utils/auth";
import {
  FaUpload,
  FaEnvelope,
  FaUsers,
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
} from "react-icons/fa";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [statusMessage, setStatusMessage] = useState("");

  // File upload state
  const {
    data: excelData,
    isLoading: isUploading,
    error: uploadError,
    uploadFile,
  } = useFileUpload();

  // Email batch state
  const { batchState, sendBatch, trackProgress } = useEmailBatch();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setUser(getUser());
  }, [router]);

  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  const handleSendEmails = async (emailData: any) => {
    try {
      setActiveTab("status");
      setStatusMessage("Queuing emails for processing...");

      console.log("Sending batch with data:", emailData);

      // Store email content in localStorage for the report
      localStorage.setItem(
        "lastEmailContent",
        JSON.stringify({
          subject: emailData.subject,
          text: emailData.text,
        })
      );

      const batchId = await sendBatch(emailData);
      console.log("Received batchId after sending:", batchId);

      setCurrentBatchId(batchId);

      if (batchId) {
        setStatusMessage(
          "Emails queued successfully! Processing in background..."
        );

        // Start intelligent polling for batch status updates
        let pollCount = 0;
        const maxPolls = 60; // Poll for up to 2 minutes

        const pollStatus = setInterval(async () => {
          pollCount++;

          try {
            const statusData = await trackProgress(batchId);
            console.log(`Poll ${pollCount}: Status data received:`, statusData);

            const sentEmails =
              statusData.results?.filter((r) => r.status === "sent").length ||
              0;
            const totalEmails =
              statusData.total || statusData.results?.length || 0;
            const failedEmails =
              statusData.results?.filter((r) => r.status === "failed").length ||
              0;

            // Update status message with real-time counts
            if (sentEmails === 0 && failedEmails === 0) {
              setStatusMessage(
                `Processing emails... (${pollCount * 2}s elapsed)`
              );
            } else if (sentEmails + failedEmails < totalEmails) {
              setStatusMessage(
                `Sending emails... ${sentEmails}/${totalEmails} completed`
              );
            } else {
              clearInterval(pollStatus);
              setStatusMessage(
                `Email campaign completed! ${sentEmails}/${totalEmails} emails sent successfully.`
              );

              // Force a final state update to ensure stats boxes show correct data
              console.log("Forcing final batchState update with:", statusData);

              setTimeout(() => {
                console.log("Current batchState after completion:", batchState);
              }, 1000);
            }

            // Stop polling if we've reached max attempts or all emails are done
            if (
              pollCount >= maxPolls ||
              (sentEmails + failedEmails >= totalEmails && totalEmails > 0)
            ) {
              clearInterval(pollStatus);
              if (sentEmails + failedEmails >= totalEmails) {
                setStatusMessage(
                  `Email campaign completed! ${sentEmails}/${totalEmails} emails sent successfully.`
                );
              } else {
                setStatusMessage(
                  `Polling timeout. ${sentEmails}/${totalEmails} emails confirmed sent.`
                );
              }
            }
          } catch (pollError) {
            console.warn(`Poll ${pollCount} error:`, pollError.message);

            if (
              pollCount >= maxPolls ||
              pollError.message.includes("Empty response")
            ) {
              clearInterval(pollStatus);
              if (pollError.message.includes("Empty response")) {
                setStatusMessage("Email processing completed.");
              } else {
                setStatusMessage(
                  "Unable to retrieve final status. Please check your email delivery manually."
                );
              }
            }
          }
        }, 2000);

        // Stop polling after 10 minutes to prevent infinite polling
        setTimeout(() => {
          clearInterval(pollStatus);
        }, 600000);
      }
    } catch (error) {
      console.error("Email sending error:", error);
      setStatusMessage("Failed to queue emails. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "upload", label: "Upload Contacts", icon: FaUpload },
    { id: "compose", label: "Compose Email", icon: FaEnvelope },
    { id: "status", label: "Email Status", icon: FaChartLine },
  ];

  const getStepStatus = (step: string) => {
    const dataLength = excelData?.length || 0;
    if (step === "upload")
      return dataLength > 0
        ? "completed"
        : activeTab === "upload"
        ? "active"
        : "pending";
    if (step === "compose")
      return activeTab === "compose"
        ? "active"
        : dataLength > 0
        ? "pending"
        : "disabled";
    if (step === "status") return batchState?.batchId ? "active" : "disabled";
    return "pending";
  };

  const getStepIcon = (step: string, status: string) => {
    if (status === "completed")
      return <FaCheckCircle className="text-green-500" />;
    if (status === "active") return <FaClock className="text-blue-500" />;
    if (status === "disabled")
      return <FaExclamationTriangle className="text-gray-400" />;
    return <div className="w-2 h-2 bg-gray-300 rounded-full" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.userName}! 👋
          </h1>
          <p className="text-gray-600">
            Send personalized emails to multiple recipients with ease.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Email Campaign Progress
            </h2>
            <div className="flex items-center justify-between">
              {tabs.map((tab, index) => (
                <div key={tab.id} className="flex items-center">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                        getStepStatus(tab.id) === "completed"
                          ? "bg-green-50 border-green-200"
                          : getStepStatus(tab.id) === "active"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {getStepIcon(tab.id, getStepStatus(tab.id))}
                    </div>
                    <div>
                      <div
                        className={`font-medium ${
                          getStepStatus(tab.id) === "active"
                            ? "text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        {tab.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        Step {index + 1}
                      </div>
                    </div>
                  </div>
                  {index < tabs.length - 1 && (
                    <div className="flex-1 mx-4 h-px bg-gray-200"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Test Queue Stats */}
        <TestQueueStats />

        {/* Contacts Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Contacts Uploaded
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {excelData?.length
                  ? `${excelData.length} contacts ready to receive emails`
                  : "No contacts uploaded yet"}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaUsers className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
            <div className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const status = getStepStatus(tab.id);
                const isDisabled = status === "disabled";

                return (
                  <button
                    key={tab.id}
                    onClick={() => !isDisabled && setActiveTab(tab.id)}
                    disabled={isDisabled}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-md"
                        : isDisabled
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {activeTab === "upload" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Upload Your Contacts
                </h2>
                <p className="text-gray-600">
                  Upload an Excel file (.xlsx, .xls) or CSV file with your
                  contact information
                </p>
              </div>

              <FileUploader
                onFileUpload={uploadFile}
                isUploading={isUploading}
                uploadError={uploadError}
                uploadedData={excelData}
              />

              {(excelData?.length || 0) > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setActiveTab("compose")}
                    className="btn-primary"
                  >
                    Continue to Compose Email
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "compose" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Compose Your Email
                </h2>
                <p className="text-gray-600">
                  Write your message and it will be personalized for each
                  recipient
                </p>
              </div>

              <EmailComposer
                excelData={excelData || []}
                onSendEmails={handleSendEmails}
                userEmail={user?.email || ""}
              />
            </div>
          )}

          {activeTab === "status" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Status
                </h2>
                <p className="text-gray-600">
                  Track the progress and results of your email campaign
                </p>
              </div>

              <SimpleBatchStatus batchId={currentBatchId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
