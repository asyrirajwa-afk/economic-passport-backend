/* =========================================================
   BUSINESS HEALTH CHECK
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";

const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);

const businessId =
    params.get("business_id") ||
    localStorage.getItem("selected_business_id") ||
    localStorage.getItem("last_business_id");


/* =========================================================
   DOM
========================================================= */

const businessName =
    document.getElementById("businessName");

const businessIdElement =
    document.getElementById("businessId");

const passportStatus =
    document.getElementById("passportStatus");

const businessScore =
    document.getElementById("businessScore");

const overallHealth =
    document.getElementById("overallHealth");

const healthAreas =
    document.getElementById("healthAreas");

const highestRisk =
    document.getElementById("highestRisk");

const healthyCount =
    document.getElementById("healthyCount");

const monitorCount =
    document.getElementById("monitorCount");

const attentionCount =
    document.getElementById("attentionCount");

const criticalCount =
    document.getElementById("criticalCount");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const retryButton =
    document.getElementById("retryButton");

const backButton =
    document.getElementById("backButton");

const logoutButton =
    document.getElementById("logoutButton");


/* =========================================================
   CHECK LOGIN
========================================================= */

if (!token) {
    window.location.href = "index.html";
}


/* =========================================================
   HELPER
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatScore(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return "-";
    }

    return number.toFixed(1);
}


function getStatusClass(status) {

    const value =
        String(status || "")
            .toLowerCase();

    if (value.includes("healthy")) {
        return "healthy";
    }

    if (value.includes("monitor")) {
        return "monitor";
    }

    if (
        value.includes("attention") ||
        value.includes("improvement")
    ) {
        return "attention";
    }

    if (
        value.includes("critical") ||
        value.includes("risk")
    ) {
        return "critical";
    }

    return "monitor";
}


/* =========================================================
   API
========================================================= */

