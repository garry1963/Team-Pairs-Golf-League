import React, { useState } from 'react';
import { Flag, Plus, Edit2, Trash2, MapPin, Award } from 'lucide-react';
import { Course } from '../../types';
import { DatabaseEngine } from '../../storage/db';

interface CoursesScreenProps {
  courses: Course[];
  onToast: (type: 'success' | 'error' | 'warning', title: string, msg: string) => void;
}

export const CoursesScreen: React.FC<CoursesScreenProps> = ({
  courses,
  onToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [courseName, setCourseName] = useState('');
  const [par, setPar] = useState<number>(72);
  const [tees, setTees] = useState('White');
  const [slope, setSlope] = useState<number>(128);
  const [rating, setRating] = useState<number>(71.2);
  const [yardage, setYardage] = useState<number>(6450);
  const [holes, setHoles] = useState<number>(18);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setCourseName('');
    setPar(72);
    setTees('White');
    setSlope(128);
    setRating(71.2);
    setYardage(6450);
    setHoles(18);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Course) => {
    setEditingCourse(c);
    setCourseName(c.courseName);
    setPar(c.par);
    setTees(c.tees);
    setSlope(c.slope || 128);
    setRating(c.rating || 71.2);
    setYardage(c.yardage || 6450);
    setHoles(c.holes || 18);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) {
      onToast('error', 'Validation Error', 'Course name is required.');
      return;
    }

    if (editingCourse) {
      DatabaseEngine.updateCourse(editingCourse.id, {
        courseName: courseName.trim(),
        par,
        tees,
        slope,
        rating,
        yardage,
        holes
      });
      onToast('success', 'Course Updated', `Updated "${courseName.trim()}".`);
    } else {
      DatabaseEngine.addCourse({
        courseName: courseName.trim(),
        location: 'Championship Links',
        par,
        tees,
        slope,
        rating,
        yardage,
        holes,
        active: true
      });
      onToast('success', 'Course Added', `Added "${courseName.trim()}" to course database.`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Flag className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Course Management & Par Database
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {courses.length} Registered Golf Courses • Baseline Par configuration authoritative for relative-to-par scoring
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course</span>
        </button>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(course => (
          <div
            key={course.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-blue-600" />
                  <span>{course.courseName}</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {course.holes || 18} Holes
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 py-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Standard Par</span>
                  <span className="font-mono text-base font-bold text-blue-700">Par {course.par}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Tees</span>
                  <span className="font-semibold text-slate-900">{course.tees}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Slope / Rating</span>
                  <span className="font-mono text-slate-700">{course.slope || 128} / {course.rating || 71.2}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-semibold">Total Yardage</span>
                  <span className="font-mono text-slate-700">{course.yardage ? `${course.yardage} yds` : '6,450 yds'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => handleOpenEdit(course)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center space-x-1.5"
              >
                <Edit2 className="w-3 h-3 text-blue-600" />
                <span>Edit Course</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form onSubmit={handleSave} className="bg-white max-w-md w-full rounded-xl border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCourse ? `Edit Course: ${editingCourse.courseName}` : 'Add New Golf Course'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course Name</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  placeholder="e.g. St. Andrews Old Course"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Standard Par</label>
                  <input
                    type="number"
                    required
                    value={par}
                    onChange={e => setPar(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tee Box</label>
                  <input
                    type="text"
                    required
                    value={tees}
                    onChange={e => setTees(e.target.value)}
                    placeholder="White, Blue, Medal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Slope</label>
                  <input
                    type="number"
                    value={slope}
                    onChange={e => setSlope(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rating}
                    onChange={e => setRating(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Holes</label>
                  <input
                    type="number"
                    value={holes}
                    onChange={e => setHoles(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
              >
                Save Course
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
