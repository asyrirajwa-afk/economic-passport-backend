console.log("=================================");
console.log("MARKETPLACE.JS BERHASIL DIMUAT");
console.log("=================================");


/* =====================================================
   CONFIG
===================================================== */

const API_URL = "http://127.0.0.1:8000";


/* =====================================================
   TOKEN
===================================================== */

const token =
    localStorage.getItem("token");


console.log(
    "TOKEN:",
    token ? "ADA" : "TIDAK ADA"
);


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
    "BUSINESS ID DARI URL:",
    urlBusinessId
);

console.log(
    "BUSINESS ID TERPILIH:",
    selectedBusinessId
);

console.log(
    "BUSINESS ID TERAKHIR:",
    lastBusinessId
);

console.log(
    "BUSINESS ID AKTIF:",
    businessId || "TIDAK ADA"
);


/* =====================================================
   ELEMENT
===================================================== */

const marketplaceList =
    document.getElementById(
        "marketplaceList"
    );


const recommendedSection =
    document.getElementById(
        "recommendedSection"
    );


const recommendedName =
    document.getElementById(
        "recommendedName"
    );


const recommendedScore =
    document.getElementById(
        "recommendedScore"
    );


const recommendedReason =
    document.getElementById(
        "recommendedReason"
    );


const businessName =
    document.getElementById(
        "businessName"
    );


const businessCategory =
    document.getElementById(
        "businessCategory"
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


/* =====================================================
   CEK TOKEN
===================================================== */

if (!token) {

    console.error(
        "TOKEN TIDAK DITEMUKAN"
    );


    window.location.href =
        "index.html";

}


/* =====================================================
   SIMPAN BUSINESS ID
===================================================== */

if (businessId) {

    localStorage.setItem(
        "selected_business_id",
        businessId
    );

    localStorage.setItem(
        "last_business_id",
        businessId
    );

}


/* =====================================================
   ERROR HANDLER
===================================================== */

function showError(message) {

    console.error(
        "MARKETPLACE ERROR:",
        message
    );


    if (marketplaceList) {

        marketplaceList.innerHTML =
            "";

    }


    if (recommendedSection) {

        recommendedSection.style.display =
            "none";

    }


    if (errorState) {

        errorState.style.display =
            "block";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message ||
            "Terjadi kesalahan.";

    }

}


/* =====================================================
   HIDE ERROR
===================================================== */

function hideError() {

    if (errorState) {

        errorState.style.display =
            "none";

    }

}


/* =====================================================
   FORMAT RUPIAH
===================================================== */

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


/* =====================================================
   FORMAT PERCENT
===================================================== */

function formatPercent(value) {

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


    return `${number.toFixed(1)}%`;

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


    return Math.round(
        number
    );

}


/* =====================================================
   SCORE STATUS
===================================================== */

function getScoreStatus(score) {

    const value =
        Number(score);


    if (
        Number.isNaN(value)
    ) {

        return "Unknown";

    }


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
   API FETCH HELPER
===================================================== */

async function apiFetch(
    endpoint,
    options = {}
) {

    const headers = {

        "Authorization":
            `Bearer ${token}`,

        "Content-Type":
            "application/json",

        ...(options.headers || {})

    };


    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    }

    catch (error) {

        console.warn(
            "Response bukan JSON:",
            error
        );

    }


    /* ==============================================
       TOKEN EXPIRED
    ============================================== */

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


        throw new Error(
            "Sesi login telah berakhir."
        );

    }


    /* ==============================================
       ERROR BACKEND
    ============================================== */

    if (
        !response.ok
    ) {

        let message =
            `Request gagal (${response.status})`;


        if (
            data &&
            data.detail
        ) {

            if (
                Array.isArray(
                    data.detail
                )
            ) {

                message =
                    data.detail
                        .map(
                            item =>
                                item.msg ||
                                item.message ||
                                String(item)
                        )
                        .join(", ");

            }

            else {

                message =
                    data.detail;

            }

        }

        else if (
            data &&
            data.message
        ) {

            message =
                data.message;

        }


        throw new Error(
            message
        );

    }


    return data;

}


/* =====================================================
   MARKETPLACE LOGO TEXT
===================================================== */

function getLogoText(
    marketplace
) {

    const name =
        String(
            marketplace.name ||
            marketplace.marketplace_name ||
            ""
        ).toLowerCase();


    if (
        name.includes("shopee")
    ) {

        return "SHOPEE";

    }


    if (
        name.includes("tokopedia")
    ) {

        return "TOKOPEDIA";

    }


    if (
        name.includes("tiktok")
    )
    {

        return "TIKTOK";

    }


    if (
        name.includes("lazada")
    ) {

        return "LAZADA";

    }


    if (
        name.includes("blibli")
    ) {

        return "BLIBLI";

    }


    return (
        marketplace.logo_tag ||
        marketplace.alias ||
        "MARKET"
    );

}


