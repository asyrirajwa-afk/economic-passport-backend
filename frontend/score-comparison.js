/* =========================================================
   SCORE COMPARISON
   Economic Passport
========================================================= */


/* =========================================================
   API
========================================================= */

const API_BASE_URL =
    "https://economic-passport-backend-production.up.railway.app";


/* =========================================================
   BUSINESS ID
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const businessId =
    params.get("business_id") ||
    localStorage.getItem(
        "selected_business_id"
    ) ||
    localStorage.getItem(
        "last_business_id"
    );


/* =========================================================
   ELEMENTS
========================================================= */

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

const content =
    document.getElementById(
        "content"
    );

const businessName =
    document.getElementById(
        "businessName"
    );

const businessIdElement =
    document.getElementById(
        "businessId"
    );

const overallScore =
    document.getElementById(
        "overallScore"
    );

const overallLabel =
    document.getElementById(
        "overallLabel"
    );

const targetScore =
    document.getElementById(
        "targetScore"
    );

const targetStatus =
    document.getElementById(
        "targetStatus"
    );

const scoreGap =
    document.getElementById(
        "scoreGap"
    );

const gapLabel =
    document.getElementById(
        "gapLabel"
    );

const comparisonStatus =
    document.getElementById(
        "comparisonStatus"
    );

const businessScoreText =
    document.getElementById(
        "businessScoreText"
    );

const targetScoreText =
    document.getElementById(
        "targetScoreText"
    );

const businessScoreBar =
    document.getElementById(
        "businessScoreBar"
    );

const targetScoreBar =
    document.getElementById(
        "targetScoreBar"
    );

const comparisonDescription =
    document.getElementById(
        "comparisonDescription"
    );

const categorySection =
    document.getElementById(
        "categorySection"
    );

const categoryList =
    document.getElementById(
        "categoryList"
    );


/* =========================================================
   TOKEN
========================================================= */

function getToken() {

    return localStorage.getItem(
        "token"
    );

}


/* =========================================================
   API FETCH
========================================================= */

async function apiFetch(
    endpoint
) {

    const token =
        getToken();


    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                method: "GET",

                headers: {
                    "Content-Type":
                        "application/json",

                    ...(token
                        ? {
                            Authorization:
                                `Bearer ${token}`
                        }
                        : {})
                }
            }
        );


    if (!response.ok) {

        let message =
            `Request gagal (${response.status})`;


        try {

            const errorData =
                await response.json();


            message =
                errorData.detail ||
                errorData.message ||
                message;

        }

        catch (_) {

            // Response bukan JSON.

        }


        throw new Error(
            message
        );

    }


    return response.json();

}


/* =========================================================
   HELPERS
========================================================= */

function toNumber(
    value
) {

    const number =
        Number(value);


    return Number.isFinite(
        number
    )
        ? number
        : null;

}


function formatScore(
    value
) {

    const number =
        toNumber(value);


    if (number === null) {

        return "-";

    }


    return Number.isInteger(
        number
    )
        ? String(number)
        : number.toFixed(2);

}


/* =========================================================
   STATE
========================================================= */

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


function showError(
    message
) {

    loadingState.classList.add(
        "hidden"
    );

    content.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );


    errorMessage.textContent =
        message ||
        "Terjadi kesalahan.";

}


/* =========================================================
   RENDER BUSINESS
========================================================= */

function renderBusiness(
    data
) {

    const business =
        data?.business ||
        {};


    businessName.textContent =
        business.business_name ||
        "-";


    businessIdElement.textContent =
        business.id ??
        businessId ??
        "-";

}


/* =========================================================
   RENDER SCORE COMPARISON
========================================================= */

