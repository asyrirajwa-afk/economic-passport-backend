const API_BASE_URL = "https://economic-passport-backend-production.up.railway.app";


const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const content =
    document.getElementById("content");

const errorMessage =
    document.getElementById("errorMessage");


const backButton =
    document.getElementById("backButton");

const errorBackButton =
    document.getElementById("errorBackButton");

const retryButton =
    document.getElementById("retryButton");

const logoutButton =
    document.getElementById("logoutButton");


const trendButton =
    document.getElementById("trendButton");

const projectionButton =
    document.getElementById("projectionButton");


/* =====================================================
   BUSINESS ID
===================================================== */

function getBusinessId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const urlBusinessId =
        params.get("business_id");


    if (urlBusinessId) {
        return urlBusinessId;
    }


    return (
        localStorage.getItem(
            "selected_business_id"
        ) ||
        localStorage.getItem(
            "last_business_id"
        )
    );
}


/* =====================================================
   TOKEN
===================================================== */

function getToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("access_token")
    );
}


/* =====================================================
   API FETCH
===================================================== */

async function apiFetch(endpoint) {

    const token =
        getToken();


    if (!token) {

        throw new Error(
            "Sesi login tidak ditemukan."
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json"
                }
            }
        );


    if (response.status === 401) {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "access_token"
        );


        throw new Error(
            "Sesi login sudah berakhir. Silakan login kembali."
        );
    }


    if (!response.ok) {

        let message =
            `Gagal mengambil data. (${response.status})`;


        try {

            const errorData =
                await response.json();


            if (errorData.detail) {

                message =
                    errorData.detail;
            }

        } catch (error) {

            // Response bukan JSON.
        }


        throw new Error(message);
    }


    return await response.json();
}


/* =====================================================
   FORMAT SCORE
===================================================== */

function formatScore(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "0.00";
    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {
        return "0.00";
    }


    return number.toFixed(2);
}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
        return "-";
    }


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =====================================================
   SHOW STATE
===================================================== */

function showLoading() {

    loadingState.classList.remove(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    content.classList.add(
        "hidden"
    );
}


function showError(message) {

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );

    content.classList.add(
        "hidden"
    );


    errorMessage.textContent =
        message ||
        "Terjadi kesalahan.";
}


function showContent() {

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    content.classList.remove(
        "hidden"
    );
}


/* =====================================================
   RENDER BUSINESS
===================================================== */

function renderBusiness(data) {

    const business =
        data.business || {};


    document.getElementById(
        "businessName"
    ).textContent =
        business.business_name ||
        "Economic Passport";
}


/* =====================================================
   RENDER PASSPORT
===================================================== */

function renderPassport(data) {

    const passport =
        data.passport || {};


    document.getElementById(
        "overallScore"
    ).textContent =
        formatScore(
            passport.overall_score
        );


    document.getElementById(
        "overallStatus"
    ).textContent =
        passport.status ||
        "-";


    document.getElementById(
        "passportStatus"
    ).textContent =
        passport.status ||
        "-";


    document.getElementById(
        "passportDate"
    ).textContent =
        formatDate(
            passport.created_at
        );
}


/* =====================================================
   RENDER SUMMARY
===================================================== */

function renderSummary(data) {

    const summary =
        data.summary || {};


    const strengthCount =
        Number(
            summary.strength_count || 0
        );


    const riskCount =
        Number(
            summary.risk_count || 0
        );


    document.getElementById(
        "strengthCount"
    ).textContent =
        strengthCount;


    document.getElementById(
        "riskCount"
    ).textContent =
        riskCount;


    document.getElementById(
        "strengthBadge"
    ).textContent =
        `${strengthCount} Area`;


    document.getElementById(
        "riskBadge"
    ).textContent =
        `${riskCount} Area`;


    document.getElementById(
        "strongestMessage"
    ).textContent =
        summary.strongest_message ||
        "Belum tersedia.";


    document.getElementById(
        "weakestMessage"
    ).textContent =
        summary.weakest_message ||
        "Belum tersedia.";
}


/* =====================================================
   CREATE INSIGHT ITEM
===================================================== */

function createInsightItem(
    item,
    type
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "insight-item";


    const category =
        item.category ||
        "General";


    const score =
        formatScore(
            item.score
        );


    const level =
        item.level ||
        "-";


    const message =
        item.message ||
        "-";


    element.innerHTML = `

        <div class="insight-main">

            <div class="insight-category">

                <h4>
                    ${category}
                </h4>

                <span class="level-badge">
                    ${level}
                </span>

            </div>

            <p class="insight-message">
                ${message}
            </p>

        </div>


        <div class="insight-score">

            <b>
                ${score}
            </b>

            <span>
                Score / 100
            </span>

        </div>

    `;


    return element;
}


