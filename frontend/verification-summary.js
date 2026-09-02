/* =====================================================
   VERIFICATION SUMMARY
   ECONOMIC PASSPORT
===================================================== */


/* =====================================================
   CONFIG
===================================================== */

const API_URL = "https://economic-passport-backend-production.up.railway.app";


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
    "VERIFICATION SUMMARY BUSINESS ID:",
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
   LOADING
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
   ERROR
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
            "Data verification tidak dapat dimuat.";

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
        "VERIFICATION API STATUS:",
        response.status
    );


    console.log(
        "VERIFICATION RESPONSE:",
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

    if (
        !response.ok
    ) {

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
   FORMAT BOOLEAN
===================================================== */

function formatVerified(value) {

    if (value === true) {

        return "Verified";

    }


    if (value === false) {

        return "Not Verified";

    }


    return "-";

}


/* =====================================================
   SET TEXT HELPER
===================================================== */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );

    if (!element) {
        console.warn(
            `Element #${elementId} tidak ditemukan.`
        );

        return;
    }

    element.textContent =
        value !== null &&
        value !== undefined &&
        value !== ""
            ? value
            : "-";
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
   RENDER VERIFICATION
===================================================== */

function renderVerification(data) {

    const verification =
        data?.verification;


    if (!verification) {

        return;

    }


    /* ---------------------------------------------
       STATUS
    --------------------------------------------- */

    const verificationStatus =
        document.getElementById(
            "verificationStatus"
        );


    if (verificationStatus) {

        verificationStatus.textContent =
            verification.status ||
            "-";

    }


    /* ---------------------------------------------
       MESSAGE
    --------------------------------------------- */

    const verificationMessage =
        document.getElementById(
            "verificationMessage"
        );


    if (verificationMessage) {

        verificationMessage.textContent =
            verification.message ||
            "-";

    }


    /* ---------------------------------------------
       VERIFIED ICON
    --------------------------------------------- */

    const verificationIcon =
        document.getElementById(
            "verificationIcon"
        );


    if (verificationIcon) {

        if (
            verification.verified === true
        ) {

            verificationIcon.textContent =
                "✓";

            verificationIcon.classList.remove(
                "not-verified"
            );

        }

        else {

            verificationIcon.textContent =
                "!";

            verificationIcon.classList.add(
                "not-verified"
            );

        }

    }

}


/* =====================================================
   RENDER PASSPORT
===================================================== */

function renderPassport(data) {

    console.log(
        "RENDER PASSPORT VERIFICATION:",
        data
    );


    /* =================================================
       AMBIL OBJECT PASSPORT
    ================================================= */

    const passport =
        data?.passport ||
        {};


    /* =================================================
       AMBIL OBJECT VERIFICATION
    ================================================= */

    const verification =
        data?.verification ||
        {};


    /* =================================================
       PASSPORT ID
    ================================================= */

    setText(
        "passportId",
        passport.id
    );


    /* =================================================
       BUSINESS SCORE

       Backend:
       passport.score
    ================================================= */

    const businessScore =
        passport.overall_score ??
        passport.score ??
        passport.business_score ??
        data?.overall_score ??
        data?.business_score ??
        null;


    setText(
        "businessScore",
        formatScore(
            businessScore
        )
    );


    /* =================================================
       PASSPORT STATUS

       Backend:
       passport.database_status
    ================================================= */

    const passportStatus =
        passport.database_status ??
        passport.status ??
        "-";


    setText(
        "passportStatus",
        passportStatus
    );


    /* =================================================
       VERIFICATION LEVEL

       Endpoint verification-summary tidak
       mengirim verification.level.

       Jadi level dihitung dari score,
       mengikuti aturan backend:
       
       >= 80  Excellent
       >= 65  Good
       >= 50  Needs Improvement
       < 50   At Risk
    ================================================= */

    let verificationLevel = "-";


    if (
        businessScore !== null &&
        businessScore !== undefined &&
        businessScore !== ""
    ) {

        const score =
            Number(
                businessScore
            );


        if (
            !Number.isNaN(score)
        ) {

            if (
                score >= 80
            ) {

                verificationLevel =
                    "Excellent";

            }

            else if (
                score >= 65
            ) {

                verificationLevel =
                    "Good";

            }

            else if (
                score >= 50
            ) {

                verificationLevel =
                    "Needs Improvement";

            }

            else {

                verificationLevel =
                    "At Risk";

            }

        }

    }


    setText(
        "verificationLevel",
        verificationLevel
    );


    /* =================================================
       VERIFICATION STATUS
    ================================================= */

    setText(
        "verificationStatus",
        verification.status
    );


    /* =================================================
       VERIFICATION MESSAGE
    ================================================= */

    setText(
        "verificationMessage",
        verification.message
    );


    /* =================================================
       DEBUG
    ================================================= */

    console.log(
        "PASSPORT ID:",
        passport.id
    );


    console.log(
        "BUSINESS SCORE:",
        businessScore
    );


    console.log(
        "PASSPORT STATUS:",
        passportStatus
    );


    console.log(
        "VERIFICATION LEVEL:",
        verificationLevel
    );


    console.log(
        "VERIFICATION STATUS:",
        verification.status
    );

}
/* =====================================================
   RENDER VALIDITY
===================================================== */

function renderValidity(data) {

    const validity =
        data?.validity ||
        {};


    const passport =
        data?.passport ||
        {};


    /* =================================================
       REMAINING DAYS
    ================================================= */

    const remainingDays =
        document.getElementById(
            "remainingDays"
        );


    if (remainingDays) {

        remainingDays.textContent =
            validity.remaining_days ??
            "-";

    }


    /* =================================================
       AGE DAYS
    ================================================= */

    const ageDays =
        document.getElementById(
            "ageDays"
        );


    if (ageDays) {

        ageDays.textContent =
            validity.age_days ??
            "-";

    }


    /* =================================================
       VALIDITY DAYS
    ================================================= */

    const validityDays =
        document.getElementById(
            "validityDays"
        );


    if (validityDays) {

        validityDays.textContent =
            validity.validity_days ??
            "-";

    }


    /* =================================================
       TANGGAL TERBIT
       
       Backend:
       passport.created_at
    ================================================= */

    const issuedDate =
        document.getElementById(
            "issuedDate"
        );


    if (issuedDate) {

        issuedDate.textContent =
            formatDate(
                passport.created_at
            );

    }


    /* =================================================
       PERKIRAAN EXPIRED
       
       Backend:
       passport.expiry_date
    ================================================= */

    const expiryDate =
        document.getElementById(
            "expiryDate"
        );


    if (expiryDate) {

        expiryDate.textContent =
            formatDate(
                passport.expiry_date
            );

    }


    /* =================================================
       VALIDITY PERCENTAGE
    ================================================= */

    const totalDays =
        Number(
            validity.validity_days
        );


    const remaining =
        Number(
            validity.remaining_days
        );


    let percentage = 0;


    if (
        totalDays > 0 &&
        !Number.isNaN(remaining)
    ) {

        percentage =
            (
                remaining /
                totalDays
            ) *
            100;

    }


    percentage =
        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        );


    /* =================================================
       PERCENTAGE TEXT
    ================================================= */

    const validityPercentage =
        document.getElementById(
            "validityPercentage"
        );


    if (validityPercentage) {

        validityPercentage.textContent =
            `${percentage.toFixed(0)}%`;

    }


    /* =================================================
       PROGRESS BAR
    ================================================= */

    const validityProgress =
        document.getElementById(
            "validityProgress"
        );


    if (validityProgress) {

        validityProgress.style.width =
            `${percentage}%`;

    }


    /* =================================================
       DESCRIPTION
    ================================================= */

    const validityDescription =
        document.getElementById(
            "validityDescription"
        );


    if (validityDescription) {

        const remainingValue =
            validity.remaining_days ?? 0;


        if (
            remainingValue <= 0
        ) {

            validityDescription.textContent =
                "Passport sudah melewati masa berlaku.";

        }

        else if (
            remainingValue <= 14
        ) {

            validityDescription.textContent =
                `Passport masih valid tetapi akan segera berakhir dalam ${remainingValue} hari.`;

        }

        else {

            validityDescription.textContent =
                `Passport masih berlaku dengan sisa masa berlaku ${remainingValue} hari.`;

        }

    }

}
/* =====================================================
   LOAD VERIFICATION SUMMARY
===================================================== */

