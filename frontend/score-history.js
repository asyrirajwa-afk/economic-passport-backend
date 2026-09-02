/* =========================================================
   ECONOMIC PASSPORT
   SCORE HISTORY
   ========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const API_BASE_URL =
    "https://economic-passport-backend-production.up.railway.app";


/* =========================================================
   AUTH
========================================================= */

const token =
    localStorage.getItem(
        "token"
    );


/* =========================================================
   BUSINESS ID
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const currentBusinessId =
    params.get(
        "business_id"
    ) ||
    localStorage.getItem(
        "selected_business_id"
    ) ||
    localStorage.getItem(
        "last_business_id"
    );


/* =========================================================
   DOM
========================================================= */

const businessName =
    document.getElementById(
        "businessName"
    );


const businessId =
    document.getElementById(
        "businessId"
    );


const totalRecords =
    document.getElementById(
        "totalRecords"
    );


const trendStatus =
    document.getElementById(
        "trendStatus"
    );


const firstScore =
    document.getElementById(
        "firstScore"
    );


const latestScore =
    document.getElementById(
        "latestScore"
    );


const scoreChange =
    document.getElementById(
        "scoreChange"
    );


const trend =
    document.getElementById(
        "trend"
    );


const changeCard =
    document.getElementById(
        "changeCard"
    );


const scoreChart =
    document.getElementById(
        "scoreChart"
    );


const historyList =
    document.getElementById(
        "historyList"
    );


