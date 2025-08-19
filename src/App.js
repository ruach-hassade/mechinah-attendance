import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Plus, Search, Filter, Download, Edit, Trash2, UserPlus, RotateCcw } from 'lucide-react';

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

  // Take Attendance Component - Updated for current year and groups
  const TakeAttendance = () => {
    const [presentStudents, setPresentStudents] = useState([]);
    const currentYearStudents = getCurrentYearStudents();

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
      
      await handleAttendanceSubmission(presentStudents);
      setPresentStudents([]);
      setRecorder('');
    };

    // Filter students based on selected group
    const getRelevantStudents = () => {
      if (selectedGroup === 'כולם') {
        return currentYearStudents;
      } else {
        return currentYearStudents.filter(s => s.group === selectedGroup);
      }
    };

    const relevantStudents = getRelevantStudents();
    
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
        {/* Year Header */}
        <div className="bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-2xl font-bold text-amber-800 mb-2">
            רישום נוכחות - שנה {currentYear}
          </h2>
          <p className="text-amber-700">
            {currentYear === "א" ? "מחזור ט - שנה ראשונה" : "מחזור ח - שנה שנייה"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {autoTimeSlot && (
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
                {getGroupOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {currentYear === "א" && (
                <p className="text-xs text-gray-500 mt-1">
                  הקבוצות א"ב ו-ש"פ יהיו זמינות לאחר חלוקת התלמידים
                </p>
              )}
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
                    />
                    <span className="text-sm">{student.name}</span>
                    {student.group && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        student.group === 'א"ב' ? 'bg-blue-100 text-blue-800' : 
                        student.group === 'ש"פ' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.group}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setPresentStudents(studentsInAcademy.map(s => s.id))}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
              disabled={studentsInAcademy.length === 0 || isLoading}
            >
              בחר הכל
            </button>
            <button
              onClick={() => setPresentStudents([])}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
              disabled={isLoading}
            >
              נקה הכל
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-amber-300"
              disabled={studentsInAcademy.length === 0 || isLoading}
            >
              {isLoading ? 'שולח...' : 'שלח נוכחות'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Time slots
  const timeSlots = ['07:30', '09:00', '12:15', '15:30', '16:45', '17:45', '20:00'];
  
  // Real student data from uploaded files - 74 students total
  const allStudentsData = [
    // שנה א - 52 תלמידים (IDs: 1-52)
    { id: 1, name: "נועם אבן חן", year: "א", group: null, room: null },
    { id: 2, name: "ראם אופנהיימר", year: "א", group: null, room: null },
    { id: 3, name: "יפתח אטינגר", year: "א", group: null, room: null },
    { id: 4, name: "עומר אלגביש", year: "א", group: null, room: null },
    { id: 5, name: "עילי אליהו", year: "א", group: null, room: null },
    { id: 6, name: "עמית אלסטר", year: "א", group: null, room: null },
    { id: 7, name: "רגב אלקיים", year: "א", group: null, room: null },
    { id: 8, name: "שחר ארנרייך", year: "א", group: null, room: null },
    { id: 9, name: "לביא בן יעקב", year: "א", group: null, room: null },
    { id: 10, name: "משה בקריצקי", year: "א", group: null, room: null },
    { id: 11, name: "אסיף גלבוע", year: "א", group: null, room: null },
    { id: 12, name: "אלון גרוס", year: "א", group: null, room: null },
    { id: 13, name: "יובל גרייבר", year: "א", group: null, room: null },
    { id: 14, name: "אוריה דאבוש", year: "א", group: null, room: null },
    { id: 15, name: "נועם דהן", year: "א", group: null, room: null },
    { id: 16, name: "אמיר דויטש", year: "א", group: null, room: null },
    { id: 17, name: "דוד דור", year: "א", group: null, room: null },
    { id: 18, name: "נתנאל האופט", year: "א", group: null, room: null },
    { id: 19, name: "שילה הורביץ", year: "א", group: null, room: null },
    { id: 20, name: "מתן ויטלזון", year: "א", group: null, room: null },
    { id: 21, name: "איתן ויצטום", year: "א", group: null, room: null },
    { id: 22, name: "עדי זילברברג בנט", year: "א", group: null, room: null },
    { id: 23, name: "אוריאל טויזר", year: "א", group: null, room: null },
    { id: 24, name: "איתי ירוסלביץ'", year: "א", group: null, room: null },
    { id: 25, name: "איתמר כהן", year: "א", group: null, room: null },
    { id: 26, name: "יואב כץ", year: "א", group: null, room: null },
    { id: 27, name: "אבישי לוי", year: "א", group: null, room: null },
    { id: 28, name: "יוגב לוי", year: "א", group: null, room: null },
    { id: 29, name: "דביר לוסטיג", year: "א", group: null, room: null },
    { id: 30, name: "אורי ליכט", year: "א", group: null, room: null },
    { id: 31, name: "איתן מילר", year: "א", group: null, room: null },
    { id: 32, name: "ינון מכמן", year: "א", group: null, room: null },
    { id: 33, name: "עופר מלץ", year: "א", group: null, room: null },
    { id: 34, name: "נתנאל נשר", year: "א", group: null, room: null },
    { id: 35, name: "יהודה סינואני", year: "א", group: null, room: null },
    { id: 36, name: "ארז סלומון", year: "א", group: null, room: null },
    { id: 37, name: "אורי סעדה", year: "א", group: null, room: null },
    { id: 38, name: "יאיר עזרן", year: "א", group: null, room: null },
    { id: 39, name: "אורי עמישב", year: "א", group: null, room: null },
    { id: 40, name: "נבו ענאקי", year: "א", group: null, room: null },
    { id: 41, name: "יאיר פישר", year: "א", group: null, room: null },
    { id: 42, name: "רעי פרידמן", year: "א", group: null, room: null },
    { id: 43, name: "אלעזר פרינר", year: "א", group: null, room: null },
    { id: 44, name: "אברהם צ'רקה", year: "א", group: null, room: null },
    { id: 45, name: "יואב צוברי", year: "א", group: null, room: null },
    { id: 46, name: "אורי צור", year: "א", group: null, room: null },
    { id: 47, name: "אברהם משה קמלמן", year: "א", group: null, room: null },
    { id: 48, name: "בארי רוזנק", year: "א", group: null, room: null },
    { id: 49, name: "ארז רונן", year: "א", group: null, room: null },
    { id: 50, name: "יואב שגיב", year: "א", group: null, room: null },
    { id: 51, name: "חיים שמאי", year: "א", group: null, room: null },
    { id: 52, name: "רותם שריאל", year: "א", group: null, room: null },
    
    // שנה ב - 22 תלמידים (IDs: 53-74)
    { id: 53, name: "אביתר רשף", year: "ב", group: null, room: null },
    { id: 54, name: "ארד אלמקייס", year: "ב", group: null, room: null },
    { id: 55, name: "אריאל יהודה סויסה", year: "ב", group: null, room: null },
    { id: 56, name: "בועז גרינפלד", year: "ב", group: null, room: null },
    { id: 57, name: "גבריאל ינגרווד", year: "ב", group: null, room: null },
    { id: 58, name: "דביר לנדסמן", year: "ב", group: null, room: null },
    { id: 59, name: "דוד ניקריטין", year: "ב", group: null, room: null },
    { id: 60, name: "דרור ביטון", year: "ב", group: null, room: null },
    { id: 61, name: "זיו רוט", year: "ב", group: null, room: null },
    { id: 62, name: "חגי גוזלן", year: "ב", group: null, room: null },
    { id: 63, name: "חובב גרינוולד", year: "ב", group: null, room: null },
    { id: 64, name: "חרות פלד", year: "ב", group: null, room: null },
    { id: 65, name: "יהונתן קליין", year: "ב", group: null, room: null },
    { id: 66, name: "יובל לובוצקי", year: "ב", group: null, room: null },
    { id: 67, name: "מאור סטנלי", year: "ב", group: null, room: null },
    { id: 68, name: "מעין טרייסטר", year: "ב", group: null, room: null },
    { id: 69, name: "נועם גז", year: "ב", group: null, room: null },
    { id: 70, name: "נועם מוגיל", year: "ב", group: null, room: null },
    { id: 71, name: "שגיא משה ליבובסקי", year: "ב", group: null, room: null },
    { id: 72, name: "שטרק עמית", year: "ב", group: null, room: null },
    { id: 73, name: "שמואל דהן", year: "ב", group: null, room: null },
    { id: 74, name: "שניר ינובר", year: "ב", group: null, room: null }
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

  // State management with new data structure
  const [students, setStudents] = useState(allStudentsData);
  const [currentYear, setCurrentYear] = useState("א"); // Track which year is active
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

  // Get students for current year
  const getCurrentYearStudents = () => students.filter(s => s.year === currentYear);
  
  // Get group options based on current year
  const getGroupOptions = () => {
    if (currentYear === "א") {
      return [
        { value: 'כולם', label: 'כל שנה א' },
        { value: 'א"ב', label: 'קבוצת א"ב' },
        { value: 'ש"פ', label: 'קבוצת ש"פ' }
      ];
    } else {
      return [
        { value: 'כולם', label: 'כל שנה ב' }
      ];
    }
  };

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

  // Reset selected group when changing years to prevent invalid selections
  useEffect(() => {
    setSelectedGroup('כולם');
  }, [currentYear]);

  // Generate schedule for current week - updated for new group structure
  useEffect(() => {
    const generateSchedule = () => {
      const scheduleData = [];
      const today = new Date();
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];
        
        timeSlots.forEach(slot => {
          // Different group options for different years
          const groups = day % 3 === 0 ? 
            ['כולם', 'א"ב', 'ש"פ'] : // שנה א groups
            ['כולם']; // שנה ב or mixed
          
          groups.forEach(group => {
            scheduleData.push({
              id: `${dateStr}-${slot}-${group}`,
              date: dateStr,
              timeSlot: slot,
              group: group,
              description: `${slot} - שיעור ${group}`,
              year: group === 'כולם' ? 'משותף' : 'א' // Identify if lesson is for specific year
            });
          });
        });
      }
      
      setSchedule(scheduleData);
    };
    
    generateSchedule();
  }, []);

  // Initialize students data in Google Sheets on first load
  useEffect(() => {
    const initializeStudentsSheet = async () => {
      try {
        // Send header row first
        const headerData = [[
          'ID',
          'שם',
          'שנה',
          'קבוצה',
          'חדר',
          'תאריך עדכון'
        ]];
        
        // Send all students data
        const studentsData = allStudentsData.map(student => [
          student.id,
          student.name,
          student.year,
          student.group || '',
          student.room || '',
          new Date().toLocaleString('he-IL')
        ]);

        // Combine header and data
        const fullData = [...headerData, ...studentsData];
        
        await sendToSheet('חניכים', fullData);
        console.log('Students data initialized in Google Sheets');
      } catch (error) {
        console.error('Error initializing students sheet:', error);
      }
    };

    // Only initialize once when component mounts
    initializeStudentsSheet();
  }, []); // Empty dependency array means this runs once on mount

  // Initialize attendance and absence sheet headers
  useEffect(() => {
    const initializeSheetHeaders = async () => {
      try {
        // Initialize attendance sheet header
        const attendanceHeader = [[
          'תאריך',
          'שעה',
          'ID תלמיד',
          'שם תלמיד',
          'שנה',
          'קבוצה',
          'נוכחות',
          'רושם',
          'זמן רישום'
        ]];
        
        // Initialize absence sheet header  
        const absenceHeader = [[
          'ID תלמיד',
          'שם תלמיד',
          'שנה',
          'קבוצה',
          'תאריך יציאה',
          'שעת יציאה',
          'תאריך חזרה',
          'שעת חזרה',
          'מטרה',
          'מאושר על ידי',
          'זמן יצירה'
        ]];

        // Send headers (will be overwritten when data is sent, but good for structure)
        await sendToSheet('נוכחות', attendanceHeader);
        await sendToSheet('היעדרויות', absenceHeader);
        
        console.log('Sheet headers initialized');
      } catch (error) {
        console.error('Error initializing sheet headers:', error);
      }
    };

    // Initialize headers once
    initializeSheetHeaders();
  }, []);

  // Handle students management - updated for year structure
  const handleStudentUpdate = async (updatedStudents) => {
    setStudents(updatedStudents);
    
    setIsLoading(true);
    try {
      const sheetData = updatedStudents.map(student => [
        student.id,
        student.name,
        student.year,
        student.group || '',
        student.room || ''
      ]);

      const success = await sendToSheet('חניכים', sheetData);
      if (success) {
        alert('רשימת החניכים עודכנה בהצלחה!');
      } else {
        alert('הנתונים נשמרו מקומית, אך לא הצליח לחבר לגיליון. נסה שוב.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('הנתונים נשמרו מקומית, אך לא הצליח לחבר לגיליון.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if student is currently absent from academy - updated for new structure
  const isStudentAbsent = (studentId, date, timeSlot) => {
    const currentDateTime = new Date(`${date} ${timeSlot}`);
    
    return absences.some(absence => {
      const departureDateTime = new Date(`${absence.departureDate} ${absence.departureTime}`);
      const returnDateTime = new Date(`${absence.returnDate} ${absence.returnTime}`);
      
      return parseInt(absence.studentId) === studentId && 
             currentDateTime >= departureDateTime && 
             currentDateTime <= returnDateTime;
    });
  };

  // Calculate attendance statistics - updated for new structure
  const calculateAttendanceStats = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { percentage: 0, presentCount: 0, expectedLessons: 0, totalLessons: 0, status: 'good' };
    
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    
    // Get only lessons that actually happened (have attendance records) and are relevant to this student
    const actualLessons = attendance
      .map(a => a.scheduleId)
      .filter((scheduleId, index, arr) => arr.indexOf(scheduleId) === index) // Remove duplicates
      .map(scheduleId => schedule.find(s => s.id === scheduleId))
      .filter(lesson => lesson && (
        lesson.group === 'כולם' || // All students lessons
        (lesson.group === student.group) || // Student's specific group
        (lesson.year === 'משותף') // Mixed year lessons
      ));
    
    // Filter out lessons where student was legitimately absent
    const relevantLessons = actualLessons.filter(lesson => 
      !isStudentAbsent(studentId, lesson.date, lesson.timeSlot)
    );
    
    const presentCount = studentAttendance.filter(a => a.present).length;
    const percentage = relevantLessons.length > 0 ? Math.round((presentCount / relevantLessons.length) * 100) : 0;
    
    return {
      percentage,
      presentCount,
      expectedLessons: relevantLessons.length,
      totalLessons: actualLessons.length,
      status: percentage < 80 ? 'critical' : percentage < 90 ? 'warning' : 'good'
    };
  };

  // Handle attendance submission - updated for new group structure
  const handleAttendanceSubmission = async (presentStudents) => {
    const currentYearStudents = getCurrentYearStudents();
    
    // Find or create schedule slot for the current year context
    let scheduleSlot = schedule.find(s => 
      s.date === selectedDate && 
      s.timeSlot === selectedTimeSlot && 
      s.group === selectedGroup
    );
    
    // If no existing schedule slot, create one
    if (!scheduleSlot) {
      scheduleSlot = {
        id: `${selectedDate}-${selectedTimeSlot}-${selectedGroup}`,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        group: selectedGroup,
        description: `${selectedTimeSlot} - שיעור ${selectedGroup}`,
        year: currentYear
      };
      setSchedule(prev => [...prev, scheduleSlot]);
    }

    // Check if attendance already recorded for this exact combination
    const isDuplicate = attendance.some(a => 
      a.date === selectedDate && 
      a.timeSlot === selectedTimeSlot && 
      a.scheduleId === scheduleSlot.id
    );

    if (isDuplicate) {
      alert('נוכחות כבר נרשמה עבור שעה זו!');
      return;
    }

    // Get relevant students based on selection
    const relevantStudents = selectedGroup === 'כולם' ? 
      currentYearStudents : 
      currentYearStudents.filter(s => s.group === selectedGroup);

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
      timeSlot: selectedTimeSlot,
      year: currentYear,
      group: selectedGroup
    }));

    setAttendance(prev => [
      ...prev.filter(a => !newAttendanceRecords.some(n => n.scheduleId === a.scheduleId)),
      ...newAttendanceRecords
    ]);

    setIsLoading(true);
    try {
      // Enhanced sheet data with new structure
      const sheetData = newAttendanceRecords.map(record => [
        record.date,
        record.timeSlot,
        record.studentId,
        students.find(s => s.id === record.studentId)?.name || '',
        record.year,
        record.group,
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

  // Handle absence submission - updated with enhanced data
  const handleAbsenceSubmission = async (formData) => {
    const student = students.find(s => s.id === parseInt(formData.studentId));
    
    const newAbsence = {
      id: `absence-${Date.now()}`,
      ...formData,
      studentName: student?.name || '',
      studentYear: student?.year || '',
      studentGroup: student?.group || '',
      createdAt: new Date().toISOString()
    };

    setAbsences(prev => [...prev, newAbsence]);

    setIsLoading(true);
    try {
      // Enhanced sheet data with student info
      const sheetData = [[
        formData.studentId,
        newAbsence.studentName,
        newAbsence.studentYear,
        newAbsence.studentGroup,
        formData.departureDate,
        formData.departureTime,
        formData.returnDate,
        formData.returnTime,
        formData.purpose,
        formData.approvedBy,
        new Date(newAbsence.createdAt).toLocaleString('he-IL')
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

  // Filter students based on search - updated for current year
  const filteredStudents = students.filter(student =>
    student.year === currentYear && (
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.group && student.group.toLowerCase().includes(searchTerm.toLowerCase()))
    )
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

  // Navigation Component - Updated with year tabs
  const Navigation = () => (
    <nav className="bg-gradient-to-r from-amber-100 to-green-100 border-b border-amber-200 p-4" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Logo />
          <div>
            <h1 className="text-xl font-bold text-amber-800">רוח השדה</h1>
            <p className="text-sm text-amber-700">מכינה קדם צבאית דתית לבנים</p>
          </div>
        </div>
        
        {/* Year Selection Tabs */}
        <div className="flex bg-white rounded-lg p-1 border border-amber-200">
          <button
            onClick={() => {
              setCurrentYear("א");
              setSelectedGroup('כולם');
            }}
            className={`px-6 py-2 rounded-md transition-colors ${
              currentYear === "א" 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            שנה א ({students.filter(s => s.year === "א").length})
          </button>
          <button
            onClick={() => {
              setCurrentYear("ב");
              setSelectedGroup('כולם');
            }}
            className={`px-6 py-2 rounded-md transition-colors ${
              currentYear === "ב" 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            שנה ב ({students.filter(s => s.year === "ב").length})
          </button>
        </div>
      </div>
      
      {/* Page Navigation */}
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
          דיווח היעדרויות
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
        <button
          onClick={() => setCurrentView('manage-students')}
          className={`px-4 py-2 rounded ${
            currentView === 'manage-students' 
              ? 'bg-amber-600 text-white' 
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          ניהול חניכים
        </button>
      </div>
    </nav>
  );

  // Dashboard Component - Updated for current year
  const Dashboard = () => {
    const currentYearStudents = getCurrentYearStudents();
    const todayAttendance = attendance.filter(a => a.date === selectedDate && 
      currentYearStudents.some(s => s.id === a.studentId));
    const todaySchedule = schedule.filter(s => s.date === selectedDate);
    const overallAttendanceRate = todayAttendance.length > 0 ? 
      Math.round((todayAttendance.filter(a => a.present).length / todayAttendance.length) * 100) : 0;

    const lowAttendanceStudents = currentYearStudents.filter(student => {
      const stats = calculateAttendanceStats(student.id);
      return stats.status === 'critical' || stats.status === 'warning';
    });

    // Group statistics for שנה א
    const groupAStudents = currentYearStudents.filter(s => s.group === 'א"ב');
    const groupBStudents = currentYearStudents.filter(s => s.group === 'ש"פ');

    return (
      <div className="space-y-6" dir="rtl">
        {/* Year Header */}
        <div className="bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-2xl font-bold text-amber-800 mb-2">
            שנה {currentYear} - לוח בקרה
          </h2>
          <p className="text-amber-700">
            {currentYear === "א" ? "מחזור ט - שנה ראשונה" : "מחזור ח - שנה שנייה"} 
            • {currentYearStudents.length} חניכים
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">חניכים בשנה</p>
                <p className="text-2xl font-bold text-amber-900">{currentYearStudents.length}</p>
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

        {/* Group breakdown for שנה א */}
        {currentYear === "א" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-700">קבוצת א"ב</p>
                <p className="text-2xl font-bold text-blue-900">{groupAStudents.length}</p>
                <p className="text-xs text-blue-600">חניכים</p>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-center">
                <p className="text-sm font-medium text-purple-700">קבוצת ש"פ</p>
                <p className="text-2xl font-bold text-purple-900">{groupBStudents.length}</p>
                <p className="text-xs text-purple-600">חניכים</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 mb-2">🔗 גיליון Google Sheets</h3>
          <p className="text-amber-700 text-sm mb-2">
            כל הנתונים נשמרים באופן אוטומטי בגיליון Google Sheets עם המבנה החדש:
          </p>
          <div className="text-amber-600 text-xs mb-3">
            • גיליון "חניכים": ID, שם, שנה, קבוצה, חדר<br/>
            • גיליון "נוכחות": תאריך, שעה, תלמיד, שנה, קבוצה, נוכחות<br/>
            • גיליון "היעדרויות": תלמיד, שנה, קבוצה, תאריכים, מטרה
          </div>
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
                    <span className="font-medium">
                      {student.name}
                      {student.group && ` (${student.group})`}
                    </span>
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
                      lesson.group === 'א"ב' ? 'bg-blue-100 text-blue-800' : 
                      lesson.group === 'ש"פ' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        {/* System Status Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 shadow-sm">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                מערכת פעילה
              </span>
              <span className="text-gray-600">
                74 תלמידים טעונים (שנה א: 52, שנה ב: 22)
              </span>
              <span className="text-gray-600">
                שנה פעילה: {currentYear}
              </span>
            </div>
            <div className="text-gray-500 text-xs">
              עדכון אחרון: {new Date().toLocaleString('he-IL')}
            </div>
          </div>
        </div>

        {/* Main Content */}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'attendance' && <TakeAttendance />}

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>מערכת נוכחות מכינת רוח השדה • גרסה 2.0 • עם תמיכה מלאה בשנה א ושנה ב</p>
          <p className="mt-1">
            כל הנתונים נשמרים אוטומטית ב-Google Sheets • 
            <a href={SHEET_URL} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-800 mx-1">
              פתח גיליון
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceApp;
