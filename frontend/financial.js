console.log("=================================");
console.log("FINANCIAL.JS BERHASIL DIMUAT");
console.log("=================================");


const API_URL = "http://127.0.0.1:8000";


/* ==============================
   TOKEN
============================== */

const token = localStorage.getItem("token");

console.log(
    "TOKEN:",
    token ? "ADA" : "TIDAK ADA"
);


/* ==============================
   AMBIL BUSINESS ID
============================== */

const urlParams =
    new URLSearchParams(window.location.search);

const urlBusinessId =
    urlParams.get("business_id");

const selectedBusinessId =
    localStorage.getItem("selected_business_id");

const lastBusinessId =
    localStorage.getItem("last_business_id");


console.log(
    "BUSINESS ID DARI URL:",
    urlBusinessId
);

console.log(
    "SELECTED BUSINESS ID:",
    selectedBusinessId
);

console.log(
    "LAST BUSINESS ID:",
    lastBusinessId
);


/* ==============================
   TENTUKAN BUSINESS ID
============================== */

const businessId =
    urlBusinessId ||
    selectedBusinessId ||
    lastBusinessId;


console.log(
    "BUSINESS ID YANG DIGUNAKAN:",
    businessId || "TIDAK ADA"
);


/* ==============================
   CEK LOGIN
============================== */

if (!token) {

    console.error(
        "TOKEN TIDAK DITEMUKAN"
    );

    window.location.href = "index.html";

}


/* ==============================
   CEK BUSINESS ID
============================== */

if (!businessId) {

    console.error(
        "BUSINESS ID TIDAK DITEMUKAN"
    );

    alert(
        "Bisnis belum dipilih. Silakan kembali ke dashboard."
    );

    window.location.href =
        "dashboard.html";

}


/* ==============================
   SIMPAN BUSINESS ID
============================== */

localStorage.setItem(
    "selected_business_id",
    businessId
);


console.log(
    "BUSINESS ID BERHASIL DIPILIH:",
    businessId
);


/* ==============================
   AMBIL ELEMENT
============================== */

const financialForm =
    document.getElementById(
        "financialForm"
    );

const businessIdInput =
    document.getElementById(
        "businessId"
    );

const saveButton =
    document.getElementById(
        "saveButton"
    );