/* =====================================================
   GET VALUE DENGAN BEBERAPA ALIAS
===================================================== */

function getMarketplaceValue(
    marketplace,
    ...keys
) {

    for (
        const key of keys
    ) {

        if (
            marketplace[key] !==
            undefined &&
            marketplace[key] !==
            null
        ) {

            return marketplace[key];

        }

    }


    return 0;

}


/* =====================================================
   CALCULATE MARKETPLACE SCORE
===================================================== */

/*
 * Score marketplace digunakan untuk
 * membandingkan platform berdasarkan:
 *
 * 1. Platform cost
 * 2. Commission
 * 3. Service fee
 * 4. Payment fee
 * 5. Traffic
 *
 * Score akhir berada pada rentang 0-100.
 */

function calculateMarketplaceScore(
    marketplace
) {

    let score = 100;


    const platformCost =
        Number(
            getMarketplaceValue(
                marketplace,
                "platform_cost_percent",
                "platform_fee_percent",
                "platform_cost"
            )
        ) || 0;


    const commissionFee =
        Number(
            getMarketplaceValue(
                marketplace,
                "commission_fee_percent",
                "commission_percent",
                "commission_fee"
            )
        ) || 0;


    const serviceFee =
        Number(
            getMarketplaceValue(
                marketplace,
                "service_fee_percent",
                "service_percent",
                "service_fee"
            )
        ) || 0;


    const paymentFee =
        Number(
            getMarketplaceValue(
                marketplace,
                "payment_fee_percent",
                "payment_percent",
                "payment_fee"
            )
        ) || 0;


    const totalCost =
        platformCost +
        commissionFee +
        serviceFee +
        paymentFee;


    /*
     * Setiap 1% total biaya
     * mengurangi score sebesar 2.
     */

    score -=
        totalCost * 2;


    /*
     * Traffic memberikan bonus.
     */

    const traffic =
        Number(
            getMarketplaceValue(
                marketplace,
                "average_traffic_index",
                "traffic_index",
                "traffic"
            )
        ) || 0;


    if (
        traffic > 100
    ) {

        score += 5;

    }

    else if (
        traffic > 70
    ) {

        score += 3;

    }

    else if (
        traffic > 40
    ) {

        score += 1;

    }


    /*
     * Batasi 0-100.
     */

    score =
        Math.max(
            0,
            Math.min(
                100,
                score
            )
        );


    return Math.round(
        score
    );

}


/* =====================================================
   TOTAL MARKETPLACE COST
===================================================== */

function calculateTotalCost(
    marketplace
) {

    const platform =
        Number(
            getMarketplaceValue(
                marketplace,
                "platform_cost_percent",
                "platform_fee_percent",
                "platform_cost"
            )
        ) || 0;


    const commission =
        Number(
            getMarketplaceValue(
                marketplace,
                "commission_fee_percent",
                "commission_percent",
                "commission_fee"
            )
        ) || 0;


    const service =
        Number(
            getMarketplaceValue(
                marketplace,
                "service_fee_percent",
                "service_percent",
                "service_fee"
            )
        ) || 0;


    const payment =
        Number(
            getMarketplaceValue(
                marketplace,
                "payment_fee_percent",
                "payment_percent",
                "payment_fee"
            )
        ) || 0;


    return (
        platform +
        commission +
        service +
        payment
    );

}


/* =====================================================
   GET MARKETPLACES
===================================================== */

async function loadMarketplaces() {

    console.log("");
    console.log(
        "================================="
    );

    console.log(
        "MENGAMBIL DATA MARKETPLACE"
    );

    console.log(
        "GET /marketplaces"
    );

    console.log(
        "================================="
    );


    try {

        const data =
            await apiFetch(
                "/marketplaces"
            );


        console.log(
            "RESPONSE MARKETPLACES:",
            data
        );


        /*
         * Backend normal:
         *
         * [
         *     {...},
         *     {...}
         * ]
         *
         * Tetapi untuk berjaga-jaga,
         * dukung juga response:
         *
         * {
         *     marketplaces: [...]
         * }
         */

        let marketplaces =
            data;


        if (
            data &&
            Array.isArray(
                data.marketplaces
            )
        ) {

            marketplaces =
                data.marketplaces;

        }


        if (
            data &&
            Array.isArray(
                data.data
            )
        ) {

            marketplaces =
                data.data;

        }


        if (
            !Array.isArray(
                marketplaces
            )
        ) {

            throw new Error(
                "Format data marketplace tidak sesuai."
            );

        }


        if (
            marketplaces.length === 0
        ) {

            throw new Error(
                "Belum ada marketplace aktif."
            );

        }


        console.log(
            "JUMLAH MARKETPLACE:",
            marketplaces.length
        );


        marketplaceData =
            marketplaces;

        renderMarketplaces(
            marketplaces
        );

        populateSimulationMarketplaces(
            marketplaces
        );

        hideError();

    }


    catch (error) {

        console.error(
            "ERROR GET MARKETPLACES:",
            error
        );


        showError(
            error.message ||
            "Tidak dapat mengambil data marketplace."
        );

    }

}