function renderScores(
    data
) {

    const current =
        data?.current_assessment;


    const previous =
        data?.previous_assessment;


    const overall =
        data?.overall ||
        {};


    /*
       Jika belum ada dua assessment,
       backend memang tidak menyediakan
       data comparison.
    */

    if (
        !data.comparison_available ||
        !current ||
        !previous
    ) {

        overallScore.textContent =
            current?.score !== undefined
                ? formatScore(
                    current.score
                )
                : "-";


        businessScoreText.textContent =
            current?.score !== undefined
                ? `${formatScore(
                    current.score
                )} / 100`
                : "-";


        targetScore.textContent =
            "-";


        targetScoreText.textContent =
            "-";


        scoreGap.textContent =
            "-";


        gapLabel.textContent =
            "-";


        overallLabel.textContent =
            "Current score";


        targetStatus.textContent =
            "Belum ada assessment sebelumnya";


        comparisonStatus.textContent =
            "Comparison unavailable";


        comparisonDescription.textContent =
            data.message ||
            "Minimal dua assessment diperlukan untuk melakukan perbandingan.";


        if (
            current?.score !== undefined
        ) {

            const score =
                Number(
                    current.score
                );


            businessScoreBar.style.width =
                `${Math.max(
                    0,
                    Math.min(
                        100,
                        score
                    )
                )}%`;

        }


        targetScoreBar.style.width =
            "0%";


        return;

    }


    const currentScore =
        toNumber(
            current.score
        );


    const previousScore =
        toNumber(
            previous.score
        );


    const change =
        toNumber(
            overall.change
        );


    /* =====================================================
       CURRENT SCORE
    ===================================================== */

    overallScore.textContent =
        formatScore(
            currentScore
        );


    businessScoreText.textContent =
        currentScore === null
            ? "-"
            : `${formatScore(
                currentScore
            )} / 100`;


    if (
        currentScore !== null
    ) {

        businessScoreBar.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    currentScore
                )
            )}%`;

    }


    /* =====================================================
       PREVIOUS SCORE
       Elemen HTML lama bernama targetScore,
       tetapi kita gunakan untuk previous assessment.
    ===================================================== */

    targetScore.textContent =
        formatScore(
            previousScore
        );


    targetScoreText.textContent =
        previousScore === null
            ? "-"
            : `${formatScore(
                previousScore
            )} / 100`;


    if (
        previousScore !== null
    ) {

        targetScoreBar.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    previousScore
                )
            )}%`;

    }


    /* =====================================================
       CHANGE
    ===================================================== */

    if (
        change !== null
    ) {

        scoreGap.textContent =
            formatScore(
                Math.abs(
                    change
                )
            );


        if (
            change > 0
        ) {

            overallLabel.textContent =
                "Improved";


            targetStatus.textContent =
                "Previous assessment";


            gapLabel.textContent =
                `+${formatScore(
                    change
                )} points`;


            comparisonStatus.textContent =
                "Score meningkat";


            comparisonDescription.textContent =
                `Score bisnis meningkat ${formatScore(
                    change
                )} poin dibandingkan assessment sebelumnya.`;

        }

        else if (
            change < 0
        ) {

            overallLabel.textContent =
                "Declined";


            targetStatus.textContent =
                "Previous assessment";


            gapLabel.textContent =
                `-${formatScore(
                    Math.abs(change)
                )} points`;


            comparisonStatus.textContent =
                "Score menurun";


            comparisonDescription.textContent =
                `Score bisnis menurun ${formatScore(
                    Math.abs(change)
                )} poin dibandingkan assessment sebelumnya.`;

        }

        else {

            overallLabel.textContent =
                "Stable";


            targetStatus.textContent =
                "Previous assessment";


            gapLabel.textContent =
                "0 points";


            comparisonStatus.textContent =
                "Score stabil";


            comparisonDescription.textContent =
                "Score bisnis tidak mengalami perubahan dibandingkan assessment sebelumnya.";

        }

    }

    else {

        scoreGap.textContent =
            "-";


        gapLabel.textContent =
            "-";


        comparisonStatus.textContent =
            "-";


        comparisonDescription.textContent =
            "Perubahan score belum tersedia.";

    }

}


/* =========================================================
   RENDER CATEGORY COMPARISON
========================================================= */

