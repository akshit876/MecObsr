import { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import React from 'react';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { useRouter } from 'next/navigation';

const GradeConfig = () => {
  const { session, status } = useProtectedRoute();
  const router = useRouter();
  const [gradeData, setGradeData] = useState({ grade: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGradeConfig();
  }, []);

  const fetchGradeConfig = async () => {
    try {
      const response = await axios.get('/api/grade-config');
      if (response.data && response.data.length > 0) {
        setGradeData(response.data[0]);
      }
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch grade configuration');
      setIsLoading(false);
    }
  };

  const handleGradeChange = async (newGrade) => {
    try {
      await axios.put('/api/grade-config', {
        grade: newGrade,
        updatedAt: new Date().toISOString(),
        updatedBy: session?.user?.email || 'unknown'
      });
      setGradeData(prev => ({ 
        ...prev, 
        grade: newGrade,
        updatedBy: session?.user?.email || 'unknown'
      }));
    } catch (err) {
      setError('Failed to update grade');
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
            <Select value={gradeData.grade} onValueChange={handleGradeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select Grade</SelectItem>
                <SelectItem value="A">Grade A</SelectItem>
                <SelectItem value="B">Grade B</SelectItem>
                <SelectItem value="C">Grade C</SelectItem>
                <SelectItem value="D">Grade D</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-500">
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