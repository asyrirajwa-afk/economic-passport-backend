const API_BASE_URL = "http://127.0.0.1:8000";


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

const insightsButton =
    document.getElementById("insightsButton");

const improvementButton =
    document.getElementById("improvementButton");

function goToImprovementPriorities() {

    const businessId =
        getBusinessId();

    if (!businessId) {
        return;
    }

    localStorage.setItem(
        "selected_business_id",
        businessId
    );

    localStorage.setItem(
        "last_business_id",
        businessId
    );

    window.location.href =
        `improvement-priorities.html?business_id=${encodeURIComponent(
            businessId
        )}`;
}

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
   FORMAT CHANGE
===================================================== */

function formatChange(value) {

    const number =
        Number(value || 0);


    if (number > 0) {
        return `+${number.toFixed(2)}`;
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
   STATE
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
   RENDER CURRENT
===================================================== */

function renderCurrent(data) {

    const current =
        data.current || {};


    const score =
        Number(
            current.score || 0
        );


    document.getElementById(
        "currentScore"
    ).textContent =
        formatScore(score);


    document.getElementById(
        "assessmentDate"
    ).textContent =
        formatDate(
            current.assessment_date
        );


    document.getElementById(
        "currentBarScore"
    ).textContent =
        formatScore(score);


    document.getElementById(
        "currentBar"
    ).style.width =
        `${Math.max(
            0,
            Math.min(100, score)
        )}%`;
}


/* =====================================================
   RENDER PROJECTION
===================================================== */

function renderProjection(data) {

    const projection =
        data.projection || {};


    const current =
        data.current || {};


    const projectedScore =
        Number(
            projection.projected_score ??
            data.projected_score ??
            current.score ??
            0
        );


    const projectedLevel =
        projection.projected_level ||
        "-";


    const averageChange =
        Number(
            projection.average_change_per_assessment || 0
        );


    const trend =
        projection.trend ||
        "-";


    const targetScore =
        Number(
            projection.target_score || 80
        );


    const gap =
        Number(
            projection.gap_to_target || 0
        );


    document.getElementById(
        "projectedScore"
    ).textContent =
        formatScore(projectedScore);


    document.getElementById(
        "ringScore"
    ).textContent =
        Math.round(projectedScore);


    document.getElementById(
        "projectedLevel"
    ).textContent =
        projectedLevel;


    document.getElementById(
        "averageChange"
    ).textContent =
        formatChange(
            averageChange
        );


    document.getElementById(
        "trend"
    ).textContent =
        trend;


    document.getElementById(
        "targetScore"
    ).textContent =
        formatScore(
            targetScore
        );


    document.getElementById(
        "gapToTarget"
    ).textContent =
        gap > 0
            ? `${formatScore(gap)} poin lagi`
            : "Target tercapai";


    document.getElementById(
        "projectedBarScore"
    ).textContent =
        formatScore(projectedScore);


    document.getElementById(
        "projectedBar"
    ).style.width =
        `${Math.max(
            0,
            Math.min(100, projectedScore)
        )}%`;


    document.getElementById(
        "targetProgress"
    ).style.width =
        `${Math.max(
            0,
            Math.min(
                100,
                (projectedScore / targetScore) * 100
            )
        )}%`;


    document.getElementById(
        "trendDescription"
    ).textContent =
        getTrendDescription(
            trend,
            averageChange
        );


    document.getElementById(
        "projectionDescription"
    ).textContent =
        getProjectionDescription(
            projectedScore,
            projectedLevel,
            trend
        );


    updateRing(
        projectedScore
    );
}


/* =====================================================
   RENDER METHOD
===================================================== */

function renderMethod(data) {

    const method =
        data.method || {};


    const count =
        Number(
            method.assessment_count || 0
        );


    const projection =
        data.projection || {};


    const averageChange =
        Number(
            projection.average_change_per_assessment || 0
        );


    document.getElementById(
        "assessmentCount"
    ).textContent =
        count;


    document.getElementById(
        "methodAssessmentCount"
    ).textContent =
        count;


    document.getElementById(
        "methodAverageChange"
    ).textContent =
        formatChange(
            averageChange
        );


    document.getElementById(
        "methodDescription"
    ).textContent =
        method.description ||
        "Proyeksi dihitung berdasarkan riwayat assessment.";
}


/* =====================================================
   LIMITED PROJECTION
===================================================== */

function renderAvailability(data) {

    const notice =
        document.getElementById(
            "limitedProjection"
        );


    const message =
        document.getElementById(
            "limitedProjectionMessage"
        );


    if (data.projection_available === false) {

        notice.classList.remove(
            "hidden"
        );


        message.textContent =
            data.message ||
            "Minimal dua assessment diperlukan untuk menghitung proyeksi.";


        const currentScore =
            Number(
                data.current_score || 0
            );


        document.getElementById(
            "currentScore"
        ).textContent =
            formatScore(
                currentScore
            );


        document.getElementById(
            "projectedScore"
        ).textContent =
            formatScore(
                data.projected_score ??
                currentScore
            );


        document.getElementById(
            "ringScore"
        ).textContent =
            Math.round(
                data.projected_score ??
                currentScore
            );


        document.getElementById(
            "projectedLevel"
        ).textContent =
            "Belum tersedia";


        document.getElementById(
            "averageChange"
        ).textContent =
            "-";


        document.getElementById(
            "trend"
        ).textContent =
            "-";


        document.getElementById(
            "assessmentCount"
        ).textContent =
            "1";


        document.getElementById(
            "methodAssessmentCount"
        ).textContent =
            "1";


        document.getElementById(
            "methodAverageChange"
        ).textContent =
            "-";


        document.getElementById(
            "methodDescription"
        ).textContent =
            "Minimal dua assessment diperlukan untuk menghitung proyeksi.";


        document.getElementById(
            "projectionDescription"
        ).textContent =
            "Belum cukup data historis untuk menghitung arah perubahan score.";

        return;
    }


    notice.classList.add(
        "hidden"
    );
}


/* =====================================================
   TREND DESCRIPTION
===================================================== */

function getTrendDescription(
    trend,
    change
) {

    if (trend === "Improving") {

        return `Score diproyeksikan meningkat sekitar ${formatScore(Math.abs(change))} poin per assessment.`;
    }


    if (trend === "Declining") {

        return `Score diproyeksikan menurun sekitar ${formatScore(Math.abs(change))} poin per assessment.`;
    }


    if (trend === "Stable") {

        return "Score diproyeksikan relatif stabil.";
    }


    return "Belum tersedia.";
}


/* =====================================================
   PROJECTION DESCRIPTION
===================================================== */

function getProjectionDescription(
    score,
    level,
    trend
) {

    if (trend === "Improving") {

        return `Dengan pola perubahan saat ini, business score diproyeksikan mencapai ${formatScore(score)} dengan level ${level}.`;
    }


    if (trend === "Declining") {

        return `Dengan pola perubahan saat ini, business score diproyeksikan berada di ${formatScore(score)} dengan level ${level}. Perhatikan area yang mengalami penurunan.`;
    }


    if (trend === "Stable") {

        return `Business score diproyeksikan relatif stabil di sekitar ${formatScore(score)} dengan level ${level}.`;
    }


    return "Belum tersedia.";
}


/* =====================================================
   RING
===================================================== */

function updateRing(score) {

    const safeScore =
        Math.max(
            0,
            Math.min(
                100,
                Number(score || 0)
            )
        );


    const degree =
        safeScore * 3.6;


    const ring =
        document.querySelector(
            ".score-ring"
        );


    if (!ring) {
        return;
    }


    ring.style.background =
        `conic-gradient(
            #111827 0deg,
            #111827 ${degree}deg,
            #e5e7eb ${degree}deg,
            #e5e7eb 360deg
        )`;
}


/* =====================================================
   LOAD
===================================================== */

async function loadProjection() {

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
                `/passport/${businessId}/projection`
            );


        console.log(
            "PROJECTION RESPONSE:",
            data
        );


        renderBusiness(data);

        renderAvailability(data);

        renderCurrent(data);


        if (
            data.projection_available !== false
        ) {

            renderProjection(data);

            renderMethod(data);

        } else {

            document.getElementById(
                "targetProgress"
            ).style.width =
                "0%";


            document.getElementById(
                "currentBar"
            ).style.width =
                `${Math.max(
                    0,
                    Math.min(
                        100,
                        Number(
                            data.current_score || 0
                        )
                    )
                )}%`;


            document.getElementById(
                "projectedBar"
            ).style.width =
                `${Math.max(
                    0,
                    Math.min(
                        100,
                        Number(
                            data.projected_score ??
                            data.current_score ??
                            0
                        )
                    )
                )}%`;
        }


        showContent();

    }

    catch (error) {

        console.error(
            "Projection error:",
            error
        );


        showError(
            error.message ||
            "Gagal memuat score projection."
        );
    }
}


/* =====================================================
   NAVIGATION
===================================================== */

function goToInsights() {

    const businessId =
        getBusinessId();


    if (!businessId) {
        return;
    }


    window.location.href =
        `insights.html?business_id=${encodeURIComponent(
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
    goToInsights
);


errorBackButton.addEventListener(
    "click",
    goToInsights
);


retryButton.addEventListener(
    "click",
    loadProjection
);


insightsButton.addEventListener(
    "click",
    goToInsights
);



logoutButton.addEventListener(
    "click",
    logout
);

improvementButton.addEventListener(
    "click",
    goToImprovementPriorities
);

/* =====================================================
   INITIAL LOAD
===================================================== */

loadProjection();