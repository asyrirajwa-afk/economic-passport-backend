/* =====================================================
   FINAL SUMMARY
   ECONOMIC PASSPORT
===================================================== */


/* =====================================================
   CONFIG
===================================================== */

const API_URL = "http://127.0.0.1:8000";


/* =====================================================
   TOKEN
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
    "FINAL SUMMARY BUSINESS ID:",
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
   DOM
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

const summaryContent =
    document.getElementById(
        "summaryContent"
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


    if (summaryContent) {

        summaryContent.style.display =
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


    if (summaryContent) {

        summaryContent.style.display =
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


    if (summaryContent) {

        summaryContent.style.display =
            "none";

    }


    if (errorState) {

        errorState.style.display =
            "flex";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message ||
            "Final Summary tidak dapat dimuat.";

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
        "FINAL SUMMARY API STATUS:",
        response.status
    );


    console.log(
        "FINAL SUMMARY RESPONSE:",
        data
    );


    /* =================================================
       TOKEN EXPIRED
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
        item =>
            item.category ===
            categoryName
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

    const score =
    Number(
        passport?.overall_score ??
        passport?.score ??
        passport?.business_score ??
        0
    );


    if (!passport) {

        return;

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
                score
            );

    }


    /* ---------------------------------------------
       SCORE CIRCLE
    --------------------------------------------- */

    const scoreCircle =
        document.getElementById(
            "scoreCircle"
        );


    if (scoreCircle) {

        scoreCircle.textContent =
            formatScore(
                score
            );

    }


    /* ---------------------------------------------
       LEVEL
    --------------------------------------------- */

    const scoreLevel =
        document.getElementById(
            "scoreLevel"
        );


    if (scoreLevel) {

        scoreLevel.textContent =
            passport.level ||
            "-";

    }


    /* ---------------------------------------------
       STATUS
    --------------------------------------------- */

    const overallStatus =
        document.getElementById(
            "overallStatus"
        );


    if (overallStatus) {

        overallStatus.textContent =
            passport.status ||
            "-";

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
       PASSPORT STATUS
    --------------------------------------------- */

    const passportStatus =
        document.getElementById(
            "passportStatus"
        );


    if (passportStatus) {

        passportStatus.textContent =
            passport.status ||
            "-";

    }


    /* ---------------------------------------------
       ASSESSMENT DATE
    --------------------------------------------- */

    const assessmentDate =
        document.getElementById(
            "assessmentDate"
        );


    if (assessmentDate) {

        assessmentDate.textContent =
            formatDate(
                passport.created_at
            );

    }


    /* ---------------------------------------------
       CONDITION TITLE
    --------------------------------------------- */

    const conditionTitle =
        document.getElementById(
            "conditionTitle"
        );


    if (conditionTitle) {

        if (
            score >= 80
        ) {

            conditionTitle.textContent =
                "Kondisi bisnis sangat baik";

        }

        else if (
            score >= 65
        ) {

            conditionTitle.textContent =
                "Kondisi bisnis cukup baik";

        }

        else if (
            passport.overall_score >= 50
        ) {

            conditionTitle.textContent =
                "Bisnis membutuhkan peningkatan";

        }

        else {

            conditionTitle.textContent =
                "Bisnis membutuhkan perhatian";

        }

    }


    /* ---------------------------------------------
       CONDITION DESCRIPTION
    --------------------------------------------- */

    const conditionDescription =
        document.getElementById(
            "conditionDescription"
        );


    if (conditionDescription) {

        if (
            passport.overall_score >= 80
        ) {

            conditionDescription.textContent =
                "Overall score telah mencapai atau melampaui target minimum Economic Passport.";

        }

        else {

            conditionDescription.textContent =
                "Overall score masih berada di bawah target minimum Economic Passport.";

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
            "Data kategori tidak tersedia."
        );

        return;

    }


    /* ---------------------------------------------
       PROFIT
    --------------------------------------------- */

    renderCategory(
        categories,
        "Profit",
        "profitScore",
        "profitProgress",
        "profitStatus"
    );


    /* ---------------------------------------------
       PEOPLE
    --------------------------------------------- */

    renderCategory(
        categories,
        "People",
        "peopleScore",
        "peopleProgress",
        "peopleStatus"
    );


    /* ---------------------------------------------
       PLANET
    --------------------------------------------- */

    renderCategory(
        categories,
        "Planet",
        "planetScore",
        "planetProgress",
        "planetStatus"
    );


    /* ---------------------------------------------
       MARKETPLACE
    --------------------------------------------- */

    renderCategory(
        categories,
        "Marketplace",
        "marketplaceScore",
        "marketplaceProgress",
        "marketplaceStatus"
    );

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

        return;

    }


    const score =
        Number(
            category.score
        );


    /* ---------------------------------------------
       SCORE
    --------------------------------------------- */

    const scoreElement =
        document.getElementById(
            scoreId
        );


    if (scoreElement) {

        scoreElement.textContent =
            formatScore(score);

    }


    /* ---------------------------------------------
       PROGRESS
    --------------------------------------------- */

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


    /* ---------------------------------------------
       STATUS
    --------------------------------------------- */

    const statusElement =
        document.getElementById(
            statusId
        );


    if (statusElement) {

        if (
            category.target_achieved === true
        ) {

            statusElement.textContent =
                "Target Achieved";

        }

        else {

            const gap =
                Number(
                    category.gap || 0
                );


            if (
                gap > 0
            ) {

                statusElement.textContent =
                    `Gap ${gap.toFixed(1)}`;

            }

            else {

                statusElement.textContent =
                    "Below Target";

            }

        }

    }

}


