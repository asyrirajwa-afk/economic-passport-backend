const API_BASE_URL = "https://economic-passport-backend-production.up.railway.app";


const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const content =
    document.getElementById("content");

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


const projectionButton =
    document.getElementById("projectionButton");

const actionPlanButton =
    document.getElementById("actionPlanButton");


/* =====================================================
   BUSINESS ID
===================================================== */

function getBusinessId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const urlBusinessId =
        params.get("business_id");


    if (urlBusinessId) {

        return urlBusinessId;
    }


    return (
        localStorage.getItem(
            "selected_business_id"
        ) ||
        localStorage.getItem(
            "last_business_id"
        )
    );
}


/* =====================================================
   TOKEN
===================================================== */

function getToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("access_token")
    );
}


/* =====================================================
   API FETCH
===================================================== */

async function apiFetch(endpoint) {

    const token =
        getToken();


    if (!token) {

        throw new Error(
            "Sesi login tidak ditemukan."
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
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


    if (response.status === 401) {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "access_token"
        );


        throw new Error(
            "Sesi login sudah berakhir. Silakan login kembali."
        );
    }


    if (!response.ok) {

        let message =
            `Gagal mengambil data. (${response.status})`;


        try {

            const errorData =
                await response.json();


            if (errorData.detail) {

                message =
                    errorData.detail;
            }

        } catch (error) {

            // Response bukan JSON.
        }


        throw new Error(message);
    }


    return await response.json();
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

        return "0.00";
    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {

        return "0.00";
    }


    return number.toFixed(2);
}


/* =====================================================
   SHOW STATE
===================================================== */

function showLoading() {

    loadingState.classList.remove(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    content.classList.add(
        "hidden"
    );
}


function showError(message) {

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );

    content.classList.add(
        "hidden"
    );


    errorMessage.textContent =
        message ||
        "Terjadi kesalahan.";
}


function showContent() {

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    content.classList.remove(
        "hidden"
    );
}


/* =====================================================
   RENDER BUSINESS
===================================================== */

function renderBusiness(data) {

    const business =
        data.business || {};


    document.getElementById(
        "businessName"
    ).textContent =
        business.business_name ||
        "Economic Passport";
}


/* =====================================================
   RENDER PASSPORT
===================================================== */

function renderPassport(data) {

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
}


/* =====================================================
   RENDER TARGET
===================================================== */

function renderTarget(data) {

    const target =
        data.target || {};


    const targetScore =
        Number(
            target.target_score ?? 80
        );


    document.getElementById(
        "targetScore"
    ).textContent =
        formatScore(
            targetScore
        );


    document.getElementById(
        "actionCount"
    ).textContent =
        Number(
            target.areas_requiring_action || 0
        );


    document.getElementById(
        "achievedCount"
    ).textContent =
        Number(
            target.areas_achieved || 0
        );
}


/* =====================================================
   RENDER TOP PRIORITY
===================================================== */

function renderTopPriority(data) {

    const top =
        data.top_priority;


    const card =
        document.getElementById(
            "topPriorityCard"
        );


    if (!top) {

        card.innerHTML = `

            <div class="priority-icon">
                ✓
            </div>

            <div class="priority-content">

                <div class="eyebrow">
                    ALL TARGETS MET
                </div>

                <h3>
                    Semua Area Sudah Mencapai Target
                </h3>

                <p>
                    Tidak terdapat area yang membutuhkan tindakan perbaikan berdasarkan target score saat ini.
                </p>

            </div>

        `;

        return;
    }


    document.getElementById(
        "topPriorityCategory"
    ).textContent =
        top.category ||
        "-";


    document.getElementById(
        "topPriorityScore"
    ).textContent =
        formatScore(
            top.current_score
        );


    document.getElementById(
        "topPriorityGap"
    ).textContent =
        formatScore(
            top.gap
        );


    document.getElementById(
        "topPrioritySeverity"
    ).textContent =
        top.severity ||
        "-";


    document.getElementById(
        "topPriorityDescription"
    ).textContent =
        getPriorityDescription(
            top
        );
}


/* =====================================================
   PRIORITY DESCRIPTION
===================================================== */

function getPriorityDescription(item) {

    const category =
        item.category ||
        "Area";


    const score =
        Number(
            item.current_score || 0
        );


    const gap =
        Number(
            item.gap || 0
        );


    if (score < 50) {

        return (
            `${category} menjadi prioritas utama karena ` +
            `score berada pada tingkat kritis. ` +
            `Diperlukan peningkatan sekitar ${formatScore(gap)} ` +
            `poin untuk mencapai target 80.`
        );
    }


    if (score < 65) {

        return (
            `${category} membutuhkan perhatian tinggi. ` +
            `Score masih berada ${formatScore(gap)} ` +
            `poin di bawah target 80.`
        );
    }


    if (score < 80) {

        return (
            `${category} belum mencapai target. ` +
            `Peningkatan sekitar ${formatScore(gap)} ` +
            `poin diperlukan untuk mencapai score 80.`
        );
    }


    return (
        `${category} sudah mencapai target minimum ` +
        `dan hanya memerlukan monitoring berkala.`
    );
}


/* =====================================================
   RENDER PRIORITIES
===================================================== */

function renderPriorities(data) {

    const list =
        document.getElementById(
            "priorityList"
        );


    const priorities =
        Array.isArray(data.priorities)
            ? data.priorities
            : [];


    list.innerHTML = "";


    document.getElementById(
        "priorityCount"
    ).textContent =
        `${priorities.length} Area`;


    if (!priorities.length) {

        list.innerHTML = `

            <div class="empty-state">

                <h4>
                    Tidak ada prioritas perbaikan
                </h4>

                <p>
                    Semua area bisnis telah mencapai target minimum.
                </p>

            </div>

        `;

        return;
    }


    priorities.forEach(
        (item, index) => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "priority-item";


            const priority =
                item.priority ||
                index + 1;


            const category =
                item.category ||
                "-";


            const score =
                Number(
                    item.current_score || 0
                );


            const target =
                Number(
                    item.target_score || 80
                );


            const gap =
                Number(
                    item.gap || 0
                );


            const severity =
                item.severity ||
                "-";


            const actionRequired =
                item.action_required === true;


            element.innerHTML = `

                <div class="priority-number">
                    ${priority}
                </div>


                <div class="priority-item-main">

                    <div class="priority-item-top">

                        <h4>
                            ${category}
                        </h4>

                        <span class="severity-badge">
                            ${severity}
                        </span>

                    </div>


                    <p>
                        ${getPriorityDescription(item)}
                    </p>

                </div>


                <div class="priority-score">

                    <b>
                        ${formatScore(score)}
                    </b>

                    <span>
                        / ${formatScore(target)}
                    </span>

                    <div class="gap-text">

                        ${
                            actionRequired
                                ? `Gap ${formatScore(gap)}`
                                : "Target tercapai"
                        }

                    </div>

                </div>

            `;


            list.appendChild(
                element
            );
        }
    );
}


