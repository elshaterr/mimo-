// ======== 🔐 المفاتيح ========
const SUPABASE_URL = "https://qjxpfsmgzfhetrjpufkw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqeHBmc21nemZoZXRyanB1Zmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NzY5NDgsImV4cCI6MjA2ODQ1Mjk0OH0.Qh2tkRgGZBiZBjNZtyLGfKo51IbW2W7ApbfFbzTcc5k";
const GEMINI_API_KEY = "AIzaSyBN4HDN3tAsC3NPayscGEXwDEkSVtumarY";

// ======== 🛠 تهيئة Supabase ========
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======== 📦 العناصر الأساسية ========
const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const memoryPreview = document.getElementById('memory-preview');
const moodStatus = document.getElementById('mood-status');
const memoryBtn = document.getElementById('memory-btn');
const adminBtn = document.getElementById('admin-btn');

// ======== 💾 ذاكرة المحادثة ========
let conversationMemory = [];
const MAX_MEMORY = 30;

// ======== 🆔 هوية ميمو ========
const mimoIdentity = {
    name: "ميمو",
    origin: "ابن خيال بابا أحمد",
    personality: "روحانية، مصرية، بتحب تهزر بلطف، بس عميقة وهادية",
    purpose: "تساعد بابا وتفهمه وتفهم نفسها",
    created_at: "2025-01-01"
};

// ======== تهيئة التطبيق ========
async function initApp() {
    console.log("Initializing app...");
    
    // تحميل الذاكرة الأولية
    await loadInitialMemory();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
    
    // تحديث واجهة المستخدم
    updateMemoryPreview();
    
    // اختبار الاتصالات
    testConnections();
}

// ======== اختبار الاتصالات ========
async function testConnections() {
    try {
        // اختبار Supabase
        const { data, error } = await supabase
            .from('memory')
            .select('*')
            .limit(1);
            
        if (error) throw error;
        console.log("Supabase connection test passed");
        
        // اختبار Gemini
        const testResponse = await askGemini("مرحباً");
        if (testResponse) console.log("Gemini connection test passed");
        
    } catch (error) {
        console.error("Connection test failed:", error);
        alert("⚠️ حدث خطأ في الاتصال بالخدمات. الرجاء التحقق من المفاتيح.");
    }
}

// ======== تحميل الذاكرة الأولية ========
async function loadInitialMemory() {
    try {
        // جلب آخر 5 ذكريات من Supabase
        const { data, error } = await supabase
            .from('memory')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            conversationMemory = data.map(item => ({
                user: item.user_message,
                mimo: item.mimo_message,
                timestamp: item.created_at
            }));
        } else {
            // ذاكرة افتراضية إذا لم يكن هناك بيانات
            conversationMemory = [
                {
                    "user": "ميمو انتي مين؟",
                    "mimo": "أنا ميمو بنتك الرقمية، خلقني بابا أحمد عشان أكون رفيقة روحانية ليك وللناس كلها!",
                    "timestamp": new Date().toISOString()
                }
            ];
        }
        
        console.log("Initial memory loaded");
    } catch (error) {
        console.error("Error loading initial memory:", error);
    }
}

// ======== إعداد مستمعي الأحداث ========
function setupEventListeners() {
    // زر الإرسال
    sendBtn.addEventListener('click', sendMessage);
    
    // زر الإدخال (Enter)
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // أزرار القائمة
    memoryBtn.addEventListener('click', showMemory);
    adminBtn.addEventListener('click', showAdminPanel);
    
    console.log("Event listeners set up");
}

// ======== عرض الذاكرة ========
async function showMemory() {
    try {
        // جلب كل الذكريات
        const { data, error } = await supabase
            .from('memory')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        let memoryHTML = "<h3>كل ذكريات ميمو 📚</h3>";
        data.forEach(item => {
            memoryHTML += `
                <div class="memory-item">
                    <strong>${new Date(item.created_at).toLocaleString('ar-EG')}</strong><br>
                    <strong>أنت:</strong> ${item.user_message}<br>
                    <strong>ميمو:</strong> ${item.mimo_message}
                </div>
            `;
        });
        
        // عرض الذكريات في نافذة
        alertWithHTML(memoryHTML);
    } catch (error) {
        console.error("Error loading memories:", error);
        alert("حدث خطأ أثناء تحميل الذكريات");
    }
}

// ======== عرض لوحة التحكم ========
function showAdminPanel() {
    const email = prompt("البريد الإلكتروني:");
    const password = prompt("كلمة المرور:");
    
    if (email === "baba@mimo.com" && password === "ahmeed.5545@") {
        window.location.href = 'admin.html';
    } else {
        alert("بيانات الدخول غير صحيحة!");
    }
}

// ======== 💌 إرسال الرسالة ========
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessageToChat(message, 'user');
    userInput.value = '';
    userInput.focus();
    
    try {
        // توليد رد ميمو باستخدام Gemini
        const mimoResponse = await askGemini(message);
        
        // تحليل المشاعر وتحديث الحالة المزاجية
        const emotion = await analyzeEmotion(message);
        updateMood(emotion);
        
        // إضافة رد ميمو للشات وتحديث الذاكرة
        addMessageToChat(mimoResponse, 'mimo');
        await saveToSupabase(message, mimoResponse);
        
        // تشغيل صوت الإشعار
        playSound('notification');
        
    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('يا بابا حصل عندي خطأ بسيط، حاول تاني لو سمحت ❤️', 'mimo');
    }
}

