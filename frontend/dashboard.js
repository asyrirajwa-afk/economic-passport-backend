/* =========================================================
   ECONOMIC PASSPORT - DASHBOARD.JS
   VERSION TERBARU
   ========================================================= */

console.log("=================================");
console.log("DASHBOARD.JS BERHASIL DIMUAT");
console.log("=================================");


/* =========================================================
   CONFIG
   ========================================================= */

const API_URL = "https://economic-passport-backend-production.up.railway.app";


/* =========================================================
   TOKEN
   ========================================================= */

const token = localStorage.getItem("token");

console.log(
    "TOKEN:",
    token ? "ADA" : "TIDAK ADA"
);


/* =========================================================
   CEK LOGIN
   ========================================================= */

if (!token) {

    console.error(
        "TOKEN TIDAK DITEMUKAN"
    );

    window.location.href =
        "index.html";
}


/* =========================================================
   BUSINESS ID
   ========================================================= */

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const urlBusinessId =
    urlParams.get(
        "business_id"
    );

const selectedBusinessId =
    localStorage.getItem(
        "selected_business_id"
    );

const lastBusinessId =
    localStorage.getItem(
        "last_business_id"
    );

let currentBusinessId =
    urlBusinessId ||
    selectedBusinessId ||
    lastBusinessId ||
    null;


console.log(
    "BUSINESS ID URL:",
    urlBusinessId
);

console.log(
    "BUSINESS ID SELECTED:",
    selectedBusinessId
);

console.log(
    "BUSINESS ID LAST:",
    lastBusinessId
);

console.log(
    "BUSINESS ID AKTIF:",
    currentBusinessId
);


/* =========================================================
   ELEMENT DASHBOARD
   ========================================================= */

const welcome =
    document.getElementById(
        "welcome"
    );

const totalBusiness =
    document.getElementById(
        "totalBusiness"
    );

const activePassport =
    document.getElementById(
        "activePassport"
    );

const averageScore =
    document.getElementById(
        "averageScore"
    );

const businessList =
    document.getElementById(
        "businessList"
    );

const addBusinessButton =
    document.getElementById(
        "addBusinessButton"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


/* =========================================================
   DETAIL BUSINESS
   ========================================================= */

const dashboardBusinessName =
    document.getElementById(
        "dashboardBusinessName"
    );

const dashboardBusinessCategory =
    document.getElementById(
        "dashboardBusinessCategory"
    );

const passportStatus =
    document.getElementById(
        "passportStatus"
    );

const passportScore =
    document.getElementById(
        "passportScore"
    );

const scoreTrend =
    document.getElementById(
        "scoreTrend"
    );

const profitScore =
    document.getElementById(
        "profitScore"
    );

const peopleScore =
    document.getElementById(
        "peopleScore"
    );

const planetScore =
    document.getElementById(
        "planetScore"
    );

const marketplaceHealthScore =
    document.getElementById(
        "marketplaceHealthScore"
    );


/* =========================================================
   FINANCIAL ELEMENT
   ========================================================= */

const monthlyRevenue =
    document.getElementById(
        "monthlyRevenue"
    );

const cogs =
    document.getElementById(
        "cogs"
    );

const operatingExpenses =
    document.getElementById(
        "operatingExpenses"
    );

const estimatedProfit =
    document.getElementById(
        "estimatedProfit"
    );

const estimatedMargin =
    document.getElementById(
        "estimatedMargin"
    );

const targetProfit =
    document.getElementById(
        "targetProfit"
    );


/* =========================================================
   DETAIL SECTION
   ========================================================= */

const scoreHistory =
    document.getElementById(
        "scoreHistory"
    );

const recommendationList =
    document.getElementById(
        "recommendationList"
    );

const healthCheck =
    document.getElementById(
        "healthCheck"
    );

const alertsList =
    document.getElementById(
        "alertsList"
    );

const actionPlan =
    document.getElementById(
        "actionPlan"
    );

const viewMarketplaceButton =
    document.getElementById(
        "viewMarketplaceButton"
    );

const actionPlanButton =
    document.getElementById(
        "actionPlanButton"
    );

const actionPlanProgressButton =
    document.getElementById(
        "actionPlanProgressButton"
    );

const statusSummaryButton =
    document.getElementById(
        "statusSummaryButton"
    );

/* =========================================================
   FORMAT RUPIAH
   ========================================================= */

function formatRupiah(value) {

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

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(number);
}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(
    value,
    digits = 1
) {

    if (
        value === null ||
        value === undefined ||
        value === "" ||
        Number.isNaN(Number(value))
    ) {
        return "-";
    }

    return Number(value).toLocaleString(
        "id-ID",
        {
            minimumFractionDigits:
                digits,

            maximumFractionDigits:
                digits
        }
    );
}


/* =========================================================
   FORMAT SCORE
   ========================================================= */

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


/* =========================================================
   FORMAT DATE
   ========================================================= */

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
        return String(value);
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


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   STATUS CLASS
   ========================================================= */

function statusClass(value) {

    const normalized =
        String(value || "")
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );

    return `status-${normalized}`;
}


/* =========================================================
   LOADING
   ========================================================= */

function renderLoading(
    element,
    text
) {

    if (!element) {
        return;
    }

    element.innerHTML = `

        <div class="loading-state">

            <div>

                <div class="loading-spinner"></div>

                <p>
                    ${escapeHTML(text)}
                </p>

            </div>

        </div>

    `;
}


/* =========================================================
   ERROR
   ========================================================= */

function renderError(
    element,
    message
) {

    if (!element) {
        return;
    }

    element.innerHTML = `

        <div class="empty-state">

            <h3>
                Data belum tersedia
            </h3>

            <p>
                ${escapeHTML(
                    message ||
                    "Data belum dapat dimuat."
                )}
            </p>

        </div>

    `;
}


/* =========================================================
   SELECT BUSINESS
   ========================================================= */

function selectBusiness(
    businessId
) {

    if (!businessId) {

        console.error(
            "BUSINESS ID TIDAK VALID"
        );

        return;
    }

    currentBusinessId =
        String(
            businessId
        );

    localStorage.setItem(
        "selected_business_id",
        currentBusinessId
    );

    localStorage.setItem(
        "last_business_id",
        currentBusinessId
    );

    console.log(
        "BUSINESS AKTIF:",
        currentBusinessId
    );
}


/* =========================================================
   API HELPER
   ========================================================= */

