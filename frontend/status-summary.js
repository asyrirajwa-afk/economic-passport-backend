/* =====================================================
   STATUS SUMMARY
   ECONOMIC PASSPORT
   SESUAI BACKEND /passport/{business_id}/status-summary
===================================================== */


/* =====================================================
   CONFIG
===================================================== */

const API_URL = "http://127.0.0.1:8000";


/* =====================================================
   GET TOKEN
===================================================== */

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "index.html";
}


/* =====================================================
   GET BUSINESS ID
===================================================== */

const params = new URLSearchParams(
    window.location.search
);

const businessId =
    params.get("business_id") ||
    localStorage.getItem("selected_business_id") ||
    localStorage.getItem("last_business_id");


console.log(
    "STATUS SUMMARY BUSINESS ID:",
    businessId
);


if (!businessId) {

    console.error(
        "Business ID tidak ditemukan."
    );

}


/* =====================================================
   DOM ELEMENT
===================================================== */

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const summaryContent =
    document.getElementById("summaryContent");

const retryButton =
    document.getElementById("retryButton");


/* =====================================================
   LOADING
===================================================== */

function showLoading() {

    if (loadingState) {
        loadingState.style.display = "flex";
    }

    if (errorState) {
        errorState.style.display = "none";
    }

    if (summaryContent) {
        summaryContent.style.display = "none";
    }

}


/* =====================================================
   SHOW CONTENT
===================================================== */

function showContent() {

    if (loadingState) {
        loadingState.style.display = "none";
    }

    if (errorState) {
        errorState.style.display = "none";
    }

    if (summaryContent) {
        summaryContent.style.display = "block";
    }

}


/* =====================================================
   SHOW ERROR
===================================================== */

function showError(message) {

    if (loadingState) {
        loadingState.style.display = "none";
    }

    if (summaryContent) {
        summaryContent.style.display = "none";
    }

    if (errorState) {
        errorState.style.display = "flex";
    }

    if (errorMessage) {
        errorMessage.textContent =
            message ||
            "Data status summary tidak dapat dimuat.";
    }

}


/* =====================================================
   API FETCH
===================================================== */