const message =
    document.getElementById(
        "message"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


console.log(
    "FORM:",
    financialForm
);

console.log(
    "BUSINESS ID INPUT:",
    businessIdInput
);

console.log(
    "SAVE BUTTON:",
    saveButton
);

console.log(
    "MESSAGE:",
    message
);

console.log(
    "BACK BUTTON:",
    backButton
);


/* ==============================
   ISI BUSINESS ID
============================== */

if (
    businessIdInput &&
    businessId
) {

    businessIdInput.value =
        businessId;

}


/* ==============================
   TOMBOL KEMBALI
============================== */

if (backButton) {

    backButton.addEventListener(
        "click",
        function () {

            console.log(
                "TOMBOL KEMBALI DIKLIK"
            );

            window.location.href =
                "dashboard.html";

        }
    );

}


/* ==============================
   SUBMIT FORM
============================== */

if (financialForm) {

    financialForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();
            event.stopPropagation();


            console.log("");
            console.log(
                "================================="
            );
            console.log(
                "TOMBOL SIMPAN FINANCIAL DIKLIK"
            );
            console.log(
                "================================="
            );


            /* ==========================
               AMBIL INPUT
            ========================== */

            const monthlyRevenue =
                Number(
                    document
                        .getElementById(
                            "monthlyRevenue"
                        )
                        .value
                );

            const cogsHpp =
                Number(
                    document
                        .getElementById(
                            "cogsHpp"
                        )
                        .value
                );

            const operatingExpenses =
                Number(
                    document
                        .getElementById(
                            "operatingExpenses"
                        )
                        .value
                );

            const averageSellingPrice =
                Number(
                    document
                        .getElementById(
                            "averageSellingPrice"
                        )
                        .value
                );

            const marketplaceFee =
                Number(
                    document
                        .getElementById(
                            "marketplaceFee"
                        )
                        .value
                );

            const promotionalCost =
                Number(
                    document
                        .getElementById(
                            "promotionalCost"
                        )
                        .value
                );

            const packagingCost =
                Number(
                    document
                        .getElementById(
                            "packagingCost"
                        )
                        .value
                );

            const returnRate =
                Number(
                    document
                        .getElementById(
                            "returnRate"
                        )
                        .value
                );

            const desiredMargin =
                Number(
                    document
                        .getElementById(
                            "desiredMargin"
                        )
                        .value
                );

            const maxPlatformCost =
                Number(
                    document
                        .getElementById(
                            "maxPlatformCost"
                        )
                        .value
                );

            const maxPromotionBurden =
                Number(
                    document
                        .getElementById(
                            "maxPromotionBurden"
                        )
                        .value
                );

            const targetMonthlyProfit =
                Number(
                    document
                        .getElementById(
                            "targetMonthlyProfit"
                        )
                        .value
                );

            const minLivingIncome =
                Number(
                    document
                        .getElementById(
                            "minLivingIncome"
                        )
                        .value
                );

            const consumerAffordability =
                Number(
                    document
                        .getElementById(
                            "consumerAffordability"
                        )
                        .value
                );

            const employeeFairWage =
                document
                    .getElementById(
                        "employeeFairWage"
                    )
                    .checked;

            const ecoPackaging =
                document
                    .getElementById(
                        "ecoPackaging"
                    )
                    .checked;

            const employeeCount =
                Number(
                    document
                        .getElementById("employeeCount")
                        .value
                );

            const fairWageBasis =
                document
                    .getElementById("fairWageBasis")
                    .value;

            const mainMaterials =
                document
                    .getElementById("mainMaterials")
                    .value
                    .trim();

            const materialOrigin =
                document
                    .getElementById("materialOrigin")
                    .value;

            const recycledMaterialPercent =
                Number(
                    document
                        .getElementById(
                            "recycledMaterialPercent"
                        )
                        .value || 0
                );

            const packagingMaterial =
                document
                    .getElementById("packagingMaterial")
                    .value;

            const packagingReusable =
                document
                    .getElementById("packagingReusable")
                    .checked;

            const wasteManagement =
                document
                    .getElementById("wasteManagement")
                    .value;

            const wasteDescription =
                document
                    .getElementById("wasteDescription")
                    .value
                    .trim();

            const energySource =
                document
                    .getElementById("energySource")
                    .value;

            const periodStart =
                document
                    .getElementById(
                        "periodStart"
                    )
                    .value;

            const periodEnd =
                document
                    .getElementById(
                        "periodEnd"
                    )
                    .value;


            /* ==========================
               DEBUG
            ========================== */

            console.log(
                "BUSINESS ID:",
                businessId
            );

            console.log(
                "MONTHLY REVENUE:",
                monthlyRevenue
            );

            console.log(
                "COGS / HPP:",
                cogsHpp
            );

            console.log(
                "OPERATING EXPENSES:",
                operatingExpenses
            );

            console.log(
                "AVERAGE SELLING PRICE:",
                averageSellingPrice
            );

            console.log(
                "MARKETPLACE FEE:",
                marketplaceFee
            );

            console.log(
                "PROMOTIONAL COST:",
                promotionalCost
            );

            console.log(
                "PACKAGING COST:",
                packagingCost
            );

            console.log(
                "RETURN RATE:",
                returnRate
            );

            console.log(
                "DESIRED MARGIN:",
                desiredMargin
            );

            console.log(
                "MAX PLATFORM COST:",
                maxPlatformCost
            );

            console.log(
                "MAX PROMOTION BURDEN:",
                maxPromotionBurden
            );

            console.log(
                "TARGET MONTHLY PROFIT:",
                targetMonthlyProfit
            );

            console.log(
                "MIN LIVING INCOME:",
                minLivingIncome
            );

            console.log(
                "CONSUMER AFFORDABILITY:",
                consumerAffordability
            );

            console.log(
                "EMPLOYEE FAIR WAGE:",
                employeeFairWage
            );

            console.log(
                "ECO PACKAGING:",
                ecoPackaging
            );

            console.log(
                "PERIOD START:",
                periodStart
            );

            console.log(
                "PERIOD END:",
                periodEnd
            );


            /* ==========================
               BERSIHKAN MESSAGE
            ========================== */

            if (message) {

                message.textContent = "";

                message.style.color = "";

            }


            /* ==========================
               VALIDASI
            ========================== */

            if (
                !monthlyRevenue ||
                !cogsHpp ||
                !operatingExpenses ||
                !averageSellingPrice ||
                !periodStart ||
                !periodEnd
            ) {

                console.error(
                    "VALIDASI GAGAL"
                );

                if (message) {

                    message.textContent =
                        "Mohon isi semua field wajib.";

                    message.style.color =
                        "#dc2626";

                }

                return;

            }


            console.log(
                "VALIDASI FORM: BERHASIL"
            );


            /* ==========================
               DATA FINANCIAL
            ========================== */

            const financialData = {

                business_id:
                    Number(
                        businessId
                    ),

                monthly_revenue:
                    monthlyRevenue,

                cogs_hpp:
                    cogsHpp,

                operating_expenses:
                    operatingExpenses,

                average_selling_price:
                    averageSellingPrice,

                avg_marketplace_fee_percent:
                    marketplaceFee,

                avg_promotional_cost_percent:
                    promotionalCost,

                avg_packaging_cost_percent:
                    packagingCost,

                return_rate_percent:
                    returnRate,

                desired_min_margin_percent:
                    desiredMargin,

                max_platform_cost_tolerated_percent:
                    maxPlatformCost,

                max_promotional_burden_percent:
                    maxPromotionBurden,

                target_monthly_profit:
                    targetMonthlyProfit,

                min_sustainable_living_income:
                    minLivingIncome,

                consumer_affordability_index:
                    consumerAffordability,

                employee_fair_wage_compliant:
                    employeeFairWage,

                eco_packaging_adopted:
                    ecoPackaging,

                period_start:
                    periodStart,

                period_end:
                    periodEnd

            };


            console.log(
                "DATA FINANCIAL YANG AKAN DIKIRIM:"
            );

            console.log(
                financialData
            );


            /* ==========================
               BUTTON LOADING
            ========================== */

            if (saveButton) {

                saveButton.disabled = true;

                saveButton.textContent =
                    "Menyimpan...";

            }


            /* ==========================
               SIMPAN FINANCIAL PROFILE
            ========================== */

            try {

                console.log(
                    "================================="
                );

                console.log(
                    "MENGIRIM POST /financial-profiles..."
                );

                console.log(
                    "================================="
                );


                const response =
                    await fetch(
                        `${API_URL}/financial-profiles`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`

                            },

                            body:
                                JSON.stringify(
                                    financialData
                                )

                        }
                    );


                console.log(
                    "STATUS CREATE FINANCIAL:",
                    response.status
                );

                console.log(
                    "RESPONSE OK:",
                    response.ok
                );


                let data = {};

                try {

                    data =
                        await response.json();

                }

                catch (jsonError) {

                    console.error(
                        "RESPONSE BUKAN JSON:",
                        jsonError
                    );

                }


                console.log(
                    "RESPONSE FINANCIAL:",
                    data
                );


                /* ==========================
                   CEK ERROR FINANCIAL
                ========================== */

                if (!response.ok) {

                    console.error(
                        "CREATE FINANCIAL GAGAL"
                    );


                    if (message) {

                        if (
                            Array.isArray(
                                data.detail
                            )
                        ) {

                            message.textContent =
                                data.detail
                                    .map(
                                        error =>
                                            error.msg
                                    )
                                    .join(", ");

                        }

                        else {

                            message.textContent =
                                data.detail ||
                                "Gagal menyimpan financial profile.";

                        }

                        message.style.color =
                            "#dc2626";

                    }


                    if (saveButton) {

                        saveButton.disabled =
                            false;

                        saveButton.textContent =
                            "Simpan Financial Profile";

                    }


                    return;

                }


                /* ==========================
                   FINANCIAL BERHASIL
                ========================== */

                console.log(
                    "================================="
                );

                console.log(
                    "FINANCIAL PROFILE BERHASIL DISIMPAN"
                );

                console.log(
                    "================================="
                );


                /* ==========================
                   SIMPAN FINANCIAL ID
                ========================== */

                if (data.id) {

                    localStorage.setItem(
                        "last_financial_profile_id",
                        data.id
                    );

                    console.log(
                        "FINANCIAL PROFILE ID:",
                        data.id
                    );

                }


                /* ==========================
                   SIMPAN BUSINESS ID
                ========================== */

                localStorage.setItem(
                    "selected_business_id",
                    businessId
                );


                /* ==========================
                   MESSAGE ASSESSMENT
                ========================== */

                if (message) {

                    message.textContent =
                        "Financial profile tersimpan. Membuat Economic Passport...";

                    message.style.color =
                        "#2563eb";

                }


                if (saveButton) {

                    saveButton.textContent =
                        "Membuat Passport...";

                }


                /* =================================================
                   STEP 2
                   BUAT ECONOMIC PASSPORT
                ================================================= */

                console.log("");
                console.log(
                    "================================="
                );
                console.log(
                    "MEMBUAT ECONOMIC PASSPORT"
                );
                console.log(
                    "================================="
                );

                console.log(
                    "POST:",
                    `${API_URL}/passport/${businessId}/assess`
                );


                const passportResponse =
                    await fetch(
                        `${API_URL}/passport/${businessId}/assess`,
                        {

                            method: "POST",

                            headers: {

                                "Authorization":
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json"

                            }

                        }
                    );


                console.log(
                    "STATUS PASSPORT ASSESSMENT:",
                    passportResponse.status
                );

                console.log(
                    "PASSPORT RESPONSE OK:",
                    passportResponse.ok
                );


                let passportData = {};

                try {

                    passportData =
                        await passportResponse.json();

                }

                catch (jsonError) {

                    console.error(
                        "PASSPORT RESPONSE BUKAN JSON:",
                        jsonError
                    );

                }


                console.log(
                    "RESPONSE PASSPORT:",
                    passportData
                );


                /* ==========================
                   PASSPORT GAGAL
                ========================== */

                if (!passportResponse.ok) {

                    console.error(
                        "ECONOMIC PASSPORT GAGAL DIBUAT"
                    );

                    console.error(
                        "DETAIL:",
                        passportData
                    );


                    if (message) {

                        message.textContent =
                            passportData.detail ||
                            "Financial berhasil disimpan, tetapi Economic Passport gagal dibuat.";

                        message.style.color =
                            "#dc2626";

                    }


                    if (saveButton) {

                        saveButton.disabled =
                            false;

                        saveButton.textContent =
                            "Coba Buat Passport Lagi";

                    }


                    return;

                }


                /* ==========================
                   PASSPORT BERHASIL
                ========================== */

                console.log(
                    "================================="
                );

                console.log(
                    "ECONOMIC PASSPORT BERHASIL DIBUAT"
                );

                console.log(
                    "================================="
                );


                console.log(
                    "PASSPORT DATA:",
                    passportData
                );


                /* ==========================
                   SIMPAN PASSPORT ID
                ========================== */

                if (
                    passportData.id
                ) {

                    localStorage.setItem(
                        "last_passport_id",
                        passportData.id
                    );

                    console.log(
                        "PASSPORT ID:",
                        passportData.id
                    );

                }


                /*
                 * Beberapa response backend
                 * dapat menyimpan passport
                 * di dalam object passport.
                 */

                if (
                    passportData.passport &&
                    passportData.passport.id
                ) {

                    localStorage.setItem(
                        "last_passport_id",
                        passportData.passport.id
                    );

                    console.log(
                        "PASSPORT ID:",
                        passportData.passport.id
                    );

                }


                /* ==========================
                   SUCCESS MESSAGE
                ========================== */

                if (message) {

                    message.textContent =
                        "Economic Passport berhasil dibuat.";

                    message.style.color =
                        "#16a34a";

                }


                if (saveButton) {

                    saveButton.textContent =
                        "Passport Berhasil Dibuat";

                }


                /* ==========================
                   REDIRECT
                ========================== */

                setTimeout(
                    function () {

                        console.log(
                            "================================="
                        );

                        console.log(
                            "MEMBUKA ECONOMIC PASSPORT..."
                        );

                        console.log(
                            "BUSINESS ID:",
                            businessId
                        );

                        console.log(
                            "================================="
                        );


                        window.location.href =
                            `passport.html?business_id=${businessId}`;

                    },
                    1000
                );

            }


            /* ==========================
               ERROR SERVER / NETWORK
            ========================== */

            catch (error) {

                console.error(
                    "================================="
                );

                console.error(
                    "ERROR FINANCIAL / PASSPORT:"
                );

                console.error(
                    error
                );

                console.error(
                    "================================="
                );


                if (message) {

                    message.textContent =
                        "Terjadi kesalahan saat menyimpan data atau membuat Economic Passport.";

                    message.style.color =
                        "#dc2626";

                }


                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "Simpan Financial Profile";

                }

            }

        }
    );

}


/* ==============================
   FORM TIDAK DITEMUKAN
============================== */

else {

    console.error(
        "FORM #financialForm TIDAK DITEMUKAN"
    );

}