async function fetchDashboardEndpoint(
    path
) {

    const response =
        await fetch(
            `${API_URL}${path}`,
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


    let data = {};

    try {

        data =
            await response.json();

    } catch (error) {

        data = {};

    }


    /* =========================================
       AUTH ERROR
       ========================================= */

    if (
        response.status === 401
    ) {

        console.error(
            "SESSION EXPIRED"
        );

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

        throw new Error(
            "Sesi login sudah berakhir."
        );
    }


    /* =========================================
       API ERROR
       ========================================= */

    if (!response.ok) {

        const message =
            data.detail ||
            data.message ||
            `Gagal mengambil data (${response.status}).`;

        const error =
            new Error(
                message
            );

        error.status =
            response.status;

        throw error;
    }


    return data;
}


/* =========================================================
   LOAD ALL BUSINESSES
   ========================================================= */

async function loadBusinesses() {

    console.log("");
    console.log(
        "================================="
    );

    console.log(
        "MEMUAT SEMUA BISNIS"
    );

    console.log(
        "================================="
    );


    if (!businessList) {

        console.error(
            "businessList TIDAK DITEMUKAN"
        );

        return;
    }


    renderLoading(
        businessList,
        "Memuat bisnis..."
    );


    try {

        const response =
            await fetch(
                `${API_URL}/businesses`,
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


        const data =
            await response.json();


        console.log(
            "STATUS GET BUSINESSES:",
            response.status
        );

        console.log(
            "RESPONSE ALL BUSINESSES:",
            data
        );


        /* =========================================
           AUTH ERROR
           ========================================= */

        if (
            response.status === 401
        ) {

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

            return;
        }


        /* =========================================
           API ERROR
           ========================================= */

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Gagal mengambil daftar bisnis."
            );
        }


        /* =========================================
           NORMALISASI DATA
           ========================================= */

        let businesses = [];

        if (
            Array.isArray(data)
        ) {

            businesses =
                data;

        } else if (
            Array.isArray(
                data.businesses
            )
        ) {

            businesses =
                data.businesses;
        }


        console.log(
            "JUMLAH BISNIS:",
            businesses.length
        );


        /* =========================================
           AMBIL DASHBOARD PASSPORT
           UNTUK SETIAP BISNIS
           ========================================= */

        businesses =
            await Promise.all(

                businesses.map(
                    async function (
                        business
                    ) {

                        try {

                            const dashboardData =
                                await fetchDashboardEndpoint(
                                    `/dashboard/${encodeURIComponent(
                                        business.id
                                    )}`
                                );


                            console.log(
                                `PASSPORT BISNIS ${business.id}:`,
                                dashboardData
                            );


                            return {

                                ...business,

                                passport:
                                    dashboardData.passport ||
                                    business.passport ||
                                    null
                            };


                        } catch (error) {

                            console.warn(
                                `Passport bisnis ${business.id} belum dapat dimuat:`,
                                error
                            );


                            return {

                                ...business,

                                passport:
                                    business.passport ||
                                    null
                            };
                        }
                    }
                )
            );


        /* =========================================
           TOTAL BUSINESS
           ========================================= */

        if (totalBusiness) {

            totalBusiness.textContent =
                businesses.length;
        }


        /* =========================================
           STATISTIK PASSPORT
           ========================================= */

        let passportCount = 0;

        let totalScore = 0;

        let scoreCount = 0;


        businesses.forEach(
            function (
                business
            ) {

                const passport =
                    business.passport ||
                    {};

                const score =
                    passport.score;


                if (
                    score !== null &&
                    score !== undefined &&
                    score !== "" &&
                    !Number.isNaN(
                        Number(score)
                    )
                ) {

                    passportCount++;

                    totalScore +=
                        Number(score);

                    scoreCount++;
                }
            }
        );


        if (activePassport) {

            activePassport.textContent =
                passportCount;
        }


        if (averageScore) {

            averageScore.textContent =
                scoreCount > 0
                    ? formatScore(
                        totalScore /
                        scoreCount
                    )
                    : "-";
        }


        /* =========================================
           JIKA TIDAK ADA BISNIS
           ========================================= */

        if (
            businesses.length === 0
        ) {

            currentBusinessId =
                null;


            localStorage.removeItem(
                "selected_business_id"
            );


            businessList.innerHTML = `

                <div class="empty-state">

                    <h3>
                        Belum ada bisnis
                    </h3>

                    <p>
                        Tambahkan bisnis pertama kamu
                        untuk mulai membuat Economic Passport.
                    </p>

                    <button
                        type="button"
                        class="empty-add-button"
                        id="emptyAddBusiness"
                    >
                        + Tambah Bisnis
                    </button>

                </div>

            `;


            const emptyButton =
                document.getElementById(
                    "emptyAddBusiness"
                );


            if (emptyButton) {

                emptyButton.addEventListener(
                    "click",
                    function () {

                        window.location.href =
                            "add-business.html";
                    }
                );
            }


            if (activePassport) {

                activePassport.textContent =
                    "0";
            }


            if (averageScore) {

                averageScore.textContent =
                    "-";
            }


            return;
        }


        /* =========================================
           CEK BUSINESS AKTIF
           ========================================= */

        const exists =
            businesses.some(
                function (
                    business
                ) {

                    return String(
                        business.id
                    ) === String(
                        currentBusinessId
                    );
                }
            );


        if (!exists) {

            currentBusinessId =
                String(
                    businesses[0].id
                );
        }


        selectBusiness(
            currentBusinessId
        );


        /* =========================================
           RENDER BUSINESS LIST
           ========================================= */

        renderBusinessList(
            businesses
        );


        /* =========================================
           LOAD DASHBOARD AKTIF
           ========================================= */

        await loadSelectedBusinessDashboard();


    } catch (error) {

        console.error(
            "ERROR LOAD BUSINESSES:",
            error
        );


        businessList.innerHTML = `

            <div class="error-state">

                <h3>
                    Gagal memuat bisnis
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

                <button
                    type="button"
                    id="retryBusinessButton"
                >
                    Coba Lagi
                </button>

            </div>

        `;


        const retryButton =
            document.getElementById(
                "retryBusinessButton"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                function () {

                    loadBusinesses();
                }
            );
        }
    }
}


/* =========================================================
   RENDER BUSINESS LIST
   ========================================================= */