/* =====================================================
   LOAD BUSINESS
===================================================== */

async function loadBusiness() {

    if (!businessId) {

        console.warn(
            "BUSINESS ID TIDAK ADA"
        );


        if (businessName) {

            businessName.textContent =
                "Bisnis belum dipilih";

        }


        if (businessCategory) {

            businessCategory.textContent =
                "-";

        }


        return;

    }


    console.log(
        "MENGAMBIL DATA BUSINESS:",
        businessId
    );


    try {

        const data =
            await apiFetch(
                `/businesses/${encodeURIComponent(
                    businessId
                )}`
            );


        console.log(
            "BUSINESS DATA:",
            data
        );


        const business =
            data.business ||
            data;


        if (businessName) {

            businessName.textContent =
                business.business_name ||
                business.name ||
                "-";

        }


        if (businessCategory) {

            businessCategory.textContent =
                business.business_category ||
                business.category ||
                "-";

        }

    }


    catch (error) {

        console.error(
            "ERROR GET BUSINESS:",
            error
        );


        /*
         * Business gagal diambil
         * tidak perlu menghentikan
         * marketplace.
         */

    }

}



/* =====================================================
   MARKETPLACE SIMULATION ELEMENTS
===================================================== */

const simulationMarketplace =
    document.getElementById(
        "simulationMarketplace"
    );


const simulationPrice =
    document.getElementById(
        "simulationPrice"
    );


const simulationOrders =
    document.getElementById(
        "simulationOrders"
    );


const simulationScenario =
    document.getElementById(
        "simulationScenario"
    );


const simulateButton =
    document.getElementById(
        "simulateButton"
    );


const simulationResult =
    document.getElementById(
        "simulationResult"
    );


let financialData = null;

let marketplaceData = [];


/* =====================================================
   LOAD FINANCIAL PROFILE FOR SIMULATION
===================================================== */

async function loadSimulationFinancial() {

    if (!businessId) {
        return;
    }

    try {

        const data =
            await apiFetch(
                `/financial-profiles/${encodeURIComponent(
                    businessId
                )}`
            );

        console.log(
            "SIMULATION FINANCIAL DATA:",
            data
        );

        financialData =
            data.financial_profile ||
            data;

        // ========================================
        // DEFAULT HARGA JUAL
        // ========================================

        if (
            simulationPrice &&
            financialData.average_selling_price
        ) {

            simulationPrice.value =
                Math.round(
                    Number(
                        financialData.average_selling_price
                    )
                );

        }

        // ========================================
        // DEFAULT JUMLAH PENJUALAN
        // ========================================

        if (
            simulationOrders &&
            financialData.monthly_revenue &&
            financialData.average_selling_price
        ) {

            const estimatedOrders =
                Number(
                    financialData.monthly_revenue
                ) /
                Number(
                    financialData.average_selling_price
                );

            simulationOrders.value =
                Math.max(
                    1,
                    Math.round(
                        estimatedOrders
                    )
                );

        }

    }

    catch (error) {

        console.warn(
            "Financial profile untuk simulasi tidak tersedia:",
            error.message
        );

        financialData = null;

        renderSimulationError(
            "Data finansial bisnis belum tersedia."
        );

    }

}



/* =====================================================
   POPULATE SIMULATION MARKETPLACES
===================================================== */

function populateSimulationMarketplaces(
    marketplaces
) {

    if (!simulationMarketplace) {
        return;
    }


    simulationMarketplace.innerHTML =
        "";


    marketplaces.forEach(
        function (marketplace) {

            const option =
                document.createElement(
                    "option"
                );


            const name =
                marketplace.name ||
                marketplace.marketplace_name ||
                "Marketplace";


            const alias =
                marketplace.alias ||
                "";


            option.value =
                marketplace.name ||
                marketplace.id ||
                "";


            option.textContent =
                alias
                    ? `${name} - ${alias}`
                    : name;


            simulationMarketplace.appendChild(
                option
            );

        }
    );

}