async function apiFetch(endpoint) {

    const response = await fetch(
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


    let data = null;

    try {
        data = await response.json();
    }

    catch (error) {

        throw new Error(
            "Server tidak mengembalikan JSON."
        );

    }


    console.log(
        "===================================="
    );

    console.log(
        "HEALTH CHECK RESPONSE"
    );

    console.log(
        data
    );

    console.log(
        "===================================="
    );


    if (!response.ok) {

        throw new Error(
            data?.detail ||
            data?.message ||
            `Request gagal (${response.status})`
        );
    }


    return data;
}


/* =========================================================
   NORMALIZE RESPONSE
========================================================= */

function normalizeHealthData(data) {

    console.log(
        "NORMALIZING DATA:",
        data
    );


    /*
       BUSINESS
    */

    const business =
        data.business ||
        data.business_data ||
        {};


    /*
       PASSPORT

       Backend versi terbaru:
       data.passport

       Beberapa endpoint lama:
       data.passport_data
       data.economic_passport
    */

    const passport =
        data.passport ||
        data.passport_data ||
        data.economic_passport ||
        {};


    /*
       SCORE

       Backend Health Check:
       passport.overall_score

       Backend lama:
       overall.score
       score.overall
    */

    const overall =
        data.overall ||
        {};


    const scoreObject =
        data.score ||
        data.scores ||
        {};


    const overallScore =
        passport.overall_score ??
        passport.business_score ??
        overall.score ??
        scoreObject.overall ??
        data.business_score ??
        0;


    /*
       STATUS
    */

    const passportStatus =
        passport.overall_status ??
        passport.status ??
        overall.passport_status ??
        data.status ??
        "-";


    const health =
        data.health ||
        {};


    const healthStatus =
        health.status ??
        overall.health_status ??
        "-";


    const healthMessage =
        health.message ??
        overall.message ??
        "Kondisi bisnis berhasil diperiksa.";


    /*
       AREAS
    */

    let areas = [];


    if (
        Array.isArray(data.areas)
    ) {

        areas = data.areas;

    }

    else if (
        data.areas &&
        typeof data.areas === "object"
    ) {

        areas = Object.entries(
            data.areas
        ).map(
            ([key, value]) => {

                return {
                    category:
                        key
                            .charAt(0)
                            .toUpperCase() +
                        key.slice(1),

                    score:
                        value?.score ??
                        0,

                    status:
                        value?.status ??
                        "-",

                    severity:
                        value?.severity ??
                        "-",

                    message:
                        value?.message ??
                        "Tidak ada keterangan."
                };

            }
        );

    }


    /*
       FALLBACK DARI SCORE PASSPORT

       Ini penting.

       Kalau backend mengirim scores tetapi
       tidak mengirim areas, kita tetap
       bisa membuat empat area dari data
       passport.
    */

    if (
        areas.length === 0
    ) {

        const areaScores = {

            Profit:
                passport.profit_score ??
                scoreObject.profit ??
                scoreObject.profit_score,

            People:
                passport.people_score ??
                scoreObject.people ??
                scoreObject.people_score,

            Planet:
                passport.planet_score ??
                scoreObject.planet ??
                scoreObject.planet_score,

            Marketplace:
                passport.marketplace_health_score ??
                scoreObject.marketplace ??
                scoreObject.marketplace_health_score

        };


        areas = Object.entries(
            areaScores
        )
            .filter(
                ([key, value]) =>
                    value !== null &&
                    value !== undefined
            )
            .map(
                ([key, value]) => {

                    const numericScore =
                        Number(value);


                    let status;


                    if (
                        numericScore >= 80
                    ) {
                        status = "Healthy";
                    }

                    else if (
                        numericScore >= 65
                    ) {
                        status = "Monitor";
                    }

                    else if (
                        numericScore >= 50
                    ) {
                        status = "Attention";
                    }

                    else {
                        status = "Critical";
                    }


                    return {

                        category: key,

                        score:
                            numericScore,

                        status:

                            status,

                        severity:

                            numericScore >= 80
                                ? "Low"
                                : numericScore >= 65
                                    ? "Medium"
                                    : numericScore >= 50
                                        ? "High"
                                        : "Critical",

                        message:

                            numericScore >= 80
                                ? "Performa area berada pada kondisi baik."
                                : numericScore >= 65
                                    ? "Area masih cukup baik tetapi perlu dipantau."
                                    : numericScore >= 50
                                        ? "Area membutuhkan perhatian dan perbaikan."
                                        : "Area berada pada kondisi kritis dan membutuhkan tindakan segera."

                    };

                }
            );

    }


    /*
       COUNTER
    */

    let healthy = 0;
    let monitor = 0;
    let attention = 0;
    let critical = 0;


    areas.forEach(
        area => {

            const status =
                String(
                    area.status || ""
                ).toLowerCase();


            if (
                status === "healthy"
            ) {
                healthy++;
            }

            else if (
                status === "monitor"
            ) {
                monitor++;
            }

            else if (
                status === "attention" ||
                status.includes("improvement")
            ) {
                attention++;
            }

            else if (
                status === "critical" ||
                status.includes("risk")
            ) {
                critical++;
            }

        }
    );


    /*
       HIGHEST RISK
    */

    let highestRisk =
        data.highest_risk ||
        null;


    if (
        !highestRisk &&
        areas.length > 0
    ) {

        highestRisk =
            areas.reduce(
                (lowest, current) => {

                    return Number(
                        current.score
                    ) <
                    Number(
                        lowest.score
                    )
                        ? current
                        : lowest;

                }
            );

    }


    return {

        business,

        passport,

        overallScore,

        passportStatus,

        healthStatus,

        healthMessage,

        healthy,

        monitor,

        attention,

        critical,

        areas,

        highestRisk

    };

}


/* =========================================================
   RENDER BUSINESS
========================================================= */

function renderBusiness(
    data
) {

    if (businessName) {

        businessName.textContent =
            data.business.business_name ||
            "Asyri Craft";

    }


    if (businessIdElement) {

        businessIdElement.textContent =
            data.business.id ??
            businessId ??
            "-";

    }


    if (passportStatus) {

        passportStatus.textContent =
            data.passportStatus;

    }


    if (businessScore) {

        businessScore.textContent =
            formatScore(
                data.overallScore
            );

    }

}


/* =========================================================
   RENDER OVERALL
========================================================= */

function renderOverall(
    data
) {

    if (!overallHealth) {
        return;
    }


    const className =
        getStatusClass(
            data.healthStatus
        );


    overallHealth.innerHTML = `

        <div class="overall-content">

            <div class="overall-info">

                <span class="overall-label">
                    Business Health
                </span>

                <span
                    class="
                        overall-status
                        ${className}
                    "
                >
                    ${escapeHTML(
                        data.healthStatus
                    )}
                </span>

                <p class="overall-message">
                    ${escapeHTML(
                        data.healthMessage
                    )}
                </p>

            </div>


            <div class="overall-score">

                <span>
                    Business Score
                </span>

                <strong>
                    ${formatScore(
                        data.overallScore
                    )}
                </strong>

                <small>
                    / 100
                </small>

            </div>

        </div>

    `;

}


/* =========================================================
   RENDER COUNTERS
========================================================= */

function renderCounters(
    data
) {

    if (healthyCount) {
        healthyCount.textContent =
            data.healthy;
    }

    if (monitorCount) {
        monitorCount.textContent =
            data.monitor;
    }

    if (attentionCount) {
        attentionCount.textContent =
            data.attention;
    }

    if (criticalCount) {
        criticalCount.textContent =
            data.critical;
    }

}


/* =========================================================
   RENDER AREAS
========================================================= */

function renderAreas(
    data
) {

    if (!healthAreas) {
        return;
    }


    if (
        data.areas.length === 0
    ) {

        healthAreas.innerHTML = `

            <div class="empty-state">

                <h3>
                    Data area belum tersedia
                </h3>

                <p>
                    Backend belum mengirim
                    data area kesehatan bisnis.
                </p>

            </div>

        `;

        return;
    }


    healthAreas.innerHTML =
        data.areas
            .map(
                area => {

                    const score =
                        Number(
                            area.score || 0
                        );


                    const safeScore =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                score
                            )
                        );


                    const status =
                        area.status ||
                        "-";


                    const className =
                        getStatusClass(
                            status
                        );


                    return `

                        <article
                            class="
                                health-area-card
                                ${className}
                            "
                        >

                            <div
                                class="
                                    health-area-header
                                "
                            >

                                <div>

                                    <h3>
                                        ${escapeHTML(
                                            area.category
                                        )}
                                    </h3>

                                    <p>
                                        Kondisi aspek bisnis
                                    </p>

                                </div>


                                <span
                                    class="
                                        health-status
                                        ${className}
                                    "
                                >
                                    ${escapeHTML(
                                        status
                                    )}
                                </span>

                            </div>


                            <div
                                class="score-row"
                            >

                                <div
                                    class="score-bar"
                                >

                                    <div
                                        class="
                                            score-fill
                                            ${className}
                                        "
                                        style="
                                            width:
                                            ${safeScore}%;
                                        "
                                    ></div>

                                </div>


                                <div
                                    class="score-value"
                                >
                                    ${formatScore(
                                        score
                                    )}
                                </div>

                            </div>


                            <p
                                class="
                                    health-area-message
                                "
                            >
                                ${escapeHTML(
                                    area.message ||
                                    "Tidak ada keterangan."
                                )}
                            </p>


                            <div
                                class="
                                    health-area-severity
                                "
                            >

                                Severity:

                                <strong>
                                    ${escapeHTML(
                                        area.severity ||
                                        "-"
                                    )}
                                </strong>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   RENDER RISK
========================================================= */

function renderRisk(
    data
) {

    if (!highestRisk) {
        return;
    }


    const risk =
        data.highestRisk;


    if (!risk) {

        highestRisk.innerHTML = `

            <div class="risk-content">

                <div class="risk-info">

                    <span class="risk-label">
                        STATUS
                    </span>

                    <h3>
                        Tidak ada area risiko
                    </h3>

                    <p>
                        Semua area bisnis
                        berada pada kondisi baik.
                    </p>

                </div>

            </div>

        `;

        return;
    }


    highestRisk.innerHTML = `

        <div class="risk-content">

            <div class="risk-info">

                <span class="risk-label">
                    PRIORITAS PERHATIAN
                </span>

                <h3>
                    ${escapeHTML(
                        risk.category
                    )}
                </h3>

                <p>
                    Area ini memiliki
                    score terendah dibandingkan
                    area lainnya.
                </p>

                <p style="margin-top:7px;">

                    Status:

                    <strong>
                        ${escapeHTML(
                            risk.status ||
                            "-"
                        )}
                    </strong>

                    · Severity:

                    <strong>
                        ${escapeHTML(
                            risk.severity ||
                            "-"
                        )}
                    </strong>

                </p>

            </div>


            <div class="risk-score">

                <span>
                    Score
                </span>

                <strong>
                    ${formatScore(
                        risk.score
                    )}
                </strong>

            </div>

        </div>

    `;

}


/* =========================================================
   LOAD
========================================================= */

async function loadHealthCheck() {

    if (!businessId) {

        showError(
            "Business ID tidak ditemukan."
        );

        return;
    }


    try {

        console.log(
            "LOAD HEALTH CHECK:",
            businessId
        );


        const rawData =
            await apiFetch(
                `/dashboard/${encodeURIComponent(
                    businessId
                )}/health-check`
            );


        /*
           NORMALISASI
        */

        const data =
            normalizeHealthData(
                rawData
            );


        console.log(
            "NORMALIZED HEALTH DATA:",
            data
        );


        /*
           RENDER
        */

        renderBusiness(
            data
        );


        renderOverall(
            data
        );


        renderCounters(
            data
        );


        renderAreas(
            data
        );


        renderRisk(
            data
        );


        if (overallHealth) {
            overallHealth.style.display =
                "block";
        }


        if (healthAreas) {
            healthAreas.style.display =
                "grid";
        }


        if (highestRisk) {
            highestRisk.style.display =
                "block";
        }


    }

    catch (error) {

        console.error(
            "HEALTH CHECK ERROR:",
            error
        );


        showError(
            error.message
        );

    }

}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    if (errorState) {
        errorState.style.display =
            "block";
    }


    if (errorMessage) {
        errorMessage.textContent =
            message ||
            "Terjadi kesalahan.";
    }


    if (overallHealth) {
        overallHealth.style.display =
            "none";
    }


    if (healthAreas) {
        healthAreas.style.display =
            "none";
    }


    if (highestRisk) {
        highestRisk.style.display =
            "none";
    }

}


/* =========================================================
   BUTTONS
========================================================= */

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";

        }
    );

}


if (retryButton) {

    retryButton.addEventListener(
        "click",
        () => {

            if (errorState) {
                errorState.style.display =
                    "none";
            }

            loadHealthCheck();

        }
    );

}


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

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


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadHealthCheck();

    }
);