function renderBusinessList(
    businesses
) {

    if (!businessList) {
        return;
    }


    businessList.innerHTML = "";


    businesses.forEach(
        function (
            business
        ) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "business-card";


            card.dataset.businessId =
                business.id;


            const name =
                business.business_name ||
                "Tanpa Nama";


            const category =
                business.business_category ||
                "Kategori belum tersedia";


            const size =
                business.business_size ||
                "-";


            const product =
                business.product_category ||
                "-";


            const marketplace =
                business.primary_marketplace ||
                "-";


            const city =
                business.seller_city ||
                "-";


            const passport =
                business.passport ||
                {};


            const rawScore =
                passport.score;


            const hasScore =
                rawScore !== null &&
                rawScore !== undefined &&
                rawScore !== "" &&
                !Number.isNaN(
                    Number(rawScore)
                );


            const score =
                hasScore
                    ? Number(rawScore)
                    : null;


            const scoreText =
                hasScore
                    ? formatScore(score)
                    : "-";


            const status =
                passport.status ||
                "Belum Dinilai";


            /* =========================================
               STATUS CLASS
               ========================================= */

            let passportStatusClass =
                "not-assessed";


            if (
                status === "Excellent"
            ) {

                passportStatusClass =
                    "excellent";

            } else if (
                status === "Good"
            ) {

                passportStatusClass =
                    "good";

            } else if (
                status === "Needs Improvement"
            ) {

                passportStatusClass =
                    "needs-improvement";

            } else if (
                status === "At Risk"
            ) {

                passportStatusClass =
                    "at-risk";

            } else if (
                status === "Critical"
            ) {

                passportStatusClass =
                    "at-risk";
            }


            /* =========================================
               SCORE CLASS
               ========================================= */

            let scoreClass =
                "score-empty";


            if (hasScore) {

                if (score >= 80) {

                    scoreClass =
                        "score-excellent";

                } else if (score >= 65) {

                    scoreClass =
                        "score-good";

                } else if (score >= 50) {

                    scoreClass =
                        "score-warning";

                } else {

                    scoreClass =
                        "score-danger";
                }
            }


            /* =========================================
               CARD HTML
               ========================================= */

            card.innerHTML = `

                <div class="business-card-header">

                    <div class="business-title">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <p>
                            ${escapeHTML(category)}
                        </p>

                    </div>


                    <div
                        class="business-score ${scoreClass}"
                    >

                        <span>
                            Passport Score
                        </span>

                        <strong>
                            ${scoreText}
                        </strong>

                        ${
                            hasScore
                                ? `<small>/ 100</small>`
                                : ""
                        }

                    </div>

                </div>


                <div class="business-status">

                    <span>
                        Status Passport
                    </span>

                    <strong
                        class="${passportStatusClass}"
                    >
                        ${escapeHTML(status)}
                    </strong>

                </div>


                <div class="business-info">

                    <div class="business-info-item">

                        <span>
                            Skala
                        </span>

                        <strong>
                            ${escapeHTML(size)}
                        </strong>

                    </div>


                    <div class="business-info-item">

                        <span>
                            Produk
                        </span>

                        <strong>
                            ${escapeHTML(product)}
                        </strong>

                    </div>


                    <div class="business-info-item">

                        <span>
                            Marketplace
                        </span>

                        <strong>
                            ${escapeHTML(marketplace)}
                        </strong>

                    </div>


                    <div class="business-info-item">

                        <span>
                            Kota
                        </span>

                        <strong>
                            ${escapeHTML(city)}
                        </strong>

                    </div>

                </div>


               <div class="business-actions">

                <button
                    type="button"
                    class="business-action passport-action"
                    data-id="${business.id}"
                >
                    Lihat Passport
                </button>


                <button
                    type="button"
                    class="business-action financial-action"
                    data-id="${business.id}"
                >
                    Lengkapi Data
                </button>


                <button
                    type="button"
                    class="business-action marketplace-action"
                    data-id="${business.id}"
                >
                    Marketplace
                </button>


                <button
                    type="button"
                    class="business-action recommendation-action"
                    data-id="${business.id}"
                >
                    Recommendations
                </button>


                <button
                    type="button"
                    class="business-action delete-action"
                    data-id="${business.id}"
                >
                    Hapus
                </button>

            </div>

            `;


            businessList.appendChild(
                card
            );
        }
    );


    attachBusinessButtons();
}


/* =========================================================
   BUSINESS BUTTON EVENTS
   ========================================================= */

function attachBusinessButtons() {


    /* =========================================
       PASSPORT
       ========================================= */

    document
        .querySelectorAll(
            ".passport-action"
        )
        .forEach(
            function (
                button
            ) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.id;


                        console.log(
                            "LIHAT PASSPORT:",
                            id
                        );


                        selectBusiness(
                            id
                        );


                        window.location.href =
                            `passport.html?business_id=${encodeURIComponent(id)}`;
                    }
                );
            }
        );


    /* =========================================
       FINANCIAL
       ========================================= */

    document
        .querySelectorAll(
            ".financial-action"
        )
        .forEach(
            function (
                button
            ) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.id;


                        console.log(
                            "LENGKAPI DATA:",
                            id
                        );


                        selectBusiness(
                            id
                        );


                        window.location.href =
                            `financial.html?business_id=${encodeURIComponent(id)}`;
                    }
                );
            }
        );


    /* =========================================
       MARKETPLACE
       ========================================= */

    document
        .querySelectorAll(
            ".marketplace-action"
        )
        .forEach(
            function (
                button
            ) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.id;


                        console.log(
                            "MARKETPLACE:",
                            id
                        );


                        selectBusiness(
                            id
                        );


                        window.location.href =
                            `marketplace.html?business_id=${encodeURIComponent(id)}`;
                    }
                );
            }
        );


    /* =========================================
       DELETE
       ========================================= */

    document
        .querySelectorAll(
            ".delete-action"
        )
        .forEach(
            function (
                button
            ) {

                button.addEventListener(
                    "click",
                    async function () {

                        const id =
                            this.dataset.id;


                        const card =
                            this.closest(
                                ".business-card"
                            );


                        const businessName =
                            card
                                ?.querySelector(
                                    "h3"
                                )
                                ?.textContent ||
                            "bisnis ini";


                        const confirmed =
                            confirm(
                                `Hapus ${businessName}?`
                            );


                        if (!confirmed) {
                            return;
                        }


                        button.disabled =
                            true;


                        button.textContent =
                            "Menghapus...";


                        try {

                            const response =
                                await fetch(
                                    `${API_URL}/businesses/${id}`,
                                    {
                                        method:
                                            "DELETE",

                                        headers: {
                                            "Authorization":
                                                `Bearer ${token}`,

                                            "Content-Type":
                                                "application/json"
                                        }
                                    }
                                );


                            let data = {};

                            try {

                                data =
                                    await response.json();

                            } catch (
                                error
                            ) {

                                data = {};
                            }


                            console.log(
                                "STATUS DELETE:",
                                response.status
                            );


                            if (
                                !response.ok
                            ) {

                                throw new Error(
                                    data.detail ||
                                    "Gagal menghapus bisnis."
                                );
                            }


                            if (
                                String(
                                    currentBusinessId
                                ) ===
                                String(id)
                            ) {

                                localStorage.removeItem(
                                    "selected_business_id"
                                );
                            }


                            await loadBusinesses();


                        } catch (
                            error
                        ) {

                            console.error(
                                "ERROR DELETE:",
                                error
                            );


                            alert(
                                error.message
                            );


                            button.disabled =
                                false;


                            button.textContent =
                                "Hapus";
                        }
                    }
                );
            }
        );
}


/* =========================================================
   LOAD DETAIL DASHBOARD
   ========================================================= */

