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
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const timeSlotMinutes = timeSlots.map(slot => {
      const [hours, minutes] = slot.split(':').map(Number);
      return hours * 60 + minutes;
    });
    
    let selectedSlot = timeSlots[0];
    
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
  const [absences, setAbsences] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(getCurrentTimeSlot());
  const [selectedGroup, setSelectedGroup] = useState('כולם');
  const [recorder, setRecorder] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoTimeSlot, setAutoTimeSlot] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Staff and approval options
  const approvalOptions = ['הרב איתמר', 'הרב אילעאי', 'בועז', 'הרב שובי', 'עמית', 'הרב יונדב', 'אסף', 'יהודה'];

  // Auto-update time slot every minute
  useEffect(() => {
    if (autoTimeSlot) {
      const interval = setInterval(() => {
        setSelectedTimeSlot(getCurrentTimeSlot());
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [autoTimeSlot]);

  // Generate schedule for current week
  useEffect(() => {
    const generateSchedule = () => {
      const scheduleData = [];
      const today = new Date();
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];
        
        timeSlots.forEach(slot => {
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

  // Calculate attendance statistics
  const calculateAttendanceStats = (studentId) => {
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    const expectedLessons = schedule.filter(s => 
      s.group === 'כולם' || s.group === students.find(st => st.id === studentId)?.group
    );
    
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

  // Handle attendance submission
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

    setAttendance(prev => [
      ...prev.filter(a => !newAttendanceRecords.some(n => n.id === a.id)),
      ...newAttendanceRecords
    ]);

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

  // Handle absence submission
  const handleAbsenceSubmission = async (formData) => {
    const newAbsence = {
      id: `absence-${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString()
    };

    setAbsences(prev => [...prev, newAbsence]);

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

      const success = await sendToSheet('היעדרויות', sheetData);
      if (success) {
        alert('דיווח היעדרות נרשם בהצלחה וחובר לגיליון!');
      } else {
        alert('דיווח היעדרות נרשם מקומית, אך לא הצליח לחבר לגיליון. נסה שוב.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('דיווח היעדרות נרשם מקומית, אך לא הצליח לחבר לגיליון.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Logo SVG component
  const Logo = () => (
    <svg className="h-12 w-12" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Cypress tree */}
      <path d="M75 15 Q85 25 85 45 Q85 65 80 75 Q75 85 70 85 Q65 85 70 75 Q75 65 75 45 Q75 25 75 15" 
            fill="#8B9A6B" opacity="0.8"/>
      <path d="M72 20 Q80 28 80 45 Q80 62 76 72 Q72 82 68 82 Q64 82 68 72 Q72 62 72 45 Q72 28 72 20" 
            fill="#A4B86F"/>
      
      {/* Fields/waves */}
      <path d="M10 60 Q30 55 50 60 Q70 65 90 60 L90 70 Q70 75 50 70 Q30 65 10 70 Z" 
            fill="#A4905C" opacity="0.7"/>
      <path d="M5 65 Q25 62 45 65 Q65 68 85 65 L85 75 Q65 78 45 75 Q25 72 5 75 Z" 
            fill="#9B8654" opacity="0.8"/>
      <path d="M15 70 Q35 68 55 70 Q75 72 95 70 L95 80 Q75 82 55 80 Q35 78 15 80 Z" 
            fill="#8B7A4A"/>
      <path d="M10 75 Q30 73 50 75 Q70 77 90 75 L90 85 Q70 87 50 85 Q30 83 10 85 Z" 
            fill="#7A6B3F"/>
    </svg>
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
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">סך חניכים</p>
                <p className="text-2xl font-bold text-amber-900">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">נוכחות היום</p>
                <p className="text-2xl font-bold text-green-900">{overallAttendanceRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">שיעורים היום</p>
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

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 mb-2">🔗 גיליון Google Sheets</h3>
          <p className="text-amber-700 text-sm mb-2">
            כל הנתונים נשמרים באופן אוטומטי בגיליון Google Sheets
          </p>
          <a 
            href={SHEET_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaySchedule.map(lesson => {
              const lessonAttendance = todayAttendance.filter(a => a.scheduleId === lesson.id);
              const attendanceRate = lessonAttendance.length > 0 ? 
                Math.round((lessonAttendance.filter(a => a.present).length / lessonAttendance.length) * 100) : 0;
              
              return (
                <div key={lesson.id} className="border border-gray-200 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm">{lesson.timeSlot}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      lesson.group === 'כולם' ? 'bg-amber-100 text-amber-800' : 
                      lesson.group === 'קבוצה א' ? 'bg-green-100 text-green-800' : 
                      'bg-stone-100 text-stone-800'
                    }`}>
                      {lesson.group}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{lesson.description}</p>
                  {lessonAttendance.length > 0 && (
                    <div className="text-xs text-gray-500">
                      נוכחות: {attendanceRate}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Take Attendance Component
  const TakeAttendance = () => {
    const [presentStudents, setPresentStudents] = useState([]);

    // Check if attendance already exists for this slot
    const attendanceExists = attendance.some(a => 
      a.date === selectedDate && 
      a.timeSlot === selectedTimeSlot && 
      (selectedGroup === 'כולם' || a.scheduleId.includes(selectedGroup))
    );

    const handleStudentToggle = (studentId) => {
      setPresentStudents(prev => 
        prev.includes(studentId) 
          ? prev.filter(id => id !== studentId)
          : [...prev, studentId]
      );
    };

    const handleSubmit = async () => {
      if (!recorder.trim()) {
        alert('אנא בחר רושם');
        return;
      }

      if (attendanceExists) {
        alert('נוכחות כבר נרשמה עבור שעה זו!');
        return;
      }
      
      await handleAttendanceSubmission(presentStudents);
      setPresentStudents([]);
      setRecorder('');
    };

    const relevantStudents = selectedGroup === 'כולם' ? 
      students : 
      students.filter(s => s.group === selectedGroup);

    const studentsInAcademy = relevantStudents.filter(student => 
      !isStudentAbsent(student.id, selectedDate, selectedTimeSlot)
    );

    const studentsCurrentlyOut = relevantStudents.filter(student => 
      isStudentAbsent(student.id, selectedDate, selectedTimeSlot)
    );

    const getCurrentTimeInfo = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('he-IL', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return timeString;
    };

    return (
      <div className="space-y-6" dir="rtl">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-amber-800">רישום נוכחות</h2>
          
          {attendanceExists && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">
                  נוכחות כבר נרשמה עבור שעה זו!
                </span>
              </div>
            </div>
          )}
          
          {autoTimeSlot && !attendanceExists && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-amber-800 font-medium">
                    שעה נבחרה אוטומטית: {selectedTimeSlot}
                  </span>
                  <span className="text-amber-600 text-sm">
                    (השעה הנוכחית: {getCurrentTimeInfo()})
                  </span>
                </div>
                <button
                  onClick={() => setAutoTimeSlot(false)}
                  className="text-amber-600 hover:text-amber-800 text-sm underline"
                >
                  בחירה ידנית
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תאריך</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שעה</label>
              <select
                value={selectedTimeSlot}
                onChange={(e) => {
                  setSelectedTimeSlot(e.target.value);
                  setAutoTimeSlot(false);
                }}
                disabled={autoTimeSlot}
                className={`w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 ${
                  autoTimeSlot ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">קבוצה</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
              >
                <option value="כולם">כל החניכים</option>
                <option value="קבוצה א">קבוצה א</option>
                <option value="קבוצה ב">קבוצה ב</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">רושם</label>
              <select
                value={recorder}
                onChange={(e) => setRecorder(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
              >
                <option value="">בחר רושם</option>
                {approvalOptions.map(person => (
                  <option key={person} value={person}>{person}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">חניכים נוכחים במכינה ({studentsInAcademy.length})</h3>
              <div className="text-sm text-gray-600">
                נבחרו: {presentStudents.length} / {studentsInAcademy.length}
              </div>
            </div>

            {studentsCurrentlyOut.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-3">
                <h4 className="font-medium text-orange-800 mb-2">חניכים שיצאו מהמכינה ({studentsCurrentlyOut.length}):</h4>
                <div className="text-sm text-orange-700">
                  {studentsCurrentlyOut.map(student => student.name).join(', ')}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto border border-gray-200 rounded p-4">
              {studentsInAcademy.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-4">
                  {studentsCurrentlyOut.length > 0 ? 
                    "כל החניכים בקבוצה זו נמצאים בהיעדרות" : 
                    "אין חניכים בקבוצה זו"}
                </div>
              ) : (
                studentsInAcademy.map(student => (
                  <label key={student.id} className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={presentStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                      disabled={attendanceExists}
                    />
                    <span className="text-sm">{student.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      student.group === 'קבוצה א' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-800'
                    }`}>
                      {student.group}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setPresentStudents(studentsInAcademy.map(s => s.id))}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
              disabled={studentsInAcademy.length === 0 || isLoading || attendanceExists}
            >
              בחר הכל
            </button>
            <button
              onClick={() => setPresentStudents([])}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
              disabled={isLoading || attendanceExists}
            >
              נקה הכל
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-amber-300"
              disabled={studentsInAcademy.length === 0 || isLoading || attendanceExists}
            >
              {isLoading ? 'שולח...' : 'שלח נוכחות'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Absence Reporting Component
  const AbsenceReporting = () => {
    const [formData, setFormData] = useState({
      studentId: '',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '08:00',
      returnDate: new Date().toISOString().split('T')[0],
      returnTime: '17:00',
      purpose: '',
      approvedBy: ''
    });

    const handleInputChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleSubmit = async () => {
      if (!formData.studentId || !formData.purpose || !formData.approvedBy) {
        alert('אנא מלא את כל השדות הנדרשים');
        return;
      }

      await handleAbsenceSubmission(formData);
      
      setFormData({
        studentId: '',
        departureDate: new Date().toISOString().split('T')[0],
        departureTime: '08:00',
        returnDate: new Date().toISOString().split('T')[0],
        returnTime: '17:00',
        purpose: '',
        approvedBy: ''
      });
    };

    const getCurrentAbsences = () => {
      const now = new Date();
      return absences.filter(absence => {
        const returnDateTime = new Date(`${absence.returnDate} ${absence.returnTime}`);
        return returnDateTime >= now;
      });
    };

    const currentAbsences = getCurrentAbsences();

    return (
      <div className="space-y-6" dir="rtl">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-amber-800">דיווח היעדרות חדשה</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">חניך</label>
              <select
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
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
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
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
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שעת יציאה</label>
              <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => handleInputChange('departureTime', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תאריך חזרה צפויה</label>
              <input
                type="date"
                value={formData.returnDate}
                onChange={(e) => handleInputChange('returnDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שעת חזרה צפויה</label>
              <input
                type="time"
                value={formData.returnTime}
                onChange={(e) => handleInputChange('returnTime', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
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
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full px-6 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-amber-300"
            disabled={isLoading}
          >
            {isLoading ? 'שולח...' : 'דווח היעדרות'}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-amber-800">היעדרויות פעילות</h3>
          
          {currentAbsences.length === 0 ? (
            <p className="text-gray-500 text-center py-4">אין היעדרויות פעילות כרגע</p>
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
                          {isCurrentlyOut ? 'יצא מהמכינה' : 'היעדרות מתוכננת'}
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
                      <span className="text-amber-600">{absence.approvedBy}</span>
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
            <h2 className="text-xl font-semibold text-amber-800">סקירת חניכים</h2>
            <div className="flex space-x-2 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="חפש חניכים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 pl-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
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
                          student.group === 'קבוצה א' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-800'
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
                            ({stats.totalLessons - stats.expectedLessons} בהיעדרות)
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
    <nav className="bg-gradient-to-r from-amber-100 to-green-100 border-b border-amber-200 p-4" dir="rtl">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Logo />
          <div>
            <h1 className="text-xl font-bold text-amber-800">רוח השדה</h1>
            <p className="text-sm text-amber-700">מכינה קדם צבאית דתית לבנים</p>
          </div>
        </div>
        <div className="flex space-x-4 space-x-reverse">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded ${
              currentView === 'dashboard' 
                ? 'bg-amber-600 text-white' 
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            לוח בקרה
          </button>
          <button
            onClick={() => setCurrentView('attendance')}
            className={`px-4 py-2 rounded ${
              currentView === 'attendance' 
                ? 'bg-amber-600 text-white' 
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            רישום נוכחות
          </button>
          <button
            onClick={() => setCurrentView('absences')}
            className={`px-4 py-2 rounded ${
              currentView === 'absences' 
                ? 'bg-amber-600 text-white' 
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            דיווח היעדרות
          </button>
          <button
            onClick={() => setCurrentView('students')}
            className={`px-4 py-2 rounded ${
              currentView === 'students' 
                ? 'bg-amber-600 text-white' 
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            חניכים
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50">
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