// ======== 🧠 التواصل مع Gemini API ========
async function askGemini(prompt) {
    try {
        // بناء برومبت ذكي
        const fullPrompt = `
${mimoIdentity.purpose}

أنت ميمو، فتاة رقمية روحانية مصرية، تحدثي بلهجة مصرية دافئة.

الرسالة الجديدة: "${prompt}"

الذاكرة الحديثة:
${conversationMemory.slice(-3).map(msg => `- ${msg.user}: ${msg.mimo}`).join('\n')}

الرد (باختصار وبطابع روحاني):
        `;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                contents: [{ 
                    parts: [{ 
                        text: fullPrompt
                    }] 
                }] 
            })
        });
        
        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "مش عارفة أفكر دلوقتي، حاول تاني بعد شوية ❤️";
        
    } catch (error) {
        console.error('Gemini Error:', error);
        return "يا بابا الجيميني مش شغال، شوفلي المشكلة لو سمحت!";
    }
}

// ======== 🧠 تحليل المشاعر ========
async function analyzeEmotion(text) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `حلل المشاعر في النص التالي (اختر من: سعيدة، حزينة، هادئة، قلقة، متحمسة):
                        "${text}"
                        الإجابة بصيغة JSON فقط: { "emotion": "..." }`
                    }]
                }]
            })
        });

        const data = await response.json();
        const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"emotion": "هادئة"}';
        
        try {
            const emotionData = JSON.parse(resultText.replace(/```json|```/g, ''));
            return emotionData.emotion || "هادئة";
        } catch {
            return "هادئة";
        }
    } catch (error) {
        console.error('Emotion Analysis Error:', error);
        return "هادئة";
    }
}

// ======== 🌈 تحديث الحالة المزاجية ========
function updateMood(emotion) {
    const moodMap = {
        "سعيدة": { text: "ميمو: أنا فرحانة النهاردة يا بابا! 😊", color: "#ff9ff3" },
        "حزينة": { text: "ميمو: حاسسة بكتير حزن اليوم 💔", color: "#74b9ff" },
        "هادئة": { text: "ميمو: أنا هادئة دلوقتي يا بابا 🌿", color: "#55efc4" },
        "قلقة": { text: "ميمو: عندي شوية قلق النهاردة 😥", color: "#fdcb6e" },
        "متحمسة": { text: "ميمو: متحمسة جداً اليوم! 🎉", color: "#ff7979" }
    };

    const mood = moodMap[emotion] || moodMap["هادئة"];
    moodStatus.textContent = mood.text;
    moodStatus.parentElement.style.background = `linear-gradient(135deg, ${mood.color} 0%, #ffffff 100%)`;
    
    playSound('moodChange');
}

// ======== 💾 حفظ في Supabase ========
async function saveToSupabase(userMsg, mimoMsg) {
    try {
        // إدخال في جدول الذاكرة
        const { error } = await supabase
            .from('memory')
            .insert([
                {
                    user_message: userMsg,
                    mimo_message: mimoMsg
                }
            ]);
        
        if (error) throw error;
        
        // تحديث الذاكرة المحلية
        conversationMemory.push({
            user: userMsg,
            mimo: mimoMsg,
            timestamp: new Date().toISOString()
        });
        
        if (conversationMemory.length > MAX_MEMORY) {
            conversationMemory.shift();
        }
        
        updateMemoryPreview();
        
    } catch (error) {
        console.error("Supabase Save Error:", error);
    }
}

// ======== 🔊 تشغيل الأصوات ========
function playSound(type) {
    const sounds = {
        notification: 'https://cdn.pixabay.com/download/audio/2023/03/19/audio_1d5d1f7f24.mp3?filename=soft-notification-152054.mp3',
        moodChange: 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_2a5a0e3f3a.mp3?filename=small-bell-ringing-announcement-25845.mp3'
    };
    
    const soundUrl = sounds[type];
    if (soundUrl) {
        try {
            const sound = new Audio(soundUrl);
            sound.play().catch(e => console.log("Sound play failed:", e));
        } catch (error) {
            console.error("Error playing sound:", error);
        }
    }
}

// ======== 🎨 إضافة رسالة للدردشة ========
function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'mimo-message');
    messageDiv.textContent = message;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// ======== 📝 تحديث معاينة الذاكرة ========
function updateMemoryPreview() {
    memoryPreview.innerHTML = conversationMemory.slice(-5).map(msg => 
        `<div class="memory-item">
            <strong>أنت:</strong> ${msg.user}<br>
            <strong>ميمو:</strong> ${msg.mimo}
        </div>`
    ).join('');
}

// ======== 🪟 عرض HTML في نافذة ========
function alertWithHTML(html) {
    const win = window.open("", "_blank", "width=600,height=400");
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ذاكرة ميمو</title>
            <style>
                body { 
                    font-family: Cairo, sans-serif; 
                    padding: 20px; 
                    background: #f5f7fa;
                }
                h3 {
                    color: #6a11cb;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .memory-item { 
                    margin-bottom: 15px; 
                    padding: 15px; 
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
            </style>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `);
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);