const emptyState =
    document.getElementById(
        "emptyState"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const retryButton =
    document.getElementById(
        "retryButton"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const dashboardButton =
    document.getElementById(
        "dashboardButton"
    );


/* =========================================================
   LOGIN CHECK
========================================================= */

if (!token) {

    window.location.href =
        "index.html";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

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
   FORMAT SCORE
========================================================= */

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
        Number.isNaN(
            number
        )
    ) {

        return "-";

    }


    return number.toFixed(
        1
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

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

        return String(
            value
        );

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
   TREND CLASS
========================================================= */

function getTrendClass(
    value
) {

    const trendValue =
        String(
            value || ""
        )
            .toLowerCase();


    if (
        trendValue.includes(
            "improving"
        )
    ) {

        return "improving";

    }


    if (
        trendValue.includes(
            "declining"
        )
    ) {

        return "declining";

    }


    return "stable";

}


/* =========================================================
   API FETCH
========================================================= */

async function apiFetch(
    endpoint
) {

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


    let data = null;


    try {

        data =
            await response.json();

    }

    catch (
        error
    ) {

        throw new Error(
            "Server tidak mengembalikan data JSON."
        );

    }


    console.log(
        "================================"
    );


    console.log(
        "SCORE HISTORY RESPONSE"
    );


    console.log(
        "STATUS:",
        response.status
    );


    console.log(
        "DATA:",
        data
    );


    console.log(
        "================================"
    );


    if (
        response.status ===
        401
    ) {

        localStorage.removeItem(
            "token"
        );


        window.location.href =
            "index.html";


        return null;

    }


    if (
        !response.ok
    ) {

        throw new Error(
            data?.detail ||
            data?.message ||
            `Request gagal (${response.status})`
        );

    }


    return data;

}


/* =========================================================
   RENDER BUSINESS
========================================================= */

function renderBusiness(
    data
) {

    const business =
        data.business ||
        {};


    const summary =
        data.summary ||
        {};


    if (
        businessName
    ) {

        businessName.textContent =
            business.business_name ||
            "-";

    }


    if (
        businessId
    ) {

        businessId.textContent =
            business.id ??
            currentBusinessId ??
            "-";

    }


    if (
        totalRecords
    ) {

        totalRecords.textContent =
            summary.total_records ??
            0;

    }


    if (
        trendStatus
    ) {

        trendStatus.textContent =
            summary.trend ||
            "Insufficient Data";

    }

}


/* =========================================================
   RENDER SUMMARY
========================================================= */

function renderSummary(
    data
) {

    const summary =
        data.summary ||
        {};


    const initialScore =
        summary.first_score;


    const newestScore =
        summary.latest_score;


    const change =
        summary.change;


    const trendValue =
        summary.trend ||
        "Insufficient Data";


    if (
        firstScore
    ) {

        firstScore.textContent =
            formatScore(
                initialScore
            );

    }


    if (
        latestScore
    ) {

        latestScore.textContent =
            formatScore(
                newestScore
            );

    }


    if (
        scoreChange
    ) {

        if (
            change === null ||
            change === undefined
        ) {

            scoreChange.textContent =
                "-";

        }

        else {

            const numericChange =
                Number(change);


            if (
                numericChange > 0
            ) {

                scoreChange.textContent =
                    `↑ ${numericChange.toFixed(1)}`;

            }

            else if (
                numericChange < 0
            ) {

                scoreChange.textContent =
                    `↓ ${Math.abs(
                        numericChange
                    ).toFixed(1)}`;

            }

            else {

                scoreChange.textContent =
                    "0.0";

            }

        }

    }


    if (
        trend
    ) {

        trend.textContent =
            trendValue;

    }


    if (
        changeCard
    ) {

        changeCard.classList.remove(
            "improving",
            "declining",
            "stable"
        );


        changeCard.classList.add(
            getTrendClass(
                trendValue
            )
        );

    }

}


/* =========================================================
   CREATE CHART
========================================================= */

function renderChart(
    history
) {

    if (
        !scoreChart
    ) {

        return;

    }


    if (
        !history ||
        history.length === 0
    ) {

        scoreChart.innerHTML = `

            <div class="loading-state">

                <p>
                    Belum ada data untuk grafik.
                </p>

            </div>

        `;

        return;

    }


    const width =
        900;


    const height =
        270;


    const paddingLeft =
        50;


    const paddingRight =
        25;


    const paddingTop =
        20;


    const paddingBottom =
        25;


    const chartWidth =
        width -
        paddingLeft -
        paddingRight;


    const chartHeight =
        height -
        paddingTop -
        paddingBottom;


    const points =
        history.map(
            function (
                item,
                index
            ) {

                const score =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            Number(
                                item.business_score ||
                                0
                            )
                        )
                    );


                const x =
                    history.length === 1

                        ? paddingLeft +
                          chartWidth / 2

                        : paddingLeft +
                          (
                              index /
                              (
                                  history.length -
                                  1
                              )
                          ) *
                          chartWidth;


                const y =
                    paddingTop +
                    (
                        100 -
                        score
                    ) /
                    100 *
                    chartHeight;


                return {

                    x,
                    y,
                    score,

                    date:
                        formatDate(
                            item.date
                        )

                };

            }
        );


    const path =
        points
            .map(
                function (
                    point,
                    index
                ) {

                    return (
                        index === 0
                            ? "M"
                            : "L"
                    ) +
                    ` ${point.x} ${point.y}`;

                }
            )
            .join(" ");


    let gridHTML =
        "";


    for (
        let value = 0;
        value <= 100;
        value += 20
    ) {

        const y =
            paddingTop +
            (
                100 -
                value
            ) /
            100 *
            chartHeight;


        gridHTML += `

            <div
                class="chart-grid-line"
                style="
                    top:${y}px;
                "
            ></div>

            <span
                class="chart-label-y"
                style="
                    top:${y}px;
                "
            >
                ${value}
            </span>

        `;

    }


    let pointsHTML =
        "";


    points.forEach(
        function (
            point
        ) {

            pointsHTML += `

                <circle
                    class="chart-point"
                    cx="${point.x}"
                    cy="${point.y}"
                    r="5"
                >
                    <title>
                        ${point.date}
                        - Score ${formatScore(
                            point.score
                        )}
                    </title>
                </circle>

            `;

        }
    );


    let xLabelsHTML =
        "";


    points.forEach(
        function (
            point
        ) {

            xLabelsHTML += `

                <span
                    class="chart-x-label"
                >
                    ${escapeHTML(
                        point.date
                    )}
                </span>

            `;

        }
    );


    scoreChart.innerHTML = `

        <div
            class="chart-area"
        >

            ${gridHTML}

            <svg
                class="chart-svg"
                viewBox="
                    0
                    0
                    ${width}
                    ${height}
                "
                preserveAspectRatio="none"
            >

                <path
                    class="chart-line"
                    d="${path}"
                ></path>

                ${pointsHTML}

            </svg>

        </div>


        <div
            class="chart-x-labels"
        >

            ${xLabelsHTML}

        </div>

    `;

}


/* =========================================================
   RENDER HISTORY LIST
========================================================= */

function renderHistory(
    history
) {

    if (
        !historyList
    ) {

        return;

    }


    if (
        !history ||
        history.length === 0
    ) {

        historyList.innerHTML = "";

        return;

    }


    /*
       Backend mengurutkan history dari
       yang paling lama ke paling baru.

       Kita tampilkan yang terbaru
       di bagian atas agar lebih mudah dibaca.
    */

    const sortedHistory =
        [...history].reverse();


    historyList.innerHTML =
        sortedHistory
            .map(
                function (
                    item,
                    index
                ) {

                    const status =
                        item.status ||
                        "-";


                    return `

                        <div
                            class="history-item"
                        >

                            <div
                                class="history-main"
                            >

                                <strong>
                                    Score
                                    ${formatScore(
                                        item.business_score
                                    )}
                                    / 100
                                </strong>

                                <small>
                                    Assessment
                                    ${formatDate(
                                        item.date
                                    )}
                                </small>

                            </div>


                            <div
                                class="history-scores"
                            >

                                <span
                                    class="
                                        history-score
                                    "
                                >
                                    Profit:
                                    <strong>
                                        ${formatScore(
                                            item.profit_score
                                        )}
                                    </strong>
                                </span>


                                <span
                                    class="
                                        history-score
                                    "
                                >
                                    People:
                                    <strong>
                                        ${formatScore(
                                            item.people_score
                                        )}
                                    </strong>
                                </span>


                                <span
                                    class="
                                        history-score
                                    "
                                >
                                    Planet:
                                    <strong>
                                        ${formatScore(
                                            item.planet_score
                                        )}
                                    </strong>
                                </span>


                                <span
                                    class="
                                        history-score
                                    "
                                >
                                    Marketplace:
                                    <strong>
                                        ${formatScore(
                                            item.marketplace_health_score
                                        )}
                                    </strong>
                                </span>

                            </div>


                            <span
                                class="
                                    history-status
                                "
                            >
                                ${escapeHTML(
                                    status
                                )}
                            </span>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   SHOW EMPTY
========================================================= */

function showEmpty() {

    if (
        emptyState
    ) {

        emptyState.style.display =
            "block";

    }


    if (
        document.getElementById(
            "businessInfo"
        )
    ) {

        document.getElementById(
            "businessInfo"
        ).style.display =
            "none";

    }


    if (
        scoreChart
    ) {

        scoreChart.parentElement.parentElement.style.display =
            "none";

    }


    if (
        historyList
    ) {

        historyList.parentElement.style.display =
            "none";

    }

}


/* =========================================================
   HIDE EMPTY
========================================================= */

function hideEmpty() {

    if (
        emptyState
    ) {

        emptyState.style.display =
            "none";

    }

}


/* =========================================================
   SHOW ERROR
========================================================= */

function showError(
    message
) {

    console.error(
        "SCORE HISTORY ERROR:",
        message
    );


    if (
        errorState
    ) {

        errorState.style.display =
            "block";

    }


    if (
        errorMessage
    ) {

        errorMessage.textContent =
            message ||
            "Terjadi kesalahan.";

    }

}


/* =========================================================
   LOAD SCORE HISTORY
========================================================= */

async function loadScoreHistory() {

    if (
        !currentBusinessId
    ) {

        showError(
            "Business ID tidak ditemukan. Kembali ke Dashboard dan pilih bisnis."
        );

        return;

    }


    hideEmpty();


    console.log(
        "LOAD SCORE HISTORY"
    );


    console.log(
        "BUSINESS ID:",
        currentBusinessId
    );


    try {

        const data =
            await apiFetch(
                `/dashboard/${encodeURIComponent(
                    currentBusinessId
                )}/score-history`
            );


        if (
            !data
        ) {

            throw new Error(
                "Data score history tidak tersedia."
            );

        }


        const history =
            Array.isArray(
                data.history
            )
                ? data.history
                : [];


        console.log(
            "HISTORY:",
            history
        );


        /*
           BELUM ADA HISTORY
        */

        if (
            history.length === 0
        ) {

            showEmpty();

            return;

        }


        /*
           RENDER
        */

        renderBusiness(
            data
        );


        renderSummary(
            data
        );


        renderChart(
            history
        );


        renderHistory(
            history
        );


        console.log(
            "SCORE HISTORY BERHASIL DIMUAT"
        );

    }


    catch (
        error
    ) {

        showError(
            error.message
        );

    }

}


/* =========================================================
   BUTTON BACK
========================================================= */

if (
    backButton
) {

    backButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "dashboard.html";

        }
    );

}


/* =========================================================
   DASHBOARD BUTTON
========================================================= */

if (
    dashboardButton
) {

    dashboardButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "dashboard.html";

        }
    );

}


/* =========================================================
   RETRY
========================================================= */

if (
    retryButton
) {

    retryButton.addEventListener(
        "click",
        function () {

            if (
                errorState
            ) {

                errorState.style.display =
                    "none";

            }


            loadScoreHistory();

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
    function () {

        loadScoreHistory();

    }
);

const comparisonButton =
    document.getElementById("comparisonButton");

if (comparisonButton) {
    comparisonButton.addEventListener(
        "click",
        function () {

            const businessId =
                new URLSearchParams(
                    window.location.search
                ).get("business_id");

            window.location.href =
                `score-comparison.html?business_id=${encodeURIComponent(
                    businessId
                )}`;

        }
    );
}