function renderCategories(
    data
) {

    const changes =
        data?.changes;


    if (
        !changes ||
        typeof changes !==
        "object"
    ) {

        categorySection.classList.add(
            "hidden"
        );

        return;

    }


    const categoryNames = [
        {
            key: "profit",
            name: "Profit"
        },

        {
            key: "people",
            name: "People"
        },

        {
            key: "planet",
            name: "Planet"
        },

        {
            key: "marketplace",
            name: "Marketplace"
        }
    ];


    categorySection.classList.remove(
        "hidden"
    );


    categoryList.innerHTML =
        "";


    categoryNames.forEach(
        category => {

            const item =
                changes[
                    category.key
                ];


            if (!item) {
                return;
            }


            const current =
                toNumber(
                    item.current
                );


            const previous =
                toNumber(
                    item.previous
                );


            const change =
                toNumber(
                    item.change
                );


            const wrapper =
                document.createElement(
                    "article"
                );


            wrapper.className =
                "category-item";


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "category-header";


            const nameElement =
                document.createElement(
                    "strong"
                );


            nameElement.textContent =
                category.name;


            const scoreElement =
                document.createElement(
                    "span"
                );


            scoreElement.textContent =
                current === null
                    ? "-"
                    : `${formatScore(
                        current
                    )} / 100`;


            header.append(
                nameElement,
                scoreElement
            );


            const track =
                document.createElement(
                    "div"
                );


            track.className =
                "category-track";


            const fill =
                document.createElement(
                    "div"
                );


            fill.className =
                "category-fill";


            if (
                current !== null
            ) {

                fill.style.width =
                    `${Math.max(
                        0,
                        Math.min(
                            100,
                            current
                        )
                    )}%`;

            }


            track.appendChild(
                fill
            );


            const changeElement =
                document.createElement(
                    "small"
                );


            changeElement.style.display =
                "block";


            changeElement.style.marginTop =
                "8px";


            changeElement.style.fontSize =
                "12px";


            changeElement.style.color =
                "#6b7280";


            if (
                change !== null
            ) {

                if (
                    change > 0
                ) {

                    changeElement.textContent =
                        `↑ Naik ${formatScore(
                            change
                        )} poin`;

                }

                else if (
                    change < 0
                ) {

                    changeElement.textContent =
                        `↓ Turun ${formatScore(
                            Math.abs(change)
                        )} poin`;

                }

                else {

                    changeElement.textContent =
                        "→ Tidak berubah";

                }

            }

            else {

                changeElement.textContent =
                    previous !== null
                        ? `Sebelumnya ${formatScore(
                            previous
                        )}`
                        : "-";

            }


            wrapper.append(
                header,
                track,
                changeElement
            );


            categoryList.appendChild(
                wrapper
            );

        }
    );

}


/* =========================================================
   LOAD SCORE COMPARISON
========================================================= */

async function loadScoreComparison() {

    if (
        !businessId
    ) {

        showError(
            "Business ID tidak ditemukan. Pilih bisnis terlebih dahulu."
        );

        return;

    }


    showLoading();


    try {

        const id =
            encodeURIComponent(
                businessId
            );


        const data =
            await apiFetch(
                `/passport/${id}/score-comparison`
            );


        console.log(
            "SCORE COMPARISON DATA:",
            data
        );


        renderBusiness(
            data
        );


        renderScores(
            data
        );


        renderCategories(
            data
        );


        showContent();

    }

    catch (error) {

        console.error(
            "SCORE COMPARISON ERROR:",
            error
        );


        showError(
            error.message
        );

    }

}


/* =========================================================
   RETRY
========================================================= */

document
    .getElementById(
        "retryButton"
    )
    .addEventListener(
        "click",
        loadScoreComparison
    );


/* =========================================================
   BACK BUTTON
========================================================= */

document
    .getElementById(
        "backButton"
    )
    .addEventListener(
        "click",
        function () {

            window.location.href =
                `passport-detail.html?business_id=${
                    encodeURIComponent(
                        businessId || ""
                    )
                }`;

        }
    );


/* =========================================================
   PASSPORT DETAIL BUTTON
========================================================= */

document
    .getElementById(
        "detailButton"
    )
    .addEventListener(
        "click",
        function () {

            window.location.href =
                `passport-detail.html?business_id=${
                    encodeURIComponent(
                        businessId || ""
                    )
                }`;

        }
    );


/* =========================================================
   TREND BUTTON
========================================================= */

document
    .getElementById(
        "trendButton"
    )
    .addEventListener(
        "click",
        function () {

            window.location.href =
                `trend.html?business_id=${
                    encodeURIComponent(
                        businessId || ""
                    )
                }`;

        }
    );


/* =========================================================
   START
========================================================= */

loadScoreComparison();