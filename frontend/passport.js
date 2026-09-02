/* =====================================================
   ECONOMIC PASSPORT
   PASSPORT.JS
===================================================== */


/* =====================================================
   API
===================================================== */

const API_URL =
    "https://economic-passport-backend-production.up.railway.app";


/* =====================================================
   TOKEN
===================================================== */

const token =
    localStorage.getItem(
        "token"
    );


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
    params.get(
        "business_id"
    ) ||
    localStorage.getItem(
        "selected_business_id"
    ) ||
    localStorage.getItem(
        "last_business_id"
    );


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
   ELEMENTS
===================================================== */

const loadingState =
    document.getElementById(
        "loadingState"
    );


const passportContent =
    document.getElementById(
        "passportContent"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


const errorBackButton =
    document.getElementById(
        "errorBackButton"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const passportDetailButton =
    document.getElementById(
        "passportDetailButton"
    );

const passportToolsButton =
    document.getElementById(
        "passportToolsButton"
    );

/* =====================================================
   HELPER: SET TEXT
===================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        element.textContent =
            "-";

    }

    else {

        element.textContent =
            value;

    }

}


/* =====================================================
   FORMAT SCORE
===================================================== */

function formatScore(
    value
) {

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

function formatDate(
    value
) {

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
            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"
        }
    );

}


/* =====================================================
   SHOW LOADING
===================================================== */

function showLoading() {

    if (loadingState) {

        loadingState.style.display =
            "block";

    }


    if (passportContent) {

        passportContent.style.display =
            "none";

    }


    if (errorState) {

        errorState.style.display =
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

function showError(
    message
) {

    console.error(
        "PASSPORT ERROR:",
        message
    );


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
            "block";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message ||
            "Data Economic Passport gagal dimuat.";

    }

}


/* =====================================================
   API FETCH
===================================================== */

async function apiFetch(
    endpoint
) {

    let response;


    try {

        response =
            await fetch(
                `${API_URL}${endpoint}`,
                {
                    method:
                        "GET",

                    headers:
                        {
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
            "Tidak dapat terhubung ke server FastAPI."
        );

    }


    let data = null;


    try {

        data =
            await response.json();

    }

    catch (error) {

        console.error(
            "JSON ERROR:",
            error
        );

    }


    console.log(
        "API STATUS:",
        response.status
    );


    console.log(
        "API DATA:",
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
            "selected_business_id"
        );


        localStorage.removeItem(
            "last_business_id"
        );


        window.location.href =
            "index.html";


        return null;

    }


    /* =================================================
       ERROR
    ================================================= */

    if (
        !response.ok
    ) {

        throw new Error(
            data?.detail ||
            data?.message ||
            `HTTP ${response.status}`
        );

    }


    return data;

}


/* =====================================================
   RENDER PASSPORT
===================================================== */

function renderPassport(
    dashboardData,
    overviewData
) {

    console.log(
        "RENDER PASSPORT"
    );


    console.log(
        "DASHBOARD DATA:",
        dashboardData
    );


    console.log(
        "OVERVIEW DATA:",
        overviewData
    );


    /* =================================================
       DASHBOARD DATA
    ================================================= */

    const dashboardPassport =
        dashboardData?.passport ||
        {};


    const dashboardBusiness =
        dashboardData?.business ||
        {};


    /* =================================================
       OVERVIEW DATA
    ================================================= */

    const overviewPassport =
        overviewData?.passport ||
        {};


    const overviewBusiness =
        overviewData?.business ||
        {};


    /* =================================================
       BUSINESS NAME
    ================================================= */

    const businessName =
        dashboardBusiness?.business_name ||
        overviewBusiness?.business_name ||
        "-";


    setText(
        "businessName",
        businessName
    );


    /* =================================================
       BUSINESS ID
    ================================================= */

    const currentBusinessId =
        dashboardBusiness?.id ||
        overviewBusiness?.id ||
        businessId ||
        "-";


    setText(
        "businessId",
        currentBusinessId
    );


    /* =================================================
       PASSPORT ID
       
       BERASAL DARI /passport/{id}/overview
    ================================================= */

    const passportId =
        overviewPassport?.id;


    setText(
        "passportId",
        passportId
    );


    /* =================================================
       SCORE
       
       BERASAL DARI /dashboard/{id}
    ================================================= */

    const score =
        dashboardPassport?.score ??
        dashboardPassport?.business_score ??
        overviewPassport?.overall_score ??
        overviewPassport?.score ??
        0;


    setText(
        "businessScore",
        formatScore(score)
    );


    /* =================================================
       STATUS
    ================================================= */

    const status =
        dashboardPassport?.status ||
        overviewPassport?.status ||
        "-";


    setText(
        "businessStatus",
        status
    );


    setText(
        "passportStatus",
        status
    );


    /* =================================================
       LEVEL
    ================================================= */

    const level =
        overviewPassport?.level ||
        dashboardPassport?.level ||
        "Economic Passport";


    setText(
        "passportLevel",
        level
    );


    /* =================================================
       ASSESSMENT DATE
       
       PRIORITAS:
       1. overview.created_at
       2. dashboard.last_updated
    ================================================= */

    const assessmentDate =
        overviewPassport?.created_at ||
        dashboardPassport?.last_updated ||
        null;


    setText(
        "assessmentDate",
        formatDate(
            assessmentDate
        )
    );


    /* =================================================
       SAVE PASSPORT ID
    ================================================= */

    if (
        passportId !== null &&
        passportId !== undefined &&
        passportId !== ""
    ) {

        localStorage.setItem(
            "passport_id",
            String(
                passportId
            )
        );

    }


    /* =================================================
       SHOW CONTENT
    ================================================= */

    showContent();


    console.log(
        "PASSPORT BERHASIL DITAMPILKAN"
    );

}
/* =====================================================
   LOAD PASSPORT
===================================================== */

/* =====================================================
   LOAD PASSPORT
===================================================== */

async function loadPassport() {

    if (!businessId) {

        showError(
            "Business ID tidak ditemukan. Silakan pilih bisnis terlebih dahulu."
        );

        return;

    }


    showLoading();


    try {

        /* =================================================
           AMBIL DATA DASHBOARD
           
           Digunakan untuk:
           - Business Name
           - Business ID
           - Score
           - Status
           - Level
        ================================================= */

        const dashboardData =
            await apiFetch(
                `/dashboard/${encodeURIComponent(
                    businessId
                )}`
            );


        console.log(
            "DASHBOARD DATA:",
            dashboardData
        );


        /* =================================================
           AMBIL DATA PASSPORT OVERVIEW
           
           Digunakan untuk:
           - Passport ID
           - Created At
        ================================================= */

        const overviewData =
            await apiFetch(
                `/passport/${encodeURIComponent(
                    businessId
                )}/overview`
            );


        console.log(
            "PASSPORT OVERVIEW DATA:",
            overviewData
        );


        /* =================================================
           GABUNGKAN DATA
        ================================================= */

        renderPassport(
            dashboardData,
            overviewData
        );


    }

    catch (error) {

        console.error(
            "LOAD PASSPORT ERROR:",
            error
        );


        showError(
            error.message ||
            "Economic Passport gagal dimuat."
        );

    }

}
/* =====================================================
   BACK TO DASHBOARD
===================================================== */

function goToDashboard() {

    if (businessId) {

        window.location.href =
            `dashboard.html?business_id=${
                encodeURIComponent(
                    businessId
                )
            }`;

    }

    else {

        window.location.href =
            "dashboard.html";

    }

}


if (backButton) {

    backButton.addEventListener(
        "click",
        goToDashboard
    );

}


if (errorBackButton) {

    errorBackButton.addEventListener(
        "click",
        goToDashboard
    );

}


/* =====================================================
   PASSPORT DETAIL
===================================================== */

if (
    passportDetailButton
) {

    passportDetailButton.addEventListener(
        "click",
        function() {

            if (!businessId) {

                showError(
                    "Business ID tidak ditemukan."
                );


                return;

            }


            localStorage.setItem(
                "selected_business_id",
                String(businessId)
            );


            localStorage.setItem(
                "last_business_id",
                String(businessId)
            );


            window.location.href =
                `passport-detail.html?business_id=${
                    encodeURIComponent(
                        businessId
                    )
                }`;

        }
    );

}

/* =====================================================
   PASSPORT TOOLS
===================================================== */

if (passportToolsButton) {

    passportToolsButton.addEventListener(
        "click",
        function() {

            if (!businessId) {

                showError(
                    "Business ID tidak ditemukan."
                );

                return;

            }


            localStorage.setItem(
                "selected_business_id",
                String(businessId)
            );


            localStorage.setItem(
                "last_business_id",
                String(businessId)
            );


            window.location.href =
                `passport-tools.html?business_id=${
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


            localStorage.removeItem(
                "passport_id"
            );


            window.location.href =
                "index.html";

        }
    );

}


/* =====================================================
   START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadPassport();

    }
);