async function loadDashboardDetails() {

    if (!currentBusinessId) {

        console.warn(
            "BELUM ADA BUSINESS AKTIF"
        );

        return;
    }


    const id =
        encodeURIComponent(
            currentBusinessId
        );


    console.log(
        "================================="
    );

    console.log(
        "LOAD DETAIL DASHBOARD"
    );

    console.log(
        "BUSINESS ID:",
        currentBusinessId
    );

    console.log(
        "================================="
    );


    /* =========================================
       LOADING
       ========================================= */

    renderLoading(
        scoreHistory,
        "Memuat riwayat score..."
    );


    renderLoading(
        recommendationList,
        "Memuat rekomendasi marketplace..."
    );


    renderLoading(
        healthCheck,
        "Memeriksa kondisi bisnis..."
    );


    renderLoading(
        alertsList,
        "Memuat business alerts..."
    );


    renderLoading(
        actionPlan,
        "Memuat action plan..."
    );


    /* =========================================
       SEMUA ENDPOINT DASHBOARD
       ========================================= */

    const results =
        await Promise.allSettled([

            fetchDashboardEndpoint(
                `/dashboard/${id}/score-history`
            ),

            fetchDashboardEndpoint(
                `/dashboard/${id}/recommendations`
            ),

            fetchDashboardEndpoint(
                `/dashboard/${id}/health-check`
            ),

            fetchDashboardEndpoint(
                `/dashboard/${id}/alerts`
            ),

            fetchDashboardEndpoint(
                `/dashboard/${id}/action-plan`
            ),

            fetchDashboardEndpoint(
                `/passport/${id}/marketplace-recommendation`
            )

        ]);


    /* =========================================
       SCORE HISTORY
       ========================================= */

    if (
        results[0].status ===
        "fulfilled"
    ) {

        console.log(
            "SCORE HISTORY:",
            results[0].value
        );


        renderScoreHistory(
            results[0].value
        );

    } else {

        console.error(
            "ERROR SCORE HISTORY:",
            results[0].reason
        );


        renderError(
            scoreHistory,
            results[0].reason?.message
        );
    }


    /* =========================================
       RECOMMENDATIONS
       ========================================= */

    if (
        results[1].status ===
        "fulfilled"
    ) {

        console.log(
            "RECOMMENDATIONS:",
            results[1].value
        );


        renderRecommendations(
            results[1].value
        );

    } else {

        console.error(
            "ERROR RECOMMENDATIONS:",
            results[1].reason
        );


        renderError(
            recommendationList,
            results[1].reason?.message
        );
    }


    /* =========================================
       HEALTH CHECK
       ========================================= */

    if (
        results[2].status ===
        "fulfilled"
    ) {

        console.log(
            "HEALTH CHECK:",
            results[2].value
        );


        renderHealthCheck(
            results[2].value
        );

    } else {

        console.error(
            "ERROR HEALTH CHECK:",
            results[2].reason
        );


        renderError(
            healthCheck,
            results[2].reason?.message
        );
    }


    /* =========================================
       ALERTS
       ========================================= */

    if (
        results[3].status ===
        "fulfilled"
    ) {

        console.log(
            "BUSINESS ALERTS:",
            results[3].value
        );


        renderAlerts(
            results[3].value
        );

    } else {

        console.error(
            "ERROR ALERTS:",
            results[3].reason
        );


        renderError(
            alertsList,
            results[3].reason?.message
        );
    }


    /* =========================================
       ACTION PLAN
       ========================================= */

    if (
        results[4].status ===
        "fulfilled"
    ) {

        console.log(
            "ACTION PLAN:",
            results[4].value
        );


        renderActionPlan(
            results[4].value
        );

    } else {

        console.error(
            "ERROR ACTION PLAN:",
            results[4].reason
        );


        renderError(
            actionPlan,
            results[4].reason?.message
        );
    }


    /* =========================================
       MARKETPLACE RECOMMENDATION
       ========================================= */

    if (
        results[5].status ===
        "fulfilled"
    ) {

        console.log(
            "MARKETPLACE RECOMMENDATION:",
            results[5].value
        );


        renderMarketplaceRecommendation(
            results[5].value
        );

    } else {

        console.error(
            "ERROR MARKETPLACE:",
            results[5].reason
        );
    }
}


/* =========================================================
   SCORE HISTORY
   ========================================================= */

function renderScoreHistory(
    data
) {

    if (!scoreHistory) {
        return;
    }


    const history =
        Array.isArray(
            data.history
        )
            ? data.history
            : Array.isArray(
                data.score_history
            )
                ? data.score_history
                : [];


    if (
        history.length === 0
    ) {

        scoreHistory.innerHTML = `

            <div class="empty-state">

                <h3>
                    Belum ada riwayat score
                </h3>

                <p>
                    Riwayat score akan muncul
                    setelah assessment dilakukan.
                </p>

            </div>

        `;

        return;
    }


    const summary =
        data.summary ||
        {};


    const latestScore =
        summary.latest_score ??
        history[
            history.length - 1
        ]?.business_score ??
        history[
            history.length - 1
        ]?.overall_score ??
        history[
            history.length - 1
        ]?.score;


    const firstScore =
        summary.first_score ??
        history[0]?.business_score ??
        history[0]?.overall_score ??
        history[0]?.score;


    const change =
        summary.change;


    let trendText =
        "First Assessment";


    if (
        summary.trend ===
        "Improving"
    ) {

        trendText =
            `↑ Naik ${formatNumber(
                Math.abs(change),
                1
            )} poin`;

    } else if (
        summary.trend ===
        "Declining"
    ) {

        trendText =
            `↓ Turun ${formatNumber(
                Math.abs(change),
                1
            )} poin`;

    } else if (
        summary.trend ===
        "Stable"
    ) {

        trendText =
            "→ Tidak berubah";
    }


    const historyHTML =
        history
            .slice()
            .reverse()
            .map(
                function (
                    item,
                    index
                ) {

                    const score =
                        item.business_score ??
                        item.overall_score ??
                        item.score;


                    const date =
                        item.date ??
                        item.created_at ??
                        item.assessed_at;


                    const currentIndex =
                        history.length -
                        1 -
                        index;


                    const previous =
                        currentIndex > 0
                            ? history[
                                currentIndex - 1
                            ]
                            : null;


                    let itemChange =
                        "Assessment";


                    if (previous) {

                        const previousScore =
                            previous.business_score ??
                            previous.overall_score ??
                            previous.score;


                        const diff =
                            Number(score) -
                            Number(previousScore);


                        if (
                            diff > 0
                        ) {

                            itemChange =
                                `↑ ${formatNumber(
                                    diff,
                                    1
                                )} poin`;

                        } else if (
                            diff < 0
                        ) {

                            itemChange =
                                `↓ ${formatNumber(
                                    Math.abs(diff),
                                    1
                                )} poin`;

                        } else {

                            itemChange =
                                "→ Tidak berubah";
                        }
                    }


                    return `

                        <div class="history-item">

                            <div>

                                <div class="history-date">

                                    ${escapeHTML(
                                        formatDate(
                                            date
                                        )
                                    )}

                                </div>

                                <div class="history-change">

                                    ${escapeHTML(
                                        itemChange
                                    )}

                                </div>

                            </div>


                            <div class="history-score">

                                ${formatScore(
                                    score
                                )}

                            </div>

                        </div>

                    `;
                }
            )
            .join("");


    scoreHistory.innerHTML = `

        <div
            style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:15px;
                margin-bottom:12px;
            "
        >

            <div>

                <strong
                    style="
                        font-size:13px;
                        color:#172033;
                    "
                >
                    ${
                        summary.total_records ||
                        history.length
                    }
                    Assessment
                </strong>

                <p
                    style="
                        margin-top:4px;
                        font-size:11px;
                        color:#6b7280;
                    "
                >
                    ${escapeHTML(
                        trendText
                    )}
                </p>

            </div>


            <div
                style="
                    text-align:right;
                "
            >

                <span
                    style="
                        display:block;
                        font-size:9px;
                        color:#6b7280;
                    "
                >
                    Score terbaru
                </span>

                <strong
                    style="
                        font-size:21px;
                        color:#1f4e79;
                    "
                >
                    ${formatScore(
                        latestScore
                    )}
                </strong>

            </div>

        </div>


        <div class="history-summary">

            <div>

                <span>
                    Score Awal
                </span>

                <strong>
                    ${formatScore(
                        firstScore
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Perubahan
                </span>

                <strong>
                    ${
                        change === null ||
                        change === undefined
                            ? "-"
                            : Number(change) > 0
                                ? `↑ ${formatNumber(
                                    change,
                                    1
                                )}`
                                : Number(change) < 0
                                    ? `↓ ${formatNumber(
                                        Math.abs(change),
                                        1
                                    )}`
                                    : "0"
                    }
                </strong>

            </div>

        </div>


        <div class="history-list">

            ${historyHTML}

        </div>

    `;
}


