document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Haptic Feedback Utility ---
    window.vibrate = function(ms = 50) {
        if (navigator.vibrate) navigator.vibrate(ms);
    };

    // --- 2. Splash Screen Logic ---
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.classList.add('hidden');
                document.getElementById('main-app').classList.remove('hidden');
            }, 400);
        }
    }, 2000);

    // --- 3. PWA Install Prompt (A2HS) ---
    let deferredPrompt;
    const installBtn = document.getElementById('installAppBtn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if(installBtn) installBtn.classList.remove('hidden');
    });

    if(installBtn) {
        installBtn.addEventListener('click', async () => {
            window.vibrate(50);
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') installBtn.classList.add('hidden');
                deferredPrompt = null;
            }
        });
    }

    // --- 4. Navigation System ---
    const navItems = document.querySelectorAll('.nav-item');
    const contentArea = document.getElementById('app-content');

    window.goToPage = function(pageId, navId) {
        window.vibrate(40);
        navItems.forEach(nav => nav.classList.remove('active'));
        
        const targetNav = document.querySelector(`.nav-item[data-target="${navId || pageId}"]`);
        if (targetNav) {
            targetNav.classList.add('active');
        } else {
            const moreNav = document.querySelector(`.nav-item[data-target="more"]`);
            if(moreNav) moreNav.classList.add('active');
        }
        loadPage(pageId);
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            window.vibrate(40);
            navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');
            loadPage(e.currentTarget.getAttribute('data-target'));
        });
    });

    // --- 5. Pull-to-Refresh Logic ---
    let touchStartY = 0;
    const ptrIndicator = document.getElementById('ptr-indicator');
    
    if(contentArea) {
        contentArea.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, {passive: true});
        contentArea.addEventListener('touchmove', e => {
            if(contentArea.scrollTop === 0 && e.touches[0].clientY > touchStartY + 50) {
                if(ptrIndicator) {
                    ptrIndicator.style.opacity = '1';
                    ptrIndicator.style.marginTop = '10px';
                }
            }
        }, {passive: true});
        contentArea.addEventListener('touchend', e => {
            if(ptrIndicator && ptrIndicator.style.opacity === '1') {
                window.vibrate(60);
                ptrIndicator.style.marginTop = '-40px';
                ptrIndicator.style.opacity = '0';
                const activeNav = document.querySelector('.nav-item.active');
                if(activeNav) loadPage(activeNav.getAttribute('data-target'));
            }
        });
    }

    // --- 6. Real-time Weather Fetcher ---
    async function fetchWeather() {
        const weatherBox = document.getElementById('weather-content');
        if(!weatherBox) return;
        
        try {
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=25.80&longitude=89.63&current_weather=true');
            const data = await res.json();
            const temp = Math.round(data.current_weather.temperature);
            
            weatherBox.innerHTML = `
                <div>
                    <h3 style="font-size: 1.2rem; margin-bottom:4px; color: var(--primary-dark);">কুড়িগ্রাম</h3>
                    <p style="font-size:0.9rem; color: var(--text-muted);">বর্তমান তাপমাত্রা: ${temp}°C</p>
                </div>
                <i class="fa-solid fa-cloud-sun" style="font-size: 2.5rem; color: #FFD700; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));"></i>
            `;
        } catch (error) {
            weatherBox.innerHTML = `<div><h3 style="color: var(--primary-dark);">কুড়িগ্রাম</h3><p>আবহাওয়া আপডেট হচ্ছে...</p></div>`;
        }
    }

    // --- 7. Page Views Rendering ---
    function loadPage(page) {
        if(!contentArea) return;
        contentArea.innerHTML = '';
        if(window.bannerInterval) clearInterval(window.bannerInterval);
        let content = '';

        const subPageHeader = (title) => `
            <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <button onclick="goToPage('home')" style="background: none; border: none; font-size: 1.2rem; color: var(--text-main); margin-right: 15px; cursor: pointer;">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <h2 style="font-size: 1.4rem; color: var(--primary-dark); margin: 0; font-weight: 700;">${title}</h2>
            </div>
        `;
        // loadPage ফাংশনটি যেন সব জায়গা থেকে এক্সেস করা যায়
        window.loadPage = loadPage;

        switch(page) {
            case 'home':
                const user = JSON.parse(localStorage.getItem('agroUser')) || { name: 'খামারি ভাই' };
                content = `
                <div class="fade-in" style="padding-bottom: 90px;">
                    <!-- হেডার সেকশন -->
                    <div style="padding: 15px 15px 5px 15px;">
                        <h2 style="margin:0; font-size: 1.4rem; color: var(--text-main); font-weight: 800;">শুভ সকাল, ${user.name}</h2>
                        <p style="margin:3px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">আপনার খামারের আজকের ড্যাশবোর্ড</p>
                    </div>

                    <!-- আবহাওয়া কার্ড -->
                    <div style="padding: 0 15px; margin-top: 10px;">
                        <div class="agro-card" style="padding: 15px; background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); border: none; display: flex; justify-content: space-between; align-items: center; border-radius: 18px;">
                            <div>
                                <h3 style="margin:0; font-size: 1.2rem; color: #0D47A1; font-weight: 700;">কুড়িগ্রাম</h3>
                                <p style="margin:4px 0 0 0; font-size: 0.85rem; color: #1565C0;">বর্তমান তাপমাত্রা: ৩২°C</p>
                            </div>
                            <div style="font-size: 2.5rem; color: #FBC02D;">
                                <i class="fa-solid fa-cloud-sun"></i>
                            </div>
                        </div>
                    </div>

                    <!-- কুইক মেন্যু গ্রিড -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px 10px; padding: 15px;">
                        
                        <!-- প্রথম লাইন (আগের ৪টি বাটন - লিংক ফিক্স করা হয়েছে) -->
                        <div class="grid-item fade-in" onclick="loadPage('calculator')" style="cursor:pointer; text-align:center;">
                            <div style="width:50px; height:50px; background:rgba(76, 175, 80, 0.12); color:#2E7D32; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
                                <i class="fa-solid fa-scale-balanced"></i>
                            </div>
                            <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">খাদ্য হিসাব</span>
                        </div>
                        <div class="grid-item fade-in" onclick="loadPage('advice')" style="cursor:pointer; text-align:center;">
                            <div style="width:50px; height:50px; background:rgba(33, 150, 243, 0.12); color:#1565C0; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
                                <i class="fa-solid fa-syringe"></i>
                            </div>
                            <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">চিকিৎসা</span>
                        </div>
                        <div class="grid-item fade-in" onclick="loadPage('reports')" style="cursor:pointer; text-align:center;">
                            <div style="width:50px; height:50px; background:rgba(255, 152, 0, 0.12); color:#E65100; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
                                <i class="fa-solid fa-file-invoice-dollar"></i>
                            </div>
                            <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">আয়-ব্যয়</span>
                        </div>
                        <div class="grid-item fade-in" onclick="loadPage('reminder')" style="cursor:pointer; text-align:center;">
                            <div style="width:50px; height:50px; background:rgba(156, 39, 176, 0.12); color:#6A1B9A; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
                                <i class="fa-solid fa-calendar-check"></i>
                            </div>
                            <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">রিমাইন্ডার</span>
                        </div>

                        <!-- দ্বিতীয় লাইন (নতুন যুক্ত করা ৪টি বাটন) -->
                        <div class="grid-item fade-in" onclick="loadPage('protein-calculator')" style="cursor:pointer; text-align:center;">
    <div style="width:50px; height:50px; background:rgba(0, 150, 136, 0.12); color:#00796B; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
        <i class="fa-solid fa-flask"></i>
    </div>
    <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">প্রোটিন %</span>
</div>
                        <div class="grid-item fade-in" onclick="loadPage('cattle-profiles')" style="cursor:pointer; text-align:center;">
                            <div style="width:50px; height:50px; background:rgba(121, 85, 72, 0.12); color:#5D4037; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
                                <i class="fa-solid fa-cow"></i>
                            </div>
                            <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">গরুর তালিকা</span>
                        </div>
                        <!-- আপডেট করা মেডিসিন (DIMS) বাটন -->
                        <div class="grid-item fade-in" onclick="loadPage('medicine-index')" style="cursor:pointer; text-align:center;">
                            <div style="width:50px; height:50px; background:rgba(244, 67, 54, 0.12); color:#C62828; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
                                <i class="fa-solid fa-pills"></i>
                            </div>
                            <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">মেডিসিন</span>
                        </div>
                        <div class="grid-item fade-in" onclick="window.showAdminPinModal()" style="cursor:pointer; text-align:center;">
                            <div style="width:50px; height:50px; background:rgba(44, 62, 80, 0.12); color:#2C3E50; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
                                <i class="fa-solid fa-shield-halved"></i>
                            </div>
                            <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">অ্যাডমিন</span>
                        </div>

                    </div>

                    <!-- আজকের পরামর্শ -->
                    <div style="padding: 0 15px; margin-bottom: 15px;">
                        <div class="agro-card" style="padding: 15px; background: #FFFDE7; border-left: 4px solid #FBC02D; border-radius: 12px;">
                            <h4 style="margin: 0 0 6px 0; color: #F57F17; font-size: 0.95rem; font-weight: 700; display:flex; align-items:center; gap:6px;">
                                💡 আজকের পরামর্শ
                            </h4>
                            <p style="margin:0; font-size: 0.82rem; color: #5D4037; line-height: 1.5;">
                                তীব্র গরমে গরুকে স্যালাইন পানি বা <b>গ্লুকোলাইট ভেট</b> খাওয়ালে হিট স্ট্রোকের ঝুঁকি কমে এবং শারীরিক দুর্বলতা দূর হয়।
                            </p>
                        </div>
                    </div>

                    <!-- 🔥 প্রিমিয়াম ফ্যাটেনিং খামার সেকশন -->
                    <div style="padding: 0 15px;">
                        
                        <!-- ১. হিরো ব্যানার -->
                        <div class="agro-card fade-in" onclick="loadPage('fattening-guide')" style="position: relative; overflow: hidden; border-radius: 20px; border: none; box-shadow: 0 10px 25px rgba(0,0,0,0.15); margin-bottom: 18px; padding: 0; cursor: pointer; min-height: 190px;">
                            <div style="position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; background: url('https://i.postimg.cc/gJDcW98N/images-(1).jpg') center/cover no-repeat; filter: blur(5px) brightness(0.55); transform: scale(1.08);"></div>

                            <div style="position: relative; z-index: 2; padding: 22px 20px; display: flex; flex-direction: column; justify-content: flex-end; color: white; min-height: 190px; box-sizing: border-box;">
                                <span style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; width: max-content; margin-bottom: 10px; letter-spacing: 0.5px; box-shadow: 0 3px 10px rgba(76,175,80,0.4); display: flex; align-items: center; gap: 6px;">
                                    🔥 প্রিমিয়াম ফ্যাটেনিং গাইড <i class="fa-solid fa-chevron-right" style="font-size: 0.65rem;"></i>
                                </span>
                                <h3 style="margin: 0 0 6px 0; font-size: 1.3rem; font-weight: 800; text-shadow: 0 2px 6px rgba(0,0,0,0.8); color: #FFFFFF; letter-spacing: 0.3px;">
                                    ষাঁড় মোটাতাজাকরণ ও উন্নত রেশন
                                </h3>
                                <p style="margin: 0; font-size: 0.82rem; opacity: 0.95; line-height: 1.45; text-shadow: 0 2px 4px rgba(0,0,0,0.9); color: #F0F0F0;">
                                    সঠিক প্রোটিন, সাইলেজ, DDGS ও মোলাসেসের বৈজ্ঞানিক মিশ্রণে ষাঁড়ের দ্রুত ওজন বৃদ্ধি নিশ্চিত করুন।
                                </p>
                            </div>
                        </div>

                        <!-- ২. ফ্যাটেনিং কী-মেট্রিক্স / টার্গেট ট্র্যাকার -->
                        <div style="display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 5px;">
                            <div style="flex: 1; min-width: 130px; background: var(--card-bg, #fff); padding: 12px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                                <div style="width: 34px; height: 34px; background: rgba(76, 175, 80, 0.12); color: #2E7D32; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; margin-bottom: 8px;">
                                    <i class="fa-solid fa-weight-scale"></i>
                                </div>
                                <div style="font-size: 0.72rem; color: var(--text-muted, #777);">দৈনিক ওজন লক্ষ্য</div>
                                <div style="font-size: 1rem; font-weight: 800; color: var(--text-main, #222); margin-top: 2px;">১.২ - ১.৫ কেজি</div>
                            </div>

                            <div style="flex: 1; min-width: 130px; background: var(--card-bg, #fff); padding: 12px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                                <div style="width: 34px; height: 34px; background: rgba(255, 152, 0, 0.12); color: #E65100; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; margin-bottom: 8px;">
                                    <i class="fa-solid fa-bowl-food"></i>
                                </div>
                                <div style="font-size: 0.72rem; color: var(--text-muted, #777);">ক্রুড প্রোটিন (CP)</div>
                                <div style="font-size: 1rem; font-weight: 800; color: var(--text-main, #222); margin-top: 2px;">১৪% - ১৬%</div>
                            </div>

                            <div style="flex: 1; min-width: 130px; background: var(--card-bg, #fff); padding: 12px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                                <div style="width: 34px; height: 34px; background: rgba(33, 150, 243, 0.12); color: #1565C0; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; margin-bottom: 8px;">
                                    <i class="fa-solid fa-droplet"></i>
                                </div>
                                <div style="font-size: 0.72rem; color: var(--text-muted, #777);">বিশুদ্ধ পানি</div>
                                <div style="font-size: 1rem; font-weight: 800; color: var(--text-main, #222); margin-top: 2px;">২৪ ঘণ্টা সরবরাহ</div>
                            </div>
                        </div>

                        <!-- ৩. ছবিসহ ফ্যাটেনিং গ্যালাক্সী & টিপস কার্ডস -->
                        <h4 style="margin: 0 0 12px 5px; font-size: 0.98rem; color: var(--text-main); font-weight: 700; display: flex; justify-content: space-between; align-items: center;">
                            <span>🐄 খামার ব্যবস্থাপনা ও গ্যালারি</span>
                            <span onclick="loadPage('cattle-profiles')" style="font-size: 0.78rem; color: #4CAF50; font-weight: 600; cursor: pointer;">প্রোফাইল দেখুন <i class="fa-solid fa-arrow-right"></i></span>
                        </h4>

                        <!-- খামার ব্যবস্থাপনা ও গ্যালারি -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                            
                            <!-- কার্ড ১: TMR রেশনিং পদ্ধতি -->
                            <div class="agro-card fade-in" onclick="loadPage('tmr-rationing')" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.06); background: var(--card-bg, #fff); cursor: pointer;">
                                <img src="https://i.postimg.cc/15vBh5m8/Gemini-Generated-Image-ipzo9oipzo9oipzo.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="TMR Feed">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #795548; font-weight: 700; text-transform: uppercase;">খাদ্য প্রস্তুতকরণ</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">TMR রেশনিং পদ্ধতি</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">DDGS, ভুষি ও খৈলের মিশ্রণে সুষম টিএমআর খাবার প্রদান।</p>
                                </div>
                            </div>

                            <!-- কার্ড ২: ভ্যাকসিনেশন ও ডিওয়ার্মিং -->
                            <div class="agro-card fade-in" onclick="loadPage('vaccine-deworming')" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.06); background: var(--card-bg, #fff); cursor: pointer;">
                                <img src="https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?q=80&w=400&auto=format&fit=crop" style="width: 100%; height: 105px; object-fit: cover;" alt="Vaccine">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #4CAF50; font-weight: 700; text-transform: uppercase;">স্বাস্থ্য সুরক্ষা</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">ভ্যাকসিনেশন ও ডিওয়ার্মিং</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">ফ্যাটেনিং শুরুর আগে কৃমিনাশক ও খুরা রোগের টিকা সম্পন্ন করুন।</p>
                                </div>
                            </div>

                            <!-- কার্ড ৩: সাইলেজ ও ফারমেন্টেশন -->
                            <div class="agro-card fade-in" onclick="loadPage('silage-fermentation')" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.06); background: var(--card-bg, #fff); cursor: pointer;">
                                <img src="https://i.postimg.cc/0NX1zq0j/Gemini-Generated-Image-zg3zybzg3zybzg3z.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="Silage">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #E65100; font-weight: 700; text-transform: uppercase;">খাদ্য প্রক্রিয়াজাতকরণ</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">সাইলেজ ও ফারমেন্টেশন</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">মোলাসেস ও কাঁচা ঘাসের সঠিক মিশ্রণে ফারমেন্টেশন প্রযুক্তি।</p>
                                </div>
                            </div>

                            <!-- কার্ড ৪: পানি সরবরাহ ও ড্রেনেজ -->
                            <div class="agro-card fade-in" onclick="loadPage('water-drainage')" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.06); background: var(--card-bg, #fff); cursor: pointer;">
                                <img src="https://i.postimg.cc/fRVtrMqd/Gemini-Generated-Image-qn0195qn0195qn01.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="Water System">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #0288D1; font-weight: 700; text-transform: uppercase;">খামার অবকাঠামো</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">পানি সরবরাহ ও ড্রেনেজ</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">ইন্ডিভিজুয়াল ওয়াটার লাইন, ভালভ ও উন্নত ড্রেনেজ ব্যবস্থা।</p>
                                </div>
                            </div>

                            <!-- কার্ড 5: দৈহিক ওজন মনিটরিং -->
                            <div class="agro-card fade-in" onclick="loadPage('water-drainage')" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.06); background: var(--card-bg, #fff); cursor: pointer;">
                                <img src="https://i.postimg.cc/0NYJvcYp/Gemini-Generated-Image-6os9v6os9v6os9v6.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="Weight Monitoring">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #0288D1; font-weight: 700; text-transform: uppercase;">ওজন ও বৃদ্ধি</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">দৈহিক ওজন মনিটরিং</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">ষাঁড় গরুর কাঙ্ক্ষিত ওজন বৃদ্ধির হার নিয়মিত যাচাই করা এবং দৈনন্দিন স্বাস্থ্য রেকর্ড সংরক্ষণ।</p>
                                </div>
                            </div>

                            <!-- কার্ড 6 -->
                            <div class="agro-card fade-in" onclick="loadPage('water-drainage')" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.06); background: var(--card-bg, #fff); cursor: pointer;">
                                <img src="https://i.postimg.cc/XN8LTZCK/Gemini-Generated-Image-t4srobt4srobt4sr.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="Bio Security">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #4CAF50; font-weight: 700; text-transform: uppercase;">পরিবেশ ও পরিচ্ছন্নতা</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">বায়োসিকিউরিটি ও বর্জ্য ব্যবস্থাপনা</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">খামারের সার্বিক পরিচ্ছন্নতা বজায় রাখা এবং জীবাণুনাশক স্প্রে করার মাধ্যমে রোগবালাই নিয়ন্ত্রণ।</p>
                                </div>
                            </div>

                            <!-- কার্ড 7 -->
                            <div class="agro-card fade-in" onclick="loadPage('water-drainage')" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.06); background: var(--card-bg, #fff); cursor: pointer;">
                                <img src="" style="width: 100%; height: 105px; object-fit: cover;" alt="Bio Security">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #4CAF50; font-weight: 700; text-transform: uppercase;">পরিবেশ ও পরিচ্ছন্নতা</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">বায়োসিকিউরিটি ও বর্জ্য ব্যবস্থাপনা</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">খামারের সার্বিক পরিচ্ছন্নতা বজায় রাখা এবং জীবাণুনাশক স্প্রে করার মাধ্যমে রোগবালাই নিয়ন্ত্রণ।</p>
                                </div>
                            </div>

                            <!-- কার্ড 8 -->
                            <div class="agro-card fade-in" onclick="loadPage('water-drainage')" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.06); background: var(--card-bg, #fff); cursor: pointer;">
                                <img src="" style="width: 100%; height: 105px; object-fit: cover;" alt="Bio Security">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #4CAF50; font-weight: 700; text-transform: uppercase;">পরিবেশ ও পরিচ্ছন্নতা</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">বায়োসিকিউরিটি ও বর্জ্য ব্যবস্থাপনা</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">খামারের সার্বিক পরিচ্ছন্নতা বজায় রাখা এবং জীবাণুনাশক স্প্রে করার মাধ্যমে রোগবালাই নিয়ন্ত্রণ।</p>
                                </div>
                            </div>

                            <!-- কার্ড 9 -->
                            <div class="agro-card fade-in" onclick="loadPage('water-drainage')" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.06); background: var(--card-bg, #fff); cursor: pointer;">
                                <img src="https://i.postimg.cc/q7WmxpSD/Gemini-Generated-Image-d8frlld8frlld8fr.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="Bio Security">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #4CAF50; font-weight: 700; text-transform: uppercase;">পুষ্টি ও সাপ্লিমেন্ট</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">প্রিমিক্স ও অ্যাডিটিভস</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">খাদ্যের সাথে সঠিক মাত্রায় টক্সিন বাইন্ডার, লাইভ ইস্ট, অ্যামিনো এসিড ও মিনারেল মিশ্রণ।</p>
                                </div>
                            </div>

                            <!-- কার্ড 10 -->
                            <div class="agro-card fade-in" onclick="loadPage('water-drainage')" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.06); background: var(--card-bg, #fff); cursor: pointer;">
                                <img src="https://i.postimg.cc/sDS3Y2LP/Gemini-Generated-Image-i606lai606lai606.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="Bio Security">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #4CAF50; font-weight: 700; text-transform: uppercase;">খামার পরিবেশ ও আরাম</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">ম্যাট ও হিট স্ট্রেস কন্ট্রোল</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">ফ্যান বা কুলিং সিস্টেম দিয়ে হিট স্ট্রেস কমানো এবং খুরের সুরক্ষায় রাবার ম্যাট ব্যবস্থাপনা।</p>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>`;
                break;
            case 'medicine-index':
                content = `
                <div class="fade-in" style="padding-bottom: 90px;">
                    ${subPageHeader('ভেটেরিনারি মেডিসিন ইনডেক্স')}
                    
                    <!-- স্টিকি সার্চ বার -->
                    <div style="padding: 0 15px; margin-bottom: 15px; position: sticky; top: 0; z-index: 10; background: var(--bg-color); padding-top: 10px; padding-bottom: 10px;">
                        <div style="position: relative;">
                            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                            <input type="text" id="medicine-search-input" onkeyup="window.searchMedicine()" placeholder="ওষুধের নাম বা কাজ লিখে খুঁজুন..." style="width: 100%; padding: 14px 15px 14px 45px; border-radius: 14px; border: 1.5px solid #E0E0E0; background: #fff; font-family: inherit; font-size: 0.95rem; outline: none; box-shadow: 0 4px 10px rgba(0,0,0,0.03); box-sizing: border-box;">
                        </div>
                    </div>

                    <!-- মেডিসিন লিস্ট কন্টেইনার -->
                    <div id="medicine-list-container" style="padding: 0 15px;">
                        <div style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--primary-main);"></i></div>
                    </div>
                </div>`;
                
                setTimeout(window.renderMedicineList, 100);
                break;

            case 'tmr-rationing':
                content = `
                <div class="fade-in" style="padding-bottom: 90px;">
                    ${subPageHeader('TMR রেশনিং পদ্ধতি')}
                    <div style="padding: 15px;">
                        <img src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=800&auto=format&fit=crop" style="width:100%; height:180px; object-fit:cover; border-radius:16px; margin-bottom:15px;">
                        <div class="agro-card" style="padding: 16px; border-left: 4px solid #795548;">
                            <h3 style="margin:0 0 10px 0; color: var(--text-main);">টিএমআর (Total Mixed Ration) কী?</h3>
                            <p style="font-size:0.88rem; color: var(--text-muted); line-height:1.6; margin-bottom:12px;">TMR হলো শুকনো খড়, সবুজ ঘাস, দানাদার খাদ্য, DDGS ও মোলাসেস নির্দিষ্ট অনুপাতে মেখে গরুকে একবারে পরিবেশন করার আধুনিক পদ্ধতি।</p>
                            <h4 style="margin:10px 0 6px 0; font-size:0.95rem; color:#795548;">উপকারিতা:</h4>
                            <ul style="margin:0; padding-left:18px; font-size:0.85rem; color:var(--text-muted); line-height:1.6;">
                                <li>গরু পছন্দের খাদ্য আলাদা করে খাওয়ার সুযোগ পায় পণ্ডিত না।</li>
                                <li>পাকস্থলীতে (Rumen) pH এর মান ভারসাম্যপূর্ণ থাকে।</li>
                                <li>দৈনিক ১.২ থেকে ১.৫ কেজি পর্যন্ত দৈহিক ওজন বৃদ্ধি পায়।</li>
                            </ul>
                        </div>
                    </div>
                </div>`;
                break;

            case 'vaccine-deworming':
                content = `
                <div class="fade-in" style="padding-bottom: 90px;">
                    ${subPageHeader('ভ্যাকসিনেশন ও ডিওয়ার্মিং')}
                    <div style="padding: 15px;">
                        <img src="https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?q=80&w=800&auto=format&fit=crop" style="width:100%; height:180px; object-fit:cover; border-radius:16px; margin-bottom:15px;">
                        <div class="agro-card" style="padding: 16px; border-left: 4px solid #4CAF50;">
                            <h3 style="margin:0 0 10px 0; color: var(--text-main);">স্বাস্থ্য সুরক্ষা নির্দেশিকা</h3>
                            <p style="font-size:0.88rem; color: var(--text-muted); line-height:1.6; margin-bottom:12px;">ফ্যাটেনিং শুরুর পূর্বে ষাঁড় গরুর অভ্যন্তরীণ ও বাহ্যিক প্যারাসাইট দূর করা এবং রোগ প্রতিরোধ ক্ষমতা তৈরি করা অত্যন্ত জরুরি।</p>
                            <h4 style="margin:10px 0 6px 0; font-size:0.95rem; color:#2E7D32;">করণীয় ধাপসমূহ:</h4>
                            <ul style="margin:0; padding-left:18px; font-size:0.85rem; color:var(--text-muted); line-height:1.6;">
                                <li><b>ডিওয়ার্মিং:</b> সঠিক মাত্রায় ব্রড-স্পেকট্রাম এনথেলেমিন্টিক বড়ি বা ইনজেকশন দিন।</li>
                                <li><b>লিভার প্রোটেকশন:</b> কৃমিনাশকের পর ৫-৭ দিন লিভার টনিক দেওয়া আবশ্যক।</li>
                                <li><b>টিকা সিডিউল:</b> সুস্থ হওয়ার পর খুরা রোগ (FMD), তড়কা ও বাদলা রোগের টিকা দিন।</li>
                            </ul>
                        </div>
                    </div>
                </div>`;
                break;

            case 'silage-fermentation':
                content = `
                <div class="fade-in" style="padding-bottom: 90px;">
                    ${subPageHeader('সাইলেজ ও ফারমেন্টেশন')}
                    <div style="padding: 15px;">
                        <img src="https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=800&auto=format&fit=crop" style="width:100%; height:180px; object-fit:cover; border-radius:16px; margin-bottom:15px;">
                        <div class="agro-card" style="padding: 16px; border-left: 4px solid #E65100;">
                            <h3 style="margin:0 0 10px 0; color: var(--text-main);">ভুট্টা সাইলেজ ও ফারমেন্টেশন পদ্ধতি</h3>
                            <p style="font-size:0.88rem; color: var(--text-muted); line-height:1.6; margin-bottom:12px;">কাঁচা ঘাস বা কাঁচা ভুট্টা গাছ কেটে বাতাসহীন অবস্থায় মোলাসেস ও ল্যাকটোব্যাসিলাস ব্যাকটেরিয়া দিয়ে ফারমেন্টেশন করাই হলো সাইলেজ।</p>
                            <h4 style="margin:10px 0 6px 0; font-size:0.95rem; color:#E65100;">প্রধান বৈশিষ্ট্য:</h4>
                            <ul style="margin:0; padding-left:18px; font-size:0.85rem; color:var(--text-muted); line-height:1.6;">
                                <li>বছরের যেকোনো সময় পুষ্টিকর সবুজ খাবারের ঘাটতি মেটায়।</li>
                                <li>ফারমেন্টেশনের ফলে হজমক্ষমতা বৃদ্ধি পায় এবং দ্রবণীয় কার্বোহাইড্রেট তৈরি হয়।</li>
                            </ul>
                        </div>
                    </div>
                </div>`;
                break;

            case 'water-drainage':
                content = `
                <div class="fade-in" style="padding-bottom: 90px;">
                    ${subPageHeader('পানি সরবরাহ ও ড্রেনেজ')}
                    <div style="padding: 15px;">
                        <img src="https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=80&w=800&auto=format&fit=crop" style="width:100%; height:180px; object-fit:cover; border-radius:16px; margin-bottom:15px;">
                        <div class="agro-card" style="padding: 16px; border-left: 4px solid #0288D1;">
                            <h3 style="margin:0 0 10px 0; color: var(--text-main);">শেড ও ওয়াটার লাইন ম্যানেজমেন্ট</h3>
                            <p style="font-size:0.88rem; color: var(--text-muted); line-height:1.6; margin-bottom:12px;">গরুর দ্রুত ওজন বৃদ্ধির জন্য প্রতি কেজি খাদ্য গ্রহণের বিপরীতে অন্তত ৪-৫ লিটার বিশুদ্ধ পানির প্রয়োজন।</p>
                            <h4 style="margin:10px 0 6px 0; font-size:0.95rem; color:#0288D1;">ইনফ্রাস্ট্রাকচার টিপস:</h4>
                            <ul style="margin:0; padding-left:18px; font-size:0.85rem; color:var(--text-muted); line-height:1.6;">
                                <li><b>ইন্ডিভিজুয়াল ওয়াটার লাইন:</b> প্রতিটি গরুর সামনে অটোমেটিক নিপল বা ভালভ ওয়াটার ট্রাফ রাখুন।</li>
                                <li><b>ড্রেনেজ সিস্টেম:</b> খামার শুকনো রাখতে ২% স্লোপযুক্ত ড্রেন রাখুন যাতে সহজে পানি ও বর্জ্য বেরিয়ে যায়।</li>
                            </ul>
                        </div>
                    </div>
                </div>`;
                break;

            case 'fattening-guide':
                content = `
                <div class="fade-in" style="padding-bottom: 90px;">
                    ${subPageHeader('প্রিমিয়াম ফ্যাটেনিং গাইড')}
                    
                    <div style="padding: 15px;">
                        <!-- হেডার কার্ড -->
                        <div style="background: linear-gradient(135deg, #1B5E20 0%, #388E3C 100%); color: white; padding: 20px; border-radius: 18px; margin-bottom: 15px; box-shadow: 0 8px 20px rgba(46,125,50,0.25);">
                            <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">বৈজ্ঞানিক পদ্ধতি</span>
                            <h2 style="margin: 8px 0 5px 0; font-size: 1.3rem; font-weight: 800;">ষাঁড় মোটাতাজাকরণ সম্পূর্ণ গাইড</h2>
                            <p style="margin: 0; font-size: 0.85rem; opacity: 0.92; line-height: 1.4;">দৈনিক ১.২ - ১.৫ কেজি দৈহিক ওজন বৃদ্ধির আবশ্যকীয় দিকনির্দেশনা</p>
                        </div>

                        <!-- ১. ডিওয়ার্মিং ও প্রাথমিক চিকিৎসা -->
                        <div class="agro-card" style="margin-bottom: 12px; padding: 16px; border-left: 4px solid #4CAF50;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <div style="width: 32px; height: 32px; background: rgba(76, 175, 80, 0.15); color: #2E7D32; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem;">১</div>
                                <h4 style="margin: 0; font-size: 1rem; color: var(--text-main); font-weight: 700;">কৃমিনাশক ও প্রাথমিক প্রস্তুতি</h4>
                            </div>
                            <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                                <li><b>কৃমিনাশক ডিল্ডিং:</b> নতুন ষাঁড় খামারে আনার পর প্রথম ৩-৫ দিনের মধ্যে এনডোপ্যারাসাইট (কলিজা কৃমি, ফিতা কৃমি) ও এক্টোপ্যারাসাইট (উঁকুন, আটালি) দূর করতে ভালো ব্রান্ডের এনথেলেমিন্টিক প্রয়োগ করুন।</li>
                                <li><b>লিভার টনিক ও মেটাবোলাইট:</b> কৃমিনাশক দেওয়ার ৩ দিন পর থেকে ৫-৭ দিন ভালো মানের লিভার টনিক এবং প্রয়োজনীয় জিংক/ভিটামিন এডি৩ই ইঞ্জেকশন প্রয়োগ করতে হবে।</li>
                            </ul>
                        </div>

                        <!-- ২. ভ্যাকসিনেশন সিডিউল -->
                        <div class="agro-card" style="margin-bottom: 12px; padding: 16px; border-left: 4px solid #2196F3;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <div style="width: 32px; height: 32px; background: rgba(33, 150, 243, 0.15); color: #1565C0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem;">২</div>
                                <h4 style="margin: 0; font-size: 1rem; color: var(--text-main); font-weight: 700;">ভ্যাকসিনেশন (রোগ প্রতিরোধ)</h4>
                            </div>
                            <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                                <li><b>রোগের টিকা:</b> কৃমিনাশক দেওয়ার ৭-১০ দিন পর গরু সম্পূর্ণ সুস্থ থাকা অবস্থায় খুরা রোগ (FMD), তড়কা (Anthrax) এবং বাদলা (Black Quarter) রোগের ভ্যাকসিন দিন।</li>
                                <li>ভ্যাকসিন দেওয়ার সময় শারীরিক তাপমাত্রা স্বাভাবিক থাকা জরুরি।</li>
                            </ul>
                        </div>

                        <!-- ৩. উন্নত খাদ্য ও রেশন (DDGS, Molasses & Protein) -->
                        <div class="agro-card" style="margin-bottom: 12px; padding: 16px; border-left: 4px solid #FF9800;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <div style="width: 32px; height: 32px; background: rgba(255, 152, 0, 0.15); color: #E65100; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem;">৩</div>
                                <h4 style="margin: 0; font-size: 1rem; color: var(--text-main); font-weight: 700;">বৈজ্ঞানিক খাদ্য ও প্রোটিন মিশ্রণ</h4>
                            </div>
                            <p style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 8px; font-weight: 600;">খাদ্যে ১৪% - ১৬% ক্রুড প্রোটিন (CP) এবং উচ্চ শক্তি নিশ্চিত করুন:</p>
                            <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                                <li><b>DDGS ও খৈল:</b> ভুট্টা ভাঙা, সয়াবিন খৈল ও DDGS এর সুষম অনুপাত তৈরি করে খাবারে উচ্চ প্রোটিন নিশ্চিত করুন।</li>
                                <li><b>মোলাসেস (ঝোল গুড়):</b> রুচি বাড়াতে এবং শক্তির উৎস হিসেবে দৈনিক খাবার তৈরিতে ৩%-৫% মোলাসেস মেশান।</li>
                                <li><b>সাইলেজ ও টিএমআর (TMR):</b> কাঁচা ঘাসের অভাব পূরণে ভুট্টা সাইলেজ ও শুকনো খড় একত্রে মেখে TMR (Total Mixed Ration) হিসেবে খেতে দিন।</li>
                            </ul>
                        </div>

                        <!-- ৪. পানি ও খামার অবকাঠামো -->
                        <div class="agro-card" style="margin-bottom: 15px; padding: 16px; border-left: 4px solid #795548;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <div style="width: 32px; height: 32px; background: rgba(121, 85, 72, 0.15); color: #795548; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem;">৪</div>
                                <h4 style="margin: 0; font-size: 1rem; color: var(--text-main); font-weight: 700;">পানি সরবরাহ ও শেড ব্যবস্থাপনা</h4>
                            </div>
                            <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                                <li><b>পানি লাইন:</b> প্রতিটি ষাঁড়ের কাছে ইন্ডিভিজুয়াল ওয়াটার পাত্র বা কন্ট্রোল ভালভ দিয়ে ২৪ ঘণ্টা বিশুদ্ধ ও ঠাণ্ডা পানি পানের ব্যবস্থা রাখুন।</li>
                                <li><b>ড্রেনেজ:</b> শেডের ফ্লোর সবসময় শুকনো রাখুন এবং পর্যাপ্ত আলো-বাতাস নিশ্চিত করুন।</li>
                            </ul>
                        </div>

                        <!-- বাটন -->
                        <button onclick="loadPage('cattle-profiles')" style="width: 100%; background: #4CAF50; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(76,175,80,0.3);">
                            <i class="fa-solid fa-cow"></i> আপনার গরুর প্রোফাইল ও ওজন চেক করুন
                        </button>
                    </div>
                </div>`;
                break;

            case 'calculator':
                content = `
                <div class="fade-in">
                    ${subPageHeader('সুষম খাদ্য ক্যালকুলেটর')}
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px; padding: 0 5px; line-height: 1.5;">
                        আপনার খামারের গবাদি পশুর জন্য সঠিক পুষ্টিমান সমৃদ্ধ খাদ্য তালিকা তৈরি করুন।
                    </p>
                    <div class="agro-card" style="padding: 24px 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.04);">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 1rem; margin-bottom: 12px; color: var(--text-main); font-weight: 600;">
                                <div style="background: rgba(46, 125, 50, 0.1); color: var(--primary-main); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-layer-group"></i></div>
                                খাদ্যের ক্যাটাগরি নির্বাচন
                            </label>
                            <div style="position: relative;">
                                <select id="food-cat" style="width: 100%; padding: 15px 15px; border: 1.5px solid #E0E0E0; border-radius: 12px; font-size: 1.05rem; background-color: #F9F9F9; color: var(--text-main); appearance: none; outline: none; font-family: inherit;">
                                    <option value="primary">১. প্রাথমিক বাজেট (সাধারণ)</option>
                                    <option value="standard">২. স্ট্যান্ডার্ড (মাঝারি)</option>
                                    <option value="premium" selected>৩. হাই-প্রোটিন (ফ্যাটেনিং)</option>
                                </select>
                                <i class="fa-solid fa-chevron-down" style="position: absolute; right: 18px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;"></i>
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 25px;">
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 1rem; margin-bottom: 12px; color: var(--text-main); font-weight: 600;">
                                <div style="background: rgba(255, 193, 7, 0.15); color: #E6A800; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-weight-scale"></i></div>
                                পরিমাণ নির্ধারণ
                            </label>
                            <div style="position: relative;">
                                <input type="number" id="total-kg" placeholder="যেমন: ১০০" value="100" style="width: 100%; padding: 15px 15px; border: 1.5px solid #E0E0E0; border-radius: 12px; font-size: 1.2rem; background-color: #F9F9F9; color: var(--text-main); outline: none; font-weight: 700; font-family: inherit;">
                                <span style="position: absolute; right: 18px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-weight: 600; font-size: 1rem;">কেজি</span>
                            </div>
                        </div>
                        <button class="btn-primary" onclick="window.showCalculationResult()" style="padding: 16px; font-size: 1.15rem; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 8px 20px rgba(46, 125, 50, 0.25);">
                            <i class="fa-solid fa-calculator"></i> হিসাব বের করুন
                        </button>
                    </div>
                    <div id="calc-result-area" style="display: none; margin-top: 20px;"></div>
                </div>`;
                break;

            case 'advice':
                content = `
                <div class="fade-in">
                    ${subPageHeader('চিকিৎসা ও ভেটেরিনারি')}
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px; padding: 0 5px; line-height: 1.5;">
                        গবাদি পশুর সাধারণ রোগব্যাধি, লক্ষণ এবং প্রাথমিক চিকিৎসার গাইডলাইন।
                    </p>

                    <div id="user-disease-list-view">
                        <div style="text-align:center; padding:30px;">
                            <i class="fa-solid fa-spinner fa-spin" style="font-size:2.5rem; color:var(--primary-main);"></i>
                            <p style="color: var(--text-muted); margin-top: 10px;">ডাটাবেস থেকে লোড হচ্ছে...</p>
                        </div>
                    </div>
                </div>`;
                setTimeout(window.renderUserDiseasesPage, 100);
                break;

            // ================= PAGE 3: আয়-ব্যয় ড্যাশবোর্ড =================
            case 'reports':
                content = `
                <div class="fade-in">
                    ${subPageHeader('আয় ও ব্যয়ের হিসাব')}
                    
                    <!-- চলতি মাসের আয়-ব্যয় সামারি কার্ড -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px;">
                        <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); border-radius: 12px; padding: 15px; color: white; text-align: center; box-shadow: 0 4px 10px rgba(76,175,80,0.3);">
                            <h4 style="margin: 0 0 5px 0; font-weight: 500; font-size: 0.85rem; opacity: 0.9;">চলতি মাসের আয়</h4>
                            <h2 id="monthly-total-income" style="margin: 0; font-size: 1.4rem; font-weight: 700;">৳ ০</h2>
                        </div>
                        <div style="background: linear-gradient(135deg, #E91E63, #C2185B); border-radius: 12px; padding: 15px; color: white; text-align: center; box-shadow: 0 4px 10px rgba(233,30,99,0.3);">
                            <h4 style="margin: 0 0 5px 0; font-weight: 500; font-size: 0.85rem; opacity: 0.9;">চলতি মাসের খরচ</h4>
                            <h2 id="monthly-total-expense" style="margin: 0; font-size: 1.4rem; font-weight: 700;">৳ ০</h2>
                        </div>
                    </div>

                    <!-- নতুন হিসাব যুক্ত করার ফর্ম -->
                    <div class="agro-card" style="margin: 15px; padding: 20px; border-top: 4px solid var(--primary-main);">
                        <h3 style="margin-top:0; font-size: 1.1rem; color:var(--text-main);"><i class="fa-solid fa-file-invoice-dollar" style="color:var(--primary-main);"></i> নতুন হিসাব যোগ করুন</h3>
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">হিসাবের ধরন</label>
                            <select id="exp-type" onchange="window.updateCategories()" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; margin-top:5px; font-family:inherit;">
                                <option value="খরচ">খরচ (Expense)</option>
                                <option value="আয়">আয় (Income)</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">খাত</label>
                            <select id="exp-category" onchange="window.toggleCattleSelect()" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; margin-top:5px; font-family:inherit;">
                                <option value="খাদ্য">খাদ্য (Feed)</option>
                                <option value="ওষুধ">ওষুধ (Medicine)</option>
                                <option value="ডাক্তার ভিজিট">ডাক্তার ভিজিট (Vet Visit)</option>
                                <option value="অন্যান্য খরচ">অন্যান্য খরচ</option>
                            </select>
                        </div>

                        <!-- গরু সিলেক্ট করার অপশন -->
                        <div id="cattle-select-div" class="form-group" style="margin-bottom: 12px; display: none;">
                            <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">কোন গরুর জন্য?</label>
                            <select id="exp-cattle" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; margin-top:5px; font-family:inherit;">
                                <option value="সব গরু">সব গরু / খামার</option>
                                <option value="গরু-১">গরু-১</option>
                                <option value="গরু-২">গরু-২</option>
                                <option value="গরু-৩">গরু-৩</option>
                                <option value="গরু-৪">গরু-৪</option>
                                <option value="গরু-৫">গরু-৫</option>
                                <option value="গরু-৬">গরু-৬</option>
                                <option value="গরু-৭">গরু-৭</option>
                                <option value="গরু-৮">গরু-৮</option>
                                <option value="গরু-৯">গরু-৯</option>
                                <option value="গরু-১০">গরু-১০</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">বিবরণ / নাম</label>
                            <input type="text" id="exp-details" placeholder="যেমন: ভুসি, নাপা, বা দুধ বিক্রি" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; margin-top:5px; font-family:inherit;">
                        </div>

                        <div class="form-group" style="margin-bottom: 15px;">
                            <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">টাকার পরিমাণ</label>
                            <input type="number" id="exp-amount" placeholder="৳ 00.00" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; margin-top:5px; font-family:inherit;">
                        </div>

                        <button id="save-expense-btn" onclick="window.saveExpense()" style="width: 100%; background: var(--primary-main); color: white; border: none; padding: 14px; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(46,125,50,0.3);">
                            হিসাব সেভ করুন
                        </button>
                    </div>

                    <!-- সাম্প্রতিক হিসাবের তালিকা -->
                    <div style="margin: 15px;">
                        <h3 style="font-size: 1.1rem; color:var(--text-main); margin-bottom:10px;"><i class="fa-solid fa-list-ul"></i> এই মাসের লেনদেন</h3>
                        <div id="expense-list-area">
                            <div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> লোড হচ্ছে...</div>
                        </div>
                    </div>
                </div>`;
                
                // পেজ লোড হওয়ার সাথে সাথেই ফায়ারবেস থেকে ডাটা নিয়ে আসার কল
                setTimeout(() => { window.loadExpensesLive(); }, 100);
                break;

            case 'cattle-profiles':
                let cattleCards = '';
                for(let i = 1; i <= 10; i++) {
                    cattleCards += `
                    <div onclick="window.viewCattle(${i})" class="agro-card fade-in" style="margin-bottom: 12px; padding: 15px; display: flex; align-items: center; gap: 15px; cursor: pointer; border-left: 4px solid #795548;">
                        <div style="width: 45px; height: 45px; background: #79554820; color: #795548; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.2rem;">
                            <i class="fa-solid fa-cow"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 id="list-title-${i}" style="margin: 0; font-size: 1.1rem; color: var(--text-main);">ষাঁড় গরু - ${i}</h3>
                            <p id="list-badge-${i}" style="margin: 2px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">প্রোফাইল দেখতে ক্লিক করুন</p>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                    </div>`;
                }

                content = `
                <div class="fade-in" style="padding-bottom: 80px;">
                    ${subPageHeader('গরুর প্রোফাইল ও ট্যাগিং')}
                    <div style="padding: 15px;">
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; text-align: center;">তালিকা থেকে যেকোনো ষাঁড় সিলেক্ট করে জাত, ওজন ও মেডিসিনের তথ্য দিন।</p>
                        ${cattleCards}
                    </div>
                </div>`;
                
                setTimeout(() => window.loadAllCattleSummary(), 100);
                break;

            case 'cattle-details':
                const cowId = window.currentCattleId || 1;
                const tagNo = 'TAG-' + String(cowId).padStart(3, '0'); 

                content = `
                <div class="fade-in" style="padding-bottom: 90px;">
                    ${subPageHeader('প্রোফাইল ও মেডিসিন আপডেট')}
                    
                    <div style="padding: 15px;" id="printable-profile">
                        <div class="agro-card" style="border-radius: 20px; overflow: hidden; padding: 0; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.08); background: var(--card-bg, #fff);">
                            
                            <div style="position: relative; height: 140px; background: #CFD8DC url('https://images.unsplash.com/photo-1545468843-27956a3a7ef8?q=80&w=600&auto=format&fit=crop') center/cover;">
                                <div style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.75); color: #fff; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; backdrop-filter: blur(4px);">
                                    <i class="fa-solid fa-tag" style="color: #FFEB3B;"></i> ${tagNo}
                                </div>
                            </div>
                            
                            <div style="padding: 0 20px 25px 20px; position: relative;">
                                <div style="width: 85px; height: 85px; background: #fff; border-radius: 50%; border: 4px solid #fff; box-shadow: 0 5px 15px rgba(0,0,0,0.15); position: absolute; top: -45px; left: 50%; transform: translateX(-50%); display: flex; justify-content: center; align-items: center; font-size: 2.2rem; color: #795548; overflow: hidden; cursor: pointer;" onclick="document.getElementById('cow-image-upload').click()">
                                    <img id="cow-profile-img" src="" alt="" style="width: 100%; height: 100%; object-fit: cover; display: none;">
                                    <i id="cow-default-icon" class="fa-solid fa-cow"></i>
                                    <div style="position: absolute; bottom: 0; background: rgba(0,0,0,0.5); width: 100%; height: 25px; display: flex; justify-content: center; align-items: center; color: white; font-size: 0.7rem;">
                                        <i class="fa-solid fa-camera"></i>
                                    </div>
                                </div>
                                <input type="file" id="cow-image-upload" accept="image/*" style="display: none;" onchange="window.handleCowImageUpload(event)">
                                
                                <div style="padding-top: 55px; display: flex; flex-direction: column; align-items: center; text-align: center;">
                                    <h2 id="details-cow-title" style="margin: 0 0 8px 0; font-size: 1.45rem; color: var(--text-main); font-weight: 800;">ষাঁড় গরু - ${cowId}</h2>
                                    <p id="cow-status-badge" style="margin: 0; font-size: 0.85rem; color: #1565C0; font-weight: 700; background: #E3F2FD; padding: 6px 14px; border-radius: 20px; display: inline-block; transition: 0.3s;">
                                        <i class="fa-solid fa-spinner fa-spin"></i> ডাটা লোড হচ্ছে...
                                    </p>
                                </div>

                                <div id="target-progress-container" style="display:none; margin-top: 15px; padding: 15px; background: rgba(103, 58, 183, 0.08); border-radius: 12px; border: 1px solid rgba(103, 58, 183, 0.2);">
                                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #673AB7; font-weight: 800; margin-bottom: 8px;">
                                        <span><i class="fa-solid fa-arrow-trend-up"></i> লক্ষ্যমাত্রা: <span id="progress-percent">0%</span></span>
                                        <span><span id="current-w-text">0</span> / <span id="target-w-text">0</span> কেজি</span>
                                    </div>
                                    <div style="width: 100%; background: #E1BEE7; border-radius: 10px; height: 10px; overflow: hidden;">
                                        <div id="progress-bar-fill" style="width: 0%; background: linear-gradient(90deg, #9C27B0, #E91E63); height: 100%; border-radius: 10px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                                    </div>
                                </div>

                                <hr style="border: 0; border-top: 1.5px dashed #E0E0E0; margin: 25px 0 20px 0;">

                                <div class="form-group" style="margin-bottom: 18px;">
                                    <label style="font-size: 0.9rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                        <i class="fa-solid fa-clipboard-list" style="color: #4CAF50; font-size: 1.1rem;"></i> গরুর নাম বা জাত
                                    </label>
                                    <input type="text" id="cow-name" placeholder="যেমন: শাহীওয়াল বা লালু" style="width: 100%; padding: 15px; border-radius: 14px; border: 1.5px solid #E0E0E0; background: #F9F9F9; outline:none; font-family:inherit; font-size: 1rem; box-sizing: border-box;">
                                </div>

                                <div class="form-group" style="margin-bottom: 18px;">
                                    <label style="font-size: 0.9rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                        <i class="fa-solid fa-heart-pulse" style="color: #F44336; font-size: 1.1rem;"></i> বর্তমান অবস্থা
                                    </label>
                                    <select id="cow-health-status" style="width: 100%; padding: 15px; border-radius: 14px; border: 1.5px solid #E0E0E0; background: #F9F9F9; outline:none; font-family:inherit; font-size: 1rem; box-sizing: border-box;">
                                        <option value="🟢 সুস্থ">🟢 সুস্থ (Healthy)</option>
                                        <option value="🟡 পর্যবেক্ষণে">🟡 পর্যবেক্ষণে (Observation)</option>
                                        <option value="🔵 বিক্রির জন্য প্রস্তুত">🔵 বিক্রির জন্য প্রস্তুত (Ready to Sell)</option>
                                    </select>
                                </div>

                                <div style="display: flex; gap: 10px; margin-bottom: 18px;">
                                    <div style="flex: 1;">
                                        <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px; display:block;">বর্তমান ওজন (কেজি)</label>
                                        <input type="number" id="cow-weight" placeholder="৩৫০" style="width: 100%; padding: 15px; border-radius: 14px; border: 1.5px solid #E0E0E0; background: #F9F9F9; outline:none; font-family:inherit; font-size: 1rem; box-sizing: border-box;">
                                    </div>
                                    <div style="flex: 1;">
                                        <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px; display:block;">টার্গেট ওজন (কেজি)</label>
                                        <input type="number" id="cow-target-weight" placeholder="৪০০" style="width: 100%; padding: 15px; border-radius: 14px; border: 1.5px solid #E0E0E0; background: #F9F9F9; outline:none; font-family:inherit; font-size: 1rem; box-sizing: border-box;">
                                    </div>
                                </div>

                                <hr style="border: 0; border-top: 1.5px dashed #E0E0E0; margin: 25px 0 20px 0;">
                                <h4 style="margin: 0 0 15px 0; font-size: 1.05rem; color: var(--text-main); font-weight: 800;"><i class="fa-solid fa-vial-virus" style="color: #E91E63; margin-right: 8px;"></i> নিয়মিত মেডিসিন ও রুটিন</h4>

                                <div style="background: rgba(233, 30, 99, 0.05); padding: 15px; border-radius: 14px; margin-bottom: 15px; border: 1px solid rgba(233, 30, 99, 0.1);">
                                    <label style="font-size: 0.9rem; font-weight: 700; color: #C2185B; margin-bottom: 10px; display: block;">ক্যাটাফস (Catophos)</label>
                                    <div style="display: flex; gap: 10px;">
                                        <div style="flex: 1;">
                                            <input type="text" id="cow-catophos-ml" placeholder="ডোজ: 10 ml" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; font-family:inherit; font-size: 0.9rem; box-sizing: border-box;">
                                        </div>
                                        <div style="flex: 1;">
                                            <select id="cow-catophos-freq" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; font-family:inherit; font-size: 0.9rem; box-sizing: border-box;">
                                                <option value="">রুটিন</option>
                                                <option value="সপ্তাহে ১ বার">সপ্তাহে ১ বার</option>
                                                <option value="সপ্তাহে ২ বার">সপ্তাহে ২ বার</option>
                                                <option value="সপ্তাহে ৩ বার">সপ্তাহে ৩ বার</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style="background: rgba(33, 150, 243, 0.05); padding: 15px; border-radius: 14px; margin-bottom: 15px; border: 1px solid rgba(33, 150, 243, 0.1);">
                                    <label style="font-size: 0.9rem; font-weight: 700; color: #1976D2; margin-bottom: 10px; display: block;">এমাইনোভিট প্লাস ভেট</label>
                                    <div style="display: flex; gap: 10px;">
                                        <div style="flex: 1;">
                                            <input type="text" id="cow-aminovit-ml" placeholder="ডোজ: 20 ml" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; font-family:inherit; font-size: 0.9rem; box-sizing: border-box;">
                                        </div>
                                        <div style="flex: 1;">
                                            <select id="cow-aminovit-freq" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; font-family:inherit; font-size: 0.9rem; box-sizing: border-box;">
                                                <option value="">রুটিন</option>
                                                <option value="সপ্তাহে ১ বার">সপ্তাহে ১ বার</option>
                                                <option value="সপ্তাহে ২ বার">সপ্তাহে ২ বার</option>
                                                <option value="প্রতিদিন">প্রতিদিন</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div class="form-group" style="margin-bottom: 15px;">
                                    <label style="font-size: 0.9rem; font-weight: 700; color: #D32F2F; margin-bottom: 10px; display: block;"><i class="fa-regular fa-bell"></i> পরবর্তী টিকার/কৃমিনাশক তারিখ</label>
                                    <input type="date" id="cow-next-vaccine" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; font-family:inherit; font-size: 0.9rem; box-sizing: border-box;">
                                </div>

                                <button id="save-cow-btn" onclick="window.saveCattleData(${cowId})" style="width: 100%; background: linear-gradient(135deg, #795548 0%, #5D4037 100%); color: white; border: none; padding: 16px; border-radius: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 6px 15px rgba(121,85,72,0.35); font-size: 1.05rem; display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 15px;">
                                    <i class="fa-solid fa-floppy-disk"></i> প্রোফাইল সেভ করুন
                                </button>
                                
                                <button onclick="window.downloadProfilePDF()" style="width: 100%; background: #E0E0E0; color: #424242; border: none; padding: 16px; border-radius: 14px; font-weight: 800; cursor: pointer; font-size: 1.05rem; display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 10px;">
                                    <i class="fa-solid fa-file-pdf"></i> প্রোফাইল রিপোর্ট (PDF)
                                </button>

                                <hr style="border: 0; border-top: 1.5px dashed #E0E0E0; margin: 25px 0 20px 0;">
                                <h4 style="margin: 0 0 12px 0; font-size: 1.05rem; color: var(--text-main); font-weight: 800; display: flex; align-items: center; gap: 8px;">
                                    <i class="fa-solid fa-clock-rotate-left" style="color: #673AB7;"></i> পূর্বের রেকর্ড ও হিস্ট্রি
                                </h4>
                                <div id="cow-history-list">
                                    <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;"><i class="fa-solid fa-spinner fa-spin"></i> হিস্ট্রি লোড হচ্ছে...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
                
                setTimeout(() => { if(window.loadCattleData) window.loadCattleData(cowId); }, 100);
                break;
                
            // ================= PAGE: অ্যাডমিন প্যানেল (Full Control) =================
            case 'admin':
                content = `
                <div class="fade-in">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <div style="display: flex; align-items: center;">
                            <button onclick="goToPage('more')" style="background: none; border: none; font-size: 1.2rem; color: var(--text-main); margin-right: 15px; cursor: pointer;"><i class="fa-solid fa-arrow-left"></i></button>
                            <h2 style="font-size: 1.4rem; color: #2c3e50; margin: 0; font-weight: 700;"><i class="fa-solid fa-user-shield"></i> অ্যাডমিন কন্ট্রোল</h2>
                        </div>
                        <span style="background: var(--danger); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; animation: pulse 2s infinite;">LIVE</span>
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none;" class="scroll-hide">
                        <button id="tab-market" onclick="window.switchAdminTab('market')" style="background: #2c3e50; color: white; border: none; padding: 10px 18px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; white-space: nowrap; cursor: pointer; transition: 0.3s;">বাজার দর</button>
                        <button id="tab-disease" onclick="window.switchAdminTab('disease')" style="background: #f1f3f4; color: var(--text-muted); border: none; padding: 10px 18px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; white-space: nowrap; cursor: pointer; transition: 0.3s;">রোগ-বালাই</button>
                        <button id="tab-formula" onclick="window.switchAdminTab('formula')" style="background: #f1f3f4; color: var(--text-muted); border: none; padding: 10px 18px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; white-space: nowrap; cursor: pointer; transition: 0.3s;">খাদ্য ফর্মুলা</button>
                        <button id="tab-users" onclick="window.switchAdminTab('users')" style="background: #f1f3f4; color: var(--text-muted); border: none; padding: 10px 18px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; white-space: nowrap; cursor: pointer; transition: 0.3s;">খামারি তালিকা</button>
                        <!-- নতুন প্রোটিন ট্যাব -->
                        <button id="tab-protein" onclick="window.switchAdminTab('protein')" style="background: #f1f3f4; color: var(--text-muted); border: none; padding: 10px 18px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; white-space: nowrap; cursor: pointer; transition: 0.3s;">প্রোটিন %</button>
                    </div>

                    <div id="admin-tab-content" style="min-height: 300px;"></div>
                </div>`;
                setTimeout(() => window.switchAdminTab('market'), 100);
                break;

            case 'reminder':
                content = `
                <div class="fade-in">
                    ${subPageHeader('রিমাইন্ডার ও টাস্ক')}
                    <div class="agro-card" style="border-left: 4px solid var(--accent); padding: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0; color: var(--text-main);">কৃমির ঔষধ দেওয়া</h4>
                                <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted);">আগামীকাল সকাল ৯:০০</p>
                            </div>
                            <i class="fa-regular fa-bell" style="color: var(--accent); font-size: 1.5rem;"></i>
                        </div>
                    </div>
                </div>`;
                break;

            case 'protein-calculator':
                content = `
                <div class="fade-in" style="padding-bottom: 240px;">
                    ${subPageHeader('খাদ্যের সম্পূর্ণ পুষ্টিমান ক্যালকুলেটর')}
                    
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px; padding: 0 15px; line-height: 1.5;">
                        ১০০ কেজি দানাদার মিশ্রণ তৈরির জন্য নিচের উপাদানগুলোর কেজি নির্ধারণ করুন। খাদ্যের মোট প্রোটিন, এনার্জি (TDN), ক্যালসিয়াম, ফসফরাস, খনিজ ও ভিটামিন স্বয়ংক্রিয়ভাবে হিসাব হয়ে যাবে।
                    </p>

                    <div class="agro-card" style="padding: 5px 15px; margin: 0; border-radius: 24px 24px 0 0;" id="protein-ingredients-list-view">
                        <div style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:#00796B;"></i></div>
                    </div>

                    <!-- স্টিকি বটম বার ও ডাউনলোড বাটন -->
                    <div style="position: fixed; bottom: 60px; left: 0; width: 100%; background: linear-gradient(135deg, #00796B 0%, #004D40 100%); color: white; padding: 12px 15px; box-sizing: border-box; box-shadow: 0 -5px 15px rgba(0,0,0,0.15); z-index: 1000; border-top-left-radius: 24px; border-top-right-radius: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px;">
                            <span style="font-size: 0.95rem; font-weight: 600;">মোট মিশ্রণ: <span id="calc-total-kg" style="color:#FFEB3B; font-size: 1.2rem;">0</span> / 100 কেজি</span>
                            
                            <!-- নতুন ডাউনলোড বাটন -->
                            <button onclick="window.downloadProteinReport()" style="background: #FFEB3B; color: #004D40; border: none; padding: 5px 12px; border-radius: 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 3px 8px rgba(0,0,0,0.2); transition: 0.2s;">
                                <i class="fa-solid fa-file-pdf"></i> রিপোর্ট সেভ
                            </button>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; gap: 10px 5px;">
                            <div>
                                <div style="font-size: 0.7rem; opacity: 0.85; margin-bottom: 2px;">প্রোটিন (CP)</div>
                                <div id="calc-total-cp" style="font-weight: 800; font-size: 1.05rem;">0.0%</div>
                            </div>
                            <div style="border-left: 1px solid rgba(255,255,255,0.2);">
                                <div style="font-size: 0.7rem; opacity: 0.85; margin-bottom: 2px;">এনার্জি (TDN)</div>
                                <div id="calc-total-tdn" style="font-weight: 800; font-size: 1.05rem;">0.0%</div>
                            </div>
                            <div style="border-left: 1px solid rgba(255,255,255,0.2);">
                                <div style="font-size: 0.7rem; opacity: 0.85; margin-bottom: 2px;">খনিজ (Min)</div>
                                <div id="calc-total-min" style="font-weight: 800; font-size: 1.05rem;">0.0%</div>
                            </div>
                            
                            <div>
                                <div style="font-size: 0.7rem; opacity: 0.85; margin-bottom: 2px;">ক্যালসিয়াম</div>
                                <div id="calc-total-ca" style="font-weight: 800; font-size: 1.05rem;">0.00%</div>
                            </div>
                            <div style="border-left: 1px solid rgba(255,255,255,0.2);">
                                <div style="font-size: 0.7rem; opacity: 0.85; margin-bottom: 2px;">ফসফরাস</div>
                                <div id="calc-total-p" style="font-weight: 800; font-size: 1.05rem;">0.00%</div>
                            </div>
                            <div style="border-left: 1px solid rgba(255,255,255,0.2);">
                                <div style="font-size: 0.7rem; opacity: 0.85; margin-bottom: 2px;">ভিটামিন</div>
                                <div id="calc-total-vit" style="font-weight: 800; font-size: 1.05rem;">0.0%</div>
                            </div>
                        </div>
                    </div>
                </div>`;
                
                setTimeout(window.renderProteinCalculatorPage, 100);
                break;

            case 'market':
                content = `
                <div class="fade-in">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h2 class="card-title" style="font-size: 1.5rem; margin: 0;">বাজার দর আপডেট</h2>
                        <!-- এডিট বাটনে অ্যাডমিন পিন মডাল যুক্ত করা হলো -->
                        <button onclick="window.showAdminPinModal()" style="background: rgba(46, 125, 50, 0.1); color: var(--primary-main); border: none; padding: 8px 15px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer;">
                            <i class="fa-solid fa-pen-to-square"></i> এডিট
                        </button>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">সকল খাদ্য উপাদানের বর্তমান বাজার মূল্য (প্রতি কেজি) নিচে দেওয়া হলো।</p>
                    
                    <!-- ডায়নামিক লিস্ট লোড হওয়ার কন্টেইনার -->
                    <div class="agro-card" style="padding: 5px 20px;" id="global-market-list-view">
                        <div style="text-align:center; padding:30px; color: var(--text-muted);">
                            <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 10px; color: var(--primary-main);"></i>
                            <p style="margin: 0;">লাইভ বাজার দর লোড হচ্ছে...</p>
                        </div>
                    </div>
                </div>`;
                
                // লাইভ ডাটাবেস থেকে মূল্য তালিকা রেন্ডার করার কমান্ড
                setTimeout(window.renderGlobalMarketPricesPage, 100);
                break;

            case 'more':
                let savedUser = null;
                try {
                    savedUser = JSON.parse(localStorage.getItem('agroUser'));
                } catch(e) {}

                let profileCardHTML = '';
                let authButtonHTML = '';

                // যদি ইউজার লগইন করা থাকে
                if (savedUser) {
                    let profileImageHTML = savedUser.photoURL 
                        ? `<img src="${savedUser.photoURL}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                        : `<i class="fa-solid fa-user-tie"></i>`;
                        
                    profileCardHTML = `
                        <div class="agro-card" style="display: flex; align-items: center; gap: 15px; padding: 20px; border-bottom: 3px solid var(--primary-main);">
                            <div style="width: 60px; height: 60px; background: rgba(46, 125, 50, 0.1); color: var(--primary-main); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; overflow: hidden;">
                                ${profileImageHTML}
                            </div>
                            <div>
                                <h3 style="margin: 0; color: var(--text-main); font-size: 1.3rem;">${savedUser.name || 'খামারি ভাই'}</h3>
                                <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">${savedUser.email || 'ডিজিটাল এগ্রো ফার্ম'}</p>
                            </div>
                        </div>`;
                        
                    authButtonHTML = `
                        <button onclick="window.showLogoutModal(); event.stopPropagation();" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border: none; background: transparent; width: 100%; cursor: pointer; text-align: left; box-sizing: border-box; font-family: inherit;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-right-from-bracket" style="color: var(--danger); font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--danger);">লগআউট করুন</span>
                            </div>
                        </button>`;
                } 
                // যদি ইউজার লগআউট অবস্থায় থাকে (অতিথি ইউজার)
                else {
                    profileCardHTML = `
                        <div class="agro-card" style="display: flex; align-items: center; justify-content: space-between; padding: 20px; border-bottom: 3px solid #FF9800; cursor: pointer;" onclick="window.loginWithGoogle()">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="width: 60px; height: 60px; background: rgba(255, 152, 0, 0.1); color: #FF9800; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem;">
                                    <i class="fa-solid fa-user-xmark"></i>
                                </div>
                                <div>
                                    <h3 style="margin: 0; color: var(--text-main); font-size: 1.2rem;">অতিথি ইউজার</h3>
                                    <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem;">অ্যাকাউন্ট যুক্ত করুন</p>
                                </div>
                            </div>
                            <i class="fa-solid fa-arrow-right-to-bracket" style="color: #FF9800; font-size: 1.5rem;"></i>
                        </div>`;
                        
                    authButtonHTML = `
                        <button onclick="window.loginWithGoogle(); event.stopPropagation();" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border: none; background: transparent; width: 100%; cursor: pointer; text-align: left; box-sizing: border-box; font-family: inherit;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-brands fa-google" style="color: #4CAF50; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: #4CAF50;">Google দিয়ে লগইন করুন</span>
                            </div>
                        </button>`;
                }

                content = `
                <div class="fade-in" style="padding-bottom: 80px;">
                    ${subPageHeader('মেন্যু ও সেটিংস')}
                    
                    <!-- প্রোফাইল কার্ড -->
                    ${profileCardHTML}

                    <h4 style="margin: 20px 0 10px 5px; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">খামার ব্যবস্থাপনা</h4>
                    
                    <!-- Buttons Container 1 -->
                    <div class="agro-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; background: var(--card-bg);">
                        <button onclick="goToPage('reports', 'more')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border: none; border-bottom: 1px solid #f0f0f0; background: transparent; width: 100%; cursor: pointer; text-align: left; box-sizing: border-box; font-family: inherit;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-file-invoice-dollar" style="color: #FF9800; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">আয়-ব্যয় ড্যাশবোর্ড</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                        </button>
                        
                        <button onclick="goToPage('cattle-profiles', 'more')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border: none; border-bottom: 1px solid #f0f0f0; background: transparent; width: 100%; cursor: pointer; text-align: left; box-sizing: border-box; font-family: inherit;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-cow" style="color: #795548; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">গরুর প্রোফাইল ও ট্যাগিং</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                        </button>

                        <button onclick="goToPage('reminder', 'more')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border: none; background: transparent; width: 100%; cursor: pointer; text-align: left; box-sizing: border-box; font-family: inherit;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-bell" style="color: #E91E63; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">অ্যালার্ট ও রিমাইন্ডার</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                        </button>
                    </div>

                    <h4 style="margin: 25px 0 10px 5px; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">সাপোর্ট ও সেটিংস</h4>
                    
                    <!-- Buttons Container 2 -->
                    <div class="agro-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; background: var(--card-bg);">
                        <button onclick="window.location.href='tel:16358'" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border: none; border-bottom: 1px solid #f0f0f0; background: transparent; width: 100%; cursor: pointer; text-align: left; box-sizing: border-box; font-family: inherit;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-headset" style="color: #03A9F4; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <div>
                                    <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main); display: block;">জরুরি হেল্পলাইন</span>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">কৃষি ও পশুসম্পদ কল সেন্টার</span>
                                </div>
                            </div>
                            <i class="fa-solid fa-phone" style="color: var(--success);"></i>
                        </button>

                        <button onclick="window.showAppAlert('শিগগিরই আসছে', 'টেলিগ্রাম অ্যালার্ট সেটআপ ফিচারটি শীঘ্রই যুক্ত করা হবে।', 'fa-telegram', '#0088cc'); event.stopPropagation();" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border: none; border-bottom: 1px solid #f0f0f0; background: transparent; width: 100%; cursor: pointer; text-align: left; box-sizing: border-box; font-family: inherit;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-brands fa-telegram" style="color: #0088cc; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">টেলিগ্রাম অ্যালার্ট সেটআপ</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                        </button>
                        
                        <!-- ডাইনামিক লগইন / লগআউট বাটন -->
                        ${authButtonHTML}
                    </div>
                    
                    <p style="text-align: center; color: #ccc; font-size: 0.85rem; margin-top: 25px;">ভার্সন ২.০.৩ | ডিজিটাল এগ্রো</p>
                </div>`;
                break;
        }

        contentArea.innerHTML = content;
    }

    // --- 8. Global Calculator Result Function (Bulletproof Version) ---
    window.showCalculationResult = function() {
        if(navigator.vibrate) navigator.vibrate(40);
        
        const kgInput = document.getElementById('total-kg').value;
        const targetKg = parseFloat(kgInput) || 0;
        const cat = document.getElementById('food-cat').value;
        
        if(targetKg <= 0) {
            alert('অনুগ্রহ করে সঠিক পরিমাণ দিন!');
            return;
        }

        // ১. ক্র্যাশ রোধে নিরাপদ ফর্মুলা ফেচিং
        let formulas = window.defaultAgroFormulas;
        try {
            const savedFormulas = JSON.parse(localStorage.getItem('agroFormulas'));
            if (savedFormulas && savedFormulas[cat] && savedFormulas[cat].main) {
                formulas = savedFormulas;
            }
        } catch(e) { }

        const selectedData = formulas[cat] || (window.defaultAgroFormulas ? window.defaultAgroFormulas['standard'] : null);
        
        if(!selectedData || !selectedData.main) {
            alert("ফর্মুলা লোড হতে সমস্যা হচ্ছে। অনুগ্রহ করে পেজ রিলোড দিন।");
            return;
        }

        // ২. গ্লোবাল প্রাইস না পেলে নিজস্ব প্রাইস ব্যবহার (Crash-Proof Logic)
        const fallbackPrices = {
            'ভুট্টা ভাঙা': 35, 'রাইস কুড়া/পলিস': 28, 'গমের ভুষি': 45, 'সয়াবিন মিল': 75, 'মসুর ডালের খোসা': 38,
            'সরিষার খৈল': 45, 'DDGS': 42, 'DORB': 25, 'রেপসিড (Rapeseed)': 40, 'শুঁটকি মাছের গুঁড়ো': 110,
            'লাইমস্টোন': 15, 'লবণ': 15, 'ভেজিটেবল ফ্যাট': 160, 'এমসিপি (MCP)': 65, 'খাবার সোডা': 80,
            'টক্সিন বাইন্ডার': 350, 'ইস্ট (Yeast)': 400, 'মেথিওনিন (Methionine)': 650, 'লাইসিন (Lysine)': 550,
            'ফাইটোজ এনজাইম': 450, 'ভিটামিন-মিনারেল প্রিমিক্স': 280, 'সাধারণ প্রিমিক্স': 150,
            'Growth Promoter': 550, 'রুমেন সাপোর্ট (Rumen)': 350, 'সিআর (Chromium)': 900
        };

        const savedPrices = JSON.parse(localStorage.getItem('agroFeedPrices')) || {};
        const multiplier = targetKg / 100;
        let totalCost = 0; 

        const renderItem = (item) => {
            const calculatedQty = item.qty * multiplier;
            
            // প্রথমে ইউজারের এডিট করা দাম, না পেলে গ্লোবাল, তাও না পেলে নিজস্ব ফলব্যাক
            let currentPrice = 0;
            if (savedPrices[item.name]) {
                currentPrice = savedPrices[item.name];
            } else if (window.defaultGlobalPrices && window.defaultGlobalPrices[item.name]) {
                currentPrice = window.defaultGlobalPrices[item.name];
            } else if (fallbackPrices[item.name]) {
                currentPrice = fallbackPrices[item.name];
            }

            const itemCost = calculatedQty * currentPrice;
            totalCost += itemCost;

            const displayQty = calculatedQty >= 1 
                ? `<strong style="color: var(--text-main); font-size: 1rem;">${calculatedQty.toFixed(2)} কেজি</strong>` 
                : `<strong style="color: var(--primary-main); font-size: 1rem;">${(calculatedQty * 1000).toFixed(0)} গ্রাম</strong>`;
                
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px dashed #ddd; padding-bottom: 10px;">
                    <div>
                        <span style="color: var(--text-muted); font-size: 0.95rem; display: block;">${item.name}</span>
                        <small style="color: #999; font-size: 0.75rem;">@ ৳${currentPrice}/কেজি</small>
                    </div>
                    <div style="text-align: right;">
                        ${displayQty}
                        <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">৳ ${itemCost.toFixed(0)}</div>
                    </div>
                </div>
            `;
        };

        const resultArea = document.getElementById('calc-result-area');
        
        const resultHTML = `
            <div class="agro-card fade-in" style="border-top: 4px solid var(--primary-main); padding: 20px;">
                <h3 style="margin-bottom: 15px; color: var(--primary-dark); font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-receipt"></i> ${targetKg} কেজির খাদ্য তালিকা
                </h3>
                
                <h4 style="color: var(--text-main); font-size: 1.05rem; margin-bottom: 10px;"><i class="fa-solid fa-wheat-awn"></i> মূল উপকরণসমূহ</h4>
                <div style="background: #F9F9F9; border-radius: 12px; padding: 15px 15px 5px 15px; margin-bottom: 20px; border: 1px solid #eee;">
                    ${selectedData.main.map(renderItem).join('')}
                </div>

                <h4 style="color: var(--text-main); font-size: 1.05rem; margin-bottom: 10px;"><i class="fa-solid fa-capsules"></i> পুষ্টি ও সাপ্লিমেন্ট</h4>
                <div style="background: rgba(255, 193, 7, 0.05); border-radius: 12px; padding: 15px 15px 5px 15px; margin-bottom: 15px; border: 1px solid rgba(255, 193, 7, 0.2);">
                    ${selectedData.supplements.map(renderItem).join('')}
                </div>
                
                <div style="background: linear-gradient(135deg, var(--primary-main), var(--primary-dark)); padding: 15px; border-radius: 12px; color: white; margin-top: 20px; box-shadow: 0 5px 15px rgba(46, 125, 50, 0.3);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">
                        <span style="font-size: 1rem; opacity: 0.9;">মোট পরিমাণ:</span>
                        <span style="font-size: 1.1rem; font-weight: 700;">${targetKg} কেজি</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">
                        <span style="font-size: 1rem; opacity: 0.9;">আনুমানিক মোট খরচ:</span>
                        <span style="font-size: 1.2rem; font-weight: 700; color: var(--accent);">৳ ${totalCost.toFixed(0)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 1rem; opacity: 0.9;">প্রতি কেজির দাম:</span>
                        <span style="font-size: 1.4rem; font-weight: 700;">৳ ${(totalCost / targetKg).toFixed(2)}</span>
                    </div>
                </div>
                
                <button onclick="if(window.saveCostToFinance) window.saveCostToFinance(${totalCost.toFixed(0)}, '${targetKg} কেজির খাদ্য মিশ্রণ তৈরি')" style="width: 100%; margin-top: 15px; background: transparent; border: 1.5px solid var(--primary-main); color: var(--primary-main); padding: 12px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.3s; display: flex; justify-content: center; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-plus"></i> এই খরচটি আয়-ব্যয়ে যোগ করুন
                </button>
            </div>
        `;
        
        resultArea.style.display = 'block';
        resultArea.innerHTML = resultHTML;
        
        setTimeout(() => {
            resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    };

    // Initialize App Load
    loadPage('home');

    // --- 9. Disease Details Modal (Popup) Function ---
    window.showDiseaseDetails = function(diseaseKey) {
        window.vibrate(40);
        
        const diseaseData = {
            fmd: {
                title: "খুরা রোগ (FMD)", icon: "fa-virus", color: "var(--danger)",
                content: `
                    <p style="margin-bottom:10px; line-height:1.6;"><strong style="color:var(--text-main);">লক্ষণ:</strong> গরুর শরীরের তাপমাত্রা বেড়ে যায়। মুখ, জিহ্বা এবং পায়ের ক্ষুরে ঘা হয়। মুখ থেকে প্রচুর লালা ঝরে।</p>
                    <h4 style="color:var(--text-main); margin:15px 0 10px 0; border-bottom:1px solid #eee; padding-bottom:5px;"><i class="fa-solid fa-notes-medical" style="color:var(--primary-main);"></i> চিকিৎসা ও ঔষধ</h4>
                    <ul style="margin-left: 20px; line-height: 1.8; color:var(--text-muted); font-size:0.95rem;">
                        <li>পটাশ পানি দিয়ে ঘায়ের স্থান দিনে ২-৩ বার ধুয়ে দিতে হবে।</li>
                        <li>সেকেন্ডারি ইনফেকশন রোধ করতে <strong>কম্বিপেন ভেট (Combipen Vet)</strong> ইনজেকশন ব্যবহার করা যেতে পারে।</li>
                        <li>শারীরিক দুর্বলতা কাটাতে <strong>অ্যামাইনো ভেট (Amino Vet)</strong> এবং <strong>ক্যাটাফস (Catafos)</strong> প্রয়োগ করা বেশ কার্যকরী।</li>
                    </ul>
                    <div style="background:rgba(217, 48, 37, 0.1); padding:10px; border-radius:8px; margin-top:15px;">
                        <p style="color:var(--danger); font-size:0.85rem; margin:0; line-height:1.5;">* সতর্কতা: যেকোনো অ্যান্টিবায়োটিক বা ইনজেকশন প্রয়োগের আগে অবশ্যই রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের পরামর্শ নিন।</p>
                    </div>
                `
            },
            lsd: {
                title: "লাম্পি স্কিন ডিজিজ (LSD)", icon: "fa-bugs", color: "#F57C00",
                content: `
                    <p style="margin-bottom:10px; line-height:1.6;"><strong style="color:var(--text-main);">লক্ষণ:</strong> গরুর গায়ে গুটি বা চাকা চাকা দাগ দেখা দেয়। তীব্র জ্বর হয়, পা ফুলে যেতে পারে।</p>
                    <h4 style="color:var(--text-main); margin:15px 0 10px 0; border-bottom:1px solid #eee; padding-bottom:5px;"><i class="fa-solid fa-notes-medical" style="color:var(--primary-main);"></i> চিকিৎসা ও ঔষধ</h4>
                    <ul style="margin-left: 20px; line-height: 1.8; color:var(--text-muted); font-size:0.95rem;">
                        <li>আক্রান্ত গরুকে মশারি দিয়ে আলাদা করে রাখতে হবে।</li>
                        <li>জ্বর ও ব্যথা কমানোর জন্য <strong>রেনাডেক্স ভেট (Renadex Vet)</strong> ট্যাবলেট খাওয়াতে হবে।</li>
                        <li>গুটি ফেটে ঘা হলে সেখানে পভিসেপ অয়েন্টমেন্ট লাগাতে হবে।</li>
                    </ul>
                    <div style="background:rgba(217, 48, 37, 0.1); padding:10px; border-radius:8px; margin-top:15px;">
                        <p style="color:var(--danger); font-size:0.85rem; margin:0; line-height:1.5;">* সতর্কতা: যেকোনো অ্যান্টিবায়োটিক বা ইনজেকশন প্রয়োগের আগে অবশ্যই রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের পরামর্শ নিন।</p>
                    </div>
                `
            },
            anthrax: {
                title: "তড়কা (Anthrax)", icon: "fa-skull-crossbones", color: "#9C27B0",
                content: `
                    <p style="margin-bottom:10px; line-height:1.6;"><strong style="color:var(--text-main);">লক্ষণ:</strong> ১০৬-১০৭ ডিগ্রি জ্বর, শ্বাসকষ্ট, পেট ফুলে যাওয়া। মৃত্যুর পর বিভিন্ন ছিদ্র দিয়ে আলকাতরার মতো কালো রক্ত বের হয়।</p>
                    <h4 style="color:var(--text-main); margin:15px 0 10px 0; border-bottom:1px solid #eee; padding-bottom:5px;"><i class="fa-solid fa-notes-medical" style="color:var(--primary-main);"></i> চিকিৎসা ও ঔষধ</h4>
                    <ul style="margin-left: 20px; line-height: 1.8; color:var(--text-muted); font-size:0.95rem;">
                        <li>লক্ষণ দেখা দিলে দ্রুত চিকিৎসকের মাধ্যমে পেনিসিলিন ইনজেকশন দিতে হবে।</li>
                        <li>জ্বর কমাতে <strong>রেনাডেক্স ভেট (Renadex Vet)</strong> ব্যবহার করা যায়।</li>
                        <li><strong>সতর্কতা:</strong> এটি মানুষের শরীরেও ছড়াতে পারে। মৃত পশুকে ৩-৪ ফুট মাটির নিচে চুন দিয়ে পুঁতে ফেলতে হবে।</li>
                    </ul>
                    <div style="background:rgba(217, 48, 37, 0.1); padding:10px; border-radius:8px; margin-top:15px;">
                        <p style="color:var(--danger); font-size:0.85rem; margin:0; line-height:1.5;">* সতর্কতা: যেকোনো অ্যান্টিবায়োটিক বা ইনজেকশন প্রয়োগের আগে অবশ্যই রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের পরামর্শ নিন।</p>
                    </div>
                 `
            },
            bq: {
                title: "বাদলা (Black Quarter)", icon: "fa-cow", color: "#795548",
                content: `
                    <p style="margin-bottom:10px; line-height:1.6;"><strong style="color:var(--text-main);">লক্ষণ:</strong> পেছনের বা সামনের পায়ের উপরের অংশের পেশি ফুলে যায়। গরুর খোঁড়াতে থাকে এবং চাপ দিলে পচপচ শব্দ হয়।</p>
                    <h4 style="color:var(--text-main); margin:15px 0 10px 0; border-bottom:1px solid #eee; padding-bottom:5px;"><i class="fa-solid fa-notes-medical" style="color:var(--primary-main);"></i> চিকিৎসা ও ঔষধ</h4>
                    <ul style="margin-left: 20px; line-height: 1.8; color:var(--text-muted); font-size:0.95rem;">
                        <li>অক্সিটেট্রাসাইক্লিন গ্রুপের অ্যান্টিবায়োটিক প্রয়োগ করতে হবে।</li>
                        <li>জ্বর ও ব্যথার জন্য <strong>রেনাডেক্স ভেট</strong> খাওয়াতে পারেন।</li>
                        <li>রোগ সেরে ওঠার পর পশুর স্বাস্থ্য ও পুষ্টির ঘাটতি পূরণে <strong>প্রোটিমিন ভেট (Protimin Vet)</strong> নিয়মিত খাওয়ালে দ্রুত স্বাস্থ্য ফিরে পাবে।</li>
                    </ul>
                    <div style="background:rgba(217, 48, 37, 0.1); padding:10px; border-radius:8px; margin-top:15px;">
                        <p style="color:var(--danger); font-size:0.85rem; margin:0; line-height:1.5;">* সতর্কতা: যেকোনো অ্যান্টিবায়োটিক বা ইনজেকশন প্রয়োগের আগে অবশ্যই রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের পরামর্শ নিন।</p>
                    </div>
                 `
            },
            mastitis: {
                title: "ওলান পাকা (Mastitis)", icon: "fa-droplet", color: "#E91E63",
                content: `
                    <p style="margin-bottom:10px; line-height:1.6;"><strong style="color:var(--text-main);">লক্ষণ:</strong> গাভীর ওলান গরম ও লাল হয়ে ফুলে যায়। হাত দিলে গাভী ব্যথা পায়, দুধ ছানা বা রক্তমিশ্রিত হতে পারে।</p>
                    <h4 style="color:var(--text-main); margin:15px 0 10px 0; border-bottom:1px solid #eee; padding-bottom:5px;"><i class="fa-solid fa-notes-medical" style="color:var(--primary-main);"></i> চিকিৎসা ও ঔষধ</h4>
                    <ul style="margin-left: 20px; line-height: 1.8; color:var(--text-muted); font-size:0.95rem;">
                        <li>দ্রুত চিকিৎসকের পরামর্শে সঠিক অ্যান্টিবায়োটিক (যেমন: সেফট্রিয়াক্সন) প্রয়োগ করতে হবে।</li>
                        <li>আক্রান্ত ওলান সম্পূর্ণ খালি করে অ্যান্টি-ম্যাসটাইটিস টিউব ব্যবহার করতে হবে।</li>
                        <li>দোহন করার আগে ও পরে ওলান পটাশ পানি দিয়ে ধুয়ে শুকিয়ে নিতে হবে।</li>
                    </ul>
                    <div style="background:rgba(217, 48, 37, 0.1); padding:10px; border-radius:8px; margin-top:15px;">
                        <p style="color:var(--danger); font-size:0.85rem; margin:0; line-height:1.5;">* সতর্কতা: যেকোনো অ্যান্টিবায়োটিক বা ইনজেকশন প্রয়োগের আগে অবশ্যই রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের পরামর্শ নিন।</p>
                    </div>
                 `
            }
        };

        const data = diseaseData[diseaseKey];
        if(!data) return;

        const modalHTML = `
            <div id="disease-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 9999; display: flex; justify-content: center; align-items: flex-end; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 100%; max-height: 85vh; border-top-left-radius: 24px; border-top-right-radius: 24px; padding: 25px 20px; overflow-y: auto; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 -10px 25px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: ${data.color}; font-size: 1.4rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid ${data.icon}"></i> ${data.title}
                        </h2>
                        <button onclick="closeDiseaseModal()" style="background: #f1f3f4; border: none; width: 35px; height: 35px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: var(--text-muted); font-size: 1.2rem; cursor: pointer;">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div style="font-size: 1rem; color: var(--text-main);">
                        ${data.content}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('disease-modal');
        const modalBox = modal.querySelector('div');

        setTimeout(() => {
            modal.style.opacity = '1';
            modalBox.style.transform = 'translateY(0)';
        }, 10);
    };

    window.closeDiseaseModal = function() {
        const modal = document.getElementById('disease-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'translateY(100%)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    // --- 10. Premium Logout Modal ---
    window.showLogoutModal = function() {
        if (navigator.vibrate) navigator.vibrate(40);
        
        const modalHTML = `
            <div id="logout-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div style="width: 65px; height: 65px; background: rgba(217, 48, 37, 0.1); color: var(--danger); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; margin: 0 auto 15px auto;">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </div>
                    <h3 style="color: var(--text-main); font-size: 1.3rem; margin-bottom: 10px; font-weight: 700;">লগআউট নিশ্চিত করুন</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 25px; line-height: 1.5;">আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্ট থেকে বের হয়ে যেতে চান?</p>
                    <div style="display: flex; gap: 12px;">
                        <button onclick="window.closeLogoutModal()" style="flex: 1; background: #f1f3f4; color: var(--text-muted); border: none; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.2s;">বাতিল</button>
                        <button onclick="window.confirmLogout()" style="flex: 1; background: var(--danger); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(217, 48, 37, 0.3); transition: 0.2s;">লগআউট</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('logout-modal');
        const modalBox = modal.querySelector('div');

        setTimeout(() => {
            modal.style.opacity = '1';
            modalBox.style.transform = 'scale(1)';
        }, 10);
    };

    window.closeLogoutModal = function() {
        const modal = document.getElementById('logout-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    window.confirmLogout = function() {
        if (navigator.vibrate) navigator.vibrate(50);
        window.closeLogoutModal();
        setTimeout(() => {
            window.location.reload(); 
        }, 300);
    };

    // --- 11. Finance Logic (Premium Modals) ---

    window.showFinanceModal = function() {
        if (navigator.vibrate) navigator.vibrate(40);
        const modalHTML = `
            <div id="finance-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 90%; max-width: 380px; border-radius: 24px; padding: 25px 20px; transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: var(--text-main); font-size: 1.3rem; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-wallet" style="color: var(--primary-main);"></i> নতুন হিসাব
                        </h3>
                        <button onclick="window.closeFinanceModal()" style="background: #f1f3f4; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: var(--text-muted); font-size: 1.1rem; cursor: pointer;">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; margin-bottom: 8px; display: block; color: var(--text-main); font-weight: 600;">লেনদেনের ধরন</label>
                        <select id="modal-fin-type" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; outline: none; background: #F9F9F9; font-size: 1rem; font-family: inherit;">
                            <option value="expense">ব্যয় (খাবার/ওষুধ কেনা)</option>
                            <option value="income">আয় (দুধ/গরু/গোবর বিক্রি)</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; margin-bottom: 8px; display: block; color: var(--text-main); font-weight: 600;">পরিমাণ (৳)</label>
                        <input type="number" id="modal-fin-amount" placeholder="যেমন: 5000" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; outline: none; background: #F9F9F9; font-size: 1.1rem; font-weight: 700; font-family: inherit;">
                    </div>
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="font-size: 0.95rem; margin-bottom: 8px; display: block; color: var(--text-main); font-weight: 600;">বিবরণ (ঐচ্ছিক)</label>
                        <input type="text" id="modal-fin-note" placeholder="যেমন: ২ বস্তা ভুষি কেনা" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; outline: none; background: #F9F9F9; font-size: 1rem; font-family: inherit;">
                    </div>
                    <button onclick="window.saveTransaction()" style="width: 100%; background: var(--primary-main); color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3); transition: 0.2s;">
                        সেভ করুন
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('finance-modal');
        const modalBox = modal.querySelector('div');

        setTimeout(() => {
            modal.style.opacity = '1';
            modalBox.style.transform = 'scale(1)';
        }, 10);
    };

    window.closeFinanceModal = function() {
        const modal = document.getElementById('finance-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    window.saveTransaction = function() {
        const type = document.getElementById('modal-fin-type').value;
        const amount = parseFloat(document.getElementById('modal-fin-amount').value);
        const note = document.getElementById('modal-fin-note').value || (type === 'income' ? 'আয়' : 'ব্যয়');
        
        if(!amount || amount <= 0) return alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন!');

        const transactions = JSON.parse(localStorage.getItem('agroFinance')) || [];
        transactions.unshift({ id: Date.now(), type, amount, note, date: new Date().toLocaleDateString('bn-BD') });
        localStorage.setItem('agroFinance', JSON.stringify(transactions));
        
        window.vibrate(40);
        window.closeFinanceModal();
        window.renderTransactions();
    };

    window.saveCostToFinance = function(amount, note) {
        const transactions = JSON.parse(localStorage.getItem('agroFinance')) || [];
        transactions.unshift({ id: Date.now(), type: 'expense', amount: amount, note: note, date: new Date().toLocaleDateString('bn-BD') });
        localStorage.setItem('agroFinance', JSON.stringify(transactions));
        window.vibrate(50);
        alert('সফলভাবে আয়-ব্যয় ড্যাশবোর্ডে যোগ করা হয়েছে!');
        window.goToPage('reports', 'more');
    };

    window.renderTransactions = function() {
        const listArea = document.getElementById('transaction-list');
        const incArea = document.getElementById('total-income');
        const expArea = document.getElementById('total-expense');
        if(!listArea) return;

        const transactions = JSON.parse(localStorage.getItem('agroFinance')) || [];
        let totalInc = 0, totalExp = 0, html = '';

        if(transactions.length === 0) {
            html = '<div style="text-align:center; padding: 30px 10px;"><i class="fa-solid fa-file-invoice" style="font-size: 3rem; color: #ddd; margin-bottom: 10px;"></i><p style="color:var(--text-muted); font-size:0.95rem;">কোনো লেনদেন পাওয়া যায়নি।</p></div>';
        } else {
            transactions.forEach(t => {
                const isInc = t.type === 'income';
                if(isInc) totalInc += t.amount; else totalExp += t.amount;
                const color = isInc ? 'var(--success)' : 'var(--danger)';
                const icon = isInc ? 'fa-arrow-down' : 'fa-arrow-up';
                
                html += `
                    <div class="fade-in" style="display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); padding: 15px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); border: 1px solid #f0f0f0;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 42px; height: 42px; border-radius: 50%; background: ${isInc ? '#e8f5e9' : '#ffebee'}; color: ${color}; display: flex; justify-content: center; align-items: center; font-size: 1.1rem;"><i class="fa-solid ${icon}"></i></div>
                            <div>
                                <h4 style="margin: 0; color: var(--text-main); font-size: 1.05rem; font-weight: 600;">${t.note}</h4>
                                <p style="margin: 0; color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">${t.date}</p>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <strong style="color: ${color}; font-size: 1.1rem;">${isInc ? '+' : '-'}৳ ${t.amount}</strong>
                            <button onclick="window.showDeleteConfirmModal(${t.id})" style="display: block; margin-left: auto; background: none; border: none; color: #ccc; margin-top: 8px; cursor: pointer; transition: 0.2s;"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>`;
            });
        }
        listArea.innerHTML = html;
        if(incArea) incArea.innerText = `৳ ${totalInc}`;
        if(expArea) expArea.innerText = `৳ ${totalExp}`;
    };

    window.showDeleteConfirmModal = function(id) {
        if (navigator.vibrate) navigator.vibrate(40);
        const modalHTML = `
            <div id="delete-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div style="width: 65px; height: 65px; background: rgba(217, 48, 37, 0.1); color: var(--danger); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; margin: 0 auto 15px auto;"><i class="fa-solid fa-trash-can"></i></div>
                    <h3 style="color: var(--text-main); font-size: 1.3rem; margin-bottom: 10px; font-weight: 700;">হিসাবটি মুছতে চান?</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 25px; line-height: 1.5;">এই লেনদেনটি আপনার আয়-ব্যয়ের হিসাব থেকে চিরতরে মুছে যাবে।</p>
                    <div style="display: flex; gap: 12px;">
                        <button onclick="window.closeDeleteModal()" style="flex: 1; background: #f1f3f4; color: var(--text-muted); border: none; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.2s;">বাতিল</button>
                        <button onclick="window.deleteTransaction(${id})" style="flex: 1; background: var(--danger); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(217, 48, 37, 0.3); transition: 0.2s;">মুছুন</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('delete-modal');
        const modalBox = modal.querySelector('div');

        setTimeout(() => {
            modal.style.opacity = '1';
            modalBox.style.transform = 'scale(1)';
        }, 10);
    }

    window.closeDeleteModal = function() {
        const modal = document.getElementById('delete-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    }

    window.deleteTransaction = function(id) {
        window.vibrate(40);
        let transactions = JSON.parse(localStorage.getItem('agroFinance')) || [];
        localStorage.setItem('agroFinance', JSON.stringify(transactions.filter(t => t.id !== id)));
        window.closeDeleteModal();
        window.renderTransactions();
    };

    // --- ১৪. সেন্ট্রাল অ্যাডমিন প্যানেল লজিক (Full Control Hub) ---
    
    window.showAdminPinModal = function() {
        window.vibrate(40);
        const modalHTML = `
            <div id="admin-pin-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.9); transition: transform 0.3s ease;">
                    <div style="width: 65px; height: 65px; background: rgba(44, 62, 80, 0.1); color: #2c3e50; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; margin: 0 auto 15px auto;"><i class="fa-solid fa-lock"></i></div>
                    <h3 style="color: var(--text-main); font-size: 1.3rem; margin-bottom: 10px; font-weight: 700;">সিকিউরিটি পিন</h3>
                    <input type="password" id="admin-pin-input" placeholder="****" style="width: 100%; padding: 15px; border-radius: 12px; border: 1.5px solid #E0E0E0; text-align: center; font-size: 1.5rem; letter-spacing: 5px; margin-bottom: 20px; outline: none; background: #F9F9F9; font-weight: 700;">
                    <div style="display: flex; gap: 12px;">
                        <button onclick="window.closeAdminPinModal()" style="flex: 1; background: #f1f3f4; color: var(--text-muted); border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer;">বাতিল</button>
                        <button onclick="window.verifyAdminPin()" style="flex: 1; background: #2c3e50; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer;">প্রবেশ</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => {
            document.getElementById('admin-pin-modal').style.opacity = '1';
            document.getElementById('admin-pin-modal').querySelector('div').style.transform = 'scale(1)';
        }, 10);
    };

    window.closeAdminPinModal = function() {
        const modal = document.getElementById('admin-pin-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    window.verifyAdminPin = function() {
        window.vibrate(40);
        const pin = document.getElementById('admin-pin-input').value;
        if(pin === "1234") {
            window.closeAdminPinModal();
            window.goToPage('admin', 'more');
        } else {
            alert("ভুল পিন!");
        }
    };

    window.switchAdminTab = function(tabName) {
        window.vibrate(30);
        // নতুন 'protein' ট্যাব অ্যারেতে যোগ করা হলো
        ['market', 'disease', 'formula', 'users', 'protein'].forEach(tab => {
            const btn = document.getElementById(`tab-${tab}`);
            if(btn) {
                btn.style.background = '#f1f3f4';
                btn.style.color = 'var(--text-muted)';
            }
        });
        
        const activeBtn = document.getElementById(`tab-${tabName}`);
        if(activeBtn) {
            activeBtn.style.background = '#2c3e50';
            activeBtn.style.color = 'white';
        }

        const contentArea = document.getElementById('admin-tab-content');
        contentArea.innerHTML = '<div style="text-align:center; padding:50px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--primary-main);"></i></div>';

        setTimeout(() => {
            if(tabName === 'market') window.renderAdminMarketTab(contentArea);
            else if(tabName === 'disease') window.renderAdminDiseaseTab(contentArea);
            else if(tabName === 'users') window.renderAdminUsersTab(contentArea);
            else if(tabName === 'formula') window.renderAdminFormulaTab(contentArea);
            else if(tabName === 'protein') window.renderAdminProteinTab(contentArea); // নতুন প্রোটিন প্যানেল রেন্ডার হবে
        }, 200);
    };

    const defaultGlobalPrices = {
        'ভুট্টা ভাঙা': 35, 'রাইস কুড়া/পলিস': 28, 'গমের ভুষি': 45, 'সয়াবিন মিল': 75, 'মসুর ডালের খোসা': 38,
        'সরিষার খৈল': 45, 'DDGS': 42, 'DORB': 25, 'রেপসিড (Rapeseed)': 40, 'শুঁটকি মাছের গুঁড়ো': 110,
        'লাইমস্টোন': 15, 'লবণ': 15, 'ভেজিটেবল ফ্যাট': 160, 'এমসিপি (MCP)': 65, 'খাবার সোডা': 80,
        'টক্সিন বাইন্ডার': 350, 'ইস্ট (Yeast)': 400, 'মেথিওনিন (Methionine)': 650, 'লাইসিন (Lysine)': 550,
        'ফাইটোজ এনজাইম': 450, 'ভিটামিন-মিনারেল প্রিমিক্স': 280, 'সাধারণ প্রিমিক্স': 150,
        'Growth Promoter': 550, 'রুমেন সাপোর্ট (Rumen)': 350, 'সিআর (Chromium)': 900
    };

    window.renderAdminMarketTab = function(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="font-size: 1.1rem; color: var(--text-main); margin: 0;">লাইভ গ্লোবাল মূল্য নিয়ন্ত্রণ</h3>
            </div>
            <div class="agro-card" style="padding: 5px 15px;" id="admin-market-list"></div>
        `;
        window.loadAdminMarketPrices();
    };

    window.loadAdminMarketPrices = function() {
        const listArea = document.getElementById('admin-market-list');
        if(!listArea) return;

        if (window.db && window.fbFirestore) {
            const { collection, onSnapshot } = window.fbFirestore;
            
            onSnapshot(collection(window.db, "market_prices"), (snapshot) => {
                let html = '';
                let serverPrices = {};
                let deletedItems = {}; 
                
    // ডিলিট করা আইটেমের ট্র্যাক রাখা হচ্ছে
                
                snapshot.forEach((doc) => {
                    if(doc.data().deleted) {
                        deletedItems[doc.id] = true;
                    } else {
                        serverPrices[doc.id] = doc.data().price;
                    }
                });

                Object.keys(defaultGlobalPrices).forEach(item => {
                    if(deletedItems[item]) return; // ডিলিট করা থাকলে লিস্টে দেখাবে না

                    const currentPrice = serverPrices[item] !== undefined ? serverPrices[item] : defaultGlobalPrices[item];
                    html += `
                        <div class="fade-in" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                            <div style="flex: 1;">
                                <h4 style="font-size:1.02rem; color:var(--text-main); margin-bottom: 2px;">${item}</h4>
                                <span style="font-size: 0.8rem; color: var(--primary-main); background: rgba(46,125,52,0.08); padding: 2px 8px; border-radius: 6px; font-weight:600;">৳ ${currentPrice} / কেজি</span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <!-- এডিট বাটন -->
                                <button onclick="window.showEditPriceModal('${item}', ${currentPrice})" style="background: rgba(52, 152, 219, 0.1); color: #3498db; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;">
                                    <i class="fa-solid fa-pen"></i> এডিট
                                </button>
                                <!-- নতুন: ডিলিট বাটন -->
                                <button onclick="window.showDeletePriceModal('${item}')" style="background: rgba(217, 48, 37, 0.1); color: #D93025; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;">
                                    <i class="fa-solid fa-trash-can"></i> ডিলিট
                                </button>
                            </div>
                        </div>`;
                });
                listArea.innerHTML = html;
                localStorage.setItem('agroFeedPrices', JSON.stringify(serverPrices));
                localStorage.setItem('agroDeletedPrices', JSON.stringify(deletedItems));
            });
        } else {
            // অফলাইন ব্যাকআপ
            const savedPrices = JSON.parse(localStorage.getItem('agroFeedPrices')) || {};
            const deletedItems = JSON.parse(localStorage.getItem('agroDeletedPrices')) || {};
            let html = '';
            Object.keys(defaultGlobalPrices).forEach(item => {
                if(deletedItems[item]) return;
                const currentPrice = savedPrices[item] || defaultGlobalPrices[item];
                html += `
                    <div class="fade-in" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                        <div style="flex: 1;">
                            <h4 style="font-size:1.02rem; color:var(--text-main); margin-bottom: 2px;">${item}</h4>
                            <span style="font-size: 0.8rem; color: var(--primary-main); background: rgba(46,125,52,0.08); padding: 2px 8px; border-radius: 6px; font-weight:600;">৳ ${currentPrice} (Offline)</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.showEditPriceModal('${item}', ${currentPrice})" style="background: rgba(52, 152, 219, 0.1); color: #3498db; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;"><i class="fa-solid fa-pen"></i> এডিট</button>
                            <button onclick="window.showDeletePriceModal('${item}')" style="background: rgba(217, 48, 37, 0.1); color: #D93025; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;"><i class="fa-solid fa-trash-can"></i> ডিলিট</button>
                        </div>
                    </div>`;
            });
            listArea.innerHTML = html;
        }
    };

    window.saveNewPrice = function(itemName) {
        window.vibrate(40);
        const newPrice = Number(document.getElementById('new-price-input').value);
        
        if(newPrice && !isNaN(newPrice) && newPrice > 0) {
            if(window.db && window.fbFirestore) {
                const { doc, setDoc } = window.fbFirestore;
                
                setDoc(doc(window.db, "market_prices", itemName), {
                    price: newPrice,
                    last_updated: new Date().toISOString()
                }, { merge: true }).then(() => {
                    window.vibrate(60);
                    window.closePriceEditModal();
                }).catch(err => {
                    alert("সার্ভার ত্রুটি: ডাটা সেভ হয়নি।");
                });
            } else {
                let savedPrices = JSON.parse(localStorage.getItem('agroFeedPrices')) || {};
                savedPrices[itemName] = newPrice;
                localStorage.setItem('agroFeedPrices', JSON.stringify(savedPrices));
                window.vibrate(60);
                window.closePriceEditModal();
                window.loadAdminMarketPrices(); 
            }
        } else {
            alert("অনুগ্রহ করে সঠিক দাম লিখুন!");
        }
    };

    window.renderGlobalMarketPricesPage = function() {
        const listArea = document.getElementById('global-market-list-view');
        if(!listArea) return;

        const aliasMap = {
            'ভুট্টা ভাঙা / গুঁড়া': 'ভুট্টা ভাঙা', 'রাইস কুড়া / ধানের কুড়া / পলিস': 'রাইস কুড়া/পলিস',
            'সয়াবিন মিল / সয়ামিল': 'সয়াবিন মিল', 'শুঁটকি মাছের গুঁড়ো / ফিশ মিল': 'শুঁটকি মাছের গুঁড়ো',
            'লাইমস্টোন (চুনাপাথর)': 'লাইমস্টোন', 'লবণ': 'লবণ', 'ভেজিটেবল ফ্যাট / ফ্যাট': 'ভেজিটেবল ফ্যাট',
            'গ্রোথ প্রমোটার / ভিটামিন': 'Growth Promoter'
        };

        if (window.db && window.fbFirestore) {
            const { collection, onSnapshot } = window.fbFirestore;
            
            onSnapshot(collection(window.db, "market_prices"), (snapshot) => {
                let serverPrices = {};
                let deletedItems = {};
                snapshot.forEach((doc) => { 
                    if(doc.data().deleted) deletedItems[doc.id] = true;
                    else serverPrices[doc.id] = doc.data().price; 
                });
                
                let html = '';
                Object.keys(defaultGlobalPrices).forEach(displayName => {
                    const calculatedKey = aliasMap[displayName] || displayName;
                    // ডিলিট করা আইটেম হলে স্কিপ করবে
                    if(deletedItems[calculatedKey] || deletedItems[displayName]) return;

                    const currentPrice = serverPrices[calculatedKey] !== undefined ? serverPrices[calculatedKey] : (serverPrices[displayName] !== undefined ? serverPrices[displayName] : defaultGlobalPrices[displayName]);
                    
                    html += `
                        <div class="fade-in" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                            <div>
                                <h4 style="font-size:1.05rem; color:var(--text-main); margin-bottom: 2px;">${displayName}</h4>
                                <p style="font-size:0.8rem; color:var(--text-muted);">প্রতি কেজি</p>
                            </div>
                            <div style="text-align:right;">
                                <h4 style="font-size:1.15rem; color:var(--primary-dark);">৳ ${currentPrice}</h4>
                            </div>
                        </div>`;
                });
                listArea.innerHTML = html;
            });
        } else {
            const savedPrices = JSON.parse(localStorage.getItem('agroFeedPrices')) || {};
            const deletedItems = JSON.parse(localStorage.getItem('agroDeletedPrices')) || {};
            let html = '';
            Object.keys(defaultGlobalPrices).forEach(displayName => {
                const calculatedKey = aliasMap[displayName] || displayName;
                if(deletedItems[calculatedKey] || deletedItems[displayName]) return;

                const currentPrice = savedPrices[calculatedKey] || savedPrices[displayName] || defaultGlobalPrices[displayName];
                html += `
                    <div class="fade-in" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                        <div><h4 style="font-size:1.05rem; color:var(--text-main); margin-bottom: 2px;">${displayName}</h4><p style="font-size:0.8rem; color:var(--text-muted);">প্রতি কেজি</p></div>
                        <div style="text-align:right;"><h4 style="font-size:1.15rem; color:var(--primary-dark);">৳ ${currentPrice}</h4></div>
                    </div>`;
            });
            listArea.innerHTML = html;
        }
    };

    window.showBanUserConfirmModal = function(userId, userName) {
        window.vibrate(40);
        const modalHTML = `
            <div id="ban-user-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.9); transition: transform 0.3s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div style="width: 65px; height: 65px; background: rgba(217, 48, 37, 0.1); color: var(--danger); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; margin: 0 auto 15px auto;"><i class="fa-solid fa-user-gear"></i></div>
                    <h3 style="color: var(--text-main); font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">অ্যাক্সেস বন্ধ করবেন?</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 25px; line-height: 1.5;">আপনি কি নিশ্চিত যে <strong>'${userName}'</strong>-এর অ্যাকাউন্টটি ডাটাবেস থেকে মুছে ফেলতে চান?</p>
                    <div style="display: flex; gap: 12px;">
                        <button onclick="document.getElementById('ban-user-modal').remove()" style="flex: 1; background: #f1f3f4; color: var(--text-muted); border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer;">বাতিল</button>
                        <button onclick="window.executeUserDelete('${userId}')" style="flex: 1; background: var(--danger); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(217, 48, 37, 0.3);">অপসারণ</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => {
            document.getElementById('ban-user-modal').style.opacity = '1';
            document.getElementById('ban-user-modal').querySelector('div').style.transform = 'scale(1)';
        }, 10);
    };

    window.executeUserDelete = function(userId) {
        window.vibrate(40);
        if(window.db && window.fbFirestore && window.fbFirestore.deleteDoc) {
            const { doc, deleteDoc } = window.fbFirestore;
            deleteDoc(doc(window.db, "users", userId)).then(() => {
                window.vibrate(60);
                document.getElementById('ban-user-modal').remove();
            }).catch(err => {
                alert("ইউজার ডিলিট করা যায়নি।");
                document.getElementById('ban-user-modal').remove();
            });
        } else {
            document.getElementById('ban-user-modal').remove();
        }
    };

    // ==========================================
    // ১৫. রোগ-বালাই (Disease Guidelines) অ্যাডমিন কন্ট্রোলার
    // ==========================================

    window.defaultDiseasesList = [
        { id: 'fmd', name: 'খুরা রোগ (FMD)', icon: 'fa-virus', color: '#D93025', symptoms: 'গরুর শরীরের তাপমাত্রা বেড়ে যায়। মুখ, জিহ্বা এবং পায়ের ক্ষুরে ঘা হয়।', treatment: 'পটাশ পানি দিয়ে ঘায়ের স্থান ধুয়ে দিন। চিকিৎসকের পরামর্শে অ্যান্টিবায়োটিক দিন।' },
        { id: 'lsd', name: 'লাম্পি স্কিন ডিজিজ (LSD)', icon: 'fa-bugs', color: '#F57C00', symptoms: 'গরুর গায়ে গুটি বা চাকা দাগ দেখা দেয়। তীব্র জ্বর হয়, পা ফুলে যেতে পারে।', treatment: 'জ্বর ও ব্যথা কমানোর জন্য রেনাডেক্স ভেট (Renadex Vet) খাওয়াতে হবে।' }
    ];

    window.renderAdminDiseaseTab = function(container) {
        container.innerHTML = `
            <button onclick="window.showAddDiseaseModal()" style="width: 100%; padding: 14px; background: rgba(233, 30, 99, 0.1); color: #E91E63; border: 1.5px dashed #E91E63; border-radius: 12px; font-size: 1.05rem; font-weight: 600; margin-bottom: 15px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.3s;">
                <i class="fa-solid fa-plus"></i> নতুন রোগের গাইডলাইন যুক্ত করুন
            </button>
            <div id="admin-disease-list" class="agro-card" style="padding: 5px 15px; min-height: 100px;">
                <div style="text-align:center; padding:30px;">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--primary-main);"></i>
                </div>
            </div>
        `;
        window.loadAdminDiseases();
    };

    window.loadAdminDiseases = function() {
        const listArea = document.getElementById('admin-disease-list');
        if(!listArea) return;

        const renderList = (diseases) => {
            window.adminDiseasesMap = {}; 
            let html = '';
            diseases.forEach(d => {
                window.adminDiseasesMap[d.id] = d;
                html += `
                <div class="fade-in" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                    <div style="flex: 1; padding-right: 10px;">
                        <h4 style="font-size:1.02rem; color:var(--text-main); margin-bottom: 2px;">
                            <i class="fa-solid ${d.icon || 'fa-notes-medical'}" style="color:${d.color || '#E91E63'}; margin-right: 5px;"></i> ${d.name}
                        </h4>
                        <span style="font-size: 0.8rem; color: var(--success); background: rgba(46,125,52,0.1); padding: 2px 6px; border-radius: 4px;">লাইভ আছে</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="window.showEditDiseaseModal('${d.id}')" style="background: rgba(52, 152, 219, 0.1); color: #3498db; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s;">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="window.deleteDisease('${d.id}')" style="background: rgba(217, 48, 37, 0.1); color: #D93025; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>`;
            });
            listArea.innerHTML = html || '<p style="text-align:center; padding:15px; color:var(--text-muted);">কোনো রোগ যুক্ত করা হয়নি।</p>';
        };

        if (window.db && window.fbFirestore) {
            const { collection, onSnapshot } = window.fbFirestore;
            onSnapshot(collection(window.db, "disease_guidelines"), (snapshot) => {
                let diseases = [];
                snapshot.forEach((doc) => { diseases.push({ id: doc.id, ...doc.data() }); });
                
                if(diseases.length === 0) diseases = window.defaultDiseasesList;
                
                localStorage.setItem('agroDiseases', JSON.stringify(diseases));
                renderList(diseases);
            });
        } else {
            let diseases = JSON.parse(localStorage.getItem('agroDiseases'));
            if(!diseases || diseases.length === 0) diseases = window.defaultDiseasesList;
            renderList(diseases);
        }
    };

    // --- এডিট পপআপ ---
    window.showEditDiseaseModal = function(id) {
        window.vibrate(40);
        const data = window.adminDiseasesMap[id];
        if(!data) return;

        const modalHTML = `
            <div id="edit-disease-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 90%; max-width: 380px; border-radius: 24px; padding: 25px 20px; transform: scale(0.9); transition: transform 0.3s ease; max-height: 90vh; overflow-y: auto;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: #3498db; font-size: 1.25rem; display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-pen-to-square"></i> তথ্য এডিট করুন
                        </h3>
                        <button onclick="window.closeEditDiseaseModal()" style="background: #f1f3f4; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color:var(--text-muted);"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">রোগের নাম</label>
                        <input type="text" id="edit-d-name" value="${data.name || ''}" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; font-family: inherit; outline:none; box-sizing: border-box;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">প্রধান লক্ষণসমূহ</label>
                        <textarea id="edit-d-symptoms" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; height: 80px; font-family: inherit; outline:none; resize:none; box-sizing: border-box;">${data.symptoms || ''}</textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">চিকিৎসা ও ঔষধের নাম</label>
                        <textarea id="edit-d-treatment" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; height: 100px; font-family: inherit; outline:none; resize:none; box-sizing: border-box;">${data.treatment || ''}</textarea>
                    </div>
                    
                    <button onclick="window.updateDisease('${id}')" style="width: 100%; background: #3498db; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);">
                        <i class="fa-solid fa-cloud-arrow-up"></i> আপডেট করুন
                    </button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => { 
            const modal = document.getElementById('edit-disease-modal');
            if(modal) {
                modal.style.opacity = '1'; 
                modal.querySelector('div').style.transform = 'scale(1)'; 
            }
        }, 10);
    };

    window.closeEditDiseaseModal = function() {
        const modal = document.getElementById('edit-disease-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    window.updateDisease = function(id) {
        window.vibrate(40);
        const name = document.getElementById('edit-d-name').value;
        const symptoms = document.getElementById('edit-d-symptoms').value;
        const treatment = document.getElementById('edit-d-treatment').value;
        
        if(!name || !symptoms || !treatment) {
            return alert("অনুগ্রহ করে সকল তথ্য পূরণ করুন!");
        }

        const data = {
            name: name,
            symptoms: symptoms,
            treatment: treatment,
            updatedAt: new Date().toISOString()
        };

        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            setDoc(doc(window.db, "disease_guidelines", id), data, { merge: true }).then(() => {
                window.vibrate(60);
                window.closeEditDiseaseModal();
            }).catch(err => alert("আপডেট ব্যর্থ হয়েছে। সার্ভার ত্রুটি!"));
        } else {
            let diseases = JSON.parse(localStorage.getItem('agroDiseases')) || [];
            const idx = diseases.findIndex(d => d.id === id);
            if(idx !== -1) {
                diseases[idx] = { ...diseases[idx], ...data };
                localStorage.setItem('agroDiseases', JSON.stringify(diseases));
            }
            window.vibrate(60);
            window.closeEditDiseaseModal();
            window.loadAdminDiseases();
        }
    };

    // --- নতুন যোগ ও ডিলিট ---
    window.showAddDiseaseModal = function() {
        window.vibrate(40);
        const modalHTML = `
            <div id="add-disease-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 90%; max-width: 380px; border-radius: 24px; padding: 25px 20px; transform: scale(0.9); transition: transform 0.3s ease; max-height: 90vh; overflow-y: auto;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: #E91E63; font-size: 1.25rem; display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-notes-medical"></i> রোগ যুক্ত করুন
                        </h3>
                        <button onclick="window.closeAddDiseaseModal()" style="background: #f1f3f4; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color:var(--text-muted);"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">রোগের নাম</label>
                        <input type="text" id="d-name" placeholder="যেমন: ম্যাস্টাইটিস বা ওলান পাকা" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; font-family: inherit; outline:none;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">প্রধান লক্ষণসমূহ</label>
                        <textarea id="d-symptoms" placeholder="গরুর শরীরে কী কী লক্ষণ দেখা যায়..." style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; height: 80px; font-family: inherit; outline:none; resize:none;"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">চিকিৎসা ও ঔষধের নাম</label>
                        <textarea id="d-treatment" placeholder="কী কী ঔষধ বা চিকিৎসা দিতে হবে..." style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; height: 100px; font-family: inherit; outline:none; resize:none;"></textarea>
                    </div>
                    
                    <button onclick="window.saveNewDisease()" style="width: 100%; background: #E91E63; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);">
                        <i class="fa-solid fa-cloud-arrow-up"></i> পাবলিশ করুন
                    </button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => { 
            document.getElementById('add-disease-modal').style.opacity = '1'; 
            document.getElementById('add-disease-modal').querySelector('div').style.transform = 'scale(1)'; 
        }, 10);
    };

    window.closeAddDiseaseModal = function() {
        const modal = document.getElementById('add-disease-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    window.saveNewDisease = function() {
        window.vibrate(40);
        const name = document.getElementById('d-name').value;
        const symptoms = document.getElementById('d-symptoms').value;
        const treatment = document.getElementById('d-treatment').value;
        
        if(!name || !symptoms || !treatment) {
            return alert("অনুগ্রহ করে রোগের নাম, লক্ষণ এবং চিকিৎসার ঘরগুলো পূরণ করুন!");
        }
        
        const docId = 'disease_' + Date.now();
        const colors = ['#E91E63', '#9C27B0', '#795548', '#FF9800', '#F44336', '#009688'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const data = {
            name: name,
            symptoms: symptoms,
            treatment: treatment,
            icon: 'fa-staff-snake',
            color: randomColor,
            timestamp: new Date().toISOString()
        };

        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            setDoc(doc(window.db, "disease_guidelines", docId), data).then(() => {
                window.vibrate(60);
                window.closeAddDiseaseModal();
            }).catch(err => alert("ডাটা সেভ হয়নি। সার্ভার ত্রুটি!"));
        } else {
            let diseases = JSON.parse(localStorage.getItem('agroDiseases')) || window.defaultDiseasesList;
            diseases.unshift({...data, id: docId});
            localStorage.setItem('agroDiseases', JSON.stringify(diseases));
            window.vibrate(60);
            window.closeAddDiseaseModal();
            window.loadAdminDiseases();
        }
    };

    window.deleteDisease = function(id) {
        window.showConfirmModal(
            'গাইডলাইনটি মুছবেন?', 
            'এই রোগের গাইডলাইনটি ডাটাবেস থেকে চিরতরে মুছে যাবে এবং সকল ইউজারের অ্যাপ থেকে সরে যাবে।',
            function() {
                if(window.db && window.fbFirestore) {
                    const { doc, deleteDoc } = window.fbFirestore;
                    deleteDoc(doc(window.db, "disease_guidelines", id)).then(() => {
                        window.showAppAlert('সফলভাবে মোছা হয়েছে!', 'রোগের গাইডলাইনটি মুছে ফেলা হয়েছে।', 'fa-trash-can', '#F44336');
                    }).catch(err => {
                        window.showAppAlert('ত্রুটি!', 'সার্ভার থেকে ডিলিট করতে সমস্যা হয়েছে!', 'fa-triangle-exclamation', '#F44336');
                    });
                } else {
                    let diseases = JSON.parse(localStorage.getItem('agroDiseases')) || [];
                    diseases = diseases.filter(d => d.id !== id);
                    localStorage.setItem('agroDiseases', JSON.stringify(diseases));
                    window.showAppAlert('সফলভাবে মোছা হয়েছে!', 'রোগের গাইডলাইনটি মুছে ফেলা হয়েছে (Offline)।', 'fa-trash-can', '#F44336');
                    window.loadAdminDiseases(); 
                }
            }
        );
    };

    // ১. গ্লোবাল ডিফল্ট লিস্ট (যদি ডাটাবেস খালি থাকে)
    window.defaultDiseasesList = [
        { id: 'fmd', name: 'খুরা রোগ (FMD)', icon: 'fa-virus', color: '#D93025', symptoms: 'গরুর শরীরের তাপমাত্রা বেড়ে যায়। মুখ, জিহ্বা এবং পায়ের ক্ষুরে ঘা হয়।', treatment: 'পটাশ পানি দিয়ে ঘায়ের স্থান ধুয়ে দিন। চিকিৎসকের পরামর্শে অ্যান্টিবায়োটিক দিন।' },
        { id: 'lsd', name: 'লাম্পি স্কিন ডিজিজ (LSD)', icon: 'fa-bugs', color: '#F57C00', symptoms: 'গরুর গায়ে গুটি বা চাকা দাগ দেখা দেয়। তীব্র জ্বর হয়, পা ফুলে যেতে পারে।', treatment: 'জ্বর ও ব্যথা কমানোর জন্য রেনাডেক্স ভেট (Renadex Vet) খাওয়াতে হবে।' }
    ];

    // ৩. ফায়ারবেস বা লোকাল স্টোরেজ থেকে ডাটা নিয়ে আসা
    window.loadAdminDiseases = function() {
        const listArea = document.getElementById('admin-disease-list');
        if(!listArea) return;

        const renderList = (diseases) => {
            window.adminDiseasesMap = {}; // এডিট করার জন্য ডাটা ক্যাশে রাখা হচ্ছে
            let html = '';
            diseases.forEach(d => {
                window.adminDiseasesMap[d.id] = d;
                html += `
                <div class="fade-in" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                    <div style="flex: 1; padding-right: 10px;">
                        <h4 style="font-size:1.02rem; color:var(--text-main); margin-bottom: 2px;">
                            <i class="fa-solid ${d.icon || 'fa-notes-medical'}" style="color:${d.color || '#E91E63'}; margin-right: 5px;"></i> ${d.name}
                        </h4>
                        <span style="font-size: 0.8rem; color: var(--success); background: rgba(46,125,52,0.1); padding: 2px 6px; border-radius: 4px;">লাইভ আছে</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <!-- এডিট বাটন -->
                        <button onclick="window.showEditDiseaseModal('${d.id}')" style="background: rgba(52, 152, 219, 0.1); color: #3498db; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s;">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <!-- ডিলিট বাটন -->
                        <button onclick="window.deleteDisease('${d.id}')" style="background: rgba(217, 48, 37, 0.1); color: #D93025; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>`;
            });
            listArea.innerHTML = html || '<p style="text-align:center; padding:15px; color:var(--text-muted);">কোনো রোগ যুক্ত করা হয়নি।</p>';
        };

        if (window.db && window.fbFirestore) {
            const { collection, onSnapshot } = window.fbFirestore;
            // ফায়ারবেস থেকে লাইভ ডাটা লোড
            onSnapshot(collection(window.db, "disease_guidelines"), (snapshot) => {
                let diseases = [];
                snapshot.forEach((doc) => { diseases.push({ id: doc.id, ...doc.data() }); });
                
                // যদি ডাটাবেস একদম খালি থাকে, তাহলে ডিফল্ট ডাটা দেখাবে
                if(diseases.length === 0) diseases = window.defaultDiseasesList;
                
                localStorage.setItem('agroDiseases', JSON.stringify(diseases));
                renderList(diseases);
            });
        } else {
            // অফলাইন ব্যাকআপ
            let diseases = JSON.parse(localStorage.getItem('agroDiseases'));
            if(!diseases || diseases.length === 0) diseases = window.defaultDiseasesList;
            renderList(diseases);
        }
    };

    window.showAddDiseaseModal = function() {
        window.vibrate(40);
        const modalHTML = `
            <div id="add-disease-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 90%; max-width: 380px; border-radius: 24px; padding: 25px 20px; transform: scale(0.9); transition: transform 0.3s ease; max-height: 90vh; overflow-y: auto;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: #E91E63; font-size: 1.25rem; display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-notes-medical"></i> রোগ যুক্ত করুন
                        </h3>
                        <button onclick="window.closeAddDiseaseModal()" style="background: #f1f3f4; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color:var(--text-muted);"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">রোগের নাম</label>
                        <input type="text" id="d-name" placeholder="যেমন: ম্যাস্টাইটিস বা ওলান পাকা" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; font-family: inherit; outline:none;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">প্রধান লক্ষণসমূহ</label>
                        <textarea id="d-symptoms" placeholder="গরুর শরীরে কী কী লক্ষণ দেখা যায়..." style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; height: 80px; font-family: inherit; outline:none; resize:none;"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">চিকিৎসা ও ঔষধের নাম</label>
                        <textarea id="d-treatment" placeholder="কী কী ঔষধ বা চিকিৎসা দিতে হবে..." style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; height: 100px; font-family: inherit; outline:none; resize:none;"></textarea>
                    </div>
                    
                    <button onclick="window.saveNewDisease()" style="width: 100%; background: #E91E63; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);">
                        <i class="fa-solid fa-cloud-arrow-up"></i> পাবলিশ করুন
                    </button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => { 
            document.getElementById('add-disease-modal').style.opacity = '1'; 
            document.getElementById('add-disease-modal').querySelector('div').style.transform = 'scale(1)'; 
        }, 10);
    };

    window.closeAddDiseaseModal = function() {
        const modal = document.getElementById('add-disease-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    // [অ্যাডমিন] রোগ এডিট করার পপআপ মডাল
    window.showEditDiseaseModal = function(id) {
        window.vibrate(40);
        const data = window.adminDiseasesMap[id];
        if(!data) return;

        const modalHTML = `
            <div id="edit-disease-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 90%; max-width: 380px; border-radius: 24px; padding: 25px 20px; transform: scale(0.9); transition: transform 0.3s ease; max-height: 90vh; overflow-y: auto;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: #3498db; font-size: 1.25rem; display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-pen-to-square"></i> তথ্য এডিট করুন
                        </h3>
                        <button onclick="window.closeEditDiseaseModal()" style="background: #f1f3f4; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color:var(--text-muted);"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">রোগের নাম</label>
                        <input type="text" id="edit-d-name" value="${data.name || ''}" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; font-family: inherit; outline:none; box-sizing: border-box;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">প্রধান লক্ষণসমূহ</label>
                        <textarea id="edit-d-symptoms" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; height: 80px; font-family: inherit; outline:none; resize:none; box-sizing: border-box;">${data.symptoms || ''}</textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">চিকিৎসা ও ঔষধের নাম</label>
                        <textarea id="edit-d-treatment" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; height: 100px; font-family: inherit; outline:none; resize:none; box-sizing: border-box;">${data.treatment || ''}</textarea>
                    </div>
                    
                    <button onclick="window.updateDisease('${id}')" style="width: 100%; background: #3498db; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);">
                        <i class="fa-solid fa-cloud-arrow-up"></i> আপডেট করুন
                    </button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => { 
            const modal = document.getElementById('edit-disease-modal');
            if(modal) {
                modal.style.opacity = '1'; 
                modal.querySelector('div').style.transform = 'scale(1)'; 
            }
        }, 10);
    };

    // এডিট পপআপ বন্ধ করা
    window.closeEditDiseaseModal = function() {
        const modal = document.getElementById('edit-disease-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };


    // [অ্যাডমিন] ডাটাবেসে আপডেট করা
    window.updateDisease = function(id) {
        window.vibrate(40);
        const name = document.getElementById('edit-d-name').value;
        const symptoms = document.getElementById('edit-d-symptoms').value;
        const treatment = document.getElementById('edit-d-treatment').value;
        
        if(!name || !symptoms || !treatment) {
            return alert("অনুগ্রহ করে সকল তথ্য পূরণ করুন!");
        }

        const data = {
            name: name,
            symptoms: symptoms,
            treatment: treatment,
            updatedAt: new Date().toISOString()
        };

        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            // { merge: true } থাকার কারণে আগের আইকন ও কালার নষ্ট হবে না
            setDoc(doc(window.db, "disease_guidelines", id), data, { merge: true }).then(() => {
                window.vibrate(60);
                window.closeEditDiseaseModal();
            }).catch(err => alert("আপডেট ব্যর্থ হয়েছে। সার্ভার ত্রুটি!"));
        } else {
            let diseases = JSON.parse(localStorage.getItem('agroDiseases')) || [];
            const idx = diseases.findIndex(d => d.id === id);
            if(idx !== -1) {
                diseases[idx] = { ...diseases[idx], ...data };
                localStorage.setItem('agroDiseases', JSON.stringify(diseases));
            }
            window.vibrate(60);
            window.closeEditDiseaseModal();
            window.loadAdminDiseases();
        }
    };

    window.renderUserDiseasesPage = function() {
        const listArea = document.getElementById('user-disease-list-view');
        if(!listArea) return;

        const renderCards = (diseases) => {
            window.agroDiseasesCache = {}; 
            let html = '';
            diseases.forEach(d => {
                window.agroDiseasesCache[d.id] = d;
                html += `
                <div class="agro-card fade-in" style="position: relative; overflow: hidden; padding-bottom: 15px; margin-bottom: 15px;">
                    <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${d.color || '#E91E63'};"></div>
                    <h3 class="card-title" style="color: ${d.color || '#E91E63'}; font-size: 1.15rem;">
                        <i class="fa-solid ${d.icon || 'fa-notes-medical'}"></i> ${d.name}
                    </h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 15px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${d.symptoms}
                    </p>
                    <button onclick="window.showDynamicDiseaseDetails('${d.id}')" style="background: ${d.color ? d.color+'15' : 'rgba(233, 30, 99, 0.1)'}; color: ${d.color || '#E91E63'}; border: none; padding: 10px 15px; border-radius: 10px; font-weight: 700; width: 100%; cursor: pointer; display:flex; justify-content:center; align-items:center; gap:8px;">
                        বিস্তারিত ও চিকিৎসা <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>`;
            });
            listArea.innerHTML = html;
        };

        if (window.db && window.fbFirestore) {
            const { collection, onSnapshot } = window.fbFirestore;
            onSnapshot(collection(window.db, "disease_guidelines"), (snapshot) => {
                let diseases = [];
                snapshot.forEach((doc) => { diseases.push({ id: doc.id, ...doc.data() }); });
                if(diseases.length === 0) diseases = defaultDiseasesList;
                renderCards(diseases);
            });
        } else {
            let diseases = JSON.parse(localStorage.getItem('agroDiseases'));
            if(!diseases || diseases.length === 0) diseases = defaultDiseasesList;
            renderCards(diseases);
        }
    };

    window.showDynamicDiseaseDetails = function(diseaseId) {
        window.vibrate(40);
        const data = window.agroDiseasesCache ? window.agroDiseasesCache[diseaseId] : null;
        if(!data) return;

        const modalHTML = `
            <div id="disease-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 9999; display: flex; justify-content: center; align-items: flex-end; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 100%; max-height: 85vh; border-top-left-radius: 24px; border-top-right-radius: 24px; padding: 25px 20px; overflow-y: auto; transform: translateY(100%); transition: transform 0.3s ease; box-shadow: 0 -10px 25px rgba(0,0,0,0.1);">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: ${data.color || '#E91E63'}; font-size: 1.4rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid ${data.icon || 'fa-notes-medical'}"></i> ${data.name}
                        </h2>
                        <button onclick="window.closeDiseaseModal()" style="background: #f1f3f4; border: none; width: 35px; height: 35px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: var(--text-muted); font-size: 1.2rem; cursor: pointer;">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div style="font-size: 1rem; color: var(--text-main); line-height:1.6;">
                        <p style="margin-bottom:10px; line-height:1.6;"><strong style="color:var(--text-main);">লক্ষণসমূহ:</strong><br/>${data.symptoms}</p>
                        
                        <h4 style="color:var(--text-main); margin:20px 0 10px 0; border-bottom:1px solid #eee; padding-bottom:5px;">
                            <i class="fa-solid fa-notes-medical" style="color:var(--primary-main);"></i> চিকিৎসা ও ঔষধ
                        </h4>
                        <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.8; white-space: pre-wrap;">${data.treatment}</p>
                        
                        <div style="background:rgba(217, 48, 37, 0.08); padding:15px; border-radius:12px; margin-top:25px; border-left: 4px solid var(--danger);">
                            <p style="color:var(--danger); font-size:0.85rem; margin:0; line-height:1.6; font-weight: 600;">
                                <i class="fa-solid fa-triangle-exclamation"></i> সতর্কতা: অ্যান্টিবায়োটিক বা যেকোনো ইনজেকশন ব্যবহারের পূর্বে অবশ্যই একজন রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের পরামর্শ নিন।
                            </p>
                        </div>
                    </div>
                    
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('disease-modal');
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('div').style.transform = 'translateY(0)';
        }, 10);
    };

    window.renderAdminFormulaTab = function(container) {
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); display: block; margin-bottom: 8px;">কন্ট্রোল ফর্মুলা নির্বাচন</label>
                <div style="position: relative;">
                    <select id="admin-formula-cat-selector" onchange="window.loadAdminFormulaCategoryData()" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; font-size: 1rem; font-family: inherit; outline: none; appearance: none;">
                        <option value="primary">১. প্রাথমিক বাজেট (সাধারণ)</option>
                        <option value="standard">২. স্ট্যান্ডার্ড (মাঝারি)</option>
                        <option value="premium" selected>৩. হাই-প্রোটিন (ফ্যাটেনিং)</option>
                    </select>
                    <i class="fa-solid fa-chevron-down" style="position: absolute; right: 18px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;"></i>
                </div>
            </div>
            <div id="admin-formula-ingredients-list"></div>
        `;
        window.loadAdminFormulaCategoryData();
    };

    window.loadAdminFormulaCategoryData = function() {
        const cat = document.getElementById('admin-formula-cat-selector').value;
        const listArea = document.getElementById('admin-formula-ingredients-list');
        if(!listArea) return;

        let formulas = JSON.parse(localStorage.getItem('agroFormulas')) || defaultAgroFormulas;
        const selectedData = formulas[cat] || defaultAgroFormulas[cat];

        const renderRow = (item, type, index) => {
            const displayWeight = item.qty >= 1 ? `${item.qty} কেজি` : `${item.qty * 1000} গ্রাম`;
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f5f5f5;">
                    <div>
                        <h4 style="font-size:0.98rem; color:var(--text-main); margin-bottom:2px;">${item.name}</h4>
                        <span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">অনুপাত: ${displayWeight}</span>
                    </div>
                    <button onclick="window.showEditIngredientWeightModal('${cat}', '${type}', ${index}, '${item.name}', ${item.qty})" style="background: rgba(230, 126, 34, 0.1); color: #e67e22; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        <i class="fa-solid fa-sliders"></i> পরিবর্তন
                    </button>
                </div>`;
        };

        listArea.innerHTML = `
            <h4 style="color: var(--text-main); font-size: 1rem; margin: 15px 0 10px 5px;"><i class="fa-solid fa-wheat-awn"></i> মূল উপকরণসমূহ (১০০ কেজিতে)</h4>
            <div class="agro-card" style="padding: 5px 15px; margin-bottom: 20px;">
                ${selectedData.main.map((item, index) => renderRow(item, 'main', index)).join('')}
            </div>
            <h4 style="color: var(--text-main); font-size: 1rem; margin: 15px 0 10px 5px;"><i class="fa-solid fa-capsules"></i> পুষ্টি ও সাপ্লিমেন্ট</h4>
            <div class="agro-card" style="padding: 5px 15px; margin-bottom: 20px;">
                ${selectedData.supplements.map((item, index) => renderRow(item, 'supplements', index)).join('')}
            </div>
        `;
    };

    window.showEditIngredientWeightModal = function(cat, type, index, name, currentWeight) {
        window.vibrate(40);
        const modalHTML = `
            <div id="weight-edit-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.9); transition: transform 0.3s ease;">
                    <h3 style="color: var(--text-main); font-size: 1.2rem; margin-bottom: 5px; font-weight: 700;">অনুপাত পরিবর্তন</h3>
                    <p style="color: #e67e22; font-weight: 700; margin-bottom: 15px; font-size: 1.05rem;">${name}</p>
                    
                    <div style="position: relative; margin-bottom: 20px;">
                        <input type="number" id="new-ingredient-weight-input" value="${currentWeight}" step="any" style="width: 100%; padding: 15px; border-radius: 12px; border: 1.5px solid #E0E0E0; text-align: center; font-size: 1.4rem; outline: none; background: #F9F9F9; font-weight: 700; color: var(--text-main);">
                        <span style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--text-muted);">কেজি</span>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button onclick="document.getElementById('weight-edit-modal').remove()" style="flex: 1; background: #f1f3f4; border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer;">বাতিল</button>
                        <button onclick="window.saveIngredientWeightCloud('${cat}', '${type}', ${index})" style="flex: 1; background: #e67e22; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(230,126,34,0.25);">সংরক্ষণ</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => {
            document.getElementById('weight-edit-modal').style.opacity = '1';
            document.getElementById('weight-edit-modal').querySelector('div').style.transform = 'scale(1)';
        }, 10);
    };

    window.saveIngredientWeightCloud = function(cat, type, index) {
        window.vibrate(40);
        const newWeight = parseFloat(document.getElementById('new-ingredient-weight-input').value);
        if(isNaN(newWeight) || newWeight < 0) return alert('অনুগ্রহ করে সঠিক পরিমাণ দিন!');

        let formulas = JSON.parse(localStorage.getItem('agroFormulas')) || defaultAgroFormulas;
        formulas[cat][type][index].qty = newWeight;
        localStorage.setItem('agroFormulas', JSON.stringify(formulas));

        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            setDoc(doc(window.db, "feed_formulas", cat), {
                [type]: formulas[cat][type],
                last_updated: new Date().toISOString()
            }, { merge: true }).then(() => {
                window.vibrate(60);
                document.getElementById('weight-edit-modal').remove();
                window.loadAdminFormulaCategoryData();
            }).catch(err => alert("সার্ভার ত্রুটি!"));
        } else {
            window.vibrate(60);
            document.getElementById('weight-edit-modal').remove();
            window.loadAdminFormulaCategoryData();
        }
    };

    window.checkUserRegistration = function() {
        const user = localStorage.getItem('agroUser');
        if(!user) {
            window.showRegistrationModal();
        }
    };

    window.showRegistrationModal = function() {
        const modalHTML = `
            <div id="registration-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--bg-color); z-index: 99999; display: flex; flex-direction: column; opacity: 0; transition: opacity 0.5s ease; overflow-y: auto;">
                <div style="padding: 40px 20px 30px 20px; text-align: center; background: linear-gradient(135deg, var(--primary-main), var(--primary-dark)); color: white; border-bottom-left-radius: 30px; border-bottom-right-radius: 30px; box-shadow: 0 10px 20px rgba(46,125,50,0.2);">
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 15px auto; backdrop-filter: blur(5px);">
                        <i class="fa-solid fa-seedling" style="font-size: 2.5rem;"></i>
                    </div>
                    <h2 style="margin: 0; font-size: 1.8rem; font-weight: 800;">ডিজিটাল এগ্রো</h2>
                    <p style="margin: 5px 0 0 0; font-size: 0.95rem; opacity: 0.9;">আপনার স্মার্ট খামার ব্যবস্থাপক</p>
                </div>
                
                <div style="padding: 30px 20px; flex: 1;">
                    <h3 style="color: var(--text-main); font-size: 1.3rem; margin-bottom: 20px; font-weight: 700;">একাউন্ট তৈরি করুন</h3>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); display:block; margin-bottom:8px;">খামারির নাম <span style="color:red;">*</span></label>
                        <input type="text" id="reg-name" placeholder="আপনার নাম লিখুন" style="width: 100%; padding: 15px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; font-family: inherit; font-size: 1rem; outline: none; transition: 0.3s;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); display:block; margin-bottom:8px;">মোবাইল নম্বর <span style="color:red;">*</span></label>
                        <input type="tel" id="reg-phone" placeholder="০১৭XXXXXXXX" style="width: 100%; padding: 15px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; font-family: inherit; font-size: 1rem; outline: none;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); display:block; margin-bottom:8px;">জেলা <span style="color:red;">*</span></label>
                        <div style="position: relative;">
                            <select id="reg-district" style="width: 100%; padding: 15px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; font-family: inherit; font-size: 1rem; outline: none; appearance: none;">
                                <option value="কুড়িগ্রাম" selected>কুড়িগ্রাম</option>
                                <option value="লালমনিরহাট">লালমনিরহাট</option>
                                <option value="রংপুর">রংপুর</option>
                                <option value="গাইবান্ধা">গাইবান্ধা</option>
                                <option value="অন্যান্য">অন্যান্য</option>
                            </select>
                            <i class="fa-solid fa-chevron-down" style="position: absolute; right: 18px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;"></i>
                        </div>
                    </div>
                    
                    <button onclick="window.submitRegistration()" id="reg-submit-btn" style="width: 100%; background: var(--primary-main); color: white; border: none; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; box-shadow: 0 5px 15px rgba(46,125,50,0.3); transition: 0.3s; display: flex; justify-content: center; align-items: center; gap: 10px;">
                        শুরু করুন <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => {
            const modal = document.getElementById('registration-modal');
            if(modal) modal.style.opacity = '1';
        }, 50);
    };

    window.submitRegistration = function() {
        if (navigator.vibrate) navigator.vibrate(40);
        const name = document.getElementById('reg-name').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const district = document.getElementById('reg-district').value;
        const btn = document.getElementById('reg-submit-btn');
        
        if(!name || !phone) {
            return alert("অনুগ্রহ করে আপনার নাম এবং মোবাইল নম্বর দিন!");
        }
        if(phone.length < 11) {
            return alert("অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন!");
        }
        
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> অ্যাকাউন্ট তৈরি হচ্ছে...';
        btn.style.opacity = '0.8';

        const userId = 'user_' + Date.now();
        const userData = {
            name: name,
            phone: phone,
            district: district,
            regDate: new Date().toLocaleDateString('bn-BD'),
            timestamp: new Date().toISOString()
        };

        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            setDoc(doc(window.db, "users", userId), userData).then(() => {
                window.finalizeRegistration(userData);
            }).catch(err => {
                window.finalizeRegistration(userData);
            });
        } else {
            window.finalizeRegistration(userData);
        }
    };

    window.finalizeRegistration = function(userData) {
        localStorage.setItem('agroUser', JSON.stringify(userData));
        if (navigator.vibrate) navigator.vibrate(60);
        
        const modal = document.getElementById('registration-modal');
        if(modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 500);
        }
        window.location.reload(); 
    };

    window.updateCategories = function() {
        const type = document.getElementById('exp-type').value;
        const categorySelect = document.getElementById('exp-category');
        const cattleDiv = document.getElementById('cattle-select-div');
        
        if(type === 'আয়') {
            categorySelect.innerHTML = `
                <option value="দুধ বিক্রি">দুধ বিক্রি</option>
                <option value="গরু বিক্রি">গরু বিক্রি</option>
                <option value="অন্যান্য আয়">অন্যান্য আয়</option>
            `;
            cattleDiv.style.display = 'none'; 
        } else {
            categorySelect.innerHTML = `
                <option value="খাদ্য">খাদ্য (Feed)</option>
                <option value="ওষুধ">ওষুধ (Medicine)</option>
                <option value="ডাক্তার ভিজিট">ডাক্তার ভিজিট (Vet Visit)</option>
                <option value="অন্যান্য খরচ">অন্যান্য খরচ</option>
            `;
        }
        window.toggleCattleSelect();
    };

    window.toggleCattleSelect = function() {
        const category = document.getElementById('exp-category').value;
        const type = document.getElementById('exp-type').value;
        const cattleDiv = document.getElementById('cattle-select-div');
        
        if(type === 'খরচ' && (category === 'ওষুধ' || category === 'ডাক্তার ভিজিট')) {
            cattleDiv.style.display = 'block';
            cattleDiv.classList.add('fade-in');
        } else {
            cattleDiv.style.display = 'none';
        }
    };

    // ১. আয়-ব্যয় সেভ করার ফাংশন
    window.saveExpense = function() {
        if(navigator.vibrate) navigator.vibrate(40);
        
        const currentUser = JSON.parse(localStorage.getItem('agroUser'));
        if(!currentUser || !currentUser.email) {
            return window.showAppAlert('লগইন করুন', 'হিসাব সেভ করতে আগে লগইন করুন।', 'fa-user-lock', '#FF9800');
        }

        const type = document.getElementById('exp-type').value;
        const category = document.getElementById('exp-category').value;
        let cattle = "প্রযোজ্য নয়";
        if(type === 'খরচ' && (category === 'ওষুধ' || category === 'ডাক্তার ভিজিট')) {
            cattle = document.getElementById('exp-cattle').value;
        }
        const details = document.getElementById('exp-details').value.trim();
        const amount = Number(document.getElementById('exp-amount').value.trim());

        if(!details || !amount || amount <= 0) {
            return window.showAppAlert('তথ্য অসম্পূর্ণ!', 'অনুগ্রহ করে বিবরণ এবং টাকার পরিমাণ সঠিকভাবে পূরণ করুন।', 'fa-triangle-exclamation', '#FF9800');
        }

        const btn = document.getElementById('save-expense-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> প্রসেস হচ্ছে...';

        // এখানে userPhone এর বদলে userEmail ও userId দেওয়া হয়েছে
        const transactionData = {
            userEmail: currentUser.email,
            userId: currentUser.uid,
            type: type, 
            category: category,
            cattle: cattle,
            details: details,
            amount: amount
        };

        if(!window.editingExpenseId) {
            const now = new Date();
            transactionData.date = now.toLocaleDateString('bn-BD');
            transactionData.monthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;
            transactionData.timestamp = now.toISOString();
        }

        const transId = window.editingExpenseId || ('trx_' + Date.now());

        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            setDoc(doc(window.db, "farm_expenses", transId), transactionData, { merge: true }).then(() => {
                if(window.editingExpenseId) {
                    window.showAppAlert('আপডেট সফল!', 'আপনার হিসাবটি সফলভাবে আপডেট করা হয়েছে।', 'fa-check-circle', '#4CAF50');
                }
                window.cancelEditExpense(); 
            }).catch(err => {
                window.showAppAlert('ত্রুটি', 'সেভ করতে সমস্যা হয়েছে। ইন্টারনেট চেক করুন।', 'fa-triangle-exclamation', '#F44336');
                btn.innerHTML = originalText;
            });
        }
    };

    // ২. আয়-ব্যয় লোড করার ফাংশন
    window.loadExpensesLive = function() {
        const currentUser = JSON.parse(localStorage.getItem('agroUser'));
        if(!currentUser || !currentUser.email) return;

        if(window.db && window.fbFirestore) {
            const { collection, onSnapshot } = window.fbFirestore;
            const now = new Date();
            const currentMonthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;

            onSnapshot(collection(window.db, "farm_expenses"), (snapshot) => {
                let html = '';
                let totalIncome = 0;
                let totalExpense = 0;
                let hasData = false;
                let transactions = [];
                
                snapshot.forEach(doc => transactions.push({id: doc.id, ...doc.data()}));
                transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); 

                window.allTransactions = transactions;

                transactions.forEach((trx) => {
                    // এখানে userPhone এর বদলে userEmail দিয়ে চেক করা হচ্ছে
                    if(trx.userEmail === currentUser.email && trx.monthYear === currentMonthYear) {
                        hasData = true;
                        let icon = 'fa-sack-dollar';
                        let iconColor = '#9E9E9E';
                        let sign = '';
                        let amountColor = '';

                        if(trx.type === 'আয়') {
                            totalIncome += trx.amount;
                            iconColor = '#4CAF50';
                            sign = '+';
                            amountColor = 'color: #2E7D32;';
                        } else {
                            totalExpense += trx.amount;
                            iconColor = '#E91E63';
                            sign = '-';
                            amountColor = 'color: #C2185B;';
                            if(trx.category === 'ওষুধ') icon = 'fa-pills';
                            else if(trx.category === 'খাদ্য') icon = 'fa-wheat-awn';
                            else if(trx.category === 'ডাক্তার ভিজিট') icon = 'fa-stethoscope';
                        }

                        let cattleTag = '';
                        if(trx.cattle && trx.cattle !== 'প্রযোজ্য নয়') {
                            cattleTag = `<span style="background:rgba(0,0,0,0.05); padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:5px; color:#555;">${trx.cattle}</span>`;
                        }

                        html += `
                        <div class="agro-card fade-in" style="margin-bottom: 10px; padding: 12px 15px; display:flex; justify-content:space-between; align-items:center; border-left: 4px solid ${iconColor};">
                            <div style="display:flex; align-items:center; gap:12px; flex: 1;">
                                <div style="width:35px; height:35px; background:${iconColor}20; color:${iconColor}; border-radius:50%; display:flex; justify-content:center; align-items:center;">
                                    <i class="fa-solid ${icon}"></i>
                                </div>
                                <div>
                                    <h4 style="margin:0; font-size:0.95rem; color:var(--text-main);">${trx.details}</h4>
                                    <p style="margin:2px 0 0 0; font-size:0.75rem; color:var(--text-muted);">${trx.category} | ${trx.date} ${cattleTag}</p>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight:700; ${amountColor} font-size:1.1rem; margin-bottom: 6px;">
                                    ${sign} ৳ ${trx.amount.toLocaleString('bn-BD')}
                                </div>
                                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                    <button onclick="window.setupEditExpense('${trx.id}')" style="background: rgba(33, 150, 243, 0.1); color: #1565C0; border: none; padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
                                        <i class="fa-solid fa-pen"></i> এডিট
                                    </button>
                                    <button onclick="window.deleteExpense('${trx.id}')" style="background: rgba(244, 67, 54, 0.1); color: #F44336; border: none; padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
                                        <i class="fa-solid fa-trash-can"></i> ডিলিট
                                    </button>
                                </div>
                            </div>
                        </div>`;
                    }
                });

                const incomeEl = document.getElementById('monthly-total-income');
                const expenseEl = document.getElementById('monthly-total-expense');
                if(incomeEl) incomeEl.innerText = `৳ ${totalIncome.toLocaleString('bn-BD')}`;
                if(expenseEl) expenseEl.innerText = `৳ ${totalExpense.toLocaleString('bn-BD')}`;
                
                if(!hasData) {
                    html = `<div style="text-align:center; padding:30px; color:var(--text-muted); background:var(--card-bg); border-radius:12px;">
                                <i class="fa-solid fa-receipt" style="font-size:2rem; color:#ddd; margin-bottom:10px;"></i>
                                <p style="margin:0;">আপনার কোনো হিসাব যুক্ত করা হয়নি।</p>
                            </div>`;
                }
                
                const listArea = document.getElementById('expense-list-area');
                if(listArea) listArea.innerHTML = html;
            });
        }
    };

    // ৩. গরুর ডাটা সেভ করার ফাংশন
    window.saveCattleData = function(cowId) {
        if(navigator.vibrate) navigator.vibrate(40);
        
        const currentUser = JSON.parse(localStorage.getItem('agroUser'));
        if(!currentUser || !currentUser.uid) {
            return window.showAppAlert('লগইন করুন', 'গরুর প্রোফাইল সেভ করতে লগইন করুন।', 'fa-user-lock', '#FF9800');
        }

        const name = document.getElementById('cow-name').value.trim();
        const status = document.getElementById('cow-health-status').value;
        const weight = document.getElementById('cow-weight').value;
        const targetWeight = document.getElementById('cow-target-weight').value;
        const catophosMl = document.getElementById('cow-catophos-ml').value;
        const catophosFreq = document.getElementById('cow-catophos-freq').value;
        const aminovitMl = document.getElementById('cow-aminovit-ml').value;
        const aminovitFreq = document.getElementById('cow-aminovit-freq').value;
        const nextVaccine = document.getElementById('cow-next-vaccine').value;

        // এখানে phone এর বদলে uid ব্যবহার করা হয়েছে
        const docId = `cow_${currentUser.uid}_${cowId}`;

        const btn = document.getElementById('save-cow-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> সেভ হচ্ছে...';

        if(window.db && window.fbFirestore) {
            const { doc, getDoc, setDoc } = window.fbFirestore;
            const docRef = doc(window.db, "cattle_profiles", docId);

            getDoc(docRef).then(docSnap => {
                let history = [];
                if (docSnap.exists() && docSnap.data().history) {
                    history = docSnap.data().history; 
                }

                let logDetails = [];
                if(weight) logDetails.push(`ওজন: ${weight} কেজি`);
                if(catophosMl) logDetails.push(`ক্যাটাফস: ${catophosMl}`);
                if(aminovitMl) logDetails.push(`এমাইনোভিট: ${aminovitMl}`);

                if(logDetails.length > 0) {
                    const todayStr = new Date().toLocaleDateString('bn-BD');
                    history.push({
                        date: todayStr,
                        timestamp: new Date().toISOString(), 
                        details: logDetails.join(' | ') 
                    });
                }

                const cowData = {
                    userUid: currentUser.uid,
                    name: name || `ষাঁড় গরু - ${cowId}`,
                    healthStatus: status || "🟢 সুস্থ",
                    weight: weight || "",
                    targetWeight: targetWeight || "",
                    catophosMl: catophosMl || "",
                    catophosFreq: catophosFreq || "",
                    aminovitMl: aminovitMl || "",
                    aminovitFreq: aminovitFreq || "",
                    nextVaccineDate: nextVaccine || "",
                    imageUrl: window.currentCowImage || "", 
                    history: history, 
                    updatedAt: new Date().toISOString()
                };

                setDoc(docRef, cowData, { merge: true }).then(() => {
                    window.showAppAlert('সফল!', `সকল তথ্য ও লক্ষ্যমাত্রা সফলভাবে সেভ হয়েছে।`, 'fa-circle-check', '#4CAF50');
                    btn.innerHTML = originalText;
                    window.loadCattleData(cowId); 
                });
            });
        }
    };

    // ৪. গরুর ডাটা লোড করার ফাংশন
    window.loadCattleData = function(cowId) {
        const currentUser = JSON.parse(localStorage.getItem('agroUser'));
        if(!currentUser || !currentUser.uid) return;
        
        // phone এর বদলে uid
        const docId = `cow_${currentUser.uid}_${cowId}`;

        if(window.db && window.fbFirestore) {
            const { doc, getDoc } = window.fbFirestore;
            getDoc(doc(window.db, "cattle_profiles", docId)).then(docSnap => {
                const badge = document.getElementById('cow-status-badge');
                const title = document.getElementById('details-cow-title');
                const historyContainer = document.getElementById('cow-history-list');
                
                if(docSnap.exists()) {
                    const data = docSnap.data();
                    
                    if(data.imageUrl) {
                        window.currentCowImage = data.imageUrl;
                        const imgEl = document.getElementById('cow-profile-img');
                        const iconEl = document.getElementById('cow-default-icon');
                        if(imgEl && iconEl) {
                            imgEl.src = window.currentCowImage;
                            imgEl.style.display = 'block';
                            iconEl.style.display = 'none';
                        }
                    }

                    if(data.name) {
                        document.getElementById('cow-name').value = data.name === `ষাঁড় গরু - ${cowId}` ? "" : data.name;
                        if(title) title.innerText = data.name;
                    }
                    if(data.healthStatus) document.getElementById('cow-health-status').value = data.healthStatus;
                    if(data.weight) document.getElementById('cow-weight').value = data.weight;
                    if(data.targetWeight) document.getElementById('cow-target-weight').value = data.targetWeight;
                    if(data.nextVaccineDate) document.getElementById('cow-next-vaccine').value = data.nextVaccineDate;
                    
                    if(data.catophosMl) document.getElementById('cow-catophos-ml').value = data.catophosMl;
                    if(data.catophosFreq) document.getElementById('cow-catophos-freq').value = data.catophosFreq;
                    if(data.aminovitMl) document.getElementById('cow-aminovit-ml').value = data.aminovitMl;
                    if(data.aminovitFreq) document.getElementById('cow-aminovit-freq').value = data.aminovitFreq;
                    
                    if(data.weight && data.targetWeight) {
                        const cw = parseFloat(data.weight);
                        const tw = parseFloat(data.targetWeight);
                        if(cw > 0 && tw > 0) {
                            let percent = Math.round((cw / tw) * 100);
                            if(percent > 100) percent = 100;
                            
                            document.getElementById('target-progress-container').style.display = 'block';
                            document.getElementById('progress-percent').innerText = percent + '%';
                            document.getElementById('current-w-text').innerText = cw;
                            document.getElementById('target-w-text').innerText = tw;
                            
                            setTimeout(() => {
                                document.getElementById('progress-bar-fill').style.width = percent + '%';
                            }, 200);
                        }
                    }

                    if(badge) {
                        let statusColor = '#E8F5E9';
                        let statusTextColor = '#2E7D32';
                        let displayStatus = data.healthStatus || '🟢 সুস্থ';
                        
                        if(displayStatus.includes('পর্যবেক্ষণে')) {
                            statusColor = '#FFF3E0';
                            statusTextColor = '#E65100';
                        } else if(displayStatus.includes('বিক্রির')) {
                            statusColor = '#E3F2FD';
                            statusTextColor = '#1565C0';
                        }

                        badge.innerHTML = `${displayStatus} | ওজন: ${data.weight || '?'} কেজি`;
                        badge.style.background = statusColor;
                        badge.style.color = statusTextColor;
                    }

                    if(historyContainer) {
                        if(data.history && data.history.length > 0) {
                            let sortedHistory = data.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                            let html = '';
                            sortedHistory.forEach(item => {
                                html += `
                                <div class="fade-in" style="background: rgba(103, 58, 183, 0.05); border-left: 3px solid #673AB7; padding: 12px; border-radius: 10px; margin-bottom: 12px;">
                                    <div style="font-size: 0.75rem; color: #777; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                                        <span><i class="fa-regular fa-calendar-days"></i> ${item.date}</span>
                                        <button onclick="window.deleteCattleHistory(${cowId}, '${item.timestamp}')" style="background: none; border: none; color: #F44336; cursor: pointer;"><i class="fa-solid fa-trash-can"></i></button>
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--text-main); font-weight: 600; line-height: 1.5;">${item.details}</div>
                                </div>`;
                            });
                            historyContainer.innerHTML = html;
                        } else {
                            historyContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">এখনো কোনো হিস্ট্রি যোগ করা হয়নি।</div>`;
                        }
                    }

                } else {
                    if(badge) {
                        badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> প্রোফাইল অসম্পূর্ণ`;
                        badge.style.background = '#FFF3E0';
                        badge.style.color = '#E65100';
                    }
                }
            });
        }
    };

    // ৫. গরুর রেকর্ড ডিলিট করার ফাংশন
    window.deleteCattleHistory = function(cowId, timestamp) {
        window.showConfirmModal('রেকর্ড মুছবেন?', 'আপনি কি নিশ্চিত যে এই রেকর্ডটি মুছে ফেলতে চান?', function() {
            const currentUser = JSON.parse(localStorage.getItem('agroUser'));
            if(!currentUser || !currentUser.uid) return;
            
            // phone এর বদলে uid
            const docId = `cow_${currentUser.uid}_${cowId}`;
            
            if(window.db && window.fbFirestore) {
                const { doc, getDoc, setDoc } = window.fbFirestore;
                getDoc(doc(window.db, "cattle_profiles", docId)).then(docSnap => {
                    if(docSnap.exists() && docSnap.data().history) {
                        let history = docSnap.data().history.filter(item => item.timestamp !== timestamp);
                        setDoc(doc(window.db, "cattle_profiles", docId), { history: history }, { merge: true }).then(() => {
                            window.loadCattleData(cowId); 
                        });
                    }
                });
            }
        });
    };

    // ৬. গরুর লিস্ট লোড করার ফাংশন
    window.loadAllCattleSummary = function() {
        const currentUser = JSON.parse(localStorage.getItem('agroUser'));
        if(!currentUser || !currentUser.uid) return;
        
        if(window.db && window.fbFirestore) {
            const { collection, getDocs } = window.fbFirestore;
            getDocs(collection(window.db, "cattle_profiles")).then(snapshot => {
                snapshot.forEach(docSnap => {
                    const docId = docSnap.id;
                    // phone এর বদলে uid দিয়ে চেক করা হচ্ছে
                    if(docId.startsWith(`cow_${currentUser.uid}_`)) {
                        const cId = docId.split('_').pop();
                        const data = docSnap.data();
                        const title = document.getElementById(`list-title-${cId}`);
                        if(title && data.name) title.innerText = data.name;
                        const badge = document.getElementById(`list-badge-${cId}`);
                        if(badge && data.weight) badge.innerHTML = `<span style="color: #2E7D32; font-weight: 600;">ওজন: ${data.weight} কেজি</span>`;
                    }
                });
            });
        }
    };

    window.setupEditExpense = function(id) {
        if(!window.allTransactions) return;
        const trx = window.allTransactions.find(t => t.id === id);
        if(!trx) return;

        window.editingExpenseId = id; 

        document.getElementById('exp-type').value = trx.type;
        window.updateCategories(); 

        setTimeout(() => {
            document.getElementById('exp-category').value = trx.category;
            window.toggleCattleSelect(); 
            
            setTimeout(() => {
                if(trx.cattle && trx.cattle !== 'প্রযোজ্য নয়') {
                    document.getElementById('exp-cattle').value = trx.cattle;
                }
                document.getElementById('exp-details').value = trx.details;
                document.getElementById('exp-amount').value = trx.amount;

                const btn = document.getElementById('save-expense-btn');
                btn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> আপডেট করুন';
                btn.style.background = '#1565C0';

                if(!document.getElementById('cancel-edit-btn')) {
                    btn.insertAdjacentHTML('afterend', `<button id="cancel-edit-btn" onclick="window.cancelEditExpense()" style="width: 100%; background: #F44336; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; margin-top: 10px; box-shadow: 0 4px 10px rgba(244,67,54,0.2);">এডিট বাতিল করুন</button>`);
                }

                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 50);
        }, 50);
    };

    window.cancelEditExpense = function() {
        window.editingExpenseId = null;
        document.getElementById('exp-details').value = '';
        document.getElementById('exp-amount').value = '';
        
        const btn = document.getElementById('save-expense-btn');
        btn.innerHTML = 'হিসাব সেভ করুন';
        btn.style.background = 'var(--primary-main)'; 
        
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if(cancelBtn) cancelBtn.remove();
    };

    window.deleteExpense = function(id) {
        window.showConfirmModal(
            'হিসাব মুছে ফেলবেন?', 
            'আপনি কি নিশ্চিত যে এই হিসাবটি মুছে ফেলতে চান? মুছে ফেললে এটি আর ফেরত পাওয়া যাবে মিলিটারি।',
            function() {
                if(window.db && window.fbFirestore) {
                    const { doc, deleteDoc } = window.fbFirestore; 
                    
                    deleteDoc(doc(window.db, "farm_expenses", id)).then(() => {
                        window.showAppAlert('মুছে ফেলা হয়েছে!', 'আপনার নির্বাচিত হিসাবটি সফলভাবে ডিলিট করা হয়েছে।', 'fa-trash-can', '#F44336');
                    }).catch(err => {
                        window.showAppAlert('ত্রুটি', 'ডিলিট করতে সমস্যা হয়েছে। ইন্টারনেট কানেকশন চেক করুন।', 'fa-triangle-exclamation', '#F44336');
                    });
                }
            }
        );
    };

    window.showAppAlert = function(title, message, icon = 'fa-triangle-exclamation', color = '#FF9800') {
        if(navigator.vibrate) navigator.vibrate(50); 
        
        const modalHTML = `
            <div id="custom-app-alert" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 100000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg, #ffffff); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.8); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div style="width: 70px; height: 70px; background: ${color}15; color: ${color}; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 2.2rem; margin: 0 auto 15px auto;">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <h3 style="color: var(--text-main, #333); font-size: 1.3rem; margin-bottom: 10px; font-weight: 700;">${title}</h3>
                    <p style="color: var(--text-muted, #666); font-size: 0.95rem; margin-bottom: 25px; line-height: 1.5;">${message}</p>
                    <button onclick="document.getElementById('custom-app-alert').remove()" style="width: 100%; background: ${color}; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px ${color}40; font-size: 1rem; transition: 0.2s;">
                        বুঝতে পেরেছি
                    </button>
                </div>
            </div>`;
        
        const existing = document.getElementById('custom-app-alert');
        if(existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        setTimeout(() => {
            const alertBox = document.getElementById('custom-app-alert');
            if(alertBox) {
                alertBox.style.opacity = '1';
                alertBox.querySelector('div').style.transform = 'scale(1)';
            }
        }, 10);
    };

    window.viewCattle = function(id) {
        window.currentCattleId = id; 
        
        if (typeof window.loadPage === 'function') {
            window.loadPage('cattle-details');
        } else if (typeof loadPage === 'function') {
            loadPage('cattle-details');
        } else {
            console.error("loadPage ফাংশনটি পাওয়া যাচ্ছে না!");
        }
    };

    window.saveCattleData = function(cowId) {
        if(navigator.vibrate) navigator.vibrate(40);
        
        const name = document.getElementById('cow-name').value.trim();
        const status = document.getElementById('cow-health-status').value;
        const weight = document.getElementById('cow-weight').value;
        const targetWeight = document.getElementById('cow-target-weight').value;
        
        const catophosMl = document.getElementById('cow-catophos-ml').value;
        const catophosFreq = document.getElementById('cow-catophos-freq').value;
        const aminovitMl = document.getElementById('cow-aminovit-ml').value;
        const aminovitFreq = document.getElementById('cow-aminovit-freq').value;
        const nextVaccine = document.getElementById('cow-next-vaccine').value;

        const currentUser = JSON.parse(localStorage.getItem('agroUser')) || { phone: '01700000000' };
        const docId = `cow_${currentUser.phone}_${cowId}`;

        const btn = document.getElementById('save-cow-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> সেভ হচ্ছে...';

        if(window.db && window.fbFirestore) {
            const { doc, getDoc, setDoc } = window.fbFirestore;
            const docRef = doc(window.db, "cattle_profiles", docId);

            getDoc(docRef).then(docSnap => {
                let history = [];
                if (docSnap.exists() && docSnap.data().history) {
                    history = docSnap.data().history; 
                }

                let logDetails = [];
                if(weight) logDetails.push(`ওজন: ${weight} কেজি`);
                if(catophosMl) logDetails.push(`ক্যাটাফস: ${catophosMl}`);
                if(aminovitMl) logDetails.push(`এমাইনোভিট: ${aminovitMl}`);

                if(logDetails.length > 0) {
                    const todayStr = new Date().toLocaleDateString('bn-BD');
                    history.push({
                        date: todayStr,
                        timestamp: new Date().toISOString(), 
                        details: logDetails.join(' | ') 
                    });
                }

                const cowData = {
                    name: name || `ষাঁড় গরু - ${cowId}`,
                    healthStatus: status || "🟢 সুস্থ",
                    weight: weight || "",
                    targetWeight: targetWeight || "",
                    catophosMl: catophosMl || "",
                    catophosFreq: catophosFreq || "",
                    aminovitMl: aminovitMl || "",
                    aminovitFreq: aminovitFreq || "",
                    nextVaccineDate: nextVaccine || "",
                    imageUrl: window.currentCowImage || "", 
                    history: history, 
                    updatedAt: new Date().toISOString()
                };

                setDoc(docRef, cowData, { merge: true }).then(() => {
                    window.showAppAlert('সফল!', `সকল তথ্য ও লক্ষ্যমাত্রা সফলভাবে সেভ হয়েছে।`, 'fa-circle-check', '#4CAF50');
                    btn.innerHTML = originalText;
                    window.loadCattleData(cowId); 
                }).catch(err => {
                    window.showAppAlert('ত্রুটি!', `কারণ: ${err.message}`, 'fa-triangle-exclamation', '#F44336');
                    btn.innerHTML = originalText;
                });
            });
        }
    };

    window.loadCattleData = function(cowId) {
        const currentUser = JSON.parse(localStorage.getItem('agroUser')) || { phone: '01700000000' };
        const docId = `cow_${currentUser.phone}_${cowId}`;

        if(window.db && window.fbFirestore) {
            const { doc, getDoc } = window.fbFirestore;
            getDoc(doc(window.db, "cattle_profiles", docId)).then(docSnap => {
                const badge = document.getElementById('cow-status-badge');
                const title = document.getElementById('details-cow-title');
                const historyContainer = document.getElementById('cow-history-list');
                
                if(docSnap.exists()) {
                    const data = docSnap.data();
                    
                    if(data.imageUrl) {
                        window.currentCowImage = data.imageUrl;
                        const imgEl = document.getElementById('cow-profile-img');
                        const iconEl = document.getElementById('cow-default-icon');
                        if(imgEl && iconEl) {
                            imgEl.src = window.currentCowImage;
                            imgEl.style.display = 'block';
                            iconEl.style.display = 'none';
                        }
                    }

                    if(data.name) {
                        document.getElementById('cow-name').value = data.name === `ষাঁড় গরু - ${cowId}` ? "" : data.name;
                        if(title) title.innerText = data.name;
                    }
                    if(data.healthStatus) document.getElementById('cow-health-status').value = data.healthStatus;
                    if(data.weight) document.getElementById('cow-weight').value = data.weight;
                    if(data.targetWeight) document.getElementById('cow-target-weight').value = data.targetWeight;
                    if(data.nextVaccineDate) document.getElementById('cow-next-vaccine').value = data.nextVaccineDate;
                    
                    if(data.catophosMl) document.getElementById('cow-catophos-ml').value = data.catophosMl;
                    if(data.catophosFreq) document.getElementById('cow-catophos-freq').value = data.catophosFreq;
                    if(data.aminovitMl) document.getElementById('cow-aminovit-ml').value = data.aminovitMl;
                    if(data.aminovitFreq) document.getElementById('cow-aminovit-freq').value = data.aminovitFreq;
                    
                    if(data.weight && data.targetWeight) {
                        const cw = parseFloat(data.weight);
                        const tw = parseFloat(data.targetWeight);
                        if(cw > 0 && tw > 0) {
                            let percent = Math.round((cw / tw) * 100);
                            if(percent > 100) percent = 100;
                            
                            document.getElementById('target-progress-container').style.display = 'block';
                            document.getElementById('progress-percent').innerText = percent + '%';
                            document.getElementById('current-w-text').innerText = cw;
                            document.getElementById('target-w-text').innerText = tw;
                            
                            setTimeout(() => {
                                document.getElementById('progress-bar-fill').style.width = percent + '%';
                            }, 200);
                        }
                    } else {
                        document.getElementById('target-progress-container').style.display = 'none';
                    }

                    if(badge) {
                        let statusColor = '#E8F5E9';
                        let statusTextColor = '#2E7D32';
                        let displayStatus = data.healthStatus || '🟢 সুস্থ';
                        
                        if(displayStatus.includes('পর্যবেক্ষণে')) {
                            statusColor = '#FFF3E0';
                            statusTextColor = '#E65100';
                        } else if(displayStatus.includes('বিক্রির')) {
                            statusColor = '#E3F2FD';
                            statusTextColor = '#1565C0';
                        }

                        badge.innerHTML = `${displayStatus} | ওজন: ${data.weight || '?'} কেজি`;
                        badge.style.background = statusColor;
                        badge.style.color = statusTextColor;
                    }

                    if(historyContainer) {
                        if(data.history && data.history.length > 0) {
                            let sortedHistory = data.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                            let html = '';
                            sortedHistory.forEach(item => {
                                html += `
                                <div class="fade-in" style="background: rgba(103, 58, 183, 0.05); border-left: 3px solid #673AB7; padding: 12px; border-radius: 10px; margin-bottom: 12px; position: relative;">
                                    <div style="font-size: 0.75rem; color: #777; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                                        <span style="display: flex; align-items: center; gap: 6px;"><i class="fa-regular fa-calendar-days"></i> ${item.date}</span>
                                        <button onclick="window.deleteCattleHistory(${cowId}, '${item.timestamp}')" style="background: none; border: none; color: #F44336; cursor: pointer; padding: 0; font-size: 0.9rem; transition: 0.2s;">
                                            <i class="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--text-main); font-weight: 600; line-height: 1.5;">
                                        ${item.details}
                                    </div>
                                </div>`;
                            });
                            historyContainer.innerHTML = html;
                        } else {
                            historyContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">এখনো কোনো হিস্ট্রি যোগ করা হয়নি।</div>`;
                        }
                    }

                } else {
                    if(badge) {
                        badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> প্রোফাইল অসম্পূর্ণ`;
                        badge.style.background = '#FFF3E0';
                        badge.style.color = '#E65100';
                    }
                    if(historyContainer) {
                        historyContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">এখনো কোনো হিস্ট্রি যোগ করা হয়নি।</div>`;
                    }
                }
            });
        }
    };

    window.deleteCattleHistory = function(cowId, timestamp) {
        if(window.showConfirmModal) {
            window.showConfirmModal(
                'রেকর্ড মুছবেন?', 
                'আপনি কি নিশ্চিত যে এই হিস্ট্রি রেকর্ডটি মুছে ফেলতে চান?',
                function() {
                    const currentUser = JSON.parse(localStorage.getItem('agroUser')) || { phone: '01700000000' };
                    const docId = `cow_${currentUser.phone}_${cowId}`;

                    if(window.db && window.fbFirestore) {
                        const { doc, getDoc, setDoc } = window.fbFirestore;
                        const docRef = doc(window.db, "cattle_profiles", docId);
                        
                        getDoc(docRef).then(docSnap => {
                            if(docSnap.exists() && docSnap.data().history) {
                                let history = docSnap.data().history;
                                history = history.filter(item => item.timestamp !== timestamp);
                                
                                setDoc(docRef, { history: history }, { merge: true }).then(() => {
                                    window.showAppAlert('মুছে ফেলা হয়েছে!', 'রেকর্ডটি সফলভাবে ডিলিট করা হয়েছে।', 'fa-trash-can', '#F44336');
                                    window.loadCattleData(cowId); 
                                });
                            }
                        });
                    }
                }
            );
        }
    };

    window.showConfirmModal = function(title, message, onConfirmCallback) {
        if(navigator.vibrate) navigator.vibrate([30, 50, 30]); 
        
        const modalId = 'custom-confirm-modal';
        const existing = document.getElementById(modalId);
        if(existing) existing.remove();

        const modalHTML = `
            <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 100000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg, #ffffff); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.8); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 30px rgba(0,0,0,0.25);">
                    <div style="width: 70px; height: 70px; background: rgba(244, 67, 54, 0.12); color: #F44336; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 2.2rem; margin: 0 auto 15px auto;">
                        <i class="fa-solid fa-trash-can"></i>
                    </div>
                    <h3 style="color: var(--text-main, #333); font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">${title}</h3>
                    <p style="color: var(--text-muted, #666); font-size: 0.9rem; margin-bottom: 25px; line-height: 1.5;">${message}</p>
                    
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="document.getElementById('${modalId}').remove()" style="flex: 1; background: #EEEEEE; color: #555; border: none; padding: 12px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 0.95rem; transition: 0.2s;">
                            বাতিল
                        </button>
                        <button id="confirm-yes-btn" style="flex: 1; background: #F44336; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(244,67,54,0.3); transition: 0.2s;">
                            হ্যাঁ, মুছুন
                        </button>
                    </div>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('confirm-yes-btn').onclick = function() {
            document.getElementById(modalId).remove();
            if(onConfirmCallback) onConfirmCallback();
        };

        setTimeout(() => {
            const modalBox = document.getElementById(modalId);
            if(modalBox) {
                modalBox.style.opacity = '1';
                modalBox.querySelector('div').style.transform = 'scale(1)';
            }
        }, 10);
    };

    window.handleCowImageUpload = function(event) {
        const file = event.target.files[0];
        if (file) {
            if(file.size > 1048576) { 
                window.showAppAlert('ফাইল অনেক বড়!', 'দয়া করে ১ মেগাবাইটের কম সাইজের ছবি আপলোড করুন।', 'fa-image', '#FF9800');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64String = e.target.result;
                window.currentCowImage = base64String;
                
                const imgEl = document.getElementById('cow-profile-img');
                const iconEl = document.getElementById('cow-default-icon');
                if(imgEl && iconEl) {
                    imgEl.src = base64String;
                    imgEl.style.display = 'block';
                    iconEl.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        }
    };

    window.downloadProfilePDF = function() {
        if(navigator.vibrate) navigator.vibrate(40);
        
        const saveBtn = document.getElementById('save-cow-btn');
        const pdfBtn = event.currentTarget;
        const nav = document.querySelector('.bottom-nav');
        const header = document.querySelector('.app-header');
        
        if(saveBtn) saveBtn.style.display = 'none';
        if(pdfBtn) pdfBtn.style.display = 'none';
        if(nav) nav.style.display = 'none';
        if(header) header.style.display = 'none';
        
        window.print();
        
        setTimeout(() => {
            if(saveBtn) saveBtn.style.display = 'flex';
            if(pdfBtn) pdfBtn.style.display = 'flex';
            if(nav) nav.style.display = 'flex';
            if(header) header.style.display = 'flex';
        }, 1000);
    };

    window.loadAllCattleSummary = function() {
        const currentUser = JSON.parse(localStorage.getItem('agroUser')) || { phone: '01700000000' };
        if(window.db && window.fbFirestore) {
            const { collection, getDocs } = window.fbFirestore;
            getDocs(collection(window.db, "cattle_profiles")).then(snapshot => {
                snapshot.forEach(docSnap => {
                    const docId = docSnap.id;
                    if(docId.startsWith(`cow_${currentUser.phone}_`)) {
                        const parts = docId.split('_');
                        const cId = parts[parts.length - 1];
                        const data = docSnap.data();
                        
                        const title = document.getElementById(`list-title-${cId}`);
                        if(title && data.name) {
                            title.innerText = data.name;
                        }

                        const badge = document.getElementById(`list-badge-${cId}`);
                        if(badge && data.weight) {
                            badge.innerHTML = `<span style="color: #2E7D32; font-weight: 600;">ওজন: ${data.weight} কেজি (তথ্য সংরক্ষিত)</span>`;
                        }
                    }
                });
            });
        }
    };

    // --- বাজার দর এডিট করার পপআপ (Admin Market Edit Modal) ---
    window.showEditPriceModal = function(itemName, currentPrice) {
        window.vibrate(40);
        const modalHTML = `
            <div id="price-edit-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 100000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.9); transition: transform 0.3s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    
                    <h3 style="color: var(--text-main); font-size: 1.25rem; margin-bottom: 5px; font-weight: 700;">মূল্য পরিবর্তন</h3>
                    <p style="color: var(--primary-main); font-weight: 700; margin-bottom: 15px; font-size: 1.05rem;">${itemName}</p>
                    
                    <div style="position: relative; margin-bottom: 20px;">
                        <span style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); font-weight: 700; color: var(--text-main); font-size: 1.2rem;">৳</span>
                        <input type="number" id="new-price-input" value="${currentPrice}" style="width: 100%; padding: 15px 15px 15px 35px; border-radius: 12px; border: 1.5px solid #E0E0E0; text-align: center; font-size: 1.4rem; outline: none; background: #F9F9F9; font-weight: 700; color: var(--text-main); box-sizing: border-box;">
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button onclick="window.closePriceEditModal()" style="flex: 1; background: #f1f3f4; border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer; color: var(--text-muted);">বাতিল</button>
                        <button onclick="window.saveNewPrice('${itemName}')" style="flex: 1; background: var(--primary-main); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(46,125,50,0.3);">সেভ করুন</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => {
            const modal = document.getElementById('price-edit-modal');
            if(modal) {
                modal.style.opacity = '1';
                modal.querySelector('div').style.transform = 'scale(1)';
            }
        }, 10);
    };

    window.closePriceEditModal = function() {
        const modal = document.getElementById('price-edit-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    // --- বাজার দর আইটেম মুছে ফেলার কনফার্মেশন পপআপ ---
    window.showDeletePriceModal = function(itemName) {
        if(window.showConfirmModal) {
            window.showConfirmModal(
                'উপাদানটি মুছবেন?', 
                `আপনি কি নিশ্চিত যে <b>${itemName}</b> বাজার দর তালিকা থেকে মুছে ফেলতে চান?`,
                function() {
                    window.deleteMarketPrice(itemName);
                }
            );
        }
    };

    // --- ফায়ারবেস থেকে আইটেম মুছে ফেলার এক্সিকিউশন ---
    window.deleteMarketPrice = function(itemName) {
        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            // { deleted: true } সেট করা হচ্ছে, যাতে গ্লোবাল লিস্টে আর না দেখায়
            setDoc(doc(window.db, "market_prices", itemName), {
                deleted: true,
                last_updated: new Date().toISOString()
            }, { merge: true }).then(() => {
                window.showAppAlert('সফলভাবে মোছা হয়েছে!', `${itemName} লিস্ট থেকে চিরতরে মুছে ফেলা হয়েছে।`, 'fa-trash-can', '#F44336');
            }).catch(err => {
                window.showAppAlert('ত্রুটি!', `সার্ভার সমস্যা: ${err.message}`, 'fa-triangle-exclamation', '#F44336');
            });
        } else {
            let deletedItems = JSON.parse(localStorage.getItem('agroDeletedPrices')) || {};
            deletedItems[itemName] = true;
            localStorage.setItem('agroDeletedPrices', JSON.stringify(deletedItems));
            window.showAppAlert('সফলভাবে মোছা হয়েছে!', `${itemName} লিস্ট থেকে মুছে ফেলা হয়েছে (Offline)।`, 'fa-trash-can', '#F44336');
            window.loadAdminMarketPrices();
        }
    };

    // --- প্রোটিন (CP%) ক্যালকুলেশনের ডায়নামিক লজিক ---
    window.calculateTotalProtein = function() {
        let totalKg = 0;
        let totalCP = 0, totalTDN = 0, totalCa = 0, totalP = 0, totalMin = 0, totalVit = 0;

        const inputs = document.querySelectorAll('.protein-kg-input');
        inputs.forEach(input => {
            const kg = parseFloat(input.value) || 0;
            const cp = parseFloat(input.getAttribute('data-cp')) || 0;
            const tdn = parseFloat(input.getAttribute('data-tdn')) || 0;
            const ca = parseFloat(input.getAttribute('data-ca')) || 0;
            const p = parseFloat(input.getAttribute('data-p')) || 0;
            const min = parseFloat(input.getAttribute('data-min')) || 0;
            const vit = parseFloat(input.getAttribute('data-vit')) || 0;

            if(kg > 0) {
                totalKg += kg;
                totalCP += (kg * cp);
                totalTDN += (kg * tdn);
                totalCa += (kg * ca);
                totalP += (kg * p);
                totalMin += (kg * min);
                totalVit += (kg * vit);
            }
        });

        // পার্সেন্টেজ বের করা
        const finalCP = totalKg > 0 ? (totalCP / totalKg).toFixed(1) : "0.0";
        const finalTDN = totalKg > 0 ? (totalTDN / totalKg).toFixed(1) : "0.0";
        const finalCa = totalKg > 0 ? (totalCa / totalKg).toFixed(2) : "0.00";
        const finalP = totalKg > 0 ? (totalP / totalKg).toFixed(2) : "0.00";
        const finalMin = totalKg > 0 ? (totalMin / totalKg).toFixed(1) : "0.0";
        const finalVit = totalKg > 0 ? (totalVit / totalKg).toFixed(1) : "0.0";

        const kgElement = document.getElementById('calc-total-kg');
        if(kgElement) {
            kgElement.innerText = totalKg.toFixed(1);
            document.getElementById('calc-total-cp').innerText = finalCP + '%';
            document.getElementById('calc-total-tdn').innerText = finalTDN + '%';
            document.getElementById('calc-total-ca').innerText = finalCa + '%';
            document.getElementById('calc-total-p').innerText = finalP + '%';
            document.getElementById('calc-total-min').innerText = finalMin + '%';
            document.getElementById('calc-total-vit').innerText = finalVit + '%';

            // ১০০ কেজি ওয়ার্নিং লজিক
            if(totalKg > 100) {
                kgElement.style.color = '#FF5252'; 
            } else if(totalKg === 100) {
                kgElement.style.color = '#69F0AE'; 
            } else {
                kgElement.style.color = '#FFEB3B'; 
            }
        }
    };

    // ==========================================
    // সঠিক পুষ্টিমান ডাটাবেস (CP, TDN, Ca, P, Min, Vit)
    // ==========================================
    window.defaultProteinIngredients = [
        // --- প্রধান শক্তির উৎস ও প্রোটিন ---
        { id: 'p_1', name: 'ভুট্টা ভাঙা / গুঁড়া', cp: 9.0, tdn: 82.0, ca: 0.02, p: 0.30, min: 1.5, vit: 0.0, work: 'প্রধান শক্তির উৎস ও কার্বোহাইড্রেট' },
        { id: 'p_new4', name: 'ক্ষুদ (Broken Rice)', cp: 8.5, tdn: 82.0, ca: 0.05, p: 0.20, min: 2.0, vit: 0.0, work: 'দ্রুত শক্তি ও ওজন বৃদ্ধির নিরাপদ কার্বোহাইড্রেট' },
        { id: 'p_2', name: 'সয়াবিন মিল', cp: 46.0, tdn: 78.0, ca: 0.30, p: 0.65, min: 6.5, vit: 0.0, work: 'সবচেয়ে ভালো মানের উদ্ভিজ্জ প্রোটিন' },
        { id: 'p_3', name: 'সরিষার খৈল', cp: 36.0, tdn: 72.0, ca: 0.60, p: 1.00, min: 8.0, vit: 0.0, work: 'সাশ্রয়ী মূল্যের প্রোটিন ও ফ্যাট' },
        { id: 'p_new5', name: 'তিলের খৈল', cp: 38.0, tdn: 70.0, ca: 2.00, p: 1.20, min: 11.0, vit: 0.0, work: 'উচ্চ প্রোটিন ও ক্যালসিয়ামের দারুণ উৎস' },
        { id: 'p_4', name: 'ডিডিজিএস (DDGS)', cp: 28.0, tdn: 80.0, ca: 0.10, p: 0.80, min: 4.5, vit: 0.0, work: 'বাইপাস প্রোটিন ও হজমযোগ্য শক্তি' },
        { id: 'p_new6', name: 'পিকেসি (Palm Kernel Cake)', cp: 16.0, tdn: 72.0, ca: 0.30, p: 0.60, min: 5.0, vit: 0.0, work: 'নিরাপদ ফ্যাট ও প্রোটিনের চমৎকার উৎস' },
        
        // --- ফাইবার ও ভুষি জাতীয় ---
        { id: 'p_new1', name: 'সয়াবিনের খোসা (Soybean Hull)', cp: 12.0, tdn: 75.0, ca: 0.55, p: 0.17, min: 6.0, vit: 0.0, work: 'উন্নতমানের হজমযোগ্য ফাইবার ও নিরাপদ শক্তি' },
        { id: 'p_5', name: 'গমের ভুষি', cp: 15.0, tdn: 65.0, ca: 0.10, p: 1.00, min: 5.0, vit: 0.0, work: 'ফাইবার ও শক্তি বৃদ্ধি করে' },
        { id: 'p_6', name: 'রাইস কুড়া / পলিস', cp: 12.0, tdn: 72.0, ca: 0.05, p: 1.40, min: 9.0, vit: 0.0, work: 'ফ্যাট ও শক্তির দারুণ উৎস' },
        { id: 'p_new2', name: 'অ্যাংকর ডালের ভুষি', cp: 14.5, tdn: 68.0, ca: 0.60, p: 0.35, min: 5.5, vit: 0.0, work: 'নিরাপদ ফাইবার ও প্রোটিনের মিশ্রণ' },
        { id: 'p_new3', name: 'ছোলার ভুষি', cp: 16.0, tdn: 65.0, ca: 0.70, p: 0.20, min: 6.0, vit: 0.0, work: 'মাংস বৃদ্ধি ও পরিপাকতন্ত্র ভালো রাখে' },
        { id: 'p_7', name: 'ডালের খোসা (মসুর/মুগ)', cp: 16.0, tdn: 60.0, ca: 0.80, p: 0.20, min: 4.0, vit: 0.0, work: 'পরিপাকতন্ত্র ভালো রাখে ও ফাইবার দেয়' },
        { id: 'p_9', name: 'ডিওআরবি (DORB)', cp: 14.0, tdn: 58.0, ca: 0.10, p: 1.50, min: 10.0, vit: 0.0, work: 'সাশ্রয়ী ফাইবার উপাদান' },
        
        // --- প্রাণিজ প্রোটিন ও খনিজ/ভিটামিন ---
        { id: 'p_8', name: 'শুঁটকি মাছের গুঁড়ো', cp: 52.0, tdn: 70.0, ca: 5.00, p: 3.00, min: 20.0, vit: 0.0, work: 'উচ্চমাত্রার প্রাণিজ প্রোটিন ও ক্যালসিয়াম' },
        { id: 'p_10', name: 'লাইমস্টোন (চুনাপাথর)', cp: 0.0, tdn: 0.0, ca: 38.00, p: 0.00, min: 98.0, vit: 0.0, work: 'হাড় গঠন ও ক্যালসিয়ামের প্রধান উৎস' },
        { id: 'p_11', name: 'ডিসিপি (DCP)', cp: 0.0, tdn: 0.0, ca: 22.00, p: 18.00, min: 95.0, vit: 0.0, work: 'হাড় শক্ত করতে ক্যালসিয়াম-ফসফরাস' },
        { id: 'p_12', name: 'লবণ (Salt)', cp: 0.0, tdn: 0.0, ca: 0.00, p: 0.00, min: 99.0, vit: 0.0, work: 'খাবারে রুচি বৃদ্ধি ও হজমে সহায়তা করে' },
        { id: 'p_13', name: 'খাবার সোডা', cp: 0.0, tdn: 0.0, ca: 0.00, p: 0.00, min: 99.0, vit: 0.0, work: 'রুমেনের এসিডিটি কমায় ও হজম ঠিক রাখে' },
        { id: 'p_14', name: 'টক্সিন বাইন্ডার', cp: 0.0, tdn: 0.0, ca: 0.00, p: 0.00, min: 0.0, vit: 0.0, work: 'ছত্রাকযুক্ত খাবারের ক্ষতিকর বিষক্রিয়া নষ্ট করে' },
        { id: 'p_15', name: 'লাইভ ইস্ট (Yeast)', cp: 40.0, tdn: 0.0, ca: 0.00, p: 0.00, min: 5.0, vit: 10.0, work: 'রুমেনের ব্যাকটেরিয়ার পরিমাণ বাড়িয়ে দেয়' },
        { id: 'p_16', name: 'ভিটামিন প্রিমিক্স', cp: 0.0, tdn: 0.0, ca: 0.00, p: 0.00, min: 50.0, vit: 100.0, work: 'রোগ প্রতিরোধ ও ভিটামিন ঘাটতি পূরণ করে' },
        { id: 'p_17', name: 'বাইপাস ফ্যাট', cp: 0.0, tdn: 150.0, ca: 0.00, p: 0.00, min: 0.0, vit: 0.0, work: 'দ্রুত ওজন ও মাংস বৃদ্ধিতে উচ্চ শক্তি প্রদান করে' },
        { id: 'p_18', name: 'মোলাসেস / ঝোলা গুড়', cp: 3.0, tdn: 72.0, ca: 0.80, p: 0.10, min: 10.0, vit: 0.0, work: 'খাবারে স্বাদ বাড়ায় ও তাৎক্ষণিক শক্তি দেয়' }
    ];

    // [অ্যাডমিন] প্যানেল রেন্ডারিং
    window.renderAdminProteinTab = function(container) {
        container.innerHTML = `
            <button onclick="window.showAddProteinModal()" style="width: 100%; padding: 14px; background: rgba(0, 121, 107, 0.1); color: #00796B; border: 1.5px dashed #00796B; border-radius: 12px; font-size: 1.05rem; font-weight: 600; margin-bottom: 15px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.3s;">
                <i class="fa-solid fa-plus"></i> নতুন উপাদান ও প্রোটিন % যুক্ত করুন
            </button>
            <div id="admin-protein-list" class="agro-card" style="padding: 5px 15px; min-height: 100px;">
                <div style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:#00796B;"></i></div>
            </div>
        `;
        window.loadAdminProteinIngredients();
    };

    window.loadAdminProteinIngredients = function() {
        const listArea = document.getElementById('admin-protein-list');
        if(!listArea) return;

        const renderList = (items) => {
            window.adminProteinMap = {}; 
            let html = '';
            items.forEach(item => {
                window.adminProteinMap[item.id] = item;
                html += `
                <div class="fade-in" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                    <div style="flex: 1; padding-right: 10px;">
                        <h4 style="font-size:1.02rem; color:var(--text-main); margin-bottom: 4px;">
                            ${item.name} <span style="background: rgba(0, 150, 136, 0.1); color: #00796B; font-size: 0.75rem; font-weight: 700; padding: 2px 6px; border-radius: 8px; margin-left: 5px;">CP: ${item.cp}%</span>
                        </h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;"><i class="fa-solid fa-circle-info" style="color:#00796B;"></i> ${item.work}</p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="window.showEditProteinModal('${item.id}')" style="background: rgba(52, 152, 219, 0.1); color: #3498db; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s;"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="window.deleteProtein('${item.id}')" style="background: rgba(217, 48, 37, 0.1); color: #D93025; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s;"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>`;
            });
            listArea.innerHTML = html || '<p style="text-align:center; padding:15px; color:var(--text-muted);">কোনো উপাদান নেই।</p>';
        };

        if (window.db && window.fbFirestore) {
            const { collection, onSnapshot } = window.fbFirestore;
            onSnapshot(collection(window.db, "protein_ingredients"), (snapshot) => {
                let items = [];
                snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
                
                if(items.length === 0) items = window.defaultProteinIngredients;
                
                localStorage.setItem('agroProteinIngredients', JSON.stringify(items));
                renderList(items);
            }, (error) => {
                // রুলস এরর হলে অফলাইন ব্যাকআপ লোড হবে
                let items = JSON.parse(localStorage.getItem('agroProteinIngredients'));
                if(!items || items.length === 0) items = window.defaultProteinIngredients;
                renderList(items);
            });
        } else {
            let items = JSON.parse(localStorage.getItem('agroProteinIngredients'));
            if(!items || items.length === 0) items = window.defaultProteinIngredients;
            renderList(items);
        }
    };

    // [অ্যাডমিন] পপআপ: নতুন উপাদান যোগ
    window.showAddProteinModal = function() {
        window.vibrate(40);
        const modalHTML = `
            <div id="add-protein-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 90%; max-width: 380px; border-radius: 24px; padding: 25px 20px; transform: scale(0.9); transition: transform 0.3s ease; max-height: 90vh; overflow-y: auto;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: #00796B; font-size: 1.25rem; display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-flask"></i> নতুন উপাদান যোগ
                        </h3>
                        <button onclick="window.closeAddProteinModal()" style="background: #f1f3f4; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color:var(--text-muted);"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">উপাদানের নাম</label>
                        <input type="text" id="p-name" placeholder="যেমন: খেসারি ডাল" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; font-family: inherit; outline:none; box-sizing: border-box;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">প্রোটিন (CP) %</label>
                        <input type="number" id="p-cp" placeholder="যেমন: 22" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; font-family: inherit; outline:none; box-sizing: border-box;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">উপাদানের কাজ</label>
                        <input type="text" id="p-work" placeholder="যেমন: হজমশক্তি বাড়ায় ও শক্তি দেয়..." style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; font-family: inherit; outline:none; box-sizing: border-box;">
                    </div>
                    
                    <button onclick="window.saveNewProtein()" style="width: 100%; background: #00796B; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 121, 107, 0.3);">
                        <i class="fa-solid fa-cloud-arrow-up"></i> পাবলিশ করুন
                    </button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => { 
            document.getElementById('add-protein-modal').style.opacity = '1'; 
            document.getElementById('add-protein-modal').querySelector('div').style.transform = 'scale(1)'; 
        }, 10);
    };

    window.closeAddProteinModal = function() {
        const modal = document.getElementById('add-protein-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    window.saveNewProtein = function() {
        window.vibrate(40);
        const name = document.getElementById('p-name').value;
        const cp = parseFloat(document.getElementById('p-cp').value);
        const work = document.getElementById('p-work').value;
        
        if(!name || isNaN(cp) || !work) {
            return alert("অনুগ্রহ করে নাম, প্রোটিন % এবং কাজের বিবরণ দিন!");
        }
        
        const docId = 'protein_' + Date.now();
        const data = { name, cp, work, timestamp: new Date().toISOString() };

        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            setDoc(doc(window.db, "protein_ingredients", docId), data).then(() => {
                window.vibrate(60);
                window.closeAddProteinModal();
            }).catch(err => alert("সার্ভার ত্রুটি: " + err.message));
        } else {
            let items = JSON.parse(localStorage.getItem('agroProteinIngredients')) || window.defaultProteinIngredients;
            items.unshift({...data, id: docId});
            localStorage.setItem('agroProteinIngredients', JSON.stringify(items));
            window.vibrate(60);
            window.closeAddProteinModal();
            window.loadAdminProteinIngredients();
        }
    };

    // [অ্যাডমিন] পপআপ: বিদ্যমান উপাদান এডিট
    window.showEditProteinModal = function(id) {
        window.vibrate(40);
        const data = window.adminProteinMap[id];
        if(!data) return;

        const modalHTML = `
            <div id="edit-protein-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 90%; max-width: 380px; border-radius: 24px; padding: 25px 20px; transform: scale(0.9); transition: transform 0.3s ease; max-height: 90vh; overflow-y: auto;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: #3498db; font-size: 1.25rem; display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-pen-to-square"></i> তথ্য এডিট করুন
                        </h3>
                        <button onclick="window.closeEditProteinModal()" style="background: #f1f3f4; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color:var(--text-muted);"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">উপাদানের নাম</label>
                        <input type="text" id="edit-p-name" value="${data.name}" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; font-family: inherit; outline:none; box-sizing: border-box;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">প্রোটিন (CP) %</label>
                        <input type="number" id="edit-p-cp" value="${data.cp}" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; font-family: inherit; outline:none; box-sizing: border-box;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">উপাদানের কাজ</label>
                        <input type="text" id="edit-p-work" value="${data.work}" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; background: #F9F9F9; margin-top:8px; font-family: inherit; outline:none; box-sizing: border-box;">
                    </div>
                    
                    <button onclick="window.updateProtein('${id}')" style="width: 100%; background: #3498db; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);">
                        <i class="fa-solid fa-cloud-arrow-up"></i> আপডেট করুন
                    </button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => { 
            const modal = document.getElementById('edit-protein-modal');
            if(modal) {
                modal.style.opacity = '1'; 
                modal.querySelector('div').style.transform = 'scale(1)'; 
            }
        }, 10);
    };

    window.closeEditProteinModal = function() {
        const modal = document.getElementById('edit-protein-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    window.updateProtein = function(id) {
        window.vibrate(40);
        const name = document.getElementById('edit-p-name').value;
        const cp = parseFloat(document.getElementById('edit-p-cp').value);
        const work = document.getElementById('edit-p-work').value;
        
        if(!name || isNaN(cp) || !work) {
            return alert("অনুগ্রহ করে সকল তথ্য পূরণ করুন!");
        }

        const data = { name, cp, work, updatedAt: new Date().toISOString() };

        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            setDoc(doc(window.db, "protein_ingredients", id), data, { merge: true }).then(() => {
                window.vibrate(60);
                window.closeEditProteinModal();
            }).catch(err => alert("আপডেট ব্যর্থ হয়েছে। সার্ভার ত্রুটি!"));
        } else {
            let items = JSON.parse(localStorage.getItem('agroProteinIngredients')) || [];
            const idx = items.findIndex(d => d.id === id);
            if(idx !== -1) {
                items[idx] = { ...items[idx], ...data };
                localStorage.setItem('agroProteinIngredients', JSON.stringify(items));
            }
            window.vibrate(60);
            window.closeEditProteinModal();
            window.loadAdminProteinIngredients();
        }
    };

    window.deleteProtein = function(id) {
        window.showConfirmModal(
            'উপাদানটি মুছবেন?', 
            'এই প্রোটিন উপাদানটি ডাটাবেস থেকে চিরতরে মুছে যাবে।',
            function() {
                if(window.db && window.fbFirestore) {
                    const { doc, deleteDoc } = window.fbFirestore;
                    deleteDoc(doc(window.db, "protein_ingredients", id)).then(() => {
                        window.showAppAlert('সফলভাবে মোছা হয়েছে!', 'উপাদানটি মুছে ফেলা হয়েছে।', 'fa-trash-can', '#F44336');
                    }).catch(err => {
                        window.showAppAlert('ত্রুটি!', 'সার্ভার থেকে ডিলিট করতে সমস্যা হয়েছে!', 'fa-triangle-exclamation', '#F44336');
                    });
                } else {
                    let items = JSON.parse(localStorage.getItem('agroProteinIngredients')) || [];
                    items = items.filter(d => d.id !== id);
                    localStorage.setItem('agroProteinIngredients', JSON.stringify(items));
                    window.showAppAlert('সফলভাবে মোছা হয়েছে!', 'উপাদানটি মুছে ফেলা হয়েছে (Offline)।', 'fa-trash-can', '#F44336');
                    window.loadAdminProteinIngredients(); 
                }
            }
        );
    };

    window.renderProteinCalculatorPage = function() {
        const listArea = document.getElementById('protein-ingredients-list-view');
        if(!listArea) return;

        const renderItems = (items) => {
            let html = '';
            items.forEach((item) => {
                // ডিফল্ট মান সেট করা 
                const tdn = item.tdn || 0;
                const ca = item.ca || 0;
                const p = item.p || 0;
                const min = item.min || 0;
                const vit = item.vit || 0;

                html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px dashed #E0E0E0;">
                    <div style="flex: 1; padding-right: 15px;">
                        <h4 style="font-size:1.05rem; color:var(--text-main); margin: 0 0 4px 0;">${item.name}</h4>
                        <p style="font-size:0.75rem; color:var(--text-muted); margin: 0 0 6px 0;"><i class="fa-solid fa-circle-info" style="color:#00796B;"></i> ${item.work}</p>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <span style="background: rgba(0, 150, 136, 0.1); color: #00796B; font-size: 0.7rem; font-weight: 700; padding: 3px 6px; border-radius: 8px;">CP: ${item.cp}%</span>
                            <span style="background: rgba(255, 152, 0, 0.1); color: #E65100; font-size: 0.7rem; font-weight: 700; padding: 3px 6px; border-radius: 8px;">TDN: ${tdn}%</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="number" class="protein-kg-input" data-cp="${item.cp}" data-tdn="${tdn}" data-ca="${ca}" data-p="${p}" data-min="${min}" data-vit="${vit}" onkeyup="window.calculateTotalProtein()" onchange="window.calculateTotalProtein()" placeholder="0" style="width: 70px; padding: 12px 5px; border-radius: 10px; border: 1.5px solid #E0E0E0; text-align: center; font-size: 1.15rem; font-weight: 700; outline: none; background: #F9F9F9; box-sizing: border-box;">
                        <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 700;">কেজি</span>
                    </div>
                </div>`;
            });
            listArea.innerHTML = html;
        };

        // লোকাল স্টোরেজ ফোর্স আপডেট (যাতে আগের ভুল ডাটা না আসে)
        localStorage.setItem('agroProteinIngredients', JSON.stringify(window.defaultProteinIngredients));
        renderItems(window.defaultProteinIngredients);
    };

    // ==========================================
    // ভেটেরিনারি মেডিসিন ইনডেক্স (Vet DIMS Clone)
    // ==========================================

    window.vetMedicinesData = [
        { id: 'm1', name: 'ক্যাটাফস (Catophos)', generic: 'Butaphosphan + Vitamin B12', company: 'Renata Ltd.', category: 'ভিটামিন ও মিনারেল', indications: 'শারীরিক দুর্বলতা, রুচিহীনতা, বিপাকীয় সমস্যা, ক্যালসিয়াম ঘাটতি দূর করে।', dosage: 'গরু/মহিষ: ১০-২৫ মিলি (শিরায়, মাংসে বা চামড়ার নিচে)।' },
        { id: 'm2', name: 'অ্যামাইনোভিট প্লাস ভেট', generic: 'Amino Acids + Vitamins', company: 'Acme Laboratories', category: 'মাল্টিভিটামিন', indications: 'দ্রুত ওজন বৃদ্ধি, রোগ প্রতিরোধ ক্ষমতা বাড়ানো, ধকল (Stress) কাটানো।', dosage: '১০০ কেজি ওজনের জন্য ১০-২০ মিলি (মাংসে)।' },
        { id: 'm3', name: 'রেনাডেক্স ভেট (Renadex)', generic: 'Dexamethasone', company: 'Renata Ltd.', category: 'স্টেরয়েড / অ্যান্টি-ইনফ্লেমেটরি', indications: 'তীব্র জ্বর, এলার্জি, জয়েন্টে ব্যথা, লাম্পি স্কিন ডিজিজের ফোলা কমানো।', dosage: 'গরু: ৫-১৫ মিলি (মাংসে বা শিরায়)। গর্ভাবস্থায় ব্যবহার নিষেধ।' },
        { id: 'm4', name: 'কম্বিপেন ভেট (Combipen)', generic: 'Penicillin + Streptomycin', company: 'Renata Ltd.', category: 'অ্যান্টিবায়োটিক', indications: 'খুরা রোগ (FMD), নিউমোনিয়া, গলাফুলা, ম্যাসটাইটিস বা ওলান পাকা।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ১ ভায়াল (মাংসে)।' },
        { id: 'm5', name: 'গ্লুকোলাইট ভেট (Glucolyte)', generic: 'Electrolytes + Dextrose', company: 'Square Pharma', category: 'স্যালাইন / এনার্জি', indications: 'হিট স্ট্রোক, ডায়রিয়া, পানিশূন্যতা, তীব্র গরমে ধকল কমানো।', dosage: '১ লিটার পানিতে ২০-৪০ গ্রাম মিশিয়ে খাওয়াতে হবে।' },
        { id: 'm6', name: 'প্রোটিমিন ভেট (Protimin)', generic: 'Vitamin & Mineral Premix', company: 'Renata Ltd.', category: 'প্রিমিক্স', indications: 'খাবারের পুষ্টিমান বৃদ্ধি, ওজন বাড়ানো, হাড় শক্ত করা, প্রজনন ক্ষমতা বৃদ্ধি।', dosage: 'প্রতি ১০০ কেজি খাবারে ১ কেজি মেশাতে হবে।' },
        { id: 'm7', name: 'এনডেক্স (Endex)', generic: 'Triclabendazole + Levamisole', company: 'Elanco', category: 'কৃমিনাশক (Dewormer)', indications: 'কলিজা কৃমি, ফিতা কৃমি, গোল কৃমি ও পাকস্থলীর কৃমি মুক্ত করতে।', dosage: 'প্রতি ৭৫ কেজি ওজনের জন্য ১টি বড়ি (খাবারের সাথে)।' },
        { id: 'm8', name: 'রেনামাইসিন (Renamycin)', generic: 'Oxytetracycline LA', company: 'Renata Ltd.', category: 'অ্যান্টিবায়োটিক (Long Acting)', indications: 'তড়কা, বাদলা, গলাফুলা, নাভী পাকা, নিউমোনিয়া ও ব্যাকটেরিয়াল ইনফেকশন।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ১ মিলি (শুধুমাত্র মাংসে)।' },
        { id: 'm9', name: 'হেপাভেট (Hepavet)', generic: 'Liver Tonic', company: 'Acme Laboratories', category: 'লিভার টনিক', indications: 'কৃমিনাশক দেওয়ার পর লিভারের সুস্থতা, হজমশক্তি ও ক্ষুধা বৃদ্ধি।', dosage: 'বড় গরু: ৫০-১০০ মিলি প্রতিদিন (খাওয়ানোর জন্য)।' },
        { id: 'm10', name: 'জিজ ভেট (Ziz Vet)', generic: 'Zinc Sulfate', company: 'Square Pharma', category: 'মিনারেল (জিংক)', indications: 'চুল পড়া রোধ, চামড়ার উজ্জ্বলতা বৃদ্ধি, ক্ষুর ও ওলানের ক্ষত শুকানো।', dosage: 'বড় গরু: ১-২টি বল প্রতিদিন ৫-৭ দিন।' },
        { id: 'm11', name: 'অ্যাসিমেক (Acemec 1%)', generic: 'Ivermectin', company: 'Square Pharma', category: 'পরজীবীনাশক', indications: 'উঁকুন, আঠালী, মাইট এবং ভেতরের গোল কৃমি ধ্বংস করে।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ১ মিলি (শুধুমাত্র চামড়ার নিচে)।' },
        { id: 'm12', name: 'ফ্যাসিনেক্স (Fasinex)', generic: 'Triclabendazole', company: 'Novartis', category: 'কৃমিনাশক (কলিজা কৃমি)', indications: 'যেকোনো স্টেজের কলিজা কৃমি (Liver Fluke) দমনে অত্যন্ত কার্যকরী।', dosage: '১টি বল প্রতি ৭৫-১০০ কেজি ওজনের জন্য।' },
        { id: 'm13', name: 'মক্সিলিন ভেট (Moxilin)', generic: 'Amoxicillin', company: 'Square Pharma', category: 'অ্যান্টিবায়োটিক', indications: 'শ্বাসতন্ত্রের ইনফেকশন, নিউমোনিয়া, গলাফুলা, কাটা-ছেঁড়া ও ক্ষতের ইনফেকশন।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm14', name: 'এনরোসিন ভেট (Enrocin)', generic: 'Enrofloxacin', company: 'Renata Ltd.', category: 'অ্যান্টিবায়োটিক', indications: 'মারাত্মক ব্যাকটেরিয়াল ইনফেকশন, ডায়রিয়া, এবং ম্যাসটাইটিস (ওলান পাকা)।', dosage: 'প্রতি ২০ কেজি ওজনের জন্য ১ মিলি (মাংসে)। টানা ৩-৫ দিন।' },
        { id: 'm15', name: 'সেফট্রন ভেট (Ceftron)', generic: 'Ceftriaxone', company: 'Square Pharma', category: 'অ্যান্টিবায়োটিক', indications: 'তীব্র নিউমোনিয়া, খুরা রোগ, এবং অপারেশনের পর ইনফেকশন রোধে।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ১ গ্রাম ভায়াল (মাংসে বা শিরায়)।' },
        { id: 'm16', name: 'জেন্টামাইসিন (Gentamycin)', generic: 'Gentamicin Sulphate', company: 'Acme Laboratories', category: 'অ্যান্টিবায়োটিক', indications: 'পাকস্থলী ও অন্ত্রের ইনফেকশন, রক্ত আমাশয় ও জরায়ুর ইনফেকশন।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm17', name: 'প্রোনাপেন ৪০ এল (Pronapen 40L)', generic: 'Penicillin G', company: 'Renata Ltd.', category: 'অ্যান্টিবায়োটিক', indications: 'তড়কা, বাদলা, গলাফুলা এবং যেকোনো গভীর ক্ষতের ব্যাকটেরিয়াল ইনফেকশন।', dosage: '১ ভায়াল ২-৪ মিলি ডিস্টিল ওয়াটারে মিশিয়ে মাংসে দিতে হবে।' },
        { id: 'm18', name: 'অক্সিসেন্ট ২০% (Oxysent 20%)', generic: 'Oxytetracycline LA', company: 'Square Pharma', category: 'অ্যান্টিবায়োটিক (Long Acting)', indications: 'দীর্ঘমেয়াদী ইনফেকশন, খুরা রোগ ও নাভী পাকার চিকিৎসায়।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ১ মিলি (শুধুমাত্র মাংসে)।' },
        { id: 'm19', name: 'কিটোভেট (Ketovet)', generic: 'Ketoprofen', company: 'Acme Laboratories', category: 'ব্যথানাশক (NSAID)', indications: 'তীব্র ব্যথা, অস্থিসন্ধির প্রদাহ, ওলান পাকা এবং লাম্পি স্কিনের ব্যথা উপশমে।', dosage: 'প্রতি ৩৩ কেজি ওজনের জন্য ১ মিলি (মাংসে বা শিরায়)।' },
        { id: 'm20', name: 'মেলভেট (Melvet)', generic: 'Meloxicam', company: 'Square Pharma', category: 'ব্যথানাশক', indications: 'অপারেশনের ব্যথা, পেশির ব্যথা এবং শ্বাসতন্ত্রের প্রদাহজনিত ব্যথা।', dosage: 'প্রতি ২৫ কেজি ওজনের জন্য ১ মিলি (মাংসে বা চামড়ার নিচে)।' },
        { id: 'm21', name: 'প্যারাভেট (Paravet)', generic: 'Paracetamol', company: 'Renata Ltd.', category: 'জ্বর ও ব্যথা', indications: 'যেকোনো সাধারণ জ্বর এবং হালকা ব্যথায় খুবই কার্যকরী ও নিরাপদ।', dosage: 'বড় গরুর জন্য ২-৩ টি বোলাস (বড়ি) দিনে ২ বার।' },
        { id: 'm22', name: 'হিস্টাভেট (Histavet)', generic: 'Chlorpheniramine Maleate', company: 'Acme Laboratories', category: 'অ্যান্টিহিস্টামিন', indications: 'কীটপতঙ্গের কামড়, ওষুধের রিঅ্যাকশন, চুলকানি ও যেকোনো এলার্জি।', dosage: 'বড় গরু: ৫-১০ মিলি (মাংসে)।' },
        { id: 'm23', name: 'অ্যাস্টাভেট (Astavet)', generic: 'Promethazine', company: 'Square Pharma', category: 'অ্যান্টিহিস্টামিন', indications: 'সর্দি-কাশি, এলার্জি এবং ভ্রমণজনিত ধকল (Motion Sickness) রোধে।', dosage: 'বড় গরু: ১০-১৫ মিলি (মাংসে)।' },
        { id: 'm24', name: 'ক্যাল-ডি-ম্যাগ (Cal-D-Mag)', generic: 'Calcium, Magnesium, Phosphorus', company: 'Acme Laboratories', category: 'ক্যালসিয়াম ইনজেকশন', indications: 'মিল্ক ফিভার (দুধ জ্বর), ঘাস টিটানি, হাড়ের দুর্বলতা ও খিঁচুনি রোধে।', dosage: 'বড় গরু: ২৫০-৫০০ মিলি (শুধুমাত্র শিরায়, খুব ধীরে ধীরে)।' },
        { id: 'm25', name: 'রেনা-ক্যাল পি (Rena-Cal P)', generic: 'Calcium + Phosphorus', company: 'Renata Ltd.', category: 'ক্যালসিয়াম বোলাস', indications: 'গর্ভবতী ও দুধালো গাভীর ক্যালসিয়ামের ঘাটতি পূরণে।', dosage: 'বড় গাভী: ১-২টি বল প্রতিদিন ৫-৭ দিন।' },
        { id: 'm26', name: 'ডিবি-ভিটামিন (DB-Vitamin)', generic: 'Vitamin B-Complex', company: 'Acme Laboratories', category: 'ভিটামিন বি-কমপ্লেক্স', indications: 'রুচি বৃদ্ধি, স্নায়ুবিক দুর্বলতা দূর এবং এন্টিবায়োটিক কোর্সের সাথে।', dosage: 'বড় গরু: ১০-২০ মিলি (মাংসে বা শিরায়)।' },
        { id: 'm27', name: 'রেনা-ডব্লিউএস (Rena-WS)', generic: 'Multivitamin Powder', company: 'Renata Ltd.', category: 'ভিটামিন পাউডার', indications: 'ডায়রিয়া, পানিশূন্যতা ও তীব্র গরমে গাভীর ধকল কমাতে।', dosage: '১ গ্রাম পাউডার ২-৩ লিটার পানিতে মিশিয়ে খাওয়াতে হবে।' },
        { id: 'm28', name: 'ই-সেল (E-Sel)', generic: 'Vitamin E + Selenium', company: 'Square Pharma', category: 'ভিটামিন ও প্রজনন', indications: 'ষাঁড়ের প্রজনন ক্ষমতা বৃদ্ধি, মাংসপেশির দুর্বলতা ও রোগ প্রতিরোধে।', dosage: 'প্রতি ১০০ কেজি ওজনের জন্য ১ মিলি (মাংসে বা চামড়ার নিচে)।' },
        { id: 'm29', name: 'মেগাভিট (Megavit)', generic: 'Vitamin A, D3, E', company: 'Acme Laboratories', category: 'ভিটামিন ইনজেকশন', indications: 'শারীরিক বৃদ্ধি, অন্ধত্ব দূরীকরণ এবং গর্ভবতী গাভীর পুষ্টি নিশ্চিতে।', dosage: 'বড় গরু: ৫-১০ মিলি (মাংসে)।' },
        { id: 'm30', name: 'ব্লোটক্স (Bloatox)', generic: 'Dimethicone', company: 'Acme Laboratories', category: 'গ্যাস বা পেট ফাঁপা', indications: 'অতিরিক্ত দানাদার বা কাঁচা ঘাস খেয়ে পেট ফুলে গেলে (Bloat) গ্যাস বের করতে।', dosage: '১০০ মিলি ওষুধ আধা লিটার পানিতে মিশিয়ে খাওয়াতে হবে।' },
        { id: 'm31', name: 'রুমেন এফএস (Rumen FS)', generic: 'Digestive Enzymes', company: 'Renata Ltd.', category: 'হজমকারক', indications: 'ক্ষুধামন্দা, বদহজম এবং পাকস্থলীর স্বাভাবিক কার্যক্ষমতা ফিরিয়ে আনতে।', dosage: 'বড় গরু: ১-২ প্যাকেট হালকা গরম পানিতে মিশিয়ে খাওয়াতে হবে।' },
        { id: 'm32', name: 'ডাইজেস্টিভ ভেট (Digestive Vet)', generic: 'Probiotics & Enzymes', company: 'Square Pharma', category: 'হজমকারক', indications: 'অ্যান্টিবায়োটিক ব্যবহারের পর হজমশক্তি ও রুচি বাড়াতে।', dosage: 'বড় গরু: ১-২টি বল প্রতিদিন।' },
        { id: 'm33', name: 'অ্যালমেক্স ভেট (Almex Vet)', generic: 'Albendazole', company: 'Square Pharma', category: 'কৃমিনাশক', indications: 'সাধারণ গোল কৃমি, ফিতা কৃমি ও পাতা কৃমি দমনে।', dosage: 'প্রতি ৭৫ কেজি ওজনের জন্য ১টি বল (খালি পেটে)। গর্ভবতী গাভীকে দেওয়া নিষেধ।' },
        { id: 'm34', name: 'লেভানিড (Levanid)', generic: 'Levamisole + Oxyclozanide', company: 'Acme Laboratories', category: 'কৃমিনাশক (কলিজা কৃমি)', indications: 'মারাত্মক কলিজা কৃমি এবং গোল কৃমি একসাথে ধ্বংস করতে।', dosage: 'প্রতি ৭৫ কেজি ওজনের জন্য ১টি বল।' },
        { id: 'm35', name: 'ফ্যাসিনেক্স (Fasinex)', generic: 'Triclabendazole', company: 'Novartis', category: 'কৃমিনাশক (কলিজা কৃমি)', indications: 'যেকোনো স্টেজের কলিজা কৃমি (Liver Fluke) দমনে অত্যন্ত কার্যকরী।', dosage: '১টি বল প্রতি ৭৫-১০০ কেজি ওজনের জন্য।' },
        { id: 'm36', name: 'ডেকটোম্যাক্স (Dectomax)', generic: 'Doramectin', company: 'Zoetis', category: 'পরজীবীনাশক (ইনজেকশন)', indications: 'উকুন, মাইট, আঠালি এবং রক্তচোষা পরজীবী দমনে প্রিমিয়াম ওষুধ।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ১ মিলি (চামড়ার নিচে)।' },
        { id: 'm37', name: 'নিওট্রেক (Neotrek)', generic: 'Tetramisole', company: 'Square Pharma', category: 'কৃমিনাশক পাউডার', indications: 'বাছুরের গোল কৃমি ও ফুসফুসের কৃমি দমনে পানিতে মিশিয়ে খাওয়াতে হয়।', dosage: 'প্যাকেটের গায়ে লেখা নিয়ম অনুযায়ী পানির সাথে মেশাতে হবে।' },
        { id: 'm38', name: 'অক্সিটোসিন (Oxytocin)', generic: 'Oxytocin Injection', company: 'Acme Laboratories', category: 'হরমোন', indications: 'গাভী বাচ্চা দেওয়ার পর ফুল (Placenta) না পড়লে বা দুধ আটকে গেলে।', dosage: '২-৪ মিলি (মাংসে বা শিরায়)। চিকিৎসকের পরামর্শ ছাড়া ব্যবহার নিষেধ।' },
        { id: 'm39', name: 'ম্যাসটিল (Mastil)', generic: 'Cefoperazone', company: 'Acme Laboratories', category: 'ম্যাসটাইটিস বা ওলান পাকা', indications: 'ওলান ফুলে গেলে, দুধ লাল বা ছানা ছানা হলে সরাসরি ওলানের বাটে পুশ করতে হয়।', dosage: 'আক্রান্ত বাটের দুধ ফেলে দিয়ে ১টি টিউব পুশ করে ম্যাসেজ করতে হবে।' },
        { id: 'm40', name: 'হিমোকোয়াগুলাস (Haemocoagulase)', generic: 'Haemocoagulase', company: 'Various', category: 'রক্তপাত বন্ধ', indications: 'কাটা-ছেঁড়া, শিং ভাঙা বা যেকোনো অপারেশনের পর অতিরিক্ত রক্তপাত বন্ধ করতে।', dosage: 'প্রয়োজন অনুযায়ী ক্ষতস্থানে স্প্রে বা ইনজেকশন।' },
        { id: 'm41', name: 'পভিসেপ (Povisep)', generic: 'Povidone Iodine', company: 'JMI', category: 'জীবাণুনাশক (Antiseptic)', indications: 'ক্ষতস্থান, নাভী, বা অপারেশনের জায়গা জীবাণুমুক্ত করতে।', dosage: 'ক্ষতস্থানে তুলা দিয়ে প্রতিদিন ২-৩ বার লাগাতে হবে।' },
        { id: 'm42', name: 'নেগাসান্ট (Negasunt)', generic: 'Antibacterial Dusting Powder', company: 'Bayer', category: 'ঘা শুকানোর পাউডার', indications: 'খুরা রোগের ঘা, পোকা পড়া ঘা (Maggot wound) দ্রুত শুকাতে।', dosage: 'ক্ষতস্থান পরিষ্কার করে দিনে ১-২ বার পাউডার ছিটিয়ে দিন।' },
        { id: 'm43', name: 'হিম্যাক্স (Himax)', generic: 'Herbal Ointment', company: 'Indian / Various', category: 'ঘা শুকানোর মলম', indications: 'মাছি তাড়াতে এবং যেকোনো গভীর ঘা দ্রুত শুকাতে।', dosage: 'ক্ষতস্থানে প্রলেপ দিয়ে লাগিয়ে দিন।' },
        { id: 'm44', name: 'টক্সনিল (Toxnil)', generic: 'Toxin Binder', company: 'Acme Laboratories', category: 'টক্সিন বাইন্ডার', indications: 'খাদ্যের বিষক্রিয়া (Aflatoxin) বা পচা খাবার খেয়ে গরুর ক্ষতি রোধ করতে।', dosage: 'প্রতি ১০০ কেজি খাবারে ১০০-২০০ গ্রাম মেশাতে হবে।' },
        { id: 'm45', name: 'সিপ্রোসিন ভেট (Ciprocin Vet)', generic: 'Ciprofloxacin', company: 'Square Pharma', category: 'অ্যান্টিবায়োটিক', indications: 'বাছুরের ডায়রিয়া, পাতলা পায়খানা এবং সাধারণ ইনফেকশনে।', dosage: 'প্রতি ১৫ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm46', name: 'সালফাডিমিডিন (Sulphadimidine)', generic: 'Sulphadimidine', company: 'Acme Laboratories', category: 'সালফা ড্রাগ (ডায়রিয়া)', indications: 'রক্ত আমাশয় (Coccidiosis), তীব্র পাতলা পায়খানা এবং গলাফুলা।', dosage: 'বড় গরু: ২-৪টি বল প্রতিদিন।' },
        { id: 'm47', name: 'ডায়াডিন (Diadin)', generic: 'Sulphadimidine + Neomycin', company: 'Renata Ltd.', category: 'ডায়রিয়া ও আমাশয়', indications: 'তীব্র ব্যাকটেরিয়াল ডায়রিয়া এবং রক্ত আমাশয় রোধে।', dosage: 'প্রতি ৩০ কেজি ওজনের জন্য ১টি বোলাস (বড়ি)।' },
        { id: 'm48', name: 'কে-স্যালাইন (K-Saline)', generic: 'Potassium + Sodium Saline', company: 'Acme Laboratories', category: 'খাবার স্যালাইন', indications: 'ডায়রিয়া বা পাতলা পায়খানার কারণে পানিশূন্যতা দূর করতে।', dosage: '১ প্যাকেট ১-২ লিটার পানিতে মিশিয়ে খাওয়াতে হবে।' },
        { id: 'm49', name: 'অ্যামক্সিভেট (Amoxyvet)', generic: 'Amoxicillin Trihydrate', company: 'Acme Laboratories', category: 'অ্যান্টিবায়োটিক (পাউডার)', indications: 'খাবারের সাথে মিশিয়ে শ্বাসতন্ত্র ও পরিপাকতন্ত্রের ইনফেকশন রোধ করতে।', dosage: 'প্যাকেটের নির্দেশিকা অনুযায়ী পানির সাথে মেশাতে হবে।' },
        { id: 'm50', name: 'অ্যাট্রোপিন (Atropine Sulphate)', generic: 'Atropine', company: 'Various', category: 'পয়জনিং / বিষক্রিয়া', indications: 'কীটনাশক বা বিষাক্ত ঘাস খেয়ে বিষক্রিয়া হলে জীবন রক্ষাকারী হিসেবে।', dosage: 'লক্ষণ বুঝে চিকিৎসকের সরাসরি তত্ত্বাবধানে শিরায় বা মাংসে।' },
        { id: 'm51', name: 'ডেক্সামেথাসন (Dexamethasone)', generic: 'Dexamethasone Sodium', company: 'Various', category: 'স্টেরয়েড', indications: 'আকস্মিক শক, এলার্জি এবং মেটাবলিক ডিসঅর্ডারে।', dosage: 'গর্ভবতী গাভীতে ব্যবহার নিষেধ। ৫-১০ মিলি মাংসে।' },
        { id: 'm52', name: 'প্রোবায়োটিকস (Probiotics)', generic: 'Live Yeast & Bacteria', company: 'Various', category: 'প্রোবায়োটিক', indications: 'অ্যান্টিবায়োটিক কোর্সের পর পাকস্থলীর ভালো ব্যাকটেরিয়া ফিরিয়ে আনতে।', dosage: 'দৈনিক ১০-২০ গ্রাম খাবারের সাথে মিশিয়ে।' },
        // --- ম্যাসটাইটিস (ওলান পাকা) ও ওলানের স্বাস্থ্য ---
        { id: 'm53', name: 'ম্যাসটিক্যাপ (Masticap)', generic: 'Cephalexin', company: 'Square Pharma', category: 'ম্যাসটাইটিস টিউব', indications: 'গাভীর ওলান পাকা বা ম্যাসটাইটিসের চিকিৎসায় সরাসরি বাটে প্রয়োগযোগ্য।', dosage: 'দুধ দোহনের পর প্রতিটি আক্রান্ত বাটে ১টি টিউব পুশ করে ৩ দিন দিতে হবে।' },
        { id: 'm54', name: 'কোবাকটান (Cobactan)', generic: 'Cefquinome', company: 'Intervet', category: 'অ্যান্টিবায়োটিক', indications: 'তীব্র ওলান পাকা বা ম্যাসটাইটিস এবং শ্বাসতন্ত্রের মারাত্মক ইনফেকশন রোধে।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ২ মিলি (মাংসে)।' },
        { id: 'm55', name: 'ম্যামিটিল (Mammitil)', generic: 'Ampicillin + Cloxacillin', company: 'Acme Laboratories', category: 'ম্যাসটাইটিস টিউব', indications: 'জীবাণুজনিত ওলান পাকা, দুধ লাল হওয়া বা ছানা ছানা হওয়া রোধ করে।', dosage: 'আক্রান্ত বাটে দিনে ১টি করে টিউব টানা ৩ দিন।' },
        { id: 'm56', name: 'সেফাভেট (Cefavet)', generic: 'Cefoperazone', company: 'Renata Ltd.', category: 'অ্যান্টিবায়োটিক', indications: 'ম্যাসটাইটিস এবং জরায়ুর তীব্র ইনফেকশনে অত্যন্ত কার্যকরী।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ১ ভায়াল (মাংসে)।' },
        { id: 'm57', name: 'অ্যান্টি-ম্যাসটাইটিস পাউডার', generic: 'Herbal Anti-Mastitis', company: 'Various', category: 'হার্বাল পাউডার', indications: 'ওলান পাকার প্রাথমিক লক্ষণ দেখা দিলে এবং দুধের স্বাভাবিক রং ফেরাতে।', dosage: 'প্রতিদিন ৫০ গ্রাম খাবারের সাথে টানা ৫ দিন।' },
        { id: 'm58', name: 'টাইলোভেট (Tylovet)', generic: 'Tylosin Tartrate', company: 'Square Pharma', category: 'অ্যান্টিবায়োটিক', indications: 'ম্যাসটাইটিস, শ্বাসতন্ত্রের রোগ (CRD) এবং পায়ের জয়েন্টের ব্যথা।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm59', name: 'সিএমটি কিট (CMT Kit)', generic: 'California Mastitis Test', company: 'Diagnostic', category: 'টেস্টিং কিট', indications: 'ওলান পাকার লক্ষণ প্রকাশ পাওয়ার আগেই দুধে জীবাণু আছে কিনা তা নির্ণয় করতে।', dosage: 'দুধের সাথে পরিমাণমতো রিএজেন্ট মিশিয়ে টেস্ট করতে হয়।' },
        { id: 'm60', name: 'ম্যাসটিপ্রো (Mastipro)', generic: 'Trisodium Citrate', company: 'Acme Laboratories', category: 'প্রিভেন্টিভ পাউডার', indications: 'দুধের পিএইচ (pH) ব্যালেন্স করে ওলান পাকা প্রতিরোধ করে।', dosage: 'প্রতিদিন ৩০ গ্রাম খাবারের সাথে।' },

        // --- প্রজনন, জরায়ু পরিষ্কার ও হরমোন (Reproduction & Hormones) ---
        { id: 'm61', name: 'ফার্টিলন (Fertilon)', generic: 'Buserelin Acetate (GnRH)', company: 'Renata Ltd.', category: 'হরমোন', indications: 'গাভী ঠিকমতো হিটে না আসলে বা বারবার বীজ দিয়েও না টিকলে (রিপিট ব্রিডিং)।', dosage: '২.৫ - ৫ মিলি (মাংসে)। বীজ দেওয়ার ঠিক আগে বা পরে।' },
        { id: 'm62', name: 'সাইক্লোমেট (Cyclomate)', generic: 'Cloprostenol', company: 'Acme Laboratories', category: 'হরমোন', indications: 'কৃত্রিমভাবে হিটে আনতে এবং জরায়ুর ভেতরের মরা বাচ্চা বা পুঁজ বের করতে।', dosage: '২ মিলি (মাংসে)। শুধুমাত্র চিকিৎসকের পরামর্শে।' },
        { id: 'm63', name: 'প্রজেস্টেরন (Progesterone)', generic: 'Progesterone Injection', company: 'Various', category: 'হরমোন', indications: 'গর্ভপাত রোধ করতে এবং গর্ভাবস্থা সুরক্ষিত রাখতে।', dosage: 'চিকিৎসকের নির্দেশ অনুযায়ী (মাংসে)।' },
        { id: 'm64', name: 'ক্লিনজ ভেট (Cleanse Vet)', generic: 'Herbal Uterine Tonic', company: 'Square Pharma', category: 'জরায়ু টনিক', indications: 'বাচ্চা হওয়ার পর ফুল (Placenta) দ্রুত ফেলতে এবং জরায়ু পরিষ্কার করতে।', dosage: 'প্রথম দিন ১০০ মিলি, এরপর প্রতিদিন ৫০ মিলি করে ৩ দিন।' },
        { id: 'm65', name: 'ইউটোক্লিন (Utoclean)', generic: 'Intrauterine Bolus', company: 'Acme Laboratories', category: 'জরায়ুর বড়ি', indications: 'জরায়ুর ইনফেকশন (Metritis) ও দুর্গন্ধযুক্ত পুঁজ দূর করতে।', dosage: 'জরায়ুর ভেতরে ২-৪টি বড়ি স্থাপন করতে হয়।' },
        { id: 'm66', name: 'গাইনোভেট (Gynovet)', generic: 'Herbal Heat Inducer', company: 'Square Pharma', category: 'প্রজনন বড়ি', indications: 'দীর্ঘদিন হিটে না আসা গাভীকে প্রাকৃতিকভাবে হিটে আনতে সাহায্য করে।', dosage: 'প্রতিদিন ১-২টি বড়ি।' },
        { id: 'm67', name: 'রিবুট (Reboot)', generic: 'GnRH Analogue', company: 'Acme Laboratories', category: 'হরমোন', indications: 'ওভুলেশন নিশ্চিত করতে এবং প্রজনন ক্ষমতা বাড়াতে।', dosage: '২.৫ মিলি (মাংসে বা শিরায়)।' },
        { id: 'm68', name: 'ইউমিন (Umin)', generic: 'Ergometrine Maleate', company: 'Renata Ltd.', category: 'জরায়ু পরিষ্কারক', indications: 'বাচ্চা প্রসবের পর রক্তপাত বন্ধ করতে এবং জরায়ু সংকুচিত করতে।', dosage: '৫-১০ মিলি (মাংসে)।' },

        // --- হাই-পাওয়ার ভিটামিন, মিনারেল ও নিউট্রিশন ---
        { id: 'm69', name: 'নোভাফস (Novaphos)', generic: 'Toldimfos Sodium', company: 'Acme Laboratories', category: 'ফসফরাস ইনজেকশন', indications: 'দুধ জ্বর, ফসফরাসের অভাব, প্রজনন সমস্যা ও পেশির দুর্বলতা কাটাতে।', dosage: 'বড় গাভী: ১০-১৫ মিলি (শিরায় বা মাংসে)।' },
        { id: 'm70', name: 'রেনা-ক্যাল পি প্লাস (Rena-Cal P Plus)', generic: 'Liquid Calcium & Phosphorus', company: 'Renata Ltd.', category: 'লিকুইড ক্যালসিয়াম', indications: 'দুধের উৎপাদন বৃদ্ধি এবং গাভীর ক্যালসিয়াম ও ফসফরাসের অভাব পূরণে।', dosage: 'প্রতিদিন ১০০ মিলি খাবারের সাথে বা সরাসরি।' },
        { id: 'm71', name: 'অ্যামাইনো এনার্জি (Amino Energy)', generic: 'Amino Acids + B-complex', company: 'Square Pharma', category: 'এনার্জি লিকুইড', indications: 'রোগ থেকে ওঠার পর দ্রুত স্বাস্থ্য ফেরাতে এবং মাংসপেশি গঠনে।', dosage: 'প্রতিদিন ১০০ মিলি।' },
        { id: 'm72', name: 'সেলেভিট (Selevit)', generic: 'Vitamin E + Selenium', company: 'Acme Laboratories', category: 'ভিটামিন পাউডার', indications: 'ষাঁড়ের সিমেন কোয়ালিটি বৃদ্ধি এবং পেশির রোগ (White Muscle Disease) রোধে।', dosage: 'প্রতিদিন ১০-২০ গ্রাম খাবারের সাথে।' },
        { id: 'm73', name: 'রেনামিক্স প্লাস (Renamix Plus)', generic: 'Vitamin & Mineral Premix', company: 'Renata Ltd.', category: 'ভিটামিন প্রিমিক্স', indications: 'সুষম খাদ্যের পুষ্টি নিশ্চিত করতে এবং খামার লাভজনক করতে।', dosage: '১০০ কেজি খাবারে ১-২ কেজি।' },
        { id: 'm74', name: 'ডিসিপি ভেট (DCP Vet)', generic: 'Dicalcium Phosphate', company: 'Square Pharma', category: 'মিনারেল পাউডার', indications: 'বাছুরের হাড় গঠন এবং গাভীর দাঁত ও হাড়ের ক্ষয় রোধে।', dosage: 'প্রতিদিন ৫০ গ্রাম।' },
        { id: 'm75', name: 'রেনা-বি+সি (Rena-B+C)', generic: 'Vitamin B-complex + C', company: 'Renata Ltd.', category: 'ভিটামিন ইনজেকশন', indications: 'স্ট্রেস বা ধকল কাটাতে এবং এন্টিবায়োটিক কোর্সের সময় রুচি ঠিক রাখতে।', dosage: '১০-১৫ মিলি (মাংসে)।' },
        { id: 'm76', name: 'লিভার টনিক প্লাস (Liver Tonic Plus)', generic: 'Herbal Liver Extract', company: 'Various', category: 'লিভার টনিক (লিকুইড)', indications: 'লিভারের কার্যক্ষমতা বাড়ানো, হজমশক্তি এবং রুচি বৃদ্ধি।', dosage: 'প্রতিদিন ৫০ মিলি।' },
        { id: 'm77', name: 'ক্যাল-ডি-ম্যাগ জেল (Cal-D-Mag Gel)', generic: 'Calcium Gel', company: 'Acme Laboratories', category: 'ওরাল জেল', indications: 'দুধ জ্বরের তাৎক্ষণিক চিকিৎসায় এবং বাচ্চা দেওয়ার পর দ্রুত ক্যালসিয়াম দিতে।', dosage: '১টি পুরো টিউব সরাসরি মুখে খাইয়ে দিতে হয়।' },
        { id: 'm78', name: 'বায়োমিন (Biomin)', generic: 'Trace Minerals', company: 'Renata Ltd.', category: 'ট্রেস মিনারেল', indications: 'খনিজ উপাদানের ঘাটতি পূরণ ও প্রজনন স্বাস্থ্যের উন্নতি।', dosage: 'প্রতিদিন ২০-৩০ গ্রাম।' },
        { id: 'm79', name: 'ভিটা-অ্যামাইনো (Vita-Amino)', generic: 'Multivitamin + Amino Acid', company: 'Square Pharma', category: 'পাউডার', indications: 'গরুর গ্রোথ রেট বা দৈহিক বৃদ্ধি ত্বরান্বিত করতে ফ্যাটেনিং প্রজেক্টে।', dosage: 'প্রতিদিন ২০-২৫ গ্রাম।' },
        { id: 'm80', name: 'ইমিউনোভেট (Immunovet)', generic: 'Immunity Booster', company: 'Acme Laboratories', category: 'ইমিউনিটি বুস্টার', indications: 'টিকা দেওয়ার আগে বা পরে রোগ প্রতিরোধ ক্ষমতা বাড়াতে।', dosage: 'প্রতিদিন ৫০ মিলি পানিতে মিশিয়ে।' },
        { id: 'm81', name: 'ফসফরাস-বি১২ (Phosphorus-B12)', generic: 'Butaphosphan + Cyanocobalamin', company: 'Various', category: 'ইনজেকশন', indications: 'মেটাবলিজম বা হজম প্রক্রিয়া স্বাভাবিক করতে এবং রক্তশূন্যতা দূর করতে।', dosage: '১০-২৫ মিলি (মাংসে বা শিরায়)।' },
        { id: 'm82', name: 'সিবিজি (Cal. Borogluconate)', generic: 'Calcium Borogluconate 25%', company: 'Various', category: 'আইভি স্যালাইন', indications: 'তীব্র মিল্ক ফিভার বা দুধ জ্বরে গাভী পড়ে গেলে ইমার্জেন্সি চিকিৎসায়।', dosage: '৩০০-৫০০ মিলি (শুধুমাত্র শিরায়, খুব সাবধানে ও ধীরে)।' },
        { id: 'm83', name: 'মিল্ক বুস্টার (Milk Booster)', generic: 'Herbal Galactagogue', company: 'Various', category: 'দুধ বৃদ্ধিকারক', indications: 'গাভীর দুধের পরিমাণ এবং ফ্যাট পার্সেন্টেজ প্রাকৃতিকভাবে বৃদ্ধি করতে।', dosage: 'প্রতিদিন ৫০ গ্রাম খাবারের সাথে।' },
        { id: 'm84', name: 'মেটাবোলাইট (Metabolite)', generic: 'Metabolic Stimulant', company: 'Square Pharma', category: 'ইনজেকশন', indications: 'দুর্বলতা, ক্ষুধামন্দা এবং দীর্ঘ অসুস্থতা থেকে সেরে ওঠার পর।', dosage: '১০-১৫ মিলি (মাংসে)।' },
        { id: 'm85', name: 'এডিই ভেট (ADE Vet)', generic: 'Vit A, D3, E Injection', company: 'Renata Ltd.', category: 'ভিটামিন ইনজেকশন', indications: 'দৃষ্টিশক্তি, প্রজনন ক্ষমতা ও হাড়ের সুস্থতার জন্য।', dosage: '৫-১০ মিলি (মাংসে)।' },
        { id: 'm86', name: 'জিংক-কপার-কোবাল্ট (Zn-Cu-Co)', generic: 'Mineral Bolus', company: 'Various', category: 'মিনারেল বল', indications: 'খুরের রোগ, পশম পড়ে যাওয়া এবং রক্তশূন্যতা রোধে।', dosage: 'প্রতিদিন ১টি বল।' },
        { id: 'm87', name: 'এনাফ্লক্স (Enaflox)', generic: 'Enrofloxacin 10%', company: 'Square Pharma', category: 'অ্যান্টিবায়োটিক (পাউডার)', indications: 'পানির সাথে মিশিয়ে গণহারে ব্যাকটেরিয়াল ইনফেকশন রোধ করতে।', dosage: '১ গ্রাম পাউডার ২ লিটার পানিতে।' },
        { id: 'm88', name: 'সালফাকক্স (Sulphacox)', generic: 'Sulphaclozine Sodium', company: 'Acme Laboratories', category: 'রক্ত আমাশয়', indications: 'মারাত্মক রক্ত আমাশয় এবং ককসিডিওসিস দমনে।', dosage: 'প্যাকেটের নির্দেশিকা অনুযায়ী।' },
        { id: 'm89', name: 'রুমেন কেয়ার (Rumen Care)', generic: 'Rumen Specific Yeast', company: 'Renata Ltd.', category: 'রুমেন প্রোবায়োটিক', indications: 'বদহজম, পেট ফাঁপা এবং গরুর খাবার খাওয়ার রুচি দ্রুত ফিরিয়ে আনতে।', dosage: 'প্রতিদিন ১-২ প্যাকেট।' },
        { id: 'm90', name: 'ভিক্সল ভেট (Vixol Vet)', generic: 'Bromhexine', company: 'Acme Laboratories', category: 'কফ নিরাময়ক', indications: 'নিউমোনিয়া ও শ্বাসকষ্টের সময় ফুসফুসের কফ তরল করে বের করতে।', dosage: 'প্রতি ১০০ কেজি ওজনের জন্য ৫ মিলি (মাংসে)।' },
        { id: 'm91', name: 'ভিটামিন-সি ভেট (Vitamin-C Vet)', generic: 'Ascorbic Acid', company: 'Square Pharma', category: 'ভিটামিন ইনজেকশন', indications: 'মারাত্মক হিট স্ট্রোক, স্ট্রেস এবং ইনফেকশনের সময় ইমিউনিটি বাড়াতে।', dosage: '১০-১৫ মিলি (মাংসে)।' },
        { id: 'm92', name: 'ম্যাগনেসিয়াম সালফেট (Mag. Sulphate)', generic: 'Magnesium Sulphate', company: 'Various', category: 'কোষ্ঠকাঠিন্য', indications: 'গরুর তীব্র কোষ্ঠকাঠিন্য (পায়খানা কষা) বা বদহজমে পেট পরিষ্কার করতে।', dosage: '১০০-২৫০ গ্রাম পাউডার ১ লিটার পানিতে গুলিয়ে খাওয়াতে হবে।' },
        // --- রেসপাইরেটরি (শ্বাসতন্ত্র) ও তীব্র ইনফেকশন ---
        { id: 'm93', name: 'ফ্লোরফেন (Florfen)', generic: 'Florfenicol', company: 'Square Pharma', category: 'অ্যান্টিবায়োটিক', indications: 'তীব্র শ্বাসকষ্ট, নিউমোনিয়া এবং অন্যান্য অ্যান্টিবায়োটিক কাজ না করলে এটি অত্যন্ত কার্যকরী।', dosage: 'প্রতি ১৫ কেজি ওজনের জন্য ১ মিলি (মাংসে)। ৪৮ ঘণ্টা পর ২য় ডোজ।' },
        { id: 'm94', name: 'কোট্রিম ভেট (Cotrim Vet)', generic: 'Sulphadiazine + Trimethoprim', company: 'Renata Ltd.', category: 'অ্যান্টিবায়োটিক', indications: 'শ্বাসতন্ত্র, পরিপাকতন্ত্র এবং প্রস্রাবের নালীর ব্যাকটেরিয়াল ইনফেকশন রোধে।', dosage: 'প্রতি ৩০ কেজি ওজনের জন্য ১টি বোলাস (বড়ি)।' },
        { id: 'm95', name: 'অক্সি-বি (Oxy-B)', generic: 'Oxytetracycline + B-Complex', company: 'Renata Ltd.', category: 'অ্যান্টিবায়োটিক + ভিটামিন', indications: 'ব্যাকটেরিয়াল ইনফেকশন এবং একইসাথে গাভীর শারীরিক দুর্বলতা সারাতে।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },

        // --- তীব্র ব্যথানাশক (Strong Painkillers) ---
        { id: 'm96', name: 'ফ্লুনিক্সিন (Flunixin Vet)', generic: 'Flunixin Meglumine', company: 'Square Pharma', category: 'তীব্র ব্যথানাশক', indications: 'তীব্র ব্যথা, ফুসফুসের প্রদাহ, ম্যাসটাইটিস এবং পেটে ব্যথার (Colic) দ্রুত উপশম।', dosage: 'প্রতি ২২ কেজি ওজনের জন্য ১ মিলি (শিরায় বা মাংসে)।' },
        { id: 'm97', name: 'ডিক্লোভেট (Diclovet)', generic: 'Diclofenac Sodium', company: 'Acme Laboratories', category: 'ব্যথানাশক', indications: 'পেশি, হাড়ের জয়েন্টে ব্যথা, খোঁড়া রোগ বা আঘাতজনিত ব্যথা কমাতে।', dosage: 'প্রতি ২৫ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },

        // --- রক্তশূন্যতা, এনার্জি ও ইমার্জেন্সি ড্রাগস ---
        { id: 'm98', name: 'আয়রন ডেক্সট্রান (Iron Vet)', generic: 'Iron Dextran', company: 'Various', category: 'মিনারেল (আয়রন)', indications: 'নবজাতক বাছুরের রক্তশূন্যতা, রক্তচোষা পরজীবীর কারণে দুর্বলতা দূর করতে।', dosage: 'বাছুরের জন্য ২-৫ মিলি (মাংসে)।' },
        { id: 'm99', name: 'ভিটামিন কে (K-Vet)', generic: 'Menadione Sodium Bisulfite', company: 'Acme Laboratories', category: 'রক্তপাত রোধক', indications: 'অপারেশনের সময় অতিরিক্ত রক্তপাত, বিষক্রিয়া বা রক্ত আমাশয় জনিত রক্তক্ষরণ বন্ধ করতে।', dosage: 'বড় গরুর জন্য ৫-১০ মিলি (মাংসে)।' },
        { id: 'm100', name: 'প্রোপাইলিন গ্লাইকল (Propylene Glycol)', generic: 'Propylene Glycol', company: 'Various', category: 'কিটোসিস ড্রাগ', indications: 'দুধালো গাভীর এনার্জি ঘাটতি (কিটোসিস) বা বাচ্চা দেওয়ার পর দুর্বলতা দূর করতে।', dosage: 'প্রথম দিন ২০০-৩০০ মিলি, এরপর প্রতিদিন ১০০ মিলি খাইয়ে দিতে হবে।' },

        // --- বিষক্রিয়া ও রুমেন (পাকস্থলী) এসিডিটি ---
        { id: 'm101', name: 'সোডিয়াম বাইকার্বোনেট (খাবার সোডা)', generic: 'Sodium Bicarbonate', company: 'Various', category: 'এন্টাসিড / বাফার', indications: 'অতিরিক্ত দানাদার খাবার খেয়ে রুমেনের এসিডিটি বা টক ঢেকুর দেখা দিলে।', dosage: '৫০-১০০ গ্রাম পাউডার পানির সাথে মিশিয়ে খাওয়াতে হবে।' },
        { id: 'm102', name: 'অ্যাক্টিভেটেড চারকোল (Charcoal)', generic: 'Activated Charcoal', company: 'Various', category: 'পয়জন এন্টিডোট', indications: 'গরু বিষাক্ত ঘাস বা রাসায়নিক খেয়ে ফেললে পেট থেকে বিষ বের করতে (Life Saving)।', dosage: '১০০-২০০ গ্রাম পাউডার পানিতে গুলিয়ে খাওয়াতে হবে।' },
        { id: 'm103', name: 'ডায়াজিপাম (Diazepam Vet)', generic: 'Diazepam', company: 'Various', category: 'সিডেটিভ / শান্তকারক', indications: 'গরু অতিরিক্ত ছটফট করলে, খিঁচুনি বা টিটেনাস হলে শান্ত করার জন্য।', dosage: 'লক্ষণ বুঝে চিকিৎসকের সরাসরি তত্ত্বাবধানে শিরায় বা মাংসে।' },

        // --- পরজীবীনাশক (এডভান্সড) ও বাহ্যিক যত্ন ---
        { id: 'm104', name: 'নাইট্রোক্সিনিল (Nitroxynil 34%)', generic: 'Nitroxynil', company: 'Acme Laboratories', category: 'কৃমিনাশক (ইনজেকশন)', indications: 'মারাত্মক লিভার ফ্লুক (কলিজা কৃমি) এবং রক্তচোষা কৃমি দমনে ইনজেকশন।', dosage: 'প্রতি ৩৫ কেজি ওজনের জন্য ১ মিলি (শুধুমাত্র চামড়ার নিচে)।' },
        { id: 'm105', name: 'অ্যামিট্রাজ (Amitraz 12.5%)', generic: 'Amitraz', company: 'Various', category: 'বাহ্যিক পরজীবীনাশক', indications: 'চামড়ার উঁকুন, মাইট (Mange) এবং মারাত্মক আঠালী দমনে স্প্রে বা গোসল।', dosage: '১ লিটার পানিতে ২ মিলি মিশিয়ে গায়ে স্প্রে করতে হবে। চেটে যেন না খায় সেদিকে খেয়াল রাখতে হবে।' },
        { id: 'm106', name: 'বেটিকল পোর-অন (Bayticol)', generic: 'Flumethrin', company: 'Bayer', category: 'পোর-অন সলিউশন', indications: 'আঠালী ও উঁকুন দমনে পিঠের ওপর মেরুদণ্ড বরাবর ঢেলে দেওয়ার আধুনিক ঔষধ।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ১ মিলি হারে পিঠের ওপর ঢেলে দিন।' },
        { id: 'm107', name: 'বায়োটিন প্লাস (Biotin Plus)', generic: 'Biotin + Zinc', company: 'Square Pharma', category: 'ভিটামিন / মিনারেল পাউডার', indications: 'গরুর ক্ষুরের ফাটল বা রোগ এবং চামড়ার রুক্ষতা দূর করে উজ্জ্বলতা বাড়াতে।', dosage: 'প্রতিদিন ১০-২০ গ্রাম খাবারের সাথে মেশাতে হবে।' },
        { id: 'm108', name: 'পটাশিয়াম পারম্যাঙ্গানেট (P.P. / পটাশ)', generic: 'Potassium Permanganate', company: 'Various', category: 'জীবাণুনাশক', indications: 'খুরা রোগের ঘা, মুখ ও পা ধোয়ার জন্য সবচেয়ে সাশ্রয়ী এবং কার্যকরী জীবাণুনাশক।', dosage: '১ চিমটি পটাশ ১ লিটার পানিতে মিশিয়ে হালকা গোলাপি রঙ তৈরি করে ধুয়ে দিন।' },
        // --- টিক ফিভার (Tick Fever), ব্লাড প্রোটোজোয়া ও রক্তপেশাব ---
        { id: 'm109', name: 'ডিমিনা ভেট (Dimina Vet)', generic: 'Diminazene Aceturate', company: 'Acme Laboratories', category: 'অ্যান্টি-প্রোটোজোয়াল', indications: 'বাবেসিওসিস (রক্তপেশাব রোগ) এবং ট্রাইপ্যানোসোমিয়াসিস (Surra) রোগের অব্যর্থ চিকিৎসা।', dosage: 'প্রতি ১০০ কেজি ওজনের জন্য ৩.৫ মিলি (গভীর মাংসে)।' },
        { id: 'm110', name: 'বুটালেক্স (Butalex)', generic: 'Buparvaquone', company: 'MSD Animal Health', category: 'অ্যান্টি-প্রোটোজোয়াল', indications: 'থাইলেরিওসিস (Theileriosis) বা মারাত্মক টিক ফিভার (Tick fever) দমনে।', dosage: 'প্রতি ২০ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },

        // --- গর্ভবতী গাভীর নিরাপদ কৃমিনাশক ও পরজীবীনাশক ---
        { id: 'm111', name: 'ফেনাবেল (Fenabel)', generic: 'Fenbendazole', company: 'Square Pharma', category: 'কৃমিনাশক', indications: 'গর্ভবতী গাভীর জন্য সবচেয়ে নিরাপদ কৃমিনাশক। গোল কৃমি ও ফিতা কৃমি দমনে।', dosage: 'প্রতি ৭৫ কেজি ওজনের জন্য ১টি বল (খাবারের সাথে)।' },
        { id: 'm112', name: 'আইভেরা-সি (Ivera-C)', generic: 'Ivermectin + Clorsulon', company: 'Acme Laboratories', category: 'ডাবল অ্যাকশন পরজীবীনাশক', indications: 'একইসাথে মারাত্মক কলিজা কৃমি এবং বাইরের উঁকুন, আঠালী ও মাইট ধ্বংস করতে।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ১ মিলি (শুধুমাত্র চামড়ার নিচে)।' },

        // --- জিরো উইথড্রয়াল ও কম্বিনেশন অ্যান্টিবায়োটিক ---
        { id: 'm113', name: 'সেফটিওফার ভেট (Ceftiofur)', generic: 'Ceftiofur Sodium', company: 'Various', category: 'অ্যান্টিবায়োটিক (Zero Milk Withdrawal)', indications: 'শ্বাসতন্ত্রের রোগ (BRD) এবং ক্ষুরের পচন (Foot rot)। এই ওষুধ দিলে দুধ ফেলে দিতে হয় না।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ১-২ মিলি (মাংসে)।' },
        { id: 'm114', name: 'সালফা-৩ (Sulpha-3)', generic: 'Sulphadiazine + Sulphadimidine + Sulphapyridine', company: 'Renata Ltd.', category: 'অ্যান্টিবায়োটিক', indications: 'তীব্র রক্ত আমাশয়, নিউমোনিয়া এবং ম্যাসটাইটিসের চিকিৎসায়।', dosage: 'প্রতি ৩৫ কেজি ওজনের জন্য ১টি বোলাস।' },

        // --- ফাস্ট-অ্যাকশন ব্যথানাশক (Combo Painkillers) ---
        { id: 'm115', name: 'মেলভেট প্লাস (Melvet Plus)', generic: 'Meloxicam + Paracetamol', company: 'Square Pharma', category: 'ব্যথানাশক ও জ্বর', indications: 'তীব্র জ্বর, হাড়ের জয়েন্টে মারাত্মক ব্যথা এবং সার্জারির পর ফাস্ট পেইন রিলিভার হিসেবে।', dosage: 'প্রতি ২৫ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm116', name: 'ডিক্লো-পি (Diclo-P)', generic: 'Diclofenac + Paracetamol', company: 'Various', category: 'তীব্র ব্যথানাশক', indications: 'খোঁড়া রোগ, পেশির খিঁচুনি এবং যেকোনো প্রদাহজনিত ব্যথা দ্রুত কমাতে।', dosage: 'প্রতি ২৫ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },

        // --- আইভি ফ্লুইড, স্যালাইন ও জরুরি ড্রাগস ---
        { id: 'm117', name: 'ডেক্সট্রোজ ৫% / ২৫% (Dextrose)', generic: 'Dextrose Aqua', company: 'Various', category: 'আইভি স্যালাইন', indications: 'মারাত্মক দুর্বলতা, পানিশূন্যতা, ডায়রিয়া এবং কিটোসিসের সময় সরাসরি শিরায় এনার্জি দিতে।', dosage: 'প্রয়োজন অনুযায়ী ৫০০ মিলি থেকে কয়েক লিটার (শিরায়)।' },
        { id: 'm118', name: 'টিটি (Tetanus Toxoid)', generic: 'Tetanus Vaccine', company: 'Various', category: 'টিকা / ভ্যাকসিন', indications: 'গভীর ক্ষত, শিং ভাঙা বা যেকোনো অপারেশনের পর টিটেনাস (ধনুষ্টংকার) রোধ করতে।', dosage: 'বড় গরুর জন্য ২ মিলি (মাংসে)।' },

        // --- জরায়ু ও ক্ষুর পরিষ্কারক (Reproductive & Hoof Care) ---
        { id: 'm119', name: 'লুগোলস আয়োডিন (Lugol\'s Iodine)', generic: 'Iodine Solution', company: 'Various', category: 'জরায়ু পরিষ্কারক', indications: 'গাভীর জরায়ুর ইনফেকশন (Metritis) দূর করতে এবং রিপিট ব্রিডিং (বারবার হিট মিস) ঠেকাতে।', dosage: 'পাতলা করে সলিউশন বানিয়ে চিকিৎসকের মাধ্যমে জরায়ুতে পুশ করতে হয়।' },
        { id: 'm120', name: 'কপার সালফেট (তঁতে)', generic: 'Copper Sulphate', company: 'Various', category: 'ফুটবাথ / ক্ষুর পরিষ্কারক', indications: 'ক্ষুরের পচন বা খুরা রোগের সময় খামারের গেটে ফুটবাথ (পাদানি) হিসেবে জীবাণু ধ্বংস করতে।', dosage: 'পানির সাথে ২-৫% মাত্রায় মিশিয়ে ব্যবহার করতে হবে।' },

        // --- বাহ্যিক ক্ষত, মাছি ও ফাঙ্গাস প্রতিরোধী ---
        { id: 'm121', name: 'টপিকিউর স্প্রে (Topicure Spray)', generic: 'Herbal Aerosol', company: 'Natural Remedies', category: 'ক্ষত স্প্রে', indications: 'যেকোনো গভীর ক্ষত, পোকা পড়া ঘা এবং ক্ষতের চারপাশ থেকে মাছি তাড়াতে অব্যর্থ স্প্রে।', dosage: 'ক্ষতস্থান পরিষ্কার করে দিনে ২ বার স্প্রে করুন।' },
        { id: 'm122', name: 'জেনশিয়ান ভায়োলেট (Gentian Violet)', generic: 'Blue Paint/Spray', company: 'Various', category: 'অ্যান্টি-ফাঙ্গাল স্প্রে', indications: 'মুখের ঘা, ক্ষুরের ঘা এবং চামড়ার ফাঙ্গাল ইনফেকশন রোধে নীল রঙের স্প্রে।', dosage: 'ক্ষতস্থানে দিনে ১-২ বার প্রয়োগ করুন।' },

        // --- বাছুরের স্পেশাল যত্ন ---
        { id: 'm123', name: 'অ্যামপ্রোলিয়াম (Amprolium)', generic: 'Amprolium', company: 'Square Pharma', category: 'ককসিডিওস্ট্যাট', indications: 'বাছুরের তীব্র রক্ত আমাশয় (Coccidiosis) এবং পাতলা পায়খানা বন্ধ করতে।', dosage: '১ গ্রাম পাউডার ১ লিটার পানিতে মিশিয়ে খাওয়াতে হবে।' },
        { id: 'm124', name: 'কলিক ভেট (Colic Vet)', generic: 'Anti-Spasmodic', company: 'Various', category: 'পেট ব্যথা উপশম', indications: 'বাছুর বা বড় গরুর তীব্র পেট ব্যথা (Colic) এবং মোচড়ানো বন্ধ করতে।', dosage: 'লক্ষণ বুঝে চিকিৎসকের পরামর্শে প্রয়োগযোগ্য।' },
        { id: 'm125', name: 'জিংক অক্সাইড মলম (Zinc Oxide)', generic: 'Zinc Oxide Ointment', company: 'Various', category: 'ত্বকের মলম', indications: 'দাদ, একজিমা, রিংওয়ার্ম বা গরুর চামড়ার যেকোনো চুলকানিতে প্রশান্তি দিতে।', dosage: 'আক্রান্ত স্থানে প্রলেপ দিয়ে লাগাতে হবে।' },
        // --- অ্যাডভান্সড অ্যান্টিবায়োটিক (Advanced Antibiotics) ---
        { id: 'm126', name: 'এম্পিসিলিন ভেট (Ampicillin)', generic: 'Ampicillin Sodium', company: 'Various', category: 'অ্যান্টিবায়োটিক', indications: 'শ্বাসতন্ত্র, পরিপাকতন্ত্র এবং মূত্রনালীর তীব্র ইনফেকশন রোধে।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm127', name: 'কানামাইসিন (Kanamycin)', generic: 'Kanamycin Sulphate', company: 'Acme Laboratories', category: 'অ্যান্টিবায়োটিক', indications: 'মারাত্মক ম্যাসটাইটিস এবং জরায়ুর ব্যাকটেরিয়াল ইনফেকশন (মেট্রাইটিস) রোধে।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm128', name: 'লিনকো-স্পেকট্রিন (Linco-Spectin)', generic: 'Lincomycin + Spectinomycin', company: 'Various', category: 'অ্যান্টিবায়োটিক', indications: 'খোঁড়া রোগ, ক্ষুরের পচন (Foot rot) এবং জয়েন্ট ফুলে যাওয়া বা বাতের ব্যথায়।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm129', name: 'স্পাইরামাইসিন (Spiramycin)', generic: 'Spiramycin', company: 'Square Pharma', category: 'অ্যান্টিবায়োটিক', indications: 'দুধালো গাভীর তীব্র ম্যাসটাইটিস এবং শ্বাসতন্ত্রের জটিলতায়।', dosage: 'প্রতি ১৫ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm130', name: 'এরিথ্রোমাইসিন (Erythromycin)', generic: 'Erythromycin Thiocyanate', company: 'Various', category: 'অ্যান্টিবায়োটিক (পাউডার)', indications: 'দীর্ঘস্থায়ী সর্দি, কাশি এবং নিউমোনিয়ার চিকিৎসায় খাদ্যের সাথে।', dosage: '১ গ্রাম পাউডার ১ লিটার পানিতে মিশিয়ে।' },
        { id: 'm131', name: 'অ্যাজিথ্রোভেট (Azithrovet)', generic: 'Azithromycin', company: 'Renata Ltd.', category: 'অ্যান্টিবায়োটিক', indications: 'তীব্র শ্বাসকষ্ট, নিউমোনিয়া এবং অন্যান্য ওষুধ কাজ না করলে।', dosage: 'প্রতি ২০ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm132', name: 'কোলিস্টিন ভেট (Colistin)', generic: 'Colistin Sulphate', company: 'Acme Laboratories', category: 'অ্যান্টিবায়োটিক', indications: 'বাছুরের মারাত্মক ই.কোলাই (E.coli) ইনফেকশন এবং ডায়রিয়া বন্ধ করতে।', dosage: 'চিকিৎসকের পরামর্শ অনুযায়ী পানিতে মিশিয়ে।' },
        { id: 'm133', name: 'সেফোট্যাক্সিম (Cefotaxime)', generic: 'Cefotaxime Sodium', company: 'Various', category: 'অ্যান্টিবায়োটিক (ইনজেকশন)', indications: 'মস্তিষ্কের ইনফেকশন, মেনিনজাইটিস এবং রক্তে জীবাণু ছড়িয়ে পড়লে (সেপটিসেমিয়া)।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ১ ভায়াল (শিরায় বা মাংসে)।' },
        { id: 'm134', name: 'স্ট্রেপ্টোমাইসিন (Streptomycin)', generic: 'Streptomycin Sulphate', company: 'Various', category: 'অ্যান্টিবায়োটিক', indications: 'গলাফুলা, ডায়রিয়া এবং পরিপাকতন্ত্রের তীব্র ব্যাকটেরিয়াল ইনফেকশনে।', dosage: 'চিকিৎসকের নির্দেশনা অনুযায়ী মাংসে।' },
        { id: 'm135', name: 'টাইলো-ডক্স (Tylo-Dox)', generic: 'Tylosin + Doxycycline', company: 'Square Pharma', category: 'অ্যান্টিবায়োটিক (পাউডার)', indications: 'মিক্সড ইনফেকশন, পরিপাকতন্ত্র ও শ্বাসতন্ত্রের যৌথ সমস্যায়।', dosage: '১ গ্রাম পাউডার ২ লিটার পানিতে।' },

        // --- পরজীবী ও কৃমিনাশক (Advanced Parasiticides) ---
        { id: 'm136', name: 'ডেল্টামেথ্রিন (Deltamethrin)', generic: 'Deltamethrin 1%', company: 'Various', category: 'পোর-অন / স্প্রে', indications: 'উঁকুন, আঠালী এবং মাছি দমনে সরাসরি পিঠের উপর বা স্প্রে করে।', dosage: '১ মিলি ওষুধ ১ লিটার পানিতে মিশিয়ে স্প্রে করতে হবে।' },
        { id: 'm137', name: 'সাইপারমেথ্রিন (Cypermethrin)', generic: 'Cypermethrin 10%', company: 'Renata Ltd.', category: 'কীটনাশক', indications: 'খামারের চারপাশ, মেঝ এবং শেডের মশা-মাছি ও পোকা দমনে।', dosage: '২ মিলি ১ লিটার পানিতে মিশিয়ে খামারে স্প্রে (গরুর গায়ে নয়)।' },
        { id: 'm138', name: 'ক্লোস্যানটেল (Closantel)', generic: 'Closantel', company: 'Square Pharma', category: 'কৃমিনাশক (ইনজেকশন)', indications: 'কলিজা কৃমি এবং রক্তচোষা কৃমি দমনে ইনজেকশন।', dosage: 'প্রতি ২৫ কেজি ওজনের জন্য ১ মিলি (চামড়ার নিচে)।' },
        { id: 'm139', name: 'প্রাজিকুয়ান্টেল (Praziquantel)', generic: 'Praziquantel', company: 'Various', category: 'কৃমিনাশক', indications: 'মারাত্মক ফিতা কৃমি (Tapeworm) ধ্বংস করতে।', dosage: 'প্যাকেটের নির্দেশিকা অনুযায়ী খাবারের সাথে।' },
        { id: 'm140', name: 'পিপারাজিন (Piperazine)', generic: 'Piperazine Citrate', company: 'Acme Laboratories', category: 'কৃমিনাশক (লিকুইড)', indications: 'বাছুরের গোল কৃমি দমনে খুবই নিরাপদ লিকুইড ওষুধ।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ৩-৪ মিলি।' },
        { id: 'm141', name: 'নিক্লোসামাইড (Niclosamide)', generic: 'Niclosamide', company: 'Various', category: 'কৃমিনাশক', indications: 'ফিতা কৃমি এবং অন্ত্রের প্যারাসাইট দমনে।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ১টি বড়ি।' },
        { id: 'm142', name: 'টলট্রাজুরিল (Toltrazuril)', generic: 'Toltrazuril 5%', company: 'Renata Ltd.', category: 'ককসিডিওস্ট্যাট', indications: 'বাছুরের তীব্র রক্ত আমাশয় এবং পাতলা পায়খানা নিরাময়ে লিকুইড।', dosage: 'প্রতি ১০ কেজি ওজনের জন্য ৩ মিলি (মুখে খাইয়ে)।' },
        { id: 'm143', name: 'পারমেথ্রিন সাবান (Permethrin Soap)', generic: 'Permethrin 1%', company: 'Various', category: 'ত্বকের সাবান', indications: 'গরুর গায়ের উঁকুন ও মাইট দূর করতে এবং ত্বক পরিষ্কার রাখতে।', dosage: 'গোসলের সময় গায়ে মেখে ৫ মিনিট রেখে ধুয়ে ফেলতে হবে।' },

        // --- স্টেরয়েড ও প্রদাহ বিরোধী (Steroids & Anti-inflammatory) ---
        { id: 'm144', name: 'প্রেডনিসোলন (Prednisolone)', generic: 'Prednisolone Acetate', company: 'Square Pharma', category: 'স্টেরয়েড', indications: 'তীব্র এলার্জি, আকস্মিক শক এবং জয়েন্টের ব্যথায়।', dosage: 'গর্ভবতী গাভীতে ব্যবহার নিষেধ। ৫ মিলি মাংসে।' },
        { id: 'm145', name: 'বেটামিথাসন (Betamethasone)', generic: 'Betamethasone', company: 'Various', category: 'স্টেরয়েড', indications: 'চুলকানি, এলার্জি এবং ওষুধের পার্শ্বপ্রতিক্রিয়া কাটাতে।', dosage: 'চিকিৎসকের পরামর্শে ২-৫ মিলি (মাংসে)।' },
        { id: 'm146', name: 'আইসোফ্লুপ্রেডন (Isoflupredone)', generic: 'Isoflupredone Acetate', company: 'Acme Laboratories', category: 'স্টেরয়েড', indications: 'কিটোসিস রোগ এবং তীব্র ম্যাসটাইটিসের ফোলা কমাতে।', dosage: 'বড় গরুর জন্য ৫ মিলি (মাংসে)।' },
        { id: 'm147', name: 'নিমেসুলাইড (Nimesulide + Paracetamol)', generic: 'Nimesulide + Paracetamol', company: 'Various', category: 'তীব্র ব্যথানাশক', indications: 'তীব্র জ্বর এবং মাসল বা পেশির ব্যথায় দ্রুত কাজ করে।', dosage: 'প্রতি ২৫ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },

        // --- হজম, পরিপাকতন্ত্র ও পেট ফাঁপা (Digestive & Rumen Health) ---
        { id: 'm148', name: 'কাওলিন-পেকটিন (Kaolin + Pectin)', generic: 'Kaolin + Pectin Solution', company: 'Various', category: 'ডায়রিয়া প্রতিরোধক', indications: 'ডায়রিয়া বা পাতলা পায়খানার সময় অন্ত্রের ভেতরের বিষাক্ত পদার্থ শুষে নিতে।', dosage: 'বড় গরুর জন্য ২০০-৫০০ মিলি মুখে খাইয়ে।' },
        { id: 'm149', name: 'সোডিয়াম প্রোপিওনেট (S. Propionate)', generic: 'Sodium Propionate', company: 'Renata Ltd.', category: 'এন্টাসিড / বাফার', indications: 'কিটোসিস প্রতিরোধে এবং রুমেনের এসিডিটি দূর করতে।', dosage: '৫০ গ্রাম পাউডার পানির সাথে মিশিয়ে।' },
        { id: 'm150', name: 'লাইভ ইস্ট (Live Yeast Culture)', generic: 'Saccharomyces cerevisiae', company: 'Various', category: 'প্রোবায়োটিক', indications: 'গরুর রুচি বৃদ্ধি, হজম শক্তি বাড়ানো এবং দুধের ফ্যাট বাড়াতে।', dosage: 'প্রতিদিন ১০-২০ গ্রাম খাবারের সাথে।' },
        { id: 'm151', name: 'ম্যাগনেসিয়াম কার্বোনেট (Mag. Carbonate)', generic: 'Magnesium Carbonate', company: 'Various', category: 'এন্টাসিড', indications: 'তীব্র এসিডিটি এবং পেট ফাঁপার চিকিৎসায়।', dosage: 'চিকিৎসকের নির্দেশ অনুযায়ী।' },
        { id: 'm152', name: 'অ্যাপেটাইজার টনিক (Appetizer Tonic)', generic: 'Herbal Appetizer', company: 'Square Pharma', category: 'রুচি বর্ধক (লিকুইড)', indications: 'রোগ থেকে ওঠার পর গরুর খাবার খাওয়ার রুচি দ্রুত ফিরিয়ে আনতে।', dosage: 'প্রতিদিন ৫০-১০০ মিলি খাইয়ে দিতে হবে।' },
        { id: 'm153', name: 'বিসমুথ সাবসিলিসিলেট (Bismuth)', generic: 'Bismuth Subsalicylate', company: 'Various', category: 'ডায়রিয়া প্রতিরোধক', indications: 'তীব্র ডায়রিয়া এবং পেটের অস্বস্তি বা আলসার কমাতে।', dosage: 'পশু চিকিৎসকের পরামর্শে মুখে খাইয়ে।' },

        // --- প্রজনন, হরমোন ও ইমার্জেন্সি (Reproductive & Emergency) ---
        { id: 'm154', name: 'এইচসিজি ইনজেকশন (hCG)', generic: 'Human Chorionic Gonadotropin', company: 'Various', category: 'হরমোন', indications: 'ওভারিয়ান সিস্ট (Ovarian Cyst) বা গাভীর ডিম্বাশয়ের সমস্যায়।', dosage: 'চিকিৎসকের সরাসরি তত্ত্বাবধানে মাংসে বা শিরায়।' },
        { id: 'm155', name: 'ডাইনোপ্রোস্ট (Dinoprost)', generic: 'PGF2 Alpha', company: 'Renata Ltd.', category: 'হরমোন', indications: 'মৃত বাচ্চা বের করতে, জরায়ুর পুঁজ পরিষ্কার করতে বা হিটে আনতে।', dosage: '৫ মিলি মাংসে (প্রেগন্যান্ট গাভীতে দিলে গর্ভপাত হয়ে যাবে)।' },
        { id: 'm156', name: 'ইস্ট্রাডিওল (Estradiol)', generic: 'Estradiol Benzoate', company: 'Various', category: 'হরমোন', indications: 'গাভীকে কৃত্রিমভাবে হিটে আনতে ব্যবহৃত হয়।', dosage: 'চিকিৎসকের পরামর্শে।' },
        { id: 'm157', name: 'সোডিয়াম এসিড ফসফেট (S.A.P)', generic: 'Sodium Acid Phosphate', company: 'Acme Laboratories', category: 'ফসফরাস সাপ্লিমেন্ট', indications: 'রক্তপেশাব (Hemoglobinuria) এবং প্রজনন সমস্যায়।', dosage: '১০-১৫ মিলি শিরায় বা মাংসে।' },
        { id: 'm158', name: 'ডেক্সট্রোজ ৫০% (Dextrose 50%)', generic: 'Dextrose 50% IV', company: 'Various', category: 'ইমার্জেন্সি স্যালাইন', indications: 'কিটোসিস বা গাভী হঠাৎ এনার্জি হারিয়ে পড়ে গেলে লাইফ সেভিং স্যালাইন।', dosage: '৫০০ মিলি সরাসরি শিরায় (খুব ধীরে ধীরে)।' },
        { id: 'm159', name: 'হার্বাল অক্সিটোসিন (Herbal Drop)', generic: 'Herbal Uterine Stimulant', company: 'Natural Remedies', category: 'হার্বাল মেডিসিন', indications: 'দুধ নামাতে এবং বাচ্চা প্রসবের পর প্রাকৃতিকভাবে ফুল (Placenta) ফেলতে।', dosage: 'খাবারের সাথে বা সরাসরি খাইয়ে দিতে হবে।' },

        // --- অবশ করা, সার্জারি ও ক্ষত (Anesthesia & Surgery) ---
        { id: 'm160', name: 'জাইলাজিন (Xylazine 2%)', generic: 'Xylazine Hydrochloride', company: 'Various', category: 'সিডেটিভ / অজ্ঞানকারক', indications: 'অপারেশন, শিং কাটা বা ক্ষুর কাটার সময় গরুকে শান্ত বা অজ্ঞান করতে।', dosage: '১-৩ মিলি (মাংসে)। শুধুমাত্র রেজিস্টার্ড সার্জনের জন্য।' },
        { id: 'm161', name: 'লিগনোকেইন ২% (Lignocaine)', generic: 'Lidocaine 2%', company: 'Various', category: 'লোকাল অ্যানেস্থেসিয়া', indications: 'নির্দিষ্ট স্থান অবশ করতে (যেমন: সেলাই দেওয়া বা শিং কাটা)।', dosage: 'ক্ষতস্থানের চারপাশে চামড়ার নিচে পুশ করতে হয়।' },
        { id: 'm162', name: 'সিলভার সালফাডায়াজিন (Silver Cream)', generic: 'Silver Sulfadiazine', company: 'Square Pharma', category: 'পোড়া ও ক্ষতের ক্রিম', indications: 'আগুনে পোড়া, গরম পানিতে ঝলসানো বা মারাত্মক সংক্রামক ক্ষতে।', dosage: 'ক্ষতস্থানে প্রলেপ দিয়ে লাগাতে হবে।' },
        { id: 'm163', name: 'জিঙ্ক সালফেট স্প্রে (Zinc Sulphate)', generic: 'Zinc Sulphate Aerosol', company: 'Various', category: 'ক্ষুর সুরক্ষক', indications: 'ক্ষুরের পচন (Foot rot) বা ক্ষুরের মাঝখানের ঘা শুকাতে।', dosage: 'ক্ষুর পরিষ্কার করে দিনে ২ বার স্প্রে করুন।' },
        { id: 'm164', name: 'অ্যালোভেরা নিম স্প্রে (Herbal Fly Spray)', generic: 'Aloe + Neem Extract', company: 'Various', category: 'মাছি তাড়ানোর স্প্রে', indications: 'ক্ষতের চারপাশে মাছি বসা ঠেকাতে এবং প্রাকৃতিকভাবে ঘা শুকাতে।', dosage: 'ক্ষতস্থানের চারপাশে স্প্রে করুন।' },
        { id: 'm165', name: 'হাইড্রোজেন পারক্সাইড (H2O2)', generic: 'Hydrogen Peroxide 3%', company: 'Various', category: 'ক্ষত পরিষ্কারক', indications: 'গভীর ঘা বা পুঁজযুক্ত ক্ষতস্থান থেকে মৃত কোষ ও জীবাণু পরিষ্কার করতে।', dosage: 'ক্ষতস্থানে ঢেলে পরিষ্কার করতে হবে (খাওয়ানো নিষেধ)।' },
        { id: 'm166', name: 'সার্জিক্যাল স্পিরিট (Surgical Spirit)', generic: 'Ethanol 70%', company: 'Various', category: 'জীবাণুনাশক', indications: 'ইনজেকশন দেওয়ার আগে বা অপারেশনের যন্ত্রপাতি জীবাণুমুক্ত করতে।', dosage: 'বাহ্যিক ব্যবহারের জন্য।' },

        // --- ভ্যাকসিন (টিকা) এবং বায়োলজিক্স (Vaccines & Biologics) ---
        { id: 'm167', name: 'এফএমডি ভ্যাকসিন (FMD Trivalent)', generic: 'Foot & Mouth Disease Vaccine', company: 'LRI / Various', category: 'ভ্যাকসিন (টিকা)', indications: 'খুরা রোগ (O, A, Asia-1 টাইপ) থেকে গরুকে সুরক্ষিত রাখতে।', dosage: '২ মিলি চামড়ার নিচে (প্রতি ৬ মাস অন্তর)।' },
        { id: 'm168', name: 'লাম্পি স্কিন ভ্যাকসিন (LSD Vaccine)', generic: 'Goat Pox / LSD Strain', company: 'Various', category: 'ভ্যাকসিন (টিকা)', indications: 'লাম্পি স্কিন ডিজিজ বা গরুর বসন্ত রোগ প্রতিরোধে।', dosage: '১ মিলি চামড়ার নিচে (বছরে ১ বার)।' },
        { id: 'm169', name: 'তড়কা ভ্যাকসিন (Anthrax Vaccine)', generic: 'Anthrax Spore Vaccine', company: 'LRI', category: 'ভ্যাকসিন (টিকা)', indications: 'মারাত্মক অ্যানথ্রাক্স বা তড়কা রোগ থেকে বাঁচতে।', dosage: '১ মিলি চামড়ার নিচে (বছরে ১ বার)।' },
        { id: 'm170', name: 'বাদলা ভ্যাকসিন (BQ Vaccine)', generic: 'Black Quarter Vaccine', company: 'LRI', category: 'ভ্যাকসিন (টিকা)', indications: 'পেশি ফুলে যাওয়া বা বাদলা রোগ প্রতিরোধে।', dosage: '৫ মিলি চামড়ার নিচে (প্রতি ৬ মাস অন্তর)।' },
        { id: 'm171', name: 'গলাফুলা ভ্যাকসিন (HS Vaccine)', generic: 'Haemorrhagic Septicaemia', company: 'LRI', category: 'ভ্যাকসিন (টিকা)', indications: 'বর্ষাকালের আগে গলাফুলা রোগ থেকে গরুকে বাঁচাতে।', dosage: '২ মিলি চামড়ার নিচে (বছরে ২ বার)।' },
        { id: 'm172', name: 'রেবিস ভ্যাকসিন (Rabies Vet)', generic: 'Anti-Rabies Vaccine', company: 'Incepta / Various', category: 'ভ্যাকসিন (টিকা)', indications: 'পাগলা কুকুর বা শিয়াল কামড়ালে জলাতঙ্ক রোগ রোধ করতে।', dosage: 'কামড়ানোর ০, ৩, ৭, ১৪ এবং ২৮ তম দিনে ১ মিলি করে (মাংসে)।' },
        { id: 'm173', name: 'ব্রুসেলোসিস ভ্যাকসিন (Brucella Calf)', generic: 'Brucella Abortus S19', company: 'Various', category: 'ভ্যাকসিন (টিকা)', indications: 'গর্ভপাত বা ব্রুসেলোসিস রোগ ঠেকাতে শুধুমাত্র বকনা বাছুরকে দেওয়া হয়।', dosage: '৪-৮ মাস বয়সী বকনা বাছুরকে ১ বার (চামড়ার নিচে)।' },
        { id: 'm174', name: 'টিটেনাস অ্যান্টিটক্সিন (TAT)', generic: 'Tetanus Antitoxin', company: 'Various', category: 'অ্যান্টিটক্সিন', indications: 'আহত হওয়ার পর বা শিং ভাঙলে সাথে সাথে টিটেনাস প্রতিরোধ করতে।', dosage: '১৫০০ থেকে ৩০০০ আইইউ (IU) চামড়ার নিচে বা মাংসে।' },

        // --- এডিমা, রক্তপাত ও অন্যান্য স্পেশাল ড্রাগস ---
        { id: 'm175', name: 'ফুরোসেমাইড (Furosemide Vet)', generic: 'Furosemide', company: 'Renata Ltd.', category: 'ডাইউরেটিক (Diuretic)', indications: 'ওলান অতিরিক্ত ফুলে গেলে (Edema) বা শরীরে পানি জমলে প্রস্রাবের মাধ্যমে বের করতে।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm176', name: 'ভিটামিন কে-৩ (Vitamin K3 Powder)', generic: 'Menadione Sodium', company: 'Square Pharma', category: 'অ্যান্টি-কোয়াগুল্যান্ট', indications: 'খাবারের বিষক্রিয়া বা ইঁদুরের ওষুধের রিঅ্যাকশনে রক্তপাত হলে।', dosage: 'পানির সাথে মিশিয়ে খাওয়াতে হবে।' },
        { id: 'm177', name: 'ম্যাগনেসিয়াম সালফেট (পোল্টিস)', generic: 'Magnesium Sulphate Paste', company: 'Various', category: 'ব্যথার প্রলেপ (Poultice)', indications: 'পেশিতে আঘাত বা ইনজেকশনের জায়গা ফুলে শক্ত হয়ে গেলে গরম পানিতে মিশিয়ে সেঁক দিতে।', dosage: 'গরম পানিতে পেস্ট বানিয়ে আক্রান্ত স্থানে লাগাতে হবে।' },
        { id: 'm178', name: 'অ্যান্টি-ডায়রিয়াল পাউডার (Anti-Diarrheal)', generic: 'Bael + Herbal Extract', company: 'Various', category: 'হার্বাল পাউডার', indications: 'দীর্ঘমেয়াদী পাতলা পায়খানা বন্ধ করতে সম্পূর্ণ ন্যাচারাল সমাধান।', dosage: 'প্রতিদিন ৫০ গ্রাম খাবারের সাথে।' },
        { id: 'm179', name: 'কপার সালফেট পাউডার (তঁতে)', generic: 'Copper Sulphate Powder', company: 'Various', category: 'অ্যান্টি-ফাঙ্গাল', indications: 'পুকুরের পানি জীবাণুমুক্ত করতে বা গরুর ফাঙ্গাল ঘায়ের চিকিৎসায়।', dosage: '১% থেকে ২% দ্রবণ তৈরি করে ব্যবহার্য।' },
        { id: 'm180', name: 'ভিটামিন এডি৩ই+বি১২ (AD3E + B12)', generic: 'Vitamins Combo', company: 'Acme Laboratories', category: 'ভিটামিন ইনজেকশন', indications: 'দুর্বল বাছুরের গ্রোথ বাড়াতে এবং হাড় বাঁকা হওয়া রোধ করতে।', dosage: 'বাছুরের জন্য ২-৩ মিলি (মাংসে)।' },
        { id: 'm181', name: 'নরফ্লক্সাসিন (Norfloxacin)', generic: 'Norfloxacin', company: 'Various', category: 'অ্যান্টিবায়োটিক (পাউডার)', indications: 'পানির মাধ্যমে গণহারে ব্যাকটেরিয়াল ইনফেকশন ও আমাশয় রোধে।', dosage: '১ গ্রাম ১ লিটার পানিতে।' },
        { id: 'm182', name: 'লেভোফ্লক্সাসিন (Levofloxacin)', generic: 'Levofloxacin', company: 'Square Pharma', category: 'অ্যান্টিবায়োটিক (লিকুইড)', indications: 'তীব্র শ্বাসকষ্ট ও নিউমোনিয়ায় দ্রুত কাজ করতে।', dosage: 'পানির সাথে মিশিয়ে খাওয়াতে হবে।' },
        { id: 'm183', name: 'সালফামেথক্সাজল + ট্রাইমেথোপ্রিম', generic: 'Co-trimoxazole', company: 'Various', category: 'অ্যান্টিবায়োটিক', indications: 'পরিপাকতন্ত্র এবং জরায়ুর ব্যাকটেরিয়াল ইনফেকশন।', dosage: 'বড় গরুকে ২-৪টি বোলাস।' },
        { id: 'm184', name: 'নিওমাইসিন (Neomycin)', generic: 'Neomycin Sulphate', company: 'Renata Ltd.', category: 'অ্যান্টিবায়োটিক', indications: 'অন্ত্রের ব্যাকটেরিয়াল ইনফেকশন (Enteritis) দমনে খুবই কার্যকরী।', dosage: 'প্রতিদিন ১-২ গ্রাম পাউডার।' },
        { id: 'm185', name: 'মারবোফ্লক্সাসিন (Marbofloxacin)', generic: 'Marbofloxacin', company: 'Various', category: 'অ্যান্টিবায়োটিক', indications: 'মারাত্মক ম্যাসটাইটিস এবং শ্বাসতন্ত্রের ইনফেকশন (BRD)।', dosage: 'প্রতি ৫০ কেজি ওজনের জন্য ১ মিলি (মাংসে)।' },
        { id: 'm186', name: 'অ্যাসপিরিন (Aspirin Bolus)', generic: 'Acetylsalicylic Acid', company: 'Various', category: 'ব্যথানাশক বড়ি', indications: 'সাধারণ জ্বর, পেশির ব্যথা এবং প্রদাহ কমাতে সাশ্রয়ী বড়ি।', dosage: 'বড় গরুর জন্য ২-৩টি বড়ি।' },
        { id: 'm187', name: 'ফিনাইলবুটাজোন (Phenylbutazone)', generic: 'Phenylbutazone', company: 'Various', category: 'তীব্র ব্যথানাশক', indications: 'হাড় বা জয়েন্টের মারাত্মক ব্যথা (Arthritis) এবং খোঁড়ানো বন্ধ করতে।', dosage: 'প্রতি ২০ কেজি ওজনের জন্য ১ মিলি (মাংসে বা শিরায়)।' },
        { id: 'm188', name: 'পাইরোক্সিকাম (Piroxicam)', generic: 'Piroxicam', company: 'Square Pharma', category: 'ব্যথানাশক', indications: 'অস্থিসন্ধি এবং পেশির তীব্র প্রদাহ কমাতে।', dosage: 'চিকিৎসকের পরামর্শে।' },
        { id: 'm189', name: 'মেবেন্ডাজোল (Mebendazole)', generic: 'Mebendazole', company: 'Various', category: 'কৃমিনাশক', indications: 'অন্ত্রের গোল কৃমি ও সুতা কৃমি দমনে।', dosage: 'খাবারের সাথে মিশিয়ে।' },
        { id: 'm190', name: 'ডাইমিনেজেন + ফেনাজোন', generic: 'Diminazene + Phenazone', company: 'Renata Ltd.', category: 'অ্যান্টি-প্রোটোজোয়াল', indications: 'বাবেসিয়া (রক্তপেশাব) এবং ট্রাইপ্যানোসোমা জীবাণু দমনে ব্যথানাশকসহ।', dosage: 'প্রতি ১০০ কেজি ওজনের জন্য ৩.৫ মিলি (মাংসে)।' },
        { id: 'm191', name: 'ক্লোরটেট্রাসাইক্লিন (Chlortetracycline)', generic: 'CTC Powder', company: 'Various', category: 'অ্যান্টিবায়োটিক প্রিমিক্স', indications: 'খামারে গণহারে রোগ প্রতিরোধ করতে খাদ্যের সাথে মেশানোর জন্য।', dosage: '১০০ কেজি খাবারে পরিমাণমতো মেশাতে হবে।' },
        { id: 'm192', name: 'অ্যান্টি-ককসিডিয়াল (Anti-coccidial)', generic: 'Amprolium + Sulpha', company: 'Various', category: 'রক্ত আমাশয়', indications: 'বাছুরের তীব্র রক্ত আমাশয় বন্ধ করতে।', dosage: 'পানির সাথে মিশিয়ে।' },
        { id: 'm193', name: 'হার্বাল ইউটেরিন টনিক (Liquid)', generic: 'Uterine Cleanser', company: 'Various', category: 'জরায়ু টনিক', indications: 'গাভীর জরায়ু পরিষ্কার এবং হিটে আসার সাইকেল ঠিক করতে।', dosage: 'প্রতিদিন ৫০-১০০ মিলি।' },
        { id: 'm194', name: 'ট্রেস মিনারেল ইনজেকশন', generic: 'Trace Minerals', company: 'Various', category: 'মিনারেল ইনজেকশন', indications: 'কপার, কোবাল্ট ও সেলেনিয়ামের ঘাটতি পূরণে।', dosage: 'চিকিৎসকের পরামর্শে।' },
        { id: 'm195', name: 'ভিটামিন বি১ (Thiamine)', generic: 'Vitamin B1 Injection', company: 'Acme Laboratories', category: 'ভিটামিন ইনজেকশন', indications: 'স্নায়ুবিক রোগ (Polioencephalomalacia) বা গরুর মাথা বাঁকা হয়ে যাওয়ার চিকিৎসায়।', dosage: 'লক্ষণ বুঝে মাংসে বা শিরায়।' },
        { id: 'm196', name: 'ভিটামিন সি পাউডার (Vitamin C)', generic: 'Ascorbic Acid Powder', company: 'Square Pharma', category: 'ভিটামিন পাউডার', indications: 'তীব্র গরমের সময় হিট স্ট্রোক রোধে পানির সাথে।', dosage: '১ গ্রাম ২ লিটার পানিতে।' },
        { id: 'm197', name: 'প্রোবায়োটিক জেল (Probiotic Gel)', generic: 'Live Yeast Paste', company: 'Various', category: 'ওরাল জেল', indications: 'অসুস্থ গরুর রুচি দ্রুত ফেরাতে সরাসরি মুখে পুশ করার জেল।', dosage: '১টি পুরো টিউব খাইয়ে দিতে হবে।' },
        { id: 'm198', name: 'অ্যান্টি-ব্লোট লিকুইড (Anti-Bloat)', generic: 'Herbal Carminative', company: 'Natural Remedies', category: 'পেট ফাঁপা', indications: 'গ্যাস বা পেট ফাঁপায় দ্রুত স্বস্তি দিতে হার্বাল লিকুইড।', dosage: '১০০ মিলি আধা লিটার পানিতে মিশিয়ে।' },
        { id: 'm199', name: 'ক্যালসিয়াম বোরোগ্লুকোনেট + ম্যাগনেসিয়াম', generic: 'CBG + Mg IV', company: 'Various', category: 'আইভি স্যালাইন', indications: 'ঘাস টিটানি (Grass Tetany) এবং দুধ জ্বরের যৌথ চিকিৎসায়।', dosage: 'শিরায় (চিকিৎসকের তত্ত্বাবধানে)।' },
        { id: 'm200', name: 'হার্বাল লিভার পাউডার (Liver Powder)', generic: 'Herbal Liver Extract', company: 'Various', category: 'লিভার টনিক (পাউডার)', indications: 'খাবারের সাথে মিশিয়ে লিভারের কার্যক্ষমতা বাড়াতে।', dosage: 'প্রতিদিন ২০-৩০ গ্রাম।' }
    ];

    window.renderMedicineList = function() {
        const container = document.getElementById('medicine-list-container');
        if(!container) return;
        window.displayMedicines(window.vetMedicinesData);
    };

    window.displayMedicines = function(medicines) {
        const container = document.getElementById('medicine-list-container');
        let html = '';
        if(medicines.length === 0) {
            html = '<div style="text-align:center; padding:30px; color:var(--text-muted);">কোনো মেডিসিন পাওয়া যায়নি।</div>';
        } else {
            medicines.forEach(med => {
                html += `
                <div class="agro-card fade-in" onclick="window.showMedicineDetailsModal('${med.id}')" style="margin-bottom: 12px; padding: 15px; cursor: pointer; border-left: 4px solid #C62828;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 style="margin: 0 0 4px 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700;">${med.name}</h3>
                            <p style="margin: 0 0 6px 0; font-size: 0.8rem; color: #555;"><i>${med.generic}</i></p>
                            <span style="background: rgba(198, 40, 40, 0.1); color: #C62828; font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 12px;">${med.category}</span>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color: #ccc; margin-top: 10px;"></i>
                    </div>
                </div>`;
            });
        }
        container.innerHTML = html;
    };

    window.searchMedicine = function() {
        const query = document.getElementById('medicine-search-input').value.toLowerCase();
        const filtered = window.vetMedicinesData.filter(med => 
            med.name.toLowerCase().includes(query) || 
            med.generic.toLowerCase().includes(query) ||
            med.indications.toLowerCase().includes(query) ||
            med.category.toLowerCase().includes(query)
        );
        window.displayMedicines(filtered);
    };

    window.showMedicineDetailsModal = function(id) {
        window.vibrate(40);
        const med = window.vetMedicinesData.find(m => m.id === id);
        if(!med) return;

        const modalHTML = `
            <div id="medicine-details-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 100000; display: flex; justify-content: center; align-items: flex-end; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 100%; max-height: 85vh; border-top-left-radius: 24px; border-top-right-radius: 24px; padding: 25px 20px; overflow-y: auto; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 -10px 25px rgba(0,0,0,0.1);">
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div style="padding-right: 15px;">
                            <span style="background: rgba(198, 40, 40, 0.1); color: #C62828; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 12px; margin-bottom: 8px; display: inline-block;">${med.category}</span>
                            <h2 style="margin: 0 0 5px 0; color: var(--text-main); font-size: 1.4rem; font-weight: 800;">${med.name}</h2>
                            <p style="margin: 0; color: #555; font-size: 0.9rem;"><i>${med.generic}</i></p>
                            <p style="margin: 5px 0 0 0; color: var(--primary-main); font-size: 0.85rem; font-weight: 600;"><i class="fa-regular fa-building"></i> ${med.company}</p>
                        </div>
                        <button onclick="document.getElementById('medicine-details-modal').remove()" style="background: #f1f3f4; border: none; width: 35px; height: 35px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; flex-shrink: 0;">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div style="font-size: 0.95rem; color: var(--text-main); line-height:1.6;">
                        <div style="background: #F9F9F9; padding: 15px; border-radius: 14px; margin-bottom: 15px; border: 1px solid #E0E0E0;">
                            <h4 style="color:var(--text-main); margin:0 0 8px 0; font-size: 1rem;"><i class="fa-solid fa-stethoscope" style="color: #00796B;"></i> নির্দেশনা / ব্যবহার (Indications)</h4>
                            <p style="margin: 0; color: var(--text-muted);">${med.indications}</p>
                        </div>
                        
                        <div style="background: rgba(255, 152, 0, 0.05); padding: 15px; border-radius: 14px; margin-bottom: 15px; border: 1px solid rgba(255, 152, 0, 0.2);">
                            <h4 style="color:#E65100; margin:0 0 8px 0; font-size: 1rem;"><i class="fa-solid fa-syringe"></i> মাত্রা ও প্রয়োগ (Dosage)</h4>
                            <p style="margin: 0; color: #5D4037; font-weight: 600;">${med.dosage}</p>
                        </div>
                        
                        <div style="background:rgba(217, 48, 37, 0.08); padding:15px; border-radius:12px; border-left: 4px solid var(--danger);">
                            <p style="color:var(--danger); font-size:0.85rem; margin:0; line-height:1.6; font-weight: 600;">
                                <i class="fa-solid fa-triangle-exclamation"></i> সতর্কতা: যেকোনো ঔষধ বা ইনজেকশন ব্যবহারের পূর্বে অবশ্যই একজন রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের পরামর্শ নিন।
                            </p>
                        </div>
                    </div>
                    
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('medicine-details-modal');
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('div').style.transform = 'translateY(0)';
        }, 10);
    };

    // ==========================================
    // ইউজার লগইন ও লগআউট লজিক (Google Auth)
    // ==========================================

    window.loginWithGoogle = function() {
        if (navigator.vibrate) navigator.vibrate(40);

        // বাটনটিতে লোডিং এনিমেশন দেখানো
        const btn = document.querySelector('button[onclick*="loginWithGoogle"]');
        if(btn) btn.innerHTML = '<div style="display:flex; align-items:center; gap:15px; justify-content:center; width:100%;"><i class="fa-solid fa-spinner fa-spin" style="color: #4CAF50;"></i> <span style="font-size: 1.05rem; font-weight: 600; color: #4CAF50;">লগইন হচ্ছে...</span></div>';

        if(window.auth && window.fbAuth) {
            const { signInWithPopup, GoogleAuthProvider } = window.fbAuth;
            const provider = new GoogleAuthProvider();

            signInWithPopup(window.auth, provider).then((result) => {
                const user = result.user;
                const userId = 'user_' + user.uid;
                
                const userData = {
                    uid: user.uid,
                    name: user.displayName || 'খামারি ভাই',
                    email: user.email,
                    phone: user.phoneNumber || '01700000000',
                    photoURL: user.photoURL || '',
                    regDate: new Date().toLocaleDateString('bn-BD'),
                    timestamp: new Date().toISOString()
                };

                // ফায়ারবেস ও লোকাল স্টোরেজে সেভ করা
                if(window.db && window.fbFirestore) {
                    const { doc, setDoc } = window.fbFirestore;
                    setDoc(doc(window.db, "users", userId), userData, { merge: true }).then(() => {
                        localStorage.setItem('agroUser', JSON.stringify(userData));
                        window.location.reload(); 
                    });
                } else {
                    localStorage.setItem('agroUser', JSON.stringify(userData));
                    window.location.reload();
                }
            }).catch((error) => {
                alert("লগইন বাতিল হয়েছে বা সমস্যা হয়েছে: " + error.message);
                if(btn) btn.innerHTML = '<div style="display:flex; align-items:center; gap:15px;"><i class="fa-brands fa-google" style="color: #4CAF50; font-size: 1.2rem; width: 25px; text-align: center;"></i><span style="font-size: 1.05rem; font-weight: 600; color: #4CAF50;">Google দিয়ে লগইন করুন</span></div>';
            });
        } else {
            alert("ইন্টারনেট বা ফায়ারবেস কানেকশন চেক করুন!");
            if(btn) btn.innerHTML = '<div style="display:flex; align-items:center; gap:15px;"><i class="fa-brands fa-google" style="color: #4CAF50; font-size: 1.2rem; width: 25px; text-align: center;"></i><span style="font-size: 1.05rem; font-weight: 600; color: #4CAF50;">Google দিয়ে লগইন করুন</span></div>';
        }
    };

    window.showLogoutModal = function() {
        if(navigator.vibrate) navigator.vibrate(40);
        
        const existingModal = document.getElementById('logout-confirm-modal');
        if(existingModal) existingModal.remove();

        const modalHTML = `
            <div id="logout-confirm-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 100000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.9); transition: transform 0.3s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div style="width: 65px; height: 65px; background: rgba(217, 48, 37, 0.1); color: var(--danger); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; margin: 0 auto 15px auto;"><i class="fa-solid fa-right-from-bracket"></i></div>
                    <h3 style="color: var(--text-main); font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">অ্যাকাউন্ট সাইন-আউট</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 25px; line-height: 1.5;">আপনি কি নিশ্চিত যে অ্যাকাউন্ট থেকে বের হয়ে যেতে চান?</p>
                    <div style="display: flex; gap: 12px;">
                        <button onclick="document.getElementById('logout-confirm-modal').remove()" style="flex: 1; background: #f1f3f4; color: var(--text-muted); border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer;">বাতিল</button>
                        <button onclick="window.executeLogout()" style="flex: 1; background: var(--danger); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(217, 48, 37, 0.3);">লগআউট</button>
                    </div>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => {
            const modal = document.getElementById('logout-confirm-modal');
            if(modal) {
                modal.style.opacity = '1';
                modal.querySelector('div').style.transform = 'scale(1)';
            }
        }, 30);
    };

    window.executeLogout = function() {
        if(navigator.vibrate) navigator.vibrate(40);
        
        const modal = document.getElementById('logout-confirm-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
        }

        localStorage.removeItem('agroUser'); // সবার আগে লোকাল ডাটা মুছে ফেলা

        if (window.auth && typeof window.auth.signOut === 'function') {
            window.auth.signOut().then(() => {
                setTimeout(() => window.location.reload(), 150); 
            }).catch(err => {
                setTimeout(() => window.location.reload(), 150);
            });
        } else {
            setTimeout(() => window.location.reload(), 150);
        }
    };

    // ==========================================
    // সুষম খাদ্য ক্যালকুলেটর (Bulletproof Version)
    // ==========================================
    window.showCalculationResult = function() {
        if(navigator.vibrate) navigator.vibrate(40);
        
        const kgInput = document.getElementById('total-kg');
        const catElem = document.getElementById('food-cat');
        
        if(!kgInput || !catElem) return; // পেজ ঠিকমতো লোড না হলে থামিয়ে দেবে
        
        const targetKg = parseFloat(kgInput.value) || 0;
        const cat = catElem.value;
        
        if(targetKg <= 0) {
            alert('অনুগ্রহ করে সঠিক পরিমাণ (কেজি) দিন!');
            return;
        }

        // ১. ক্র্যাশ রোধে নিরাপদ ফর্মুলা (Internal Fallback)
        const safeFormulas = {
            primary: {
                main: [{name: 'গমের ভুষি', qty: 35}, {name: 'রাইস কুড়া/পলিস', qty: 25}, {name: 'ভুট্টা ভাঙা', qty: 20}, {name: 'সরিষার খৈল', qty: 15}, {name: 'মসুর ডালের খোসা', qty: 3}],
                supplements: [{name: 'লবণ', qty: 1}, {name: 'লাইমস্টোন', qty: 0.5}, {name: 'ভিটামিন-মিনারেল প্রিমিক্স', qty: 0.5}]
            },
            standard: {
                main: [{name: 'ভুট্টা ভাঙা', qty: 30}, {name: 'গমের ভুষি', qty: 25}, {name: 'সয়াবিন মিল', qty: 15}, {name: 'রাইস কুড়া/পলিস', qty: 15}, {name: 'সরিষার খৈল', qty: 12}],
                supplements: [{name: 'লবণ', qty: 1}, {name: 'ডিসি পাউডার (DCP)', qty: 1}, {name: 'ভিটামিন-মিনারেল প্রিমিক্স', qty: 1}]
            },
            premium: {
                main: [{name: 'ভুট্টা ভাঙা', qty: 35}, {name: 'সয়াবিন মিল', qty: 25}, {name: 'গমের ভুষি', qty: 15}, {name: 'DDGS', qty: 12}, {name: 'রাইস কুড়া/পলিস', qty: 10}],
                supplements: [{name: 'লাইভ ইস্ট (Yeast)', qty: 0.070}, {name: 'টক্সিন বাইন্ডার', qty: 0.2}, {name: 'লবণ', qty: 1}, {name: 'ভিটামিন-মিনারেল প্রিমিক্স', qty: 1}]
            }
        };

        let formulas = safeFormulas;
        try {
            const savedFormulas = JSON.parse(localStorage.getItem('agroFormulas'));
            if (savedFormulas && savedFormulas[cat] && savedFormulas[cat].main) {
                formulas = savedFormulas;
            }
        } catch(e) {}

        const selectedData = formulas[cat] || safeFormulas['standard'];

        // ২. নিরাপদ বাজার দর (Internal Fallback)
        const safePrices = {
            'ভুট্টা ভাঙা': 27, 'রাইস কুড়া/পলিস': 28, 'গমের ভুষি': 45, 'সয়াবিন মিল': 64, 'মসুর ডালের খোসা': 35,
            'সরিষার খৈল': 45, 'DDGS': 42, 'DORB': 25, 'রেপসিড (Rapeseed)': 40, 'শুঁটকি মাছের গুঁড়ো': 90,
            'লাইমস্টোন': 13, 'লবণ': 15, 'ভেজিটেবল ফ্যাট': 160, 'এমসিপি (MCP)': 65, 'খাবার সোডা': 60,
            'টক্সিন বাইন্ডার': 350, 'ইস্ট (Yeast)': 1000, 'মেথিওনিন (Methionine)': 650, 'লাইসিন (Lysine)': 550,
            'ফাইটোজ এনজাইম': 450, 'ভিটামিন-মিনারেল প্রিমিক্স': 280, 'সাধারণ প্রিমিক্স': 150,
            'Growth Promoter': 380, 'রুমেন সাপোর্ট (Rumen)': 350, 'সিআর (Chromium)': 900
        };

        const savedPrices = JSON.parse(localStorage.getItem('agroFeedPrices')) || {};
        const multiplier = targetKg / 100;
        let totalCost = 0; 

        const renderItem = (item) => {
            const calculatedQty = item.qty * multiplier;
            
            // প্রথমে সেভ করা দাম খুঁজবে, না পেলে গ্লোবাল, তাও না পেলে নিজস্ব ফলব্যাক
            let currentPrice = 0;
            if (savedPrices[item.name]) {
                currentPrice = savedPrices[item.name];
            } else if (window.defaultGlobalPrices && window.defaultGlobalPrices[item.name]) {
                currentPrice = window.defaultGlobalPrices[item.name];
            } else if (safePrices[item.name]) {
                currentPrice = safePrices[item.name];
            }

            const itemCost = calculatedQty * currentPrice;
            totalCost += itemCost;

            const displayQty = calculatedQty >= 1 
                ? `<strong style="color: var(--text-main); font-size: 1rem;">${calculatedQty.toFixed(2)} কেজি</strong>` 
                : `<strong style="color: var(--primary-main); font-size: 1rem;">${(calculatedQty * 1000).toFixed(0)} গ্রাম</strong>`;
                
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px dashed #ddd; padding-bottom: 10px;">
                    <div>
                        <span style="color: var(--text-muted); font-size: 0.95rem; display: block;">${item.name}</span>
                        <small style="color: #999; font-size: 0.75rem;">@ ৳${currentPrice}/কেজি</small>
                    </div>
                    <div style="text-align: right;">
                        ${displayQty}
                        <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">৳ ${itemCost.toFixed(0)}</div>
                    </div>
                </div>
            `;
        };

        const resultArea = document.getElementById('calc-result-area');
        if(!resultArea) return;
        
        const resultHTML = `
            <div class="agro-card fade-in" style="border-top: 4px solid var(--primary-main); padding: 20px;">
                <h3 style="margin-bottom: 15px; color: var(--primary-dark); font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-receipt"></i> ${targetKg} কেজির খাদ্য তালিকা
                </h3>
                
                <h4 style="color: var(--text-main); font-size: 1.05rem; margin-bottom: 10px;"><i class="fa-solid fa-wheat-awn"></i> মূল উপকরণসমূহ</h4>
                <div style="background: #F9F9F9; border-radius: 12px; padding: 15px 15px 5px 15px; margin-bottom: 20px; border: 1px solid #eee;">
                    ${selectedData.main.map(renderItem).join('')}
                </div>

                <h4 style="color: var(--text-main); font-size: 1.05rem; margin-bottom: 10px;"><i class="fa-solid fa-capsules"></i> পুষ্টি ও সাপ্লিমেন্ট</h4>
                <div style="background: rgba(255, 193, 7, 0.05); border-radius: 12px; padding: 15px 15px 5px 15px; margin-bottom: 15px; border: 1px solid rgba(255, 193, 7, 0.2);">
                    ${selectedData.supplements.map(renderItem).join('')}
                </div>
                
                <div style="background: linear-gradient(135deg, var(--primary-main), var(--primary-dark)); padding: 15px; border-radius: 12px; color: white; margin-top: 20px; box-shadow: 0 5px 15px rgba(46, 125, 50, 0.3);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">
                        <span style="font-size: 1rem; opacity: 0.9;">মোট পরিমাণ:</span>
                        <span style="font-size: 1.1rem; font-weight: 700;">${targetKg} কেজি</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">
                        <span style="font-size: 1rem; opacity: 0.9;">আনুমানিক মোট খরচ:</span>
                        <span style="font-size: 1.2rem; font-weight: 700; color: var(--accent);">৳ ${totalCost.toFixed(0)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 1rem; opacity: 0.9;">প্রতি কেজির দাম:</span>
                        <span style="font-size: 1.4rem; font-weight: 700;">৳ ${(totalCost / targetKg).toFixed(2)}</span>
                    </div>
                </div>
                
                <button onclick="if(window.saveCostToFinance) window.saveCostToFinance(${totalCost.toFixed(0)}, '${targetKg} কেজির খাদ্য মিশ্রণ তৈরি')" style="width: 100%; margin-top: 15px; background: transparent; border: 1.5px solid var(--primary-main); color: var(--primary-main); padding: 12px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.3s; display: flex; justify-content: center; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-plus"></i> এই খরচটি আয়-ব্যয়ে যোগ করুন
                </button>
            </div>
        `;
        
        resultArea.style.display = 'block';
        resultArea.innerHTML = resultHTML;
        
        setTimeout(() => {
            resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    };

    // ==========================================
    // রিপোর্ট ডাউনলোড / পিডিএফ জেনারেটর
    // ==========================================
    window.downloadProteinReport = function() {
        if(navigator.vibrate) navigator.vibrate(40);
        
        const inputs = document.querySelectorAll('.protein-kg-input');
        let selectedItems = [];
        let totalKgVal = 0;

        // শুধু 0 এর চেয়ে বেশি কেজি দেওয়া উপাদানগুলো ফিল্টার করা
        inputs.forEach(input => {
            const kg = parseFloat(input.value) || 0;
            if(kg > 0) {
                // ঐ নির্দিষ্ট input এর পাশের <h4> থেকে উপাদানের নাম নেওয়া
                const itemName = input.parentElement.parentElement.querySelector('h4').innerText;
                selectedItems.push({ name: itemName, kg: kg });
                totalKgVal += kg;
            }
        });

        // যদি কোনো কেজি দেওয়া না থাকে
        if(selectedItems.length === 0) {
            return alert("ডাউনলোড করার জন্য অন্তত একটি উপাদানের পরিমাণ (কেজি) দিন!");
        }

        // ক্যালকুলেট হওয়া মোট পুষ্টিমানের ডাটা কালেক্ট করা
        const totalCp = document.getElementById('calc-total-cp').innerText;
        const totalTdn = document.getElementById('calc-total-tdn').innerText;
        const totalCa = document.getElementById('calc-total-ca').innerText;
        const totalP = document.getElementById('calc-total-p').innerText;
        const totalMin = document.getElementById('calc-total-min').innerText;
        const totalVit = document.getElementById('calc-total-vit').innerText;

        // ইনভয়েস স্টাইল HTML তৈরি
        let invoiceHtml = `
        <html>
        <head>
            <title>পুষ্টিমান রিপোর্ট - ডিজিটাল এগ্রো</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #2C3E50; }
                .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #00796B; padding-bottom: 15px; }
                .header h2 { margin: 0; color: #00796B; font-size: 26px; }
                .header p { margin: 6px 0 0 0; font-size: 14px; color: #7F8C8D; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                th, td { border: 1px solid #E0E0E0; padding: 12px; text-align: left; font-size: 15px; }
                th { background-color: #E8F5E9; color: #2E7D32; }
                .totals-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; background: #E0F2F1; padding: 20px; border-radius: 12px; border: 1px solid #B2DFDB; }
                .total-box { text-align: center; flex: 1; min-width: 90px; }
                .total-box span { display: block; font-size: 13px; color: #004D40; margin-bottom: 8px; font-weight: 600; }
                .total-box strong { font-size: 18px; color: #00796B; background: #fff; padding: 5px 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #95A5A6; border-top: 1px dashed #BDC3C7; padding-top: 15px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>ডিজিটাল এগ্রো ফার্ম</h2>
                <p>সুষম খাদ্যের মিশ্রণ ও পুষ্টিমান রিপোর্ট</p>
                <p>তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
            </div>
            
            <h3 style="font-size: 17px; margin-bottom: 12px; color: #34495E;">উপাদানের তালিকা:</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 10%; text-align: center;">ক্রমিক</th>
                        <th style="width: 60%;">উপাদানের নাম</th>
                        <th style="width: 30%; text-align: right;">পরিমাণ (কেজি)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // শুধু সিলেক্ট করা উপাদানগুলো টেবিলে যোগ করা
        selectedItems.forEach((item, index) => {
            invoiceHtml += `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>${item.name}</td>
                    <td style="text-align: right; font-weight: bold; color: #2C3E50;">${item.kg.toFixed(2)}</td>
                </tr>
            `;
        });

        // টেবিলের নিচে মোট মিশ্রণ
        invoiceHtml += `
                    <tr style="background-color: #F9F9F9;">
                        <td colspan="2" style="text-align: right; font-weight: bold; color: #00796B;">মোট দানাদার মিশ্রণ:</td>
                        <td style="text-align: right; font-weight: bold; color: #00796B; font-size: 16px;">${totalKgVal.toFixed(2)} কেজি</td>
                    </tr>
                </tbody>
            </table>

            <h3 style="font-size: 17px; margin-bottom: 12px; margin-top: 35px; color: #34495E;">চূড়ান্ত পুষ্টিমান (ফাইনাল রেজাল্ট):</h3>
            <div class="totals-grid">
                <div class="total-box"><span>প্রোটিন (CP)</span><strong>${totalCp}</strong></div>
                <div class="total-box"><span>এনার্জি (TDN)</span><strong>${totalTdn}</strong></div>
                <div class="total-box"><span>ক্যালসিয়াম</span><strong>${totalCa}</strong></div>
                <div class="total-box"><span>ফসফরাস</span><strong>${totalP}</strong></div>
                <div class="total-box"><span>খনিজ (Min)</span><strong>${totalMin}</strong></div>
                <div class="total-box"><span>ভিটামিন</span><strong>${totalVit}</strong></div>
            </div>
            
            <div class="footer">
                রিপোর্টটি <strong>ডিজিটাল এগ্রো</strong> স্মার্ট অ্যাপ দ্বারা স্বয়ংক্রিয়ভাবে জেনারেট করা হয়েছে।
            </div>
        </body>
        </html>
        `;

        // নতুন উইন্ডোতে খুলে প্রিন্ট ডায়ালগ দেখানো
        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
        
        // થોડીক্ষণ অপেক্ষা করে প্রিন্ট কমান্ড দেওয়া (স্টাইল লোড হওয়ার জন্য)
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

});