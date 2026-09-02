/* =========================================================
   ECONOMIC PASSPORT
   ACTION PLAN PROGRESS
   ========================================================= */

const API_URL = "https://economic-passport-backend-production.up.railway.app";


document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       ELEMENTS
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


    const progressContent =
        document.getElementById(
            "progressContent"
        );


    const backButton =
        document.getElementById(
            "backButton"
        );


    const errorBackButton =
        document.getElementById(
            "errorBackButton"
        );


    const retryButton =
        document.getElementById(
            "retryButton"
        );


    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    const actionPlanButton =
        document.getElementById(
            "actionPlanButton"
        );


    const scoreHistoryButton =
        document.getElementById(
            "scoreHistoryButton"
        );


    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        window.location.href =
            "index.html";

        return;

    }


    /* =====================================================
       BUSINESS ID
    ===================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const urlBusinessId =
        params.get(
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
        "ACTION PLAN PROGRESS BUSINESS ID:",
        businessId
    );


    if (!businessId) {

        showError(
            "Business ID tidak ditemukan. Silakan pilih bisnis terlebih dahulu."
        );

        return;

    }


    /* =====================================================
       SAVE BUSINESS ID
    ===================================================== */

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
                "Tidak dapat terhubung ke backend. Pastikan server FastAPI sedang berjalan."
            );

        }


        let data =
            null;


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
            "ACTION PLAN PROGRESS RESPONSE:",
            data
        );


        /* =============================================
           UNAUTHORIZED
        ============================================= */

        if (
            response.status ===
            401
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


        /* =============================================
           ERROR
        ============================================= */

        if (
            !response.ok
        ) {

            let message =
                data?.detail ||
                data?.message ||
                `Request gagal (${response.status})`;


            if (
                Array.isArray(
                    message
                )
            ) {

                message =
                    message
                        .map(
                            function (
                                item
                            ) {

                                return (
                                    item.msg ||
                                    item.message ||
                                    String(
                                        item
                                    )
                                );

                            }
                        )
                        .join(
                            ", "
                        );

            }


            throw new Error(
                message
            );

        }


        return data;

    }


    /* =====================================================
       SHOW LOADING
    ===================================================== */

    function showLoading() {

        loadingState.style.display =
            "flex";


        errorState.style.display =
            "none";


        progressContent.style.display =
            "none";

    }


    /* =====================================================
       SHOW CONTENT
    ===================================================== */

    function showContent() {

        loadingState.style.display =
            "none";


        errorState.style.display =
            "none";


        progressContent.style.display =
            "block";

    }


    /* =====================================================
       SHOW ERROR
    ===================================================== */

    function showError(
        message
    ) {

        loadingState.style.display =
            "none";


        progressContent.style.display =
            "none";


        errorState.style.display =
            "flex";


        errorMessage.textContent =
            message ||
            "Data progress tidak dapat dimuat.";

    }


    /* =====================================================
       FORMAT NUMBER
    ===================================================== */

    function formatNumber(
        value
    ) {

        const number =
            Number(
                value
            );


        if (
            !Number.isFinite(
                number
            )
        ) {

            return "0";

        }


        return number
            .toFixed(2)
            .replace(
                /\.00$/,
                ""
            );

    }


    /* =====================================================
       FORMAT CHANGE
    ===================================================== */

    function formatChange(
        value
    ) {

        const number =
            Number(
                value
            );


        if (
            !Number.isFinite(
                number
            )
        ) {

            return "0";

        }


        if (
            number > 0
        ) {

            return `+${formatNumber(
                number
            )}`;

        }


        return formatNumber(
            number
        );

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
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(
                value
            );

        }


        return date.toLocaleDateString(
            "id-ID",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"
            }
        );

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(
        value
    ) {

        return String(
            value ??
            ""
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
       STATUS CLASS
    ===================================================== */

    function getStatusClass(
        status
    ) {

        const value =
            String(
                status ||
                ""
            )
                .toLowerCase();


        if (
            value.includes(
                "improved"
            )
        ) {

            return "improved";

        }


        if (
            value.includes(
                "declined"
            )
        ) {

            return "declined";

        }


        return "stable";

    }


    /* =====================================================
       STATUS TEXT
    ===================================================== */

    function getStatusText(
        status
    ) {

        const value =
            String(
                status ||
                ""
            )
                .toLowerCase();


        if (
            value.includes(
                "improved"
            )
        ) {

            return "Improved";

        }


        if (
            value.includes(
                "declined"
            )
        ) {

            return "Declined";

        }


        if (
            value.includes(
                "no change"
            )
        ) {

            return "No Change";

        }


        if (
            value.includes(
                "stable"
            )
        ) {

            return "Stable";

        }


        return status ||
            "No Change";

    }


    /* =====================================================
       LOAD PROGRESS
    ===================================================== */

    async function loadProgress() {

        showLoading();


        try {

            const id =
                encodeURIComponent(
                    businessId
                );


            /*
             * BACKEND ENDPOINT
             *
             * GET
             * /dashboard/{business_id}/action-plan-progress
             */

            const data =
                await apiFetch(
                    `/passport/${id}/action-plan-progress`
                );


            console.log(
                "PROGRESS DATA:",
                data
            );


            renderProgress(
                data
            );


            showContent();

        }

        catch (error) {

            console.error(
                "PROGRESS ERROR:",
                error
            );


            showError(
                error.message
            );

        }

    }


    /* =====================================================
       RENDER MAIN DATA
    ===================================================== */

    function renderProgress(
        data
    ) {


        /* =============================================
           BUSINESS
        ============================================= */

        const business =
            data.business ||
            {};


        document.getElementById(
            "businessName"
        ).textContent =
            business.business_name ||
            "-";


        /* =============================================
           CHECK PROGRESS AVAILABLE
        ============================================= */

        if (
            data.progress_available ===
            false
        ) {

            renderSingleAssessment(
                data
            );

            return;

        }


        /* =============================================
           PREVIOUS PASSPORT
        ============================================= */

        const previous =
            data.previous_passport ||
            {};


        document.getElementById(
            "previousScore"
        ).textContent =
            formatNumber(
                previous.score
            );


        document.getElementById(
            "previousDate"
        ).textContent =
            previous.created_at
                ? formatDate(
                    previous.created_at
                )
                : "-";


        /* =============================================
           CURRENT PASSPORT
        ============================================= */

        const current =
            data.current_passport ||
            {};


        document.getElementById(
            "currentScore"
        ).textContent =
            formatNumber(
                current.score
            );


        document.getElementById(
            "currentDate"
        ).textContent =
            current.created_at
                ? formatDate(
                    current.created_at
                )
                : "-";


        /* =============================================
           OVERALL PROGRESS
        ============================================= */

        const overall =
            data.overall_progress ||
            {};


        const overallChange =
            Number(
                overall.change
            );


        document.getElementById(
            "scoreChange"
        ).textContent =
            formatChange(
                overallChange
            );


        document.getElementById(
            "scoreChangeStatus"
        ).textContent =
            getStatusText(
                overall.status
            );


        document.getElementById(
            "overallCurrentScore"
        ).textContent =
            formatNumber(
                overall.current_score
            );


        document.getElementById(
            "overallChange"
        ).textContent =
            formatChange(
                overallChange
            );


        document.getElementById(
            "overallChangeLabel"
        ).textContent =
            getStatusText(
                overall.status
            );


        /* =============================================
           OVERALL MESSAGE
        ============================================= */

        let overallMessage =
            "";


        if (
            overall.status ===
            "Improved"
        ) {

            overallMessage =
                "Business score mengalami peningkatan dibandingkan assessment sebelumnya.";

        }

        else if (
            overall.status ===
            "Declined"
        ) {

            overallMessage =
                "Business score mengalami penurunan dibandingkan assessment sebelumnya.";

        }

        else {

            overallMessage =
                "Business score belum mengalami perubahan dibandingkan assessment sebelumnya.";

        }


        document.getElementById(
            "overallMessage"
        ).textContent =
            overallMessage;


        /* =============================================
           CATEGORY AREAS
        ============================================= */

        const areas =
            Array.isArray(
                data.areas
            )
                ? data.areas
                : [];


        renderCategoryProgress(
            areas
        );


        /* =============================================
           RESULT SUMMARY
        ============================================= */

        renderResultSummary(
            data,
            areas
        );

    }


    /* =====================================================
       SINGLE ASSESSMENT
    ===================================================== */

    function renderSingleAssessment(
        data
    ) {

        const current =
            data.current_passport ||
            {};


        const message =
            data.message ||
            "Minimal dua assessment diperlukan untuk mengukur progress action plan.";


        /*
         * Assessment sebelumnya
         */

        document.getElementById(
            "previousScore"
        ).textContent =
            "-";


        document.getElementById(
            "previousDate"
        ).textContent =
            "Belum tersedia";


        /*
         * Assessment terbaru
         */

        document.getElementById(
            "currentScore"
        ).textContent =
            formatNumber(
                current.score
            );


        document.getElementById(
            "currentDate"
        ).textContent =
            current.created_at
                ? formatDate(
                    current.created_at
                )
                : "-";


        /*
         * Change
         */

        document.getElementById(
            "scoreChange"
        ).textContent =
            "-";


        document.getElementById(
            "scoreChangeStatus"
        ).textContent =
            "Belum dapat dihitung";


        /*
         * Overall
         */

        document.getElementById(
            "overallCurrentScore"
        ).textContent =
            formatNumber(
                current.score
            );


        document.getElementById(
            "overallChange"
        ).textContent =
            "-";


        document.getElementById(
            "overallChangeLabel"
        ).textContent =
            "Menunggu assessment berikutnya";


        document.getElementById(
            "overallMessage"
        ).textContent =
            message;


        /*
         * Category
         */

        renderCategoryProgress(
            []
        );


        /*
         * Result
         */

        const resultList =
            document.getElementById(
                "resultList"
            );


        resultList.innerHTML = `

            <div class="progress-empty">

                <div class="progress-empty-icon">
                    2
                </div>

                <h3>
                    Progress belum dapat dihitung
                </h3>

                <p>
                    ${escapeHTML(
                        message
                    )}
                </p>

            </div>

        `;

    }


    /* =====================================================
       CATEGORY PROGRESS
    ===================================================== */

    function renderCategoryProgress(
        areas
    ) {

        const container =
            document.getElementById(
                "categoryProgressList"
            );


        container.innerHTML =
            "";


        if (
            !areas.length
        ) {

            container.innerHTML = `

                <div class="progress-empty">

                    <div class="progress-empty-icon">
                        -
                    </div>

                    <h3>
                        Data progress belum tersedia
                    </h3>

                    <p>
                        Minimal dua assessment diperlukan
                        untuk melihat perkembangan setiap area.
                    </p>

                </div>

            `;


            return;

        }


        areas.forEach(
            function (
                area
            ) {


                const category =
                    area.category ||
                    "-";


                const previousScore =
                    Number(
                        area.previous_score
                    ) || 0;


                const currentScore =
                    Number(
                        area.current_score
                    ) || 0;


                const change =
                    Number(
                        area.change
                    ) || 0;


                const progressPercentage =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            Number(
                                area.progress_percentage
                            ) || 0
                        )
                    );


                const remainingGap =
                    Number(
                        area.remaining_gap
                    ) || 0;


                const targetScore =
                    Number(
                        area.target_score
                    ) || 80;


                const targetStatus =
                    area.target_status ||
                    "In Progress";


                const progressStatus =
                    area.progress_status ||
                    "No Change";


                const statusClass =
                    getStatusClass(
                        progressStatus
                    );


                const statusText =
                    getStatusText(
                        progressStatus
                    );


                const targetText =
                    targetStatus ===
                    "Achieved"
                        ? "Target tercapai"
                        : `Kurang ${formatNumber(
                            remainingGap
                        )} poin`;


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "category-card";


                card.innerHTML = `

                    <div
                        class="category-card-header"
                    >

                        <div
                            class="category-name"
                        >
                            ${escapeHTML(
                                category
                            )}
                        </div>


                        <span
                            class="category-status ${statusClass}"
                        >
                            ${escapeHTML(
                                statusText
                            )}
                        </span>

                    </div>


                    <div
                        class="category-score-row"
                    >

                        <strong
                            class="category-current"
                        >
                            ${formatNumber(
                                currentScore
                            )}
                        </strong>


                        <span
                            class="category-previous"
                        >
                            Sebelumnya:
                            ${formatNumber(
                                previousScore
                            )}
                        </span>

                    </div>


                    <div
                        class="category-progress"
                    >

                        <div
                            class="category-progress-bar"
                            style="width: ${progressPercentage}%"
                        ></div>

                    </div>


                    <div
                        class="category-change ${statusClass}"
                    >
                        ${escapeHTML(
                            statusText
                        )}

                        ·

                        ${formatChange(
                            change
                        )}

                        poin

                    </div>


                    <div
                        class="category-target"
                        style="
                            margin-top: 10px;
                            color: #71808b;
                            font-size: 10px;
                        "
                    >

                        Target:
                        ${formatNumber(
                            targetScore
                        )}

                        ·

                        ${escapeHTML(
                            targetText
                        )}

                    </div>

                `;


                container.appendChild(
                    card
                );

            }
        );

    }


    /* =====================================================
       RESULT SUMMARY
    ===================================================== */

    function renderResultSummary(
        data,
        areas
    ) {

        const container =
            document.getElementById(
                "resultList"
            );


        container.innerHTML =
            "";


        const summary =
            data.summary ||
            {};


        /*
         * SUMMARY CARDS
         */

        const improved =
            Number(
                summary.improved
            ) || 0;


        const declined =
            Number(
                summary.declined
            ) || 0;


        const noChange =
            Number(
                summary.no_change
            ) || 0;


        /*
         * STRONGEST
         */

        const strongest =
            data.strongest_progress ||
            {};


        /*
         * WEAKEST
         */

        const weakest =
            data.weakest_progress ||
            {};


        /* =============================================
           SUMMARY HEADER
        ============================================= */

        const summaryHeader =
            document.createElement(
                "div"
            );


        summaryHeader.className =
            "result-summary-grid";


        summaryHeader.style.display =
            "grid";


        summaryHeader.style.gridTemplateColumns =
            "repeat(3, 1fr)";


        summaryHeader.style.gap =
            "11px";


        summaryHeader.style.marginBottom =
            "12px";


        summaryHeader.innerHTML = `

            <div
                class="result-mini-card"
                style="
                    background: white;
                    border: 1px solid #e1e7eb;
                    border-radius: 13px;
                    padding: 15px;
                "
            >

                <span
                    style="
                        color: #71808b;
                        font-size: 10px;
                    "
                >
                    Improved
                </span>

                <strong
                    style="
                        display: block;
                        margin-top: 5px;
                        font-size: 22px;
                        color: #23805d;
                    "
                >
                    ${improved}
                </strong>

            </div>


            <div
                class="result-mini-card"
                style="
                    background: white;
                    border: 1px solid #e1e7eb;
                    border-radius: 13px;
                    padding: 15px;
                "
            >

                <span
                    style="
                        color: #71808b;
                        font-size: 10px;
                    "
                >
                    Declined
                </span>

                <strong
                    style="
                        display: block;
                        margin-top: 5px;
                        font-size: 22px;
                        color: #c34b4b;
                    "
                >
                    ${declined}
                </strong>

            </div>


            <div
                class="result-mini-card"
                style="
                    background: white;
                    border: 1px solid #e1e7eb;
                    border-radius: 13px;
                    padding: 15px;
                "
            >

                <span
                    style="
                        color: #71808b;
                        font-size: 10px;
                    "
                >
                    No Change
                </span>

                <strong
                    style="
                        display: block;
                        margin-top: 5px;
                        font-size: 22px;
                        color: #b2761a;
                    "
                >
                    ${noChange}
                </strong>

            </div>

        `;


        container.appendChild(
            summaryHeader
        );


        /* =============================================
           STRONGEST / WEAKEST
        ============================================= */

        const highlightCard =
            document.createElement(
                "div"
            );


        highlightCard.className =
            "result-card";


        highlightCard.innerHTML = `

            <div
                class="result-left"
            >

                <div
                    class="result-icon improved"
                >
                    ↑
                </div>


                <div>

                    <h3>
                        Peningkatan Terbesar
                    </h3>

                    <p>
                        ${
                            strongest.category
                                ? escapeHTML(
                                    strongest.category
                                )
                                : "Belum tersedia"
                        }
                    </p>

                </div>

            </div>


            <div
                class="result-value"
            >

                <strong>
                    ${
                        strongest.change !== undefined &&
                        strongest.change !== null
                            ? formatChange(
                                strongest.change
                            )
                            : "-"
                    }
                </strong>

                <span>
                    poin
                </span>

            </div>

        `;


        container.appendChild(
            highlightCard
        );


        const weakCard =
            document.createElement(
                "div"
            );


        weakCard.className =
            "result-card";


        weakCard.innerHTML = `

            <div
                class="result-left"
            >

                <div
                    class="result-icon declined"
                >
                    ↓
                </div>


                <div>

                    <h3>
                        Perubahan Terendah
                    </h3>

                    <p>
                        ${
                            weakest.category
                                ? escapeHTML(
                                    weakest.category
                                )
                                : "Belum tersedia"
                        }
                    </p>

                </div>

            </div>


            <div
                class="result-value"
            >

                <strong>
                    ${
                        weakest.change !== undefined &&
                        weakest.change !== null
                            ? formatChange(
                                weakest.change
                            )
                            : "-"
                    }
                </strong>

                <span>
                    poin
                </span>

            </div>

        `;


        container.appendChild(
            weakCard
        );


        /* =============================================
           AREA RESULT
        ============================================= */

        if (
            areas.length
        ) {

            areas.forEach(
                function (
                    area
                ) {

                    const statusClass =
                        getStatusClass(
                            area.progress_status
                        );


                    const icon =
                        statusClass ===
                        "improved"
                            ? "↑"
                            : statusClass ===
                              "declined"
                                ? "↓"
                                : "→";


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "result-card";


                    card.innerHTML = `

                        <div
                            class="result-left"
                        >

                            <div
                                class="result-icon ${statusClass}"
                            >
                                ${icon}
                            </div>


                            <div>

                                <h3>
                                    ${escapeHTML(
                                        area.category ||
                                        "-"
                                    )}
                                </h3>


                                <p>
                                    ${escapeHTML(
                                        getStatusText(
                                            area.progress_status
                                        )
                                    )}
                                </p>

                            </div>

                        </div>


                        <div
                            class="result-value"
                        >

                            <strong>
                                ${formatChange(
                                    area.change
                                )}
                            </strong>


                            <span>
                                perubahan score
                            </span>

                        </div>

                    `;


                    container.appendChild(
                        card
                    );

                }
            );

        }

    }


    /* =====================================================
       NAVIGATION - BACK
    ===================================================== */

    if (
        backButton
    ) {

        backButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    `dashboard.html?business_id=${encodeURIComponent(
                        businessId
                    )}`;

            }
        );

    }


    /* =====================================================
       NAVIGATION - ERROR BACK
    ===================================================== */

    if (
        errorBackButton
    ) {

        errorBackButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    `dashboard.html?business_id=${encodeURIComponent(
                        businessId
                    )}`;

            }
        );

    }


    /* =====================================================
       RETRY
    ===================================================== */

    if (
        retryButton
    ) {

        retryButton.addEventListener(
            "click",
            function () {

                loadProgress();

            }
        );

    }


    /* =====================================================
       ACTION PLAN BUTTON
    ===================================================== */

    if (
        actionPlanButton
    ) {

        actionPlanButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    `action-plan.html?business_id=${encodeURIComponent(
                        businessId
                    )}`;

            }
        );

    }


    /* =====================================================
       SCORE HISTORY BUTTON
    ===================================================== */

    if (
        scoreHistoryButton
    ) {

        scoreHistoryButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    `score-history.html?business_id=${encodeURIComponent(
                        businessId
                    )}`;

            }
        );

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    if (
        logoutButton
    ) {

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

    loadProgress();

});