async function apiFetch(endpoint) {

    let response;

    try {

        response = await fetch(
            `${API_URL}${endpoint}`,
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

    }

    catch (error) {

        console.error(
            "NETWORK ERROR:",
            error
        );

        throw new Error(
            "Tidak dapat terhubung ke server. Pastikan FastAPI sedang berjalan."
        );

    }


    let data = null;


    try {

        data = await response.json();

    }

    catch (error) {

        console.error(
            "JSON ERROR:",
            error
        );

    }


    console.log(
        "STATUS SUMMARY API STATUS:",
        response.status
    );

    console.log(
        "STATUS SUMMARY RESPONSE:",
        data
    );


    /* =================================================
       TOKEN EXPIRED
    ================================================= */

    if (response.status === 401) {

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        window.location.href =
            "index.html";

        throw new Error(
            "Sesi login telah berakhir."
        );

    }


    /* =================================================
       API ERROR
    ================================================= */

    if (!response.ok) {

        let message =
            data?.detail ||
            data?.message ||
            `Request gagal (${response.status})`;


        if (Array.isArray(message)) {

            message =
                message
                    .map(
                        item =>
                            item.msg ||
                            item.message ||
                            String(item)
                    )
                    .join(", ");

        }


        throw new Error(message);

    }


    return data;

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

        return "-";

    }


    const number = Number(value);


    if (Number.isNaN(number)) {

        return "-";

    }


    return number.toFixed(1);

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(value) {

    if (!value) {

        return "-";

    }


    const date = new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


/* =====================================================
   RENDER BUSINESS
===================================================== */

function renderBusiness(data) {

    const business =
        data?.business;


    if (!business) {
        return;
    }


    const businessName =
        document.getElementById(
            "businessName"
        );


    if (businessName) {

        businessName.textContent =
            business.business_name ||
            "-";

    }

}


/* =====================================================
   RENDER PASSPORT
===================================================== */

function renderPassport(data) {

    const passport =
        data?.passport;


    if (!passport) {
        return;
    }


    /* ---------------------------------------------
       PASSPORT ID
    --------------------------------------------- */

    const passportId =
        document.getElementById(
            "passportId"
        );


    if (passportId) {

        passportId.textContent =
            passport.id ??
            "-";

    }


    /* ---------------------------------------------
       OVERALL SCORE
    --------------------------------------------- */

    const overallScore =
        document.getElementById(
            "overallScore"
        );


    if (overallScore) {

        overallScore.textContent =
            formatScore(
                passport.overall_score
            );

    }


    /* ---------------------------------------------
       LEVEL
    --------------------------------------------- */

    const passportLevel =
        document.getElementById(
            "passportLevel"
        );


    if (passportLevel) {

        passportLevel.textContent =
            passport.level ||
            "-";

    }


    /* ---------------------------------------------
       STATUS DESCRIPTION
    --------------------------------------------- */

    const statusDescription =
        document.getElementById(
            "statusDescription"
        );


    if (statusDescription) {

        if (
            passport.overall_status
        ) {

            statusDescription.textContent =
                `Status bisnis: ${passport.overall_status}.`;

        }

        else if (
            passport.status
        ) {

            statusDescription.textContent =
                `Status passport: ${passport.status}.`;

        }

        else {

            statusDescription.textContent =
                "Status bisnis berhasil diperiksa.";

        }

    }


    /* ---------------------------------------------
       ASSESSMENT DATE
       Backend sekarang tidak mengirim created_at
    --------------------------------------------- */

    const createdAt =
        document.getElementById(
            "createdAt"
        );


    if (createdAt) {

        createdAt.textContent =
            passport.created_at
                ? formatDate(
                    passport.created_at
                )
                : "-";

    }

}


/* =====================================================
   RENDER VERIFICATION
===================================================== */

function renderVerification(data) {

    const verification =
        data?.verification;


    if (!verification) {
        return;
    }


    const verificationStatus =
        document.getElementById(
            "verificationStatus"
        );


    if (verificationStatus) {

        verificationStatus.textContent =
            verification.status ||
            "-";

    }


    const verificationAge =
        document.getElementById(
            "verificationAge"
        );


    if (verificationAge) {

        if (
            verification.age_days !==
            undefined
        ) {

            verificationAge.textContent =
                `${verification.age_days} hari`;

        }

        else {

            verificationAge.textContent =
                "-";

        }

    }


    const remainingDays =
        document.getElementById(
            "remainingDays"
        );


    if (remainingDays) {

        if (
            verification.remaining_days !==
            undefined
        ) {

            remainingDays.textContent =
                `${verification.remaining_days} hari`;

        }

        else {

            remainingDays.textContent =
                "-";

        }

    }

}


/* =====================================================
   RENDER TREND
===================================================== */

function renderTrend(data) {

    const trend =
        data?.trend;


    if (!trend) {
        return;
    }


    /* ---------------------------------------------
       CURRENT SCORE
    --------------------------------------------- */

    const currentScore =
        document.getElementById(
            "currentScore"
        );


    if (currentScore) {

        currentScore.textContent =
            formatScore(
                trend.current_score
            );

    }


    /* ---------------------------------------------
       PREVIOUS SCORE
    --------------------------------------------- */

    const previousScore =
        document.getElementById(
            "previousScore"
        );


    if (previousScore) {

        previousScore.textContent =
            formatScore(
                trend.previous_score
            );

    }


    /* ---------------------------------------------
       CHANGE
    --------------------------------------------- */

    const scoreChange =
        document.getElementById(
            "scoreChange"
        );


    if (scoreChange) {

        const change =
            Number(
                trend.change
            );


        if (
            !Number.isNaN(change)
        ) {

            const symbol =
                change > 0
                    ? "↑"
                    : change < 0
                        ? "↓"
                        : "→";


            scoreChange.textContent =
                `${symbol} ${Math.abs(change).toFixed(1)}`;

        }

        else {

            scoreChange.textContent =
                "-";

        }

    }


    /* ---------------------------------------------
       DIRECTION
    --------------------------------------------- */

    const trendDirection =
        document.getElementById(
            "trendDirection"
        );


    if (trendDirection) {

        trendDirection.textContent =
            trend.direction ||
            "-";

    }

}


/* =====================================================
   RENDER PERFORMANCE
===================================================== */

function renderPerformance(data) {

    const performance =
        data?.performance;


    if (!performance) {
        return;
    }


    /* ---------------------------------------------
       WEAKEST CATEGORY
    --------------------------------------------- */

    const weakestCategory =
        document.getElementById(
            "weakestCategory"
        );


    if (weakestCategory) {

        weakestCategory.textContent =
            performance.weakest_category ||
            "-";

    }


    /* ---------------------------------------------
       WEAKEST SCORE
    --------------------------------------------- */

    const weakestScore =
        document.getElementById(
            "weakestScore"
        );


    if (weakestScore) {

        weakestScore.textContent =
            formatScore(
                performance.weakest_score
            );

    }


    /* ---------------------------------------------
       ACTION REQUIRED
    --------------------------------------------- */

    const actionRequired =
        document.getElementById(
            "actionRequired"
        );


    if (actionRequired) {

        actionRequired.textContent =
            performance.action_required ??
            "0";

    }

}


/* =====================================================
   HIDE UNSUPPORTED SECTIONS
===================================================== */

function hideUnsupportedElements() {

    /*
     * Backend status-summary SAAT INI tidak mengirim:
     *
     * summary
     * strongest
     * categories
     *
     * Jadi jangan dibuat-buat.
     */


    const unsupportedIds = [

        "averageScore",
        "targetAchieved",
        "belowTarget",

        "strongestCategory",
        "strongestScore",
        "strongestRating",

        "categoryList"

    ];


    unsupportedIds.forEach(
        function(id) {

            const element =
                document.getElementById(id);


            if (!element) {
                return;
            }


            /*
             * Cari card/section terdekat
             * agar tampilan tidak menyisakan
             * kotak kosong.
             */

            const card =
                element.closest(
                    ".summary-card, " +
                    ".comparison-card, " +
                    ".category-section"
                );


            if (card) {

                card.style.display =
                    "none";

            }

            else {

                element.textContent =
                    "Belum tersedia";

            }

        }
    );

}


/* =====================================================
   LOAD STATUS SUMMARY
===================================================== */

async function loadStatusSummary() {

    if (!businessId) {

        showError(
            "Business ID tidak ditemukan."
        );

        return;

    }


    showLoading();


    try {

        const id =
            encodeURIComponent(
                businessId
            );


        /*
         * =================================================
         * BACKEND ROUTE YANG BENAR
         * =================================================
         *
         * GET
         * /passport/{business_id}/status-summary
         *
         */

        const data =
            await apiFetch(
                `/passport/${id}/status-summary`
            );


        console.log(
            "STATUS SUMMARY DATA:",
            data
        );


        /* ---------------------------------------------
           RENDER SESUAI RESPONSE BACKEND
        --------------------------------------------- */

        renderBusiness(
            data
        );


        renderPassport(
            data
        );


        renderVerification(
            data
        );


        renderTrend(
            data
        );


        renderPerformance(
            data
        );


        /*
         * Jangan mencoba membaca
         * summary / strongest / categories
         * karena backend tidak mengirimnya.
         */

        hideUnsupportedElements();


        showContent();

    }

    catch (error) {

        console.error(
            "STATUS SUMMARY ERROR:",
            error
        );


        showError(
            error.message
        );

    }

}


/* =====================================================
   RETRY BUTTON
===================================================== */

if (retryButton) {

    retryButton.addEventListener(
        "click",
        function() {

            loadStatusSummary();

        }
    );

}


/* =====================================================
   BACK BUTTON
===================================================== */

const backButton =
    document.getElementById(
        "backButton"
    );


if (backButton) {

    backButton.addEventListener(
        "click",
        function() {

            window.location.href =
                `dashboard.html?business_id=${
                    encodeURIComponent(
                        businessId
                    )
                }`;

        }
    );

}


/* =====================================================
   ACTION PLAN
===================================================== */

const actionPlanButton =
    document.getElementById(
        "actionPlanButton"
    );


if (actionPlanButton) {

    actionPlanButton.addEventListener(
        "click",
        function() {

            window.location.href =
                `action-plan.html?business_id=${
                    encodeURIComponent(
                        businessId
                    )
                }`;

        }
    );

}


/* =====================================================
   ACTION PLAN PROGRESS
===================================================== */

const progressButton =
    document.getElementById(
        "progressButton"
    );


if (progressButton) {

    progressButton.addEventListener(
        "click",
        function() {

            window.location.href =
                `action-plan-progress.html?business_id=${
                    encodeURIComponent(
                        businessId
                    )
                }`;

        }
    );

}


/* =====================================================
   VERIFICATION SUMMARY
===================================================== */

const verificationButton =
    document.getElementById(
        "verificationButton"
    );


if (verificationButton) {

    verificationButton.addEventListener(
        "click",
        function() {

            window.location.href =
                `verification-summary.html?business_id=${
                    encodeURIComponent(
                        businessId
                    )
                }`;

        }
    );

}


/* =====================================================
   FINAL SUMMARY
===================================================== */

const finalSummaryButton =
    document.getElementById(
        "finalSummaryButton"
    );


if (finalSummaryButton) {

    finalSummaryButton.addEventListener(
        "click",
        function() {

            window.location.href =
                `final-summary.html?business_id=${
                    encodeURIComponent(
                        businessId
                    )
                }`;

        }
    );

}


/* =====================================================
   LOGOUT
===================================================== */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function() {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
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
    );

}


/* =====================================================
   START
===================================================== */

loadStatusSummary();