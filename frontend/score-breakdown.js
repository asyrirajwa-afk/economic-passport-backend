/* =========================================================
   ECONOMIC PASSPORT
   SCORE BREAKDOWN
   ========================================================= */

const API_URL = "http://127.0.0.1:8000";


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* =================================================
           ELEMENTS
        ================================================= */

        const loadingState =
            document.getElementById("loadingState");

        const errorState =
            document.getElementById("errorState");

        const errorMessage =
            document.getElementById("errorMessage");

        const content =
            document.getElementById("content");

        const backButton =
            document.getElementById("backButton");

        const errorBackButton =
            document.getElementById("errorBackButton");

        const retryButton =
            document.getElementById("retryButton");

        const logoutButton =
            document.getElementById("logoutButton");

        const comparisonButton =
            document.getElementById("comparisonButton");


        /* =================================================
           TOKEN
        ================================================= */

        const token =
            localStorage.getItem("token");


        if (!token) {

            window.location.href =
                "index.html";

            return;
        }


        /* =================================================
           BUSINESS ID
           
           Priority:
           1. URL
           2. selected_business_id
           3. last_business_id
        ================================================= */

        const params =
            new URLSearchParams(
                window.location.search
            );

        const urlBusinessId =
            params.get("business_id");

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
            "SCORE BREAKDOWN BUSINESS ID:",
            businessId
        );


        if (!businessId) {

            showError(
                "Business ID tidak ditemukan. Silakan kembali ke Dashboard dan pilih bisnis."
            );

            return;
        }


        /* =================================================
           SAVE BUSINESS ID
        ================================================= */

        localStorage.setItem(
            "selected_business_id",
            businessId
        );

        localStorage.setItem(
            "last_business_id",
            businessId
        );


        /* =================================================
           API FETCH
        ================================================= */

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
                    "Tidak dapat terhubung ke server backend."
                );
            }


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
                "API:",
                endpoint
            );

            console.log(
                "STATUS:",
                response.status
            );

            console.log(
                "RESPONSE:",
                data
            );


            /* =============================================
               UNAUTHORIZED
            ============================================= */

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

                throw new Error(
                    "Sesi login telah berakhir."
                );
            }


            /* =============================================
               ERROR
            ============================================= */

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
                                function (item) {

                                    return (
                                        item.msg ||
                                        item.message ||
                                        String(item)
                                    );

                                }
                            )
                            .join(", ");
                }


                throw new Error(
                    message
                );
            }


            return data;
        }


        /* =================================================
           LOADING
        ================================================= */

        function showLoading() {

            if (loadingState) {

                loadingState.classList.remove(
                    "hidden"
                );
            }

            if (errorState) {

                errorState.classList.add(
                    "hidden"
                );
            }

            if (content) {

                content.classList.add(
                    "hidden"
                );
            }
        }


        /* =================================================
           SHOW CONTENT
        ================================================= */

        function showContent() {

            if (loadingState) {

                loadingState.classList.add(
                    "hidden"
                );
            }

            if (errorState) {

                errorState.classList.add(
                    "hidden"
                );
            }

            if (content) {

                content.classList.remove(
                    "hidden"
                );
            }
        }


        /* =================================================
           ERROR
        ================================================= */

        function showError(message) {

            if (loadingState) {

                loadingState.classList.add(
                    "hidden"
                );
            }

            if (content) {

                content.classList.add(
                    "hidden"
                );
            }

            if (errorState) {

                errorState.classList.remove(
                    "hidden"
                );
            }

            if (errorMessage) {

                errorMessage.textContent =
                    message ||
                    "Data tidak dapat dimuat.";
            }
        }


        /* =================================================
           FORMAT SCORE
        ================================================= */

        function formatScore(value) {

            const number =
                Number(value);

            if (
                !Number.isFinite(number)
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


        /* =================================================
           FORMAT DATE
        ================================================= */

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


        /* =================================================
           ESCAPE HTML
        ================================================= */

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


        /* =================================================
           STATUS CLASS
        ================================================= */

        function getStatusClass(status) {

            const normalized =
                String(
                    status || ""
                )
                    .toLowerCase();


            if (
                normalized.includes(
                    "excellent"
                )
            ) {

                return "status-excellent";
            }


            if (
                normalized.includes(
                    "good"
                )
            ) {

                return "status-good";
            }


            if (
                normalized.includes(
                    "improvement"
                )
            ) {

                return "status-warning";
            }


            if (
                normalized.includes(
                    "critical"
                )
            ) {

                return "status-critical";
            }


            if (
                normalized.includes(
                    "achieved"
                )
            ) {

                return "status-excellent";
            }


            return "status-good";
        }


        /* =================================================
           NORMALIZE CATEGORIES
        ================================================= */

        function normalizeCategories(data) {

            let raw =
                data.categories ||
                data.breakdown ||
                data.score_breakdown ||
                [];


            /* =============================================
               ARRAY
            ============================================= */

            if (
                Array.isArray(raw)
            ) {

                return raw.map(
                    function (item) {

                        return {

                            category:
                                item.category ||
                                item.name ||
                                "-",

                            score:
                                Number(
                                    item.score ??
                                    item.value ??
                                    0
                                ),

                            status:
                                item.status ||
                                "-",

                            target:
                                Number(
                                    item.target ??
                                    item.target_score ??
                                    80
                                ),

                            gap:
                                Number(
                                    item.gap ??
                                    0
                                ),

                            percentage:
                                Number(
                                    item.percentage ??
                                    item.score ??
                                    0
                                )
                        };

                    }
                );
            }


            /* =============================================
               OBJECT
            ============================================= */

            if (
                raw &&
                typeof raw === "object"
            ) {

                const categoryMap = {

                    profit:
                        "Profit",

                    people:
                        "People",

                    planet:
                        "Planet",

                    marketplace:
                        "Marketplace"

                };


                return Object.keys(
                    categoryMap
                )
                    .filter(
                        function (key) {

                            return (
                                raw[key] !==
                                undefined
                            );

                        }
                    )
                    .map(
                        function (key) {

                            const item =
                                raw[key] ||
                                {};


                            return {

                                category:
                                    categoryMap[
                                        key
                                    ],

                                score:
                                    Number(
                                        item.score ??
                                        item.value ??
                                        0
                                    ),

                                status:
                                    item.status ||
                                    "-",

                                target:
                                    Number(
                                        item.target ??
                                        item.target_score ??
                                        80
                                    ),

                                gap:
                                    Number(
                                        item.gap ??
                                        0
                                    ),

                                percentage:
                                    Number(
                                        item.percentage ??
                                        item.score ??
                                        0
                                    )
                            };

                        }
                    );
            }


            return [];
        }


        /* =================================================
           RENDER CATEGORIES
        ================================================= */

        function renderCategories(categories) {

            const categoryList =
                document.getElementById(
                    "categoryList"
                );


            if (!categoryList) {

                return;
            }


            categoryList.innerHTML =
                "";


            if (
                !categories ||
                !categories.length
            ) {

                categoryList.innerHTML = `

                    <div class="category">

                        <span
                            style="
                                color:#6d7a76;
                                font-size:13px;
                            "
                        >
                            Data kategori belum tersedia.
                        </span>

                    </div>

                `;

                return;
            }


            categories.forEach(
                function (item) {

                    const score =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                Number(
                                    item.score ||
                                    0
                                )
                            )
                        );


                    const target =
                        Number(
                            item.target ||
                            80
                        );


                    const gap =
                        Number(
                            item.gap ??
                            Math.max(
                                0,
                                target -
                                score
                            )
                        );


                    const status =
                        item.status ||
                        "-";


                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        "category";


                    div.innerHTML = `

                        <div class="cat-top">

                            <span class="cat-name">

                                ${escapeHTML(
                                    item.category
                                )}

                            </span>


                            <div class="cat-score">

                                <b>
                                    ${formatScore(
                                        score
                                    )}
                                </b>

                                <span>
                                    / 100
                                </span>

                            </div>

                        </div>


                        <div class="track">

                            <div
                                class="fill"
                                style="
                                    width:${score}%;
                                "
                            ></div>

                        </div>


                        <div class="cat-bottom">

                            <span
                                class="cat-status ${getStatusClass(
                                    status
                                )}"
                            >
                                ${escapeHTML(
                                    status
                                )}
                            </span>


                            <span>

                                ${
                                    gap > 0

                                        ? `Masih perlu ${formatScore(
                                            gap
                                        )} poin ke target`

                                        : `Target ${formatScore(
                                            target
                                        )} tercapai`
                                }

                            </span>

                        </div>

                    `;


                    categoryList.appendChild(
                        div
                    );

                }
            );
        }


        /* =================================================
           RENDER PAGE
        ================================================= */

        function renderPage(data) {

            console.log(
                "================================="
            );

            console.log(
                "RENDER SCORE BREAKDOWN"
            );

            console.log(
                data
            );

            console.log(
                "================================="
            );


            /* =============================================
               BUSINESS
            ============================================= */

            const business =
                data.business ||
                {};


            const businessName =
                document.getElementById(
                    "businessName"
                );


            if (businessName) {

                businessName.textContent =
                    business.business_name ||
                    "Economic Passport";
            }


            /* =============================================
               PASSPORT
            ============================================= */

            const passport =
                data.passport ||
                {};


            const overallScore =
                Number(
                    passport.score ??
                    passport.overall_score ??
                    data.overall_score ??
                    0
                );


            const overallScoreElement =
                document.getElementById(
                    "overallScore"
                );


            if (overallScoreElement) {

                overallScoreElement.textContent =
                    formatScore(
                        overallScore
                    );
            }


            /* =============================================
               RING
            ============================================= */

            const ringScore =
                document.getElementById(
                    "ringScore"
                );


            if (ringScore) {

                ringScore.textContent =
                    formatScore(
                        overallScore
                    );
            }


            const scoreRing =
                document.getElementById(
                    "scoreRing"
                );


            if (scoreRing) {

                const safeScore =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            overallScore
                        )
                    );


                scoreRing.style.setProperty(
                    "--score",
                    `${safeScore}%`
                );
            }


            /* =============================================
               LEVEL
            ============================================= */

            const level =
                passport.level ||
                data.level ||
                getScoreLevel(
                    overallScore
                );


            const overallLevel =
                document.getElementById(
                    "overallLevel"
                );


            if (overallLevel) {

                overallLevel.textContent =
                    level;

                overallLevel.className =
                    `badge ${getStatusClass(
                        level
                    )}`;
            }


            /* =============================================
               TREND
            ============================================= */

            const trend =
                data.trend ||
                {};


            const trendDirection =
                document.getElementById(
                    "trendDirection"
                );


            if (trendDirection) {

                trendDirection.textContent =
                    trend.direction ||
                    "-";
            }


            const trendDetail =
                document.getElementById(
                    "trendDetail"
                );


            if (trendDetail) {

                const previousScore =
                    trend.previous_score;

                const change =
                    Number(
                        trend.change ||
                        0
                    );


                if (
                    previousScore ===
                    null ||
                    previousScore ===
                    undefined
                ) {

                    trendDetail.textContent =
                        "Assessment pertama.";
                }

                else if (
                    change > 0
                ) {

                    trendDetail.textContent =
                        `Naik ${formatScore(
                            change
                        )} poin.`;
                }

                else if (
                    change < 0
                ) {

                    trendDetail.textContent =
                        `Turun ${formatScore(
                            Math.abs(
                                change
                            )
                        )} poin.`;
                }

                else {

                    trendDetail.textContent =
                        "Tidak mengalami perubahan.";
                }
            }


            /* =============================================
               TARGET
            ============================================= */

            const target =
                data.target ||
                {};


            const targetScore =
                Number(
                    target.target_score ??
                    80
                );


            const targetGap =
                Number(
                    target.gap ??
                    Math.max(
                        0,
                        targetScore -
                        overallScore
                    )
                );


            const targetScoreElement =
                document.getElementById(
                    "targetScore"
                );


            if (targetScoreElement) {

                targetScoreElement.textContent =
                    formatScore(
                        targetScore
                    );
            }


            const targetDetail =
                document.getElementById(
                    "targetDetail"
                );


            if (targetDetail) {

                const achieved =
                    (
                        target.status ===
                        "Achieved"
                    ) ||
                    (
                        overallScore >=
                        targetScore
                    );


                targetDetail.textContent =
                    achieved

                        ? "Target sudah tercapai."

                        : `Masih kurang ${formatScore(
                            targetGap
                        )} poin.`;
            }


            /* =============================================
               ASSESSMENT
            ============================================= */

            const history =
                data.history ||
                {};


            const assessmentCount =
                document.getElementById(
                    "assessmentCount"
                );


            if (assessmentCount) {

                assessmentCount.textContent =
                    history.total_assessments ??
                    data.total_assessments ??
                    0;
            }


            const assessmentDate =
                document.getElementById(
                    "assessmentDate"
                );


            if (assessmentDate) {

                const latestDate =
                    history.latest_assessment ||
                    passport.created_at ||
                    data.created_at;


                assessmentDate.textContent =
                    latestDate

                        ? `Terakhir: ${formatDate(
                            latestDate
                        )}`

                        : "Belum tersedia";
            }


            /* =============================================
               PASSPORT INFORMATION
            ============================================= */

            const passportId =
                document.getElementById(
                    "passportId"
                );


            if (passportId) {

                passportId.textContent =
                    passport.id ??
                    data.passport_id ??
                    "-";
            }


            const passportStatus =
                document.getElementById(
                    "passportStatus"
                );


            if (passportStatus) {

                passportStatus.textContent =
                    passport.passport_status ||
                    passport.status ||
                    data.passport_status ||
                    data.status ||
                    "-";
            }


            const latestAssessment =
                document.getElementById(
                    "latestAssessment"
                );


            if (latestAssessment) {

                latestAssessment.textContent =
                    passport.created_at

                        ? formatDate(
                            passport.created_at
                        )

                        : "-";
            }


            const firstAssessment =
                document.getElementById(
                    "firstAssessment"
                );


            if (firstAssessment) {

                firstAssessment.textContent =
                    history.first_assessment

                        ? formatDate(
                            history.first_assessment
                        )

                        : "-";
            }


            /* =============================================
               CATEGORIES
            ============================================= */

            const categories =
                normalizeCategories(
                    data
                );


            renderCategories(
                categories
            );


            /* =============================================
               CATEGORY AVERAGE
            ============================================= */

            const categoryAverage =
                categories.length

                    ? categories.reduce(
                        function (
                            total,
                            item
                        ) {

                            return (
                                total +
                                Number(
                                    item.score ||
                                    0
                                )
                            );

                        },
                        0
                    ) /
                    categories.length

                    : 0;


            const categoryAverageElement =
                document.getElementById(
                    "categoryAverage"
                );


            if (categoryAverageElement) {

                categoryAverageElement.textContent =
                    formatScore(
                        categoryAverage
                    );
            }


            /* =============================================
               HIGHLIGHTS
            ============================================= */

            const highlights =
                data.highlights ||
                {};


            let strongestCategory =
                highlights.strongest_category ||
                "-";


            let strongestScore =
                Number(
                    highlights.strongest_score ??
                    0
                );


            let weakestCategory =
                highlights.weakest_category ||
                "-";


            let weakestScore =
                Number(
                    highlights.weakest_score ??
                    0
                );


            /* fallback jika highlights kosong */

            if (
                strongestCategory === "-" &&
                categories.length
            ) {

                const sorted =
                    [...categories].sort(
                        function (a, b) {

                            return (
                                Number(b.score || 0) -
                                Number(a.score || 0)
                            );

                        }
                    );


                strongestCategory =
                    sorted[0].category;

                strongestScore =
                    Number(
                        sorted[0].score ||
                        0
                    );
            }


            if (
                weakestCategory === "-" &&
                categories.length
            ) {

                const sorted =
                    [...categories].sort(
                        function (a, b) {

                            return (
                                Number(a.score || 0) -
                                Number(b.score || 0)
                            );

                        }
                    );


                weakestCategory =
                    sorted[0].category;

                weakestScore =
                    Number(
                        sorted[0].score ||
                        0
                    );
            }


            const strongestCategoryElement =
                document.getElementById(
                    "strongestCategory"
                );


            if (strongestCategoryElement) {

                strongestCategoryElement.textContent =
                    strongestCategory;
            }


            const strongestScoreElement =
                document.getElementById(
                    "strongestScore"
                );


            if (strongestScoreElement) {

                strongestScoreElement.textContent =
                    formatScore(
                        strongestScore
                    );
            }


            const weakestCategoryElement =
                document.getElementById(
                    "weakestCategory"
                );


            if (weakestCategoryElement) {

                weakestCategoryElement.textContent =
                    weakestCategory;
            }


            const weakestScoreElement =
                document.getElementById(
                    "weakestScore"
                );


            if (weakestScoreElement) {

                weakestScoreElement.textContent =
                    formatScore(
                        weakestScore
                    );
            }


            /* =============================================
               ACTION REQUIRED
            ============================================= */

            const actionRequired =
                highlights.action_required ??
                categories.filter(
                    function (item) {

                        return Number(
                            item.score ||
                            0
                        ) < 80;

                    }
                ).length;


            const actionRequiredElement =
                document.getElementById(
                    "actionRequired"
                );


            if (actionRequiredElement) {

                actionRequiredElement.textContent =
                    `${actionRequired} Area`;
            }

        }


        /* =================================================
           SCORE LEVEL
        ================================================= */

        function getScoreLevel(score) {

            const value =
                Number(score);


            if (value >= 90) {

                return "Outstanding";
            }

            if (value >= 80) {

                return "Excellent";
            }

            if (value >= 70) {

                return "Good";
            }

            if (value >= 65) {

                return "Moderate";
            }

            if (value >= 50) {

                return "Needs Improvement";
            }

            return "Critical";
        }


        /* =================================================
           LOAD SCORE BREAKDOWN
        ================================================= */

        async function loadScoreBreakdown() {

            showLoading();


            try {

                console.log(
                    "================================="
                );

                console.log(
                    "LOAD SCORE BREAKDOWN"
                );

                console.log(
                    "BUSINESS ID:",
                    businessId
                );

                console.log(
                    "================================="
                );


                const data =
                    await apiFetch(
                        `/passport/${encodeURIComponent(
                            businessId
                        )}/score-breakdown`
                    );


                console.log(
                    "SCORE BREAKDOWN DATA:",
                    data
                );


                renderPage(
                    data
                );


                showContent();

            }

            catch (error) {

                console.error(
                    "ERROR SCORE BREAKDOWN:",
                    error
                );


                showError(
                    error.message ||
                    "Score breakdown tidak dapat dimuat."
                );
            }
        }


        /* =================================================
           BACK BUTTON
        ================================================= */

        if (backButton) {

            backButton.addEventListener(
                "click",
                function () {

                    localStorage.setItem(
                        "selected_business_id",
                        businessId
                    );

                    localStorage.setItem(
                        "last_business_id",
                        businessId
                    );

                    window.location.href =
                        `passport.html?business_id=${encodeURIComponent(
                            businessId
                        )}`;

                }
            );
        }


        /* =================================================
           ERROR BACK BUTTON
        ================================================= */

        if (errorBackButton) {

            errorBackButton.addEventListener(
                "click",
                function () {

                    window.location.href =
                        `passport.html?business_id=${encodeURIComponent(
                            businessId
                        )}`;

                }
            );
        }


        /* =================================================
           RETRY BUTTON
        ================================================= */

        if (retryButton) {

            retryButton.addEventListener(
                "click",
                function () {

                    loadScoreBreakdown();

                }
            );
        }


        /* =================================================
           COMPARISON BUTTON
           
           Mengarahkan ke:
           score-comparison.html
        ================================================= */

        if (comparisonButton) {

            comparisonButton.addEventListener(
                "click",
                function () {

                    localStorage.setItem(
                        "selected_business_id",
                        businessId
                    );

                    localStorage.setItem(
                        "last_business_id",
                        businessId
                    );


                    window.location.href =
                        `score-comparison.html?business_id=${encodeURIComponent(
                            businessId
                        )}`;

                }
            );
        }


        /* =================================================
           LOGOUT
        ================================================= */

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


        /* =================================================
           RUN
        ================================================= */

        loadScoreBreakdown();

    }
);