/* =====================================================
   RENDER ACHIEVED AREAS
===================================================== */

function renderAchieved(data) {

    const list =
        document.getElementById(
            "achievedList"
        );


    const achieved =
        Array.isArray(
            data.achieved_areas
        )
            ? data.achieved_areas
            : [];


    list.innerHTML = "";


    if (!achieved.length) {

        list.innerHTML = `

            <div class="empty-state">

                <h4>
                    Belum ada area yang mencapai target
                </h4>

                <p>
                    Semua area masih perlu ditingkatkan menuju target 80.
                </p>

            </div>

        `;

        return;
    }


    achieved.forEach(
        (category) => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "achieved-item";


            element.textContent =
                category;


            list.appendChild(
                element
            );
        }
    );
}


/* =====================================================
   LOAD DATA
===================================================== */

async function loadImprovementPriorities() {

    showLoading();


    const businessId =
        getBusinessId();


    if (!businessId) {

        showError(
            "Business ID tidak ditemukan."
        );

        return;
    }


    try {

        localStorage.setItem(
            "selected_business_id",
            businessId
        );


        localStorage.setItem(
            "last_business_id",
            businessId
        );


        const data =
            await apiFetch(
                `/passport/${businessId}/improvement-priorities`
            );


        console.log(
            "IMPROVEMENT PRIORITIES RESPONSE:",
            data
        );


        renderBusiness(data);

        renderPassport(data);

        renderTarget(data);

        renderTopPriority(data);

        renderPriorities(data);

        renderAchieved(data);


        showContent();

    }

    catch (error) {

        console.error(
            "Improvement priorities error:",
            error
        );


        showError(
            error.message ||
            "Gagal memuat improvement priorities."
        );
    }
}


/* =====================================================
   NAVIGATION
===================================================== */

function goToProjection() {

    const businessId =
        getBusinessId();


    if (!businessId) {
        return;
    }


    window.location.href =
        `projection.html?business_id=${encodeURIComponent(
            businessId
        )}`;
}


function goToActionPlan() {

    const businessId =
        getBusinessId();


    if (!businessId) {
        return;
    }


    window.location.href =
        `action-plan.html?business_id=${encodeURIComponent(
            businessId
        )}`;
}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "access_token"
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


/* =====================================================
   EVENTS
===================================================== */

backButton.addEventListener(
    "click",
    goToProjection
);


errorBackButton.addEventListener(
    "click",
    goToProjection
);


retryButton.addEventListener(
    "click",
    loadImprovementPriorities
);


projectionButton.addEventListener(
    "click",
    goToProjection
);


actionPlanButton.addEventListener(
    "click",
    goToActionPlan
);


logoutButton.addEventListener(
    "click",
    logout
);


/* =====================================================
   INITIAL LOAD
===================================================== */

loadImprovementPriorities();