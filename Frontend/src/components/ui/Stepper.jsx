import React from 'react';
import { Upload, FileText, Brain, BarChart3, CheckCircle, Edit3 } from 'lucide-react';

const Stepper = ({ step }) => (
  <div className="mb-12">
    <div className="flex items-center justify-center space-x-8">
      {[
        { num: 1, label: 'Upload Files', icon: Upload },
        { num: 2, label: 'Extract JD', icon: FileText },
        { num: 3, label: 'Review JD & Categorize Skills', icon: Edit3 },
        { num: 4, label: 'Extract Resumes', icon: FileText },
        { num: 5, label: 'Match', icon: Brain },
        { num: 6, label: 'Results', icon: BarChart3 }
      ].map(({ num, label, icon: Icon }) => (
        <div key={num} className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
            step >= num + 1
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-110' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {step > num + 1 ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
          </div>
          <span className={`text-sm font-medium ${
            step >= num + 1 ? 'text-gray-800' : 'text-gray-500'
          }`}>{label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default Stepper;