/* =====================================================
   LOAD VERIFICATION SUMMARY
===================================================== */

async function loadVerificationSummary() {

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


        /* =================================================
           VERIFICATION SUMMARY
        ================================================= */

        const verificationData =
            await apiFetch(
                `/passport/${id}/verification-summary`
            );


        console.log(
            "VERIFICATION SUMMARY DATA:",
            verificationData
        );


        /* =================================================
           PASSPORT OVERVIEW
           
           Digunakan untuk mendapatkan:
           - Passport ID
           - Overall Score
           - Level
           - Status
           - Created At
        ================================================= */

        const overviewData =
            await apiFetch(
                `/passport/${id}/overview`
            );


        console.log(
            "PASSPORT OVERVIEW DATA:",
            overviewData
        );


        /* =================================================
           GABUNGKAN DATA PASSPORT
        ================================================= */

        const passportData = {

            ...verificationData,

            passport: {

                ...(verificationData?.passport || {}),

                ...(overviewData?.passport || {})

            }

        };


        console.log(
            "COMBINED VERIFICATION DATA:",
            passportData
        );


        /* =================================================
           RENDER
        ================================================= */

        renderBusiness(
            passportData
        );


        renderVerification(
            passportData
        );


        renderPassport(
            passportData
        );


        renderValidity(
            passportData
        );


        showContent();

    }


    catch (error) {

        console.error(
            "VERIFICATION SUMMARY ERROR:",
            error
        );


        showError(
            error.message ||
            "Data verification tidak dapat dimuat."
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

            loadVerificationSummary();

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
                `status-summary.html?business_id=${
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
   FINAL SUMMARY BUTTON
===================================================== */

const finalSummaryButton =
    document.getElementById(
        "finalSummaryButton"
    );


if (finalSummaryButton) {

    finalSummaryButton.addEventListener(
        "click",
        function () {

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

loadVerificationSummary();