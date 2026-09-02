const API_BASE_URL = "http://127.0.0.1:8000";

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const content = document.getElementById("content");

const errorMessage = document.getElementById("errorMessage");

const backButton = document.getElementById("backButton");
const errorBackButton = document.getElementById("errorBackButton");
const retryButton = document.getElementById("retryButton");

const logoutButton = document.getElementById("logoutButton");

const comparisonButton =
    document.getElementById("comparisonButton");

const insightsButton =
    document.getElementById("insightsButton");


/* =====================================================
   GET BUSINESS ID
===================================================== */

function getBusinessId() {

    const params =
        new URLSearchParams(window.location.search);

    const urlBusinessId =
        params.get("business_id");

    if (urlBusinessId) {
        return urlBusinessId;
    }

    return (
        localStorage.getItem("selected_business_id") ||
        localStorage.getItem("last_business_id")
    );
}


/* =====================================================
   GET TOKEN
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

    const token = getToken();

    if (!token) {

        throw new Error(
            "Sesi login tidak ditemukan."
        );
    }


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


    if (response.status === 401) {

        localStorage.removeItem("token");
        localStorage.removeItem("access_token");

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
                message = errorData.detail;
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
   FORMAT CHANGE
===================================================== */

function formatChange(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "0.00";
    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {
        return "0.00";
    }


    if (number > 0) {

        return `+${number.toFixed(2)}`;
    }


    return number.toFixed(2);
}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(date.getTime())) {
        return "-";
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
   NORMALIZE TREND
===================================================== */

function normalizeTrend(value) {

    if (!value) {
        return "Stable";
    }


    const trend =
        String(value).toLowerCase();


    if (
        trend.includes("improv") ||
        trend.includes("increase") ||
        trend.includes("up") ||
        trend.includes("naik")
    ) {

        return "Improving";
    }


    if (
        trend.includes("declin") ||
        trend.includes("decrease") ||
        trend.includes("down") ||
        trend.includes("turun")
    ) {

        return "Declining";
    }


    return "Stable";
}


/* =====================================================
   TREND TITLE
===================================================== */

function getTrendTitle(trend) {

    if (trend === "Improving") {

        return "Score Mengalami Peningkatan";
    }


    if (trend === "Declining") {

        return "Score Mengalami Penurunan";
    }


    return "Score Relatif Stabil";
}


/* =====================================================
   TREND MESSAGE
===================================================== */

function getTrendMessage(
    trend,
    change
) {

    const numericChange =
        Number(change || 0);


    if (trend === "Improving") {

        return (
            `Score bisnis meningkat sebesar ` +
            `${Math.abs(numericChange).toFixed(2)} ` +
            `poin dibandingkan assessment pertama.`
        );
    }


    if (trend === "Declining") {

        return (
            `Score bisnis menurun sebesar ` +
            `${Math.abs(numericChange).toFixed(2)} ` +
            `poin dibandingkan assessment pertama.`
        );
    }


    return (
        "Perubahan score bisnis relatif stabil " +
        "dibandingkan assessment pertama."
    );
}


/* =====================================================
   SHOW LOADING
===================================================== */

function showLoading() {

    loadingState.classList.remove("hidden");

    errorState.classList.add("hidden");

    content.classList.add("hidden");
}


/* =====================================================
   SHOW ERROR
===================================================== */

function showError(message) {

    loadingState.classList.add("hidden");

    errorState.classList.remove("hidden");

    content.classList.add("hidden");

    errorMessage.textContent =
        message ||
        "Terjadi kesalahan.";
}


/* =====================================================
   SHOW CONTENT
===================================================== */

function showContent() {

    loadingState.classList.add("hidden");

    errorState.classList.add("hidden");

    content.classList.remove("hidden");
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
   RENDER SUMMARY
===================================================== */

function renderSummary(data) {

    const summary =
        data.summary || {};


    document.getElementById(
        "firstScore"
    ).textContent =
        formatScore(
            summary.first_score
        );


    document.getElementById(
        "latestScore"
    ).textContent =
        formatScore(
            summary.latest_score
        );


    document.getElementById(
        "totalChange"
    ).textContent =
        formatChange(
            summary.total_change
        );


    document.getElementById(
        "averageScore"
    ).textContent =
        formatScore(
            summary.average_score
        );


    const trend =
        normalizeTrend(
            summary.trend
        );


    document.getElementById(
        "trendBadge"
    ).textContent =
        trend;


    document.getElementById(
        "trendTitle"
    ).textContent =
        getTrendTitle(trend);


    document.getElementById(
        "trendMessage"
    ).textContent =
        getTrendMessage(
            trend,
            summary.total_change
        );


    const trendIcon =
        document.getElementById(
            "trendIcon"
        );


    if (trend === "Improving") {

        trendIcon.textContent = "↑";

    }

    else if (trend === "Declining") {

        trendIcon.textContent = "↓";

    }

    else {

        trendIcon.textContent = "→";
    }


    document.getElementById(
        "changeDescription"
    ).textContent =
        "Dari assessment pertama";
}


/* =====================================================
   RENDER LATEST DATE
===================================================== */

function renderLatestDate(data) {

    const timeline = getTrendHistory(data);


    const latestDateElement =
        document.getElementById(
            "latestDate"
        );


    if (!timeline.length) {

        latestDateElement.textContent =
            "Assessment terbaru";

        return;
    }


    const latest =
        timeline[timeline.length - 1];


    latestDateElement.textContent =
        formatDate(
            latest.date
        );
}


/* =====================================================
   GET BUSINESS SCORE
===================================================== */

function getBusinessScore(item) {

    return Number(
        item.business_score || 0
    );
}

/* =====================================================
   GET TREND HISTORY
===================================================== */

function getTrendHistory(data) {

    // Backend dapat menggunakan "timeline"
    // atau "trend" tergantung route yang aktif.

    if (Array.isArray(data.timeline)) {
        return data.timeline;
    }

    if (Array.isArray(data.trend)) {
        return data.trend;
    }

    return [];
}


/* =====================================================
   RENDER CHART
===================================================== */

function renderChart(data) {

    /*
        BACKEND:
        data.timeline[]

        setiap item:
        {
            assessment_number,
            passport_id,
            business_score,
            status,
            date
        }
    */

    const timeline =
    getTrendHistory(data);


    const svg =
        document.getElementById(
            "trendChart"
        );


    const labels =
        document.getElementById(
            "chartLabels"
        );


    const chartPoints =
        document.getElementById(
            "chartPoints"
        );


    svg.innerHTML = "";

    labels.innerHTML = "";

    chartPoints.innerHTML = "";


    if (!timeline.length) {
        return;
    }


    const width = 1000;

    const height = 400;

    const paddingX = 25;

    const paddingY = 20;


    /*
        HITUNG TITIK GRAFIK
    */

    const points =
        timeline.map(
            (item, index) => {

                const score =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            getBusinessScore(item)
                        )
                    );


                let x;


                if (timeline.length === 1) {

                    x =
                        width / 2;

                }

                else {

                    x =
                        paddingX +
                        (
                            index /
                            (timeline.length - 1)
                        ) *
                        (
                            width -
                            paddingX * 2
                        );
                }


                const y =
                    height -
                    paddingY -
                    (
                        score / 100
                    ) *
                    (
                        height -
                        paddingY * 2
                    );


                return {
                    x,
                    y,
                    score,
                    item
                };
            }
        );


    /*
        BUAT GARIS
    */

    const linePath =
        points
            .map(
                (point, index) => {

                    return (
                        `${index === 0 ? "M" : "L"} ` +
                        `${point.x} ${point.y}`
                    );
                }
            )
            .join(" ");


    const line =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );


    line.setAttribute(
        "d",
        linePath
    );


    line.setAttribute(
        "class",
        "chart-line"
    );


    svg.appendChild(line);


    /*
        AREA DI BAWAH GRAFIK
    */

    if (points.length > 1) {

        const first =
            points[0];

        const last =
            points[points.length - 1];


        const fillPath =
            `${linePath} ` +
            `L ${last.x} ${height} ` +
            `L ${first.x} ${height} Z`;


        const fill =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );


        fill.setAttribute(
            "d",
            fillPath
        );


        fill.setAttribute(
            "class",
            "chart-area-fill"
        );


        svg.insertBefore(
            fill,
            line
        );
    }


    /*
        TITIK SCORE
    */

    points.forEach(
        (point) => {

            const percentX =
                (
                    point.x /
                    width
                ) * 100;


            const percentY =
                (
                    point.y /
                    height
                ) * 100;


            const tooltip =
                document.createElement(
                    "div"
                );


            tooltip.className =
                "point-tooltip";


            tooltip.style.left =
                `${percentX}%`;


            tooltip.style.top =
                `${percentY}%`;


            tooltip.textContent =
                formatScore(
                    point.score
                );


            chartPoints.appendChild(
                tooltip
            );
        }
    );


    /*
        LABEL ASSESSMENT
    */

    timeline.forEach(
        (item, index) => {

            const label =
                document.createElement(
                    "div"
                );


            label.className =
                "chart-label";


            label.textContent =
                `Assessment ${item.assessment_number || index + 1}`;


            labels.appendChild(
                label
            );
        }
    );
}