/* =====================================================
   LOAD PASSPORT RECOMMENDATION
===================================================== */

async function loadPassportRecommendation() {

    if (!businessId) {

        console.warn(
            "TIDAK ADA BUSINESS ID UNTUK PASSPORT"
        );


        return;

    }


    console.log(
        "MENGAMBIL REKOMENDASI PASSPORT..."
    );


    try {

        const data =
            await apiFetch(
                `/passport/${encodeURIComponent(
                    businessId
                )}/recommendations`
            );


        console.log(
            "PASSPORT RECOMMENDATION:",
            data
        );


        /*
         * Backend recommendations
         * dapat berupa:
         *
         * {
         *     business: {},
         *     recommendations: [...]
         * }
         */

        if (
            !data
        ) {

            return;

        }


        const recommendations =
            data.recommendations ||
            data.passport?.recommendations ||
            [];


        /*
         * Jika backend belum menyediakan
         * rekomendasi marketplace khusus,
         * kita tidak memaksakan data.
         */

        if (
            !Array.isArray(
                recommendations
            )
        ) {

            return;

        }


        /*
         * Cari rekomendasi yang berkaitan
         * dengan marketplace.
         */

        const marketplaceRecommendation =
            recommendations.find(
                item => {

                    const text =
                        JSON.stringify(
                            item
                        ).toLowerCase();


                    return (
                        text.includes(
                            "marketplace"
                        ) ||
                        text.includes(
                            "platform"
                        )
                    );

                }
            );


        if (
            marketplaceRecommendation &&
            recommendedReason
        ) {

            const recommendationText =
                marketplaceRecommendation.recommendation ||
                marketplaceRecommendation.message ||
                marketplaceRecommendation.action ||
                marketplaceRecommendation.problem;


            if (
                recommendationText
            ) {

                recommendedReason.textContent =
                    recommendationText;

            }

        }

    }


    catch (error) {

        /*
         * Endpoint recommendation tidak boleh
         * membuat halaman marketplace gagal.
         */

        console.warn(
            "REKOMENDASI PASSPORT TIDAK TERSEDIA:",
            error.message
        );

    }

}


/* =====================================================
   RENDER MARKETPLACES
===================================================== */

function renderMarketplaces(
    marketplaces
) {

    if (!marketplaceList) {

        console.error(
            "#marketplaceList TIDAK DITEMUKAN"
        );


        return;

    }


    marketplaceList.innerHTML =
        "";


    /*
     * Hitung score.
     */

    const scoredMarketplaces =
        marketplaces.map(
            marketplace => {

                const score =
                    calculateMarketplaceScore(
                        marketplace
                    );


                const totalCost =
                    calculateTotalCost(
                        marketplace
                    );


                return {

                    ...marketplace,

                    calculatedScore:
                        score,

                    calculatedTotalCost:
                        totalCost

                };

            }
        );


    /*
     * Ranking score tertinggi.
     */

    scoredMarketplaces.sort(
        (
            a,
            b
        ) =>
            b.calculatedScore -
            a.calculatedScore
    );


    console.log(
        "HASIL RANKING MARKETPLACE:",
        scoredMarketplaces
    );


    /*
     * Marketplace terbaik.
     */

    const best =
        scoredMarketplaces[0];


    if (best) {

        showRecommendation(
            best
        );

    }


    /*
     * Render semua.
     */

    scoredMarketplaces.forEach(
        (
            marketplace,
            index
        ) => {

            const card =
                createMarketplaceCard(
                    marketplace,
                    index
                );


            marketplaceList.appendChild(
                card
            );

        }
    );


    hideError();

}


/* =====================================================
   SHOW RECOMMENDATION
===================================================== */

function showRecommendation(
    marketplace
) {

    if (!recommendedSection) {

        return;

    }


    recommendedSection.style.display =
        "block";


    if (recommendedName) {

        recommendedName.textContent =
            marketplace.name ||
            marketplace.marketplace_name ||
            "-";

    }


    if (recommendedScore) {

        recommendedScore.textContent =
            formatScore(
                marketplace.calculatedScore
            );

    }


    if (recommendedReason) {

        const totalCost =
            marketplace.calculatedTotalCost;


        const score =
            marketplace.calculatedScore;


        const status =
            getScoreStatus(
                score
            );


        recommendedReason.textContent =
            `Marketplace ini memiliki score ${formatScore(score)}/100 (${status}) dengan estimasi total biaya platform ${formatPercent(totalCost)}.`;

    }

}


/* =====================================================
   CREATE MARKETPLACE CARD
===================================================== */