/* =====================================================
   RENDER TARGET
===================================================== */

function renderTarget(data) {

    const target =
        data?.target;


    if (!target) {

        return;

    }


    const targetScore =
        document.getElementById(
            "targetScore"
        );


    const targetDetail =
        document.getElementById(
            "targetDetail"
        );


    /* =============================================
       TARGET SCORE
    ============================================= */

    if (targetScore) {

        targetScore.textContent =
            formatScore(
                target.target_score
            );

    }


    /* =============================================
       TARGET DETAIL
    ============================================= */

    if (targetDetail) {

        if (
            target.achieved === true
        ) {

            targetDetail.textContent =
                "Target minimum telah tercapai.";

        }

        else {

            const gap =
                Number(
                    target.gap || 0
                );


            targetDetail.textContent =
                `Masih kurang ${formatScore(gap)} poin dari target.`;

        }

    }

}


/* =====================================================
   RENDER ACTION PLAN SUMMARY
===================================================== */

function renderActionPlanSummary(data) {

    const summary =
        data?.summary || {};


    const totalActions =
        document.getElementById(
            "totalActions"
        );

    const completedActions =
        document.getElementById(
            "completedActions"
        );

    const progressActions =
        document.getElementById(
            "progressActions"
        );

    const remainingActions =
        document.getElementById(
            "remainingActions"
        );


    /*
     * Backend Action Plan saat ini menyediakan:
     *
     * total_actions
     * needs_action
     * on_track
     *
     * Backend belum menyediakan:
     * completed
     * in_progress
     *
     * Jadi jangan mengarang status completion.
     */


    if (totalActions) {

        totalActions.textContent =
            summary.total_actions ??
            0;

    }


    if (completedActions) {

        completedActions.textContent =
            "-";

    }


    if (progressActions) {

        progressActions.textContent =
            summary.needs_action ??
            0;

    }


    if (remainingActions) {

        remainingActions.textContent =
            summary.needs_action ??
            0;

    }

}

/* =====================================================
   RENDER VALIDITY
===================================================== */

function renderValidity(data) {

    const validity =
        data?.validity;


    if (!validity) {

        return;

    }


    /* ---------------------------------------------
       VERIFICATION STATUS
    --------------------------------------------- */

    const verificationStatus =
        document.getElementById(
            "verificationStatus"
        );


    if (verificationStatus) {

        if (
            validity.status ===
            "Valid"
        ) {

            verificationStatus.textContent =
                "Verified";

        }

        else {

            verificationStatus.textContent =
                validity.status ||
                "-";

        }

    }


    /* ---------------------------------------------
       VERIFICATION MESSAGE
    --------------------------------------------- */

    const verificationMessage =
        document.getElementById(
            "verificationMessage"
        );


    if (verificationMessage) {

        if (
            validity.status ===
            "Valid"
        ) {

            verificationMessage.textContent =
                "Economic Passport masih berada dalam masa berlaku.";

        }

        else if (
            validity.status ===
            "Expiring Soon"
        ) {

            verificationMessage.textContent =
                "Economic Passport akan segera memasuki masa pembaruan.";

        }

        else {

            verificationMessage.textContent =
                "Economic Passport sudah melewati masa berlaku.";

        }

    }


    /* ---------------------------------------------
       REMAINING DAYS
    --------------------------------------------- */

    const remainingDays =
        document.getElementById(
            "remainingDays"
        );


    if (remainingDays) {

        remainingDays.textContent =
            validity.remaining_days ??
            "-";

    }

}