/* =====================================================
   RENDER TIMELINE
===================================================== */

function renderTimeline(data) {

    const timelineData =
    getTrendHistory(data);


    const timeline =
        document.getElementById(
            "timeline"
        );


    const assessmentCount =
        document.getElementById(
            "assessmentCount"
        );


    timeline.innerHTML = "";


    assessmentCount.textContent =
        `${timelineData.length} Assessment`;


    if (!timelineData.length) {

        timeline.innerHTML = `
            <div class="timeline-item">

                <div class="timeline-info">

                    <h4>
                        Belum ada data assessment
                    </h4>

                    <p>
                        Data perkembangan score
                        belum tersedia.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    timelineData.forEach(
        (item, index) => {

            const score =
                getBusinessScore(item);


            let previousScore =
                null;


            if (index > 0) {

                previousScore =
                    getBusinessScore(
                        timelineData[index - 1]
                    );
            }


            let change =
                null;


            if (previousScore !== null) {

                change =
                    score -
                    previousScore;
            }


            const date =
                item.date;


            const status =
                item.status ||
                "Assessment";


            const assessmentNumber =
                item.assessment_number ||
                index + 1;


            const itemElement =
                document.createElement(
                    "div"
                );


            itemElement.className =
                "timeline-item";


            let changeHtml;


            if (change !== null) {

                const prefix =
                    change > 0
                        ? "+"
                        : "";


                changeHtml = `
                    <div class="timeline-change">
                        ${prefix}${change.toFixed(2)} poin
                    </div>
                `;

            }

            else {

                changeHtml = `
                    <div class="timeline-change">
                        Assessment pertama
                    </div>
                `;
            }


            itemElement.innerHTML = `

                <div class="timeline-date">
                    ${formatDate(date)}
                </div>


                <div class="timeline-info">

                    <h4>
                        Assessment ${assessmentNumber}
                    </h4>

                    <p>
                        ${status}
                    </p>

                </div>


                <div class="timeline-score">

                    <b>
                        ${formatScore(score)}
                    </b>

                    ${changeHtml}

                </div>

            `;


            timeline.appendChild(
                itemElement
            );
        }
    );
}


/* =====================================================
   RENDER INSIGHT
===================================================== */

function renderInsight(data) {

    const summary =
        data.summary || {};


    const trend =
        normalizeTrend(
            summary.trend
        );


    const title =
        document.getElementById(
            "insightTitle"
        );


    const description =
        document.getElementById(
            "insightDescription"
        );


    if (trend === "Improving") {

        title.textContent =
            "Performa bisnis menunjukkan perkembangan positif.";


        description.textContent =
            "Score terbaru berada di atas score assessment pertama. Hal ini menunjukkan adanya peningkatan kondisi bisnis berdasarkan riwayat assessment yang tersedia.";

    }

    else if (trend === "Declining") {

        title.textContent =
            "Performa bisnis membutuhkan perhatian.";


        description.textContent =
            "Score terbaru berada di bawah score assessment pertama. Perubahan ini menunjukkan adanya area bisnis yang perlu dievaluasi lebih lanjut.";

    }

    else {

        title.textContent =
            "Performa bisnis relatif stabil.";


        description.textContent =
            "Perubahan score bisnis relatif terbatas berdasarkan riwayat assessment yang tersedia.";
    }
}


/* =====================================================
   LOAD TREND
===================================================== */

async function loadTrend() {

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
                `/passport/${businessId}/trend`
            );


        console.log(
            "TREND RESPONSE:",
            data
        );


        renderBusiness(data);

        renderSummary(data);

        renderLatestDate(data);

        renderChart(data);

        renderTimeline(data);

        renderInsight(data);


        showContent();

    }

    catch (error) {

        console.error(
            "Trend error:",
            error
        );


        showError(
            error.message ||
            "Gagal memuat data trend."
        );
    }
}


/* =====================================================
   GO TO SCORE COMPARISON
===================================================== */

function goToComparison() {

    const businessId =
        getBusinessId();


    if (!businessId) {
        return;
    }


    window.location.href =
        `score-comparison.html?business_id=${encodeURIComponent(
            businessId
        )}`;
}


/* =====================================================
   GO TO INSIGHTS
===================================================== */

function goToInsights() {

    const businessId =
        getBusinessId();


    if (!businessId) {
        return;
    }


    window.location.href =
        `insights.html?business_id=${encodeURIComponent(
            businessId
        )}`;
}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    localStorage.removeItem("token");

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
   EVENT LISTENERS
===================================================== */

backButton.addEventListener(
    "click",
    goToComparison
);


errorBackButton.addEventListener(
    "click",
    goToComparison
);


retryButton.addEventListener(
    "click",
    loadTrend
);


comparisonButton.addEventListener(
    "click",
    goToComparison
);


insightsButton.addEventListener(
    "click",
    goToInsights
);


logoutButton.addEventListener(
    "click",
    logout
);


/* =====================================================
   INITIAL LOAD
===================================================== */

loadTrend();