function createMarketplaceCard(
    marketplace,
    index
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "marketplace-card";


    const logoText =
        getLogoText(
            marketplace
        );


    const marketplaceName =
        marketplace.name ||
        marketplace.marketplace_name ||
        "-";


    const alias =
        marketplace.alias ||
        marketplace.code ||
        "";


    const score =
        marketplace.calculatedScore;


    const totalCost =
        marketplace.calculatedTotalCost;


    const status =
        getScoreStatus(
            score
        );


    const platformCost =
        getMarketplaceValue(
            marketplace,
            "platform_cost_percent",
            "platform_fee_percent",
            "platform_cost"
        );


    const commissionFee =
        getMarketplaceValue(
            marketplace,
            "commission_fee_percent",
            "commission_percent",
            "commission_fee"
        );


    const serviceFee =
        getMarketplaceValue(
            marketplace,
            "service_fee_percent",
            "service_percent",
            "service_fee"
        );


    const paymentFee =
        getMarketplaceValue(
            marketplace,
            "payment_fee_percent",
            "payment_percent",
            "payment_fee"
        );


    const targetAudience =
        marketplace.target_audience ||
        marketplace.target_market ||
        "-";


    const partnerStatus =
        marketplace.partner_status ||
        marketplace.status ||
        "Status tidak tersedia";


    const traffic =
        getMarketplaceValue(
            marketplace,
            "average_traffic_index",
            "traffic_index",
            "traffic"
        );


    card.innerHTML = `

        <div class="marketplace-top">

            <div class="marketplace-logo">
                ${escapeHTML(
                    logoText
                )}
            </div>


            <div class="marketplace-info">

                <h3>
                    ${escapeHTML(
                        marketplaceName
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        alias
                    )}
                </p>

            </div>


            <div class="marketplace-rank">

                #${index + 1}

            </div>


            <div class="marketplace-score">

                <span>
                    SCORE
                </span>

                <strong>
                    ${formatScore(score)}
                </strong>

                <small>
                    / 100
                </small>

            </div>

        </div>


        <div class="marketplace-divider"></div>


        <div class="marketplace-status">

            <span>
                ${escapeHTML(
                    status
                )}
            </span>

        </div>


        <div class="marketplace-metrics">


            <div class="metric">

                <span>
                    Platform
                </span>

                <strong>
                    ${formatPercent(
                        platformCost
                    )}
                </strong>

            </div>


            <div class="metric">

                <span>
                    Commission
                </span>

                <strong>
                    ${formatPercent(
                        commissionFee
                    )}
                </strong>

            </div>


            <div class="metric">

                <span>
                    Service
                </span>

                <strong>
                    ${formatPercent(
                        serviceFee
                    )}
                </strong>

            </div>


            <div class="metric">

                <span>
                    Payment
                </span>

                <strong>
                    ${formatPercent(
                        paymentFee
                    )}
                </strong>

            </div>


        </div>


        <div class="target-audience">

            <span>
                Target Audience
            </span>

            <p>
                ${escapeHTML(
                    targetAudience
                )}
            </p>

        </div>


        <div class="marketplace-traffic">

            <span>
                Traffic Index
            </span>

            <strong>
                ${formatScore(
                    traffic
                )}
            </strong>

        </div>


        <span class="partner-status">

            ${escapeHTML(
                partnerStatus
            )}

        </span>


        <div class="marketplace-total">

            Total biaya dasar:

            <strong>
                ${formatPercent(
                    totalCost
                )}
            </strong>

        </div>

    `;


    return card;

}

/* =====================================================
   FIND MARKETPLACE
===================================================== */

function getSimulationMarketplace() {

    if (
        !simulationMarketplace
    ) {

        return null;

    }


    const selected =
        simulationMarketplace.value;


    return marketplaceData.find(
        function (marketplace) {

            return (
                String(
                    marketplace.name ||
                    marketplace.marketplace_name ||
                    marketplace.id ||
                    ""
                )
                ===
                String(selected)
            );

        }
    );

}

/* =====================================================
   RUN MARKETPLACE SIMULATION
===================================================== */

