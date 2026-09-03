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
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 15px;">
                        <div class="grid-item fade-in" onclick="loadPage('food-calculator')" style="cursor:pointer; text-align:center;">
                            <div style="width:50px; height:50px; background:rgba(76, 175, 80, 0.12); color:#2E7D32; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
                                <i class="fa-solid fa-scale-balanced"></i>
                            </div>
                            <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">খাদ্য হিসাব</span>
                        </div>
                        <div class="grid-item fade-in" onclick="loadPage('treatment')" style="cursor:pointer; text-align:center;">
                            <div style="width:50px; height:50px; background:rgba(33, 150, 243, 0.12); color:#1565C0; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
                                <i class="fa-solid fa-syringe"></i>
                            </div>
                            <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">চিকিৎসা</span>
                        </div>
                        <div class="grid-item fade-in" onclick="loadPage('ay-bay')" style="cursor:pointer; text-align:center;">
                            <div style="width:50px; height:50px; background:rgba(255, 152, 0, 0.12); color:#E65100; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
                                <i class="fa-solid fa-file-invoice-dollar"></i>
                            </div>
                            <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">আয়-ব্যয়</span>
                        </div>
                        <div class="grid-item fade-in" onclick="loadPage('alerts')" style="cursor:pointer; text-align:center;">
                            <div style="width:50px; height:50px; background:rgba(156, 39, 176, 0.12); color:#6A1B9A; border-radius:16px; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin:0 auto 6px auto;">
                                <i class="fa-solid fa-calendar-check"></i>
                            </div>
                            <span style="font-weight:600; color:var(--text-main); font-size:0.78rem;">রিমাইন্ডার</span>
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

                    <!-- 🔥 প্রিমিয়াম ফ্যাটেনিং খামার সেকশন (নতুন যুক্ত করা হলো) -->
                    <div style="padding: 0 15px;">
                        
                        <!-- ১. হিরো ব্যানার (Hero Banner with HD Cattle Photo) -->
                        <div class="agro-card fade-in" style="position: relative; overflow: hidden; border-radius: 20px; border: none; box-shadow: 0 10px 25px rgba(0,0,0,0.08); margin-bottom: 18px; padding: 0;">
                            <div style="background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 100%), url('https://images.unsplash.com/photo-1545468843-27956a3a7ef8?q=80&w=800&auto=format&fit=crop'); background-size: cover; background-position: center; min-height: 180px; padding: 20px; display: flex; flex-direction: column; justify-content: flex-end; color: white;">
                                <span style="background: #4CAF50; color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; width: max-content; margin-bottom: 8px; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(76,175,80,0.4);">
                                    🔥 প্রিমিয়াম ফ্যাটেনিং গাইড
                                </span>
                                <h3 style="margin: 0 0 6px 0; font-size: 1.25rem; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.6);">ষাঁড় মোটাতাজাকরণ ও উন্নত রেশন</h3>
                                <p style="margin: 0; font-size: 0.8rem; opacity: 0.92; line-height: 1.4; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">
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

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                            
                            <!-- কার্ড ১ -->
                            <div class="agro-card" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); background: var(--card-bg, #fff);">
                                <img src="https://i.postimg.cc/15vBh5m8/Gemini-Generated-Image-ipzo9oipzo9oipzo.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="Cattle Feed">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #795548; font-weight: 700; text-transform: uppercase;">খাদ্য প্রস্তুতকরণ</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">TMR রেশনিং পদ্ধতি</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">DDGS, ভুষি ও খৈলের মিশ্রণে সুষম টিএমআর খাবার প্রদান।</p>
                                </div>
                            </div>

                            <!-- কার্ড ২ -->
                            <div class="agro-card" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); background: var(--card-bg, #fff);">
                                <img src="https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?q=80&w=400&auto=format&fit=crop" style="width: 100%; height: 105px; object-fit: cover;" alt="Cattle Farm">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #4CAF50; font-weight: 700; text-transform: uppercase;">স্বাস্থ্য সুরক্ষা</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">ভ্যাকসিনেশন ও ডিওয়ার্মিং</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">ফ্যাটেনিং শুরুর আগে কৃমিনাশক ও খুরা রোগের টিকা সম্পন্ন করুন।</p>
                                </div>
                            </div>

                            <!-- কার্ড 3 -->
                            <div class="agro-card" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); background: var(--card-bg, #fff);">
                                <img src="https://i.postimg.cc/0NX1zq0j/Gemini-Generated-Image-zg3zybzg3zybzg3z.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="Cattle Farm">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #4CAF50; font-weight: 700; text-transform: uppercase;">খাদ্য প্রক্রিয়াজাতকরণ</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">সাইলেজ ও ফারমেন্টেশন</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">মোলাসেস ও কাঁচা ঘাসের সঠিক মিশ্রণে ফারমেন্টেশন প্রক্রিয়ায় দীর্ঘমেয়াদী পুষ্টিকর খাবার তৈরি।</p>
                                </div>
                            </div>

                            <!-- কার্ড 4 -->
                            <div class="agro-card" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); background: var(--card-bg, #fff);">
                                <img src="https://i.postimg.cc/fRVtrMqd/Gemini-Generated-Image-qn0195qn0195qn01.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="Cattle Farm">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #4CAF50; font-weight: 700; text-transform: uppercase;">খামার অবকাঠামো</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">পানি সরবরাহ ও ড্রেনেজ</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">প্রতিটি গরুর জন্য আলাদা পানির লাইন, কন্ট্রোল ভালভ এবং খামারের বর্জ্য নিষ্কাশনে উন্নত ড্রেনেজ ব্যবস্থা।</p>
                                </div>
                            </div>

                            <!-- কার্ড 5 -->
                            <div class="agro-card" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); background: var(--card-bg, #fff);">
                                <img src="https://i.postimg.cc/0NYJvcYp/Gemini-Generated-Image-6os9v6os9v6os9v6.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="Cattle Farm">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #4CAF50; font-weight: 700; text-transform: uppercase;">ওজন ও বৃদ্ধি</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">দৈহিক ওজন মনিটরিং</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">ষাঁড় গরুর কাঙ্ক্ষিত ওজন বৃদ্ধির হার নিয়মিত যাচাই করা এবং দৈনন্দিন স্বাস্থ্য রেকর্ড সংরক্ষণ।</p>
                                </div>
                            </div>

                            <!-- কার্ড 6 -->
                            <div class="agro-card" style="padding: 0; overflow: hidden; border-radius: 16px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); background: var(--card-bg, #fff);">
                                <img src="https://i.postimg.cc/XN8LTZCK/Gemini-Generated-Image-t4srobt4srobt4sr.jpg" style="width: 100%; height: 105px; object-fit: cover;" alt="Cattle Farm">
                                <div style="padding: 10px 12px;">
                                    <span style="font-size: 0.68rem; color: #4CAF50; font-weight: 700; text-transform: uppercase;">পরিবেশ ও পরিচ্ছন্নতা</span>
                                    <h5 style="margin: 3px 0 4px 0; font-size: 0.88rem; color: var(--text-main); font-weight: 700; line-height: 1.3;">বায়োসিকিউরিটি ও বর্জ্য ব্যবস্থাপনা</h5>
                                    <p style="margin: 0; font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">খামারের সার্বিক পরিচ্ছন্নতা বজায় রাখা এবং জীবাণুনাশক স্প্রে করার মাধ্যমে রোগবালাই নিয়ন্ত্রণ।</p>
                                </div>
                            </div>

                        </div>

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

            // ================= PAGE: গরুর প্রোফাইল =================
            case 'cattle-profiles':
                let cattleCards = '';
                for(let i = 1; i <= 10; i++) {
                    cattleCards += `
                    <div onclick="window.viewCattle(${i})" class="agro-card fade-in" style="margin-bottom: 12px; padding: 15px; display: flex; align-items: center; gap: 15px; cursor: pointer; border-left: 4px solid #795548;">
                        <div style="width: 45px; height: 45px; background: #79554820; color: #795548; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.2rem;">
                            <i class="fa-solid fa-cow"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">ষাঁড় গরু - ${i}</h3>
                            <p id="list-badge-${i}" style="margin: 2px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">প্রোফাইল দেখতে ক্লিক করুন</p>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                    </div>`;
                }

                content = `
                <div class="fade-in" style="padding-bottom: 80px;">
                    ${subPageHeader('গরুর প্রোফাইল ও ট্যাগিং')}
                    <div style="padding: 15px;">
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; text-align: center;">তালিকা থেকে যেকোনো ষাঁড় সিলেক্ট করে ওজন ও ভ্যাকসিনের তথ্য দিন বা এডিট করুন।</p>
                        ${cattleCards}
                    </div>
                </div>`;
                
                // পেজ ওপেন হওয়ার সাথে সাথে ডাটা চেক করে স্ট্যাটাস দেখাবে
                setTimeout(() => window.loadAllCattleSummary(), 100);
                break;

            case 'cows':
                const cowId = window.currentCattleId || 1;
                content = `
                <div class="fade-in" style="padding-bottom: 80px;">
                    ${subPageHeader(`ষাঁড় গরু - ${cowId}`)}
                    
                    <div class="agro-card" style="margin: 15px; padding: 20px; text-align: center; border-top: 4px solid #795548;">
                        <div style="width: 70px; height: 70px; background: #79554820; color: #795548; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 2.2rem; margin: 0 auto 15px auto;">
                            <i class="fa-solid fa-stethoscope"></i>
                        </div>
                        <h2 style="margin: 0 0 15px 0; font-size: 1.3rem; color: var(--text-main);">স্বাস্থ্য ও ওজন</h2>
                        
                        <div class="form-group" style="margin-bottom: 15px; text-align: left;">
                            <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">বর্তমান ওজন (কেজি)</label>
                            <input type="number" id="cow-weight" placeholder="যেমন: ৩৫০" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; margin-top:5px; font-family:inherit;">
                        </div>

                        <div class="form-group" style="margin-bottom: 15px; text-align: left;">
                            <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">সর্বশেষ কৃমিনাশক দেওয়া হয়েছে</label>
                            <input type="date" id="cow-deworm" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; margin-top:5px; font-family:inherit;">
                        </div>

                        <div class="form-group" style="margin-bottom: 25px; text-align: left;">
                            <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">ভ্যাকসিন (খুরা রোগ/তড়কা)</label>
                            <input type="date" id="cow-vaccine" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; outline:none; margin-top:5px; font-family:inherit;">
                        </div>

                        <button id="save-cow-btn" onclick="window.saveCattleData(${cowId})" style="width: 100%; background: #795548; color: white; border: none; padding: 14px; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(121,85,72,0.3);">
                            তথ্য সেভ করুন
                        </button>
                    </div>
                </div>`;
                
                // পেজ লোড হলেই ফায়ারবেস থেকে আগের ডাটা টেনে আনবে
                setTimeout(() => window.loadCattleData(cowId), 100);
                break;

            // ================= PAGE: মেন্যু (More) =================
            case 'more':
                content = `
                <div class="fade-in">
                    ${subPageHeader('মেন্যু ও সেটিংস')}
                    
                    <div class="agro-card" style="display: flex; align-items: center; gap: 15px; padding: 20px; border-bottom: 3px solid var(--primary-main);">
                        <div style="width: 60px; height: 60px; background: rgba(46, 125, 50, 0.1); color: var(--primary-main); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem;"><i class="fa-solid fa-user-tie"></i></div>
                        <div>
                            <h3 style="margin: 0; color: var(--text-main); font-size: 1.3rem;">আব্দুর রশিদ</h3>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">ভাই ভাই ডেইরি ও ফ্যাটেনিং</p>
                        </div>
                    </div>
                    <button onclick="window.showAdminPinModal()" style="width: 100%; padding: 14px; background: #2c3e50; color: white; border: none; border-radius: 12px; font-size: 1.05rem; font-weight: 600; margin-bottom: 20px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(44, 62, 80, 0.3);">
                        <i class="fa-solid fa-user-shield"></i> অ্যাডমিন প্যানেলে প্রবেশ করুন
                    </button>

                    <h4 style="margin: 20px 0 10px 5px; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">খামার ব্যবস্থাপনা</h4>
                    <div class="agro-card" style="padding: 0; overflow: hidden;">
                        <div onclick="goToPage('reports', 'more')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-file-invoice-dollar" style="color: #FF9800; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">আয়-ব্যয় ড্যাশবোর্ড</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                        </div>
                        <div onclick="goToPage('cows', 'more')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-cow" style="color: #795548; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">গরুর প্রোফাইল ও ট্যাগিং</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                        </div>
                        <div onclick="goToPage('reminder', 'more')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-bell" style="color: #E91E63; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">অ্যালার্ট ও রিমাইন্ডার</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                        </div>
                    </div>

                    <h4 style="margin: 25px 0 10px 5px; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">সাপোর্ট ও সেটিংস</h4>
                    <div class="agro-card" style="padding: 0; overflow: hidden;">
                        <div onclick="window.location.href='tel:16358'" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-headset" style="color: #03A9F4; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <div>
                                    <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main); display: block;">জরুরি হেল্পলাইন</span>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">কৃষি ও পশুসম্পদ কল সেন্টার</span>
                                </div>
                            </div>
                            <i class="fa-solid fa-phone" style="color: var(--success);"></i>
                        </div>
                        <div onclick="window.showLogoutModal()" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-right-from-bracket" style="color: var(--danger); font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--danger);">লগআউট করুন</span>
                            </div>
                        </div>
                    </div>
                </div>`;
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

            case 'market':
                content = `
                <div class="fade-in">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h2 class="card-title" style="font-size: 1.5rem; margin: 0;">বাজার দর আপডেট</h2>
                        <button style="background: rgba(46, 125, 50, 0.1); color: var(--primary-main); border: none; padding: 8px 15px; border-radius: 8px; font-weight: 600; font-size: 0.9rem;">
                            <i class="fa-solid fa-pen-to-square"></i> এডিট
                        </button>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">সকল খাদ্য উপাদানের বর্তমান বাজার মূল্য (প্রতি কেজি) নিচে দেওয়া হলো।</p>
                    
                    <div class="agro-card" style="padding: 5px 20px;">
                        ${[
                            { name: 'ভুট্টা ভাঙা / গুঁড়া', price: 35 },
                            { name: 'রাইস কুড়া / ধানের কুড়া / পলিস', price: 28 },
                            { name: 'গমের ভুষি', price: 45 },
                            { name: 'সয়াবিন মিল / সয়ামিল', price: 75 },
                            { name: 'ডালের খোসা', price: 38 },
                            { name: 'সরিষার খৈল', price: 45 },
                            { name: 'ডিডিজিএস (DDGS)', price: 42 },
                            { name: 'ডিওআরবি (DORB)', price: 25 },
                            { name: 'রেপসিড (Rapeseed)', price: 40 },
                            { name: 'শুঁটকি মাছের গুঁড়ো / ফিশ মিল', price: 110 },
                            { name: 'লাইমস্টোন (চুনাপাথর)', price: 15 },
                            { name: 'লবণ', price: 15 },
                            { name: 'ভেজিটেবল ফ্যাট / ফ্যাট', price: 160 },
                            { name: 'এমসিপি (MCP)', price: 65 },
                            { name: 'খাবার সোডা', price: 80 },
                            { name: 'টক্সিন বাইন্ডার', price: 350 },
                            { name: 'ইস্ট (Yeast)', price: 400 },
                            { name: 'মেথিওনিন (Methionine)', price: 650 },
                            { name: 'লাইসিন (Lysine)', price: 550 },
                            { name: 'ফাইটোজ এনজাইম', price: 450 },
                            { name: 'ভিটামিন-মিনারেল প্রিমিক্স', price: 280 },
                            { name: 'সাধারণ প্রিমিক্স', price: 150 },
                            { name: 'গ্রোথ প্রমোটার / ভিটামিন', price: 550 },
                            { name: 'রুমেন সাপোর্ট (Rumen)', price: 350 },
                            { name: 'সিআর (Chromium)', price: 900 }
                        ].map(item => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                                <div>
                                    <h4 style="font-size:1.05rem; color:var(--text-main); margin-bottom: 2px;">${item.name}</h4>
                                    <p style="font-size:0.8rem; color:var(--text-muted);">প্রতি কেজি</p>
                                </div>
                                <div style="text-align:right;">
                                    <h4 style="font-size:1.15rem; color:var(--primary-dark);">৳ ${item.price}</h4>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
                break;

            case 'more':
                content = `
                <div class="fade-in">
                    ${subPageHeader('মেন্যু ও সেটিংস')}
                    
                    <div class="agro-card" style="display: flex; align-items: center; gap: 15px; padding: 20px; border-bottom: 3px solid var(--primary-main);">
                        <div style="width: 60px; height: 60px; background: rgba(46, 125, 50, 0.1); color: var(--primary-main); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem;">
                            <i class="fa-solid fa-user-tie"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; color: var(--text-main); font-size: 1.3rem;">আব্দুর রশিদ</h3>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">ভাই ভাই ডেইরি ও ফ্যাটেনিং ফার্ম</p>
                        </div>
                    </div>

                    <h4 style="margin: 20px 0 10px 5px; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">খামার ব্যবস্থাপনা</h4>
                    <div class="agro-card" style="padding: 0; overflow: hidden;">
                        
                        <div onclick="goToPage('reports', 'more')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-file-invoice-dollar" style="color: #FF9800; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">আয়-ব্যয় ড্যাশবোর্ড</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                        </div>
                        
                        <div onclick="alert('গরুর প্রোফাইল ফিচারটি শীঘ্রই আসছে!')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-cow" style="color: #795548; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">গরুর প্রোফাইল ও ট্যাগিং</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                        </div>

                        <div onclick="goToPage('reminder', 'more')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-bell" style="color: #E91E63; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">অ্যালার্ট ও রিমাইন্ডার</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                        </div>
                    </div>

                    <h4 style="margin: 25px 0 10px 5px; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">সাপোর্ট ও সেটিংস</h4>
                    <div class="agro-card" style="padding: 0; overflow: hidden;">
                        
                        <div onclick="window.location.href='tel:16358'" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-headset" style="color: #03A9F4; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <div>
                                    <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main); display: block;">জরুরি হেল্পলাইন</span>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">কৃষি ও পশুসম্পদ কল সেন্টার</span>
                                </div>
                            </div>
                            <i class="fa-solid fa-phone" style="color: var(--success);"></i>
                        </div>

                        <div onclick="alert('টেলিগ্রাম সেটআপ ফিচারটি শীঘ্রই আসছে!')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-brands fa-telegram" style="color: #0088cc; font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">টেলিগ্রাম অ্যালার্ট সেটআপ</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: #ccc;"></i>
                        </div>
                        
                        <div onclick="window.showLogoutModal()" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-right-from-bracket" style="color: var(--danger); font-size: 1.2rem; width: 25px; text-align: center;"></i>
                                <span style="font-size: 1.05rem; font-weight: 600; color: var(--danger);">লগআউট করুন</span>
                            </div>
                        </div>
                    </div>
                    
                    <p style="text-align: center; color: #ccc; font-size: 0.85rem; margin-top: 25px;">ভার্সন ২.০.১ | ডিজিটাল এগ্রো</p>
                </div>`;
                break;
        }

        contentArea.innerHTML = content;
    }

    // --- 8. Global Calculator Result Function ---
    window.showCalculationResult = function() {
        window.vibrate(40);
        
        const kgInput = document.getElementById('total-kg').value;
        const targetKg = parseFloat(kgInput) || 0;
        const cat = document.getElementById('food-cat').value;
        
        if(targetKg <= 0) {
            alert('অনুগ্রহ করে সঠিক পরিমাণ দিন!');
            return;
        }

        // লাইভ অথবা ক্যাশড ফর্মুলা ডাটাবেস থেকে লোড করা হচ্ছে (আগের হার্ডকোডেড লিস্ট মুছে ফেলা হয়েছে)
        let formulas = JSON.parse(localStorage.getItem('agroFormulas')) || defaultAgroFormulas;

        // ক্যালকুলেটরের জন্য ডিকশনারি (যেকোনো নামের ভ্যারিয়েশন ম্যাচ করার জন্য)
        const defaultPrices = {
            'ভুট্টা ভাঙা': 30, 'ভুট্রা গুড়া': 35,
            'রাইস কুড়া/পলিস': 28, 'রাইস কুড়া/পলিস': 28, 'ধানের কুড়া': 28, 'রাইস পলিস/ধান পাউডার': 28,
            'গমের ভুষি': 45,
            'সয়াবিন মিল': 75, 'সয়াবিন মিল': 65, 'সয়ামিল/সোয়াবিন মিল': 75,
            'ডালের খোসা': 38,
            'সরিষার খৈল': 45,
            'DDGS': 42,
            'DORB': 25,
            'রেপসিড': 40,
            'শুঁটকি মাছের গুঁড়ো': 110, 'শুঁটকি মাছের গুঁড়ো': 110, 'ফিশ মিল': 85,
            'লাইমস্টোন': 15,
            'লবন': 15, 'লবণ': 15,
            'ভেজিটেবল ফ্যাট': 300, 'ফ্যাট': 300,
            'এমসিপি (MCP)': 65,
            'খাবার সোডা': 80,
            'টক্সিন বাইন্ডার': 350, 'টক্সিন': 350,
            'ইস্ট': 400,
            'মেথিওনিন': 650,
            'লাইসিন': 550,
            'ফাইটোজ এনজাইম': 450,
            'ভিটামিন-মিনারেল প্রিমিক্স': 280,
            'সাধারণ প্রিমিক্স': 150,
            'Growth Promoter': 550, 'গ্রোথ ভিটামিন': 550,
            'রুমেন সাপোর্ট (Rumen)': 350,
            'সিআর (Chromium)': 900
        };

        const savedPrices = JSON.parse(localStorage.getItem('agroFeedPrices')) || {};
        const selectedData = formulas[cat] || formulas['standard'];
        const multiplier = targetKg / 100;
        let totalCost = 0; 

        const renderItem = (item) => {
            const calculatedQty = item.qty * multiplier;
            const currentPrice = savedPrices[item.name] || defaultPrices[item.name] || 0; 
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
                
                <button onclick="window.saveCostToFinance(${totalCost.toFixed(0)}, '${targetKg} কেজির খাদ্য মিশ্রণ তৈরি')" style="width: 100%; margin-top: 15px; background: transparent; border: 1.5px solid var(--primary-main); color: var(--primary-main); padding: 12px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.3s; display: flex; justify-content: center; align-items: center; gap: 8px;">
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
        
        // রোগের ডাটাবেস
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

        // পপ-আপের HTML তৈরি
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

        // বডিতে পপ-আপ যোগ করা
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('disease-modal');
        const modalBox = modal.querySelector('div');

        // এনিমেশন শুরু
        setTimeout(() => {
            modal.style.opacity = '1';
            modalBox.style.transform = 'translateY(0)';
        }, 10);
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

        // এনিমেশন শুরু (স্কেল আপ)
        setTimeout(() => {
            modal.style.opacity = '1';
            modalBox.style.transform = 'scale(1)';
        }, 10);
    };

    // পপআপ ক্লোজ করার ফাংশন
    window.closeLogoutModal = function() {
        const modal = document.getElementById('logout-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    // লগআউট কনফার্ম করার ফাংশন
    window.confirmLogout = function() {
        if (navigator.vibrate) navigator.vibrate(50);
        
        // এখানে ফায়ারবেস (Firebase) লগআউটের কোড বসবে ভবিষ্যতে
        // auth.signOut().then(() => { ... });
        
        window.closeLogoutModal();
        
        // আপাতত অ্যাপটি রিলোড করে স্প্ল্যাশ স্ক্রিনে পাঠিয়ে দেওয়া হচ্ছে
        setTimeout(() => {
            window.location.reload(); 
        }, 300);
    };
    // পপ-আপ ক্লোজ করার ফাংশন
    window.closeDiseaseModal = function() {
        const modal = document.getElementById('disease-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'translateY(100%)';
            setTimeout(() => modal.remove(), 300);
        }
    };
});
// --- 11. Finance Logic (Premium Modals) ---

    // লেনদেন যুক্ত করার পপআপ
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

    // ক্যালকুলেটর থেকে ডিরেক্ট সেভ
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

    // ডিলিট করার প্রিমিয়াম কনফার্মেশন পপআপ
    window.showDeleteConfirmModal = function(id) {
        if (navigator.vibrate) navigator.vibrate(40);
        
        const modalHTML = `
            <div id="delete-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                
                <div style="background: var(--card-bg); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    
                    <div style="width: 65px; height: 65px; background: rgba(217, 48, 37, 0.1); color: var(--danger); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; margin: 0 auto 15px auto;">
                        <i class="fa-solid fa-trash-can"></i>
                    </div>
                    
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

    // --- 12. Cow Profile Logic (Premium Modals) ---

    // নতুন গরু যোগ করার পপআপ
    window.showCowModal = function() {
        if (navigator.vibrate) navigator.vibrate(40);
        
        const modalHTML = `
            <div id="cow-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                
                <div style="background: var(--card-bg); width: 90%; max-width: 380px; border-radius: 24px; padding: 25px 20px; transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: var(--text-main); font-size: 1.3rem; display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-cow" style="color: #795548;"></i> নতুন গরু
                        </h3>
                        <button onclick="window.closeCowModal()" style="background: #f1f3f4; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: var(--text-muted); font-size: 1.1rem; cursor: pointer;">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.95rem; margin-bottom: 8px; display: block; color: var(--text-main); font-weight: 600;">ট্যাগ নম্বর / নাম</label>
                        <input type="text" id="modal-cow-tag" placeholder="যেমন: T-01 বা লালু" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; outline: none; background: #F9F9F9; font-size: 1rem; font-family: inherit;">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px;">
                        <div class="form-group">
                            <label style="font-size: 0.95rem; margin-bottom: 8px; display: block; color: var(--text-main); font-weight: 600;">জাত</label>
                            <input type="text" id="modal-cow-breed" placeholder="যেমন: শাহীওয়াল" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; outline: none; background: #F9F9F9; font-size: 1rem; font-family: inherit;">
                        </div>
                        <div class="form-group">
                            <label style="font-size: 0.95rem; margin-bottom: 8px; display: block; color: var(--text-main); font-weight: 600;">ওজন (কেজি)</label>
                            <input type="number" id="modal-cow-weight" placeholder="যেমন: 250" style="width: 100%; padding: 14px; border-radius: 12px; border: 1.5px solid #E0E0E0; outline: none; background: #F9F9F9; font-size: 1rem; font-weight: 700; font-family: inherit;">
                        </div>
                    </div>
                    
                    <button onclick="window.saveCow()" style="width: 100%; background: #795548; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(121, 85, 72, 0.3); transition: 0.2s;">
                        প্রোফাইল সেভ করুন
                    </button>
                    
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('cow-modal');
        const modalBox = modal.querySelector('div');

        setTimeout(() => {
            modal.style.opacity = '1';
            modalBox.style.transform = 'scale(1)';
        }, 10);
    };

    window.closeCowModal = function() {
        const modal = document.getElementById('cow-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    window.saveCow = function() {
        const tag = document.getElementById('modal-cow-tag').value;
        const breed = document.getElementById('modal-cow-breed').value || 'অজানা';
        const weight = parseFloat(document.getElementById('modal-cow-weight').value) || 0;
        
        if(!tag) return alert('অনুগ্রহ করে ট্যাগ নম্বর বা নাম দিন!');

        const cows = JSON.parse(localStorage.getItem('agroCows')) || [];
        cows.unshift({ id: Date.now(), tag, breed, weight, date: new Date().toLocaleDateString('bn-BD') });
        localStorage.setItem('agroCows', JSON.stringify(cows));
        
        window.vibrate(40);
        window.closeCowModal();
        window.renderCows();
    };

    window.renderCows = function() {
        const listArea = document.getElementById('cows-list');
        if(!listArea) return;

        const cows = JSON.parse(localStorage.getItem('agroCows')) || [];
        let html = '';

        if(cows.length === 0) {
            html = '<div style="text-align:center; padding: 30px 10px;"><i class="fa-solid fa-cow" style="font-size: 3rem; color: #ddd; margin-bottom: 10px;"></i><p style="color:var(--text-muted); font-size:0.95rem;">কোনো গরুর প্রোফাইল পাওয়া যায়নি।</p></div>';
        } else {
            cows.forEach(c => {
                html += `
                    <div class="fade-in" style="display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); padding: 15px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); border: 1px solid #f0f0f0; border-left: 4px solid #795548;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 45px; height: 45px; border-radius: 12px; background: rgba(121, 85, 72, 0.1); color: #795548; display: flex; justify-content: center; align-items: center; font-size: 1.4rem;"><i class="fa-solid fa-cow"></i></div>
                            <div>
                                <h4 style="margin: 0; color: var(--text-main); font-size: 1.15rem; font-weight: 700;">${c.tag}</h4>
                                <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">জাত: ${c.breed} | ওজন: <strong>${c.weight} কেজি</strong></p>
                            </div>
                        </div>
                        <button onclick="window.showDeleteCowModal(${c.id})" style="background: none; border: none; color: #ccc; font-size: 1.1rem; cursor: pointer; padding: 10px; transition: 0.2s;"><i class="fa-solid fa-trash-can"></i></button>
                    </div>`;
            });
        }
        listArea.innerHTML = html;
    };

    // ডিলিট করার প্রিমিয়াম কনফার্মেশন পপআপ
    window.showDeleteCowModal = function(id) {
        if (navigator.vibrate) navigator.vibrate(40);
        
        const modalHTML = `
            <div id="delete-cow-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                
                <div style="background: var(--card-bg); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    
                    <div style="width: 65px; height: 65px; background: rgba(217, 48, 37, 0.1); color: var(--danger); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; margin: 0 auto 15px auto;">
                        <i class="fa-solid fa-trash-can"></i>
                    </div>
                    
                    <h3 style="color: var(--text-main); font-size: 1.3rem; margin-bottom: 10px; font-weight: 700;">প্রোফাইল মুছতে চান?</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 25px; line-height: 1.5;">এই গরুর প্রোফাইলটি আপনার খামারের তালিকা থেকে চিরতরে মুছে যাবে।</p>
                    
                    <div style="display: flex; gap: 12px;">
                        <button onclick="window.closeDeleteCowModal()" style="flex: 1; background: #f1f3f4; color: var(--text-muted); border: none; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.2s;">বাতিল</button>
                        <button onclick="window.deleteCow(${id})" style="flex: 1; background: var(--danger); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(217, 48, 37, 0.3); transition: 0.2s;">মুছুন</button>
                    </div>
                    
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('delete-cow-modal');
        const modalBox = modal.querySelector('div');

        setTimeout(() => {
            modal.style.opacity = '1';
            modalBox.style.transform = 'scale(1)';
        }, 10);
    }

    window.closeDeleteCowModal = function() {
        const modal = document.getElementById('delete-cow-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    }

    window.deleteCow = function(id) {
        window.vibrate(40);
        let cows = JSON.parse(localStorage.getItem('agroCows')) || [];
        localStorage.setItem('agroCows', JSON.stringify(cows.filter(c => c.id !== id)));
        window.closeDeleteCowModal();
        window.renderCows();
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

    // ট্যাব সুইচিং লজিক
    window.switchAdminTab = function(tabName) {
        window.vibrate(30);
        // Reset Tab Styles
        ['market', 'disease', 'formula', 'users'].forEach(tab => {
            const btn = document.getElementById(`tab-${tab}`);
            if(btn) {
                btn.style.background = '#f1f3f4';
                btn.style.color = 'var(--text-muted)';
            }
        });
        
        // Active Tab Style
        const activeBtn = document.getElementById(`tab-${tabName}`);
        if(activeBtn) {
            activeBtn.style.background = '#2c3e50';
            activeBtn.style.color = 'white';
        }

        const contentArea = document.getElementById('admin-tab-content');
        contentArea.innerHTML = '<div style="text-align:center; padding:50px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--primary-main);"></i></div>';

        setTimeout(() => {
            if(tabName === 'market') {
                window.renderAdminMarketTab(contentArea);
            } else if(tabName === 'disease') {
                window.renderAdminDiseaseTab(contentArea);
            } else if(tabName === 'users') {
                window.renderAdminUsersTab(contentArea);
            } else if(tabName === 'formula') {
                window.renderAdminFormulaTab(contentArea);
            }
        }, 200);
    };

    // --- Tab 1: Market Controller ---
    // ডিফল্ট বাজার দরের তালিকা (সার্ভারে ডাটা না থাকলে বা অফলাইন থাকলে এটি কাজ করবে)
    const defaultGlobalPrices = {
        'ভুট্টা ভাঙা': 35, 'রাইস কুড়া/পলিস': 28, 'গমের ভুষি': 45, 'সয়াবিন মিল': 75, 'ডালের খোসা': 38,
        'সরিষার খৈল': 45, 'DDGS': 42, 'DORB': 25, 'রেপসিড (Rapeseed)': 40, 'শুঁটকি মাছের গুঁড়ো': 110,
        'লাইমস্টোন': 15, 'লবণ': 15, 'ভেজিটেবল ফ্যাট': 160, 'এমসিপি (MCP)': 65, 'খাবার সোডা': 80,
        'টক্সিন বাইন্ডার': 350, 'ইস্ট (Yeast)': 400, 'মেথিওনিন (Methionine)': 650, 'লাইসিন (Lysine)': 550,
        'ফাইটোজ এনজাইম': 450, 'ভিটামিন-মিনারেল প্রিমিক্স': 280, 'সাধারণ প্রিমিক্স': 150,
        'Growth Promoter': 550, 'রুমেন সাপোর্ট (Rumen)': 350, 'সিআর (Chromium)': 900
    };

    // --- Tab 1: Live Market Controller (Admin Side) ---
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

        // ফায়ারবেস কানেকশন চেক করা হচ্ছে
        if (window.db && window.fbFirestore) {
            const { collection, onSnapshot } = window.fbFirestore;
            
            // রিয়াল-টাইম ডাটা রিড লুপ
            onSnapshot(collection(window.db, "market_prices"), (snapshot) => {
                let html = '';
                let serverPrices = {};
                
                snapshot.forEach((doc) => {
                    serverPrices[doc.id] = doc.data().price;
                });

                Object.keys(defaultGlobalPrices).forEach(item => {
                    const currentPrice = serverPrices[item] !== undefined ? serverPrices[item] : defaultGlobalPrices[item];
                    html += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                            <div>
                                <h4 style="font-size:1.02rem; color:var(--text-main); margin-bottom: 2px;">${item}</h4>
                                <span style="font-size: 0.8rem; color: var(--primary-main); background: rgba(46,125,52,0.08); padding: 2px 8px; border-radius: 6px; font-weight:600;">৳ ${currentPrice} / কেজি</span>
                            </div>
                            <button onclick="window.showEditPriceModal('${item}', ${currentPrice})" style="background: rgba(52, 152, 219, 0.1); color: #3498db; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                <i class="fa-solid fa-pen"></i> এডিট
                            </button>
                        </div>`;
                });
                listArea.innerHTML = html;
                // লোকাল ক্যালকুলেটরের সিনক্রোনাইজেশনের জন্য ক্যাশ সেভ
                localStorage.setItem('agroFeedPrices', JSON.stringify(serverPrices));
            });
        } else {
            // ফায়ারবেস কনফিগ না থাকলে লোকাল ব্যাকআপ ভিউ
            const savedPrices = JSON.parse(localStorage.getItem('agroFeedPrices')) || {};
            let html = '';
            Object.keys(defaultGlobalPrices).forEach(item => {
                const currentPrice = savedPrices[item] || defaultGlobalPrices[item];
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                        <div><h4 style="font-size:1.02rem; color:var(--text-main);">${item}</h4><span style="font-size: 0.8rem; color: var(--primary-main);">৳ ${currentPrice} (Offline)</span></div>
                        <button onclick="window.showEditPriceModal('${item}', ${currentPrice})" style="background: rgba(52, 152, 219, 0.1); color: #3498db; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer;"><i class="fa-solid fa-pen"></i></button>
                    </div>`;
            });
            listArea.innerHTML = html;
        }
    };

    // ফায়ারবেস ক্লাউডে ডাটা রাইট/আপডেট করা
    window.saveNewPrice = function(itemName) {
        window.vibrate(40);
        const newPrice = Number(document.getElementById('new-price-input').value);
        
        if(newPrice && !isNaN(newPrice) && newPrice > 0) {
            if(window.db && window.fbFirestore) {
                const { doc, setDoc } = window.fbFirestore;
                
                // ফায়ারবেস ফায়ারস্টোরে আপলোড হচ্ছে
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
                // অফলাইন মোড সেভিং
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

    // --- ১৩. গ্লোবাল বাজার দর রেন্ডারিং (ইউজার মোড - Live Sync) ---
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
                snapshot.forEach((doc) => { serverPrices[doc.id] = doc.data().price; });
                
                let html = '';
                Object.keys(defaultGlobalPrices).forEach(displayName => {
                    const calculatedKey = aliasMap[displayName] || displayName;
                    const currentPrice = serverPrices[calculatedKey] !== undefined ? serverPrices[calculatedKey] : defaultGlobalPrices[displayName];
                    html += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
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
            // অফলাইন ব্যাকআপ রেন্ডারিং
            const savedPrices = JSON.parse(localStorage.getItem('agroFeedPrices')) || {};
            let html = '';
            Object.keys(defaultGlobalPrices).forEach(displayName => {
                const calculatedKey = aliasMap[displayName] || displayName;
                const currentPrice = savedPrices[calculatedKey] || defaultGlobalPrices[displayName];
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                        <div><h4 style="font-size:1.05rem; color:var(--text-main);">${displayName}</h4><p style="font-size:0.8rem; color:var(--text-muted);">প্রতি কেজি</p></div>
                        <div style="text-align:right;"><h4 style="font-size:1.15rem; color:var(--primary-dark);">৳ ${currentPrice}</h4></div>
                    </div>`;
            });
            listArea.innerHTML = html;
        }
    };
    // --- Tab 2: Disease Manager ---
    window.renderAdminDiseaseTab = function(container) {
        container.innerHTML = `
            <button onclick="alert('নতুন রোগ যুক্ত করার পপআপ এখানে আসবে (Firebase আপডেট)')" style="width: 100%; padding: 14px; background: rgba(233, 30, 99, 0.1); color: #E91E63; border: 1.5px dashed #E91E63; border-radius: 12px; font-size: 1.05rem; font-weight: 600; margin-bottom: 15px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px;">
                <i class="fa-solid fa-plus"></i> নতুন রোগের গাইডলাইন যুক্ত করুন
            </button>
            <div class="agro-card" style="padding: 5px 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                    <div><h4 style="font-size:1rem; color:var(--text-main); margin-bottom: 2px;">খুরা রোগ (FMD)</h4><span style="font-size: 0.8rem; color: var(--text-muted);">লাইভ আছে</span></div>
                    <button style="background: rgba(52, 152, 219, 0.1); color: #3498db; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 600;"><i class="fa-solid fa-pen"></i></button>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0;">
                    <div><h4 style="font-size:1rem; color:var(--text-main); margin-bottom: 2px;">লাম্পি স্কিন ডিজিজ</h4><span style="font-size: 0.8rem; color: var(--text-muted);">লাইভ আছে</span></div>
                    <button style="background: rgba(52, 152, 219, 0.1); color: #3498db; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 600;"><i class="fa-solid fa-pen"></i></button>
                </div>
            </div>
        `;
    };

    // --- ১৭. খামারি তালিকা (Users Monitor) ফায়ারবেস লাইভ কন্ট্রোলার ---
    
    // অ্যাডমিন প্যানেলে খামারিদের ট্যাবের মূল কাঠামো রেন্ডার করা
    window.renderAdminUsersTab = function(container) {
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div style="background: var(--card-bg); padding: 15px; border-radius: 12px; border: 1px solid #eee; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
                    <h3 id="admin-total-users" style="color: var(--primary-main); margin:0; font-size: 1.5rem; font-weight:700;">০</h3>
                    <p style="margin:0; font-size:0.8rem; color:var(--text-muted); font-weight:600;">মোট খামারি</p>
                </div>
                <div style="background: var(--card-bg); padding: 15px; border-radius: 12px; border: 1px solid #eee; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
                    <h3 id="admin-today-users" style="color: var(--success); margin:0; font-size: 1.5rem; font-weight:700;">০</h3>
                    <p style="margin:0; font-size:0.8rem; color:var(--text-muted); font-weight:600;">আজকের রেজিস্ট্রেশন</p>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 5px;">
                <h3 style="font-size: 1.1rem; color: var(--text-main); margin: 0;"><i class="fa-solid fa-users"></i> নিবন্ধিত খামারিদের তালিকা</h3>
            </div>
            
            <div class="agro-card" style="padding: 0; overflow:hidden; min-height:100px;" id="admin-users-list-area">
                <div style="text-align:center; padding:30px; color:var(--text-muted);">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem; color:var(--primary-main); margin-bottom:8px;"></i>
                    <p style="font-size:0.9rem; margin:0;">খামারি তালিকা লোড হচ্ছে...</p>
                </div>
            </div>
        `;
        window.loadAdminUsersLive();
    };

    // ফায়ারবেস থেকে লাইভ খামারিদের ডাটা নিয়ে আসা (Real-time listener)
    window.loadAdminUsersLive = function() {
        const listArea = document.getElementById('admin-users-list-area');
        const totalCounter = document.getElementById('admin-total-users');
        const todayCounter = document.getElementById('admin-today-users');
        if(!listArea) return;

        if(window.db && window.fbFirestore) {
            const { collection, onSnapshot } = window.fbFirestore;
            
            // ফায়ারস্টোরের 'users' কালেকশন রিয়াল-টাইম লিসেন করা হচ্ছে
            onSnapshot(collection(window.db, "users"), (snapshot) => {
                let html = '';
                let total = 0;
                let todayCount = 0;
                
                // আজকের তারিখ ফরম্যাট (যেমন: ২১/৬/২০২৬)
                const todayStr = new Date().toLocaleDateString('bn-BD');

                snapshot.forEach((doc) => {
                    total++;
                    const u = doc.data();
                    if(u.regDate === todayStr) todayCount++;

                    html += `
                        <div class="fade-in" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee; transition: 0.2s;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width:40px; height:40px; background:rgba(46,125,52,0.08); border-radius:50%; display:flex; justify-content:center; align-items:center; color:var(--primary-main); font-size:1.1rem;">
                                    <i class="fa-solid fa-user"></i>
                                </div>
                                <div>
                                    <span style="font-size: 1rem; font-weight: 700; color:var(--text-main); display:block;">${u.name || 'অজ্ঞাত খামারি'}</span>
                                    <small style="color:var(--text-muted); font-size:0.8rem; display:block; margin-top:2px;">
                                        <i class="fa-solid fa-phone" style="font-size:0.7rem;"></i> ${u.phone || 'মোবাইল নেই'} | <i class="fa-solid fa-location-dot" style="font-size:0.7rem;"></i> জেলা: ${u.district || 'কুড়িগ্রাম'}
                                    </small>
                                </div>
                            </div>
                            <button onclick="window.showBanUserConfirmModal('${doc.id}', '${u.name || 'এই খামারি'}')" style="background: none; border: none; color: #ccc; cursor:pointer; padding:10px; font-size:1.1rem; transition:0.2s;" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='#ccc'">
                                <i class="fa-solid fa-user-slash"></i>
                            </button>
                        </div>`;
                });

                listArea.innerHTML = html || '<div style="text-align:center; padding:30px; color:var(--text-muted);"><i class="fa-solid fa-users-slash" style="font-size:2.5rem; margin-bottom:10px; color:#ddd;"></i><p style="margin:0; font-size:0.95rem;">এখনো কোনো খামারি নিবন্ধন করেননি।</p></div>';
                
                // কাউন্টারগুলো বাংলা সংখ্যায় আপডেট করা
                if(totalCounter) totalCounter.innerText = total.toLocaleString('bn-BD');
                if(todayCounter) todayCounter.innerText = todayCount.toLocaleString('bn-BD');
            });
        } else {
            // ফায়ারবেস অফলাইন বা কানেক্ট না থাকলে ডেমো ব্যাকআপ ডাটা ভিউ
            if(totalCounter) totalCounter.innerText = '৩';
            if(todayCounter) todayCounter.innerText = '১';
            listArea.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width:40px; height:40px; background:#f1f3f4; border-radius:50%; display:flex; justify-content:center; align-items:center; color:#555;"><i class="fa-solid fa-user"></i></div>
                        <div><span style="font-size: 1rem; font-weight: 700; color:var(--text-main); display:block;">করিম শেখ</span><small style="color:var(--text-muted); font-size:0.8rem;">০১৭১১****** | জেলা: কুড়িগ্রাম</small></div>
                    </div>
                    <button style="background: none; border: none; color: #ccc; padding:10px;"><i class="fa-solid fa-user-slash"></i></button>
                </div>`;
        }
    };

    // ইউজার রিমুভ/ব্লক করার প্রিমিয়াম কনফার্মেশন মডাল
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

    // সার্ভার থেকে ইউজার ডাটা ডিলিট করার এক্সিকিউশন
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
    // --- ১৫. রোগ-বালাই (Disease Guidelines) ফায়ারবেস কন্ট্রোলার ---

    // ডিফল্ট রোগের ডাটা (অফলাইনের জন্য)
    const defaultDiseasesList = [
        { id: 'fmd', name: 'খুরা রোগ (FMD)', icon: 'fa-virus', color: '#D93025', symptoms: 'গরুর শরীরের তাপমাত্রা বেড়ে যায় (১০৪-১০৬° ফাঃ)। মুখ, জিহ্বা এবং পায়ের ক্ষুরে ঘা হয়।', treatment: 'পটাশ পানি দিয়ে ঘায়ের স্থান দিনে ২-৩ বার ধুয়ে দিতে হবে। চিকিৎসকের পরামর্শে কম্বিপেন ভেট ইনজেকশন ব্যবহার করুন।' },
        { id: 'lsd', name: 'লাম্পি স্কিন ডিজিজ (LSD)', icon: 'fa-bugs', color: '#F57C00', symptoms: 'গরুর গায়ে গুটি বা চাকা চাকা দাগ দেখা দেয়। তীব্র জ্বর হয়, পা ফুলে যেতে পারে।', treatment: 'জ্বর ও ব্যথা কমানোর জন্য রেনাডেক্স ভেট (Renadex Vet) ট্যাবলেট খাওয়াতে হবে। গুটি ফেটে ঘা হলে পভিসেপ লাগান।' }
    ];

    // [অ্যাডমিন] প্যানেলে রোগের তালিকা লোড করা
    window.renderAdminDiseaseTab = function(container) {
        container.innerHTML = `
            <button onclick="window.showAddDiseaseModal()" style="width: 100%; padding: 14px; background: rgba(233, 30, 99, 0.1); color: #E91E63; border: 1.5px dashed #E91E63; border-radius: 12px; font-size: 1.05rem; font-weight: 600; margin-bottom: 15px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.3s;">
                <i class="fa-solid fa-plus"></i> নতুন রোগের গাইডলাইন যুক্ত করুন
            </button>
            <div id="admin-disease-list" class="agro-card" style="padding: 5px 15px; min-height: 100px;"></div>
        `;
        window.loadAdminDiseases();
    };

    window.loadAdminDiseases = function() {
        const listArea = document.getElementById('admin-disease-list');
        if(!listArea) return;

        const renderList = (diseases) => {
            let html = '';
            diseases.forEach(d => {
                html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
                    <div>
                        <h4 style="font-size:1.02rem; color:var(--text-main); margin-bottom: 2px;">
                            <i class="fa-solid ${d.icon || 'fa-notes-medical'}" style="color:${d.color || '#E91E63'}; margin-right: 5px;"></i> ${d.name}
                        </h4>
                        <span style="font-size: 0.8rem; color: var(--success); background: rgba(46,125,52,0.1); padding: 2px 6px; border-radius: 4px;">লাইভ আছে</span>
                    </div>
                    <button onclick="window.deleteDisease('${d.id}')" style="background: rgba(217, 48, 37, 0.1); color: #D93025; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s;">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>`;
            });
            listArea.innerHTML = html || '<p style="text-align:center; padding:15px; color:var(--text-muted);">কোনো রোগ যুক্ত করা হয়নি।</p>';
        };

        if (window.db && window.fbFirestore) {
            const { collection, onSnapshot } = window.fbFirestore;
            onSnapshot(collection(window.db, "disease_guidelines"), (snapshot) => {
                let diseases = [];
                snapshot.forEach((doc) => { diseases.push({ id: doc.id, ...doc.data() }); });
                if(diseases.length === 0) diseases = defaultDiseasesList;
                localStorage.setItem('agroDiseases', JSON.stringify(diseases));
                renderList(diseases);
            });
        } else {
            let diseases = JSON.parse(localStorage.getItem('agroDiseases'));
            if(!diseases || diseases.length === 0) diseases = defaultDiseasesList;
            renderList(diseases);
        }
    };

    // [অ্যাডমিন] নতুন রোগ যুক্ত করার পপআপ
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

    // [অ্যাডমিন] রোগ ডাটাবেসে সেভ করা
    window.saveNewDisease = function() {
        window.vibrate(40);
        const name = document.getElementById('d-name').value;
        const symptoms = document.getElementById('d-symptoms').value;
        const treatment = document.getElementById('d-treatment').value;
        
        if(!name || !symptoms || !treatment) {
            return alert("অনুগ্রহ করে রোগের নাম, লক্ষণ এবং চিকিৎসার ঘরগুলো পূরণ করুন!");
        }
        
        const docId = 'disease_' + Date.now();
        // রেন্ডম কালার জেনারেট করা হচ্ছে কার্ডের ডিজাইনের জন্য
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
            let diseases = JSON.parse(localStorage.getItem('agroDiseases')) || defaultDiseasesList;
            diseases.unshift({...data, id: docId});
            localStorage.setItem('agroDiseases', JSON.stringify(diseases));
            window.vibrate(60);
            window.closeAddDiseaseModal();
            window.loadAdminDiseases();
        }
    };

    // [অ্যাডমিন] রোগ মুছে ফেলার প্রিমিয়াম পপআপ
    window.deleteDisease = function(id) {
        window.vibrate(40);
        const modalHTML = `
            <div id="delete-disease-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 10000; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: var(--card-bg); width: 85%; max-width: 320px; border-radius: 24px; padding: 25px 20px; text-align: center; transform: scale(0.9); transition: transform 0.3s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    
                    <div style="width: 65px; height: 65px; background: rgba(217, 48, 37, 0.1); color: var(--danger); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; margin: 0 auto 15px auto;">
                        <i class="fa-solid fa-trash-can"></i>
                    </div>
                    
                    <h3 style="color: var(--text-main); font-size: 1.3rem; margin-bottom: 10px; font-weight: 700;">গাইডলাইনটি মুছবেন?</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 25px; line-height: 1.5;">এই রোগের গাইডলাইনটি ডাটাবেস থেকে চিরতরে মুছে যাবে এবং সকল ইউজারের অ্যাপ থেকে সরে যাবে।</p>
                    
                    <div style="display: flex; gap: 12px;">
                        <button onclick="window.closeDeleteDiseaseModal()" style="flex: 1; background: #f1f3f4; color: var(--text-muted); border: none; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.2s;">বাতিল</button>
                        <button onclick="window.executeDiseaseDelete('${id}')" style="flex: 1; background: var(--danger); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(217, 48, 37, 0.3); transition: 0.2s;">মুছুন</button>
                    </div>
                    
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => {
            const modal = document.getElementById('delete-disease-modal');
            if(modal) {
                modal.style.opacity = '1';
                modal.querySelector('div').style.transform = 'scale(1)';
            }
        }, 10);
    };

    window.closeDeleteDiseaseModal = function() {
        const modal = document.getElementById('delete-disease-modal');
        if(modal) {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        }
    };

    // আসল ডিলিট লজিক (Local Storage + Firebase)
    window.executeDiseaseDelete = function(id) {
        window.vibrate(40);
        
        if(window.db && window.fbFirestore && window.fbFirestore.deleteDoc) {
            // ফায়ারবেস কানেক্টেড থাকলে সার্ভার থেকে ডিলিট
            const { doc, deleteDoc } = window.fbFirestore;
            deleteDoc(doc(window.db, "disease_guidelines", id)).then(() => {
                window.vibrate(50);
                window.closeDeleteDiseaseModal();
            }).catch(err => {
                alert("সার্ভার থেকে ডিলিট করতে সমস্যা হয়েছে!");
                window.closeDeleteDiseaseModal();
            });
        } else {
            // ফায়ারবেস কানেক্ট না থাকলে লোকাল স্টোরেজ থেকে ডিলিট
            let diseases = JSON.parse(localStorage.getItem('agroDiseases')) || [];
            diseases = diseases.filter(d => d.id !== id);
            localStorage.setItem('agroDiseases', JSON.stringify(diseases));
            
            window.vibrate(50);
            window.closeDeleteDiseaseModal();
            window.loadAdminDiseases(); 
        }
    };

    // --- [ইউজার ভিউ] রোগ-বালাই লাইভ রেন্ডারিং এবং বিস্তারিত পপআপ ---
    window.renderUserDiseasesPage = function() {
        const listArea = document.getElementById('user-disease-list-view');
        if(!listArea) return;

        const renderCards = (diseases) => {
            window.agroDiseasesCache = {}; // বিস্তারিত পপআপের জন্য মেমোরিতে রাখা হচ্ছে
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

    // [ইউজার] ডাইনামিক রোগের বিস্তারিত পপআপ
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
    // --- ১৬. খাদ্য ফর্মুলা এডিটর (Formula Configurator) ফায়ারবেস ও লাইভ লজিক ---

    // গ্লোবাল ডিফল্ট ফর্মুলা ডিকশনারি (সার্ভার অফলাইন থাকলে এটি কাজ করবে)
    const defaultAgroFormulas = {
        primary: {
            main: [
                { name: 'ভুট্টা ভাঙা', qty: 35 }, { name: 'রাইস কুড়া/পলিস', qty: 15 }, { name: 'DDGS', qty: 10 },
                { name: 'গমের ভুষি', qty: 5 }, { name: 'সয়াবিন মিল', qty: 10 }, { name: 'ডালের খোসা', qty: 10 },
                { name: 'সরিষার খৈল', qty: 10 }
            ],
            supplements: [
                { name: 'শুঁটকি মাছের গুঁড়ো', qty: 2 }, { name: 'লাইমস্টোন', qty: 1 }, { name: 'লবন', qty: 1 }, { name: 'ফ্যাট', qty: 1 }
            ]
        },
        standard: {
            main: [
                { name: 'ভুট্রা গুড়া', qty: 35 }, { name: 'ধানের কুড়া', qty: 7 }, { name: 'রাইস পলিস/ধান পাউডার', qty: 12 },
                { name: 'সয়ামিল/সোয়াবিন মিল', qty: 11 }, { name: 'DDGS', qty: 11 }, { name: 'DORB', qty: 11 },
                { name: 'রেপসিড', qty: 8 }, { name: 'ফিশ মিল', qty: 2 }, { name: 'ফ্যাট', qty: 1 }, { name: 'লাইমস্টোন', qty: 1 }, { name: 'লবন', qty: 1 }
            ],
            supplements: [
                { name: 'টক্সিন', qty: 0.1 }, { name: 'গ্রোথ ভিটামিন', qty: 0.1 }, { name: 'ইস্ট', qty: 0.05 }, { name: 'মেথিওনিন', qty: 0.05 }
            ]
        },
        premium: {
            main: [
                { name: 'ভুট্টা ভাঙা', qty: 40 }, { name: 'রাইস কুড়া/পলিস', qty: 20 }, { name: 'গমের ভুষি', qty: 10 },
                { name: 'সয়াবিন মিল', qty: 10 }, { name: 'ডালের খোসা', qty: 10 }, { name: 'সরিষার খৈল', qty: 10 }
            ],
            supplements: [
                { name: 'শুঁটকি মাছের গুঁড়ো', qty: 3 }, { name: 'এমসিপি (MCP)', qty: 1.5 }, { name: 'লাইমস্টোন', qty: 1.5 },
                { name: 'ভেজিটেবল ফ্যাট', qty: 0.25 }, { name: 'খাবার সোডা', qty: 0.25 }, { name: 'টক্সিন বাইন্ডার', qty: 0.20 },
                { name: 'মেথিওনিন', qty: 0.25 }, { name: 'লাইসিন', qty: 0.25 }, { name: 'ফাইটোজ এনজাইম', qty: 0.25 },
                { name: 'ভিটামিন-মিনারেল প্রিমিক্স', qty: 0.25 }, { name: 'সাধারণ প্রিমিক্স', qty: 0.25 }, { name: 'Growth Promoter', qty: 0.20 },
                { name: 'রুমেন সাপোর্ট (Rumen)', qty: 0.10 }, { name: 'সিআর (Chromium)', qty: 0.05 }
            ]
        }
    };

    // ফর্মুলা ট্যাব রেন্ডার
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

    // নির্দিষ্ট ক্যাটাগরির উপাদানগুলো ডাটাবেস থেকে লোড করা
    window.loadAdminFormulaCategoryData = function() {
        const cat = document.getElementById('admin-formula-cat-selector').value;
        const listArea = document.getElementById('admin-formula-ingredients-list');
        if(!listArea) return;

        // ফায়ারবেস বা লোকাল স্টোরেজ থেকে ডাটা চেক করা
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

    // অনুপাত এডিটের প্রফেশনাল পপআপ মডাল
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

    // ফায়ারবেস ক্লাউডে অনুপাত আপডেট
    window.saveIngredientWeightCloud = function(cat, type, index) {
        window.vibrate(40);
        const newWeight = parseFloat(document.getElementById('new-ingredient-weight-input').value);
        if(isNaN(newWeight) || newWeight < 0) return alert('অনুগ্রহ করে সঠিক পরিমাণ দিন!');

        let formulas = JSON.parse(localStorage.getItem('agroFormulas')) || defaultAgroFormulas;
        formulas[cat][type][index].qty = newWeight;
        localStorage.setItem('agroFormulas', JSON.stringify(formulas));

        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            // ফায়ারবেস ফায়ারস্টোরের 'feed_formulas' কালেকশনে রিয়েল-টাইম পুশ
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
    // --- ১৮. ইউজার রেজিস্ট্রেশন (Onboarding) লজিক ---
    
    window.checkUserRegistration = function() {
        const user = localStorage.getItem('agroUser');
        // ইউজার না থাকলে রেজিস্ট্রেশন পেজ দেখাবে
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

        // ফায়ারবেসে ডাটা পুশ করা
        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            setDoc(doc(window.db, "users", userId), userData).then(() => {
                window.finalizeRegistration(userData);
            }).catch(err => {
                // অফলাইনে থাকলেও ইউজারকে অ্যাপে ঢুকতে দেওয়া হবে
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
        // রেজিস্ট্রেশন শেষে হোম পেজ রিলোড করা
        window.location.reload(); 
    };

    // --- আয় ও ব্যয়ের হিসাব (Income/Expense Tracker) লজিক ---

    // আয় নাকি খরচ, তার ওপর ভিত্তি করে ক্যাটাগরি বদলানো
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
            cattleDiv.style.display = 'none'; // আয়ের ক্ষেত্রে সাধারণত স্পেসিফিক গরুর দরকার নেই
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

    // খাত পরিবর্তন করলে গরুর তালিকা দেখানো/লুকানো
    window.toggleCattleSelect = function() {
        const category = document.getElementById('exp-category').value;
        const type = document.getElementById('exp-type').value;
        const cattleDiv = document.getElementById('cattle-select-div');
        
        // শুধু ওষুধ বা ডাক্তার সিলেক্ট করলে গরুর অপশন আসবে
        if(type === 'খরচ' && (category === 'ওষুধ' || category === 'ডাক্তার ভিজিট')) {
            cattleDiv.style.display = 'block';
            cattleDiv.classList.add('fade-in');
        } else {
            cattleDiv.style.display = 'none';
        }
    };

    // হিসাব সেভ করা
    window.saveExpense = function() {
        if(navigator.vibrate) navigator.vibrate(40);
        
        // ফিক্স: ইউজার না থাকলে ডিফল্ট একটি টেস্ট ইউজার ধরে নিবে
        const currentUser = JSON.parse(localStorage.getItem('agroUser')) || { phone: '01700000000', name: 'টেস্ট খামারি' };

        const type = document.getElementById('exp-type').value;
        const category = document.getElementById('exp-category').value;
        
        let cattle = "প্রযোজ্য নয়";
        if(type === 'খরচ' && (category === 'ওষুধ' || category === 'ডাক্তার ভিজিট')) {
            cattle = document.getElementById('exp-cattle').value;
        }
        
        const details = document.getElementById('exp-details').value.trim();
        const amount = Number(document.getElementById('exp-amount').value.trim());

        if(!details || !amount || amount <= 0) {
            return window.showAppAlert(
                'তথ্য অসম্পূর্ণ!', 
                'অনুগ্রহ করে বিবরণ এবং টাকার পরিমাণ সঠিকভাবে পূরণ করুন। খালি বক্সে তথ্য দিয়ে আবার চেষ্টা করুন।', 
                'fa-triangle-exclamation', 
                '#FF9800'
            );
        }

        const btn = document.getElementById('save-expense-btn');
        const originalText = btn.innerText;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> সেভ হচ্ছে...';

        const now = new Date();
        const monthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;

        const transactionData = {
            userPhone: currentUser.phone,
            type: type, 
            category: category,
            cattle: cattle,
            details: details,
            amount: amount,
            date: now.toLocaleDateString('bn-BD'),
            monthYear: monthYear,
            timestamp: now.toISOString()
        };

        const transId = 'trx_' + Date.now();

        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            setDoc(doc(window.db, "farm_expenses", transId), transactionData).then(() => {
                document.getElementById('exp-details').value = '';
                document.getElementById('exp-amount').value = '';
                btn.innerText = '✓ সফলভাবে সেভ হয়েছে';
                setTimeout(() => btn.innerText = originalText, 2000);
            }).catch(err => {
                alert("সেভ করতে সমস্যা হয়েছে!");
                btn.innerText = originalText;
            });
        }
    };

    // লাইভ আয়-ব্যয় লোড করা
    window.loadExpensesLive = function() {
        // ফিক্স: ইউজার না থাকলে ডিফল্ট টেস্ট ইউজার ধরবে
        const currentUser = JSON.parse(localStorage.getItem('agroUser')) || { phone: '01700000000', name: 'টেস্ট খামারি' };

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

                transactions.forEach((trx) => {
                    // শুধুমাত্র বর্তমান ইউজারের ডাটা দেখাবে
                    if(trx.userPhone === currentUser.phone && trx.monthYear === currentMonthYear) {
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
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:35px; height:35px; background:${iconColor}20; color:${iconColor}; border-radius:50%; display:flex; justify-content:center; align-items:center;">
                                    <i class="fa-solid ${icon}"></i>
                                </div>
                                <div>
                                    <h4 style="margin:0; font-size:0.95rem; color:var(--text-main);">${trx.details}</h4>
                                    <p style="margin:2px 0 0 0; font-size:0.75rem; color:var(--text-muted);">${trx.category} | ${trx.date} ${cattleTag}</p>
                                </div>
                            </div>
                            <div style="font-weight:700; ${amountColor} font-size:1.1rem;">
                                ${sign} ৳ ${trx.amount.toLocaleString('bn-BD')}
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
                                <p style="margin:0;">এই মাসে এখনো কোনো হিসাব যুক্ত করা হয়নি।</p>
                            </div>`;
                }
                
                const listArea = document.getElementById('expense-list-area');
                if(listArea) listArea.innerHTML = html;
            });
        }
    };

    // --- ২০. কাস্টম বিউটিফুল অ্যালার্ট পপ-আপ ---
    window.showAppAlert = function(title, message, icon = 'fa-triangle-exclamation', color = '#FF9800') {
        if(navigator.vibrate) navigator.vibrate(50); // ফোন হালকা ভাইব্রেট হবে
        
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
        
        // আগে কোনো অ্যালার্ট থাকলে মুছে ফেলা
        const existing = document.getElementById('custom-app-alert');
        if(existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // এনিমেশন চালু করা
        setTimeout(() => {
            const alertBox = document.getElementById('custom-app-alert');
            if(alertBox) {
                alertBox.style.opacity = '1';
                alertBox.querySelector('div').style.transform = 'scale(1)';
            }
        }, 10);
    };

    // --- গরুর প্রোফাইল ও এডিটিং লজিক ---

    window.viewCattle = function(id) {
        window.currentCattleId = id;
        loadPage('cattle-details');
    };

    // ডাটা সেভ বা এডিট করার ফাংশন
    window.saveCattleData = function(cowId) {
        if(navigator.vibrate) navigator.vibrate(40);
        
        const weight = document.getElementById('cow-weight').value;
        const deworm = document.getElementById('cow-deworm').value;
        const vaccine = document.getElementById('cow-vaccine').value;

        if(!weight && !deworm && !vaccine) {
            return window.showAppAlert('খালি ফর্ম!', 'সেভ করার জন্য অন্তত একটি তথ্য (ওজন বা তারিখ) দিন।', 'fa-triangle-exclamation', '#FF9800');
        }

        const currentUser = JSON.parse(localStorage.getItem('agroUser')) || { phone: '01700000000' };
        const docId = `cow_${currentUser.phone}_${cowId}`;

        const btn = document.getElementById('save-cow-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> আপডেট হচ্ছে...';

        const cowData = {
            weight: weight || "",
            dewormDate: deworm || "",
            vaccineDate: vaccine || "",
            updatedAt: new Date().toISOString()
        };

        if(window.db && window.fbFirestore) {
            const { doc, setDoc } = window.fbFirestore;
            setDoc(doc(window.db, "cattle_profiles", docId), cowData, { merge: true }).then(() => {
                window.showAppAlert('সফল!', `ষাঁড় গরু-${cowId} এর তথ্য সফলভাবে সেভ/আপডেট হয়েছে।`, 'fa-circle-check', '#4CAF50');
                btn.innerHTML = originalText;
                window.loadCattleData(cowId); // রিফ্রেশ করে দেখাবে
            }).catch(err => {
                window.showAppAlert('ত্রুটি', 'সেভ করতে সমস্যা হয়েছে। ইন্টারনেট কানেকশন চেক করুন।', 'fa-triangle-exclamation', '#F44336');
                btn.innerHTML = originalText;
            });
        }
    };

    // নির্দিষ্ট গরুর আগের সেভ করা ডাটা ফর্মের ইনপুটে ফিরিয়ে আনা (এডিটিংয়ের জন্য)
    window.loadCattleData = function(cowId) {
        const currentUser = JSON.parse(localStorage.getItem('agroUser')) || { phone: '01700000000' };
        const docId = `cow_${currentUser.phone}_${cowId}`;

        if(window.db && window.fbFirestore) {
            const { doc, getDoc } = window.fbFirestore;
            getDoc(doc(window.db, "cattle_profiles", docId)).then(docSnap => {
                if(docSnap.exists()) {
                    const data = docSnap.data();
                    if(data.weight) document.getElementById('cow-weight').value = data.weight;
                    if(data.dewormDate) document.getElementById('cow-deworm').value = data.dewormDate;
                    if(data.vaccineDate) document.getElementById('cow-vaccine').value = data.vaccineDate;
                    
                    const statusText = document.getElementById('cow-status-text');
                    if(statusText) {
                        statusText.innerHTML = `<span style="color: #2E7D32; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> পূর্বে সংরক্ষিত ওজন: ${data.weight || 'নেই'} কেজি</span>`;
                    }
                }
            });
        }
    };

    // ১০টি গরুর লিস্ট পেজে কোনটিতে ডাটা আছে তা ফুটিয়ে তোলা
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
                        
                        const badge = document.getElementById(`list-badge-${cId}`);
                        if(badge && data.weight) {
                            badge.innerHTML = `<span style="color: #2E7D32; font-weight: 600;">ওজন: ${data.weight} কেজি (তথ্য সংরক্ষিত)</span>`;
                        }
                    }
                });
            });
        }
    };