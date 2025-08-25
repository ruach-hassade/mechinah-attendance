// Data handlers
  const handleStudentUpdate = async (updatedStudents) => {
    setStudents(updatedStudents);
    
    setIsLoading(true);
    try {
      const headers = ['ID', 'שם', 'שנה', 'קבוצה', 'חדר', 'תאריך עדכון'];
      const formattedData = [
        headers,
        ...updatedStudents.map(student => [
          student.id,
          student.name,
          student.year,
          student.group || '',
          student.room || '',
          new Date().toLocaleString('he-IL')
        ])
      ];
      
      await sendToSheet(SHEETS.STUDENTS, [headers], 'clear');
      const success = await sendToSheet(SHEETS.STUDENTS, formattedData);
      
      if (success) {
        setLastSync(new Date());
        alert('רשימת החניכים עודכנה בהצלחה וחוברה לגיליון!');
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

  const handleAttendanceSubmission = async (presentStudents) => {
    const currentYearStudents = getCurrentYearStudents();
    
    let scheduleSlot = schedule.find(s => 
      s.date === selectedDate && 
      s.timeSlot === selectedTimeSlot && 
      s.group === selectedGroup
    );
    
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

    const isDuplicate = attendance.some(a => 
      a.date === selectedDate && 
      a.timeSlot === selectedTimeSlot && 
      a.scheduleId === scheduleSlot.id
    );

    if (isDuplicate) {
      alert('נוכחות כבר נרשמה עבור שעה זו!');
      return;
    }

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

      const success = await sendToSheet(SHEETS.ATTENDANCE, sheetData);
      if (success) {
        setLastSync(new Date());
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

      const success = await sendToSheet(SHEETS.ABSENCES, sheetData);
      if (success) {
        setLastSync(new Date());
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

  // Take Attendance Component
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
      return now.toLocaleTimeString('he-IL', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
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
                  בועז-הרב אילעאי • פולובין-הרב שובי
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
                    <div className="flex-1">
                      <span className="text-sm font-medium">{student.name}</span>
                      {student.group && (
                        <span className={`mr-2 px-2 py-1 rounded text-xs ${
                          student.group === 'בועז-הרב אילעאי' ? 'bg-blue-100 text-blue-800' : 
                          student.group === 'פולובין-הרב שובי' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {student.group}
                        </span>
                      )}
                      {student.room && (
                        <div className="text-xs text-gray-500 mt-1">{student.room}</div>
                      )}
                    </div>
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

  // Students Overview Component
  const StudentsOverview = () => {
    const currentYearStudents = getCurrentYearStudents();
    const filteredStudents = currentYearStudents.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.group && student.group.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.room && student.room.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <div className="space-y-6" dir="rtl">
        <div className="bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-2xl font-bold text-amber-800 mb-2">
            סקירת חניכים - שנה {currentYear}
          </h2>
          <p className="text-amber-700">
            {currentYear === "א" ? "מחזור ט - שנה ראשונה • עם חלוקה לקבוצות וחדרים" : "מחזור ח - שנה שנייה"} 
            • {currentYearStudents.length} חניכים
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-amber-800">טבלת חניכים</h3>
            <div className="flex space-x-2 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="חפש חניכים, קבוצות או חדרים..."
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
                  {currentYear === "א" && (
                    <>
                      <th className="text-right py-3 px-4 font-medium">קבוצה</th>
                      <th className="text-right py-3 px-4 font-medium">חדר</th>
                    </>
                  )}
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
                      {currentYear === "א" && (
                        <>
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
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">{student.room || 'לא נקבע'}</span>
                          </td>
                        </>
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

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'לא נמצאו חניכים התואמים לחיפוש' : 'אין חניכים בשנה זו'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Students Management Component
  const StudentsManagement = () => {
    const [editingStudent, setEditingStudent] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', group: '', room: '' });
    const [newStudent, setNewStudent] = useState({ name: '', group: null, room: null });
    const [showAddForm, setShowAddForm] = useState(false);

    const currentYearStudents = getCurrentYearStudents();

    const handleEditStart = (student) => {
      setEditingStudent(student.id);
      setEditForm({ 
        name: student.name, 
        group: student.group || '', 
        room: student.room || '' 
      });
    };

    const handleEditSave = () => {
      if (!editForm.name.trim()) {
        alert('נא להזין שם חניך');
        return;
      }

      const updatedStudents = students.map(student =>
        student.id === editingStudent
          ? { 
              ...student, 
              name: editForm.name.trim(), 
              group: editForm.group || null,
              room: editForm.room || null
            }
          : student
      );

      handleStudentUpdate(updatedStudents);
      setEditingStudent(null);
      setEditForm({ name: '', group: '', room: '' });
    };

    const handleEditCancel = () => {
      setEditingStudent(null);
      setEditForm({ name: '', group: '', room: '' });
    };

    const handleDelete = (studentId) => {
      if (window.confirm('האם אתה בטוח שברצונך למחוק את החניך?')) {
        const updatedStudents = students.filter(s => s.id !== studentId);
        handleStudentUpdate(updatedStudents);
      }
    };

    const handleAddStudent = () => {
      if (!newStudent.name.trim()) {
        alert('נא להזין שם חניך');
        return;
      }

      const newId = Math.max(...students.map(s => s.id), 0) + 1;
      const updatedStudents = [...students, {
        id: newId,
        name: newStudent.name.trim(),
        year: currentYear,
        group: newStudent.group || null,
        room: newStudent.room || null
      }];

      handleStudentUpdate(updatedStudents);
      setNewStudent({ name: '', group: null, room: null });
      setShowAddForm(false);
    };

    const handleMoveToGroup = (studentId, newGroup) => {
      const updatedStudents = students.map(student =>
        student.id === studentId
          ? { ...student, group: newGroup }
          : student
      );
      handleStudentUpdate(updatedStudents);
    };

    const resetToRealData = () => {
      if (window.confirm('האם אתה בטוח שברצונך לאפס את הרשימה לנתונים המקוריים? כל השינויים יאבדו.')) {
        handleStudentUpdate(allStudentsData);
      }
    };

    const groupBoazStudents = currentYearStudents.filter(s => s.group === 'בועז-הרב אילעאי');
    const groupPolovinStudents = currentYearStudents.filter(s => s.group === 'פולובין-הרב שובי');
    const unassignedStudents = currentYearStudents.filter(s => !s.group);

    const StudentCard = ({ student, borderColor }) => (
      <div className={`bg-white border border-${borderColor}-200 rounded p-3`}>
        {editingStudent === student.id ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full p-2 border border-${borderColor}-300 rounded text-sm`}
              placeholder="שם החניך"
            />
            {currentYear === "א" && (
              <select
                value={editForm.group}
                onChange={(e) => setEditForm(prev => ({ ...prev, group: e.target.value }))}
                className={`w-full p-2 border border-${borderColor}-300 rounded text-sm`}
              >
                <option value="">בחר קבוצה</option>
                <option value="בועז-הרב אילעאי">בועז-הרב אילעאי</option>
                <option value="פולובין-הרב שובי">פולובין-הרב שובי</option>
              </select>
            )}
            <input
              type="text"
              value={editForm.room}
              onChange={(e) => setEditForm(prev => ({ ...prev, room: e.target.value }))}
              className={`w-full p-2 border border-${borderColor}-300 rounded text-sm`}
              placeholder="חדר"
            />
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={handleEditSave}
                className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
                disabled={isLoading}
              >
                שמור
              </button>
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <span className="font-medium text-sm block">{student.name}</span>
              <span className="text-xs text-gray-500">ID: {student.id}</span>
              {student.room && (
                <span className="text-xs text-gray-600 block">חדר: {student.room}</span>
              )}
            </div>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => handleEditStart(student)}
                className="text-blue-600 hover:text-blue-800 text-xs p-1"
                title="ערוך"
              >
                <Edit className="h-3 w-3" />
              </button>
              {currentYear === "א" && (
                <button
                  onClick={() => handleMoveToGroup(student.id, student.group === 'בועז-הרב אילעאי' ? 'פולובין-הרב שובי' : 'בועז-הרב אילעאי')}
                  className="text-orange-600 hover:text-orange-800 text-xs"
                  title={`העבר ל${student.group === 'בועז-הרב אילעאי' ? 'פולובין-הרב שובי' : 'בועז-הרב אילעאי'}`}
                >
                  ↔
                </button>
              )}
              <button
                onClick={() => handleDelete(student.id)}
                className="text-red-600 hover:text-red-800 text-xs p-1"
                title="מחק"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-6" dir="rtl">
        <div className="bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-2xl font-bold text-amber-800 mb-2">
            ניהול חניכים - שנה {currentYear}
          </h2>
          <p className="text-amber-700">
            {currentYear === "א" ? "מחזור ט - שנה ראשונה" : "מחזור ח - שנה שנייה"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-amber-800">ניהול רשימת חניכים</h3>
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1 space-x-reverse"
              >
                <Plus className="h-4 w-4" />
                <span>הוסף חניך</span>
              </button>
              <button
                onClick={resetToRealData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1 space-x-reverse"
              >
                <RotateCcw className="h-4 w-4" />
                <span>אפס לנתונים מקוריים</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="text-center">
                <p className="text-sm font-medium text-amber-700">סך החניכים</p>
                <p className="text-2xl font-bold text-amber-900">{currentYearStudents.length}</p>
              </div>
            </div>
            {currentYear === "א" && (
              <>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-700">בועז-הרב אילעאי</p>
                    <p className="text-2xl font-bold text-blue-900">{groupBoazStudents.length}</p>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-center">
                    <p className="text-sm font-medium text-purple-700">פולובין-הרב שובי</p>
                    <p className="text-2xl font-bold text-purple-900">{groupPolovinStudents.length}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">לא משויכים</p>
                    <p className="text-2xl font-bold text-gray-900">{unassignedStudents.length}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {showAddForm && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-green-800 mb-3">הוספת חניך חדש</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="שם החניך"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                  className="p-2 border border-green-300 rounded focus:ring-2 focus:ring-green-500"
                />
                {currentYear === "א" && (
                  <select
                    value={newStudent.group || ''}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, group: e.target.value || null }))}
                    className="p-2 border border-green-300 rounded focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">בחר קבוצה</option>
                    <option value="בועז-הרב אילעאי">בועז-הרב אילעאי</option>
                    <option value="פולובין-הרב שובי">פולובין-הרב שובי</option>
                  </select>
                )}
                <input
                  type="text"
                  placeholder="חדר (אופציונלי)"
                  value={newStudent.room || ''}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, room: e.target.value || null }))}
                  className="p-2 border border-green-300 rounded focus:ring-2 focus:ring-green-500"
                />
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={handleAddStudent}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={isLoading}
                  >
                    הוסף
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewStudent({ name: '', group: null, room: null });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentYear === "א" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">
                  בועז-הרב אילעאי ({groupBoazStudents.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {groupBoazStudents.map(student => (
                    <StudentCard key={student.id} student={student} borderColor="blue" />
                  ))}
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-3">
                  פולובין-הרב שובי ({groupPolovinStudents.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {groupPolovinStudents.map(student => (
                    <StudentCard key={student.id} student={student} borderColor="purple" />
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">
                  לא משויכים ({unassignedStudents.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {unassignedStudents.map(student => (
                    <StudentCard key={student.id} student={student} borderColor="gray" />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-3">
                חניכי שנה ב ({currentYearStudents.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {currentYearStudents.map(student => (
                  <StudentCard key={student.id} student={student} borderColor="green" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
                import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Plus, Search, Filter, Download, Edit, Trash2, UserPlus, RotateCcw, RefreshCw, Database } from 'lucide-react';

const AttendanceApp = () => {
  // Google Sheets configuration
  const SHEET_ID = '1zvdysWI4pZ_yh_uUCh7fFx17CQTU23pHYOIfAlx0SAI';
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=`;
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbz0l6_ggK802nEXaSM8Xs90SDV6KUPa6AParwkcZ4--niNo3BEH-5l1De-YgUIq3e8_cw/exec';
  
  // Sheet names
  const SHEETS = {
    STUDENTS: 'חניכים',
    ATTENDANCE: 'נוכחות', 
    ABSENCES: 'היעדרויות'
  };

  // Real student data with updated groups and rooms - 74 students total
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
    
    // שנה ב - 22 תלמידים (ללא שינוי)
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

  // Time slots
  const timeSlots = ['07:30', '09:00', '12:15', '15:30', '16:45', '17:45', '20:00'];
  
  // Staff and approval options
  const approvalOptions = ['הרב איתמר', 'הרב אילעאי', 'בועז', 'הרב שובי', 'עמית', 'הרב יונדב', 'אסף', 'יהודה'];

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
  const [students, setStudents] = useState(allStudentsData);
  const [currentYear, setCurrentYear] = useState("א");
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Data loading functions
  const sendToSheet = async (sheetName, data, action = 'write') => {
    try {
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

  const loadAllDataFromSheets = async () => {
    setIsLoading(true);
    try {
      console.log('Loading data from Google Sheets...');
      
      const studentsData = await fetchFromSheet(SHEETS.STUDENTS);
      if (studentsData.length > 0) {
        const formattedStudents = studentsData.map(row => ({
          id: parseInt(row['ID']) || 0,
          name: row['שם'] || '',
          year: row['שנה'] || 'א',
          group: row['קבוצה'] || null,
          room: row['חדר'] || null
        }));
        setStudents(formattedStudents);
      }

      const attendanceData = await fetchFromSheet(SHEETS.ATTENDANCE);
      if (attendanceData.length > 0) {
        const formattedAttendance = attendanceData.map(row => ({
          id: `${row['תאריך']}-${row['שעה']}-${row['ID תלמיד']}`,
          studentId: parseInt(row['ID תלמיד']) || 0,
          scheduleId: `${row['תאריך']}-${row['שעה']}-${row['קבוצה'] || 'כולם'}`,
          present: row['נוכחות'] === 'נוכח',
          recorder: row['רושם'] || '',
          timestamp: row['זמן רישום'] || '',
          date: row['תאריך'] || '',
          timeSlot: row['שעה'] || '',
          year: row['שנה'] || 'א',
          group: row['קבוצה'] || 'כולם'
        }));
        setAttendance(formattedAttendance);
      }

      const absencesData = await fetchFromSheet(SHEETS.ABSENCES);
      if (absencesData.length > 0) {
        const formattedAbsences = absencesData.map(row => ({
          id: `absence-${row['ID תלמיד']}-${row['זמן יצירה']}`,
          studentId: row['ID תלמיד'] || '',
          studentName: row['שם תלמיד'] || '',
          studentYear: row['שנה'] || '',
          studentGroup: row['קבוצה'] || '',
          departureDate: row['תאריך יציאה'] || '',
          departureTime: row['שעת יציאה'] || '',
          returnDate: row['תאריך חזרה'] || '',
          returnTime: row['שעת חזרה'] || '',
          purpose: row['מטרה'] || '',
          approvedBy: row['מאושר על ידי'] || '',
          createdAt: row['זמן יצירה'] || ''
        }));
        setAbsences(formattedAbsences);
      }

      setLastSync(new Date());
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading data:', error);
      setDataLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await loadAllDataFromSheets();
    alert('הנתונים נרענו בהצלחה!');
  };

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

  const calculateAttendanceStats = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { percentage: 0, presentCount: 0, expectedLessons: 0, totalLessons: 0, status: 'good' };
    
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    const actualLessons = attendance
      .map(a => a.scheduleId)
      .filter((scheduleId, index, arr) => arr.indexOf(scheduleId) === index)
      .map(scheduleId => schedule.find(s => s.id === scheduleId))
      .filter(lesson => lesson && (
        lesson.group === 'כולם' || 
        (lesson.group === student.group) || 
        (lesson.year === 'משותף')
      ));
    
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

  // Component initialization
  useEffect(() => {
    loadAllDataFromSheets();
  }, []);

  useEffect(() => {
    if (autoTimeSlot) {
      const interval = setInterval(() => {
        setSelectedTimeSlot(getCurrentTimeSlot());
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [autoTimeSlot]);

  useEffect(() => {
    setSelectedGroup('כולם');
  }, [currentYear]);

  useEffect(() => {
    const generateSchedule = () => {
      const scheduleData = [];
      const today = new Date();
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];
        
        timeSlots.forEach(slot => {
          const groups = day % 3 === 0 ? 
            ['כולם', 'בועז-הרב אילעאי', 'פולובין-הרב שובי'] : 
            ['כולם'];
          
          groups.forEach(group => {
            scheduleData.push({
              id: `${dateStr}-${slot}-${group}`,
              date: dateStr,
              timeSlot: slot,
              group: group,
              description: `${slot} - שיעור ${group}`,
              year: group === 'כולם' ? 'משותף' : 'א'
            });
          });
        });
      }
      
      setSchedule(scheduleData);
    };
    
    generateSchedule();
  }, []);

  // UI Components
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
      <path d="M15 70 Q35 68 55 70 Q75 72 95 70 L95 80 Q75 82 55 80 Q35 78 15 80 Z" 
            fill="#8B7A4A"/>
      <path d="M10 75 Q30 73 50 75 Q70 77 90 75 L90 85 Q70 87 50 85 Q30 83 10 85 Z" 
            fill="#7A6B3F"/>
    </svg>
  );

  const DataStatusIndicator = () => (
    <div className="flex items-center space-x-2 space-x-reverse text-sm">
      {dataLoaded ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-600">מחובר לגיליון</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-yellow-600">טוען נתונים...</span>
        </>
      )}
      {lastSync && (
        <span className="text-gray-500 text-xs">
          עדכון אחרון: {lastSync.toLocaleTimeString('he-IL')}
        </span>
      )}
      <button
        onClick={refreshData}
        disabled={isLoading}
        className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        title="רענן נתונים"
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
              onClick={() => {
                setCurrentYear("א");
                setSelectedGroup('כולם');
              }}
              disabled={isLoading}
              className={`px-6 py-2 rounded-md transition-colors ${
                currentYear === "א" 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'text-amber-700 hover:bg-amber-50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              שנה א ({students.filter(s => s.year === "א").length})
            </button>
            <button
              onClick={() => {
                setCurrentYear("ב");
                setSelectedGroup('כולם');
              }}
              disabled={isLoading}
              className={`px-6 py-2 rounded-md transition-colors ${
                currentYear === "ב" 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'text-amber-700 hover:bg-amber-50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          { id: 'students', label: 'חניכים', icon: Users },
          { id: 'manage-students', label: 'ניהול חניכים', icon: Edit }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCurrentView(id)}
            disabled={isLoading && !dataLoaded}
            className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded ${
              currentView === id 
                ? 'bg-amber-600 text-white' 
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            } ${isLoading && !dataLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );

  const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 shadow-lg text-center" dir="rtl">
        <Logo />
        <h2 className="text-2xl font-bold text-amber-800 mt-4 mb-2">רוח השדה</h2>
        <p className="text-amber-700 mb-6">טוען נתונים מהגיליון...</p>
        <div className="flex items-center justify-center space-x-2 space-x-reverse">
          <RefreshCw className="h-6 w-6 text-amber-600 animate-spin" />
          <span className="text-amber-600">מתחבר ל-Google Sheets</span>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          פעם ראשונה? זה יכול לקחת כמה שניות...
        </div>
      </div>
    </div>
  );

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

    const groupBoazStudents = currentYearStudents.filter(s => s.group === 'בועז-הרב אילעאי');
    const groupPolovinStudents = currentYearStudents.filter(s => s.group === 'פולובין-הרב שובי');

    return (
      <div className="space-y-6" dir="rtl">
        <div className="bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-amber-800 mb-2">
                שנה {currentYear} - לוח בקרה
              </h2>
              <p className="text-amber-700">
                {currentYear === "א" ? "מחזור ט - שנה ראשונה" : "מחזור ח - שנה שנייה"} 
                • {currentYearStudents.length} חניכים
                {currentYear === "א" && (
                  <span className="block text-sm mt-1">
                    חלוקה לקבוצות: בועז-הרב אילעאי ({groupBoazStudents.length}) • פולובין-הרב שובי ({groupPolovinStudents.length})
                  </span>
                )}
              </p>
            </div>
            <div className="text-left">
              {dataLoaded && (
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <div className="text-sm font-medium text-amber-800 mb-1">סטטוס הנתונים</div>
                  <div className="text-xs text-amber-700">
                    חניכים: {students.length} נטענו<br/>
                    נוכחות: {attendance.length} רשומות<br/>
                    היעדרויות: {absences.length} דיווחים
                  </div>
                </div>
              )}
            </div>
          </div>
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
            <span>🔗 גיליון Google Sheets</span>
          </h3>
          <p className="text-amber-700 text-sm mb-2">
            כל הנתונים נשמרים באופן אוטומטי בגיליון Google Sheets עם החלוקה החדשה לקבוצות ולחדרים:
          </p>
          <div className="text-amber-600 text-xs mb-3">
            • גיליון "חניכים": ID, שם, שנה, קבוצה (בועז-הרב אילעאי/פולובין-הרב שובי), חדר<br/>
            • גיליון "נוכחות": תאריך, שעה, תלמיד, שנה, קבוצה, נוכחות<br/>
            • גיליון "היעדרויות": תלמיד, שנה, קבוצה, תאריכים, מטרה<br/>
            • <strong>עדכון חדש</strong>: כל חניכי שנה א' חולקו לקבוצות עם חדרים מוגדרים
          </div>
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

        {lowAttendanceStudents.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">🚨 חניכים הדורשים תשומת לב</h3>
            <div className="space-y-2">
              {lowAttendanceStudents.map(student => {
                const stats = calculateAttendanceStats(student.id);
                return (
                  <div key={student.id} className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="font-medium">
                      {student.name}
                      {student.group && ` (${student.group})`}
                      {student.room && ` - ${student.room}`}
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
                      lesson.group === 'בועז-הרב אילעאי' ? 'bg-blue-100 text-blue-800' : 
                      lesson.group === 'פולובין-הרב שובי' ? 'bg-purple-100 text-purple-800' :
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

  // Show loading screen if data hasn't loaded yet
  if (!dataLoaded && isLoading) {
    return <LoadingScreen />;
  }

  // Main App Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        {/* System Status Bar */}
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
              עדכון אחרון: {lastSync ? lastSync.toLocaleString('he-IL') : 'טרם סונכרן'}
            </div>
          </div>
        </div>

        {/* Main Content - Only show if data is loaded */}
        {dataLoaded && (
          <>
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'attendance' && <TakeAttendance />}
            {currentView === 'absences' && <AbsenceReporting />}
            {currentView === 'students' && <StudentsOverview />}
            {currentView === 'manage-students' && <StudentsManagement />}
          </>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>מערכת נוכחות מכינת רוח השדה • גרסה 2.2 • עם חלוקה לקבוצות וחדרים</p>
          <p className="mt-1">
            כל הנתונים נשמרים אוטומטית ב-Google Sheets • 
            <a href={SHEET_URL} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-800 mx-1">
              פתח גיליון
            </a>
            • מצב {dataLoaded ? 'מקוון' : 'לא מקוון'} • שנה א מחולקת לקבוצות ✓
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceApp;
