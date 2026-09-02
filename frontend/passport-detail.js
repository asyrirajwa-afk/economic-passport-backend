/* =====================================================
   PASSPORT DETAIL
   ECONOMIC PASSPORT
===================================================== */


/* =====================================================
   CONFIG
===================================================== */

const API_URL = "http://127.0.0.1:8000";


/* =====================================================
   AUTH TOKEN
===================================================== */

const token =
    localStorage.getItem("token");


if (!token) {

    window.location.href =
        "index.html";

}


/* =====================================================
   BUSINESS ID
===================================================== */

const params =
    new URLSearchParams(
        window.location.search
    );


const businessId =
    params.get("business_id") ||
    localStorage.getItem(
        "selected_business_id"
    ) ||
    localStorage.getItem(
        "last_business_id"
    );


console.log(
    "PASSPORT DETAIL BUSINESS ID:",
    businessId
);


/* =====================================================
   SAVE BUSINESS ID
===================================================== */

if (businessId) {

    localStorage.setItem(
        "selected_business_id",
        String(businessId)
    );

    localStorage.setItem(
        "last_business_id",
        String(businessId)
    );

}


/* =====================================================
   DOM ELEMENTS
===================================================== */

const loadingState =
    document.getElementById(
        "loadingState"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const passportContent =
    document.getElementById(
        "passportContent"
    );


const retryButton =
    document.getElementById(
        "retryButton"
    );


/* =====================================================
   SHOW LOADING
===================================================== */

function showLoading() {

    if (loadingState) {

        loadingState.style.display =
            "flex";

    }


    if (errorState) {

        errorState.style.display =
            "none";

    }


    if (passportContent) {

        passportContent.style.display =
            "none";

    }

}


/* =====================================================
   SHOW CONTENT
===================================================== */

function showContent() {

    if (loadingState) {

        loadingState.style.display =
            "none";

    }


    if (errorState) {

        errorState.style.display =
            "none";

    }


    if (passportContent) {

        passportContent.style.display =
            "block";

    }

}


/* =====================================================
   SHOW ERROR
===================================================== */

function showError(message) {

    if (loadingState) {

        loadingState.style.display =
            "none";

    }


    if (passportContent) {

        passportContent.style.display =
            "none";

    }


    if (errorState) {

        errorState.style.display =
            "flex";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message ||
            "Passport tidak dapat dimuat.";

    }

}


/* =====================================================
   API FETCH
===================================================== */

async function apiFetch(endpoint) {

    let response;


    try {

        response =
            await fetch(
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
            "Tidak dapat terhubung ke backend. Pastikan FastAPI sedang berjalan."
        );

    }


    let data = null;


    try {

        data =
            await response.json();

    }

    catch (error) {

        console.error(
            "JSON PARSE ERROR:",
            error
        );

    }


    console.log(
        "API STATUS:",
        response.status
    );


    console.log(
        "API RESPONSE:",
        data
    );


    /* =================================================
       UNAUTHORIZED
    ================================================= */

    if (
        response.status === 401
    ) {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

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


        if (
            Array.isArray(message)
        ) {

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


        throw new Error(
            message
        );

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


    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

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


    const date =
        new Date(value);


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
   GET CATEGORY
===================================================== */

function getCategory(
    categories,
    categoryName
) {

    if (
        !Array.isArray(categories)
    ) {

        return null;

    }


    return categories.find(
        category =>
            String(
                category.name
            ).toLowerCase() ===
            String(
                categoryName
            ).toLowerCase()
    ) || null;

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
        business.business_name ||
        business.name ||
        "-";


    const businessNameElement =
        document.getElementById(
            "businessName"
        );


    if (businessNameElement) {

        businessNameElement.textContent =
            businessName;

    }


    const passportBusinessName =
        document.getElementById(
            "passportBusinessName"
        );


    if (passportBusinessName) {

        passportBusinessName.textContent =
            businessName;

    }

}


/* =====================================================
   RENDER PASSPORT
===================================================== */

function renderPassport(data) {

    const passport =
        data?.passport;


    if (!passport) {

        console.warn(
            "Passport data tidak tersedia."
        );

        return;

    }


    /* =============================================
       OVERALL SCORE
    ============================================= */

    const score =
        Number(
            passport.overall_score ??
            passport.score ??
            0
        );


    const overallScore =
        document.getElementById(
            "overallScore"
        );


    if (overallScore) {

        overallScore.textContent =
            formatScore(score);

    }


    /* =============================================
       PASSPORT ID
    ============================================= */

    const passportId =
        document.getElementById(
            "passportId"
        );


    if (passportId) {

        passportId.textContent =
            passport.id ??
            "-";

    }


    /* =============================================
       LEVEL
    ============================================= */

    const passportLevel =
        document.getElementById(
            "passportLevel"
        );


    if (passportLevel) {

        passportLevel.textContent =
            passport.level ||
            "-";

    }


    /* =============================================
       STATUS
    ============================================= */

    const passportStatus =
        document.getElementById(
            "passportStatus"
        );


    if (passportStatus) {

        passportStatus.textContent =
            passport.status ||
            "-";

    }


    /* =============================================
       CREATED AT
    ============================================= */

    const createdAt =
        document.getElementById(
            "createdAt"
        );


    if (createdAt) {

        createdAt.textContent =
            formatDate(
                passport.created_at
            );

    }

}


/* =====================================================
   RENDER TARGET
===================================================== */

function renderTarget(data) {

    const target =
        data?.target;


    if (!target) {

        console.warn(
            "Target data tidak tersedia."
        );

        return;

    }


    /* =============================================
       TARGET SCORE
    ============================================= */

    const targetScore =
        document.getElementById(
            "targetScore"
        );


    if (targetScore) {

        targetScore.textContent =
            formatScore(
                target.target_score
            );

    }


    /* =============================================
       TARGET STATUS
    ============================================= */

    const targetStatus =
        document.getElementById(
            "targetStatus"
        );


    if (targetStatus) {

        const status =
            String(
                target.status || ""
            ).toLowerCase();


        if (
            status === "achieved"
        ) {

            targetStatus.textContent =
                "Target Tercapai";

        }

        else {

            targetStatus.textContent =
                "Target Belum Tercapai";

        }

    }


    /* =============================================
       TARGET GAP
    ============================================= */

    const targetGap =
        document.getElementById(
            "targetGap"
        );


    if (targetGap) {

        targetGap.textContent =
            formatScore(
                target.gap
            );

    }

}

/* =====================================================
   RENDER SINGLE CATEGORY
===================================================== */

function renderCategory(
    categories,
    categoryName,
    scoreId,
    progressId,
    statusId
) {

    const category =
        getCategory(
            categories,
            categoryName
        );


    if (!category) {

        console.warn(
            `Kategori ${categoryName} tidak ditemukan.`
        );

        return;

    }


    /* =============================================
       SCORE
    ============================================= */

    const score =
        Number(
            category.score ?? 0
        );


    const scoreElement =
        document.getElementById(
            scoreId
        );


    if (scoreElement) {

        scoreElement.textContent =
            formatScore(score);

    }


    /* =============================================
       PROGRESS
    ============================================= */

    const progressElement =
        document.getElementById(
            progressId
        );


    if (progressElement) {

        const percentage =
            Math.max(
                0,
                Math.min(
                    100,
                    score
                )
            );


        progressElement.style.width =
            `${percentage}%`;

    }


    /* =============================================
       STATUS
    ============================================= */

    const statusElement =
        document.getElementById(
            statusId
        );


    if (statusElement) {

        if (
            category.achieved === true
        ) {

            statusElement.textContent =
                "Target Tercapai";

        }

        else {

            const gap =
                Number(
                    category.target -
                    category.score
                );


            if (
                gap > 0
            ) {

                statusElement.textContent =
                    `Gap ${formatScore(gap)}`;

            }

            else {

                statusElement.textContent =
                    "Target Tercapai";

            }

        }

    }

}

/* =====================================================
   RENDER CATEGORIES
===================================================== */

function renderCategories(data) {

    const categories =
        data?.categories;


    if (
        !Array.isArray(categories)
    ) {

        console.warn(
            "Categories tidak tersedia."
        );

        return;

    }


    /* =============================================
       PROFIT
    ============================================= */

    renderCategory(
        categories,
        "Profit",
        "profitScore",
        "profitProgress",
        "profitStatus"
    );


    /* =============================================
       PEOPLE
    ============================================= */

    renderCategory(
        categories,
        "People",
        "peopleScore",
        "peopleProgress",
        "peopleStatus"
    );


    /* =============================================
       PLANET
    ============================================= */

    renderCategory(
        categories,
        "Planet",
        "planetScore",
        "planetProgress",
        "planetStatus"
    );


    /* =============================================
       MARKETPLACE
    ============================================= */

    renderCategory(
        categories,
        "Marketplace",
        "marketplaceScore",
        "marketplaceProgress",
        "marketplaceStatus"
    );

}


/* =====================================================
   RENDER HIGHLIGHTS
===================================================== */

function renderHighlights(data) {

    const highlights =
        data?.highlights;


    if (!highlights) {

        console.warn(
            "Highlights tidak tersedia."
        );

        return;

    }


    /* =============================================
       STRONGEST
    ============================================= */

    const strongest =
        highlights.strongest;


    if (strongest) {

        const strongestCategory =
            document.getElementById(
                "strongestCategory"
            );


        const strongestScore =
            document.getElementById(
                "strongestScore"
            );


        if (strongestCategory) {

            strongestCategory.textContent =
                strongest.category ||
                "-";

        }


        if (strongestScore) {

            strongestScore.textContent =
                formatScore(
                    strongest.score
                );

        }

    }


    /* =============================================
       WEAKEST
    ============================================= */

    const weakest =
        highlights.weakest;


    if (weakest) {

        const weakestCategory =
            document.getElementById(
                "weakestCategory"
            );


        const weakestScore =
            document.getElementById(
                "weakestScore"
            );


        if (weakestCategory) {

            weakestCategory.textContent =
                weakest.category ||
                "-";

        }


        if (weakestScore) {

            weakestScore.textContent =
                formatScore(
                    weakest.score
                );

        }

    }

}


/* =====================================================
   RENDER SUMMARY
===================================================== */

function renderSummary(data) {

    const passport =
        data?.passport;


    const business =
        data?.business;


    const target =
        data?.target;


    const categories =
        data?.categories;


    const summaryText =
        document.getElementById(
            "summaryText"
        );


    if (!summaryText) {

        return;

    }


    const businessName =
        business?.business_name ||
        "Bisnis ini";


    const score =
        Number(
            passport?.overall_score ??
            passport?.score ??
            0
        );


    const level =
        passport?.level ||
        "-";


    const status =
        passport?.status ||
        "-";


    let text =
        `${businessName} memiliki overall score ${formatScore(score)} dengan level ${level} dan status ${status}.`;


    if (
        target
    ) {

        if (
            target.achieved === true
        ) {

            text +=
                " Target minimum Economic Passport telah tercapai.";

        }

        else {

            text +=
                ` Target minimum belum tercapai dan masih terdapat gap sebesar ${formatScore(target.gap)} poin.`;

        }

    }


    if (
        Array.isArray(categories)
    ) {

        const notAchieved =
        categories.filter(
            category =>
                category.achieved !== true
        );


        if (
            notAchieved.length > 0
        ) {

            const names =
                notAchieved
                    .map(
                        category =>
                            category.name
                    )
                    .join(", ");


            text +=
                ` Area yang masih perlu diperhatikan: ${names}.`;

        }

        else {

            text +=
                " Seluruh kategori telah mencapai target minimum.";

        }

    }


    summaryText.textContent =
        text;

}


/* =====================================================
   LOAD PASSPORT DETAIL
===================================================== */

async function loadPassportDetail() {

    if (!businessId) {

        showError(
            "Business ID tidak ditemukan. Silakan pilih bisnis terlebih dahulu."
        );

        return;

    }


    showLoading();


    try {

        const id =
            encodeURIComponent(
                businessId
            );


        /* =============================================
           PASSPORT DETAIL ENDPOINT
        ============================================= */

        const data =
            await apiFetch(
                `/passport/${id}/detail`
            );


        console.log(
            "PASSPORT DETAIL DATA:",
            data
        );


        /* =============================================
           RENDER
        ============================================= */

        renderBusiness(
            data
        );


        renderPassport(
            data
        );


        renderTarget(
            data
        );


        renderCategories(
            data
        );


        renderHighlights(
            data
        );


        renderSummary(
            data
        );


        showContent();

    }


    catch (error) {

        console.error(
            "PASSPORT DETAIL ERROR:",
            error
        );


        showError(
            error.message ||
            "Passport Detail tidak dapat dimuat."
        );

    }

}


/* =====================================================
   RETRY
===================================================== */

if (retryButton) {

    retryButton.addEventListener(
        "click",
        function () {

            loadPassportDetail();

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
        function () {

            window.history.back();

        }
    );

}


/* =====================================================
   DASHBOARD
===================================================== */

const dashboardButton =
    document.getElementById(
        "dashboardButton"
    );


if (dashboardButton) {

    dashboardButton.addEventListener(
        "click",
        function () {

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
   SCORE BREAKDOWN
===================================================== */

const scoreBreakdownButton =
    document.getElementById(
        "scoreBreakdownButton"
    );


if (scoreBreakdownButton) {

    scoreBreakdownButton.addEventListener(
        "click",
        function () {

            window.location.href =
                `score-breakdown.html?business_id=${
                    encodeURIComponent(
                        businessId
                    )
                }`;

        }
    );

}


/* =====================================================
   VERIFICATION
===================================================== */

const verificationButton =
    document.getElementById(
        "verificationButton"
    );


if (verificationButton) {

    verificationButton.addEventListener(
        "click",
        function () {

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
   LOGOUT
===================================================== */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

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

loadPassportDetail();