/* =====================================================
   FINAL CONCLUSION
===================================================== */

function renderConclusion(data) {

    const passport =
        data?.passport;

    const categories =
        data?.categories;

    const target =
        data?.target;

    const validity =
        data?.validity;


    const finalConclusion =
        document.getElementById(
            "finalConclusion"
        );


    if (!finalConclusion) {

        return;

    }


    if (!passport) {

        finalConclusion.textContent =
            "Data passport belum tersedia.";

        return;

    }


    const score =
    Number(
        passport?.overall_score ??
        passport?.score ??
        passport?.business_score ??
        0
    );


    const achieved =
        target?.achieved === true;


    const valid =
        validity?.status === "Valid";


    let conclusion = "";


    if (
        achieved &&
        valid
    ) {

        conclusion =
            `Bisnis ${data.business?.business_name || ""} memiliki overall score ${score.toFixed(1)} dan telah mencapai target minimum Economic Passport. Passport masih berstatus valid sehingga dapat digunakan saat ini.`;

    }

    else if (
        achieved &&
        !valid
    ) {

        conclusion =
            `Bisnis ${data.business?.business_name || ""} memiliki overall score ${score.toFixed(1)} dan telah mencapai target minimum. Namun, status masa berlaku passport perlu diperhatikan.`;

    }

    else {

        conclusion =
            `Bisnis ${data.business?.business_name || ""} memiliki overall score ${score.toFixed(1)}. Masih terdapat area yang perlu ditingkatkan agar target Economic Passport dapat tercapai.`;

    }


    if (
        Array.isArray(categories)
    ) {

        const belowTarget =
            categories.filter(
                item =>
                    item.target_achieved !== true
            );


        if (
            belowTarget.length > 0
        ) {

            const names =
                belowTarget
                    .map(
                        item =>
                            item.category
                    )
                    .join(", ");


            conclusion +=
                ` Area yang belum mencapai target: ${names}.`;

        }

    }


    finalConclusion.textContent =
        conclusion;

}


/* =====================================================
   LOAD FINAL SUMMARY
===================================================== */

/* =====================================================
   LOAD FINAL SUMMARY
===================================================== */

/* =====================================================
   LOAD FINAL SUMMARY
===================================================== */

async function loadFinalSummary() {

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
           FINAL SUMMARY
        ============================================= */

        const finalSummary =
            await apiFetch(
                `/passport/${id}/final-summary`
            );


        console.log(
            "FINAL SUMMARY DATA:",
            finalSummary
        );


        /* =============================================
           ACTION PLAN
        ============================================= */

        const actionPlan =
            await apiFetch(
                `/passport/${id}/action-plan`
            );


        console.log(
            "ACTION PLAN DATA:",
            actionPlan
        );


        /* =============================================
           RENDER FINAL SUMMARY
        ============================================= */

        renderBusiness(
            finalSummary
        );


        renderPassport(
            finalSummary
        );


        renderCategories(
            finalSummary
        );


        renderTarget(
            finalSummary
        );


        renderValidity(
            finalSummary
        );


        renderConclusion(
            finalSummary
        );


        /* =============================================
           RENDER ACTION PLAN
        ============================================= */

        renderActionPlanSummary(
            actionPlan
        );


        showContent();

    }


    catch (error) {

        console.error(
            "FINAL SUMMARY ERROR:",
            error
        );


        showError(
            error.message ||
            "Final Summary tidak dapat dimuat."
        );

    }

}
/* =====================================================
   RETRY BUTTON
===================================================== */

if (retryButton) {

    retryButton.addEventListener(
        "click",
        function () {

            loadFinalSummary();

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
   DASHBOARD BUTTON
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
   ACTION PLAN BUTTON
===================================================== */

const actionPlanButton =
    document.getElementById(
        "actionPlanButton"
    );


if (actionPlanButton) {

    actionPlanButton.addEventListener(
        "click",
        function () {

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
   STATUS SUMMARY BUTTON
===================================================== */

const statusSummaryButton =
    document.getElementById(
        "statusSummaryButton"
    );


if (statusSummaryButton) {

    statusSummaryButton.addEventListener(
        "click",
        function () {

            window.location.href =
                `status-summary.html?business_id=${
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

loadFinalSummary();