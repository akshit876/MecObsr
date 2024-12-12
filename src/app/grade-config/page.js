'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import React from 'react';
import { useRouter } from 'next/navigation';
import { useProtectedRoute } from '../../../hooks/useProtectedRoute';

const GradeConfig = () => {
  const { session, status } = useProtectedRoute();
  const router = useRouter();
  const [gradeData, setGradeData] = useState({ grade: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unsavedGrade, setUnsavedGrade] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGradeConfig();
  }, []);

  const fetchGradeConfig = async () => {
    try {
      const response = await axios.get('/api/grade-config');
      console.log({response});
      if (response && response.data) {
        setGradeData(response.data);
      }
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch grade configuration');
      setIsLoading(false);
    }
  };

  const handleGradeChange = (newGrade) => {
    if (newGrade === "none" || newGrade === gradeData.grade) {
      setUnsavedGrade('');
    } else {
      setUnsavedGrade(newGrade);
    }
  };

  const handleSave = async () => {
    if (!unsavedGrade) return;
    setIsSaving(true);
    try {
      await axios.put('/api/grade-config', {
        grade: unsavedGrade,
        updatedAt: new Date().toISOString(),
        updatedBy: session?.user?.email || 'unknown'
      });
      setGradeData(prev => ({ 
        ...prev, 
        grade: unsavedGrade,
        updatedBy: session?.user?.email || 'unknown'
      }));
      setUnsavedGrade('');
    } catch (err) {
      setError('Failed to update grade');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading') return <div className="p-4"><LoadingSpinner /></div>;
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  if (isLoading) return <div className="p-4"><LoadingSpinner /></div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="h-screen w-full p-4 flex flex-col gap-4 bg-slate-50">
      <Card className="bg-[#012B41] text-white border-0">
        <CardHeader>
          <CardTitle>Grade Configuration</CardTitle>
        </CardHeader>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Current Grade
            </label>
            <select
              value={unsavedGrade || gradeData.grade}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Grade</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="D">Grade D</option>
            </select>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={!unsavedGrade || isSaving}
              className={`px-4 py-2 rounded-md text-white ${
                !unsavedGrade || isSaving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <div className="text-sm text-gray-500 mt-4">
            Last updated: {new Date(gradeData.updatedAt).toLocaleString()}
            <br />
            Updated by: {gradeData.updatedBy}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeConfig;