/* =========================================================
   ECONOMIC PASSPORT
   BUSINESS ACTION PLAN
   ========================================================= */

const API_URL = "https://economic-passport-backend-production.up.railway.app";


document.addEventListener("DOMContentLoaded", function () {

    const loadingState =
        document.getElementById("loadingState");

    const errorState =
        document.getElementById("errorState");

    const errorMessage =
        document.getElementById("errorMessage");

    const actionContent =
        document.getElementById("actionContent");

    const backButton =
        document.getElementById("backButton");

    const errorBackButton =
        document.getElementById("errorBackButton");

    const retryButton =
        document.getElementById("retryButton");

    const logoutButton =
        document.getElementById("logoutButton");


    /* =====================================================
       TOKEN
    ===================================================== */

    const token =
        localStorage.getItem("token");


    if (!token) {

        window.location.href = "index.html";
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
        "BUSINESS ID:",
        businessId
    );


    if (!businessId) {

        showError(
            "Business ID tidak ditemukan."
        );

        return;

    }


    /* =====================================================
       FETCH API
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

        } catch (error) {

            console.error(
                "NETWORK ERROR:",
                error
            );

            throw new Error(
                "Tidak dapat terhubung ke backend."
            );

        }


        let data = null;

        try {

            data = await response.json();

        } catch (error) {

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
            "API RESPONSE:",
            data
        );


        if (response.status === 401) {

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href =
                "index.html";

            throw new Error(
                "Sesi login telah berakhir."
            );

        }


        if (!response.ok) {

            const message =
                data?.detail ||
                data?.message ||
                `Request gagal (${response.status})`;

            throw new Error(
                message
            );

        }


        return data;

    }


    /* =====================================================
       LOADING
    ===================================================== */

    function showLoading() {

        loadingState.style.display =
            "flex";

        errorState.style.display =
            "none";

        actionContent.style.display =
            "none";

    }


    /* =====================================================
       CONTENT
    ===================================================== */

    function showContent() {

        loadingState.style.display =
            "none";

        errorState.style.display =
            "none";

        actionContent.style.display =
            "block";

    }


    /* =====================================================
       ERROR
    ===================================================== */

    function showError(message) {

        loadingState.style.display =
            "none";

        actionContent.style.display =
            "none";

        errorState.style.display =
            "flex";

        errorMessage.textContent =
            message ||
            "Action Plan tidak dapat dimuat.";

    }


    /* =====================================================
       FORMAT SCORE
    ===================================================== */

    function formatScore(value) {

        const number =
            Number(value);

        if (!Number.isFinite(number)) {

            return "0";

        }

        return number
            .toFixed(2)
            .replace(/\.00$/, "");

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


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(
            value ?? ""
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       PRIORITY
    ===================================================== */

    function getPriorityClass(priority) {

        if (priority === 1) {
            return "severity-critical";
        }

        if (priority === 2) {
            return "severity-high";
        }

        if (priority === 3) {
            return "severity-medium";
        }

        return "severity-low";

    }


    function getPriorityText(priority) {

        if (priority === 1) {
            return "Prioritas Tinggi";
        }

        if (priority === 2) {
            return "Prioritas Menengah";
        }

        if (priority === 3) {
            return "Prioritas Rendah";
        }

        return "Prioritas 4";

    }


    /* =====================================================
       LOAD ACTION PLAN
    ===================================================== */

    async function loadActionPlan() {

        showLoading();

        try {

            const id =
                encodeURIComponent(
                    businessId
                );


            /*
             * BACKEND:
             *
             * GET /passport/{business_id}/action-plan
             */

            const data =
                await apiFetch(
                    `/passport/${id}/action-plan`
                );


            console.log(
                "ACTION PLAN DATA:",
                data
            );


            renderActionPlan(data);

            showContent();

        } catch (error) {

            console.error(
                "ACTION PLAN ERROR:",
                error
            );

            showError(
                error.message
            );

        }

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderActionPlan(data) {

        /* =================================================
           BUSINESS
        ================================================= */

        const business =
            data.business || {};


        document.getElementById(
            "businessName"
        ).textContent =
            business.business_name ||
            "-";


        /* =================================================
           PASSPORT
        ================================================= */

        const passport =
            data.passport || {};


        document.getElementById(
            "overallScore"
        ).textContent =
            formatScore(
                passport.overall_score
            );


        document.getElementById(
            "passportStatus"
        ).textContent =
            passport.status ||
            "-";


        document.getElementById(
            "passportId"
        ).textContent =
            passport.id ??
            "-";


        document.getElementById(
            "passportDate"
        ).textContent =
            passport.created_at
                ? `Dibuat ${formatDate(
                    passport.created_at
                )}`
                : "-";


        /* =================================================
           ACTION PLAN OBJECT
        ================================================= */

        const plan =
            data.action_plan || {};


        /*
         * INI BAGIAN PALING PENTING.
         *
         * Backend:
         *
         * action_plan: {
         *     status,
         *     message,
         *     total_actions,
         *     actions: [...]
         * }
         */

        const actions =
            Array.isArray(
                plan.actions
            )
                ? plan.actions
                : [];


        /* =================================================
           SUMMARY
        ================================================= */

        document.getElementById(
            "totalActions"
        ).textContent =
            actions.length;


        const needsAction =
            actions.length;


        document.getElementById(
            "needsAction"
        ).textContent =
            needsAction;


        /*
         * Kalau action masih ada,
         * berarti ada score yang belum mencapai 80.
         *
         * Kalau kosong berarti seluruh target
         * sudah terpenuhi.
         */

        document.getElementById(
            "onTrack"
        ).textContent =
            actions.length === 0
                ? 4
                : 0;


        /* =================================================
           TOP ACTION
        ================================================= */

        renderTopAction(
            actions.length > 0
                ? actions[0]
                : null
        );


        /* =================================================
           ACTION LIST
        ================================================= */

        renderActionList(
            actions
        );

    }


    /* =====================================================
       TOP ACTION
    ===================================================== */

    function renderTopAction(action) {

        const section =
            document.getElementById(
                "topActionSection"
            );


        if (!action) {

            section.style.display =
                "none";

            return;

        }


        section.style.display =
            "block";


        document.getElementById(
            "topActionSeverity"
        ).textContent =
            getPriorityText(
                action.priority
            );


        document.getElementById(
            "topActionSeverity"
        ).className =
            `severity-badge ${
                getPriorityClass(
                    action.priority
                )
            }`;


        document.getElementById(
            "topActionCategory"
        ).textContent =
            action.category ||
            "-";


        /*
         * Karena backend tidak mengirim title,
         * kita buat title berdasarkan category.
         */

        document.getElementById(
            "topActionTitle"
        ).textContent =
            `Tingkatkan ${action.category}`;


        document.getElementById(
            "topActionProblem"
        ).textContent =
            `Score ${action.category} saat ini ${
                formatScore(
                    action.current_score
                )
            }, sedangkan target minimum adalah ${
                formatScore(
                    action.target_score
                )
            }.`;


        document.getElementById(
            "topActionScore"
        ).textContent =
            formatScore(
                action.current_score
            );


        document.getElementById(
            "topActionAction"
        ).textContent =
            action.action ||
            "-";


        document.getElementById(
            "topActionDuration"
        ).textContent =
            action.duration ||
            "-";


        document.getElementById(
            "topActionImpact"
        ).textContent =
            action.success_indicator ||
            "-";

    }


    /* =====================================================
       ACTION LIST
    ===================================================== */

    function renderActionList(actions) {

        const container =
            document.getElementById(
                "actionPlanList"
            );


        container.innerHTML = "";


        /* =================================================
           EMPTY
        ================================================= */

        if (!actions.length) {

            container.innerHTML = `

                <div class="action-empty">

                    <strong>
                        Semua target telah tercapai
                    </strong>

                    <br><br>

                    Seluruh area utama telah mencapai
                    target score minimum 80.

                    <br>

                    Pertahankan performa bisnis
                    dan lakukan evaluasi secara berkala.

                </div>

            `;

            return;

        }


        /* =================================================
           LOOP ACTION
        ================================================= */

        actions.forEach(
            function(action, index) {

                const step =
                    index + 1;


                const priority =
                    action.priority ??
                    4;


                const category =
                    action.category ||
                    "-";


                const currentScore =
                    formatScore(
                        action.current_score
                    );


                const targetScore =
                    formatScore(
                        action.target_score
                    );


                const scoreGap =
                    formatScore(
                        action.score_gap
                    );


                const priorityText =
                    getPriorityText(
                        priority
                    );


                const priorityClass =
                    getPriorityClass(
                        priority
                    );


                const div =
                    document.createElement(
                        "article"
                    );


                div.className =
                    "action-card";


                div.innerHTML = `

                    <div
                        class="action-card-header"
                    >

                        <div
                            class="action-step"
                        >
                            ${step}
                        </div>


                        <div>

                            <h3
                                class="action-card-title"
                            >
                                Tingkatkan
                                ${escapeHTML(
                                    category
                                )}
                            </h3>


                            <div
                                class="action-card-meta"
                            >

                                <span
                                    class="${priorityClass}"
                                >
                                    ${priorityText}
                                </span>


                                <span
                                    class="category-meta"
                                >
                                    ${escapeHTML(
                                        category
                                    )}
                                </span>

                            </div>

                        </div>


                        <span
                            class="action-status status-needs"
                        >
                            Needs Action
                        </span>

                    </div>


                    <p
                        class="action-problem"
                    >
                        Score saat ini
                        <strong>
                            ${currentScore}
                        </strong>

                        dan masih membutuhkan
                        peningkatan sebesar
                        <strong>
                            ${scoreGap}
                        </strong>

                        poin untuk mencapai target
                        <strong>
                            ${targetScore}
                        </strong>.
                    </p>


                    <div
                        class="action-details"
                    >


                        <div
                            class="action-detail"
                        >

                            <span>
                                Current Score
                            </span>

                            <p
                                class="score-value"
                            >
                                ${currentScore}
                                / 100
                            </p>

                        </div>


                        <div
                            class="action-detail"
                        >

                            <span>
                                Target Score
                            </span>

                            <p
                                class="score-value"
                            >
                                ${targetScore}
                                / 100
                            </p>

                        </div>


                        <div
                            class="action-detail"
                        >

                            <span>
                                Score Gap
                            </span>

                            <p
                                class="score-value"
                            >
                                ${scoreGap}
                            </p>

                        </div>


                        <div
                            class="action-detail"
                        >

                            <span>
                                Durasi
                            </span>

                            <p>
                                ${escapeHTML(
                                    action.duration ||
                                    "-"
                                )}
                            </p>

                        </div>


                        <div
                            class="action-detail"
                        >

                            <span>
                                Tindakan
                            </span>

                            <p>
                                ${escapeHTML(
                                    action.action ||
                                    "-"
                                )}
                            </p>

                        </div>


                        <div
                            class="action-detail"
                        >

                            <span>
                                Indikator Keberhasilan
                            </span>

                            <p>
                                ${escapeHTML(
                                    action.success_indicator ||
                                    "-"
                                )}
                            </p>

                        </div>


                    </div>

                `;


                container.appendChild(
                    div
                );

            }
        );

    }


    /* =====================================================
       BACK
    ===================================================== */

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


    errorBackButton.addEventListener(
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


    /* =====================================================
       RETRY
    ===================================================== */

    retryButton.addEventListener(
        "click",
        function() {

            loadActionPlan();

        }
    );


    /* =====================================================
       LOGOUT
    ===================================================== */

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


    /* =====================================================
       START
    ===================================================== */

    loadActionPlan();

});