function runMarketplaceSimulation() {

    if (
        !financialData
    ) {

        renderSimulationError(
            "Data finansial bisnis belum tersedia."
        );

        return;

    }


    const marketplace =
        getSimulationMarketplace();


    if (!marketplace) {

        renderSimulationError(
            "Pilih marketplace terlebih dahulu."
        );

        return;

    }


    const inputPrice =
        Number(
            simulationPrice.value
        );


    const orders =
        Number(
            simulationOrders.value
        );


    if (
        !inputPrice ||
        inputPrice <= 0
    ) {

        renderSimulationError(
            "Masukkan harga jual yang valid."
        );

        return;

    }


    if (
        !orders ||
        orders <= 0
    ) {

        renderSimulationError(
            "Masukkan jumlah penjualan yang valid."
        );

        return;

    }


    // ========================================
    // FINANCIAL BASELINE
    // ========================================

    const monthlyRevenue =
        Number(
            financialData.monthly_revenue
        ) || 0;


    const monthlyCogs =
        Number(
            financialData.cogs_hpp
        ) || 0;


    const operatingExpenses =
        Number(
            financialData.operating_expenses
        ) || 0;


    const currentPromo =
        Number(
            financialData
                .avg_promotional_cost_percent
        ) || 0;


    // ========================================
    // MARKETPLACE COST
    // ========================================

    const platformCost =
        Number(
            getMarketplaceValue(
                marketplace,
                "platform_cost_percent",
                "platform_fee_percent",
                "platform_cost"
            )
        ) || 0;


    const commission =
        Number(
            getMarketplaceValue(
                marketplace,
                "commission_fee_percent",
                "commission_percent",
                "commission_fee"
            )
        ) || 0;


    const serviceFee =
        Number(
            getMarketplaceValue(
                marketplace,
                "service_fee_percent",
                "service_percent",
                "service_fee"
            )
        ) || 0;


    const paymentFee =
        Number(
            getMarketplaceValue(
                marketplace,
                "payment_fee_percent",
                "payment_percent",
                "payment_fee"
            )
        ) || 0;


    const marketplaceCost =
        platformCost +
        commission +
        serviceFee +
        paymentFee;


    // ========================================
    // SCENARIO
    // ========================================

    const scenario =
        simulationScenario.value;


    let simulatedPrice =
        inputPrice;


    let simulatedMarketplaceCost =
        marketplaceCost;


    let simulatedPromo =
        currentPromo;


    let scenarioLabel =
        "Kondisi Saat Ini";


    switch (
        scenario
    ) {

        case "fee_down_2":

            simulatedMarketplaceCost =
                Math.max(
                    0,
                    marketplaceCost - 2
                );

            scenarioLabel =
                "Biaya marketplace turun 2%";

            break;


        case "promo_down_2":

            simulatedPromo =
                Math.max(
                    0,
                    currentPromo - 2
                );

            scenarioLabel =
                "Biaya promo turun 2%";

            break;


        case "price_up_5":

            simulatedPrice =
                inputPrice * 1.05;

            scenarioLabel =
                "Harga jual naik 5%";

            break;


        case "price_down_5":

            simulatedPrice =
                inputPrice * 0.95;

            scenarioLabel =
                "Harga jual turun 5%";

            break;


        case "combined":

            simulatedMarketplaceCost =
                Math.max(
                    0,
                    marketplaceCost - 2
                );

            simulatedPrice =
                inputPrice * 1.05;

            scenarioLabel =
                "Biaya marketplace turun 2% + harga naik 5%";

            break;


        default:

            scenarioLabel =
                "Kondisi Saat Ini";

    }


    // ========================================
    // BASELINE
    // ========================================

    const baselineProfit =
        monthlyRevenue -
        monthlyCogs -
        operatingExpenses -
        (
            monthlyRevenue *
            (
                marketplaceCost +
                currentPromo
            ) /
            100
        );


    const baselineMargin =
        monthlyRevenue > 0
            ? (
                baselineProfit /
                monthlyRevenue
            ) *
            100
            : 0;


    // ========================================
    // SIMULATED REVENUE
    // ========================================

    const simulatedRevenue =
        simulatedPrice *
        orders;


    // ========================================
    // SIMULATED COGS
    // ========================================

    let simulatedCogs =
        monthlyCogs;


    /*
     * Jika jumlah penjualan berubah dari
     * baseline, estimasi HPP per produk
     * digunakan untuk menyesuaikan COGS.
     */

    if (
        financialData.average_selling_price &&
        monthlyRevenue > 0
    ) {

        const baselineOrders =
            monthlyRevenue /
            Number(
                financialData
                    .average_selling_price
            );


        if (
            baselineOrders > 0
        ) {

            const cogsPerUnit =
                monthlyCogs /
                baselineOrders;


            simulatedCogs =
                cogsPerUnit *
                orders;

        }

    }


    // ========================================
    // SIMULATED MARKETPLACE COST
    // ========================================

    const marketplaceCostAmount =
        simulatedRevenue *
        simulatedMarketplaceCost /
        100;


    // ========================================
    // SIMULATED PROMOTION
    // ========================================

    const promotionAmount =
        simulatedRevenue *
        simulatedPromo /
        100;


    // ========================================
    // SIMULATED PROFIT
    // ========================================

    const simulatedProfit =
        simulatedRevenue -
        simulatedCogs -
        operatingExpenses -
        marketplaceCostAmount -
        promotionAmount;


    // ========================================
    // SIMULATED MARGIN
    // ========================================

    const simulatedMargin =
        simulatedRevenue > 0
            ? (
                simulatedProfit /
                simulatedRevenue
            ) *
            100
            : 0;


    // ========================================
    // CHANGE
    // ========================================

    const profitChange =
        simulatedProfit -
        baselineProfit;


    const marginChange =
        simulatedMargin -
        baselineMargin;


    const costChange =
        simulatedMarketplaceCost -
        marketplaceCost;


    const profitChangePercent =
        baselineProfit !== 0
            ? (
                profitChange /
                Math.abs(
                    baselineProfit
                )
            ) *
            100
            : 0;


    // ========================================
    // TRAFFIC
    // ========================================

    const traffic =
        Number(
            getMarketplaceValue(
                marketplace,
                "average_traffic_index",
                "traffic_index",
                "traffic"
            )
        ) || 0;


    // ========================================
    // RENDER
    // ========================================

    renderSimulationResult({

        marketplace,

        scenarioLabel,

        simulatedPrice,

        simulatedRevenue,

        simulatedMargin,

        simulatedProfit,

        simulatedMarketplaceCost,

        simulatedPromo,

        profitChange,

        marginChange,

        costChange,

        profitChangePercent,

        traffic

    });

}

