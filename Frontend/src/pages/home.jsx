import React, { useState, useCallback } from 'react';
import { Upload, FileText, Brain, BarChart3, Download, CheckCircle, AlertCircle, Loader2, Zap, Target, MessageSquare, Database } from 'lucide-react';
import axios from 'axios';
const JDCVMatcher = () => {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState({ jd: null, cv: null });
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState({ jd: false, cv: false });

 const uploadFileToBackend = async (file, type) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await axios.post("http://localhost:8000/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
    });
    console.log(`✅ ${type.toUpperCase()} Upload Success:`, res.data);

    // Optional: Store result from backend
    // setResults(prev => ({ ...prev, [type]: res.data })); 

  } catch (err) {
    console.error(`❌ ${type.toUpperCase()} Upload Failed:`, err);
  }
};

  const handleDrop = useCallback((e, type) => {
  e.preventDefault();
  setDragOver(prev => ({ ...prev, [type]: false }));
  const droppedFiles = Array.from(e.dataTransfer.files);
  if (droppedFiles.length > 0) {
    const file = droppedFiles[0];
    setFiles(prev => ({ ...prev, [type]: file }));
    uploadFileToBackend(file, type);  // <-- Upload to backend
  }
}, []);


  const handleDragOver = useCallback((e, type) => {
    e.preventDefault();
    setDragOver({ ...dragOver, [type]: true });
  }, [dragOver]);

  const handleDragLeave = useCallback((e, type) => {
    e.preventDefault();
    setDragOver({ ...dragOver, [type]: false });
  }, [dragOver]);

 const handleFileSelect = (e, type) => {
  const file = e.target.files[0];
  if (file) {
    setFiles(prev => ({ ...prev, [type]: file }));
    uploadFileToBackend(file, type);  // <-- Upload to backend
  }
};


  const processFiles = async () => {
    if (!files.jd || !files.cv) return;
    
    setProcessing(true);
    setStep(2);
    
    // Simulate API processing
    setTimeout(() => {
      setResults({
        matchScore: 85,
        keywordMatches: ['JavaScript', 'React', 'Node.js', 'API Development', 'Team Leadership'],
        missingSkills: ['Docker', 'Kubernetes', 'AWS'],
        questions: [
          {
            q: "Can you explain your experience with React and state management?",
            a: "I have 3+ years of experience building scalable React applications using Redux and Context API for state management, including complex data flows and performance optimization."
          },
          {
            q: "How do you approach API integration in your projects?",
            a: "I design RESTful APIs with proper error handling, implement authentication/authorization, and use tools like Axios for frontend integration with proper loading states."
          },
          {
            q: "Describe your team leadership experience.",
            a: "I've led cross-functional teams of 5-8 developers, mentored junior developers, conducted code reviews, and managed project timelines using Agile methodologies."
          }
        ],
        strengths: [
          "Strong technical foundation in required technologies",
          "Relevant project experience matches job requirements",
          "Leadership experience aligns with senior role expectations"
        ],
        recommendations: [
          "Consider gaining Docker/containerization experience",
          "Explore cloud platforms like AWS or Azure",
          "Add more details about scalability achievements"
        ]
      });
      setProcessing(false);
      setStep(3);
    }, 3000);
  };

  const exportPDF = () => {
    // Simulate PDF export
    const blob = new Blob(['PDF Report Content'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jd-cv-match-report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetApp = () => {
    setStep(1);
    setFiles({ jd: null, cv: null });
    setResults(null);
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/10"></div>
      
      {/* Header */}
      <header className="relative z-10 bg-white shadow-lg border-b border-red-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">JD-CV Matcher</h1>
            </div>
            <div className="flex items-center space-x-4 text-gray-600 text-sm">
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-red-500" />
                <span>AI Powered</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4 text-red-500" />
                <span>Smart Matching</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8">
            {[
              { num: 1, label: 'Upload Files', icon: Upload },
              { num: 2, label: 'AI Processing', icon: Brain },
              { num: 3, label: 'Results & Export', icon: BarChart3 }
            ].map(({ num, label, icon: Icon }) => (
              <div key={num} className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step >= num 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-110' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > num ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <span className={`text-sm font-medium ${
                  step >= num ? 'text-gray-800' : 'text-gray-500'
                }`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Upload Your Documents</h2>
              <p className="text-gray-600 text-lg">Upload both Job Description and Resume to get started</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Job Description Upload */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100">
                <div className="text-center mb-6">
                  <FileText className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Job Description</h3>
                  <p className="text-gray-600">Upload the job posting or requirements</p>
                </div>

                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragOver.jd
                      ? 'border-red-400 bg-red-50'
                      : files.jd
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                  }`}
                  onDrop={(e) => handleDrop(e, 'jd')}
                  onDragOver={(e) => handleDragOver(e, 'jd')}
                  onDragLeave={(e) => handleDragLeave(e, 'jd')}
                >
                  {files.jd ? (
                    <div className="text-green-600">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium text-gray-800">{files.jd.name}</p>
                      <p className="text-sm text-gray-500 mt-1">Ready to process</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">Drop your JD here or</p>
                      <input
                        type="file"
                        id="jd-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => handleFileSelect(e, 'jd')}
                      />
                      <label
                        htmlFor="jd-upload"
                        className="inline-block px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg cursor-pointer hover:from-red-600 hover:to-red-700 transition-colors duration-200 shadow-md"
                      >
                        Browse Files
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Resume Upload */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="text-center mb-6">
                  <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Resume / CV</h3>
                  <p className="text-gray-600">Upload the candidate's resume</p>
                </div>

                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragOver.cv
                      ? 'border-gray-400 bg-gray-50'
                      : files.cv
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onDrop={(e) => handleDrop(e, 'cv')}
                  onDragOver={(e) => handleDragOver(e, 'cv')}
                  onDragLeave={(e) => handleDragLeave(e, 'cv')}
                >
                  {files.cv ? (
                    <div className="text-green-600">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium text-gray-800">{files.cv.name}</p>
                      <p className="text-sm text-gray-500 mt-1">Ready to process</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">Drop your CV here or</p>
                      <input
                        type="file"
                        id="cv-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => handleFileSelect(e, 'cv')}
                      />
                      <label
                        htmlFor="cv-upload"
                        className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg cursor-pointer hover:bg-gray-700 transition-colors duration-200 shadow-md"
                      >
                        Browse Files
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {files.jd && files.cv && (
              <div className="text-center">
                <button
                  onClick={processFiles}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Brain className="w-5 h-5 inline mr-2" />
                  Start AI Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Processing */}
        {step === 2 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-12 max-w-2xl mx-auto shadow-lg border border-red-100">
              <Loader2 className="w-16 h-16 text-red-500 mx-auto mb-6 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Processing in Progress</h2>
              <p className="text-gray-600 mb-8">Our AI is analyzing your documents and generating insights...</p>
              
              <div className="space-y-4 text-left">
                {[
                  { text: 'Extracting text from documents', done: true },
                  { text: 'Converting content to vectors', done: true },
                  { text: 'Generating questions & answers', done: processing },
                  { text: 'Calculating match score', done: false },
                  { text: 'Preparing recommendations', done: false }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {item.done ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                    <span className={`${item.done ? 'text-gray-800' : 'text-gray-500'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && results && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Analysis Complete!</h2>
              <p className="text-gray-600 text-lg">Here's your comprehensive JD-CV match analysis</p>
            </div>

            {/* Match Score */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-lg mb-6">
                  <span className="text-4xl font-bold text-white">{results.matchScore}%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Overall Match Score</h3>
                <p className="text-gray-600">Strong candidate alignment with job requirements</p>
              </div>
            </div>

            {/* Key Insights Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Keyword Matches */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <CheckCircle className="w-6 h-6 text-red-500 mr-2" />
                  Matching Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.keywordMatches.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-red-500 text-white rounded-full text-sm shadow-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <AlertCircle className="w-6 h-6 text-orange-500 mr-2" />
                  Areas for Development
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.missingSkills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-500 text-white rounded-full text-sm shadow-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Generated Q&A */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <MessageSquare className="w-6 h-6 text-red-500 mr-2" />
                Generated Interview Questions
              </h3>
              <div className="space-y-6">
                {results.questions.map((qa, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="mb-4">
                      <span className="text-red-600 font-medium">Q{index + 1}: </span>
                      <span className="text-gray-800">{qa.q}</span>
                    </div>
                    <div className="pl-6 border-l-2 border-red-500">
                      <span className="text-red-600 font-medium">A: </span>
                      <span className="text-gray-700">{qa.a}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Recommendations */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Target className="w-6 h-6 text-red-500 mr-2" />
                  Key Strengths
                </h3>
                <ul className="space-y-3">
                  {results.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Brain className="w-6 h-6 text-gray-600 mr-2" />
                  Recommendations
                </h3>
                <ul className="space-y-3">
                  {results.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={exportPDF}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Download className="w-5 h-5 inline mr-2" />
                Export PDF Report
              </button>
              <button
                onClick={resetApp}
                className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 border border-gray-300 shadow-md"
              >
                <Upload className="w-5 h-5 inline mr-2" />
                Analyze New Files
              </button>
            </div>

            {/* Data Storage Info */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
              <Database className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">
                Analysis results have been stored securely. You can access this report anytime from your dashboard.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JDCVMatcher;