/* =====================================================
   RENDER STRENGTHS
===================================================== */

function renderStrengths(data) {

    const list =
        document.getElementById(
            "strengthList"
        );


    list.innerHTML = "";


    const strengths =
        Array.isArray(data.strengths)
            ? data.strengths
            : [];


    if (!strengths.length) {

        list.innerHTML = `

            <div class="empty-insight">

                <h4>
                    Belum ada area kuat
                </h4>

                <p>
                    Belum terdapat area yang dikategorikan sebagai kekuatan bisnis.
                </p>

            </div>

        `;

        return;
    }


    strengths.forEach(
        (item) => {

            list.appendChild(
                createInsightItem(
                    item,
                    "strength"
                )
            );
        }
    );
}


/* =====================================================
   RENDER RISKS
===================================================== */

function renderRisks(data) {

    const list =
        document.getElementById(
            "riskList"
        );


    list.innerHTML = "";


    const risks =
        Array.isArray(data.risks)
            ? data.risks
            : [];


    if (!risks.length) {

        list.innerHTML = `

            <div class="empty-insight">

                <h4>
                    Tidak terdapat risiko signifikan
                </h4>

                <p>
                    Berdasarkan assessment saat ini, tidak terdapat risiko yang teridentifikasi.
                </p>

            </div>

        `;

        return;
    }


    risks.forEach(
        (item) => {

            list.appendChild(
                createInsightItem(
                    item,
                    "risk"
                )
            );
        }
    );
}


/* =====================================================
   RENDER NEXT STEP
===================================================== */

function renderNextStep(data) {

    const risks =
        Array.isArray(data.risks)
            ? data.risks
            : [];


    const strengths =
        Array.isArray(data.strengths)
            ? data.strengths
            : [];


    const element =
        document.getElementById(
            "nextStepMessage"
        );


    if (risks.length > 0) {

        const firstRisk =
            risks[0];


        element.textContent =
            `Prioritaskan evaluasi pada area ${firstRisk.category}. ${firstRisk.message}`;

        return;
    }


    if (strengths.length > 0) {

        element.textContent =
            "Pertahankan area yang sudah kuat dan lakukan evaluasi berkala untuk memastikan performa bisnis tetap terjaga.";

        return;
    }


    element.textContent =
        "Lakukan evaluasi bisnis secara berkala berdasarkan hasil Economic Passport.";
}


/* =====================================================
   LOAD INSIGHTS
===================================================== */

async function loadInsights() {

    showLoading();


    const businessId =
        getBusinessId();


    if (!businessId) {

        showError(
            "Business ID tidak ditemukan."
        );

        return;
    }


    try {

        localStorage.setItem(
            "selected_business_id",
            businessId
        );


        localStorage.setItem(
            "last_business_id",
            businessId
        );


        const data =
            await apiFetch(
                `/passport/${businessId}/insights`
            );


        console.log(
            "INSIGHTS RESPONSE:",
            data
        );


        renderBusiness(data);

        renderPassport(data);

        renderSummary(data);

        renderStrengths(data);

        renderRisks(data);

        renderNextStep(data);


        showContent();

    }

    catch (error) {

        console.error(
            "Insights error:",
            error
        );


        showError(
            error.message ||
            "Gagal memuat business insights."
        );
    }
}


/* =====================================================
   NAVIGATION
===================================================== */

function goToTrend() {

    const businessId =
        getBusinessId();


    if (!businessId) {
        return;
    }


    window.location.href =
        `trend.html?business_id=${encodeURIComponent(
            businessId
        )}`;
}


function goToProjection() {

    const businessId =
        getBusinessId();


    if (!businessId) {
        return;
    }


    window.location.href =
        `projection.html?business_id=${encodeURIComponent(
            businessId
        )}`;
}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "selected_business_id"
    );

    localStorage.removeItem(
        "last_business_id"
    );


    window.location.href =
        "index.html";
}


/* =====================================================
   EVENTS
===================================================== */

backButton.addEventListener(
    "click",
    goToTrend
);


errorBackButton.addEventListener(
    "click",
    goToTrend
);


retryButton.addEventListener(
    "click",
    loadInsights
);


trendButton.addEventListener(
    "click",
    goToTrend
);


projectionButton.addEventListener(
    "click",
    goToProjection
);


logoutButton.addEventListener(
    "click",
    logout
);


/* =====================================================
   INITIAL LOAD
===================================================== */

loadInsights();