/* =====================================================
   RENDER SIMULATION RESULT
===================================================== */

function renderSimulationResult(
    result
) {

    const marketplaceName =
        result.marketplace.name ||
        result.marketplace.marketplace_name ||
        "Marketplace";


    const profitClass =
        result.profitChange > 0
            ? "simulation-positive"
            : result.profitChange < 0
                ? "simulation-negative"
                : "simulation-neutral";


    const marginClass =
        result.marginChange > 0
            ? "simulation-positive"
            : result.marginChange < 0
                ? "simulation-negative"
                : "simulation-neutral";


    const costClass =
        result.costChange < 0
            ? "simulation-positive"
            : result.costChange > 0
                ? "simulation-negative"
                : "simulation-neutral";


    const profitArrow =
        result.profitChange > 0
            ? "↑"
            : result.profitChange < 0
                ? "↓"
                : "→";


    const marginArrow =
        result.marginChange > 0
            ? "↑"
            : result.marginChange < 0
                ? "↓"
                : "→";


    const costArrow =
        result.costChange < 0
            ? "↓"
            : result.costChange > 0
                ? "↑"
                : "→";


    simulationResult.innerHTML = `

        <div class="simulation-result-header">

            <span>
                HASIL SIMULASI
            </span>

            <h3>
                ${escapeHTML(
                    marketplaceName
                )}
            </h3>

            <p>
                ${escapeHTML(
                    result.scenarioLabel
                )}
            </p>

        </div>


        <div class="simulation-metrics">


            <div class="simulation-metric">

                <span>
                    NET MARGIN
                </span>

                <strong>
                    ${result.simulatedMargin.toFixed(1)}%
                </strong>

                <small
                    class="${marginClass}"
                >
                    ${marginArrow}
                    ${Math.abs(
                        result.marginChange
                    ).toFixed(1)}
                    poin
                </small>

            </div>


            <div class="simulation-metric">

                <span>
                    TOTAL MARKETPLACE COST
                </span>

                <strong>
                    ${result.simulatedMarketplaceCost.toFixed(1)}%
                </strong>

                <small
                    class="${costClass}"
                >
                    ${costArrow}
                    ${Math.abs(
                        result.costChange
                    ).toFixed(1)}
                    poin
                </small>

            </div>


            <div class="simulation-metric">

                <span>
                    KEUNTUNGAN / BULAN
                </span>

                <strong>
                    ${formatRupiah(
                        result.simulatedProfit
                    )}
                </strong>

                <small
                    class="${profitClass}"
                >
                    ${profitArrow}
                    ${Math.abs(
                        result.profitChangePercent
                    ).toFixed(1)}%
                </small>

            </div>


        </div>


        <div class="simulation-comparison">

            <div class="simulation-comparison-title">
                PERBANDINGAN DENGAN KONDISI SAAT INI
            </div>


            <div class="simulation-comparison-row">

                <span>
                    Harga Jual
                </span>

                <strong>
                    ${formatRupiah(
                        result.simulatedPrice
                    )}
                </strong>

            </div>


            <div class="simulation-comparison-row">

                <span>
                    Estimasi Omzet
                </span>

                <strong>
                    ${formatRupiah(
                        result.simulatedRevenue
                    )}
                </strong>

            </div>


            <div class="simulation-comparison-row">

                <span>
                    Perubahan Profit
                </span>

                <strong
                    class="${profitClass}"
                >
                    ${profitArrow}
                    ${formatRupiah(
                        Math.abs(
                            result.profitChange
                        )
                    )}
                </strong>

            </div>


            <div class="simulation-comparison-row">

                <span>
                    Traffic Index
                </span>

                <strong>
                    ${Math.round(
                        result.traffic
                    )}
                </strong>

            </div>


        </div>


        <div class="simulation-interpretation">

            <span>
                Interpretasi
            </span>

            <p>
                ${getSimulationInterpretation(
                    result
                )}
            </p>

        </div>


        <p class="simulation-notice">

            Simulasi merupakan estimasi berdasarkan
            data finansial bisnis dan profil marketplace
            yang tersedia pada sistem. Hasil bukan
            jaminan performa aktual marketplace.

        </p>

    `;

}

