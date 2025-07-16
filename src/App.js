import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Plus, Search, Filter, Download } from 'lucide-react';

const AttendanceApp = () => {
  // Google Sheets configuration
  const SHEET_ID = '1zvdysWI4pZ_yh_uUCh7fFx17CQTU23pHYOIfAlx0SAI';
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=`;
  
  // Helper function to send data to Google Sheets
  const sendToSheet = async (sheetName, data) => {
    try {
      const response = await fetch(`https://script.google.com/macros/s/AKfycbz0l6_ggK802nEXaSM8Xs90SDV6KUPa6AParwkcZ4--niNo3BEH-5l1De-YgUIq3e8_cw/exec`, {
        method: 'POST',
        body: JSON.stringify({
          sheet: sheetName,
          data: data
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Error sending to sheet:', error);
      return false;
    }
  };

  // Time slots
  const timeSlots = ['07:30', '09:00', '12:15', '15:30', '16:45', '17:45', '20:00'];
  
  // Initial student data (53 students) - Hebrew names
  const initialStudents = [
    // Group A (26 students)
    ...Array.from({ length: 26 }, (_, i) => ({
      id: i + 1,
      name: `חניך א${i + 1}`,
      group: 'קבוצה א'
    })),
    // Group B (27 students)
    ...Array.from({ length: 27 }, (_, i) => ({
      id: i + 27,
      name: `חניך ב${i + 1}`,
      group: 'קבוצה ב'
    }))
  ];

  // Helper function to get the most recent past time slot
  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
    
    // Convert time slots to minutes for comparison
    const timeSlotMinutes = timeSlots.map(slot => {
      const [hours, minutes] = slot.split(':').map(Number);
      return hours * 60 + minutes;
    });
    
    // Find the most recent time slot that has passed
    let selectedSlot = timeSlots[0]; // Default to first slot
    
    for (let i = timeSlotMinutes.length - 1; i >= 0; i--) {
      if (currentTime >= timeSlotMinutes[i]) {
        selectedSlot = timeSlots[i];
        break;
      }
    }
    
    return selectedSlot;
  };

  // State management
  const [students, setStudents] = useState(initialStudents);
  const [schedule, setSchedule] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [absences, setAbsences] = useState([]); // New absence tracking
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(getCurrentTimeSlot());
  const [selectedGroup, setSelectedGroup] = useState('כולם');
  const [recorder, setRecorder] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoTimeSlot, setAutoTimeSlot] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Absence approval options
  const approvalOptions = ['הרב אילעאי', 'הרב שובי', 'בועז', 'עמית'];

  // Auto-update time slot every minute
  useEffect(() => {
    if (autoTimeSlot) {
      const interval = setInterval(() => {
        setSelectedTimeSlot(getCurrentTimeSlot());
      }, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [autoTimeSlot]);

  // Generate schedule for current week
  useEffect(() => {
    const generateSchedule = () => {
      const scheduleData = [];
      const today = new Date();
      
      // Generate schedule for next 7 days
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];
        
        timeSlots.forEach(slot => {
          // Mix of group-specific and all-student lessons
          const groups = day % 3 === 0 ? ['קבוצה א', 'קבוצה ב', 'כולם'] : ['כולם'];
          groups.forEach(group => {
            scheduleData.push({
              id: `${dateStr}-${slot}-${group}`,
              date: dateStr,
              timeSlot: slot,
              group: group,
              description: `${slot} - שיעור ${group}`
            });
          });
        });
      }
      
      setSchedule(scheduleData);
    };
    
    generateSchedule();
  }, []);

  // Check if student is currently absent from academy
  const isStudentAbsent = (studentId, date, timeSlot) => {
    const currentDateTime = new Date(`${date} ${timeSlot}`);
    
    return absences.some(absence => {
      const departureDateTime = new Date(`${absence.departureDate} ${absence.departureTime}`);
      const returnDateTime = new Date(`${absence.returnDate} ${absence.returnTime}`);
      
      return absence.studentId === studentId && 
             currentDateTime >= departureDateTime && 
             currentDateTime <= returnDateTime;
    });
  };

  // Calculate attendance statistics with absence consideration
  const calculateAttendanceStats = (studentId) => {
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    const expectedLessons = schedule.filter(s => 
      s.group === 'כולם' || s.group === students.find(st => st.id === studentId)?.group
    );
    
    // Filter out lessons where student was legitimately absent
    const relevantLessons = expectedLessons.filter(lesson => 
      !isStudentAbsent(studentId, lesson.date, lesson.timeSlot)
    );
    
    const presentCount = studentAttendance.filter(a => a.present).length;
    const percentage = relevantLessons.length > 0 ? Math.round((presentCount / relevantLessons.length) * 100) : 0;
    
    return {
      percentage,
      presentCount,
      expectedLessons: relevantLessons.length,
      totalLessons: expectedLessons.length,
      status: percentage < 80 ? 'critical' : percentage < 90 ? 'warning' : 'good'
    };
  };

  // Handle attendance submission with Google Sheets integration
  const handleAttendanceSubmission = async (presentStudents) => {
    const scheduleSlot = schedule.find(s => 
      s.date === selectedDate && 
      s.timeSlot === selectedTimeSlot && 
      s.group === selectedGroup
    );
    
    if (!scheduleSlot) return;

    const relevantStudents = selectedGroup === 'כולם' ? 
      students : 
      students.filter(s => s.group === selectedGroup);

    // Filter out students who are legitimately absent
    const studentsToRecord = relevantStudents.filter(student => 
      !isStudentAbsent(student.id, selectedDate, selectedTimeSlot)
    );

    const newAttendanceRecords = studentsToRecord.map(student => ({
      id: `${scheduleSlot.id}-${student.id}`,
      studentId: student.id,
      scheduleId: scheduleSlot.id,
      present: presentStudents.includes(student.id),
      recorder: recorder,
      timestamp: new Date().toISOString(),
      date: selectedDate,
      timeSlot: selectedTimeSlot
    }));

    // Update local state
    setAttendance(prev => [
      ...prev.filter(a => !newAttendanceRecords.some(n => n.id === a.id)),
      ...newAttendanceRecords
    ]);

    // Send to Google Sheets
    setIsLoading(true);
    try {
      const sheetData = newAttendanceRecords.map(record => [
        record.date,
        record.timeSlot,
        record.studentId,
        record.present ? 'נוכח' : 'לא נוכח',
        record.recorder,
        new Date(record.timestamp).toLocaleString('he-IL')
      ]);

      const success = await sendToSheet('נוכחות', sheetData);
      if (success) {
        alert('הנוכחות נרשמה בהצלחה וחוברה לגיליון!');
      } else {
        alert('הנוכחות נרשמה מקומית, אך לא הצליח לחבר לגיליון. נסה שוב.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('הנוכחות נרשמה מקומית, אך לא הצליח לחבר לגיליון.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle absence submission with Google Sheets integration
  const handleAbsenceSubmission = async (formData) => {
    const newAbsence = {
      id: `absence-${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString()
    };

    // Update local state
    setAbsences(prev => [...prev, newAbsence]);

    // Send to Google Sheets
    setIsLoading(true);
    try {
      const sheetData = [[
        formData.studentId,
        formData.departureDate,
        formData.departureTime,
        formData.returnDate,
        formData.returnTime,
        formData.purpose,
        formData.approvedBy
      ]];

      const success = await sendToSheet('היעדויות', sheetData);
      if (success) {
        alert('דיווח היעדות נרשם בהצלחה וחובר לגיליון!');
      } else {
        alert('דיווח היעדות נרשם מקומית, אך לא הצליח לחבר לגיליון. נסה שוב.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('דיווח היעדות נרשם מקומית, אך לא הצליח לחבר לגיליון.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dashboard Component
  const Dashboard = () => {
    const todayAttendance = attendance.filter(a => a.date === selectedDate);
    const todaySchedule = schedule.filter(s => s.date === selectedDate);
    const overallAttendanceRate = todayAttendance.length > 0 ? 
      Math.round((todayAttendance.filter(a => a.present).length / todayAttendance.length) * 100) : 0;

    const lowAttendanceStudents = students.filter(student => {
      const stats = calculateAttendanceStats(student.id);
      return stats.status === 'critical' || stats.status === 'warning';
    });

    return (
      <div className="space-y-6" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">סך חניכים</p>
                <p className="text-2xl font-bold text-blue-900">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">נוכחות היום</p>
                <p className="text-2xl font-bold text-green-900">{overallAttendanceRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">שיעורים היום</p>
                <p className="text-2xl font-bold text-yellow-900">{todaySchedule.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">נוכחות נמוכה</p>
                <p className="text-2xl font-bold text-red-900">{lowAttendanceStudents.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">🔗 גיליון Google Sheets</h3>
          <p className="text-blue-700 text-sm mb-2">
            כל הנתונים נשמרים באופן אוטומטי בגיליון Google Sheets
          </p>
          <a 
            href={SHEET_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            פתח גיליון
          </a>
        </div>

        {lowAttendanceStudents.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ חניכים הדורשים תשומת לב</h3>
            <div className="space-y-2">
              {lowAttendanceStudents.map(student => {
                const stats = calculateAttendanceStats(student.id);
                return (
                  <div key={student.id} className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="font-medium">{student.name} ({student.group})</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      stats.status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {stats.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4">מערכת שעות היום</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">חניך</label>
              <select
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר חניך</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.group})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מאושר על ידי</label>
              <select
                value={formData.approvedBy}
                onChange={(e) => handleInputChange('approvedBy', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר מאשר</option>
                {approvalOptions.map(approver => (
                  <option key={approver} value={approver}>{approver}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תאריך יציאה</label>
              <input
                type="date"
                value={formData.departureDate}
                onChange={(e) => handleInputChange('departureDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שעת יציאה</label>
              <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => handleInputChange('departureTime', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תאריך חזרה צפויה</label>
              <input
                type="date"
                value={formData.returnDate}
                onChange={(e) => handleInputChange('returnDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שעת חזרה צפויה</label>
              <input
                type="time"
                value={formData.returnTime}
                onChange={(e) => handleInputChange('returnTime', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">מטרת היציאה</label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="למשל: ביקור רופא, אירוע משפחתי, צרכים אישיים..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? 'שולח...' : 'דווח היעדות'}
          </button>
        </div>

        {/* Current Absences List */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">היעדויות פעילות</h3>
          
          {currentAbsences.length === 0 ? (
            <p className="text-gray-500 text-center py-4">אין היעדויות פעילות כרגע</p>
          ) : (
            <div className="space-y-3">
              {currentAbsences.map(absence => {
                const student = students.find(s => s.id === parseInt(absence.studentId));
                const departureDateTime = new Date(`${absence.departureDate} ${absence.departureTime}`);
                const returnDateTime = new Date(`${absence.returnDate} ${absence.returnTime}`);
                const isCurrentlyOut = new Date() >= departureDateTime;
                
                return (
                  <div key={absence.id} className={`border rounded-lg p-4 ${
                    isCurrentlyOut ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{student?.name} ({student?.group})</h4>
                        <p className="text-sm text-gray-600">{absence.purpose}</p>
                      </div>
                      <div className="text-left">
                        <span className={`px-2 py-1 rounded text-xs ${
                          isCurrentlyOut ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isCurrentlyOut ? 'יצא מהמכינה' : 'יעדות מתוכננת'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">יציאה: </span>
                        {absence.departureDate} בשעה {absence.departureTime}
                      </div>
                      <div>
                        <span className="font-medium">חזרה צפויה: </span>
                        {absence.returnDate} בשעה {absence.returnTime}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm">
                      <span className="font-medium">מאושר על ידי: </span>
                      <span className="text-blue-600">{absence.approvedBy}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Students Overview Component
  const StudentsOverview = () => {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">סקירת חניכים</h2>
            <div className="flex space-x-2 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="חפש חניכים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 pl-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-medium">שם</th>
                  <th className="text-right py-3 px-4 font-medium">קבוצה</th>
                  <th className="text-center py-3 px-4 font-medium">אחוז נוכחות</th>
                  <th className="text-center py-3 px-4 font-medium">נוכח/נדרש</th>
                  <th className="text-center py-3 px-4 font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const stats = calculateAttendanceStats(student.id);
                  return (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{student.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          student.group === 'קבוצה א' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {student.group}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${
                          stats.status === 'critical' ? 'text-red-600' : 
                          stats.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {stats.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-600">
                        {stats.presentCount} / {stats.expectedLessons}
                        {stats.totalLessons !== stats.expectedLessons && (
                          <div className="text-xs text-orange-600">
                            ({stats.totalLessons - stats.expectedLessons} בהיעדות)
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {stats.status === 'critical' && <span className="text-red-600">🚨</span>}
                        {stats.status === 'warning' && <span className="text-yellow-600">⚠️</span>}
                        {stats.status === 'good' && <span className="text-green-600">✅</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Navigation
  const Navigation = () => (
    <nav className="bg-white border-b border-gray-200 p-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🎖️ מערכת נוכחות מכינה קדם צבאית</h1>
        <div className="flex space-x-4 space-x-reverse">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded ${
              currentView === 'dashboard' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            לוח בקרה
          </button>
          <button
            onClick={() => setCurrentView('attendance')}
            className={`px-4 py-2 rounded ${
              currentView === 'attendance' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            רישום נוכחות
          </button>
          <button
            onClick={() => setCurrentView('absences')}
            className={`px-4 py-2 rounded ${
              currentView === 'absences' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            דיווח היעדות
          </button>
          <button
            onClick={() => setCurrentView('students')}
            className={`px-4 py-2 rounded ${
              currentView === 'students' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            חניכים
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'attendance' && <TakeAttendance />}
        {currentView === 'absences' && <AbsenceReporting />}
        {currentView === 'students' && <StudentsOverview />}
      </div>
    </div>
  );
};

export default AttendanceApp;
