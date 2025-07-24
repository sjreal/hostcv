import React, { useState, useCallback } from 'react';
import { Brain, Zap, Target, Clock } from 'lucide-react';
import axios from 'axios';

import Stepper from '../../components/ui/Stepper';
import ProcessingLoader from '../../components/ui/ProcessingLoader';
import CvFormEditor from '../../components/CvFormEditor';
import UploadStep from './components/UploadStep';
import ReviewJdStep from './components/ReviewJdStep';
import ReviewResumesStep from './components/ReviewResumesStep';
import ResultsStep from './components/ResultsStep';
import PastAnalyses from './components/PastAnalyses';

const defaultSkillCategories = (skills = []) => ({
  critical: skills,
  important: [],
  extra: []
});

const JDCVMatcher = () => {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState({ jd: null, cv: [] });
  const [processing, setProcessing] = useState(false);
  const [jdJson, setJdJson] = useState(null);
  const [editedJdJson, setEditedJdJson] = useState(null);
  const [skillCategories, setSkillCategories] = useState(defaultSkillCategories());
  const [cvExtractionResults, setCvExtractionResults] = useState(null);
  const [finalResults, setFinalResults] = useState(null);
  const [dragOver, setDragOver] = useState({ jd: false, cv: false });
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [showJsonView, setShowJsonView] = useState(false);
  const [editingCvIndex, setEditingCvIndex] = useState(null);
  const [view, setView] = useState('main'); // 'main' or 'past'

  // --- File Handlers ---
  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
        if (type === 'cv') {
          setFiles(prev => ({ ...prev, [type]: droppedFiles }));
        } else {
          setFiles(prev => ({ ...prev, [type]: droppedFiles[0] }));
        }
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
    const selectedFiles = Array.from(e.target.files);
    if (type === 'cv') {
      setFiles(prev => ({ ...prev, [type]: selectedFiles }));
    } else {
      setFiles(prev => ({ ...prev, [type]: selectedFiles[0] }));
    }
  };

  // --- Step 2: Extract JD JSON ---
  const extractJD = async () => {
    if (!files.jd) return;
    setProcessing(true);
    setStep(2);
    const formData = new FormData();
    formData.append('jd_file', files.jd);
    const localApi = import.meta.env.VITE_API_URL;
    const networkApi = import.meta.env.VITE_API_URL_NETWORK;
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const apiUrl = isLocalhost ? localApi : networkApi;
    try {
      const res = await axios.post(`${apiUrl}/extract_jd`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setJdJson(res.data);
      setEditedJdJson(res.data);
      setSkillCategories(defaultSkillCategories(res.data.requiredSkills || []));
      setProcessing(false);
      setStep(3);
    } catch (err) {
      setProcessing(false);
      alert('Error extracting JD: ' + (err.response?.data?.error || err.message));
    }
  };

  // --- Skill Categorization Handlers ---
  const moveSkill = (skill, from, to) => {
    if (from === to) return;
    setSkillCategories(prev => {
      const updated = { ...prev };
      updated[from] = updated[from].filter(s => s !== skill);
      updated[to] = [...updated[to], skill];
      return updated;
    });
  };

  const addSkill = (skill, category) => {
    if (!skill.trim()) return;
    setSkillCategories(prev => ({
      ...prev,
      [category]: [...prev[category], skill.trim()]
    }));
    setNewSkill("");
  };

  const removeSkill = (skill, category) => {
    setSkillCategories(prev => ({
      ...prev,
      [category]: prev[category].filter(s => s !== skill)
    }));
  };

  // --- Step 4: Extract Resumes ---
  const extractResumes = async () => {
    if (!editedJdJson || !files.cv || files.cv.length === 0) return;
    setProcessing(true);
    setStep(4);
    const jdWithCategories = {
      ...editedJdJson,
      requiredSkills: skillCategories,
    };
    const formData = new FormData();
    formData.append('jd_json', JSON.stringify(jdWithCategories));
    for (let i = 0; i < files.cv.length; i++) {
      formData.append('resume_files', files.cv[i]);
    }
    const localApi = import.meta.env.VITE_API_URL;
    const networkApi = import.meta.env.VITE_API_URL_NETWORK;
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const apiUrl = isLocalhost ? localApi : networkApi;
    try {
      const res = await axios.post(`${apiUrl}/extract_resumes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCvExtractionResults(res.data);
      setProcessing(false);
      setStep(5);
    } catch (err) {
      setProcessing(false);
      alert('Error extracting resumes: ' + (err.response?.data?.error || err.message));
    }
  };

  // --- Step 5: Match ---
  const matchResults = async () => {
    if (!editedJdJson || !cvExtractionResults) return;
    setProcessing(true);
    setStep(6);
    const jdWithFlatSkills = {
      ...editedJdJson,
      requiredSkills: [
        ...skillCategories.critical,
        ...skillCategories.important,
        ...skillCategories.extra
      ],
    };
    const localApi = import.meta.env.VITE_API_URL;
    const networkApi = import.meta.env.VITE_API_URL_NETWORK;
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const apiUrl = isLocalhost ? localApi : networkApi;
    try {
      const res = await axios.post(`${apiUrl}/match`, {
        jd_json: jdWithFlatSkills, // Use the object with flattened skills
        cvs: cvExtractionResults
      });
      setFinalResults(res.data);
      setProcessing(false);
      setStep(7);
    } catch (err) {
      setProcessing(false);
      alert('Error matching results: ' + (err.response?.data?.error || err.message));
    }
  };

  // --- Reset ---
  const resetApp = () => {
    setStep(1);
    setFiles({ jd: null, cv: [] });
    setJdJson(null);
    setEditedJdJson(null);
    setSkillCategories(defaultSkillCategories());
    setCvExtractionResults(null);
    setFinalResults(null);
    setProcessing(false);
    setView('main');
  };

  const handleUpdateCv = (index, updatedCv) => {
    const newCvResults = [...cvExtractionResults];
    newCvResults[index].cv_json = updatedCv;
    setCvExtractionResults(newCvResults);
    setEditingCvIndex(null);
  };

  const renderContent = () => {
    if (view === 'past') {
      return <PastAnalyses />;
    }

    switch (step) {
      case 1:
        return (
          <UploadStep
            files={files}
            dragOver={dragOver}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleFileSelect={handleFileSelect}
            extractJD={extractJD}
            processing={processing}
          />
        );
      case 3:
        return (
          <ReviewJdStep
            editedJdJson={editedJdJson}
            skillCategories={skillCategories}
            newSkill={newSkill}
            showJsonView={showJsonView}
            setEditedJdJson={setEditedJdJson}
            moveSkill={moveSkill}
            addSkill={addSkill}
            removeSkill={removeSkill}
            setNewSkill={setNewSkill}
            setShowJsonView={setShowJsonView}
            extractResumes={extractResumes}
            resetApp={resetApp}
            processing={processing}
          />
        );
      case 5:
        return (
          <ReviewResumesStep
            cvExtractionResults={cvExtractionResults}
            setEditingCvIndex={setEditingCvIndex}
            matchResults={matchResults}
            resetApp={resetApp}
            processing={processing}
          />
        );
      case 7:
        return (
          <ResultsStep
            finalResults={finalResults}
            expandedIdx={expandedIdx}
            setExpandedIdx={setExpandedIdx}
            skillCategories={skillCategories}
            resetApp={resetApp}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/10"></div>
      <header className="relative z-10 bg-white shadow-lg border-b border-red-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">JD-CV Matcher</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setView(view === 'main' ? 'past' : 'main')}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {view === 'main' ? 'View Past Analyses' : 'New Analysis'}
                </span>
              </button>
              <div className="flex items-center space-x-1 text-gray-600 text-sm">
                <Zap className="w-4 h-4 text-red-500" />
                <span>AI Powered</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600 text-sm">
                <Target className="w-4 h-4 text-red-500" />
                <span>Smart Matching</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {view === 'main' && <Stepper step={step} />}
        
        {renderContent()}

        {processing && <ProcessingLoader />}

        {editingCvIndex !== null && (
            <CvFormEditor
                cvData={cvExtractionResults[editingCvIndex].cv_json}
                onUpdate={(updatedCv) => handleUpdateCv(editingCvIndex, updatedCv)}
                onCancel={() => setEditingCvIndex(null)}
            />
        )}
      </main>
    </div>
  );
};

export default JDCVMatcher;