/* =========================================================
   RECOMMENDATIONS
   ========================================================= */

function renderRecommendations(
    data
) {

    if (!recommendationList) {
        return;
    }


    const recommendations =
        Array.isArray(
            data.recommendations
        )
            ? data.recommendations
            : [];


    if (
        recommendations.length === 0
    ) {

        recommendationList.innerHTML = `

            <div class="empty-state">

                <h3>
                    Belum ada rekomendasi
                </h3>

                <p>
                    Tidak ada rekomendasi bisnis
                    yang tersedia saat ini.
                </p>

            </div>

        `;

        return;
    }


    const top =
        data.top_recommendation ||
        recommendations[0] ||
        {};


    const recommendationsHTML =
        recommendations
            .map(
                function (
                    item,
                    index
                ) {

                    const title =
                        item.title ||
                        "Rekomendasi";


                    const description =
                        item.description ||
                        item.recommendation ||
                        item.problem ||
                        "-";


                    const action =
                        item.action ||
                        "-";


                    const score =
                        item.score;


                    const priority =
                        item.priority ||
                        item.severity ||
                        "Low";


                    return `

                        <div
                            class="recommendation-card"
                        >

                            <div
                                class="recommendation-rank"
                            >
                                ${
                                    item.priority_rank ||
                                    index + 1
                                }
                            </div>


                            <div
                                class="recommendation-info"
                            >

                                <h3>
                                    ${escapeHTML(
                                        title
                                    )}
                                </h3>


                                <p>
                                    ${escapeHTML(
                                        description
                                    )}
                                </p>


                                <p
                                    style="
                                        margin-top:7px;
                                    "
                                >

                                    <strong>
                                        Tindakan:
                                    </strong>

                                    ${escapeHTML(
                                        action
                                    )}

                                </p>


                                <span
                                    class="health-status"
                                >
                                    ${escapeHTML(
                                        priority
                                    )}
                                </span>

                            </div>


                            <div
                                class="recommendation-score"
                            >

                                <span>
                                    Score
                                </span>

                                <strong>
                                    ${formatScore(
                                        score
                                    )}
                                </strong>

                            </div>

                        </div>

                    `;
                }
            )
            .join("");


    recommendationList.innerHTML = `

        <div
            style="
                margin-bottom:12px;
                padding:14px;
                background:#f8fafc;
                border-radius:12px;
            "
        >

            <span
                style="
                    display:block;
                    font-size:10px;
                    color:#6b7280;
                    margin-bottom:4px;
                "
            >
                Prioritas Utama
            </span>

            <strong
                style="
                    font-size:15px;
                    color:#172033;
                "
            >
                ${escapeHTML(
                    top.title ||
                    "Rekomendasi utama"
                )}
            </strong>

        </div>


        ${recommendationsHTML}

    `;
}


/* =========================================================
   MARKETPLACE RECOMMENDATION
   ========================================================= */

