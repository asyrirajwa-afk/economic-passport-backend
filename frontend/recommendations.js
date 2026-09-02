/* =========================================================
   ECONOMIC PASSPORT
   RECOMMENDATIONS.JS
   FULL FIXED VERSION
   ========================================================= */


/* =========================================================
   CONFIG
   ========================================================= */

const API_URL = "http://127.0.0.1:8000";


/* =========================================================
   DOM READY
   Semua proses dijalankan setelah HTML selesai dimuat.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("========================================");
    console.log("ECONOMIC PASSPORT - RECOMMENDATIONS");
    console.log("DOM READY");
    console.log("========================================");


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const loadingState =
        document.getElementById("loadingState");

    const recommendationContent =
        document.getElementById("recommendationContent");

    const errorState =
        document.getElementById("errorState");

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

    const healthCheckButton =
        document.getElementById("healthCheckButton");


    /* =====================================================
       AUTH
       ===================================================== */

    const token =
        localStorage.getItem("token");


    if (!token) {

        console.warn(
            "TOKEN TIDAK DITEMUKAN"
        );

        window.location.href =
            "index.html";

        return;
    }


    /* =====================================================
       BUSINESS ID
       ===================================================== */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const urlBusinessId =
        urlParams.get("business_id");


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
        "BUSINESS ID:",
        businessId
    );


    if (!businessId) {

        showError(
            "Business ID tidak ditemukan. Kembali ke Dashboard dan pilih bisnis."
        );

        return;
    }


    /* =====================================================
       API FETCH
       ===================================================== */

    async function apiFetch(endpoint) {

        const url =
            `${API_URL}${endpoint}`;


        console.log(
            "FETCH:",
            url
        );


        let response;


        try {

            response =
                await fetch(
                    url,
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
                "Tidak dapat terhubung ke server backend."
            );
        }


        console.log(
            "HTTP STATUS:",
            response.status
        );


        let data = null;


        try {

            data =
                await response.json();

        }

        catch (error) {

            console.error(
                "RESPONSE BUKAN JSON:",
                error
            );

        }


        console.log(
            "API RESPONSE:",
            data
        );


        /* =================================================
           TOKEN EXPIRED
           ================================================= */

        if (response.status === 401) {

            localStorage.removeItem(
                "token"
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

            return null;
        }


        /* =================================================
           API ERROR
           ================================================= */

        if (!response.ok) {

            throw new Error(
                data?.detail ||
                data?.message ||
                `Request gagal (${response.status})`
            );
        }


        return data;
    }


    /* =====================================================
       SHOW LOADING
       ===================================================== */

    function showLoading() {

        if (loadingState) {

            loadingState.style.display =
                "block";
        }


        if (recommendationContent) {

            recommendationContent.style.display =
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


        if (recommendationContent) {

            recommendationContent.style.display =
                "block";
        }
    }


    /* =====================================================
       SHOW ERROR
       ===================================================== */

    function showError(message) {

        console.error(
            "RECOMMENDATIONS ERROR:",
            message
        );


        if (loadingState) {

            loadingState.style.display =
                "none";
        }


        if (recommendationContent) {

            recommendationContent.style.display =
                "none";
        }


        if (errorState) {

            errorState.style.display =
                "block";
        }


        if (errorMessage) {

            errorMessage.textContent =
                message ||
                "Data rekomendasi tidak dapat dimuat.";
        }
    }


    /* =====================================================
       SET TEXT
       ===================================================== */

    function setText(id, value) {

        const element =
            document.getElementById(id);


        if (!element) {

            console.warn(
                `ELEMENT TIDAK DITEMUKAN: #${id}`
            );

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
       ESCAPE HTML
       ===================================================== */

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


    /* =====================================================
       NORMALIZE PRIORITY
       ===================================================== */

    function normalizePriority(priority) {

        const value =
            String(
                priority || ""
            )
                .trim()
                .toLowerCase();


        if (
            value === "critical"
        ) {

            return "Critical";
        }


        if (
            value === "high"
        ) {

            return "High";
        }


        if (
            value === "medium"
        ) {

            return "Medium";
        }


        return "Low";
    }


    /* =====================================================
       PRIORITY CLASS
       ===================================================== */

    function getPriorityClass(priority) {

        const normalized =
            normalizePriority(
                priority
            );


        return (
            "priority-" +
            normalized.toLowerCase()
        );
    }


    /* =====================================================
       GET RECOMMENDATION TEXT
       Backend kamu mempunyai beberapa versi field.
       Fungsi ini menangani semuanya.
       ===================================================== */

    function getRecommendationText(item) {

        return (
            item?.recommendation ||
            item?.description ||
            item?.problem ||
            "-"
        );
    }


    /* =====================================================
       GET SCORE
       ===================================================== */

    function getItemScore(item) {

        if (
            item?.score !== undefined &&
            item?.score !== null
        ) {

            return item.score;
        }


        return null;
    }


    /* =====================================================
       RENDER BUSINESS
       ===================================================== */

    function renderBusiness(data) {

        console.log(
            "RENDER BUSINESS:",
            data
        );


        const business =
            data?.business ||
            {};


        const passport =
            data?.passport ||
            {};


        /* ================================================
           BUSINESS NAME
           ================================================ */

        setText(
            "businessName",
            business.business_name ||
            business.name ||
            "-"
        );


        /* ================================================
           BUSINESS ID
           ================================================ */

        setText(
            "businessId",
            business.id ||
            business.business_id ||
            businessId
        );


        /* ================================================
           PASSPORT STATUS
           ================================================ */

        setText(
            "passportStatus",
            passport.status ||
            data?.status ||
            "-"
        );


        /* ================================================
           BUSINESS SCORE

           Backend versi sekarang:
           passport.score

           Versi lain:
           passport.overall_score
           passport.business_score
           ================================================ */

        const businessScore =
            passport.score ??
            passport.overall_score ??
            passport.business_score ??
            data?.business_score ??
            data?.overall_score;


        setText(
            "businessScore",
            formatScore(
                businessScore
            )
        );


        console.log(
            "BUSINESS SCORE:",
            businessScore
        );
    }


    /* =====================================================
       GET ALL RECOMMENDATIONS
       ===================================================== */

    function getRecommendations(data) {

        if (
            Array.isArray(
                data?.recommendations
            )
        ) {

            return data.recommendations;
        }


        return [];
    }


    /* =====================================================
       CALCULATE SUMMARY
       ===================================================== */

    function calculateSummary(
        data,
        recommendations
    ) {

        const summary =
            data?.summary ||
            {};


        const total =
            summary.total_recommendations ??
            data?.total_recommendations ??
            recommendations.length;


        let critical =
            summary.critical;


        let high =
            summary.high;


        let medium =
            summary.medium;


        let low =
            summary.low;


        /* ================================================
           Jika backend tidak mengirim summary,
           hitung dari recommendations.
           ================================================ */

        if (
            critical === undefined ||
            critical === null
        ) {

            critical =
                recommendations.filter(
                    function (item) {

                        return (
                            normalizePriority(
                                item.priority ||
                                item.severity
                            ) ===
                            "Critical"
                        );
                    }
                ).length;
        }


        if (
            high === undefined ||
            high === null
        ) {

            high =
                recommendations.filter(
                    function (item) {

                        return (
                            normalizePriority(
                                item.priority ||
                                item.severity
                            ) ===
                            "High"
                        );
                    }
                ).length;
        }


        if (
            medium === undefined ||
            medium === null
        ) {

            medium =
                recommendations.filter(
                    function (item) {

                        return (
                            normalizePriority(
                                item.priority ||
                                item.severity
                            ) ===
                            "Medium"
                        );
                    }
                ).length;
        }


        if (
            low === undefined ||
            low === null
        ) {

            low =
                recommendations.filter(
                    function (item) {

                        return (
                            normalizePriority(
                                item.priority ||
                                item.severity
                            ) ===
                            "Low"
                        );
                    }
                ).length;
        }


        return {
            total,
            critical,
            high,
            medium,
            low
        };
    }


    /* =====================================================
       RENDER SUMMARY
       ===================================================== */

    function renderSummary(data) {

        const recommendations =
            getRecommendations(
                data
            );


        const summary =
            calculateSummary(
                data,
                recommendations
            );


        console.log(
            "SUMMARY:",
            summary
        );


        setText(
            "totalRecommendations",
            summary.total
        );


        setText(
            "criticalCount",
            summary.critical
        );


        setText(
            "highCount",
            summary.high
        );


        setText(
            "mediumCount",
            summary.medium
        );


        setText(
            "lowCount",
            summary.low
        );
    }


    /* =====================================================
       GET TOP RECOMMENDATION
       ===================================================== */

    function getTopRecommendation(data) {

        /*
         * BACKEND VERSI SEKARANG:
         *
         * overall_recommendation
         *
         * BACKEND VERSI LAIN:
         *
         * top_recommendation
         *
         * FALLBACK:
         *
         * recommendations[0]
         */

        return (
            data?.top_recommendation ||
            data?.overall_recommendation ||
            getRecommendations(data)[0] ||
            null
        );
    }


    /* =====================================================
       RENDER TOP RECOMMENDATION
       ===================================================== */

    function renderTopRecommendation(data) {

        const container =
            document.getElementById(
                "topRecommendation"
            );


        if (!container) {

            console.warn(
                "ELEMENT #topRecommendation TIDAK DITEMUKAN"
            );

            return;
        }


        const recommendation =
            getTopRecommendation(
                data
            );


        console.log(
            "TOP RECOMMENDATION:",
            recommendation
        );


        /* ================================================
           JIKA TIDAK ADA
           ================================================ */

        if (!recommendation) {

            container.innerHTML = `

                <div class="empty-state">

                    <h3>
                        Tidak ada rekomendasi utama
                    </h3>

                    <p>
                        Kondisi bisnis saat ini
                        belum menunjukkan prioritas
                        perbaikan.
                    </p>

                </div>

            `;

            return;
        }


        /* ================================================
           CATEGORY
           ================================================ */

        const category =
            recommendation.category ||
            data?.weakest_area?.category ||
            "Business";


        /* ================================================
           TITLE
           ================================================ */

        const title =
            recommendation.title ||
            "Rekomendasi Utama";


        /* ================================================
           PRIORITY
           ================================================ */

        const priority =
            normalizePriority(
                recommendation.priority ||
                recommendation.severity
            );


        /* ================================================
           SCORE

           Untuk recommendation biasa:
           recommendation.score

           Untuk overall recommendation:
           gunakan score bisnis.
           ================================================ */

        const score =
            recommendation.score ??
            data?.passport?.score ??
            data?.passport?.overall_score ??
            data?.business_score ??
            null;


        /* ================================================
           RECOMMENDATION TEXT
           ================================================ */

        const recommendationText =
            getRecommendationText(
                recommendation
            );


        /* ================================================
           ACTION
           ================================================ */

        const action =
            recommendation.action ||
            "-";


        /* ================================================
           WEAK AREA
           ================================================ */

        const weakestArea =
            data?.weakest_area;


        const weakestAreaText =
            weakestArea?.category
                ? `
                    <div class="weakest-area">
                        <span>Area Prioritas</span>
                        <strong>
                            ${escapeHTML(
                                weakestArea.category
                            )}
                        </strong>

                        ${
                            weakestArea.score !==
                            undefined
                                ? `
                                    <small>
                                        Score:
                                        ${formatScore(
                                            weakestArea.score
                                        )}
                                    </small>
                                  `
                                : ""
                        }
                    </div>
                  `
                : "";


        /* ================================================
           RENDER
           ================================================ */

        container.innerHTML = `

            <div
                class="
                    top-recommendation-card
                    ${getPriorityClass(
                        priority
                    )}
                "
            >

                <div
                    class="top-recommendation-header"
                >

                    <div>

                        <span
                            class="
                                recommendation-category
                            "
                        >
                            ${escapeHTML(
                                category
                            )}
                        </span>


                        <h3>
                            ${escapeHTML(
                                title
                            )}
                        </h3>

                    </div>


                    <span
                        class="
                            recommendation-priority
                            ${getPriorityClass(
                                priority
                            )}
                        "
                    >
                        ${escapeHTML(
                            priority
                        )}
                    </span>

                </div>


                <div
                    class="top-recommendation-score"
                >

                    <span>
                        Business Score
                    </span>


                    <strong>
                        ${
                            score !== null &&
                            score !== undefined &&
                            !Number.isNaN(
                                Number(score)
                            )
                                ? Number(score)
                                    .toFixed(1)
                                : "-"
                        }
                    </strong>


                    <small>
                        / 100
                    </small>

                </div>


                ${weakestAreaText}


                <div
                    class="
                        top-recommendation-content
                    "
                >

                    <div>

                        <span>
                            Rekomendasi
                        </span>


                        <p>
                            ${escapeHTML(
                                recommendationText
                            )}
                        </p>

                    </div>


                    ${
                        action !== "-"
                            ? `
                                <div
                                    class="
                                        recommendation-action
                                    "
                                >

                                    <strong>
                                        Tindakan:
                                    </strong>


                                    <span>
                                        ${escapeHTML(
                                            action
                                        )}
                                    </span>

                                </div>
                              `
                            : ""
                    }

                </div>

            </div>

        `;
    }


    /* =====================================================
       RENDER ALL RECOMMENDATIONS
       ===================================================== */

    function renderRecommendations(data) {

        const recommendationList =
            document.getElementById(
                "recommendationList"
            );


        if (!recommendationList) {

            console.warn(
                "ELEMENT #recommendationList TIDAK DITEMUKAN"
            );

            return;
        }


        const recommendations =
            getRecommendations(
                data
            );


        console.log(
            "TOTAL RECOMMENDATIONS:",
            recommendations.length
        );


        /* ================================================
           EMPTY
           ================================================ */

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


        /* ================================================
           SORT BY PRIORITY

           Critical → High → Medium → Low
           ================================================ */

        const priorityOrder = {
            Critical: 1,
            High: 2,
            Medium: 3,
            Low: 4
        };


        const sortedRecommendations =
            [...recommendations]
                .sort(
                    function (a, b) {

                        const priorityA =
                            normalizePriority(
                                a.priority ||
                                a.severity
                            );


                        const priorityB =
                            normalizePriority(
                                b.priority ||
                                b.severity
                            );


                        return (
                            priorityOrder[
                                priorityA
                            ] -
                            priorityOrder[
                                priorityB
                            ]
                        );
                    }
                );


        /* ================================================
           GENERATE HTML
           ================================================ */

        recommendationList.innerHTML =
            sortedRecommendations
                .map(
                    function (
                        item,
                        index
                    ) {

                        const category =
                            item.category ||
                            "General";


                        const title =
                            item.title ||
                            "Rekomendasi";


                        const priority =
                            normalizePriority(
                                item.priority ||
                                item.severity
                            );


                        const score =
                            getItemScore(
                                item
                            );


                        const recommendation =
                            getRecommendationText(
                                item
                            );


                        const action =
                            item.action ||
                            "-";


                        const rank =
                            item.priority_rank ||
                            index + 1;


                        return `

                            <div
                                class="
                                    recommendation-card
                                    ${getPriorityClass(
                                        priority
                                    )}
                                "
                            >

                                <div
                                    class="
                                        recommendation-rank
                                    "
                                >
                                    ${rank}
                                </div>


                                <div
                                    class="
                                        recommendation-info
                                    "
                                >

                                    <div
                                        class="
                                            recommendation-header
                                        "
                                    >

                                        <div>

                                            <span
                                                class="
                                                    recommendation-category
                                                "
                                            >
                                                ${escapeHTML(
                                                    category
                                                )}
                                            </span>


                                            <h3>
                                                ${escapeHTML(
                                                    title
                                                )}
                                            </h3>

                                        </div>


                                        <span
                                            class="
                                                recommendation-priority
                                                ${getPriorityClass(
                                                    priority
                                                )}
                                            "
                                        >
                                            ${escapeHTML(
                                                priority
                                            )}
                                        </span>

                                    </div>


                                    ${
                                        score !== null &&
                                        score !== undefined
                                            ? `
                                                <div
                                                    class="
                                                        recommendation-score
                                                    "
                                                >

                                                    <span>
                                                        Score
                                                    </span>

                                                    <strong>
                                                        ${formatScore(
                                                            score
                                                        )}
                                                    </strong>

                                                    <small>
                                                        / 100
                                                    </small>

                                                </div>
                                              `
                                            : ""
                                    }


                                    <div
                                        class="
                                            recommendation-description
                                        "
                                    >

                                        <p>
                                            ${escapeHTML(
                                                recommendation
                                            )}
                                        </p>

                                    </div>


                                    ${
                                        action !== "-"
                                            ? `
                                                <div
                                                    class="
                                                        recommendation-action
                                                    "
                                                >

                                                    <strong>
                                                        Tindakan:
                                                    </strong>

                                                    <span>
                                                        ${escapeHTML(
                                                            action
                                                        )}
                                                    </span>

                                                </div>
                                              `
                                            : ""
                                    }

                                </div>

                            </div>

                        `;
                    }
                )
                .join("");


        console.log(
            "RECOMMENDATIONS BERHASIL DIRENDER:",
            sortedRecommendations.length
        );
    }


    /* =====================================================
       LOAD RECOMMENDATIONS
       ===================================================== */

    async function loadRecommendations() {

        if (!businessId) {

            showError(
                "Business ID tidak ditemukan."
            );

            return;
        }


        showLoading();


        try {

            console.log(
                "========================================"
            );

            console.log(
                "MEMUAT DATA REKOMENDASI"
            );

            console.log(
                "BUSINESS ID:",
                businessId
            );


            const data =
                await apiFetch(
                    `/dashboard/${encodeURIComponent(
                        businessId
                    )}/recommendations`
                );


            if (!data) {

                throw new Error(
                    "Server tidak mengembalikan data."
                );
            }


            console.log(
                "DATA BERHASIL DITERIMA:",
                data
            );


            /* ============================================
               RENDER SEMUA BAGIAN
               ============================================ */

            renderBusiness(
                data
            );


            renderSummary(
                data
            );


            renderTopRecommendation(
                data
            );


            renderRecommendations(
                data
            );


            showContent();


            console.log(
                "========================================"
            );

            console.log(
                "SEMUA DATA BERHASIL DITAMPILKAN"
            );

            console.log(
                "========================================"
            );

        }


        catch (error) {

            console.error(
                "LOAD RECOMMENDATIONS ERROR:",
                error
            );


            showError(
                error.message ||
                "Rekomendasi gagal dimuat."
            );
        }
    }


    /* =====================================================
       BACK BUTTON
       ===================================================== */

    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "dashboard.html";

            }
        );
    }


    /* =====================================================
       ERROR BACK BUTTON
       ===================================================== */

    if (errorBackButton) {

        errorBackButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "dashboard.html";

            }
        );
    }


    /* =====================================================
       RETRY BUTTON
       ===================================================== */

    if (retryButton) {

        retryButton.addEventListener(
            "click",
            function () {

                loadRecommendations();

            }
        );
    }


    /* =====================================================
       HEALTH CHECK
       ===================================================== */

    if (healthCheckButton) {

        healthCheckButton.addEventListener(
            "click",
            function () {

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
                    `health-check.html?business_id=${
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

    loadRecommendations();

});

/* =========================================================
   FIX: HILANGKAN LOADING "MEMUAT REKOMENDASI..."
   DAN PASTIKAN SEMUA REKOMENDASI TAMPIL
   ========================================================= */

(function fixRecommendationLoading() {

    function removeRecommendationLoading() {

        const allElements =
            document.querySelectorAll("*");

        allElements.forEach(function(element) {

            const text =
                element.textContent?.trim();

            /*
             * Hanya cari elemen yang isinya persis
             * "Memuat rekomendasi..."
             *
             * Jangan sembunyikan parent besar.
             */

            if (
                text === "Memuat rekomendasi..." &&
                element.children.length === 0
            ) {

                element.style.display = "none";

                console.log(
                    "LOADING RECOMMENDATION DISEMBUNYIKAN"
                );
            }

        });


        /*
         * Pastikan container daftar rekomendasi
         * terlihat.
         */

        const recommendationList =
            document.getElementById(
                "recommendationList"
            );


        if (recommendationList) {

            recommendationList.style.display =
                "block";

            recommendationList.style.visibility =
                "visible";

            recommendationList.style.opacity =
                "1";

        }

    }


    /*
     * Jalankan setelah halaman selesai.
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function() {

                removeRecommendationLoading();

                setTimeout(
                    removeRecommendationLoading,
                    500
                );

                setTimeout(
                    removeRecommendationLoading,
                    1500
                );

            }
        );

    }

    else {

        removeRecommendationLoading();

        setTimeout(
            removeRecommendationLoading,
            500
        );

        setTimeout(
            removeRecommendationLoading,
            1500
        );

    }


    /*
     * Jika HTML berubah setelah API selesai,
     * cek lagi.
     */

    const observer =
        new MutationObserver(
            function() {

                removeRecommendationLoading();

            }
        );


    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );

})();