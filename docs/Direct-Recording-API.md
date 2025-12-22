# Direct Recording API Documentation

## Overview
هذا الـ API يسمح للطلاب بتسجيل التلاوة مباشرة من التطبيق بدلاً من رفع ملف موجود.

## Endpoint

### POST `/api/v1/recitations/record-direct`

**Authentication:** Required (Bearer Token)  
**Role:** Student only  
**Content-Type:** `multipart/form-data`

## Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audioBlob` | File (Binary) | Yes | التسجيل الصوتي من MediaRecorder |
| `surahId` | number | Yes | رقم السورة (1-114) |
| `fromAyah` | number | Yes | رقم الآية من |
| `toAyah` | number | Yes | رقم الآية إلى |
| `notes` | string | No | ملاحظات اختيارية |
| `audioFormat` | string | No | صيغة الصوت (webm, mp4, wav, ogg) |

## Supported Audio Formats

- **WebM** (audio/webm) - الأكثر شيوعاً في المتصفحات الحديثة
- **OGG** (audio/ogg) - يدعم codec Opus
- **MP4** (audio/mp4)
- **WAV** (audio/wav)
- **MP3** (audio/mpeg)

## Response

### Success (201 Created)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "تم تسجيل ورفع التسميع المباشر بنجاح",
  "data": {
    "id": 1,
    "userId": 123,
    "surahId": 1,
    "fromAyah": 1,
    "toAyah": 7,
    "audioUrl": "https://storage.example.com/recitations/user-123/recording-456.webm",
    "audioKey": "recitations/user-123/recording-456.webm",
    "duration": 180,
    "fileSize": 2880000,
    "notes": "تسجيل مباشر من التطبيق",
    "status": "pending",
    "evaluationScore": null,
    "evaluationData": null,
    "createdAt": "2024-01-10T10:30:00.000Z",
    "updatedAt": "2024-01-10T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - No Active Subscription
```json
{
  "success": false,
  "statusCode": 400,
  "message": "No active subscription found"
}
```

#### 400 Bad Request - Audio Blob Required
```json
{
  "success": false,
  "statusCode": 400,
  "message": "تسجيل الصوت مطلوب"
}
```

#### 400 Bad Request - File Too Large
```json
{
  "success": false,
  "statusCode": 400,
  "message": "حجم الملف يتجاوز الحد الأقصى 100 ميجابايت"
}
```

#### 400 Bad Request - Invalid Audio Format
```json
{
  "success": false,
  "statusCode": 400,
  "message": "صيغة الصوت غير صحيحة. الصيغ المسموحة: MP3, WAV, M4A, WebM, OGG"
}
```

#### 403 Forbidden - No Remaining Sessions
```json
{
  "success": false,
  "statusCode": 403,
  "message": "No remaining sessions in subscription"
}
```

## Frontend Implementation Example

### Using MediaRecorder API (JavaScript)

```javascript
let mediaRecorder;
let audioChunks = [];

// Start Recording
async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // تحديد صيغة الصوت حسب دعم المتصفح
  let mimeType = 'audio/webm';
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    mimeType = 'audio/webm;codecs=opus';
  } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
    mimeType = 'audio/ogg;codecs=opus';
  } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
    mimeType = 'audio/mp4';
  }
  
  mediaRecorder = new MediaRecorder(stream, { mimeType });
  audioChunks = [];
  
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  
  mediaRecorder.start();
  console.log('Recording started...');
}

// Stop Recording and Upload
async function stopRecordingAndUpload(surahId, fromAyah, toAyah, notes = '') {
  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = async () => {
      // إنشاء Blob من التسجيل
      const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
      
      // تحديد صيغة الملف
      const format = mediaRecorder.mimeType.includes('webm') ? 'webm' : 
                     mediaRecorder.mimeType.includes('ogg') ? 'ogg' :
                     mediaRecorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
      
      // إنشاء FormData
      const formData = new FormData();
      formData.append('audioBlob', audioBlob, `recording-${Date.now()}.${format}`);
      formData.append('surahId', surahId.toString());
      formData.append('fromAyah', fromAyah.toString());
      formData.append('toAyah', toAyah.toString());
      formData.append('audioFormat', format);
      if (notes) {
        formData.append('notes', notes);
      }
      
      try {
        // رفع التسجيل
        const response = await fetch('/api/v1/recitations/record-direct', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log('Recording uploaded successfully:', result);
          resolve(result);
        } else {
          console.error('Upload failed:', result);
          reject(result);
        }
      } catch (error) {
        console.error('Upload error:', error);
        reject(error);
      }
      
      // إيقاف stream
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.stop();
  });
}

// Example Usage
async function recordRecitation() {
  try {
    // بدء التسجيل
    await startRecording();
    
    // المستخدم يقرأ...
    // بعد الانتهاء من القراءة:
    
    // إيقاف التسجيل ورفعه
    const result = await stopRecordingAndUpload(
      1,    // surahId: الفاتحة
      1,    // fromAyah
      7,    // toAyah
      'تسجيل مباشر من التطبيق'  // notes
    );
    
    console.log('Recitation saved:', result.data);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Using React Hooks

```jsx
import { useState, useRef } from 'react';
import axios from 'axios';

function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  };

  const stopRecordingAndUpload = async (surahId, fromAyah, toAyah, notes) => {
    return new Promise((resolve, reject) => {
      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsUploading(true);
        
        const mimeType = mediaRecorderRef.current.mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        const format = mimeType.includes('webm') ? 'webm' : 
                       mimeType.includes('ogg') ? 'ogg' : 'webm';
        
        const formData = new FormData();
        formData.append('audioBlob', audioBlob, `recording-${Date.now()}.${format}`);
        formData.append('surahId', surahId);
        formData.append('fromAyah', fromAyah);
        formData.append('toAyah', toAyah);
        formData.append('audioFormat', format);
        if (notes) formData.append('notes', notes);
        
        try {
          const response = await axios.post(
            '/api/v1/recitations/record-direct',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          setIsUploading(false);
          resolve(response.data);
        } catch (error) {
          setIsUploading(false);
          reject(error);
        }
        
        // تنظيف
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.stop();
    });
  };

  return {
    isRecording,
    isUploading,
    startRecording,
    stopRecordingAndUpload
  };
}