function renderMarketplaceRecommendation(
    data
) {

    if (!recommendationList) {
        return;
    }


    /*
     * Backend memiliki dua bentuk response
     * yang sudah pernah digunakan:
     *
     * 1. recommendation + alternatives
     * 2. best_match + marketplaces
     *
     * Fungsi ini mendukung keduanya.
     */


    const best =
        data.recommendation ||
        data.best_match ||
        {};


    let alternatives = [];


    if (
        Array.isArray(
            data.alternatives
        )
    ) {

        alternatives =
            data.alternatives;

    } else if (
        Array.isArray(
            data.marketplaces
        )
    ) {

        alternatives =
            data.marketplaces.slice(1);

    } else if (
        Array.isArray(
            data.all_marketplaces
        )
    ) {

        alternatives =
            data.all_marketplaces.slice(1);
    }


    if (
        !best.marketplace
    ) {

        renderError(
            recommendationList,
            "Belum ada rekomendasi marketplace."
        );

        return;
    }


    const bestScore =
        best.score ??
        best.compatibility_score;


    const bestLevel =
        best.level ||
        "-";


    const reason =
        best.reason ||
        best.recommendation ||
        "Marketplace direkomendasikan berdasarkan score bisnis.";


    const weakestFactor =
        best.weakest_factor ||
        "-";


    const alternativeHTML =
        alternatives
            .slice(0, 3)
            .map(
                function (
                    item,
                    index
                ) {

                    const score =
                        item.score ??
                        item.compatibility_score;


                    return `

                        <div
                            class="recommendation-card"
                        >

                            <div
                                class="recommendation-rank"
                            >
                                ${index + 2}
                            </div>


                            <div
                                class="recommendation-info"
                            >

                                <h3>
                                    ${escapeHTML(
                                        item.marketplace ||
                                        "Marketplace"
                                    )}
                                </h3>


                                <p>
                                    ${escapeHTML(
                                        item.reason ||
                                        item.recommendation ||
                                        item.level ||
                                        "Alternatif marketplace"
                                    )}
                                </p>


                                ${
                                    item.level
                                        ? `
                                            <span
                                                class="health-status"
                                            >
                                                ${escapeHTML(
                                                    item.level
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>


                            <div
                                class="recommendation-score"
                            >

                                <span>
                                    Compatibility
                                </span>

                                <strong>
                                    ${formatScore(
                                        score
                                    )}
                                    / 100
                                </strong>

                            </div>

                        </div>

                    `;
                }
            )
            .join("");


    recommendationList.innerHTML = `

        <div
            class="recommendation-card"
        >

            <div
                class="recommendation-rank"
            >
                1
            </div>


            <div
                class="recommendation-info"
            >

                <h3>
                    ${escapeHTML(
                        best.marketplace
                    )}
                </h3>


                <p>
                    ${escapeHTML(
                        reason
                    )}
                </p>


                <p
                    style="
                        margin-top:7px;
                    "
                >

                    <strong>
                        Faktor terlemah:
                    </strong>

                    ${escapeHTML(
                        weakestFactor
                    )}

                </p>


                <span
                    class="health-status"
                >
                    ${escapeHTML(
                        bestLevel
                    )}
                </span>

            </div>


            <div
                class="recommendation-score"
            >

                <span>
                    Compatibility
                </span>

                <strong>
                    ${formatScore(
                        bestScore
                    )}
                    / 100
                </strong>

            </div>

        </div>


        ${alternativeHTML}

    `;
}


/* =========================================================
   HEALTH CHECK
   ========================================================= */

function renderHealthCheck(
    data
) {

    if (!healthCheck) {
        return;
    }


    const overall =
        data.overall ||
        {};


    const areas =
        data.areas ||
        {};


    const labels = {

        profit:
            "Profit",

        people:
            "People",

        planet:
            "Planet",

        marketplace:
            "Marketplace"

    };


    const cards =
        Object.keys(labels)
            .map(
                function (
                    key
                ) {

                    const area =
                        areas[key] ||
                        {};


                    return `

                        <div
                            class="health-item"
                        >

                            <h3>
                                ${labels[key]}
                            </h3>


                            <p>
                                Score:

                                <strong>
                                    ${formatScore(
                                        area.score
                                    )}
                                </strong>

                                / 100
                            </p>


                            <span
                                class="health-status ${statusClass(
                                    area.status
                                )}"
                            >
                                ${escapeHTML(
                                    area.status ||
                                    "-"
                                )}
                            </span>

                        </div>

                    `;
                }
            )
            .join("");


    const strongest =
        data.strongest_area ||
        {};


    const weakest =
        data.weakest_area ||
        {};


    healthCheck.innerHTML = `

        <div
            style="
                grid-column:1/-1;
                padding:17px;
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:13px;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:15px;
                "
            >

                <div>

                    <strong
                        style="
                            font-size:16px;
                            color:#172033;
                        "
                    >
                        ${escapeHTML(
                            overall.health_status ||
                            "-"
                        )}
                    </strong>


                    <p
                        style="
                            margin-top:5px;
                            font-size:11px;
                            line-height:1.5;
                            color:#6b7280;
                        "
                    >
                        ${escapeHTML(
                            overall.message ||
                            ""
                        )}
                    </p>

                </div>


                <strong
                    style="
                        font-size:22px;
                        color:#1f4e79;
                    "
                >
                    ${formatScore(
                        overall.score
                    )}
                </strong>

            </div>

        </div>


        ${cards}


        <div
            style="
                grid-column:1/-1;
                display:grid;
                grid-template-columns:
                    repeat(2,1fr);
                gap:10px;
            "
        >

            <div
                class="health-item"
            >

                <h3>
                    Area Terkuat
                </h3>

                <p>

                    ${escapeHTML(
                        strongest.category ||
                        "-"
                    )}

                    ·

                    ${formatScore(
                        strongest.score
                    )}

                </p>

            </div>


            <div
                class="health-item"
            >

                <h3>
                    Area Terlemah
                </h3>

                <p>

                    ${escapeHTML(
                        weakest.category ||
                        "-"
                    )}

                    ·

                    ${formatScore(
                        weakest.score
                    )}

                </p>

            </div>

        </div>

    `;
}


/* =========================================================
   ALERTS
   ========================================================= */

function renderAlerts(
    data
) {

    if (!alertsList) {
        return;
    }


    const alerts =
        Array.isArray(
            data.alerts
        )
            ? data.alerts
            : [];


    if (
        alerts.length === 0
    ) {

        alertsList.innerHTML = `

            <div
                class="alert-card"
            >

                <div
                    class="alert-icon"
                >
                    OK
                </div>


                <div
                    class="alert-content"
                >

                    <h3>
                        Tidak ada peringatan
                    </h3>

                    <p>
                        Bisnis tidak memiliki
                        alert berdasarkan kondisi
                        Economic Passport saat ini.
                    </p>

                </div>

            </div>

        `;

        return;
    }


    alertsList.innerHTML =

        alerts
            .map(
                function (
                    alert
                ) {

                    let scoreText =
                        "";


                    if (
                        alert.score !==
                        undefined
                    ) {

                        scoreText =
                            `Score: ${formatScore(
                                alert.score
                            )}`;

                    } else if (
                        alert.current_margin !==
                        undefined
                    ) {

                        scoreText =
                            `Margin: ${formatNumber(
                                alert.current_margin,
                                2
                            )}% / Target ${formatNumber(
                                alert.target_margin,
                                2
                            )}%`;

                    } else if (
                        alert.current_cost !==
                        undefined
                    ) {

                        scoreText =
                            `Biaya saat ini: ${formatNumber(
                                alert.current_cost,
                                2
                            )}% / Batas ${formatNumber(
                                alert.maximum_cost,
                                2
                            )}%`;

                    } else if (
                        alert.return_rate !==
                        undefined
                    ) {

                        scoreText =
                            `Return rate: ${formatNumber(
                                alert.return_rate,
                                2
                            )}%`;
                    }


                    return `

                        <div
                            class="alert-card"
                        >

                            <div
                                class="alert-icon"
                            >
                                !
                            </div>


                            <div
                                class="alert-content"
                            >

                                <h3>
                                    ${escapeHTML(
                                        alert.title ||
                                        alert.type ||
                                        "Business Alert"
                                    )}
                                </h3>


                                <p>
                                    ${escapeHTML(
                                        alert.message ||
                                        "Perlu diperhatikan."
                                    )}
                                </p>


                                <p
                                    style="
                                        margin-top:7px;
                                    "
                                >

                                    <strong>
                                        ${escapeHTML(
                                            alert.severity ||
                                            "Notice"
                                        )}
                                    </strong>

                                    ·

                                    ${escapeHTML(
                                        alert.category ||
                                        "General"
                                    )}

                                    ${
                                        scoreText
                                            ? ` · ${escapeHTML(
                                                scoreText
                                            )}`
                                            : ""
                                    }

                                </p>

                            </div>

                        </div>

                    `;
                }
            )
            .join("");
}


/* =========================================================
   ACTION PLAN
   ========================================================= */

function renderActionPlan(
    data
) {

    if (!actionPlan) {
        return;
    }


    const actions =
        Array.isArray(
            data.action_plan
        )
            ? data.action_plan
            : Array.isArray(
                data.recommendations
            )
                ? data.recommendations
                : [];


    if (
        actions.length === 0
    ) {

        renderError(
            actionPlan,
            "Belum ada action plan."
        );

        return;
    }


    actionPlan.innerHTML =

        actions
            .map(
                function (
                    item,
                    index
                ) {

                    const number =
                        item.step ||
                        item.priority ||
                        index + 1;


                    return `

                        <div
                            class="action-item"
                        >

                            <div
                                class="action-number"
                            >
                                ${number}
                            </div>


                            <div
                                class="action-content"
                                style="flex:1;"
                            >

                                <div
                                    style="
                                        display:flex;
                                        justify-content:space-between;
                                        gap:10px;
                                        align-items:flex-start;
                                    "
                                >

                                    <h3>
                                        ${escapeHTML(
                                            item.title ||
                                            "Action"
                                        )}
                                    </h3>


                                    <span
                                        class="health-status"
                                    >
                                        ${escapeHTML(
                                            item.severity ||
                                            item.priority ||
                                            "Low"
                                        )}
                                    </span>

                                </div>


                                <p>

                                    <strong>
                                        ${escapeHTML(
                                            item.category ||
                                            "General"
                                        )}
                                    </strong>

                                </p>


                                <p>

                                    <strong>
                                        Masalah:
                                    </strong>

                                    ${escapeHTML(
                                        item.problem ||
                                        "-"
                                    )}

                                </p>


                                <p>

                                    <strong>
                                        Tindakan:
                                    </strong>

                                    ${escapeHTML(
                                        item.action ||
                                        item.recommendation ||
                                        "-"
                                    )}

                                </p>


                                <p>

                                    <strong>
                                        Dampak:
                                    </strong>

                                    ${escapeHTML(
                                        item.expected_impact ||
                                        "-"
                                    )}

                                </p>

                            </div>

                        </div>

                    `;
                }
            )
            .join("");
}


/* =========================================================
   LOAD DASHBOARD BUSINESS AKTIF
   ========================================================= */

async function loadSelectedBusinessDashboard() {

    if (!currentBusinessId) {

        console.warn(
            "BELUM ADA BUSINESS AKTIF"
        );

        return;
    }


    console.log(
        "MEMUAT DASHBOARD BUSINESS:",
        currentBusinessId
    );


    try {

        const data =
            await fetchDashboardEndpoint(
                `/dashboard/${encodeURIComponent(
                    currentBusinessId
                )}`
            );


        console.log(
            "DATA DASHBOARD:",
            data
        );


        renderDashboardData(
            data
        );


        await loadDashboardDetails();


    } catch (
        error
    ) {

        console.error(
            "ERROR LOAD SELECTED DASHBOARD:",
            error
        );


        if (
            dashboardBusinessName
        ) {

            dashboardBusinessName.textContent =
                "Data belum tersedia";
        }


        renderError(
            scoreHistory,
            error.message
        );

        renderError(
            recommendationList,
            error.message
        );

        renderError(
            healthCheck,
            error.message
        );

        renderError(
            alertsList,
            error.message
        );

        renderError(
            actionPlan,
            error.message
        );
    }
}


/* =========================================================
   RENDER DASHBOARD DATA
   ========================================================= */

function renderDashboardData(
    data
) {

    const business =
        data.business ||
        {};


    const passport =
        data.passport ||
        data.passport_data ||
        data.economic_passport ||
        {};


    const financial =
        data.financial ||
        {};


    const scoreChange =
        data.score_change ||
        {};


    /* =========================================
       WELCOME
       ========================================= */

    if (welcome) {

        welcome.textContent =
            `Selamat datang, ${
                business.business_name ||
                "User"
            }`;
    }


    /* =========================================
       BUSINESS OVERVIEW
       ========================================= */

    if (
        dashboardBusinessName
    ) {

        dashboardBusinessName.textContent =
            business.business_name ||
            "-";
    }


    if (
        dashboardBusinessCategory
    ) {

        const category =
            business.business_category ||
            "-";


        const product =
            business.product_category ||
            "-";


        const size =
            business.business_size ||
            "-";


        dashboardBusinessCategory.textContent =
            `${category} · ${product} · ${size}`;
    }


    /* =========================================
       PASSPORT STATUS
       ========================================= */

    if (
        passportStatus
    ) {

        passportStatus.textContent =
            passport.status ||
            "Belum Dinilai";
    }


    /* =========================================
       PASSPORT SCORE
       ========================================= */

    if (
        passportScore
    ) {

        passportScore.textContent =
            formatScore(
                passport.score
            );
    }


    /* =========================================
       SCORE TREND
       ========================================= */

    if (
        scoreTrend
    ) {

        if (
            scoreChange.trend ===
            "First Assessment"
        ) {

            scoreTrend.textContent =
                "First Assessment";

        } else if (
            scoreChange.change !==
            null &&
            scoreChange.change !==
            undefined
        ) {

            const change =
                Number(
                    scoreChange.change
                );


            if (
                change > 0
            ) {

                scoreTrend.textContent =
                    `↑ ${formatNumber(
                        change,
                        1
                    )} poin`;

            } else if (
                change < 0
            ) {

                scoreTrend.textContent =
                    `↓ ${formatNumber(
                        Math.abs(change),
                        1
                    )} poin`;

            } else {

                scoreTrend.textContent =
                    "→ Tidak berubah";
            }

        } else {

            scoreTrend.textContent =
                scoreChange.trend ||
                "-";
        }
    }


    /* =========================================
       SCORE COMPONENTS
       ========================================= */

    if (
        profitScore
    ) {

        profitScore.textContent =
            formatScore(
                passport.profit_score
            );
    }


    if (
        peopleScore
    ) {

        peopleScore.textContent =
            formatScore(
                passport.people_score
            );
    }


    if (
        planetScore
    ) {

        planetScore.textContent =
            formatScore(
                passport.planet_score
            );
    }


    if (
        marketplaceHealthScore
    ) {

        marketplaceHealthScore.textContent =
            formatScore(
                passport.marketplace_health_score
            );
    }


    /* =========================================
       FINANCIAL
       ========================================= */

    if (
        monthlyRevenue
    ) {

        monthlyRevenue.textContent =
            formatRupiah(
                financial.monthly_revenue
            );
    }


    if (
        cogs
    ) {

        cogs.textContent =
            formatRupiah(
                financial.cogs_hpp
            );
    }


    if (
        operatingExpenses
    ) {

        operatingExpenses.textContent =
            formatRupiah(
                financial.operating_expenses
            );
    }


    if (
        estimatedProfit
    ) {

        estimatedProfit.textContent =
            formatRupiah(
                financial.estimated_profit
            );
    }


    if (
        estimatedMargin
    ) {

        estimatedMargin.textContent =

            financial.estimated_margin_percent !==
                null &&
            financial.estimated_margin_percent !==
                undefined

                ? `${formatNumber(
                    financial.estimated_margin_percent,
                    2
                )}%`

                : "-";
    }


    if (
        targetProfit
    ) {

        targetProfit.textContent =
            formatRupiah(
                financial.target_monthly_profit
            );
    }


    /* =========================================
       DEBUG
       ========================================= */

    console.log(
        "PASSPORT SCORE:",
        passport.score
    );

    console.log(
        "PASSPORT STATUS:",
        passport.status
    );

    console.log(
        "PROFIT SCORE:",
        passport.profit_score
    );

    console.log(
        "PEOPLE SCORE:",
        passport.people_score
    );

    console.log(
        "PLANET SCORE:",
        passport.planet_score
    );

    console.log(
        "MARKETPLACE HEALTH:",
        passport.marketplace_health_score
    );

    console.log(
        "FINANCIAL:",
        financial
    );

    console.log(
        "SCORE CHANGE:",
        scoreChange
    );
}


/* =========================================================
   TAMBAH BISNIS
   ========================================================= */

if (
    addBusinessButton
) {

    addBusinessButton.addEventListener(
        "click",
        function () {

            console.log(
                "TAMBAH BISNIS DIKLIK"
            );


            window.location.href =
                "add-business.html";
        }
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

if (
    logoutButton
) {

    logoutButton.addEventListener(
        "click",
        function () {

            console.log(
                "LOGOUT"
            );


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


/* =========================================================
   MARKETPLACE DETAIL BUTTON
   ========================================================= */

if (
    viewMarketplaceButton
) {

    viewMarketplaceButton.addEventListener(
        "click",
        function () {

            if (
                !currentBusinessId
            ) {

                return;
            }


            window.location.href =
                `marketplace.html?business_id=${encodeURIComponent(
                    currentBusinessId
                )}`;
        }
    );
}

/* =========================================================
   SCORE HISTORY NAVIGATION
========================================================= */

const scoreHistoryButton =
    document.getElementById(
        "scoreHistoryButton"
    );


if (scoreHistoryButton) {

    scoreHistoryButton.addEventListener(
        "click",
        function () {

            if (!currentBusinessId) {

                alert(
                    "Silakan pilih bisnis terlebih dahulu."
                );

                return;
            }


            console.log(
                "MEMBUKA SCORE HISTORY:",
                currentBusinessId
            );


            window.location.href =
                `score-history.html?business_id=${encodeURIComponent(
                    currentBusinessId
                )}`;

        }
    );

}

/* =========================================================
   ACTION PLAN NAVIGATION
   ========================================================= */

if (actionPlanButton) {

    actionPlanButton.addEventListener(
        "click",
        function () {

            if (!currentBusinessId) {

                alert(
                    "Silakan pilih bisnis terlebih dahulu."
                );

                return;
            }


            console.log(
                "MEMBUKA ACTION PLAN:",
                currentBusinessId
            );


            window.location.href =
                `action-plan.html?business_id=${encodeURIComponent(
                    currentBusinessId
                )}`;

        }
    );

}

/* =========================================================
   START
   ========================================================= */

console.log(
    "================================="
);

console.log(
    "MEMULAI DASHBOARD..."
);

console.log(
    "BUSINESS ID:",
    currentBusinessId
);

console.log(
    "================================="
);


loadBusinesses();

/* =========================================================
   RECOMMENDATIONS NAVIGATION
   Tambahkan di PALING BAWAH dashboard.js
   ========================================================= */

(function () {

    console.log(
        "Recommendations navigation loaded"
    );


    function openRecommendations(
        businessId
    ) {

        if (!businessId) {

            console.error(
                "Business ID tidak ditemukan."
            );

            alert(
                "Silakan pilih bisnis terlebih dahulu."
            );

            return;
        }


        /* =========================================
           SIMPAN BUSINESS YANG SEDANG DIPILIH
           ========================================= */

        localStorage.setItem(
            "selected_business_id",
            String(businessId)
        );


        localStorage.setItem(
            "last_business_id",
            String(businessId)
        );


        console.log(
            "Membuka Recommendations untuk Business ID:",
            businessId
        );


        /* =========================================
           BUKA HALAMAN RECOMMENDATIONS
           ========================================= */

        window.location.href =
            "recommendations.html?business_id=" +
            encodeURIComponent(
                businessId
            );

    }


    /* =====================================================
       EVENT UNTUK TOMBOL RECOMMENDATIONS
       ===================================================== */

    function setupRecommendationButtons() {

        const buttons =
            document.querySelectorAll(
                ".recommendation-action"
            );


        console.log(
            "Jumlah tombol Recommendations:",
            buttons.length
        );


        buttons.forEach(
            function (button) {

                /* Hindari event listener ganda */

                if (
                    button.dataset.recommendationReady ===
                    "true"
                ) {

                    return;
                }


                button.dataset.recommendationReady =
                    "true";


                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const businessId =
                            this.getAttribute(
                                "data-id"
                            );


                        openRecommendations(
                            businessId
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       SUPPORT UNTUK CARD YANG DIBUAT SECARA DINAMIS
       ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".recommendation-action"
                );


            if (!button) {

                return;
            }


            event.preventDefault();

            event.stopPropagation();


            const businessId =
                button.getAttribute(
                    "data-id"
                );


            openRecommendations(
                businessId
            );

        },
        true
    );


    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            setupRecommendationButtons
        );

    } else {

        setupRecommendationButtons();

    }


    /* =====================================================
       OBSERVER
       Karena card bisnis kamu dibuat setelah API selesai
       ===================================================== */

    const observer =
        new MutationObserver(
            function () {

                setupRecommendationButtons();

            }
        );


    if (document.body) {

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

    }

})();

/* =========================================================
   ACTION PLAN PROGRESS NAVIGATION
   ========================================================= */

if (actionPlanProgressButton) {

    actionPlanProgressButton.addEventListener(
        "click",
        function () {

            console.log(
                "ACTION PLAN PROGRESS BUTTON DIKLIK"
            );


            /* =========================================
               AMBIL BUSINESS ID
               ========================================= */

            const urlParams =
                new URLSearchParams(
                    window.location.search
                );


            const urlBusinessId =
                urlParams.get(
                    "business_id"
                );


            const selectedBusinessId =
                localStorage.getItem(
                    "selected_business_id"
                );


            const lastBusinessId =
                localStorage.getItem(
                    "last_business_id"
                );


            const businessId =
                urlBusinessId ||
                selectedBusinessId ||
                lastBusinessId;


            console.log(
                "ACTION PLAN PROGRESS - BUSINESS ID:",
                businessId
            );


            /* =========================================
               CEK BUSINESS ID
               ========================================= */

            if (!businessId) {

                alert(
                    "Business ID tidak ditemukan. Silakan pilih bisnis terlebih dahulu."
                );

                return;

            }


            /* =========================================
               SIMPAN BUSINESS ID
               ========================================= */

            localStorage.setItem(
                "selected_business_id",
                String(
                    businessId
                )
            );


            localStorage.setItem(
                "last_business_id",
                String(
                    businessId
                )
            );


            /* =========================================
               MASUK ACTION PLAN PROGRESS
               ========================================= */

            window.location.href =
                "action-plan-progress.html?business_id=" +
                encodeURIComponent(
                    businessId
                );

        }
    );

}

/* =========================================================
   STATUS SUMMARY NAVIGATION
========================================================= */

if (statusSummaryButton) {

    statusSummaryButton.addEventListener(
        "click",
        function () {

            console.log(
                "STATUS SUMMARY BUTTON DIKLIK"
            );

            console.log(
                "BUSINESS ID:",
                currentBusinessId
            );


            if (!currentBusinessId) {

                alert(
                    "Business ID tidak ditemukan. Silakan pilih bisnis terlebih dahulu."
                );

                return;
            }


            /* -----------------------------------------
               SIMPAN BUSINESS ID
            ----------------------------------------- */

            localStorage.setItem(
                "selected_business_id",
                String(
                    currentBusinessId
                )
            );


            localStorage.setItem(
                "last_business_id",
                String(
                    currentBusinessId
                )
            );


            /* -----------------------------------------
               MASUK STATUS SUMMARY
            ----------------------------------------- */

            window.location.href =
                "status-summary.html?business_id=" +
                encodeURIComponent(
                    currentBusinessId
                );

        }
    );

}
