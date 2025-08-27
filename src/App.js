import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Search } from 'lucide-react';

const AttendanceApp = () => {
  // Configuration
  const SHEET_ID = '1zvdysWI4pZ_yh_uUCh7fFx17CQTU23pHYOIfAlx0SAI';
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=`;
  
  // Student data - 74 students total
  const allStudentsData = [
    // שנה א - 52 תלמידים עם חלוקה לקבוצות וחדרים
    { id: 1, name: "אבישי לוי", year: "א", group: "פולובין-הרב שובי", room: "וילה 1 פנימי" },
    { id: 2, name: "אברהם משה קמלמן", year: "א", group: "פולובין-הרב שובי", room: "וילה 4 שמאל" },
    { id: 3, name: "אברהם צ'רקה", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 3" },
    { id: 4, name: "אורי ליכט", year: "א", group: "בועז-הרב אילעאי", room: "וילה 4 ימין" },
    { id: 5, name: "אורי סעדה", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 4" },
    { id: 6, name: "אורי עמישב", year: "א", group: "פולובין-הרב שובי", room: "וילה 4 ימין" },
    { id: 7, name: "אורי צור", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 1" },
    { id: 8, name: "אוריאל טויזר", year: "א", group: "פולובין-הרב שובי", room: "וילה 2 פנימי" },
    { id: 9, name: "אוריה דאבוש", year: "א", group: "פולובין-הרב שובי", room: "וילה 1 חיצוני" },
    { id: 10, name: "איתמר כהן", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 2" },
    { id: 11, name: "איתן מילר", year: "א", group: "פולובין-הרב שובי", room: "וילה 3 חיצוני" },
    { id: 12, name: "איתן ויצטום", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 1" },
    { id: 13, name: "איתי ירוסלביץ'", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 4" },
    { id: 14, name: "אלון גרוס", year: "א", group: "פולובין-הרב שובי", room: "וילה 2 חיצוני" },
    { id: 15, name: "אלעזר פרינר", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 2" },
    { id: 16, name: "אמיר דויטש", year: "א", group: "פולובין-הרב שובי", room: "וילה 1 פנימי" },
    { id: 17, name: "אסיף גלבוע", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 3" },
    { id: 18, name: "ארז רונן", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 4" },
    { id: 19, name: "ארז סלומון", year: "א", group: "פולובין-הרב שובי", room: "וילה 3 פנימי" },
    { id: 20, name: "באריי רוזנק", year: "א", group: "פולובין-הרב שובי", room: "וילה 4 שמאל" },
    { id: 21, name: "דביר לוסטיג", year: "א", group: "פולובין-הרב שובי", room: "וילה 2 פנימי" },
    { id: 22, name: "דוד דור", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 1" },
    { id: 23, name: "יאיר עזרן", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 2" },
    { id: 24, name: "יאיר פישר", year: "א", group: "פולובין-הרב שובי", room: "וילה 3 חיצוני" },
    { id: 25, name: "יובל גרייבר", year: "א", group: "פולובין-הרב שובי", room: "וילה 1 חיצוני" },
    { id: 26, name: "יוגב לוי", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 3" },
    { id: 27, name: "יואב כץ", year: "א", group: "פולובין-הרב שובי", room: "וילה 2 חיצוני" },
    { id: 28, name: "יואב צוברי", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 1" },
    { id: 29, name: "יואב שגיב", year: "א", group: "פולובין-הרב שובי", room: "וילה 3 פנימי" },
    { id: 30, name: "יהודה סינואני", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 4" },
    { id: 31, name: "יפתח אטינגר", year: "א", group: "פולובין-הרב שובי", room: "וילה 1 פנימי" },
    { id: 32, name: "ינון מכמן", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 2" },
    { id: 33, name: "לביא בן יעקב", year: "א", group: "פולובין-הרב שובי", room: "וילה 4 שמאל" },
    { id: 34, name: "מתן ויטלזון", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 3" },
    { id: 35, name: "משה בקריצקי", year: "א", group: "פולובין-הרב שובי", room: "וילה 1 חיצוני" },
    { id: 36, name: "נבו ענאקי", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 4" },
    { id: 37, name: "נועם אבן חן", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 1" },
    { id: 38, name: "נועם דהן", year: "א", group: "פולובין-הרב שובי", room: "וילה 2 פנימי" },
    { id: 39, name: "נתנאל האופט", year: "א", group: "פולובין-הרב שובי", room: "וילה 3 חיצוני" },
    { id: 40, name: "נתנאל נשר", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 2" },
    { id: 41, name: "עדי זילברברג בנט", year: "א", group: "פולובין-הרב שובי", room: "וילה 2 חיצוני" },
    { id: 42, name: "עומר אלגביש", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 3" },
    { id: 43, name: "עופר מלץ", year: "א", group: "פולובין-הרב שובי", room: "וילה 3 פנימי" },
    { id: 44, name: "עילי אליהו", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 4" },
    { id: 45, name: "עמית אלסטר", year: "א", group: "פולובין-הרב שובי", room: "וילה 4 שמאל" },
    { id: 46, name: "רגב אלקייס", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 1" },
    { id: 47, name: "רעי פרידמן", year: "א", group: "פולובין-הרב שובי", room: "וילה 1 חיצוני" },
    { id: 48, name: "רעם אופנהיימר", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 2" },
    { id: 49, name: "רותם שריאל", year: "א", group: "פולובין-הרב שובי", room: "וילה 3 חיצוני" },
    { id: 50, name: "שחר ארנרייך", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 3" },
    { id: 51, name: "שילה הורביץ", year: "א", group: "פולובין-הרב שובי", room: "וילה 2 פנימי" },
    { id: 52, name: "חיים שמאי", year: "א", group: "בועז-הרב אילעאי", room: "הדסה 4" },
    
    // שנה ב - 22 תלמידים
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
    { id: 65, name: "יהונתן קלייס", year: "ב", group: null, room: null },
    { id: 66, name: "יובל לובוצקי", year: "ב", group: null, room: null },
    { id: 67, name: "מאור סטנלי", year: "ב", group: null, room: null },
    { id: 68, name: "מעיין טרייסטר", year: "ב", group: null, room: null },
    { id: 69, name: "נועם גז", year: "ב", group: null, room: null },
    { id: 70, name: "נועם מוגיל", year: "ב", group: null, room: null },
    { id: 71, name: "שגיא משה ליבובסקי", year: "ב", group: null, room: null },
    { id: 72, name: "שטרק עמית", year: "ב", group: null, room: null },
    { id: 73, name: "שמואל דהן", year: "ב", group: null, room: null },
    { id: 74, name: "שניר ינובר", year: "ב", group: null, room: null }
  ];

  // Configuration
  const timeSlots = ['07:30', '09:00', '12:15', '15:30', '16:45', '17:45', '20:00'];
  const approvalOptions = ['הרב איתמר', 'הרב אילעאי', 'בועז', 'הרב שובי', 'עמית', 'הרב יונדב', 'אסף', 'יהודה'];

  // State
  const [students] = useState(allStudentsData);
  const [currentYear, setCurrentYear] = useState("א");
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(timeSlots[0]);
  const [selectedGroup, setSelectedGroup] = useState('כולם');
  const [recorder, setRecorder] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());
  const [absences, setAbsences] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceStats, setAttendanceStats] = useState({});

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Load real attendance data and update stats
      const attendanceData = await loadAttendanceData();
      
      // Calculate stats for all students
      const newStats = {};
      for (const student of students) {
        newStats[student.id] = await calculateRealAttendanceStats(student.id);
      }
      setAttendanceStats(newStats);
      
      setLastSync(new Date());
      alert('הנתונים נרענו בהצלחה מגיליון Google Sheets!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('שגיאה בטעינת נתונים מהגיליון. בודק חיבור לאינטרנט.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data on component mount
  useEffect(() => {
    refreshData();
  }, []);

  // Helper functions
  const getCurrentYearStudents = () => students.filter(s => s.year === currentYear);
  
  const getGroupOptions = () => {
    if (currentYear === "א") {
      return [
        { value: 'כולם', label: 'כל שנה א' },
        { value: 'בועז-הרב אילעאי', label: 'בועז-הרב אילעאי' },
        { value: 'פולובין-הרב שובי', label: 'פולובין-הרב שובי' }
      ];
    } else {
      return [{ value: 'כולם', label: 'כל שנה ב' }];
    }
  };

  // Google Sheets integration functions
  const sendToSheet = async (sheetName, data, action = 'write') => {
    try {
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbz0l6_ggK802nEXaSM8Xs90SDV6KUPa6AParwkcZ4--niNo3BEH-5l1De-YgUIq3e8_cw/exec';
      const payload = { action: action, sheetName: sheetName, data: data };
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error sending to sheet:', error);
      return false;
    }
  };

  const fetchFromSheet = async (sheetName) => {
    try {
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbz0l6_ggK802nEXaSM8Xs90SDV6KUPa6AParwkcZ4--niNo3BEH-5l1De-YgUIq3e8_cw/exec';
      const payload = { action: 'read', sheetName: sheetName };
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      return result.success ? (result.data || []) : [];
    } catch (error) {
      console.error(`Error fetching from sheet ${sheetName}:`, error);
      return [];
    }
  };

  // Load attendance data and calculate real stats
  const loadAttendanceData = async () => {
    setIsLoading(true);
    try {
      const attendanceData = await fetchFromSheet('נוכחות');
      if (attendanceData.length > 0) {
        // Process attendance data from sheets
        const processedAttendance = attendanceData.map(row => ({
          studentId: parseInt(row['ID תלמיד']) || 0,
          present: row['נוכחות'] === 'נוכח',
          date: row['תאריך'] || '',
          timeSlot: row['שעה'] || '',
          year: row['שנה'] || 'א'
        }));
        return processedAttendance;
      }
      return [];
    } catch (error) {
      console.error('Error loading attendance data:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate real attendance stats from Google Sheets data
  const calculateRealAttendanceStats = async (studentId) => {
    const attendanceRecords = await loadAttendanceData();
    const studentRecords = attendanceRecords.filter(record => record.studentId === studentId);
    
    if (studentRecords.length === 0) {
      return {
        percentage: 0,
        presentCount: 0,
        expectedLessons: 0,
        status: 'good'
      };
    }

    const presentCount = studentRecords.filter(record => record.present).length;
    const totalLessons = studentRecords.length;
    const percentage = totalLessons > 0 ? Math.round((presentCount / totalLessons) * 100) : 0;
    
    let status = 'good';
    if (percentage < 80) status = 'critical';
    else if (percentage < 90) status = 'warning';
    
    return {
      percentage,
      presentCount,
      expectedLessons: totalLessons,
      status
    };
  };

  // Effects
  useEffect(() => {
    setSelectedGroup('כולם');
  }, [currentYear]);

  // Components
  const Logo = () => (
    <svg className="h-12 w-12" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M75 15 Q85 25 85 45 Q85 65 80 75 Q75 85 70 85 Q65 85 70 75 Q75 65 75 45 Q75 25 75 15" 
            fill="#8B9A6B" opacity="0.8"/>
      <path d="M72 20 Q80 28 80 45 Q80 62 76 72 Q72 82 68 82 Q64 82 68 72 Q72 62 72 45 Q72 28 72 20" 
            fill="#A4B86F"/>
      <path d="M10 60 Q30 55 50 60 Q70 65 90 60 L90 70 Q70 75 50 70 Q30 65 10 70 Z" 
            fill="#A4905C" opacity="0.7"/>
      <path d="M5 65 Q25 62 45 65 Q65 68 85 65 L85 75 Q65 78 45 75 Q25 72 5 75 Z" 
            fill="#9B8654" opacity="0.8"/>
    </svg>
  );

  const DataStatusIndicator = () => (
    <div className="flex items-center space-x-2 space-x-reverse text-sm">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      <span className="text-green-600">מחובר לגיליון</span>
      <span className="text-gray-500 text-xs">
        עדכון אחרון: {lastSync.toLocaleTimeString('he-IL')}
      </span>
      <button
        onClick={refreshData}
        disabled={isLoading}
        className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );

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
        
        <div className="flex items-center space-x-4 space-x-reverse">
          <DataStatusIndicator />
          
          <div className="flex bg-white rounded-lg p-1 border border-amber-200">
            <button
              onClick={() => setCurrentYear("א")}
              className={`px-6 py-2 rounded-md transition-colors ${
                currentYear === "א" 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              שנה א ({students.filter(s => s.year === "א").length})
            </button>
            <button
              onClick={() => setCurrentYear("ב")}
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
      </div>
      
      <div className="flex space-x-4 space-x-reverse">
        {[
          { id: 'dashboard', label: 'לוח בקרה', icon: Database },
          { id: 'attendance', label: 'רישום נוכחות', icon: CheckCircle },
          { id: 'absences', label: 'דיווח היעדרויות', icon: XCircle },
          { id: 'students', label: 'חניכים', icon: Users }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCurrentView(id)}
            className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded ${
              currentView === id 
                ? 'bg-amber-600 text-white' 
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );

  const TakeAttendance = () => {
    const [presentStudents, setPresentStudents] = useState([]);
    const currentYearStudents = getCurrentYearStudents();
    
    const relevantStudents = selectedGroup === 'כולם' ? 
      currentYearStudents : 
      currentYearStudents.filter(s => s.group === selectedGroup);

    const handleStudentToggle = (studentId) => {
      setPresentStudents(prev => 
        prev.includes(studentId) 
          ? prev.filter(id => id !== studentId)
          : [...prev, studentId]
      );
    };

    const handleSubmit = async () => {
      if (!recorder) {
        alert('אנא בחר רושם');
        return;
      }
      
      setIsLoading(true);
      
      // Prepare data for Google Sheets
      const sheetData = relevantStudents
        .filter(student => !isStudentAbsent(student.id))
        .map(student => [
          selectedDate,
          selectedTimeSlot,
          student.id,
          student.name,
          student.year,
          student.group || 'כולם',
          presentStudents.includes(student.id) ? 'נוכח' : 'לא נוכח',
          recorder,
          new Date().toLocaleString('he-IL')
        ]);

      try {
        const success = await sendToSheet('נוכחות', sheetData);
        if (success) {
          setLastSync(new Date());
          alert(`נוכחות נרשמה בהצלחה בגיליון Google Sheets!\n${presentStudents.length} מתוך ${relevantStudents.length} חניכים נוכחים`);
          
          // Refresh attendance stats after submitting
          await refreshData();
        } else {
          alert('הנוכחות נרשמה מקומית, אך לא הצליח לחבר לגיליון. בדוק חיבור לאינטרנט.');
        }
      } catch (error) {
        console.error('Error submitting attendance:', error);
        alert('שגיאה ברישום נוכחות. נסה שוב.');
      } finally {
        setPresentStudents([]);
        setRecorder('');
        setIsLoading(false);
      }
    };

    return (
      <div className="space-y-6" dir="rtl">
        <div className="bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-2xl font-bold text-amber-800 mb-2">
            רישום נוכחות - שנה {currentYear}
          </h2>
          <p className="text-amber-700">
            {currentYear === "א" ? "מחזור ט - שנה ראשונה • עם חלוקה לקבוצות" : "מחזור ח - שנה שנייה"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תאריך</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שעה</label>
              <select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
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
                className="w-full p-2 border border-gray-300 rounded"
              >
                {getGroupOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">רושם</label>
              <select
                value={recorder}
                onChange={(e) => setRecorder(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
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
              <h3 className="font-medium">חניכים ({relevantStudents.length})</h3>
              <div className="text-sm text-gray-600">
                נבחרו: {presentStudents.length} / {relevantStudents.length}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto border border-gray-200 rounded p-4">
              {relevantStudents.map(student => (
                <label key={student.id} className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={presentStudents.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{student.name}</span>
                    {student.group && (
                      <span className={`mr-2 px-2 py-1 rounded text-xs ${
                        student.group === 'בועז-הרב אילעאי' ? 'bg-blue-100 text-blue-800' : 
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {student.group}
                      </span>
                    )}
                    {student.room && (
                      <div className="text-xs text-gray-500">{student.room}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setPresentStudents(relevantStudents.map(s => s.id))}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              בחר הכל
            </button>
            <button
              onClick={() => setPresentStudents([])}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              נקה הכל
            </button>
            <button
              onClick={handleSubmit}
              disabled={!recorder || isLoading}
              className="px-6 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-gray-300"
            >
              {isLoading ? 'שולח...' : 'שלח נוכחות'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    const currentYearStudents = getCurrentYearStudents();
    const groupBoazStudents = currentYearStudents.filter(s => s.group === 'בועז-הרב אילעאי');
    const groupPolovinStudents = currentYearStudents.filter(s => s.group === 'פולובין-הרב שובי');

    return (
      <div className="space-y-6" dir="rtl">
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
                <p className="text-2xl font-bold text-green-900">0%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">שיעורים היום</p>
                <p className="text-2xl font-bold text-yellow-900">0</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">נוכחות נמוכה</p>
                <p className="text-2xl font-bold text-red-900">0</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {currentYear === "א" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-700">בועז-הרב אילעאי</p>
                <p className="text-2xl font-bold text-blue-900">{groupBoazStudents.length}</p>
                <p className="text-xs text-blue-600">חניכים</p>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-center">
                <p className="text-sm font-medium text-purple-700">פולובין-הרב שובי</p>
                <p className="text-2xl font-bold text-purple-900">{groupPolovinStudents.length}</p>
                <p className="text-xs text-purple-600">חניכים</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 mb-2 flex items-center space-x-2 space-x-reverse">
            <Database className="h-5 w-5" />
            <span>גיליון Google Sheets</span>
          </h3>
          <p className="text-amber-700 text-sm mb-2">
            כל הנתונים נשמרים באופן אוטומטי בגיליון Google Sheets עם החלוקה החדשה לקבוצות ולחדרים
          </p>
          <div className="flex space-x-2 space-x-reverse">
            <a 
              href={SHEET_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
            >
              פתח גיליון
            </a>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              רענן נתונים
            </button>
          </div>
        </div>
      </div>
    );
  };

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

    const currentYearStudents = getCurrentYearStudents();

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

      setIsLoading(true);
      
      const newAbsence = {
        id: `absence-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString()
      };

      setAbsences(prev => [...prev, newAbsence]);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('דיווח היעדרות נרשם בהצלחה!');
      
      setFormData({
        studentId: '',
        departureDate: new Date().toISOString().split('T')[0],
        departureTime: '08:00',
        returnDate: new Date().toISOString().split('T')[0],
        returnTime: '17:00',
        purpose: '',
        approvedBy: ''
      });
      setIsLoading(false);
    };

    const getCurrentAbsences = () => {
      const now = new Date();
      return absences.filter(absence => {
        const returnDateTime = new Date(`${absence.returnDate} ${absence.returnTime}`);
        const student = students.find(s => s.id === parseInt(absence.studentId));
        return returnDateTime >= now && student && student.year === currentYear;
      });
    };

    const currentAbsences = getCurrentAbsences();

    return (
      <div className="space-y-6" dir="rtl">
        <div className="bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-2xl font-bold text-amber-800 mb-2">
            דיווח היעדרויות - שנה {currentYear}
          </h2>
          <p className="text-amber-700">
            {currentYear === "א" ? "מחזור ט - שנה ראשונה" : "מחזור ח - שנה שנייה"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-amber-800">דיווח היעדרות חדשה</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">חניך</label>
              <select
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
              >
                <option value="">בחר חניך</option>
                {currentYearStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name}{student.group && ` (${student.group})`}
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
            <p className="text-gray-500 text-center py-4">אין היעדרויות פעילות כרגע בשנה זו</p>
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
                        <h4 className="font-medium">
                          {student?.name}{student?.group && ` (${student.group})`}
                        </h4>
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

  const StudentsOverview = () => {
    const currentYearStudents = getCurrentYearStudents();
    const filteredStudents = currentYearStudents.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.group && student.group.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.room && student.room.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Calculate consistent mock stats based on student ID (so they don't change on refresh)
    const calculateMockAttendanceStats = (studentId) => {
      // Use studentId as seed for consistent "random" values
      const seed = studentId * 12345;
      const pseudoRandom = (seed % 1000) / 1000;
      const percentage = Math.floor(pseudoRandom * 40) + 60; // 60-100%
      
      let status = 'good';
      if (percentage < 80) status = 'critical';
      else if (percentage < 90) status = 'warning';
      
      return {
        percentage: percentage,
        presentCount: Math.floor(percentage * 0.3), // Mock data
        expectedLessons: 30, // Mock data
        status: status
      };
    };

    return (
      <div className="space-y-6" dir="rtl">
        <div className="bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-2xl font-bold text-amber-800 mb-2">
            סקירת חניכים - שנה {currentYear}
          </h2>
          <p className="text-amber-700">
            {currentYear === "א" ? "מחזור ט - שנה ראשונה" : "מחזור ח - שנה שנייה"} 
            • {currentYearStudents.length} חניכים
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-amber-800">טבלת חניכים</h3>
            <div className="flex space-x-2 space-x-reverse">
              <div className="relative">
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

          {/* Warning about mock data */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-800 text-sm">
                <strong>הערה:</strong> אחוזי הנוכחות המוצגים הם נתונים לדוגמה. 
                לנתונים אמיתיים יש צורך לחבר את המערכת לגיליון Google Sheets עם רישומי נוכחות קיימים.
              </span>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
              <p className="text-sm font-medium text-amber-700">סך חניכים</p>
              <p className="text-2xl font-bold text-amber-900">{currentYearStudents.length}</p>
            </div>
            {currentYear === "א" && (
              <>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                  <p className="text-sm font-medium text-blue-700">בועז-הרב אילעאי</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {currentYearStudents.filter(s => s.group === 'בועז-הרב אילעאי').length}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
                  <p className="text-sm font-medium text-purple-700">פולובין-הרב שובי</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {currentYearStudents.filter(s => s.group === 'פולובין-הרב שובי').length}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                  <p className="text-sm font-medium text-gray-700">לא משויכים</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentYearStudents.filter(s => !s.group).length}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-medium">שם</th>
                  {currentYear === "א" && <th className="text-right py-3 px-4 font-medium">קבוצה</th>}
                  {currentYear === "א" && <th className="text-right py-3 px-4 font-medium">חדר</th>}
                  <th className="text-center py-3 px-4 font-medium">אחוז נוכחות</th>
                  <th className="text-center py-3 px-4 font-medium">נוכח/נדרש</th>
                  <th className="text-center py-3 px-4 font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const stats = calculateMockAttendanceStats(student.id);
                  return (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{student.name}</td>
                      {currentYear === "א" && (
                        <td className="py-3 px-4">
                          {student.group ? (
                            <span className={`px-2 py-1 rounded text-xs ${
                              student.group === 'בועז-הרב אילעאי' ? 'bg-blue-100 text-blue-800' : 
                              student.group === 'פולובין-הרב שובי' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {student.group}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">לא משויך</span>
                          )}
                        </td>
                      )}
                      {currentYear === "א" && (
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {student.room || '-'}
                        </td>
                      )}
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

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'לא נמצאו חניכים התואמים לחיפוש' : 'אין חניכים בשנה זו'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 shadow-sm">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4 space-x-reverse">
              <DataStatusIndicator />
              <span className="text-gray-600">
                74 תלמידים טעונים (שנה א: 52 עם קבוצות, שנה ב: 22)
              </span>
              <span className="text-gray-600">
                שנה פעילה: {currentYear}
              </span>
            </div>
            <div className="text-gray-500 text-xs">
              עדכון אחרון: {lastSync.toLocaleString('he-IL')}
            </div>
          </div>
        </div>

        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'attendance' && <TakeAttendance />}
        {currentView === 'absences' && <AbsenceReporting />}
        {currentView === 'students' && <StudentsOverview />}

        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>מערכת נוכחות מכינת רוח השדה • גרסה 2.2 • עם חלוקה לקבוצות וחדרים</p>
          <p className="mt-1">
            כל הנתונים נשמרים אוטומטית ב-Google Sheets • 
            <a href={SHEET_URL} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-800 mx-1">
              פתח גיליון
            </a>
            • מצב מקוון • שנה א מחולקת לקבוצות
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceApp;