/* =====================================================
   SIMULATION INTERPRETATION
===================================================== */

function getSimulationInterpretation(
    result
) {

    const marketplaceName =
        result.marketplace.name ||
        result.marketplace.marketplace_name ||
        "marketplace";


    if (
        result.profitChange > 0 &&
        result.marginChange > 0
    ) {

        return `
            Skenario pada ${escapeHTML(
                marketplaceName
            )}
            memberikan dampak positif.
            Estimasi profit dan net margin meningkat
            dibandingkan kondisi saat ini.
        `;

    }


    if (
        result.profitChange > 0
    ) {

        return `
            Skenario ini meningkatkan estimasi
            keuntungan, meskipun perubahan margin
            relatif terbatas.
        `;

    }


    if (
        result.profitChange < 0 &&
        result.marginChange < 0
    ) {

        return `
            Skenario ini berpotensi menurunkan
            profit dan net margin. Kondisi ini
            perlu dipertimbangkan kembali sebelum
            diterapkan.
        `;

    }


    if (
        result.profitChange < 0
    ) {

        return `
            Estimasi keuntungan menurun dibandingkan
            kondisi saat ini. Evaluasi kembali harga,
            biaya, atau strategi promosi.
        `;

    }


    return `
        Skenario ini relatif stabil terhadap
        kondisi bisnis saat ini.
    `;

}

/* =====================================================
   SIMULATION ERROR
===================================================== */

function renderSimulationError(
    message
) {

    simulationResult.innerHTML = `

        <div class="simulation-result-empty">

            <strong>
                Simulasi belum dapat dijalankan
            </strong>

            <p>
                ${escapeHTML(
                    message
                )}
            </p>

        </div>

    `;

}

/* =====================================================
   SIMULATION BUTTON
===================================================== */

if (
    simulateButton
) {

    simulateButton.addEventListener(
        "click",
        function () {

            runMarketplaceSimulation();

        }
    );

}


/* =====================================================
   BACK BUTTON
===================================================== */

if (backButton) {

    backButton.addEventListener(
        "click",
        function () {

            console.log(
                "KEMBALI KE PASSPORT"
            );


            if (
                businessId
            ) {

                window.location.href =
                    `passport.html?business_id=${encodeURIComponent(
                        businessId
                    )}`;

            }

            else {

                window.location.href =
                    "passport.html";

            }

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

            console.log(
                "LOGOUT"
            );


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

        }
    );

}


/* =====================================================
   RETRY
===================================================== */

if (retryButton) {

    retryButton.addEventListener(
        "click",
        async function () {

            console.log(
                "RETRY MARKETPLACE"
            );


            hideError();


            await Promise.allSettled(
                [

                    loadBusiness(),

                    loadMarketplaces(),

                    loadPassportRecommendation()

                ]
            );

        }
    );

}


/* =====================================================
   START
===================================================== */

async function initMarketplacePage() {

    console.log("");
    console.log(
        "================================="
    );

    console.log(
        "INITIALIZE MARKETPLACE PAGE"
    );

    console.log(
        "================================="
    );


    if (!token) {

        return;

    }


    /*
     * Jalankan semuanya.
     *
     * Kalau salah satu gagal,
     * halaman tetap mencoba
     * mengambil data lainnya.
     */

    await Promise.allSettled(
        [
            loadBusiness(),
            loadMarketplaces(),
            loadPassportRecommendation(),
            loadSimulationFinancial()
        ]
    );


    console.log(
        "================================="
    );

    console.log(
        "MARKETPLACE PAGE SELESAI DIMUAT"
    );

    console.log(
        "================================="
    );

}


/* =====================================================
   DOM READY
===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initMarketplacePage
    );

}

else {

    initMarketplacePage();

}