// Component Example
function RecitationRecorder() {
  const { isRecording, isUploading, startRecording, stopRecordingAndUpload } = useRecorder();
  const [surahId, setSurahId] = useState(1);
  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(7);

  const handleRecord = async () => {
    if (isRecording) {
      try {
        const result = await stopRecordingAndUpload(
          surahId,
          fromAyah,
          toAyah,
          'تسجيل من React App'
        );
        alert('تم رفع التسجيل بنجاح!');
        console.log(result);
      } catch (error) {
        alert('حدث خطأ أثناء رفع التسجيل');
        console.error(error);
      }
    } else {
      try {
        await startRecording();
      } catch (error) {
        alert('حدث خطأ أثناء بدء التسجيل');
        console.error(error);
      }
    }
  };

  return (
    <div>
      <h2>تسجيل التلاوة</h2>
      
      <div>
        <label>السورة: </label>
        <input
          type="number"
          value={surahId}
          onChange={(e) => setSurahId(Number(e.target.value))}
          min="1"
          max="114"
          disabled={isRecording}
        />
      </div>
      
      <div>
        <label>من آية: </label>
        <input
          type="number"
          value={fromAyah}
          onChange={(e) => setFromAyah(Number(e.target.value))}
          min="1"
          disabled={isRecording}
        />
      </div>
      
      <div>
        <label>إلى آية: </label>
        <input
          type="number"
          value={toAyah}
          onChange={(e) => setToAyah(Number(e.target.value))}
          min="1"
          disabled={isRecording}
        />
      </div>
      
      <button onClick={handleRecord} disabled={isUploading}>
        {isRecording ? '⏹️ إيقاف ورفع' : '🎤 بدء التسجيل'}
      </button>
      
      {isUploading && <p>جاري رفع التسجيل...</p>}
    </div>
  );
}

export default RecitationRecorder;
```

## Data Storage

### Database Table: `recitations`

التسجيلات المباشرة يتم حفظها في نفس جدول `recitations` مع التسجيلات المرفوعة كملفات.

**الحقول المهمة:**
- `audio_url`: رابط الملف في S3
- `audio_key`: المفتاح لحذف الملف من S3
- `duration`: مدة التسجيل بالثواني (تقديرية)
- `file_size`: حجم الملف بالبايت
- `status`: حالة التسجيل (pending, processing, completed, failed)

### S3 Storage

الملفات يتم حفظها في:
```
s3://bucket-name/recitations/user-{userId}/recording-{timestamp}.{format}
```

## Notes

1. **الحد الأقصى لحجم الملف:** 100 ميجابايت
2. **Subscription Required:** المستخدم يجب أن يكون لديه اشتراك نشط
3. **Sessions Limit:** كل تسجيل يستهلك جلسة واحدة من الاشتراك
4. **Auto-deletion:** التسجيلات القديمة (أكثر من 30 يوم) يتم حذفها تلقائياً

## Differences from Upload Endpoint

| Feature | Upload (`/upload`) | Direct Recording (`/record-direct`) |
|---------|-------------------|-------------------------------------|
| الملف | ملف جاهز من الجهاز | تسجيل مباشر من المتصفح |
| Field Name | `audio` | `audioBlob` |
| Typical Format | MP3, M4A | WebM, OGG |
| Use Case | رفع تسجيل موجود | تسجيل جديد في التطبيق |
